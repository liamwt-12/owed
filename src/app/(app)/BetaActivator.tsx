'use client'

import { useEffect } from 'react'

export function BetaActivator({ userId }: { userId: string }) {
  useEffect(() => {
    const isBeta = localStorage.getItem('owed_beta')
    if (isBeta === 'true') {
      fetch('/api/auth/activate-beta', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: userId })
      }).then(() => {
        localStorage.removeItem('owed_beta')
      })
    }
  }, [userId])
  return null
}
