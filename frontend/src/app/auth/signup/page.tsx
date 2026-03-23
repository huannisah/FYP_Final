'use client'
import React, { useState } from 'react'
import Link from 'next/link'
import { signIn } from 'next-auth/react'
import { chatAPI } from '@/lib/api'

export default function SignUpPage() {
  const [email, setEmail] = useState('')
  const [name, setName] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [privacyAccepted, setPrivacyAccepted] = useState(false)
  const [consentGiven, setConsentGiven] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    if (password !== confirmPassword) {
      setError('Passwords do not match')
      return
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters')
      return
    }
    setLoading(true)
    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, name }),
      })
      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Registration failed')
      }
      // Record consent in backend (chat user) so they don't need to agree again on the app
      try {
        await chatAPI.createUser(email.trim().toLowerCase(), consentGiven, privacyAccepted)
      } catch (e) {
        // Backend may not be reachable or user already exists; continue with sign-in
      }
      // Auto sign-in after register
      const result = await signIn('credentials', {
        email,
        password,
        redirect: false,
        callbackUrl: '/',
      })
      if (result?.error) {
        setError(result.error)
      } else if (result?.ok) {
        window.location.href = result.url || '/'
      }
    } catch (err: any) {
      setError(err.message || 'Registration failed')
    } finally {
      setLoading(false)
    }
  }

  const handleGoogle = async () => {
    await signIn('google', { callbackUrl: '/' })
  }

  return (
    <>
      <style>{`
        .mb-input:focus {
          outline: none;
          border-color: #c07d5b !important;
          box-shadow: 0 0 0 3px rgba(192, 125, 91, 0.12);
        }
        .mb-input:disabled { opacity: 0.5; cursor: not-allowed; }
        .mb-checkbox { accent-color: #c07d5b; width: 15px; height: 15px; flex-shrink: 0; margin-top: 2px; cursor: pointer; }
        .mb-btn-primary:hover:not(:disabled) {
          background: #a8694a !important;
          transform: translateY(-1px);
          box-shadow: 0 6px 22px rgba(192,125,91,0.35) !important;
        }
        .mb-btn-primary:disabled { background: #ddd !important; box-shadow: none !important; cursor: not-allowed; }
        .mb-btn-google:hover { background: #fdf3ec !important; border-color: #e0c8b8 !important; }
      `}</style>

      <div
        className="min-h-screen flex items-center justify-center p-8"
        style={{ background: '#fdf6f0', fontFamily: "'DM Sans', sans-serif" }}
      >
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1.4fr',
            maxWidth: 920,
            width: '100%',
            background: '#fff',
            borderRadius: 32,
            boxShadow: '0 8px 56px rgba(0,0,0,0.07)',
            overflow: 'hidden',
          }}
        >
          {/* ── LEFT PANEL: branding ── */}
          <div
            style={{
              background: 'linear-gradient(160deg, #fdf0e6 0%, #fae4d4 100%)',
              padding: '56px 44px',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
            }}
          >
            <div style={{ fontSize: '2.8rem', marginBottom: 20 }}>🌿</div>
            <h1
              style={{
                fontFamily: "'Lora', serif",
                fontSize: '2.1rem',
                color: '#2c2c2c',
                fontWeight: 600,
                lineHeight: 1.2,
                marginBottom: 16,
              }}
            >
              Welcome to MindBuddy.
            </h1>
            <p style={{ color: '#7a5c4a', fontSize: '0.95rem', lineHeight: 1.75, marginBottom: 12 }}>
              This is a safe space to talk, reflect, and find support whenever you need it.
            </p>

            {/* Divider */}
            <div
              style={{
                height: 1,
                background: 'linear-gradient(to right, transparent, #e8d4c4, transparent)',
                margin: '32px 0',
              }}
            />

            {/* Already have account */}
            <p style={{ fontSize: '0.85rem', color: '#b09080' }}>
              Already have an account?{' '}
              <Link
                href="/auth/signin"
                style={{ color: '#c07d5b', fontWeight: 500, textDecoration: 'underline' }}
              >
                Sign in
              </Link>
            </p>
          </div>

          {/* ── RIGHT PANEL: form ── */}
          <div
            style={{
              padding: '48px 48px',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              gap: 20,
              overflowY: 'auto',
            }}
          >
            {/* Header */}
            <div>
              <p
                style={{
                  fontSize: '0.72rem',
                  textTransform: 'uppercase',
                  letterSpacing: '0.12em',
                  color: '#ccc',
                  fontWeight: 500,
                  marginBottom: 6,
                }}
              >
                Create account
              </p>
              <h2
                style={{
                  fontFamily: "'Lora', serif",
                  fontSize: '1.5rem',
                  color: '#2c2c2c',
                  fontWeight: 600,
                }}
              >
                Join MindBuddy
              </h2>
            </div>

            {/* Error */}
            {error && (
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
                {error}
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

              {/* Name + Email row */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label
                    htmlFor="name"
                    style={{ display: 'block', fontSize: '0.82rem', color: '#888', marginBottom: 6, fontWeight: 500 }}
                  >
                    Name <span style={{ color: '#ccc', fontWeight: 400 }}>(optional)</span>
                  </label>
                  <input
                    id="name"
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Your name"
                    disabled={loading}
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
                    htmlFor="email"
                    style={{ display: 'block', fontSize: '0.82rem', color: '#888', marginBottom: 6, fontWeight: 500 }}
                  >
                    Email
                  </label>
                  <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    required
                    disabled={loading}
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

              {/* Password + Confirm row */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label
                    htmlFor="password"
                    style={{ display: 'block', fontSize: '0.82rem', color: '#888', marginBottom: 6, fontWeight: 500 }}
                  >
                    Password
                  </label>
                  <input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="At least 6 characters"
                    required
                    disabled={loading}
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
                    htmlFor="confirm-password"
                    style={{ display: 'block', fontSize: '0.82rem', color: '#888', marginBottom: 6, fontWeight: 500 }}
                  >
                    Confirm Password
                  </label>
                  <input
                    id="confirm-password"
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Re-enter your password"
                    required
                    disabled={loading}
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

              {/* Privacy & Consent */}
              <div
                style={{
                  borderLeft: '3px solid #f0ddd0',
                  paddingLeft: 14,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 12,
                }}
              >
                <p
                  style={{
                    fontSize: '0.70rem',
                    textTransform: 'uppercase',
                    letterSpacing: '0.1em',
                    color: '#ccc',
                    fontWeight: 500,
                  }}
                >
                  Privacy & consent
                </p>

                <label style={{ display: 'flex', alignItems: 'flex-start', gap: 10, cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={privacyAccepted}
                    onChange={(e) => setPrivacyAccepted(e.target.checked)}
                    disabled={loading}
                    className="mb-checkbox"
                  />
                  <span style={{ fontSize: '0.70rem', color: '#7a6a62', lineHeight: 1.55 }}>
                    I understand that my conversations will be stored securely.
                  </span>
                </label>

                <label style={{ display: 'flex', alignItems: 'flex-start', gap: 10, cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={consentGiven}
                    onChange={(e) => setConsentGiven(e.target.checked)}
                    disabled={loading}
                    className="mb-checkbox"
                  />
                  <span style={{ fontSize: '0.70rem', color: '#7a6a62', lineHeight: 1.55 }}>
                    I consent to using this AI chatbot for mental health support and understand it is not a substitute for professional care.
                  </span>
                </label>
              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={loading || !privacyAccepted || !consentGiven}
                className="mb-btn-primary"
                style={{
                  width: '100%',
                  padding: '13px',
                  marginTop: 2,
                  background: loading || !privacyAccepted || !consentGiven ? '#ddd' : '#c07d5b',
                  color: '#fff',
                  border: 'none',
                  borderRadius: 50,
                  fontFamily: "'Lora', serif",
                  fontSize: '0.97rem',
                  fontWeight: 600,
                  cursor: loading || !privacyAccepted || !consentGiven ? 'not-allowed' : 'pointer',
                  transition: 'background 0.2s, transform 0.1s, box-shadow 0.2s',
                  boxShadow: loading || !privacyAccepted || !consentGiven ? 'none' : '0 4px 16px rgba(192,125,91,0.25)',
                }}
              >
                {loading ? 'Creating account...' : 'Create account'}
              </button>
            </form>

            {/* Divider */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ flex: 1, height: 1, background: 'linear-gradient(to right, transparent, #ece4dc)' }} />
              <span style={{ fontSize: '0.72rem', color: '#ccc', textTransform: 'uppercase', letterSpacing: '0.08em' }}>or</span>
              <div style={{ flex: 1, height: 1, background: 'linear-gradient(to left, transparent, #ece4dc)' }} />
            </div>

            {/* Google */}
            <button
              onClick={handleGoogle}
              className="mb-btn-google"
              style={{
                width: '100%',
                padding: '12px',
                background: '#fff',
                border: '1.5px solid #ede5de',
                borderRadius: 50,
                fontSize: '0.92rem',
                fontWeight: 500,
                color: '#5a4a42',
                cursor: 'pointer',
                transition: 'background 0.15s, border-color 0.15s',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 10,
                fontFamily: "'Lora', sans-serif",
              }}
            >
              <svg width="18" height="18" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
                <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.875 2.684-6.615z" fill="#4285F4"/>
                <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z" fill="#34A853"/>
                <path d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332z" fill="#FBBC05"/>
                <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z" fill="#EA4335"/>
              </svg>
              Continue with Google
            </button>
          </div>
        </div>
      </div>
    </>
  )
}
