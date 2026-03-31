'use client'
import { useState, useRef, useEffect } from 'react'
import { createPortal } from 'react-dom'

type Notificacion = {
  id: string
  tipo: 'actualizacion' | 'aviso' | 'pago'
  titulo: string
  mensaje: string
  fecha: string
  leida: boolean
}

type DiaAsistencia = {
  fecha: string
  estado: 'P' | 'A' | 'J' | 'noClase'
}

type Alumno = {
  id: string
  nombre: string
  grupo: string
  semestre: number
  calificaciones: { parcial: 1 | 2 | 3; valor: number }[]
  promedioFinal: number
  asistencia: { parcial: 1 | 2 | 3; porcentaje: number }[]
  asistenciaFinal: number
  faltas: number
  historialDias: DiaAsistencia[]
}

function generarDias(faltas: number): DiaAsistencia[] {
  const dias: DiaAsistencia[] = []
  const inicio = new Date('2026-02-02')
  const fin    = new Date('2026-07-10')
  let faltasUsadas = 0
  const cur = new Date(inicio)
  while (cur <= fin) {
    const dow = cur.getDay()
    if (dow !== 0 && dow !== 6) {
      const iso = cur.toISOString().split('T')[0]
      if (iso >= '2026-04-06' && iso <= '2026-04-10') {
        dias.push({ fecha: iso, estado: 'noClase' })
      } else {
        let estado: 'P' | 'A' | 'J' = 'P'
        if (faltasUsadas < faltas) {
          const totalDias = dias.filter(d => d.estado !== 'noClase').length + 1
          if (totalDias % Math.max(1, Math.floor(90 / faltas)) === 0) {
            estado = faltasUsadas % 4 === 3 ? 'J' : 'A'
            faltasUsadas++
          }
        }
        dias.push({ fecha: iso, estado })
      }
    }
    cur.setDate(cur.getDate() + 1)
  }
  return dias
}

const alumnosMock: Alumno[] = [
  { id: '1', nombre: 'GARCÍA LÓPEZ ANA',          grupo: '101', semestre: 1, calificaciones: [{ parcial: 1, valor: 92 }, { parcial: 2, valor: 88 }, { parcial: 3, valor: 94 }], promedioFinal: 91, asistencia: [{ parcial: 1, porcentaje: 95 }, { parcial: 2, porcentaje: 90 }, { parcial: 3, porcentaje: 98 }], asistenciaFinal: 94, faltas: 3,  historialDias: generarDias(3)  },
  { id: '2', nombre: 'MARTÍNEZ RUIZ CARLOS',       grupo: '101', semestre: 1, calificaciones: [{ parcial: 1, valor: 78 }, { parcial: 2, valor: 75 }, { parcial: 3, valor: 80 }], promedioFinal: 77, asistencia: [{ parcial: 1, porcentaje: 72 }, { parcial: 2, porcentaje: 70 }, { parcial: 3, porcentaje: 75 }], asistenciaFinal: 72, faltas: 12, historialDias: generarDias(12) },
  { id: '3', nombre: 'PÉREZ TORRES DIANA',         grupo: '301', semestre: 3, calificaciones: [{ parcial: 1, valor: 85 }, { parcial: 2, valor: 82 }, { parcial: 3, valor: 87 }], promedioFinal: 85, asistencia: [{ parcial: 1, porcentaje: 88 }, { parcial: 2, porcentaje: 85 }, { parcial: 3, porcentaje: 92 }], asistenciaFinal: 88, faltas: 6,  historialDias: generarDias(6)  },
  { id: '4', nombre: 'LÓPEZ SÁNCHEZ EDUARDO',      grupo: '301', semestre: 3, calificaciones: [{ parcial: 1, valor: 96 }, { parcial: 2, valor: 94 }, { parcial: 3, valor: 97 }], promedioFinal: 96, asistencia: [{ parcial: 1, porcentaje: 100}, { parcial: 2, porcentaje: 98 }, { parcial: 3, porcentaje: 100}], asistenciaFinal: 99, faltas: 0,  historialDias: generarDias(0)  },
  { id: '5', nombre: 'HERNÁNDEZ CRUZ FERNANDA',    grupo: '501', semestre: 5, calificaciones: [{ parcial: 1, valor: 71 }, { parcial: 2, valor: 68 }, { parcial: 3, valor: 73 }], promedioFinal: 71, asistencia: [{ parcial: 1, porcentaje: 80 }, { parcial: 2, porcentaje: 75 }, { parcial: 3, porcentaje: 82 }], asistenciaFinal: 79, faltas: 9,  historialDias: generarDias(9)  },
  { id: '6', nombre: 'RAMÍREZ VEGA GABRIEL',       grupo: '501', semestre: 5, calificaciones: [{ parcial: 1, valor: 60 }, { parcial: 2, valor: 58 }, { parcial: 3, valor: 62 }], promedioFinal: 60, asistencia: [{ parcial: 1, porcentaje: 65 }, { parcial: 2, porcentaje: 62 }, { parcial: 3, porcentaje: 68 }], asistenciaFinal: 65, faltas: 18, historialDias: generarDias(18) },
]

