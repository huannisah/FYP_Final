import { NextResponse } from 'next/server'
import { getServerSession } from '@/lib/auth'
import { updateUser } from '@/lib/supabase/auth-queries'

export async function PATCH(request: Request) {
  try {
    const session = await getServerSession()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { name } = await request.json()
    const trimmed = (name ?? '').trim()

    if (!trimmed) {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 })
    }

    if (trimmed.length > 50) {
      return NextResponse.json({ error: 'Name must be at most 50 characters' }, { status: 400 })
    }

    const updated = await updateUser(session.user.id, { name: trimmed })
    if (!updated) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Update name error', error)
    return NextResponse.json({ error: 'Failed to update name' }, { status: 500 })
  }
}

