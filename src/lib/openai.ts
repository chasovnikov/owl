import OpenAI from 'openai'

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

export interface HypothesisResult {
  title: string
  description: string
}

export interface PostIdeaResult {
  title: string
  script: string
  caption: string
  hashtags: string
  recommendedPublishDate?: string
}

export interface AnalysisResult {
  summary: string
  engagementComparison: string
  recommendation: string
}

export interface ImprovedHypothesis {
  improvedTitle: string
  improvedDescription: string
  variations: { title: string; description: string }[]
}

export interface ImprovedPostIdea {
  improvedTitle: string
  improvedScript: string
  improvedCaption: string
  improvedHashtags: string
}

export interface StrategyRecommendation {
  strategySummary: string
  contentDirections: string[]
  exampleThemes: string[]
}

export interface ExtractedMetrics {
  views: number
  likes: number
  comments: number
  saves: number
  confidence: 'high' | 'low'
}

function extractArray(parsed: any): any[] {
  if (Array.isArray(parsed)) return parsed
  for (const val of Object.values(parsed)) {
    if (Array.isArray(val) && (val as any[]).length > 0) return val as any[]
  }
  return []
}

export async function generateHypotheses(
  businessType: string,
  tone?: string,
  narrativeStyle?: string,
  goal?: string,
  strategyRecommendation?: string
): Promise<HypothesisResult[]> {
  const context = [
    tone && `Тон: ${tone}`,
    narrativeStyle && `Стиль: ${narrativeStyle}`,
    goal && `Цель: ${goal}`,
    strategyRecommendation && `Стратегия: ${strategyRecommendation}`,
  ].filter(Boolean).join('\n')

  const prompt = `Ты эксперт по Instagram-маркетингу. Сгенерируй 10 гипотез контента для бизнеса типа "${businessType}".
${context}
Каждая гипотеза — тестируемая идея контента. Отвечай только на русском.
Верни ТОЛЬКО JSON: {"hypotheses": [{"title": "Короткий заголовок", "description": "Одно предложение"}]}`

  const response = await openai.chat.completions.create({
    model: 'gpt-4o',
    messages: [{ role: 'user', content: prompt }],
    temperature: 0.8,
    response_format: { type: 'json_object' },
  })
  const parsed = JSON.parse(response.choices[0].message.content || '{}')
  return extractArray(parsed) as HypothesisResult[]
}

export async function improveHypothesis(
  title: string,
  description: string,
  businessType: string
): Promise<ImprovedHypothesis> {
  const prompt = `Улучши гипотезу контента для Instagram для бизнеса "${businessType}".
Заголовок: ${title}
Описание: ${description}
Сделай более конкретной и измеримой. Отвечай на русском.
Верни ТОЛЬКО JSON: {"improvedTitle": "...", "improvedDescription": "...", "variations": [{"title": "...", "description": "..."}, {"title": "...", "description": "..."}]}`

  const response = await openai.chat.completions.create({
    model: 'gpt-4o',
    messages: [{ role: 'user', content: prompt }],
    temperature: 0.7,
    response_format: { type: 'json_object' },
  })
  return JSON.parse(response.choices[0].message.content || '{}') as ImprovedHypothesis
}

export async function generateStrategyRecommendation(
  businessType: string,
  audience: string,
  vibe: string,
  goal: string
): Promise<StrategyRecommendation> {
  const parts = [
    `Тип проекта: ${businessType}`,
    audience && `Аудитория и польза: ${audience}`,
    vibe && `Вайб и стиль: ${vibe}`,
    goal && `Цель: ${goal}`,
  ].filter(Boolean).join('\n')

  const prompt = `Создай конкретную контент-стратегию на основе данных о проекте.

${parts}

Отвечай на русском. Будь конкретным и практичным — без воды.
Верни ТОЛЬКО JSON: {"strategySummary": "...", "contentDirections": ["...", "...", "..."], "exampleThemes": ["...", "...", "..."]}`

  const response = await openai.chat.completions.create({
    model: 'gpt-4o',
    messages: [{ role: 'user', content: prompt }],
    temperature: 0.7,
    response_format: { type: 'json_object' },
  })
  return JSON.parse(response.choices[0].message.content || '{}') as StrategyRecommendation
}

export async function generatePostIdeas(
  hypothesisTitle: string,
  hypothesisDescription: string,
  businessType: string,
  tone?: string,
  narrativeStyle?: string,
  goal?: string
): Promise<PostIdeaResult[]> {
  const today = new Date().toLocaleDateString('ru-RU')
  const context = [
    tone && `Тон: ${tone}`,
    narrativeStyle && `Стиль: ${narrativeStyle}`,
    goal && `Цель: ${goal}`,
  ].filter(Boolean).join(', ')

  const prompt = `Ты стратег по контенту для Instagram. Сгенерируй 5 идей постов для гипотезы.
Гипотеза: "${hypothesisTitle}" — ${hypothesisDescription}
Бизнес: ${businessType}. ${context}
Сегодня: ${today}

Для каждого поста предложи лучшее время публикации в формате YYYY-MM-DD.
Отвечай только на русском.

Верни ТОЛЬКО JSON: {"posts": [{"title": "...", "script": "...", "caption": "...", "hashtags": "#тег1 #тег2", "recommendedPublishDate": "YYYY-MM-DD"}]}`

  const response = await openai.chat.completions.create({
    model: 'gpt-4o',
    messages: [{ role: 'user', content: prompt }],
    temperature: 0.7,
    response_format: { type: 'json_object' },
  })
  const parsed = JSON.parse(response.choices[0].message.content || '{}')
  return extractArray(parsed) as PostIdeaResult[]
}

