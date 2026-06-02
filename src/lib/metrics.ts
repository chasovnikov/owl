/**
 * Free, no-OAuth metric fetchers for published posts.
 * The user pastes a public post URL; we pull engagement metrics where possible.
 *
 * - Telegram: scrapes the public embed page (no key needed) → views only
 * - YouTube:  Data API v3 with a free API key → views / likes / comments
 * - VK:       wall.getById with a free service token → views / likes / comments / reposts
 */

export interface FetchedMetrics {
  views: number
  likes: number
  comments: number
  saves: number
}

export type MetricsResult =
  | { ok: true; metrics: FetchedMetrics; note?: string }
  | { ok: false; error: string }

/** Parse compact numbers like "12.3K", "1.2M" into integers. */
function parseCompact(raw: string): number {
  const s = raw.trim().replace(/\s/g, '').replace(',', '.').toUpperCase()
  const m = s.match(/^([\d.]+)([KM]?)$/)
  if (!m) return parseInt(s.replace(/\D/g, ''), 10) || 0
  const n = parseFloat(m[1])
  const mult = m[2] === 'M' ? 1_000_000 : m[2] === 'K' ? 1_000 : 1
  return Math.round(n * mult)
}

function detectPlatform(channelName: string, url: string): string {
  const c = channelName.toLowerCase()
  const u = url.toLowerCase()
  if (c.includes('telegram') || u.includes('t.me/')) return 'telegram'
  if (c.includes('youtube') || u.includes('youtube.com') || u.includes('youtu.be')) return 'youtube'
  if (c.includes('vk') || u.includes('vk.com') || u.includes('vk.ru')) return 'vk'
  return c
}

// ─── Telegram (public embed, no key) ────────────────────────────────────────
async function fetchTelegram(url: string): Promise<MetricsResult> {
  // Accept https://t.me/<channel>/<id> (optionally with extra path/query)
  const m = url.match(/t\.me\/([A-Za-z0-9_]+)\/(\d+)/)
  if (!m) return { ok: false, error: 'Не похоже на ссылку поста Telegram (t.me/канал/123)' }
  const embed = `https://t.me/${m[1]}/${m[2]}?embed=1&mode=tme`
  try {
    const res = await fetch(embed, { headers: { 'User-Agent': 'Mozilla/5.0' } })
    if (!res.ok) return { ok: false, error: `Telegram вернул ${res.status}` }
    const html = await res.text()
    const vm = html.match(/tgme_widget_message_views[^>]*>([^<]+)</)
    const views = vm ? parseCompact(vm[1]) : 0
    if (!vm) return { ok: false, error: 'Не удалось прочитать просмотры (приватный канал?)' }
    return {
      ok: true,
      metrics: { views, likes: 0, comments: 0, saves: 0 },
      note: 'Telegram отдаёт только просмотры. Лайки/комментарии впиши вручную.',
    }
  } catch (e: any) {
    return { ok: false, error: `Ошибка запроса к Telegram: ${e?.message ?? e}` }
  }
}

// ─── YouTube (Data API v3, free key) ────────────────────────────────────────
function youtubeId(url: string): string | null {
  const patterns = [
    /[?&]v=([A-Za-z0-9_-]{6,})/,
    /youtu\.be\/([A-Za-z0-9_-]{6,})/,
    /youtube\.com\/shorts\/([A-Za-z0-9_-]{6,})/,
    /youtube\.com\/embed\/([A-Za-z0-9_-]{6,})/,
  ]
  for (const p of patterns) {
    const m = url.match(p)
    if (m) return m[1]
  }
  return null
}

async function fetchYouTube(url: string): Promise<MetricsResult> {
  const key = process.env.YOUTUBE_API_KEY
  if (!key) return { ok: false, error: 'YouTube не настроен: добавь YOUTUBE_API_KEY' }
  const id = youtubeId(url)
  if (!id) return { ok: false, error: 'Не похоже на ссылку видео YouTube' }
  try {
    const res = await fetch(
      `https://www.googleapis.com/youtube/v3/videos?part=statistics&id=${id}&key=${key}`,
    )
    const data = await res.json()
    if (data.error) return { ok: false, error: `YouTube API: ${data.error.message}` }
    const st = data.items?.[0]?.statistics
    if (!st) return { ok: false, error: 'Видео не найдено или приватное' }
    return {
      ok: true,
      metrics: {
        views: Number(st.viewCount ?? 0),
        likes: Number(st.likeCount ?? 0),
        comments: Number(st.commentCount ?? 0),
        saves: 0,
      },
      note: 'У YouTube нет «сохранений».',
    }
  } catch (e: any) {
    return { ok: false, error: `Ошибка запроса к YouTube: ${e?.message ?? e}` }
  }
}

// ─── VK (wall.getById, free service token) ──────────────────────────────────
async function fetchVK(url: string): Promise<MetricsResult> {
  const token = process.env.VK_SERVICE_TOKEN
  if (!token) return { ok: false, error: 'VK не настроен: добавь VK_SERVICE_TOKEN' }
  // wall-12345_678 or wall12345_678 (in path or ?w=)
  const m = url.match(/wall(-?\d+)_(\d+)/)
  if (!m) return { ok: false, error: 'Не похоже на ссылку поста VK (vk.com/wall-123_456)' }
  const postId = `${m[1]}_${m[2]}`
  try {
    const res = await fetch(
      `https://api.vk.com/method/wall.getById?posts=${postId}&access_token=${token}&v=5.199`,
    )
    const data = await res.json()
    if (data.error) return { ok: false, error: `VK API: ${data.error.error_msg}` }
    const post = Array.isArray(data.response) ? data.response[0] : data.response?.items?.[0]
    if (!post) return { ok: false, error: 'Пост не найден или закрыт' }
    return {
      ok: true,
      metrics: {
        views: post.views?.count ?? 0,
        likes: post.likes?.count ?? 0,
        comments: post.comments?.count ?? 0,
        saves: post.reposts?.count ?? 0, // VK не имеет «сохранений» — кладём репосты
      },
      note: 'В поле «Сохранения» — репосты VK (нативных сохранений у VK нет).',
    }
  } catch (e: any) {
    return { ok: false, error: `Ошибка запроса к VK: ${e?.message ?? e}` }
  }
}

/** Dispatch to the right fetcher based on the channel platform / URL. */
export async function fetchMetrics(channelName: string, url: string): Promise<MetricsResult> {
  const clean = url.trim()
  if (!clean) return { ok: false, error: 'Вставь ссылку на опубликованный пост' }
  switch (detectPlatform(channelName, clean)) {
    case 'telegram': return fetchTelegram(clean)
    case 'youtube':  return fetchYouTube(clean)
    case 'vk':       return fetchVK(clean)
    default:
      return { ok: false, error: 'Автометрики пока поддерживаются для Telegram, YouTube и VK' }
  }
}
