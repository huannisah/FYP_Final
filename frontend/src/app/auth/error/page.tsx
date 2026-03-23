'use client'

import { useSearchParams } from 'next/navigation'
import Link from 'next/link'

const errorMessages: Record<string, string> = {
  OAuthSignin: 'Error signing in with provider.',
  OAuthCallback: 'Error during provider callback.',
  OAuthAccountNotLinked: 'Account already linked with different provider.',
  EmailCreateAccount: 'Unable to create account with email.',
  CredentialsSignin: 'Invalid email or password.',
  SessionRequired: 'You must be signed in to access this page.',
}

export default function AuthErrorPage() {
  const params = useSearchParams()
  const error = params.get('error') || 'Unknown'

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-8 space-y-4 text-center">
        <h1 className="text-2xl font-bold text-gray-800">Authentication Error</h1>
        <p className="text-gray-600">
          {errorMessages[error] || 'Something went wrong while signing you in.'}
        </p>
        <Link
          href="/auth/signin"
          className="inline-flex justify-center mt-4 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors font-medium"
        >
          Back to Sign In
        </Link>
      </div>
    </div>
  )
}
