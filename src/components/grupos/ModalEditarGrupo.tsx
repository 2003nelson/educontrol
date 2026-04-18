// src/components/grupos/ModalEditarGrupo.tsx
'use client'
import { useState } from 'react'
import { createPortal } from 'react-dom'

interface ModalEditarGrupoProps {
  grupo: {
    id: string
    grado: number
    numero: string
    turno: 'matutino' | 'vespertino'
    ciclo_escolar: string
  }
  onGuardar: (id: string, cambios: {
    grado?: number
    numero?: string
    turno?: 'matutino' | 'vespertino'
  }) => Promise<void>
  onCerrar: () => void
  guardando: boolean
}

const GRADOS_VALIDOS = [1, 2, 3, 4, 5, 6] as const
const TURNOS_VALIDOS = ['matutino', 'vespertino'] as const

function sanitizeNumero(value: string): string {
  // Permite letras y números, máximo 5 caracteres
  return value.replace(/[^a-zA-Z0-9]/g, '').slice(0, 5)
}

function validarNumero(numero: string): boolean {
  return numero.length >= 1 && numero.length <= 5
}

export default function ModalEditarGrupo({
  grupo,
  onGuardar,
  onCerrar,
  guardando,
}: ModalEditarGrupoProps) {
  const [grado, setGrado] = useState(grupo.grado)
  const [numero, setNumero] = useState(grupo.numero)
  const [turno, setTurno] = useState<'matutino' | 'vespertino'>(grupo.turno)
  const [confirmando, setConfirmando] = useState(false)
  const [cerrando, setCerrando] = useState(false)
  const [error, setError] = useState('')

  function cerrar() {
    setCerrando(true)
    setTimeout(() => onCerrar(), 380)
  }

  const numeroValido = numero !== '' && validarNumero(numero)

  async function handleConfirmar() {
    if (!numeroValido) {
      setError('Número de grupo inválido (1-5 caracteres)')
      return
    }

    const cambios: { grado?: number; numero?: string; turno?: 'matutino' | 'vespertino' } = {}
    if (grado !== grupo.grado) cambios.grado = grado
    if (numero !== grupo.numero) cambios.numero = numero.toUpperCase()
    if (turno !== grupo.turno) cambios.turno = turno

    if (Object.keys(cambios).length === 0) {
      setError('No hay cambios para guardar')
      return
    }

    try {
      await onGuardar(grupo.id, cambios)
      cerrar()
    } catch (err) {
      setError('Error al guardar')
      console.error('Error:', err)
    }
  }

  const backdropAnim = cerrando ? 'gBackdropOut 0.38s ease forwards' : 'gBackdropIn 0.25s ease'
  const modalAnim = cerrando ? 'gSpringOut 0.38s cubic-bezier(0.34,1.56,0.64,1) forwards' : 'gSpringIn 0.42s cubic-bezier(0.34,1.56,0.64,1)'
  const styles = `
    @keyframes gBackdropIn  { from{opacity:0} to{opacity:1} }
    @keyframes gBackdropOut { from{opacity:1} to{opacity:0} }
    @keyframes gSpringIn  { from{opacity:0;transform:scale(0.92) translateY(12px)} to{opacity:1;transform:scale(1) translateY(0)} }
    @keyframes gSpringOut { from{opacity:1;transform:scale(1) translateY(0)} to{opacity:0;transform:scale(0.92) translateY(12px)} }
  `

  if (confirmando) {
    return createPortal(
      <div onClick={cerrar} style={{ position:'fixed', inset:0, zIndex:9999, display:'flex', alignItems:'center', justifyContent:'center', background:'rgba(0,0,0,0.5)', backdropFilter:'blur(3px)', WebkitBackdropFilter:'blur(3px)', animation:backdropAnim }}>
        <style>{styles}</style>
        <div onClick={e => e.stopPropagation()} style={{ background:'white', borderRadius:'1rem', width:'400px', padding:'2rem', display:'flex', flexDirection:'column', alignItems:'center', boxShadow:'0 20px 60px rgba(0,0,0,0.2)', animation:modalAnim }}>
          <div style={{ width:'52px', height:'52px', borderRadius:'50%', background:'#fef3c7', display:'flex', alignItems:'center', justifyContent:'center', marginBottom:'1.25rem' }}>
            <svg width="24" height="24" fill="none" stroke="#f59e0b" strokeWidth="2" viewBox="0 0 24 24">
              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <h3 style={{ fontSize:'1rem', fontWeight:700, color:'#1e3a5f', margin:'0 0 0.75rem', textAlign:'center' }}>¿Confirmar cambios?</h3>
          <p style={{ fontSize:'0.875rem', color:'#475569', margin:'0 0 0.25rem', textAlign:'center' }}>Grado {grado} - Grupo {numero}</p>
          <p style={{ fontSize:'0.875rem', color:'#94a3b8', margin:'0 0 1.5rem', textAlign:'center' }}>Turno {turno}</p>
          
          {error && (
            <div style={{ width:'100%', padding:'0.75rem', background:'#fef2f2', border:'1px solid #fecaca', borderRadius:'0.5rem', marginBottom:'1rem' }}>
              <p style={{ fontSize:'0.8rem', color:'#dc2626', margin:0, textAlign:'center' }}>{error}</p>
            </div>
          )}

          <div style={{ display:'flex', gap:'0.75rem', width:'100%' }}>
            <button onClick={() => setConfirmando(false)} disabled={guardando}
              style={{ flex:1, padding:'0.625rem', fontSize:'0.875rem', fontWeight:500, borderRadius:'0.75rem', border:'1px solid #e2e8f0', color:'#64748b', background:'white', cursor: guardando ? 'not-allowed' : 'pointer', opacity: guardando ? 0.5 : 1 }}>
              ← Editar
            </button>
            <button onClick={handleConfirmar} disabled={guardando}
              style={{ flex:1, padding:'0.625rem', fontSize:'0.875rem', fontWeight:600, borderRadius:'0.75rem', border:'none', background: guardando ? '#94a3b8' : '#f59e0b', color:'white', cursor: guardando ? 'not-allowed' : 'pointer' }}>
              {guardando ? 'Guardando...' : 'Sí, guardar'}
            </button>
          </div>
        </div>
      </div>,
      document.body
    )
  }

  return createPortal(
    <div onClick={cerrar} style={{ position:'fixed', inset:0, zIndex:9999, display:'flex', alignItems:'center', justifyContent:'center', background:'rgba(0,0,0,0.5)', backdropFilter:'blur(3px)', WebkitBackdropFilter:'blur(3px)', animation:backdropAnim }}>
      <style>{styles}</style>
      <div onClick={e => e.stopPropagation()} style={{ background:'white', borderRadius:'1rem', width:'420px', boxShadow:'0 20px 60px rgba(0,0,0,0.2)', overflow:'hidden', animation:modalAnim }}>

        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'1.5rem 1.75rem 1.25rem' }}>
          <h2 style={{ fontSize:'1.125rem', fontWeight:700, color:'#1e3a5f', margin:0 }}>Editar Grupo</h2>
          <button onClick={cerrar} style={{ color:'#94a3b8', fontSize:'1.25rem', fontWeight:700, background:'none', border:'none', cursor:'pointer' }}>✕</button>
        </div>

        <div style={{ padding:'0 1.75rem 1.75rem', display:'flex', flexDirection:'column', gap:'1.25rem' }}>
          
          {/* Grado */}
          <div>
            <label style={{ fontSize:'0.875rem', fontWeight:500, color:'#475569', display:'block', marginBottom:'0.5rem' }}>Grado</label>
            <div style={{ display:'grid', gridTemplateColumns:'repeat(6, 1fr)', gap:'0.5rem' }}>
              {GRADOS_VALIDOS.map(g => (
                <button key={g} onClick={() => setGrado(g)} type="button"
                  style={{ padding:'0.625rem 0', borderRadius:'0.75rem', fontSize:'0.875rem', fontWeight:700, border: grado===g ? '2px solid #1e3a5f' : '1px solid #e2e8f0', background: grado===g ? '#1e3a5f' : 'white', color: grado===g ? 'white' : '#64748b', cursor:'pointer', transition:'all 0.15s' }}>
                  {g}°
                </button>
              ))}
            </div>
          </div>

          {/* Número de grupo (alfanumérico) */}
          <div>
            <label style={{ fontSize:'0.875rem', fontWeight:500, color:'#475569', display:'block', marginBottom:'0.375rem' }}>Número de grupo</label>
            <input type="text" placeholder="Ej: 101, 1A, 1B"
              value={numero}
              onChange={e => setNumero(sanitizeNumero(e.target.value))}
              maxLength={5}
              autoFocus
              style={{ width:'100%', border:'1px solid #e2e8f0', borderRadius:'0.75rem', padding:'0.75rem 1rem', fontSize:'0.875rem', outline:'none', boxSizing:'border-box', textTransform:'uppercase' }}
              onFocus={e => (e.currentTarget.style.boxShadow='0 0 0 2px #93c5fd')}
              onBlur={e => (e.currentTarget.style.boxShadow='none')} />
            <p style={{ fontSize:'0.7rem', color:'#94a3b8', margin:'0.375rem 0 0' }}>Letras y números (1-5 caracteres)</p>
          </div>

          {/* Turno */}
          <div>
            <label style={{ fontSize:'0.875rem', fontWeight:500, color:'#475569', display:'block', marginBottom:'0.5rem' }}>Turno</label>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'0.5rem' }}>
              {TURNOS_VALIDOS.map(t => (
                <button key={t} onClick={() => setTurno(t)} type="button"
                  style={{ padding:'0.75rem', borderRadius:'0.75rem', fontSize:'0.875rem', fontWeight:600, border: turno===t ? '2px solid #1e3a5f' : '1px solid #e2e8f0', background: turno===t ? '#1e3a5f' : 'white', color: turno===t ? 'white' : '#64748b', cursor:'pointer', textTransform:'capitalize' }}>
                  {t}
                </button>
              ))}
            </div>
          </div>

          {/* Error */}
          {error && (
            <div style={{ padding:'0.75rem', background:'#fef2f2', border:'1px solid #fecaca', borderRadius:'0.5rem' }}>
              <p style={{ fontSize:'0.8rem', color:'#dc2626', margin:0 }}>⚠️ {error}</p>
            </div>
          )}

          <div style={{ display:'flex', gap:'0.75rem', paddingTop:'0.25rem' }}>
            <button onClick={cerrar} type="button"
              style={{ flex:1, padding:'0.75rem', fontSize:'0.875rem', fontWeight:500, borderRadius:'0.75rem', border:'1px solid #e2e8f0', color:'#64748b', background:'white', cursor:'pointer' }}>
              Cancelar
            </button>
            <button onClick={() => { if (numeroValido) setConfirmando(true) }} type="button"
              disabled={!numeroValido}
              style={{ flex:1, padding:'0.75rem', fontSize:'0.875rem', fontWeight:600, borderRadius:'0.75rem', border:'none', background: numeroValido ? '#f59e0b' : '#e2e8f0', color: numeroValido ? 'white' : '#94a3b8', cursor: numeroValido ? 'pointer' : 'not-allowed' }}>
              Continuar →
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  )
}