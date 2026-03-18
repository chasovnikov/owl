'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { writeFile } from 'fs/promises'
import { join } from 'path'
import { prisma } from '@/lib/prisma'
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

  // Generate AI strategy if strategy fields provided
  let strategyRecommendation: string | undefined
  if (tone || narrativeStyle || goal) {
    try {
      const strategy = await generateStrategyRecommendation(businessType, tone, narrativeStyle, goal)
      strategyRecommendation = JSON.stringify(strategy)
    } catch {
      // Strategy generation is optional — don't block onboarding
    }
  }

  const project = await prisma.project.create({
    data: {
      name,
      businessType,
      tone,
      narrativeStyle,
      goal,
      strategyRecommendation,
      userId: user.id,
      platforms: { create: { name: 'Instagram' } },
    },
  })

  await prisma.user.update({
    where: { id: user.id },
    data: { completedOnboarding: true },
  })

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
    data: { name, businessType, userId: user.id, platforms: { create: { name: 'Instagram' } } },
  })
  redirect(`/project/${project.id}/strategy`)
}

export async function saveStrategyAction(formData: FormData) {
  const user = await getSession()
  if (!user) redirect('/')
  const projectId = formData.get('projectId') as string
  const tone = formData.get('tone') as string
  const narrativeStyle = formData.get('narrativeStyle') as string
  const goal = formData.get('goal') as string
  const project = await prisma.project.findUnique({ where: { id: projectId } })
  if (!project) throw new Error('Проект не найден')
  const strategy = await generateStrategyRecommendation(project.businessType, tone, narrativeStyle, goal)
  await prisma.project.update({
    where: { id: projectId },
    data: { tone, narrativeStyle, goal, strategyRecommendation: JSON.stringify(strategy) },
  })
  redirect(`/project/${projectId}`)
}

// ─── Hypotheses ───────────────────────────────────────────────────────────────

export async function createHypothesisAction(formData: FormData) {
  const user = await getSession()
  if (!user) throw new Error('Не авторизован')
  const platformId = formData.get('platformId') as string
  const title = formData.get('title') as string
  const description = formData.get('description') as string
  await prisma.hypothesis.create({ data: { title, description, platformId } })
  revalidatePath('/project/[id]')
}

export async function generateHypothesesAction(platformId: string, businessType: string) {
  const user = await getSession()
  if (!user) throw new Error('Не авторизован')
  const platform = await prisma.platform.findUnique({
    where: { id: platformId },
    include: { project: true },
  })
  const project = platform?.project
  return generateHypotheses(
    businessType,
    project?.tone ?? undefined,
    project?.narrativeStyle ?? undefined,
    project?.goal ?? undefined,
    project?.strategyRecommendation ?? undefined,
  )
}

export async function saveHypothesesAction(platformId: string, selected: { title: string; description: string }[]) {
  const user = await getSession()
  if (!user) throw new Error('Не авторизован')
  await Promise.all(selected.map((h) => prisma.hypothesis.create({ data: { ...h, platformId } })))
  revalidatePath('/project/[id]')
}

export async function addHypothesisFromAI(platformId: string, title: string, description: string) {
  const user = await getSession()
  if (!user) throw new Error('Не авторизован')
  await prisma.hypothesis.create({ data: { title, description, platformId } })
  revalidatePath('/project/[id]')
}

export async function improveHypothesisAction(hypothesisId: string) {
  const user = await getSession()
  if (!user) throw new Error('Не авторизован')
  const hypothesis = await prisma.hypothesis.findUnique({
    where: { id: hypothesisId },
    include: { platform: { include: { project: true } } },
  })
  if (!hypothesis) throw new Error('Гипотеза не найдена')
  return improveHypothesis(hypothesis.title, hypothesis.description, hypothesis.platform.project.businessType)
}

export async function applyImprovedHypothesis(hypothesisId: string, title: string, description: string) {
  const user = await getSession()
  if (!user) throw new Error('Не авторизован')
  await prisma.hypothesis.update({ where: { id: hypothesisId }, data: { title, description } })
  revalidatePath('/project/[id]')
}

// ─── Post Ideas ───────────────────────────────────────────────────────────────

