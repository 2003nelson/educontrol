// src/app/docente/(autenticado)/horario/page.tsx
'use client'
import { useState, useEffect, useCallback } from 'react'
import { createPortal } from 'react-dom'
import Link from 'next/link'
import { useDocente } from '@/contexts/DocenteContext'
import { createClient } from '@/lib/supabase/client'

const DIAS = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie']
const HORAS = Array.from({ length: 14 }, (_, i) => {
  const h = 7 + i
  return `${String(h).padStart(2, '0')}:00`
}) // 07:00 – 20:00

interface AsignaturaItem { id: string; nombre: string; grupo: string; key: string }
interface HorarioItem {
  id?: string
  asignatura_id: string
  dia: number
  hora_inicio: string
  hora_fin: string
}

// Colores por índice de asignatura
const COLORES = [
  { bg: '#e8f4fd', border: '#90c8f0', text: '#0a84ff', dot: '#0a84ff' },  // Azul Apple
  { bg: '#e8faf0', border: '#86efac', text: '#30d158', dot: '#30d158' },  // Verde Apple
  { bg: '#f3eeff', border: '#c4b5fd', text: '#bf5af2', dot: '#bf5af2' },  // Morado Apple
  { bg: '#fff4e6', border: '#fbbf24', text: '#ff9f0a', dot: '#ff9f0a' },  // Naranja Apple
  { bg: '#e6faf8', border: '#5de0d8', text: '#5ac8fa', dot: '#5ac8fa' },  // Cian Apple
  { bg: '#ffeef0', border: '#fca5a5', text: '#ff453a', dot: '#ff453a' },  // Rojo Apple
]