const notificacionesMock: Notificacion[] = [
  { id: '1', tipo: 'pago',          titulo: 'Pago pendiente',                mensaje: 'Tu suscripción vence en 3 días. Realiza tu pago para mantener el acceso al sistema.', fecha: 'Hoy',    leida: false },
  { id: '2', tipo: 'actualizacion', titulo: 'Nueva actualización disponible', mensaje: 'EduControl v1.2 ya está activo. Ahora puedes generar boletas en PDF directamente.',   fecha: 'Ayer',   leida: false },
  { id: '3', tipo: 'aviso',         titulo: 'Mantenimiento programado',       mensaje: 'El domingo 23 de marzo de 2:00 a 4:00 AM el sistema estará en mantenimiento.',        fecha: '15 Mar', leida: true  },
]

const iconoTipo = {
  pago:          { bg: '#fef2f2', color: '#dc2626', svg: <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/> },
  actualizacion: { bg: '#eff6ff', color: '#2563eb', svg: <><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></> },
  aviso:         { bg: '#fffbeb', color: '#d97706', svg: <><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></> },
}

const MESES_ES = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre']
const DIAS_SEM = ['L','M','X','J','V','S','D']

function colorNota(v: number) { return v >= 70 ? '#16a34a' : '#dc2626' }
function bgNota(v: number)    { return v >= 70 ? '#f0fdf4' : '#fef2f2' }

