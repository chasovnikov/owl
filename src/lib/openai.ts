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
  tone: string,
  narrativeStyle: string,
  goal: string
): Promise<StrategyRecommendation> {
  const prompt = `Создай контент-стратегию для Instagram.
Бизнес: ${businessType}, Тон: ${tone}, Стиль: ${narrativeStyle}, Цель: ${goal}
Отвечай на русском.
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
