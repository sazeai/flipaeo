'use client'

import { useState, useEffect } from 'react'
import { CheckCircle2, ExternalLink, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { createClient } from '@/utils/supabase/client'

interface StepPinterestProps {
  onConnected?: () => void
}

export function StepPinterest({ onConnected }: StepPinterestProps) {
  const [checking, setChecking] = useState(true)
  const [connected, setConnected] = useState(false)
  const [username, setUsername] = useState<string | null>(null)

  useEffect(() => {
    async function check() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { setChecking(false); return }

      const { data } = await supabase
        .from('pinterest_connections')
        .select('pinterest_user_id')
        .eq('user_id', user.id)
        .maybeSingle()

      if (data) {
        setConnected(true)
        setUsername(data.pinterest_user_id)
        onConnected?.()
      }
      setChecking(false)
    }
    check()

    // Check for OAuth return via URL params
    const params = new URLSearchParams(window.location.search)
    if (params.get('pinterest') === 'connected') {
      setConnected(true)
      onConnected?.()
      // Clean up the URL param (keep step param)
      const step = params.get('step')
      const newUrl = step ? `?step=${step}` : window.location.pathname
      window.history.replaceState({}, '', newUrl)
    }
  }, [onConnected])

  function handleConnect() {
    // Redirect to Pinterest OAuth — the callback will return to /onboarding?step=6&pinterest=connected
    window.location.href = '/api/auth/pinterest?redirect_to=' + encodeURIComponent('/onboarding?step=6')
  }

  if (checking) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="h-6 w-6 animate-spin text-neutral-400" />
      </div>
    )
  }

  if (connected) {
    return (
      <div className="space-y-8">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-neutral-950">
            Connect Pinterest
          </h2>
          <p className="mt-2 text-sm text-neutral-600">
            Link your Pinterest Business account so EcomPin can publish pins on your behalf.
          </p>
        </div>

        <div className="flex items-start gap-4 rounded-2xl border border-green-200 bg-green-50 p-6">
          <CheckCircle2 className="mt-0.5 h-6 w-6 shrink-0 text-green-600" />
          <div>
            <p className="text-base font-semibold text-green-800">Pinterest connected</p>
            {username && (
              <p className="mt-1 text-sm text-green-700">Logged in as @{username}</p>
            )}
            <p className="mt-2 text-sm text-green-700">
              Your account is linked and ready to publish.
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-neutral-950">
          Connect Pinterest
        </h2>
        <p className="mt-2 text-sm text-neutral-600">
          Link your Pinterest Business account so EcomPin can publish pins on your behalf.
        </p>
      </div>

      <div className="space-y-4">
        <div className="rounded-2xl border border-neutral-200 bg-neutral-50 p-6">
          <h3 className="text-sm font-semibold text-neutral-950">What EcomPin gets access to</h3>
          <ul className="mt-3 space-y-2">
            {[
              'Read and create boards',
              'Read and create pins',
              'Read account information',
            ].map(item => (
              <li key={item} className="flex items-center gap-2.5 text-sm text-neutral-600">
                <CheckCircle2 className="h-4 w-4 shrink-0 text-neutral-400" />
                {item}
              </li>
            ))}
          </ul>
          <p className="mt-4 text-xs text-neutral-500">
            EcomPin will never modify existing pins or boards. You can revoke access any time from Pinterest settings.
          </p>
        </div>

        <Button
          onClick={handleConnect}
          className="h-12 w-full rounded-xl bg-[#E60023] text-sm font-medium text-white hover:bg-[#CC001F]"
        >
          <ExternalLink className="mr-2 h-4 w-4" />
          Connect with Pinterest
        </Button>
      </div>
    </div>
  )
}
