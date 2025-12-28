'use client'

import { useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Home, RefreshCw, ArrowRight } from 'lucide-react'
import Link from 'next/link'
import { ErrorGraphic } from '@/components/ui/error-graphic'
import { Suspense } from 'react'


function ErrorContent() {
  const searchParams = useSearchParams()
  const message = searchParams.get('message')

  // Generic error messages to avoid exposing sensitive information
  const getErrorMessage = (message: string | null) => {
    if (!message) {
      return 'An unexpected error occurred. Please try again.'
    }

    if (message.includes('rate limit') || message.includes('Too many')) {
      return 'Too many attempts. Please wait before trying again.'
    }

    if (message.includes('auth') || message.includes('login') || message.includes('sign')) {
      return 'Authentication failed. Please try signing in again.'
    }

    if (message.includes('network') || message.includes('connection')) {
      return 'Connection error. Please check your internet and try again.'
    }

    return 'Something went wrong. Please try again or contact support.'
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-white relative overflow-hidden p-4">
      {/* Background Pattern */}
      <div className="absolute inset-0 bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:24px_24px] opacity-40 -z-10"></div>

      <div className="w-full max-w-4xl grid md:grid-cols-2 gap-12 items-center">

        {/* Left Side: Graphic */}
        <div className="order-2 md:order-1 flex justify-center transform hover:scale-105 transition-transform duration-500">
          <ErrorGraphic mode="error" errorCode="500" />
        </div>

        {/* Right Side: Content */}
        <div className="order-1 md:order-2 text-left">
          <div className="inline-block bg-brand-yellow border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] px-3 py-1 mb-6 transform -rotate-2">
            <span className="font-mono font-bold text-xs uppercase tracking-widest">System Alert</span>
          </div>

          <h1 className="font-display font-black text-5xl md:text-6xl mb-6 uppercase leading-[0.9]">
            Something<br />Went Wrong
          </h1>

          <p className="font-sans text-gray-600 text-lg mb-8 leading-relaxed border-l-4 border-black pl-4 py-1">
            {getErrorMessage(message)}
          </p>

          <div className="flex flex-col sm:flex-row gap-4">
            <Link href="/login" className="flex-1">
              <Button className="w-full h-12 border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all bg-black text-white rounded-none">
                <RefreshCw className="h-4 w-4 mr-2" />
                Try Again
              </Button>
            </Link>

            <Link href="/" className="flex-1">
              <Button variant="outline" className="w-full h-12 border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all bg-white text-black hover:bg-gray-50 rounded-none">
                <Home className="h-4 w-4 mr-2" />
                Return Home
              </Button>
            </Link>
          </div>

          <div className="mt-8 flex items-center gap-2 text-xs font-mono text-gray-500">
            <span>ERROR_ID: {Math.random().toString(36).substr(2, 9).toUpperCase()}</span>
            <span className="h-px w-8 bg-gray-300"></span>
            <span>Ref: {new Date().toISOString().split('T')[0]}</span>
          </div>

        </div>
      </div>
    </div>
  )
}

export default function ErrorPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <ErrorContent />
    </Suspense>
  )
}