// ─── Calendario de asistencia ─────────────────────────────────────────────────
function CalendarioAsistencia({ alumno, onVolver }: { alumno: Alumno; onVolver: () => void }) {
  const mesesDisponibles = [...new Set(alumno.historialDias.map(d => d.fecha.slice(0, 7)))].sort()
  const [mesActual, setMesActual] = useState(mesesDisponibles[0] ?? '2026-02')

  const idxMes = mesesDisponibles.indexOf(mesActual)
  const [anio, mes] = mesActual.split('-').map(Number)
  const primerDia   = new Date(anio, mes - 1, 1)
  const diasEnMes   = new Date(anio, mes, 0).getDate()
  const offset      = (primerDia.getDay() + 6) % 7

  const diasDelMes = alumno.historialDias.filter(d => d.fecha.startsWith(mesActual))
  const mapaEstado: Record<string, DiaAsistencia['estado']> = {}
  diasDelMes.forEach(d => { mapaEstado[d.fecha] = d.estado })

  const totalClase   = alumno.historialDias.filter(d => d.estado !== 'noClase').length
  const presentes    = alumno.historialDias.filter(d => d.estado === 'P').length
  const ausentes     = alumno.historialDias.filter(d => d.estado === 'A').length
  const justificados = alumno.historialDias.filter(d => d.estado === 'J').length

  const coloresDia: Record<DiaAsistencia['estado'], { bg: string; color: string; border: string }> = {
    P:       { bg: '#f0fdf4', color: '#16a34a', border: '#bbf7d0' },
    A:       { bg: '#fef2f2', color: '#dc2626', border: '#fecaca' },
    J:       { bg: '#fffbeb', color: '#d97706', border: '#fde68a' },
    noClase: { bg: '#f8fafc', color: '#cbd5e1', border: '#f1f5f9' },
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div style={{ background: 'linear-gradient(135deg, #1e3a5f, #2563eb)', borderRadius: '1.25rem 1.25rem 0 0', padding: '1.25rem 1.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
          <button onClick={onVolver} style={{ background: 'rgba(255,255,255,0.2)', border: 'none', cursor: 'pointer', width: '32px', height: '32px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', flexShrink: 0 }}>
            <svg width="16" height="16" fill="none" stroke="white" strokeWidth="2.5" viewBox="0 0 24 24"><path d="M19 12H5M12 5l-7 7 7 7" strokeLinecap="round" strokeLinejoin="round"/></svg>
          </button>
          <div>
            <p style={{ fontSize: '0.875rem', fontWeight: 700, color: 'white', margin: 0 }}>Historial de asistencia</p>
            <p style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.75)', margin: '0.125rem 0 0' }}>{alumno.nombre}</p>
          </div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: '0.5rem' }}>
          {[
            { label: 'Días clase', value: totalClase,    color: 'rgba(255,255,255,0.9)' },
            { label: 'Presentes',  value: presentes,     color: '#86efac' },
            { label: 'Ausentes',   value: ausentes,      color: '#fca5a5' },
            { label: 'Justific.',  value: justificados,  color: '#fde68a' },
          ].map(s => (
            <div key={s.label} style={{ background: 'rgba(255,255,255,0.12)', borderRadius: '0.625rem', padding: '0.5rem', textAlign: 'center' }}>
              <p style={{ fontSize: '1.1rem', fontWeight: 700, color: s.color, margin: 0, fontFamily: 'Outfit, sans-serif' }}>{s.value}</p>
              <p style={{ fontSize: '0.6rem', color: 'rgba(255,255,255,0.65)', margin: 0, textTransform: 'uppercase', letterSpacing: '0.04em', fontWeight: 600 }}>{s.label}</p>
            </div>
          ))}
        </div>
      </div>

      <div style={{ overflowY: 'auto', flex: 1, padding: '1.25rem 1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <button onClick={() => idxMes > 0 && setMesActual(mesesDisponibles[idxMes - 1])} disabled={idxMes === 0}
            style={{ width: '32px', height: '32px', borderRadius: '50%', border: 'none', background: idxMes === 0 ? '#f1f5f9' : '#e2e8f0', cursor: idxMes === 0 ? 'default' : 'pointer', color: '#475569', fontSize: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>‹</button>
          <p style={{ fontSize: '0.875rem', fontWeight: 700, color: '#1e3a5f', fontFamily: 'Outfit, sans-serif' }}>{MESES_ES[mes - 1]} {anio}</p>
          <button onClick={() => idxMes < mesesDisponibles.length - 1 && setMesActual(mesesDisponibles[idxMes + 1])} disabled={idxMes === mesesDisponibles.length - 1}
            style={{ width: '32px', height: '32px', borderRadius: '50%', border: 'none', background: idxMes === mesesDisponibles.length - 1 ? '#f1f5f9' : '#e2e8f0', cursor: idxMes === mesesDisponibles.length - 1 ? 'default' : 'pointer', color: '#475569', fontSize: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>›</button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '3px' }}>
          {DIAS_SEM.map(d => (
            <div key={d} style={{ textAlign: 'center', fontSize: '0.65rem', fontWeight: 700, color: '#94a3b8', padding: '2px 0', textTransform: 'uppercase' }}>{d}</div>
          ))}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '3px' }}>
          {Array.from({ length: offset }).map((_, i) => <div key={`e-${i}`} />)}
          {Array.from({ length: diasEnMes }, (_, i) => {
            const day = i + 1
            const iso = `${anio}-${String(mes).padStart(2,'0')}-${String(day).padStart(2,'0')}`
            const est = mapaEstado[iso]
            const col = est ? coloresDia[est] : null
            const esFinSemana = [0, 6].includes(new Date(iso).getDay())
            return (
              <div key={day} style={{ aspectRatio: '1', borderRadius: '0.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem', fontWeight: col ? 700 : 400, background: col ? col.bg : esFinSemana ? 'transparent' : '#f8fafc', color: col ? col.color : esFinSemana ? '#e2e8f0' : '#94a3b8', border: col ? `1px solid ${col.border}` : '1px solid transparent', position: 'relative' }}>
                {day}
                {est && est !== 'noClase' && <span style={{ position: 'absolute', bottom: '2px', right: '2px', width: '5px', height: '5px', borderRadius: '50%', background: col!.color }} />}
              </div>
            )
          })}
        </div>

        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
          {[{ color: '#16a34a', bg: '#f0fdf4', label: 'Presente' }, { color: '#dc2626', bg: '#fef2f2', label: 'Ausente' }, { color: '#d97706', bg: '#fffbeb', label: 'Justificado' }, { color: '#cbd5e1', bg: '#f8fafc', label: 'No hubo clase' }].map(l => (
            <div key={l.label} style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
              <div style={{ width: '12px', height: '12px', borderRadius: '3px', background: l.bg, border: `1px solid ${l.color}20` }} />
              <span style={{ fontSize: '0.7rem', color: '#64748b' }}>{l.label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// ─── Card boleta alumno ───────────────────────────────────────────────────────
type ParcialKey = 1 | 2 | 3 | 'final'

function CardAlumno({ alumno, onCerrar }: { alumno: Alumno; onCerrar: () => void }) {
  const [vistaCalendario, setVistaCalendario] = useState(false)
  const [parcialActivo, setParcialActivo]     = useState<ParcialKey>(1)
  const [btnExpandido, setBtnExpandido]       = useState(false)
  const btnTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  function handleBtnEnter() {
    if (btnTimer.current) clearTimeout(btnTimer.current)
    setBtnExpandido(true)
  }
  function handleBtnLeave() {
    btnTimer.current = setTimeout(() => setBtnExpandido(false), 120)
  }

  const tabs: { key: ParcialKey; label: string }[] = [
    { key: 1,       label: '1er Parcial' },
    { key: 2,       label: '2do Parcial' },
    { key: 3,       label: '3er Parcial' },
    { key: 'final', label: 'Final'       },
  ]

  // Datos del parcial activo
  const calActiva = parcialActivo === 'final'
    ? alumno.promedioFinal
    : alumno.calificaciones.find(c => c.parcial === parcialActivo)?.valor ?? 0

  const asistActiva = parcialActivo === 'final'
    ? alumno.asistenciaFinal
    : alumno.asistencia.find(a => a.parcial === parcialActivo)?.porcentaje ?? 0

  // Faltas aproximadas por parcial (30 días de clase por parcial aprox)
  const diasPorParcial = 30
  const faltasParcial = parcialActivo === 'final'
    ? alumno.faltas
    : Math.round((1 - asistActiva / 100) * diasPorParcial)

  const [descargando, setDescargando] = useState(false)
  const [descargado,  setDescargado]  = useState(false)

  function handleDescargar() {
    if (descargando || descargado) return
    setDescargando(true)
    setTimeout(() => {
      setDescargando(false)
      setDescargado(true)
      setTimeout(() => setDescargado(false), 2500)
    }, 1800)
  }

  if (typeof window === 'undefined') return null

  return createPortal(
    <div onClick={onCerrar} style={{ position: 'fixed', inset: 0, zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(3px)', WebkitBackdropFilter: 'blur(3px)' }}>
      <div onClick={e => e.stopPropagation()} style={{ background: 'white', borderRadius: '1.25rem', boxShadow: '0 20px 60px rgba(0,0,0,0.2)', width: '520px', maxHeight: '88vh', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

        {vistaCalendario
          ? <CalendarioAsistencia alumno={alumno} onVolver={() => setVistaCalendario(false)} />
          : (
            <>
              {/* Header */}
              <div style={{ background: 'linear-gradient(135deg, #1e3a5f, #2563eb)', borderRadius: '1.25rem 1.25rem 0 0', padding: '1.25rem 1.5rem', position: 'relative' }}>
                <button onClick={onCerrar} style={{ position: 'absolute', top: '1rem', right: '1rem', background: 'rgba(255,255,255,0.2)', border: 'none', cursor: 'pointer', width: '28px', height: '28px', borderRadius: '50%', color: 'white', fontSize: '1rem', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>✕</button>

                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
                  <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: 'rgba(255,255,255,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem', fontWeight: 700, color: 'white', flexShrink: 0 }}>
                    {alumno.nombre.charAt(0)}
                  </div>
                  <div>
                    <p style={{ fontSize: '0.9375rem', fontWeight: 700, color: 'white', margin: 0, fontFamily: 'Outfit, sans-serif' }}>{alumno.nombre}</p>
                    <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.3rem' }}>
                      <span style={{ fontSize: '0.7rem', background: 'rgba(255,255,255,0.2)', color: 'white', padding: '0.15rem 0.5rem', borderRadius: '9999px', fontWeight: 600 }}>Grupo {alumno.grupo}</span>
                      <span style={{ fontSize: '0.7rem', background: 'rgba(255,255,255,0.2)', color: 'white', padding: '0.15rem 0.5rem', borderRadius: '9999px', fontWeight: 600 }}>{alumno.semestre}° Semestre</span>
                    </div>
                  </div>
                </div>

                {/* Tabs parciales */}
                <div style={{ display: 'flex', gap: '0.375rem' }}>
                  {tabs.map(t => (
                    <button key={t.key} onClick={() => setParcialActivo(t.key)}
                      style={{ flex: 1, padding: '0.375rem 0', fontSize: '0.7rem', fontWeight: 600, borderRadius: '0.5rem', border: 'none', cursor: 'pointer', transition: 'all 0.15s', background: parcialActivo === t.key ? 'white' : 'rgba(255,255,255,0.15)', color: parcialActivo === t.key ? '#1e3a5f' : 'rgba(255,255,255,0.8)' }}>
                      {t.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Cuerpo */}
              <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>

                {/* Calificación */}
                <div style={{ background: bgNota(calActiva), borderRadius: '1rem', padding: '1.25rem', textAlign: 'center', border: `1px solid ${calActiva >= 70 ? '#bbf7d0' : '#fecaca'}` }}>
                  <p style={{ fontSize: '0.7rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.08em', margin: '0 0 0.5rem' }}>
                    Calificación — {tabs.find(t => t.key === parcialActivo)?.label}
                  </p>
                  <p style={{ fontSize: '3.5rem', fontWeight: 700, color: colorNota(calActiva), margin: 0, fontFamily: 'Outfit, sans-serif', lineHeight: 1 }}>
                    {calActiva}
                  </p>
                  <p style={{ fontSize: '0.75rem', color: colorNota(calActiva), margin: '0.5rem 0 0', fontWeight: 600 }}>
                    {calActiva >= 90 ? 'Excelente' : calActiva >= 70 ? 'Aprobado' : 'Reprobado'}
                  </p>
                </div>

                {/* Faltas + botón historial */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: '0.75rem', alignItems: 'stretch' }}>
                  <div style={{ background: faltasParcial === 0 ? '#f0fdf4' : faltasParcial <= 3 ? '#fffbeb' : '#fef2f2', borderRadius: '1rem', padding: '1rem 1.25rem', border: `1px solid ${faltasParcial === 0 ? '#bbf7d0' : faltasParcial <= 3 ? '#fde68a' : '#fecaca'}` }}>
                    <p style={{ fontSize: '0.7rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.08em', margin: '0 0 0.375rem' }}>
                      Faltas en este período
                    </p>
                    <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.375rem' }}>
                      <p style={{ fontSize: '2.25rem', fontWeight: 700, margin: 0, fontFamily: 'Outfit, sans-serif', color: faltasParcial === 0 ? '#16a34a' : faltasParcial <= 3 ? '#d97706' : '#dc2626', lineHeight: 1 }}>
                        {faltasParcial}
                      </p>
                      <p style={{ fontSize: '0.8rem', color: '#94a3b8', margin: 0 }}>faltas</p>
                    </div>
                    <p style={{ fontSize: '0.7rem', margin: '0.375rem 0 0', fontWeight: 600, color: faltasParcial === 0 ? '#16a34a' : faltasParcial <= 3 ? '#d97706' : '#dc2626' }}>
                      {asistActiva}% de asistencia
                    </p>
                  </div>

                  {/* Botón ver historial — círculo que se expande */}
                  <button
                    onClick={() => setVistaCalendario(true)}
                    onMouseEnter={handleBtnEnter}
                    onMouseLeave={handleBtnLeave}
                    style={{
                      background: '#1e3a5f', border: 'none', cursor: 'pointer',
                      borderRadius: btnExpandido ? '0.875rem' : '50%',
                      width:   btnExpandido ? 'auto' : '48px',
                      height:  '48px',
                      minWidth: btnExpandido ? '180px' : '48px',
                      alignSelf: 'center',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      gap: '0.5rem', padding: btnExpandido ? '0 1.25rem' : '0',
                      transition: 'all 0.25s ease',
                      boxShadow: '0 2px 8px rgba(30,58,95,0.25)',
                      overflow: 'hidden', whiteSpace: 'nowrap',
                    }}>
                    <svg width="16" height="16" fill="none" stroke="white" strokeWidth="2" viewBox="0 0 24 24" style={{ flexShrink: 0 }}>
                      <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
                      <line x1="16" y1="2" x2="16" y2="6"/>
                      <line x1="8" y1="2" x2="8" y2="6"/>
                      <line x1="3" y1="10" x2="21" y2="10"/>
                    </svg>
                    {btnExpandido && (
                      <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'white' }}>
                        Ver historial
                      </span>
                    )}
                  </button>
                </div>
                {/* Botón descargar PDF */}
                <button onClick={handleDescargar}
                  style={{
                    width: '100%', padding: '0.75rem', borderRadius: '0.875rem',
                    cursor: descargando || descargado ? 'default' : 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.625rem',
                    fontSize: '0.875rem', fontWeight: 600,
                    background: descargado ? '#16a34a' : descargando ? '#f1f5f9' : '#fef2f2',
                    color:      descargado ? 'white'   : descargando ? '#94a3b8' : '#dc2626',
                    border:     descargado ? 'none' : `1px solid ${descargando ? '#e2e8f0' : '#fecaca'}`,
                    transition: 'all 0.3s',
                  }}
                  onMouseEnter={e => { if (!descargando && !descargado) { e.currentTarget.style.background = '#dc2626'; e.currentTarget.style.color = 'white'; e.currentTarget.style.border = 'none' } }}
                  onMouseLeave={e => { if (!descargando && !descargado) { e.currentTarget.style.background = '#fef2f2'; e.currentTarget.style.color = '#dc2626'; e.currentTarget.style.border = '1px solid #fecaca' } }}>

                  {descargando ? (
                    <>
                      {/* Spinner */}
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2.5"
                        style={{ animation: 'spin 0.8s linear infinite' }}>
                        <path d="M21 12a9 9 0 1 1-6.219-8.56" strokeLinecap="round"/>
                      </svg>
                      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
                      Generando PDF...
                    </>
                  ) : descargado ? (
                    <>
                      <svg width="16" height="16" fill="none" stroke="white" strokeWidth="2.5" viewBox="0 0 24 24">
                        <path d="M20 6L9 17l-5-5" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                      ¡PDF descargado!
                    </>
                  ) : (
                    <>
                      <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" strokeLinecap="round"/>
                        <polyline points="14 2 14 8 20 8"/>
                        <line x1="12" y1="18" x2="12" y2="12"/>
                        <polyline points="9 15 12 18 15 15"/>
                      </svg>
                      Descargar boleta PDF — {tabs.find(t => t.key === parcialActivo)?.label}
                    </>
                  )}
                </button>
              </div>
            </>
          )
        }
      </div>
    </div>,
    document.body
  )
}


export default function Header({ titulo }: { titulo: string }) {
  const [notifs, setNotifs]                   = useState<Notificacion[]>(notificacionesMock)
  const [panelAbierto, setPanelAbierto]       = useState(false)
  const [busqueda, setBusqueda]               = useState('')
  const [sugerencias, setSugerencias]         = useState<Alumno[]>([])
  const [alumnoSelec, setAlumnoSelec]         = useState<Alumno | null>(null)
  const [dropdownAbierto, setDropdownAbierto] = useState(false)
  const [searchExpanded, setSearchExpanded]   = useState(false)
  const busquedaRef    = useRef<HTMLDivElement>(null)
  const searchInputRef = useRef<HTMLInputElement>(null)

  const noLeidas = notifs.filter(n => !n.leida).length

  function marcarLeida(id: string)  { setNotifs(prev => prev.map(n => n.id === id ? { ...n, leida: true } : n)) }
  function marcarTodasLeidas()      { setNotifs(prev => prev.map(n => ({ ...n, leida: true }))) }

  function handleBusqueda(valor: string) {
    const upper = valor.toUpperCase()
    setBusqueda(upper)
    if (upper.trim().length < 2) { setSugerencias([]); setDropdownAbierto(false); return }
    const resultados = alumnosMock.filter(a => a.nombre.includes(upper.trim()) || a.grupo.includes(upper.trim()))
    setSugerencias(resultados)
    setDropdownAbierto(true)
  }

  function seleccionarAlumno(a: Alumno) {
    setAlumnoSelec(a); setBusqueda(''); setSugerencias([]); setDropdownAbierto(false)
  }

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (busquedaRef.current && !busquedaRef.current.contains(e.target as Node)) setDropdownAbierto(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  return (
    <div className="px-4 pt-4 sticky top-0 z-40">
      <header className="flex items-center justify-between px-6 py-3 rounded-2xl"
        style={{ background: 'rgba(255,255,255,0.75)', backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)', border: '1px solid rgba(255,255,255,0.6)', boxShadow: '0 2px 12px rgba(60,80,120,0.07)' }}>

        <h1 className="text-base font-semibold tracking-tight" style={{ color: '#1e3a5f', fontFamily: 'DM Sans, sans-serif' }}>
          {titulo}
        </h1>

        <div className="flex items-center gap-3">

          {/* Buscador — colapsable estilo Apple */}
          <div ref={busquedaRef} className="relative">
            <div
              onMouseEnter={() => { setSearchExpanded(true); setTimeout(() => searchInputRef.current?.focus(), 50) }}
              onMouseLeave={() => { if (!busqueda) setSearchExpanded(false) }}
              style={{
                display:'flex', alignItems:'center',
                height:'38px',
                width: searchExpanded ? '300px' : '38px',
                borderRadius:'0.875rem',
                border:'1px solid rgba(180,200,230,0.5)',
                background:'rgba(255,255,255,0.6)',
                backdropFilter:'blur(8px)',
                WebkitBackdropFilter:'blur(8px)',
                transition:'width 0.3s cubic-bezier(0.4,0,0.2,1), box-shadow 0.2s',
                overflow:'hidden',
                cursor: searchExpanded ? 'text' : 'pointer',
                boxShadow: searchExpanded ? '0 0 0 2px #bfdbfe' : 'none',
                flexShrink: 0,
              }}>
              <div style={{ width:'38px', height:'38px', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                <svg width="14" height="14" fill="none" stroke="#94a3b8" strokeWidth="2" viewBox="0 0 24 24">
                  <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
                </svg>
              </div>
              <input
                ref={searchInputRef}
                type="text"
                value={busqueda}
                onChange={e => handleBusqueda(e.target.value)}
                onFocus={() => setSearchExpanded(true)}
                onBlur={() => { if (!busqueda) setSearchExpanded(false) }}
                placeholder="Buscar alumnos, grupos o reportes..."
                style={{ border:'none', outline:'none', fontSize:'0.8125rem', color:'#334155', background:'transparent', width:'calc(100% - 38px)', paddingRight:'0.75rem', opacity: searchExpanded ? 1 : 0, transition:'opacity 0.2s', fontFamily:'DM Sans, sans-serif' }}
              />
              {busqueda && searchExpanded && (
                <button onClick={() => { handleBusqueda('') }}
                  style={{ background:'none', border:'none', cursor:'pointer', color:'#94a3b8', paddingRight:'0.5rem', fontSize:'1rem', lineHeight:1, flexShrink:0 }}>✕</button>
              )}
            </div>

            {dropdownAbierto && sugerencias.length > 0 && (
              <div className="absolute left-0 top-full mt-1.5 bg-white rounded-2xl shadow-xl overflow-hidden"
                style={{ width: '320px', border: '1px solid #e2e8f0', zIndex: 100 }}>
                <p className="px-4 pt-3 pb-1 text-xs font-semibold uppercase tracking-wider" style={{ color: '#94a3b8' }}>Alumnos encontrados</p>
                {sugerencias.map(a => (
                  <button key={a.id} onClick={() => seleccionarAlumno(a)}
                    className="w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors"
                    style={{ borderTop: '1px solid #f8fafc' }}
                    onMouseEnter={e => (e.currentTarget.style.background = '#f8fafc')}
                    onMouseLeave={e => (e.currentTarget.style.background = 'white')}>
                    <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0" style={{ background: '#1e3a5f' }}>
                      {a.nombre.charAt(0)}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold truncate" style={{ color: '#1e3a5f' }}>{a.nombre}</p>
                      <p className="text-xs" style={{ color: '#94a3b8' }}>Grupo {a.grupo} · {a.semestre}° Sem · Prom: {a.promedioFinal}</p>
                    </div>
                    <svg width="14" height="14" fill="none" stroke="#94a3b8" strokeWidth="2" viewBox="0 0 24 24" className="shrink-0 ml-auto">
                      <path d="M5 12h14M13 6l6 6-6 6" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </button>
                ))}
                <p className="px-4 py-2 text-xs text-center" style={{ color: '#cbd5e1', borderTop: '1px solid #f1f5f9' }}>Clic para ver boleta completa</p>
              </div>
            )}
            {dropdownAbierto && sugerencias.length === 0 && busqueda.trim().length >= 2 && (
              <div className="absolute left-0 top-full mt-1.5 bg-white rounded-2xl shadow-xl px-4 py-5 text-center"
                style={{ width: '280px', border: '1px solid #e2e8f0', zIndex: 100 }}>
                <p className="text-sm" style={{ color: '#94a3b8' }}>No se encontraron alumnos</p>
              </div>
            )}
          </div>

          {/* Notificaciones */}
          <div className="relative">
            <button onClick={() => setPanelAbierto(prev => !prev)}
              className="relative w-9 h-9 rounded-xl flex items-center justify-center transition-colors"
              style={{ background: panelAbierto ? 'rgba(255,255,255,0.9)' : 'rgba(255,255,255,0.6)', border: '1px solid rgba(180,200,230,0.4)' }}
              onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.9)')}
              onMouseLeave={e => { if (!panelAbierto) e.currentTarget.style.background = 'rgba(255,255,255,0.6)' }}>
              <svg width="16" height="16" fill="none" stroke="#64748b" strokeWidth="1.8" viewBox="0 0 24 24">
                <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
                <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
              </svg>
              {noLeidas > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full flex items-center justify-center text-white"
                  style={{ background: '#dc2626', fontSize: '9px', fontWeight: 700 }}>
                  {noLeidas}
                </span>
              )}
            </button>

            {panelAbierto && (
              <div className="absolute right-0 top-full mt-2 bg-white rounded-2xl shadow-xl z-50 overflow-hidden"
                style={{ width: '340px', border: '1px solid #e2e8f0' }}>
                <div className="flex items-center justify-between px-4 py-3 border-b" style={{ borderColor: '#f1f5f9' }}>
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-bold" style={{ color: '#1e3a5f' }}>Notificaciones</p>
                    {noLeidas > 0 && <span className="text-xs font-semibold px-1.5 py-0.5 rounded-full text-white" style={{ background: '#dc2626' }}>{noLeidas}</span>}
                  </div>
                  {noLeidas > 0 && (
                    <button onClick={marcarTodasLeidas} className="text-xs font-medium transition" style={{ color: '#3b82f6' }}
                      onMouseEnter={e => (e.currentTarget.style.color = '#1d4ed8')}
                      onMouseLeave={e => (e.currentTarget.style.color = '#3b82f6')}>
                      Marcar todas como leídas
                    </button>
                  )}
                </div>
                <div className="divide-y" style={{ maxHeight: '360px', overflowY: 'auto' }}>
                  {notifs.map(n => {
                    const icono = iconoTipo[n.tipo]
                    return (
                      <div key={n.id} onClick={() => marcarLeida(n.id)}
                        className="flex gap-3 px-4 py-3 cursor-pointer transition-colors"
                        style={{ background: n.leida ? 'white' : '#f8faff' }}
                        onMouseEnter={e => (e.currentTarget.style.background = '#f8fafc')}
                        onMouseLeave={e => (e.currentTarget.style.background = n.leida ? 'white' : '#f8faff')}>
                        <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 mt-0.5" style={{ background: icono.bg }}>
                          <svg width="16" height="16" fill="none" stroke={icono.color} strokeWidth="1.8" viewBox="0 0 24 24">{icono.svg}</svg>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <p className="text-xs font-bold" style={{ color: '#1e3a5f' }}>{n.titulo}</p>
                            {!n.leida && <span className="w-2 h-2 rounded-full shrink-0 mt-1" style={{ background: '#3b82f6' }} />}
                          </div>
                          <p className="text-xs mt-0.5 leading-relaxed" style={{ color: '#64748b' }}>{n.mensaje}</p>
                          <p className="text-xs mt-1" style={{ color: '#cbd5e1' }}>{n.fecha}</p>
                        </div>
                      </div>
                    )
                  })}
                </div>
                <div className="px-4 py-2.5 border-t text-center" style={{ borderColor: '#f1f5f9' }}>
                  <p className="text-xs" style={{ color: '#94a3b8' }}>Notificaciones enviadas por Dinoti Platforms</p>
                </div>
              </div>
            )}
          </div>

          {/* Avatar */}
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold" style={{ background: '#1e3a5f' }}>D</div>
            <span className="text-sm font-medium" style={{ color: '#334155' }}>Dir. Gral.</span>
          </div>
        </div>
      </header>

      {alumnoSelec && <CardAlumno alumno={alumnoSelec} onCerrar={() => setAlumnoSelec(null)} />}
    </div>
  )
}