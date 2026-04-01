'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { writeFile, unlink, mkdir } from 'fs/promises'
import { join } from 'path'
import { prisma } from '@/lib/prisma'
// eslint-disable-next-line @typescript-eslint/no-require-imports
const pdfParse = require('pdf-parse')
// eslint-disable-next-line @typescript-eslint/no-require-imports
const mammoth = require('mammoth')
import { createSession, clearSession, getSession, hashPassword } from '@/lib/auth'
import {
  generateHypotheses, generatePostIdeas, analyzeResults,
  improveHypothesis, improvePostIdea, generateStrategyRecommendation,
  extractMetricsFromScreenshot, analyzeCompetitor,
} from '@/lib/openai'

// ─── Auth ─────────────────────────────────────────────────────────────────────

export async function loginAction(formData: FormData) {
  const email = formData.get('email') as string
  const password = formData.get('password') as string
  if (!email || !email.includes('@')) throw new Error('Неверный email')
  const user = await prisma.user.findUnique({ where: { email } })
  if (!user) throw new Error('Пользователь не найден. Зарегистрируйся.')
  if (user.passwordHash) {
    const hash = hashPassword(password)
    if (hash !== user.passwordHash) throw new Error('Неверный пароль')
  }
  await createSession(email)
  redirect('/dashboard')
}

export async function signupAction(formData: FormData) {
  const email = formData.get('email') as string
  const password = formData.get('password') as string
  const confirm = formData.get('confirm') as string
  const name = (formData.get('name') as string | null)?.trim() || null
  const skipRedirect = formData.get('skipRedirect') === 'true'
  if (!email || !email.includes('@')) throw new Error('Неверный формат email')
  if (!password || password.length < 8) throw new Error('Пароль минимум 8 символов')
  if (password !== confirm) throw new Error('Пароли не совпадают')
  const existing = await prisma.user.findUnique({ where: { email } })
  if (existing) throw new Error('Этот email уже зарегистрирован')
  await prisma.user.create({ data: { email, passwordHash: hashPassword(password), name } })
  await createSession(email)
  if (!skipRedirect) redirect('/dashboard')
}

export async function logoutAction() {
  await clearSession()
  redirect('/')
}

// ─── Settings ─────────────────────────────────────────────────────────────────

export async function updateProfileAction(formData: FormData) {
  const user = await getSession()
  if (!user) throw new Error('Не авторизован')
  const name = (formData.get('name') as string).trim()
  await prisma.user.update({ where: { id: user.id }, data: { name: name || null } })
  revalidatePath('/settings')
}

export async function uploadAvatarAction(formData: FormData) {
  const user = await getSession()
  if (!user) throw new Error('Не авторизован')
  const file = formData.get('avatar') as File | null
  if (!file || file.size === 0) throw new Error('Файл не выбран')
  if (file.size > 5 * 1024 * 1024) throw new Error('Максимальный размер — 5 МБ')
  const ext = file.name.split('.').pop()?.toLowerCase() ?? 'jpg'
  if (!['jpg', 'jpeg', 'png', 'webp', 'gif'].includes(ext)) throw new Error('Недопустимый формат')
  const filename = `${user.id}.${ext}`
  const bytes = await file.arrayBuffer()
  await writeFile(join(process.cwd(), 'public', 'uploads', 'avatars', filename), Buffer.from(bytes))
  const avatarUrl = `/uploads/avatars/${filename}`
  await prisma.user.update({ where: { id: user.id }, data: { avatarUrl } })
  revalidatePath('/settings')
  return avatarUrl
}

export async function changePasswordAction(formData: FormData) {
  const user = await getSession()
  if (!user) throw new Error('Не авторизован')
  const current = formData.get('current') as string
  const next = formData.get('next') as string
  const confirm = formData.get('confirm') as string
  if (next.length < 8) throw new Error('Минимум 8 символов')
  if (next !== confirm) throw new Error('Пароли не совпадают')
  if (user.passwordHash) {
    if (hashPassword(current) !== user.passwordHash) throw new Error('Неверный текущий пароль')
  }
  await prisma.user.update({ where: { id: user.id }, data: { passwordHash: hashPassword(next) } })
}

