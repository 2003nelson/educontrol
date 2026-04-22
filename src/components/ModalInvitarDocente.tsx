// src/components/ModalInvitarDocente.tsx
'use client'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'

interface Props {
  docenteId: string
  docenteNombre: string
  docenteEmail: string
  onClose: () => void
  onSuccess: () => void
}

type Estado = 'idle' | 'enviando' | 'exito' | 'error'

export function ModalInvitarDocente({
  docenteId,
  docenteNombre,
  docenteEmail,
  onClose,
  onSuccess,
}: Props) {
  const supabase = createClient()
  const [estado, setEstado] = useState<Estado>('idle')
  const [errorMsg, setErrorMsg] = useState('')

  async function handleInvitar() {
    try {
      setEstado('enviando')
      setErrorMsg('')

      const { data: { session } } = await supabase.auth.getSession()
      if (!session) throw new Error('Sin sesión activa')

      const { data, error: fnError } = await supabase.functions.invoke('invitar-docente', {
        body: { docente_id: docenteId },
        headers: { Authorization: `Bearer ${session.access_token}` },
      })

      if (fnError) throw fnError
      if (!data?.ok) throw new Error(data?.error ?? 'Error al enviar')

      setEstado('exito')
      setTimeout(() => {
        onSuccess()
        onClose()
      }, 2000)

    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Error desconocido')
      setEstado('error')
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(15,23,42,0.45)', backdropFilter: 'blur(4px)' }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <div
        className="bg-white rounded-2xl shadow-xl w-full max-w-md"
        style={{
          border: '1px solid #e2e8f0',
          animation: 'spring-in 0.35s cubic-bezier(0.34,1.56,0.64,1) both',
        }}
      >
        <style>{`
          @keyframes spring-in {
            from { opacity: 0; transform: scale(0.92) translateY(8px); }
            to   { opacity: 1; transform: scale(1)    translateY(0);   }
          }
        `}</style>

        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-5 pb-4" style={{ borderBottom: '1px solid #f1f5f9' }}>
          <div className="flex items-center gap-3">
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center"
              style={{ background: 'linear-gradient(135deg,#1e3a5f,#2563eb)' }}
            >
              <svg width="18" height="18" fill="none" stroke="white" strokeWidth="2" viewBox="0 0 24 24">
                <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
                <polyline points="22,6 12,13 2,6"/>
              </svg>
            </div>
            <h2 className="text-sm font-semibold" style={{ color: '#1e3a5f' }}>
              Enviar invitación
            </h2>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center"
            style={{ color: '#94a3b8' }}
            onMouseEnter={e => (e.currentTarget.style.background = '#f1f5f9')}
            onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
          >
            <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <line x1="18" y1="6" x2="6" y2="18"/>
              <line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-5">
          {estado === 'exito' ? (
            <div className="text-center py-4">
              <div className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-3" style={{ background: '#f0fdf4' }}>
                <svg width="28" height="28" fill="none" stroke="#16a34a" strokeWidth="2.5" viewBox="0 0 24 24">
                  <path d="M20 6L9 17l-5-5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              <p className="text-sm font-semibold mb-1" style={{ color: '#1e3a5f' }}>¡Invitación enviada!</p>
              <p className="text-xs" style={{ color: '#94a3b8' }}>
                Supabase envió el link de activación a {docenteEmail}
              </p>
            </div>
          ) : (
            <>
              {/* Info docente */}
              <div className="rounded-xl p-4 mb-5" style={{ background: '#f8fafc', border: '1px solid #e2e8f0' }}>
                <p className="text-xs font-semibold mb-1" style={{ color: '#94a3b8' }}>DOCENTE</p>
                <p className="text-sm font-semibold" style={{ color: '#1e3a5f' }}>{docenteNombre}</p>
                <p className="text-xs mt-0.5" style={{ color: '#64748b' }}>{docenteEmail}</p>
              </div>

              <p className="text-sm mb-5" style={{ color: '#475569', lineHeight: 1.7 }}>
                Se enviará un correo desde <strong style={{ color: '#1e3a5f' }}>noreply@dinoti.xyz</strong> con
                un enlace para que el docente cree su contraseña y active su cuenta.
              </p>

              {estado === 'error' && (
                <div
                  className="flex items-center gap-2 px-4 py-3 rounded-xl text-sm mb-4"
                  style={{ background: '#fef2f2', color: '#dc2626', border: '1px solid #fecaca' }}
                >
                  <svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <circle cx="12" cy="12" r="10"/>
                    <line x1="12" y1="8" x2="12" y2="12"/>
                    <line x1="12" y1="16" x2="12.01" y2="16"/>
                  </svg>
                  {errorMsg}
                </div>
              )}

              <div className="flex gap-3">
                <button
                  onClick={onClose}
                  className="flex-1 py-2.5 text-sm font-semibold rounded-xl"
                  style={{ background: '#f1f5f9', color: '#64748b', border: 'none' }}
                  onMouseEnter={e => (e.currentTarget.style.background = '#e2e8f0')}
                  onMouseLeave={e => (e.currentTarget.style.background = '#f1f5f9')}
                >
                  Cancelar
                </button>
                <button
                  onClick={handleInvitar}
                  disabled={estado === 'enviando'}
                  className="flex-1 py-2.5 text-sm font-semibold rounded-xl text-white"
                  style={{
                    background: estado === 'enviando' ? '#94a3b8' : 'linear-gradient(135deg,#1e3a5f,#2563eb)',
                    border: 'none',
                    cursor: estado === 'enviando' ? 'not-allowed' : 'pointer',
                  }}
                >
                  {estado === 'enviando' ? (
                    <span className="flex items-center justify-center gap-2">
                      <svg className="animate-spin" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                        <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
                      </svg>
                      Enviando...
                    </span>
                  ) : 'Enviar invitación'}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}