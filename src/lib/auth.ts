import { cookies } from 'next/headers'
import { prisma } from './prisma'
import { createHash } from 'crypto'

const SESSION_COOKIE = 'owl_session'

export function hashPassword(password: string): string {
  return createHash('sha256').update(password + process.env.AUTH_SECRET).digest('hex')
}

export async function getSession() {
  const cookieStore = cookies()
  const sessionEmail = cookieStore.get(SESSION_COOKIE)?.value
  if (!sessionEmail) return null
  try {
    return await prisma.user.findUnique({ where: { email: sessionEmail } })
  } catch {
    return null
  }
}

export async function createSession(email: string) {
  let user = await prisma.user.findUnique({ where: { email } })
  if (!user) {
    user = await prisma.user.create({ data: { email } })
  }
  cookies().set(SESSION_COOKIE, email, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 30,
    path: '/',
  })
  return user
}

export async function clearSession() {
  cookies().delete(SESSION_COOKIE)
}