export async function deleteProjectAction(projectId: string) {
  const user = await getSession()
  if (!user) throw new Error('Не авторизован')
  await prisma.project.delete({ where: { id: projectId, userId: user.id } })
  revalidatePath('/dashboard')
}

export async function deleteAccountAction() {
  const user = await getSession()
  if (!user) throw new Error('Не авторизован')
  await prisma.user.delete({ where: { id: user.id } })
  await clearSession()
  redirect('/')
}

// ─── Onboarding ───────────────────────────────────────────────────────────────

export async function createOnboardingProjectAction(formData: FormData) {
  const user = await getSession()
  if (!user) redirect('/')

  const name = formData.get('name') as string
  const businessType = formData.get('businessType') as string
  const tone = (formData.get('tone') as string) || ''
  const narrativeStyle = (formData.get('narrativeStyle') as string) || ''
  const goal = (formData.get('goal') as string) || ''

  if (!name || !businessType) throw new Error('Заполни все поля')

  const project = await prisma.project.create({
    data: { name, businessType, tone, narrativeStyle, goal, userId: user.id },
  })

  await prisma.user.update({
    where: { id: user.id },
    data: { completedOnboarding: true },
  })

  if (tone || narrativeStyle || goal) {
    try {
      const strategy = await generateStrategyRecommendation(businessType, tone, narrativeStyle, goal)
      await prisma.project.update({
        where: { id: project.id },
        data: { strategyRecommendation: JSON.stringify(strategy) },
      })
    } catch {
      // Strategy generation is optional
    }
  }

  redirect(`/project/${project.id}`)
}

// ─── Projects ─────────────────────────────────────────────────────────────────

export async function createProjectAction(formData: FormData) {
  const user = await getSession()
  if (!user) redirect('/')
  const name = formData.get('name') as string
  const businessType = formData.get('businessType') as string
  if (!name || !businessType) throw new Error('Заполни все поля')
  const project = await prisma.project.create({
    data: { name, businessType, userId: user.id },
  })
  redirect(`/project/${project.id}`)
}

export async function saveStrategyAction(formData: FormData) {
  const user = await getSession()
  if (!user) redirect('/')
  const projectId = formData.get('projectId') as string
  const audience = (formData.get('audience') as string) || ''
  const vibe = (formData.get('vibe') as string) || ''
  const goal = (formData.get('goal') as string) || ''
  const project = await prisma.project.findUnique({ where: { id: projectId } })
  if (!project) throw new Error('Проект не найден')
  const strategy = await generateStrategyRecommendation(project.businessType, audience, vibe, goal)
  await prisma.project.update({
    where: { id: projectId },
    data: { tone: audience, narrativeStyle: vibe, goal, strategyRecommendation: JSON.stringify(strategy) },
  })
  redirect(`/project/${projectId}`)
}

// ─── Channels ─────────────────────────────────────────────────────────────────

export async function createChannelAction(formData: FormData) {
  const user = await getSession()
  if (!user) throw new Error('Не авторизован')
  const projectId = formData.get('projectId') as string
  const name = formData.get('name') as string
  if (!name) throw new Error('Укажи название канала')
  const project = await prisma.project.findUnique({ where: { id: projectId, userId: user.id } })
  if (!project) throw new Error('Проект не найден')
  const channel = await prisma.channel.create({ data: { name, projectId } })
  revalidatePath(`/project/${projectId}`)
  return { channelId: channel.id }
}

// ─── Rubrics (formerly Hypotheses) ────────────────────────────────────────────

export async function createRubricAction(formData: FormData) {
  const user = await getSession()
  if (!user) throw new Error('Не авторизован')
  const channelId = formData.get('channelId') as string
  const title = formData.get('title') as string
  const description = (formData.get('description') as string) || ''
  await prisma.rubric.create({ data: { title, description, channelId } })
  revalidatePath('/project/[id]/channel/[channelId]', 'page')
  return { success: true }
}

export async function updateRubricAction(rubricId: string, title: string, description: string) {
  const user = await getSession()
  if (!user) throw new Error('Не авторизован')
  await prisma.rubric.update({ where: { id: rubricId }, data: { title, description } })
  revalidatePath('/project/[id]/channel/[channelId]', 'page')
}

