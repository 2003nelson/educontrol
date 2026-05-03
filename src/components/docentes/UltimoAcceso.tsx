'use client'
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'

export function UltimoAcceso({ authId }: { authId: string | null }) {
  const [fecha, setFecha] = useState<string | null>(null)

  useEffect(() => {
    if (!authId) return
    createClient()
      .rpc('get_last_sign_in', { p_auth_id: authId })
      .then(({ data }) => { if (data) setFecha(data as string) })
  }, [authId])

  if (!fecha) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <div style={{ width: 7, height: 7, borderRadius: '50%', background: '#e2e8f0', flexShrink: 0 }}/>
        <span style={{ fontSize: '0.72rem', color: '#c0c0d0', fontStyle: 'italic' }}>Sin acceso</span>
      </div>
    )
  }

  const d = new Date(fecha)
  const hora    = d.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })
  const fechaStr = d.toLocaleDateString('es-MX', { day: '2-digit', month: '2-digit', year: 'numeric' })

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
      <div style={{ width: 7, height: 7, borderRadius: '50%', background: '#22c55e', flexShrink: 0, boxShadow: '0 0 0 2px #dcfce7' }}/>
      <div>
        <p style={{ fontSize: '0.75rem', fontWeight: 600, color: '#374151', margin: 0 }}>{hora}</p>
        <p style={{ fontSize: '0.65rem', color: '#9ca3af', margin: 0 }}>{fechaStr}</p>
      </div>
    </div>
  )
}