export async function generatePostIdeasAction(hypothesisId: string) {
  const user = await getSession()
  if (!user) throw new Error('Не авторизован')
  const hypothesis = await prisma.hypothesis.findUnique({
    where: { id: hypothesisId },
    include: { platform: { include: { project: true } } },
  })
  if (!hypothesis) throw new Error('Гипотеза не найдена')
  await prisma.postIdea.deleteMany({ where: { hypothesisId, isUserCreated: false } })
  const project = hypothesis.platform.project
  const ideas = await generatePostIdeas(
    hypothesis.title, hypothesis.description, project.businessType,
    project.tone ?? undefined, project.narrativeStyle ?? undefined, project.goal ?? undefined,
  )
  await Promise.all(ideas.map((idea) => prisma.postIdea.create({
    data: {
      title: idea.title, script: idea.script, caption: idea.caption, hashtags: idea.hashtags,
      hypothesisId,
      recommendedPublishDate: idea.recommendedPublishDate ? new Date(idea.recommendedPublishDate) : null,
    }
  })))
  revalidatePath(`/hypothesis/${hypothesisId}`)
}

export async function createPostIdeaAction(formData: FormData) {
  const user = await getSession()
  if (!user) throw new Error('Не авторизован')
  const hypothesisId = formData.get('hypothesisId') as string
  const title = formData.get('title') as string
  const script = formData.get('script') as string
  const caption = (formData.get('caption') as string) || ''
  const hashtags = (formData.get('hashtags') as string) || ''
  const post = await prisma.postIdea.create({
    data: { title, script, caption, hashtags, hypothesisId, isUserCreated: true },
  })
  revalidatePath(`/hypothesis/${hypothesisId}`)
  return post
}

export async function improvePostIdeaAction(postIdeaId: string) {
  const user = await getSession()
  if (!user) throw new Error('Не авторизован')
  const post = await prisma.postIdea.findUnique({
    where: { id: postIdeaId },
    include: { hypothesis: { include: { platform: { include: { project: true } } } } },
  })
  if (!post) throw new Error('Пост не найден')
  const project = post.hypothesis.platform.project
  return improvePostIdea(
    post.title, post.script, post.caption, post.hashtags,
    post.hypothesis.title, project.businessType,
    project.tone ?? undefined, project.narrativeStyle ?? undefined, project.goal ?? undefined,
  )
}

export async function applyImprovedPostIdea(postIdeaId: string, title: string, script: string, caption: string, hashtags: string) {
  const user = await getSession()
  if (!user) throw new Error('Не авторизован')
  await prisma.postIdea.update({ where: { id: postIdeaId }, data: { title, script, caption, hashtags } })
  revalidatePath(`/hypothesis/[id]`)
}

export async function updateScheduledDateAction(postIdeaId: string, date: string) {
  const user = await getSession()
  if (!user) throw new Error('Не авторизован')
  await prisma.postIdea.update({
    where: { id: postIdeaId },
    data: { scheduledPublishDate: date ? new Date(date) : null },
  })
  revalidatePath(`/hypothesis/[id]`)
}

export async function markAsPostedAction(postIdeaId: string) {
  const user = await getSession()
  if (!user) throw new Error('Не авторизован')
  await prisma.postIdea.update({ where: { id: postIdeaId }, data: { posted: true } })
  revalidatePath(`/hypothesis/[id]`)
}

export async function saveResultAction(formData: FormData) {
  const user = await getSession()
  if (!user) throw new Error('Не авторизован')
  const postIdeaId = formData.get('postIdeaId') as string
  const views = parseInt(formData.get('views') as string) || 0
  const likes = parseInt(formData.get('likes') as string) || 0
  const comments = parseInt(formData.get('comments') as string) || 0
  const saves = parseInt(formData.get('saves') as string) || 0
  await prisma.postResult.upsert({
    where: { postIdeaId },
    update: { views, likes, comments, saves },
    create: { postIdeaId, views, likes, comments, saves },
  })
  revalidatePath(`/hypothesis/[id]`)
}

export async function extractMetricsAction(postIdeaId: string, base64Image: string) {
  const user = await getSession()
  if (!user) throw new Error('Не авторизован')
  return extractMetricsFromScreenshot(base64Image)
}

// ─── Competitor Analysis ─────────────────────────────────────────────────────

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

export async function analyzeHypothesisAction(hypothesisId: string) {
  const user = await getSession()
  if (!user) throw new Error('Не авторизован')
  const hypothesis = await prisma.hypothesis.findUnique({
    where: { id: hypothesisId },
    include: { postIdeas: { include: { result: true } } },
  })
  if (!hypothesis) throw new Error('Гипотеза не найдена')
  const postsWithResults = hypothesis.postIdeas.filter((p) => p.result)
  if (postsWithResults.length === 0) throw new Error('Нет данных для анализа')
  return analyzeResults(
    hypothesis.title,
    postsWithResults.map((p) => ({
      postTitle: p.title,
      views: p.result!.views, likes: p.result!.likes,
      comments: p.result!.comments, saves: p.result!.saves,
    }))
  )
}