export async function deleteRubricAction(rubricId: string) {
  const user = await getSession()
  if (!user) throw new Error('Не авторизован')
  const rubric = await prisma.rubric.findUnique({
    where: { id: rubricId },
    include: { channel: { include: { project: true } } },
  })
  if (!rubric || rubric.channel.project.userId !== user.id) throw new Error('Рубрика не найдена')
  await prisma.rubric.delete({ where: { id: rubricId } })
  revalidatePath('/project/[id]/channel/[channelId]', 'page')
}

// Legacy alias (kept for old onboarding/board code)
export async function createHypothesisAction(formData: FormData) {
  const user = await getSession()
  if (!user) throw new Error('Не авторизован')
  const channelId = formData.get('platformId') as string
  const title = formData.get('title') as string
  const description = formData.get('description') as string
  await prisma.rubric.create({ data: { title, description, channelId } })
  revalidatePath('/project/[id]')
}

export async function generateHypothesesAction(channelId: string, businessType: string) {
  const user = await getSession()
  if (!user) throw new Error('Не авторизован')
  const channel = await prisma.channel.findUnique({
    where: { id: channelId },
    include: { project: true },
  })
  const project = channel?.project
  return generateHypotheses(
    businessType,
    project?.tone ?? undefined,
    project?.narrativeStyle ?? undefined,
    project?.goal ?? undefined,
    project?.strategyRecommendation ?? undefined,
  )
}

export async function saveHypothesesAction(channelId: string, selected: { title: string; description: string }[]) {
  const user = await getSession()
  if (!user) throw new Error('Не авторизован')
  await Promise.all(selected.map((h) => prisma.rubric.create({ data: { ...h, channelId } })))
  revalidatePath('/project/[id]')
}

export async function addHypothesisFromAI(channelId: string, title: string, description: string) {
  const user = await getSession()
  if (!user) throw new Error('Не авторизован')
  await prisma.rubric.create({ data: { title, description, channelId } })
  revalidatePath('/project/[id]')
}

export async function improveHypothesisAction(rubricId: string) {
  const user = await getSession()
  if (!user) throw new Error('Не авторизован')
  const rubric = await prisma.rubric.findUnique({
    where: { id: rubricId },
    include: { channel: { include: { project: true } } },
  })
  if (!rubric) throw new Error('Рубрика не найдена')
  return improveHypothesis(rubric.title, rubric.description, rubric.channel.project.businessType)
}

export async function applyImprovedHypothesis(rubricId: string, title: string, description: string) {
  const user = await getSession()
  if (!user) throw new Error('Не авторизован')
  await prisma.rubric.update({ where: { id: rubricId }, data: { title, description } })
  revalidatePath('/project/[id]')
}

// ─── Posts (formerly Post Ideas) ──────────────────────────────────────────────

export async function generatePostIdeasAction(rubricId: string) {
  const user = await getSession()
  if (!user) throw new Error('Не авторизован')
  const rubric = await prisma.rubric.findUnique({
    where: { id: rubricId },
    include: { channel: { include: { project: true } } },
  })
  if (!rubric) throw new Error('Рубрика не найдена')
  await prisma.post.deleteMany({ where: { rubricId, isUserCreated: false } })
  const project = rubric.channel.project
  const ideas = await generatePostIdeas(
    rubric.title, rubric.description, project.businessType,
    project.tone ?? undefined, project.narrativeStyle ?? undefined, project.goal ?? undefined,
  )
  await Promise.all(ideas.map((idea) => prisma.post.create({
    data: {
      title: idea.title, script: idea.script, caption: idea.caption, hashtags: idea.hashtags,
      rubricId,
      recommendedPublishDate: idea.recommendedPublishDate ? new Date(idea.recommendedPublishDate) : null,
    }
  })))
  revalidatePath(`/rubric/${rubricId}`)
}

