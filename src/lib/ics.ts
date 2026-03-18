export function generateICSFile(params: {
  title: string
  description: string
  date: Date
}): string {
  const { title, description, date } = params

  function pad(n: number) { return n.toString().padStart(2, '0') }

  function formatDate(d: Date) {
    return `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}T${pad(d.getHours())}${pad(d.getMinutes())}00`
  }

  const start = new Date(date)
  start.setHours(10, 0, 0)
  const end = new Date(start)
  end.setMinutes(end.getMinutes() + 30)

  const uid = `${Date.now()}@instatest`
  const now = formatDate(new Date())

  const clean = (s: string) => s.replace(/[^\w\s\u0400-\u04FF.,!?()-]/g, '').substring(0, 200)

  return [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//InstaTest//RU',
    'BEGIN:VEVENT',
    `UID:${uid}`,
    `DTSTAMP:${now}Z`,
    `DTSTART:${formatDate(start)}`,
    `DTEND:${formatDate(end)}`,
    `SUMMARY:${clean(title)}`,
    `DESCRIPTION:${clean(description)}`,
    'END:VEVENT',
    'END:VCALENDAR',
  ].join('\r\n')
}