export async function improvePostIdea(
  title: string,
  script: string,
  caption: string,
  hashtags: string,
  hypothesisTitle: string,
  businessType: string,
  tone?: string,
  narrativeStyle?: string,
  goal?: string
): Promise<ImprovedPostIdea> {
  const context = [
    tone && `Тон: ${tone}`,
    narrativeStyle && `Стиль: ${narrativeStyle}`,
    goal && `Цель: ${goal}`,
  ].filter(Boolean).join(', ')

  const prompt = `Улучши идею поста для Instagram.
Гипотеза: "${hypothesisTitle}"
Бизнес: ${businessType}. ${context}

Текущий пост:
Заголовок: ${title}
Сценарий: ${script}
Подпись: ${caption}
Хэштеги: ${hashtags}

Сделай более привлекательным для Instagram. Отвечай на русском.
Верни ТОЛЬКО JSON: {"improvedTitle": "...", "improvedScript": "...", "improvedCaption": "...", "improvedHashtags": "#тег1 #тег2"}`

  const response = await openai.chat.completions.create({
    model: 'gpt-4o',
    messages: [{ role: 'user', content: prompt }],
    temperature: 0.7,
    response_format: { type: 'json_object' },
  })
  return JSON.parse(response.choices[0].message.content || '{}') as ImprovedPostIdea
}

export async function analyzeResults(
  hypothesisTitle: string,
  results: { postTitle: string; views: number; likes: number; comments: number; saves: number }[]
): Promise<AnalysisResult> {
  const resultsText = results.map(r =>
    `Пост: "${r.postTitle}" — Просмотры: ${r.views}, Лайки: ${r.likes}, Комментарии: ${r.comments}, Сохранения: ${r.saves}`
  ).join('\n')

  const prompt = `Проанализируй результаты для гипотезы: "${hypothesisTitle}"\n${resultsText}
Отвечай на русском.
Верни ТОЛЬКО JSON: {"summary": "...", "engagementComparison": "...", "recommendation": "..."}`

  const response = await openai.chat.completions.create({
    model: 'gpt-4o',
    messages: [{ role: 'user', content: prompt }],
    temperature: 0.5,
    response_format: { type: 'json_object' },
  })
  return JSON.parse(response.choices[0].message.content || '{}') as AnalysisResult
}

export interface CompetitorAnalysisResult {
  summary: string
  contentTypes: string[]
  postingFrequency: string
  strongPoints: string[]
  weakPoints: string[]
  recommendations: string[]
  estimatedEngagement: string
  topTopics: string[]
}

export interface CompetitorData {
  handle: string
  businessType: string
  followers?: number | null
  avgLikes?: number | null
  avgComments?: number | null
  postsPerWeek?: number | null
  contentTypes?: string | null
  mainTopics?: string | null
  notes?: string | null
}

export async function analyzeCompetitor(data: CompetitorData): Promise<CompetitorAnalysisResult> {
  const engagementRate = data.followers && data.avgLikes
    ? ((data.avgLikes + (data.avgComments ?? 0)) / data.followers * 100).toFixed(2)
    : null

  const facts = [
    data.followers && `Подписчики: ${data.followers.toLocaleString('ru-RU')}`,
    data.avgLikes && `Среднее лайков: ${data.avgLikes}`,
    data.avgComments && `Среднее комментариев: ${data.avgComments}`,
    engagementRate && `ER: ${engagementRate}%`,
    data.postsPerWeek && `Постов в неделю: ${data.postsPerWeek}`,
    data.contentTypes && `Типы контента: ${data.contentTypes}`,
    data.mainTopics && `Основные темы: ${data.mainTopics}`,
    data.notes && `Заметки: ${data.notes}`,
  ].filter(Boolean).join('\n')

  const prompt = `Ты эксперт по Instagram-маркетингу. Проанализируй конкурента на основе реальных данных.

Конкурент: @${data.handle}
Ниша: ${data.businessType}

Данные (собраны вручную):
${facts || 'Данные не указаны'}

Оцени что работает у конкурента, найди слабые места, дай конкретные рекомендации.
Опирайся на предоставленные цифры. Отвечай только на русском.

Верни ТОЛЬКО JSON:
{
  "summary": "Резюме на основе данных (с конкретными цифрами)",
  "contentTypes": ["тип контента 1", "тип контента 2"],
  "postingFrequency": "Вывод о частоте публикаций",
  "strongPoints": ["сильная сторона с объяснением", "сильная сторона 2"],
  "weakPoints": ["слабая сторона 1", "слабая сторона 2"],
  "recommendations": ["конкретная рекомендация 1", "рекомендация 2", "рекомендация 3"],
  "estimatedEngagement": "Анализ вовлечённости с цифрами",
  "topTopics": ["тема 1", "тема 2", "тема 3"]
}`

  const response = await openai.chat.completions.create({
    model: 'gpt-4o',
    messages: [{ role: 'user', content: prompt }],
    temperature: 0.5,
    response_format: { type: 'json_object' },
  })
  return JSON.parse(response.choices[0].message.content || '{}') as CompetitorAnalysisResult
}

export async function extractMetricsFromScreenshot(base64Image: string): Promise<ExtractedMetrics> {
  const response = await openai.chat.completions.create({
    model: 'gpt-4o',
    messages: [{
      role: 'user',
      content: [
        { type: 'text', text: `Извлеки метрики из скриншота Instagram Insights. Верни ТОЛЬКО JSON: {"views": 0, "likes": 0, "comments": 0, "saves": 0, "confidence": "high"}. Если не можешь определить — поставь 0 и confidence: "low".` },
        { type: 'image_url', image_url: { url: `data:image/jpeg;base64,${base64Image}` } }
      ]
    }],
    response_format: { type: 'json_object' },
  })
  return JSON.parse(response.choices[0].message.content || '{}') as ExtractedMetrics
}