export async function createPostAction(data: {
  rubricId: string
  title: string
  postText?: string
  caption?: string
  hashtags?: string
  scheduledDate?: string
  status?: string
}) {
  const user = await getSession()
  if (!user) throw new Error('Не авторизован')
  const derivedStatus = data.status ?? (data.scheduledDate ? 'SCHEDULED' : 'DRAFT')
  const post = await prisma.post.create({
    data: {
      title: data.title,
      script: data.postText || '',
      caption: data.caption || '',
      hashtags: data.hashtags || '',
      postText: data.postText || '',
      rubricId: data.rubricId,
      isUserCreated: true,
      status: derivedStatus,
      posted: derivedStatus === 'PUBLISHED',
      scheduledPublishDate: data.scheduledDate ? new Date(data.scheduledDate) : null,
    },
  })
  revalidatePath('/project/[id]/channel/[channelId]', 'page')
  return post
}

// Legacy alias
export async function createPostIdeaAction(formData: FormData) {
  const user = await getSession()
  if (!user) throw new Error('Не авторизован')
  const rubricId = formData.get('hypothesisId') as string
  const title = formData.get('title') as string
  const script = formData.get('script') as string
  const caption = (formData.get('caption') as string) || ''
  const hashtags = (formData.get('hashtags') as string) || ''
  const post = await prisma.post.create({
    data: { title, script, caption, hashtags, rubricId, isUserCreated: true },
  })
  revalidatePath(`/rubric/${rubricId}`)
  return post
}

export async function updatePostAction(postId: string, data: {
  title?: string
  postText?: string
  caption?: string
  hashtags?: string
  scheduledDate?: string | null
  status?: string
}) {
  const user = await getSession()
  if (!user) throw new Error('Не авторизован')
  const updateData: Record<string, unknown> = {}
  if (data.title !== undefined) updateData.title = data.title
  if (data.postText !== undefined) { updateData.postText = data.postText; updateData.script = data.postText }
  if (data.caption !== undefined) updateData.caption = data.caption
  if (data.hashtags !== undefined) updateData.hashtags = data.hashtags
  if (data.status !== undefined) {
    updateData.status = data.status
    updateData.posted = data.status === 'PUBLISHED'
  }
  if (data.scheduledDate !== undefined) {
    updateData.scheduledPublishDate = data.scheduledDate ? new Date(data.scheduledDate) : null
    if (data.scheduledDate && !data.status) updateData.status = 'SCHEDULED'
  }
  await prisma.post.update({ where: { id: postId }, data: updateData })
  revalidatePath('/project/[id]/channel/[channelId]', 'page')
  revalidatePath('/calendar')
}

export async function improvePostIdeaAction(postId: string) {
  const user = await getSession()
  if (!user) throw new Error('Не авторизован')
  const post = await prisma.post.findUnique({
    where: { id: postId },
    include: { rubric: { include: { channel: { include: { project: true } } } } },
  })
  if (!post) throw new Error('Пост не найден')
  const project = post.rubric.channel.project
  return improvePostIdea(
    post.title, post.script, post.caption, post.hashtags,
    post.rubric.title, project.businessType,
    project.tone ?? undefined, project.narrativeStyle ?? undefined, project.goal ?? undefined,
  )
}

export async function applyImprovedPostIdea(postId: string, title: string, script: string, caption: string, hashtags: string) {
  const user = await getSession()
  if (!user) throw new Error('Не авторизован')
  await prisma.post.update({ where: { id: postId }, data: { title, script, caption, hashtags, postText: script } })
  revalidatePath('/project/[id]/channel/[channelId]', 'page')
}

export async function updateScheduledDateAction(postId: string, date: string) {
  const user = await getSession()
  if (!user) throw new Error('Не авторизован')
  await prisma.post.update({
    where: { id: postId },
    data: {
      scheduledPublishDate: date ? new Date(date) : null,
      status: date ? 'SCHEDULED' : 'DRAFT',
    },
  })
  revalidatePath('/project/[id]/channel/[channelId]', 'page')
  revalidatePath('/calendar')
}

export async function markAsPostedAction(postId: string) {
  const user = await getSession()
  if (!user) throw new Error('Не авторизован')
  await prisma.post.update({ where: { id: postId }, data: { posted: true, status: 'PUBLISHED' } })
  revalidatePath('/project/[id]/channel/[channelId]', 'page')
}