export default function HorarioPage() {
  const { docente } = useDocente()
  const supabase = createClient()

  const [infoOpen, setInfoOpen]   = useState(false)
  const [horario, setHorario]     = useState<HorarioItem[]>([])
  const [loading, setLoading]     = useState(true)
  const [guardando, setGuardando] = useState(false)
  const [docenteDbId, setDocenteDbId]   = useState<string | null>(null)
  const [plantelDbId, setPlantelDbId]   = useState<string | null>(null)

  // Modal para añadir/editar
  const [modal, setModal] = useState<{
    dia: number; hora: string; asig: string; horaFin: string; editId?: string
  } | null>(null)

  // Obtener asignaturas únicas del docente
  // Cada combinación asignatura+grupo es una entrada única
  const asignaturas: AsignaturaItem[] = docente
    ? docente.asignaciones.map(a => ({
        id: a.asignatura_id,
        nombre: a.asignatura_nombre,
        grupo: a.grupo_numero,
        key: `${a.asignatura_id}-${a.grupo_id}`,
      }))
    : []

  const colorMap = Object.fromEntries(
    asignaturas.map((a, i) => [a.id, COLORES[i % COLORES.length]])
  )

  // cargar — acepta id explícito para no depender del estado asíncrono
  const cargar = useCallback(async (id?: string) => {
    const usarId = id ?? docenteDbId
    if (!usarId) return
    const { data } = await supabase
      .from('horario_docente')
      .select('id, asignatura_id, dia, hora_inicio, hora_fin')
      .eq('docente_id', usarId)
      .eq('activo', true)
    setHorario((data ?? []).map((h: HorarioItem) => ({
      ...h,
      hora_inicio: (h.hora_inicio as string).slice(0, 5),
      hora_fin:    (h.hora_fin as string).slice(0, 5),
    })))
  }, [docenteDbId, supabase])

  // Cargar ids del docente una sola vez y luego el horario
  useEffect(() => {
    let cancelled = false
    async function init() {
      if (!docente) return
      setLoading(true)
      const { data: { user } } = await supabase.auth.getUser()
      if (cancelled || !user) { setLoading(false); return }
      const { data: ud } = await supabase
        .from('usuarios').select('id, plantel_id').eq('auth_id', user.id).single()
      if (cancelled || !ud) { setLoading(false); return }
      if (!cancelled) { setDocenteDbId(ud.id); setPlantelDbId(ud.plantel_id) }
      const { data } = await supabase
        .from('horario_docente')
        .select('id, asignatura_id, dia, hora_inicio, hora_fin')
        .eq('docente_id', ud.id)
        .eq('activo', true)
      if (!cancelled) {
        setHorario((data ?? []).map((h: HorarioItem) => ({
          ...h,
          hora_inicio: (h.hora_inicio as string).slice(0, 5),
          hora_fin:    (h.hora_fin as string).slice(0, 5),
        })))
        setLoading(false)
      }
    }
    init()
    return () => { cancelled = true }
  }, [docente, supabase])

  // Verificar conflicto
  function hayConflicto(dia: number, horaInicio: string, horaFin: string, excludeId?: string) {
    return horario.some(h => {
      if (h.id === excludeId) return false
      if (h.dia !== dia) return false
      return horaInicio < h.hora_fin && horaFin > h.hora_inicio
    })
  }

  async function guardarBloque() {
    if (!modal || !docente) return
    const { dia, hora: horaInicio, asig, horaFin, editId } = modal
    if (hayConflicto(dia, horaInicio, horaFin, editId)) {
      alert('Ya hay una asignatura en ese horario')
      return
    }
    if (!docenteDbId || !plantelDbId) { alert('Sesión no cargada, recarga la página'); return }
    setGuardando(true)

    if (editId) {
      const { error } = await supabase
        .from('horario_docente')
        .update({ asignatura_id: asig, hora_inicio: horaInicio, hora_fin: horaFin })
        .eq('id', editId)
      if (error) { alert('Error al actualizar: ' + error.message); setGuardando(false); return }
    } else {
      const { error } = await supabase
        .from('horario_docente')
        .insert({
          docente_id: docenteDbId,
          asignatura_id: asig,
          plantel_id: plantelDbId,
          dia,
          hora_inicio: horaInicio,
          hora_fin: horaFin,
          activo: true,
        })
      if (error) { alert('Error al guardar: ' + error.message); setGuardando(false); return }
    }

    const { data: fresh } = await supabase
      .from('horario_docente')
      .select('id, asignatura_id, dia, hora_inicio, hora_fin')
      .eq('docente_id', docenteDbId!)
      .eq('activo', true)
    // Normalizar horas — Supabase devuelve '08:00:00', necesitamos '08:00'
    setHorario((fresh ?? []).map(h => ({
      ...h,
      hora_inicio: h.hora_inicio.slice(0, 5),
      hora_fin:    h.hora_fin.slice(0, 5),
    })))

    setGuardando(false)
    setModal(null)
  }

  async function eliminarBloque(id: string) {
    await supabase.from('horario_docente').delete().eq('id', id)
    await cargar()
  }

  // Obtener bloque para celda
  function bloqueEnCelda(dia: number, hora: string) {
    return horario.find(h => h.dia === dia && h.hora_inicio === hora)
  }

  const nombre = (id: string) => asignaturas.find(a => a.id === id)?.nombre ?? '?'

  return (
    <div className="page-slide-right p-4 md:p-8" style={{ maxWidth: 1400, margin: '0 auto' }}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.875rem', marginBottom: '1.5rem', justifyContent: 'space-between' }}>
        {/* Izquierda: back + título + toggle descripción */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.875rem', flex: 1, minWidth: 0 }}>
          <Link href="/docente/grupos"
            style={{ width: 38, height: 38, borderRadius: 12, background: 'white', border: '1px solid #e5e5ea', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#3a3a3c', flexShrink: 0, textDecoration: 'none', boxShadow: '0 1px 4px rgba(0,0,0,0.05)' }}>
            <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round">
              <path d="M19 12H5M12 5l-7 7 7 7"/>
            </svg>
          </Link>
          <div>
            <h1 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#1c1c1e', margin: 0 }}>Mi horario</h1>
            <button
              onClick={() => setInfoOpen(v => !v)}
              style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem', background: 'none', border: 'none', cursor: 'pointer', padding: 0, marginTop: '0.2rem' }}>
              <span style={{ fontSize: '0.72rem', color: '#2563eb', fontWeight: 500 }}>¿Cómo funciona?</span>
              <svg width="12" height="12" fill="none" stroke="#2563eb" strokeWidth="2.5" viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round"
                style={{ transition: 'transform 0.2s', transform: infoOpen ? 'rotate(180deg)' : 'rotate(0deg)' }}>
                <path d="M6 9l6 6 6-6"/>
              </svg>
            </button>
          </div>
        </div>

        {/* Botón guardar */}
        <Link href="/docente/grupos"
          style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', padding: '0.5rem 1rem', borderRadius: 10, background: '#1c1c1e', border: 'none', fontSize: '0.78rem', fontWeight: 600, color: 'white', textDecoration: 'none', boxShadow: '0 2px 8px rgba(0,0,0,0.15)', whiteSpace: 'nowrap', flexShrink: 0 }}>
          <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round">
            <path d="M20 6L9 17l-5-5"/>
          </svg>
          Guardar cambios
        </Link>
      </div>

      {/* Descripción desplegable */}
      {infoOpen && (
        <div style={{ background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: 12, padding: '0.875rem 1.125rem', marginBottom: '0.5rem', animation: 'fadeIn 0.2s ease' }}>
          <style>{`@keyframes fadeIn { from{opacity:0;transform:translateY(-4px)} to{opacity:1;transform:translateY(0)} }`}</style>
          <p style={{ fontSize: '0.78rem', color: '#1d4ed8', margin: 0, lineHeight: 1.6 }}>
            📅 <strong>Configura tu semana:</strong> toca cualquier celda vacía para asignar una materia a ese día y hora.<br/>
            ✏️ <strong>Editar o eliminar:</strong> toca un bloque ya guardado para modificarlo o borrarlo con el botón ✕.<br/>
            🔔 <strong>Aviso automático:</strong> al entrar a tus grupos verás un recordatorio de la clase que tienes en curso según este horario.
          </p>
        </div>
      )}

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '4rem' }}>
          <div style={{ width: 36, height: 36, borderRadius: '50%', border: '4px solid #e5e5ea', borderTopColor: '#3a3a3c', animation: 'spin 0.8s linear infinite' }}/>
          <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
        </div>
      ) : (
        /* Grid horario */
        <div style={{ background: 'white', borderRadius: 14, border: '1.5px solid #d1d1d6', overflow: 'auto', boxShadow: '0 2px 12px rgba(0,0,0,0.05)' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 520 }}>
            <thead>
              <tr style={{ borderBottom: '2px solid #d1d1d6' }}>
                <th style={{ padding: '0.75rem 1rem', fontSize: '0.65rem', fontWeight: 700, color: '#8e8e93', textTransform: 'uppercase', letterSpacing: '0.08em', textAlign: 'left', width: 64, background: '#f2f2f7' }}>Hora</th>
                {DIAS.map((d, i) => (
                  <th key={i} style={{ padding: '0.75rem 0.5rem', fontSize: '0.75rem', fontWeight: 700, color: '#1c1c1e', textAlign: 'center', background: '#f2f2f7' }}>{d}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {HORAS.map((hora, hi) => (
                <tr key={hora} style={{ borderBottom: '1px solid #e5e5ea' }}>
                  <td style={{ padding: '0.5rem 1rem', fontSize: '0.7rem', fontWeight: 600, color: '#8e8e93', whiteSpace: 'nowrap', background: '#f2f2f7', borderRight: '1px solid #d1d1d6' }}>
                    {hora}
                  </td>
                  {DIAS.map((_, di) => {
                    const dia = di + 1
                    const bloque = bloqueEnCelda(dia, hora)
                    const c = bloque ? colorMap[bloque.asignatura_id] : null
                    return (
                      <td key={di} style={{ padding: '0.3rem 0.4rem', textAlign: 'center', verticalAlign: 'middle' }}>
                        {bloque ? (
                          <div style={{ borderRadius: 8, background: c!.bg, border: `2px solid ${c!.border}`, padding: '0.4rem 0.5rem', cursor: 'pointer', position: 'relative', display: 'flex', flexDirection: 'column', gap: 2, boxShadow: `0 2px 8px ${c!.border}66` }}
                            onClick={() => setModal({ dia, hora, asig: bloque.asignatura_id, horaFin: bloque.hora_fin, editId: bloque.id })}>
                            {/* Botón eliminar */}
                            <button
                              onClick={e => { e.stopPropagation(); if (bloque.id) eliminarBloque(bloque.id) }}
                              style={{ position: 'absolute', top: 3, right: 3, width: 16, height: 16, borderRadius: '50%', background: 'rgba(0,0,0,0.12)', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: c!.text, fontSize: '0.6rem', lineHeight: 1, padding: 0 }}>
                              ✕
                            </button>
                            {/* Emoji + grupo */}
                            <div style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                              <span style={{ fontSize: '1rem', lineHeight: 1 }}>📚</span>
                              <p style={{ fontSize: '0.65rem', fontWeight: 700, color: c!.text, margin: 0, lineHeight: 1.3, paddingRight: 14 }}>
                                Gpo. {asignaturas.find(a => a.id === bloque.asignatura_id)?.grupo ?? ''}
                              </p>
                            </div>
                            <p style={{ fontSize: '0.6rem', color: c!.text, margin: 0, opacity: 0.85, lineHeight: 1.2, fontWeight: 500 }}>
                              {nombre(bloque.asignatura_id).length > 14 ? nombre(bloque.asignatura_id).slice(0, 14) + '…' : nombre(bloque.asignatura_id)}
                            </p>
                          </div>
                        ) : (
                          <div style={{ height: 36, borderRadius: 8, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'background 0.12s' }}
                            onClick={() => setModal({ dia, hora, asig: asignaturas[0]?.id ?? '', horaFin: HORAS[hi + 1] ?? hora })}
                            onMouseEnter={e => (e.currentTarget.style.background = '#f2f2f7')}
                            onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                            <span style={{ fontSize: '0.8rem', color: '#d1d1d6' }}>+</span>
                          </div>
                        )}
                      </td>
                    )
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal — centrado, solo asignatura — renderizado en body via portal */}
      {modal && typeof window !== 'undefined' && createPortal(
        <div
          style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(6px)', WebkitBackdropFilter: 'blur(6px)', zIndex: 99999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}
          onClick={() => setModal(null)}>
          <div
            style={{ background: 'white', borderRadius: 20, width: 'calc(100% - 2rem)', maxWidth: 520, padding: '2rem', boxShadow: '0 32px 80px rgba(0,0,0,0.25)', animation: 'modalIn 0.25s cubic-bezier(0.34,1.56,0.64,1)', position: 'relative', zIndex: 100000 }}
            onClick={e => e.stopPropagation()}>
            <style>{`@keyframes modalIn { from { opacity:0; transform:scale(0.92) translateY(12px) } to { opacity:1; transform:scale(1) translateY(0) } }`}</style>

            {/* Día y hora — contexto visual */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
              <div>
                <p style={{ fontSize: '0.65rem', fontWeight: 700, color: '#8e8e93', textTransform: 'uppercase', letterSpacing: '0.08em', margin: 0 }}>
                  {modal.editId ? 'Editar bloque' : 'Nuevo bloque'}
                </p>
                <p style={{ fontSize: '1.1rem', fontWeight: 700, color: '#1c1c1e', margin: '0.2rem 0 0' }}>
                  {DIAS[modal.dia - 1]} · {modal.hora} – {modal.horaFin}
                </p>
              </div>
              <button onClick={() => setModal(null)}
                style={{ width: 30, height: 30, borderRadius: '50%', background: '#f2f2f7', border: 'none', cursor: 'pointer', color: '#3a3a3c', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.85rem', flexShrink: 0 }}>
                ✕
              </button>
            </div>

            {/* Selector asignatura */}
            <p style={{ fontSize: '0.72rem', fontWeight: 600, color: '#3a3a3c', margin: '0 0 0.5rem' }}>¿Qué materia tienes en este horario?</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem', marginBottom: '1.5rem', maxHeight: 320, overflowY: 'auto' }}>
              {asignaturas.map(a => {
                const sel = modal.asig === a.id
                const c = colorMap[a.id]
                return (
                  <button key={a.key} onClick={() => setModal({ ...modal, asig: a.id })}
                    style={{ padding: '0.875rem 1rem', borderRadius: 12, border: `1.5px solid ${sel ? c.border : '#e5e5ea'}`, background: sel ? c.bg : 'white', cursor: 'pointer', textAlign: 'left', transition: 'all 0.12s', display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
                    <div style={{ width: 8, height: 8, borderRadius: '50%', background: sel ? c.dot : '#d1d1d6', flexShrink: 0 }}/>
                    <div>
                      <p style={{ fontSize: '0.8rem', fontWeight: sel ? 700 : 500, color: sel ? c.text : '#1c1c1e', margin: 0, lineHeight: 1.3 }}>{a.nombre}</p>
                      <p style={{ fontSize: '0.68rem', color: sel ? c.text : '#8e8e93', margin: '0.15rem 0 0', opacity: 0.8 }}>Grupo {a.grupo}</p>
                    </div>
                  </button>
                )
              })}
            </div>

            {/* Acciones */}
            <div style={{ display: 'flex', gap: '0.75rem' }}>
              {modal.editId && (
                <button onClick={() => { eliminarBloque(modal.editId!); setModal(null) }}
                  style={{ padding: '0.75rem 1rem', borderRadius: 12, border: '1px solid #fecaca', background: '#fef2f2', color: '#dc2626', fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer' }}>
                  Eliminar
                </button>
              )}
              <button onClick={guardarBloque} disabled={guardando || !modal.asig}
                style={{ flex: 1, padding: '0.75rem', borderRadius: 12, border: 'none', background: '#1c1c1e', color: 'white', fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer', opacity: guardando || !modal.asig ? 0.5 : 1 }}>
                {guardando ? 'Guardando…' : modal.editId ? 'Actualizar' : 'Confirmar'}
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  )
}