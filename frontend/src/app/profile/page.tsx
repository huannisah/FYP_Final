'use client'
import { FormEvent, useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { useSession } from 'next-auth/react'

export default function ProfilePage() {
  const { data: session, status, update } = useSession()
  const [displayName, setDisplayName] = useState<string>(session?.user?.name || 'Hello there.')
  const [name, setName] = useState<string>(session?.user?.name ?? '')
  const [hasEditedName, setHasEditedName] = useState(false)
  const [nameError, setNameError] = useState<string | null>(null)
  const [nameSuccess, setNameSuccess] = useState<string | null>(null)
  const [isChangingName, setIsChangingName] = useState(false)

  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmNewPassword, setConfirmNewPassword] = useState('')
  const [passwordError, setPasswordError] = useState<string | null>(null)
  const [passwordSuccess, setPasswordSuccess] = useState<string | null>(null)
  const [isChangingPassword, setIsChangingPassword] = useState(false)

  const provider = (session as any)?.provider
  const isCredentialsUser = provider === 'credentials'

  const hasEditedNameRef = useRef(hasEditedName)

  useEffect(() => {
    hasEditedNameRef.current = hasEditedName
  }, [hasEditedName])

  useEffect(() => {
    const sessName = session?.user?.name ?? ''
    setDisplayName(sessName || 'Hello there.')
    if (!hasEditedNameRef.current) setName(sessName)
  }, [session?.user?.name])

  const handleChangePassword = async (e: FormEvent) => {
    e.preventDefault()
    setPasswordError(null)
    setPasswordSuccess(null)
    if (newPassword.length < 6) {
      setPasswordError('New password must be at least 6 characters.')
      return
    }
    if (newPassword !== confirmNewPassword) {
      setPasswordError('New password and confirmation do not match.')
      return
    }
    setIsChangingPassword(true)
    try {
      const response = await fetch('/api/profile/password', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentPassword, newPassword }),
      })
      const data = await response.json()
      if (!response.ok) {
        throw new Error(data.error || 'Failed to change password.')
      }
      setCurrentPassword('')
      setNewPassword('')
      setConfirmNewPassword('')
      setPasswordSuccess('Your password has been updated successfully.')
    } catch (err: any) {
      setPasswordError(err.message || 'Failed to change password.')
    } finally {
      setIsChangingPassword(false)
    }
  }

  const handleChangeName = async (e: FormEvent) => {
    e.preventDefault()
    setNameError(null)
    setNameSuccess(null)

    const trimmed = name.trim()
    if (!trimmed) {
      setNameError('Name is required.')
      return
    }
    if (trimmed.length > 50) {
      setNameError('Name must be at most 50 characters.')
      return
    }

    setIsChangingName(true)
    try {
      const response = await fetch('/api/profile/name', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: trimmed }),
      })
      const data = await response.json()
      if (!response.ok) {
        throw new Error(data.error || 'Failed to update name.')
      }

      setDisplayName(trimmed)
      setNameSuccess('Your name has been updated successfully.')
      setHasEditedName(false)
      await update({ name: trimmed })
    } catch (err: any) {
      setNameError(err.message || 'Failed to update name.')
    } finally {
      setIsChangingName(false)
    }
  }

  // Loading state
  if (status === 'loading') {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ background: '#fdf6f0', fontFamily: "'DM Sans', sans-serif" }}
      >
        <div className="text-center">
          <div
            className="rounded-full h-10 w-10 mx-auto mb-4 animate-spin"
            style={{ border: '3px solid #f0ddd0', borderTopColor: '#c07d5b' }}
          />
          <p style={{ color: '#bbb', fontSize: '0.88rem' }}>Loading profile...</p>
        </div>
      </div>
    )
  }

  if (!session?.user) return null

  return (
    <>
      <style>{`
        .mb-input:focus {
          outline: none;
          border-color: #c07d5b !important;
          box-shadow: 0 0 0 3px rgba(192, 125, 91, 0.12);
        }
        .mb-input:disabled { opacity: 0.5; cursor: not-allowed; }
        .mb-btn-primary:hover:not(:disabled) {
          background: #a8694a !important;
          transform: translateY(-1px);
          box-shadow: 0 6px 22px rgba(192,125,91,0.35) !important;
        }
        .mb-btn-primary:disabled { background: #ddd !important; box-shadow: none !important; cursor: not-allowed; }
        .back-link:hover { color: #a8694a !important; }
      `}</style>

      <div
        className="min-h-screen flex items-center justify-center p-10"
        style={{ background: '#fdf6f0', fontFamily: "'DM Sans', sans-serif" }}
      >
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1.5fr',
            maxWidth: 860,
            width: '100%',
            background: '#fff',
            borderRadius: 32,
            boxShadow: '0 8px 56px rgba(0,0,0,0.07)',
            overflow: 'hidden',
          }}
        >
          {/* ── LEFT PANEL: identity ── */}
          <div
            style={{
              background: 'linear-gradient(160deg, #fdf0e6 0%, #fae4d4 100%)',
              padding: '56px 44px',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
            }}
          >
            <div>
              {/* Avatar */}
              <div
                style={{
                  width: 64,
                  height: 64,
                  borderRadius: '50%',
                  background: '#e8c9b0',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '1.6rem',
                  marginBottom: 24,
                }}
              >
                🌿
              </div>

              <p
                style={{
                  fontSize: '0.72rem',
                  textTransform: 'uppercase',
                  letterSpacing: '0.12em',
                  color: '#c4a090',
                  fontWeight: 500,
                  marginBottom: 6,
                }}
              >
                Your account
              </p>
              <h1
                style={{
                  fontFamily: "'Lora', serif",
                  fontSize: '1.8rem',
                  color: '#2c2c2c',
                  fontWeight: 600,
                  lineHeight: 1.2,
                  marginBottom: 24,
                }}
              >
                {displayName}
              </h1>

              {/* Divider */}
              <div
                style={{
                  height: 1,
                  background: 'linear-gradient(to right, transparent, #e8d4c4, transparent)',
                  marginBottom: 24,
                }}
              />

              {/* Info */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div>
                  <p style={{ fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.1em', color: '#c4a090', fontWeight: 500, marginBottom: 3 }}>
                    Email
                  </p>
                  <p style={{ fontSize: '0.9rem', color: '#5a4a42', wordBreak: 'break-all' }}>
                    {session.user.email}
                  </p>
                </div>
                <div>
                  <p style={{ fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.1em', color: '#c4a090', fontWeight: 500, marginBottom: 3 }}>
                    Sign-in method
                  </p>
                  <p style={{ fontSize: '0.9rem', color: '#5a4a42', textTransform: 'capitalize' }}>
                    {provider || 'Credentials'}
                  </p>
                </div>
              </div>
            </div>

            {/* Back to chat */}
            <Link
              href="/"
              className="back-link"
              style={{
                marginTop: 40,
                fontSize: '0.85rem',
                color: '#c07d5b',
                textDecoration: 'underline',
                fontWeight: 500,
                transition: 'color 0.15s',
              }}
            >
              ← Back to chat
            </Link>
          </div>

          {/* ── RIGHT PANEL: profile settings ── */}
          <div
            style={{
              padding: '52px 48px',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              gap: 24,
            }}
          >
            <div>
              <h2
                style={{
                  fontFamily: "'Lora', serif",
                  fontSize: '1.5rem',
                  color: '#2c2c2c',
                  fontWeight: 600,
                }}
              >
                Change name
              </h2>
            </div>

            <form onSubmit={handleChangeName} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {nameError && (
                <div
                  style={{
                    background: '#fff5f5',
                    border: '1px solid #fad4d4',
                    borderRadius: 12,
                    padding: '12px 16px',
                    fontSize: '0.85rem',
                    color: '#b83232',
                  }}
                >
                  {nameError}
                </div>
              )}

              {nameSuccess && (
                <div
                  style={{
                    background: '#f2faf2',
                    border: '1px solid #c8e6c8',
                    borderRadius: 12,
                    padding: '12px 16px',
                    fontSize: '0.85rem',
                    color: '#2e7d32',
                  }}
                >
                  {nameSuccess}
                </div>
              )}

              <div>
                <label
                  htmlFor="profile-name"
                  style={{
                    display: 'block',
                    fontSize: '0.82rem',
                    color: '#888',
                    marginBottom: 6,
                    fontWeight: 500,
                  }}
                >
                  Display name
                </label>
                <input
                  id="profile-name"
                  type="text"
                  value={name}
                  onChange={(e) => {
                    setName(e.target.value)
                    setHasEditedName(true)
                    setNameError(null)
                    setNameSuccess(null)
                  }}
                  required
                  disabled={isChangingName}
                  className="mb-input"
                  style={{
                    width: '100%',
                    padding: '11px 16px',
                    border: '1.5px solid #ede5de',
                    borderRadius: 12,
                    fontSize: '0.92rem',
                    color: '#333',
                    background: '#fdfaf8',
                    transition: 'border-color 0.15s, box-shadow 0.15s',
                    boxSizing: 'border-box',
                    fontFamily: "'DM Sans', sans-serif",
                  }}
                />
              </div>

              <button
                type="submit"
                disabled={isChangingName}
                className="mb-btn-primary"
                style={{
                  padding: '13px 32px',
                  alignSelf: 'flex-start',
                  background: isChangingName ? '#ddd' : '#c07d5b',
                  color: '#fff',
                  border: 'none',
                  borderRadius: 50,
                  fontFamily: "'Lora', serif",
                  fontSize: '0.95rem',
                  fontWeight: 600,
                  cursor: isChangingName ? 'not-allowed' : 'pointer',
                  transition: 'background 0.2s, transform 0.1s, box-shadow 0.2s',
                  boxShadow: isChangingName ? 'none' : '0 4px 16px rgba(192,125,91,0.25)',
                }}
              >
                {isChangingName ? 'Updating...' : 'Update name'}
              </button>
            </form>

            <div>
              <h2
                style={{
                  fontFamily: "'Lora', serif",
                  fontSize: '1.5rem',
                  color: '#2c2c2c',
                  fontWeight: 600,
                }}
              >
                Change password
              </h2>
            </div>

            {!isCredentialsUser ? (
              <div style={{ paddingLeft: 14, borderLeft: '3px solid #f0ddd0' }}>
                <p style={{ fontSize: '0.88rem', color: '#9a8a82', lineHeight: 1.6 }}>
                  Password changes aren't available for social sign-in accounts. Your account is managed by your Google provider.
                </p>
              </div>
            ) : (
              <form onSubmit={handleChangePassword} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

                {/* Error */}
                {passwordError && (
                  <div
                    style={{
                      background: '#fff5f5',
                      border: '1px solid #fad4d4',
                      borderRadius: 12,
                      padding: '12px 16px',
                      fontSize: '0.85rem',
                      color: '#b83232',
                    }}
                  >
                    {passwordError}
                  </div>
                )}

                {/* Success */}
                {passwordSuccess && (
                  <div
                    style={{
                      background: '#f2faf2',
                      border: '1px solid #c8e6c8',
                      borderRadius: 12,
                      padding: '12px 16px',
                      fontSize: '0.85rem',
                      color: '#2e7d32',
                    }}
                  >
                    {passwordSuccess}
                  </div>
                )}

                {/* Current password */}
                <div>
                  <label
                    htmlFor="current-password"
                    style={{ display: 'block', fontSize: '0.82rem', color: '#888', marginBottom: 6, fontWeight: 500 }}
                  >
                    Current password
                  </label>
                  <input
                    id="current-password"
                    type="password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    required
                    disabled={isChangingPassword}
                    className="mb-input"
                    style={{
                      width: '100%',
                      padding: '11px 16px',
                      border: '1.5px solid #ede5de',
                      borderRadius: 12,
                      fontSize: '0.92rem',
                      color: '#333',
                      background: '#fdfaf8',
                      transition: 'border-color 0.15s, box-shadow 0.15s',
                      boxSizing: 'border-box',
                      fontFamily: "'DM Sans', sans-serif",
                    }}
                  />
                </div>

                {/* New + Confirm row */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div>
                    <label
                      htmlFor="new-password"
                      style={{ display: 'block', fontSize: '0.82rem', color: '#888', marginBottom: 6, fontWeight: 500 }}
                    >
                      New password
                    </label>
                    <input
                      id="new-password"
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      required
                      minLength={6}
                      disabled={isChangingPassword}
                      className="mb-input"
                      style={{
                        width: '100%',
                        padding: '11px 14px',
                        border: '1.5px solid #ede5de',
                        borderRadius: 12,
                        fontSize: '0.9rem',
                        color: '#333',
                        background: '#fdfaf8',
                        transition: 'border-color 0.15s, box-shadow 0.15s',
                        boxSizing: 'border-box',
                        fontFamily: "'DM Sans', sans-serif",
                      }}
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="confirm-new-password"
                      style={{ display: 'block', fontSize: '0.82rem', color: '#888', marginBottom: 6, fontWeight: 500 }}
                    >
                      Confirm new password
                    </label>
                    <input
                      id="confirm-new-password"
                      type="password"
                      value={confirmNewPassword}
                      onChange={(e) => setConfirmNewPassword(e.target.value)}
                      required
                      minLength={6}
                      disabled={isChangingPassword}
                      className="mb-input"
                      style={{
                        width: '100%',
                        padding: '11px 14px',
                        border: '1.5px solid #ede5de',
                        borderRadius: 12,
                        fontSize: '0.9rem',
                        color: '#333',
                        background: '#fdfaf8',
                        transition: 'border-color 0.15s, box-shadow 0.15s',
                        boxSizing: 'border-box',
                        fontFamily: "'DM Sans', sans-serif",
                      }}
                    />
                  </div>
                </div>

                {/* Submit */}
                <button
                  type="submit"
                  disabled={isChangingPassword}
                  className="mb-btn-primary"
                  style={{
                    padding: '13px 32px',
                    alignSelf: 'flex-start',
                    background: isChangingPassword ? '#ddd' : '#c07d5b',
                    color: '#fff',
                    border: 'none',
                    borderRadius: 50,
                    fontFamily: "'Lora', serif",
                    fontSize: '0.95rem',
                    fontWeight: 600,
                    cursor: isChangingPassword ? 'not-allowed' : 'pointer',
                    transition: 'background 0.2s, transform 0.1s, box-shadow 0.2s',
                    boxShadow: isChangingPassword ? 'none' : '0 4px 16px rgba(192,125,91,0.25)',
                  }}
                >
                  {isChangingPassword ? 'Updating...' : 'Update password'}
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </>
  )
}