export async function saveResultAction(formData: FormData) {
  const user = await getSession()
  if (!user) throw new Error('Не авторизован')
  const postId = (formData.get('postIdeaId') ?? formData.get('postId')) as string
  const views = parseInt(formData.get('views') as string) || 0
  const likes = parseInt(formData.get('likes') as string) || 0
  const comments = parseInt(formData.get('comments') as string) || 0
  const saves = parseInt(formData.get('saves') as string) || 0
  await prisma.postResult.upsert({
    where: { postId },
    update: { views, likes, comments, saves },
    create: { postId, views, likes, comments, saves },
  })
  await prisma.post.update({ where: { id: postId }, data: { posted: true, status: 'PUBLISHED' } })
  revalidatePath('/project/[id]/channel/[channelId]', 'page')
}

export async function extractMetricsAction(postId: string, base64Image: string) {
  const user = await getSession()
  if (!user) throw new Error('Не авторизован')
  return extractMetricsFromScreenshot(base64Image)
}

// ─── Competitor Analysis ──────────────────────────────────────────────────────

export async function addCompetitorAction(formData: FormData) {
  const user = await getSession()
  if (!user) throw new Error('Не авторизован')
  const handle = (formData.get('handle') as string).replace(/^@/, '').replace(/.*instagram\.com\//, '').replace(/\/$/, '').trim()
  const projectId = formData.get('projectId') as string
  if (!handle) throw new Error('Укажи хендл конкурента')
  const project = await prisma.project.findUnique({ where: { id: projectId, userId: user.id } })
  if (!project) throw new Error('Проект не найден')
  await prisma.competitor.create({ data: { handle, projectId } })
  revalidatePath(`/project/${projectId}`)
}

export async function updateCompetitorDataAction(formData: FormData) {
  const user = await getSession()
  if (!user) throw new Error('Не авторизован')
  const competitorId = formData.get('competitorId') as string
  const toNum = (key: string) => { const v = formData.get(key) as string; return v ? parseInt(v) : null }
  const toFloat = (key: string) => { const v = formData.get(key) as string; return v ? parseFloat(v) : null }
  await prisma.competitor.update({
    where: { id: competitorId, project: { userId: user.id } },
    data: {
      followers: toNum('followers'),
      avgLikes: toNum('avgLikes'),
      avgComments: toNum('avgComments'),
      postsPerWeek: toFloat('postsPerWeek'),
      contentTypes: (formData.get('contentTypes') as string | null) || null,
      mainTopics: (formData.get('mainTopics') as string | null) || null,
      notes: (formData.get('notes') as string | null) || null,
    },
  })
  const competitor = await prisma.competitor.findUnique({ where: { id: competitorId } })
  revalidatePath(`/project/${competitor?.projectId}`)
}

export async function deleteCompetitorAction(competitorId: string, projectId: string) {
  const user = await getSession()
  if (!user) throw new Error('Не авторизован')
  await prisma.competitor.delete({ where: { id: competitorId, project: { userId: user.id } } })
  revalidatePath(`/project/${projectId}`)
}

export async function analyzeCompetitorAction(competitorId: string) {
  const user = await getSession()
  if (!user) throw new Error('Не авторизован')
  const competitor = await prisma.competitor.findUnique({
    where: { id: competitorId, project: { userId: user.id } },
    include: { project: true },
  })
  if (!competitor) throw new Error('Конкурент не найден')
  await prisma.competitor.update({ where: { id: competitorId }, data: { status: 'analyzing' } })
  try {
    const result = await analyzeCompetitor({
      handle: competitor.handle,
      businessType: competitor.project.businessType,
      followers: competitor.followers,
      avgLikes: competitor.avgLikes,
      avgComments: competitor.avgComments,
      postsPerWeek: competitor.postsPerWeek,
      contentTypes: competitor.contentTypes,
      mainTopics: competitor.mainTopics,
      notes: competitor.notes,
    })
    await prisma.competitorReport.create({
      data: { competitorId, report: JSON.stringify(result) },
    })
    await prisma.competitor.update({
      where: { id: competitorId },
      data: { status: 'done', lastAnalyzedAt: new Date() },
    })
  } catch {
    await prisma.competitor.update({ where: { id: competitorId }, data: { status: 'error' } })
    throw new Error('Ошибка анализа')
  }
  revalidatePath(`/project/${competitor.projectId}`)
}

// ─── Post Media ───────────────────────────────────────────────────────────────

export async function uploadPostMediaAction(formData: FormData) {
  const user = await getSession()
  if (!user) throw new Error('Не авторизован')
  const postId = (formData.get('postIdeaId') ?? formData.get('postId')) as string
  if (!postId) throw new Error('postId обязателен')
  const file = formData.get('file') as File | null
  if (!file || file.size === 0) throw new Error('Файл не выбран')
  if (file.size > 10 * 1024 * 1024) throw new Error('Максимальный размер — 10 МБ')
  const ext = file.name.split('.').pop()?.toLowerCase() ?? 'bin'
  const filename = `${postId}_${Date.now()}.${ext}`
  const dir = join(process.cwd(), 'public', 'uploads', 'posts')
  await mkdir(dir, { recursive: true })
  const bytes = await file.arrayBuffer()
  await writeFile(join(dir, filename), Buffer.from(bytes))
  const url = `/uploads/posts/${filename}`
  const media = await prisma.postMedia.create({
    data: { postId, url, filename: file.name, mimeType: file.type || 'application/octet-stream', size: file.size },
  })
  revalidatePath('/calendar')
  return { ...media, createdAt: media.createdAt.toISOString() }
}

export async function deletePostMediaAction(mediaId: string) {
  const user = await getSession()
  if (!user) throw new Error('Не авторизован')
  const media = await prisma.postMedia.findUnique({ where: { id: mediaId } })
  if (!media) throw new Error('Файл не найден')
  try {
    await unlink(join(process.cwd(), 'public', media.url))
  } catch {
    // File may not exist on disk (e.g. Vercel ephemeral FS)
  }
  await prisma.postMedia.delete({ where: { id: mediaId } })
  revalidatePath('/calendar')
}

// ─── Analysis ────────────────────────────────────────────────────────────────

export async function analyzeHypothesisAction(rubricId: string) {
  const user = await getSession()
  if (!user) throw new Error('Не авторизован')
  const rubric = await prisma.rubric.findUnique({
    where: { id: rubricId },
    include: { posts: { include: { result: true } } },
  })
  if (!rubric) throw new Error('Рубрика не найдена')
  const postsWithResults = rubric.posts.filter((p) => p.result)
  if (postsWithResults.length === 0) throw new Error('Нет данных для анализа')
  return analyzeResults(
    rubric.title,
    postsWithResults.map((p) => ({
      postTitle: p.title,
      views: p.result!.views, likes: p.result!.likes,
      comments: p.result!.comments, saves: p.result!.saves,
    }))
  )
}

export async function analyzeRubricAction(rubricId: string) {
  return analyzeHypothesisAction(rubricId)
}

// ─── Strategy File Parsing ────────────────────────────────────────────────────

export async function parseStrategyFileAction(formData: FormData): Promise<{ text: string }> {
  const user = await getSession()
  if (!user) throw new Error('Не авторизован')

  const file = formData.get('file') as File | null
  if (!file || file.size === 0) throw new Error('Файл не выбран')
  if (file.size > 10 * 1024 * 1024) throw new Error('Максимальный размер — 10 МБ')

  const ext = file.name.split('.').pop()?.toLowerCase() ?? ''
  const bytes = await file.arrayBuffer()
  const buffer = Buffer.from(bytes)

  let text = ''

  if (ext === 'txt') {
    text = buffer.toString('utf-8')
  } else if (ext === 'pdf') {
    const result = await pdfParse(buffer)
    text = result.text ?? ''
  } else if (ext === 'docx' || ext === 'doc') {
    const result = await mammoth.extractRawText({ buffer })
    text = result.value ?? ''
  } else {
    throw new Error('Поддерживаются форматы: .txt, .pdf, .doc, .docx')
  }

  return { text: text.trim() }
}
