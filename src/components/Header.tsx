'use client'

export default function Header({ titulo }: { titulo: string }) {
  return (
    <div className="px-4 pt-4">
      <header
        className="flex items-center justify-between px-6 py-3 rounded-2xl"
        style={{
          background: 'rgba(255,255,255,0.75)',
          backdropFilter: 'blur(16px)',
          WebkitBackdropFilter: 'blur(16px)',
          border: '1px solid rgba(255,255,255,0.6)',
          boxShadow: '0 2px 12px rgba(60,80,120,0.07)',
        }}
      >
        <h1
          className="text-base font-semibold tracking-tight"
          style={{ color: '#1e3a5f', fontFamily: 'DM Sans, sans-serif' }}
        >
          {titulo}
        </h1>

        <div className="flex items-center gap-3">
          {/* Buscador con ícono */}
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none">
              <svg width="14" height="14" fill="none" stroke="#94a3b8" strokeWidth="2" viewBox="0 0 24 24">
                <circle cx="11" cy="11" r="8"/>
                <path d="m21 21-4.35-4.35"/>
              </svg>
            </span>
            <input
              type="text"
              placeholder="Buscar alumnos, grupos o reportes..."
              className="pl-9 pr-4 py-2 text-sm rounded-xl w-72 focus:outline-none focus:ring-2 focus:ring-blue-300"
              style={{
                background: 'rgba(255,255,255,0.6)',
                border: '1px solid rgba(180,200,230,0.5)',
                color: '#334155',
              }}
            />
          </div>

          {/* Notificaciones */}
          <button
            className="relative w-9 h-9 rounded-xl flex items-center justify-center transition-colors"
            style={{ background: 'rgba(255,255,255,0.6)', border: '1px solid rgba(180,200,230,0.4)' }}
            onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.9)')}
            onMouseLeave={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.6)')}
          >
            <svg width="16" height="16" fill="none" stroke="#64748b" strokeWidth="1.8" viewBox="0 0 24 24">
              <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
              <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
            </svg>
            <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full" style={{ background: '#3b82f6' }} />
          </button>

          {/* Avatar */}
          <div className="flex items-center gap-2.5">
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold"
              style={{ background: '#1e3a5f' }}
            >
              D
            </div>
            <span className="text-sm font-medium" style={{ color: '#334155' }}>Dir. Gral.</span>
          </div>
        </div>
      </header>
    </div>
  )
}