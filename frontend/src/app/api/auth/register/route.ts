import { NextResponse } from 'next/server'
import { hash } from 'bcrypt'
import { createUser, getUserByEmail } from '@/lib/supabase/auth-queries'

export async function POST(request: Request) {
  try {
    const { email, password, name } = await request.json()

    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password are required' }, { status: 400 })
    }

    const existing = await getUserByEmail(email)
    if (existing) {
      return NextResponse.json({ error: 'Email already registered' }, { status: 409 })
    }

    const passwordHash = await hash(password, 12)
    const user = await createUser(email, name ?? null, passwordHash)

    return NextResponse.json(
      {
        id: user.id,
        email: user.email,
        name: user.name,
      },
      { status: 201 },
    )
  } catch (error: any) {
    console.error('Register error', error)
    return NextResponse.json({ error: 'Failed to register user' }, { status: 500 })
  }
}
