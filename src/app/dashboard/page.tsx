'use client'
import Header from '@/components/Header'

const stats = [
  { label: 'POBLACIÓN', value: '840', suffix: 'alumnos', color: 'text-gray-800' },
  { label: 'PROMEDIO GRAL', value: '8.7', suffix: '', color: 'text-blue-600' },
  { label: 'ASISTENCIA MEDIA', value: '89.7', suffix: '%', color: 'text-green-500' },
]

export default function DashboardPage() {
  return (
    <div className="flex flex-col h-full">
      <Header titulo="Centro Estadístico" />

      <div className="flex gap-4 p-4 flex-1">
        {/* Panel principal */}
        <div className="flex-1 bg-white rounded-2xl shadow-sm p-6">
          <div className="flex items-start justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-800">Promedio General</h2>
              <p className="text-sm text-gray-400 mt-1">Institución Completa</p>
            </div>
            <div className="flex gap-2">
              <button className="px-3 py-1.5 text-xs font-semibold text-gray-500 border border-gray-200 rounded-lg hover:bg-gray-50 transition">
                Asistencias
              </button>
              <button className="px-3 py-1.5 text-xs font-semibold text-blue-600 bg-blue-50 rounded-lg">
                Calificaciones
              </button>
              <button
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white rounded-lg transition"
                style={{ background: '#1e3a5f' }}
                onMouseEnter={e => (e.currentTarget.style.background = '#162d4a')}
                onMouseLeave={e => (e.currentTarget.style.background = '#1e3a5f')}
              >
                ↓ Descargar Informe
              </button>
            </div>
          </div>

          {/* Gráfica SVG */}
          <div className="relative h-52 mb-6">
            <svg viewBox="0 0 600 180" className="w-full h-full">
              <defs>
                <linearGradient id="grad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#3B82F6" stopOpacity="0.2" />
                  <stop offset="100%" stopColor="#3B82F6" stopOpacity="0" />
                </linearGradient>
              </defs>
              {[0, 1, 2, 3, 4].map((i) => (
                <line key={i} x1="40" y1={20 + i * 32} x2="580" y2={20 + i * 32}
                  stroke="#F3F4F6" strokeWidth="1" />
              ))}
              <path
                d="M80,140 L160,120 L240,100 L320,60 L400,55 L480,70 L560,80 L560,160 L80,160 Z"
                fill="url(#grad)"
              />
              <polyline
                points="80,140 160,120 240,100 320,60 400,55 480,70 560,80"
                fill="none" stroke="#3B82F6" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
              />
              {[[80,140],[160,120],[240,100],[320,60],[400,55],[480,70],[560,80]].map(([x,y], i) => (
                <circle key={i} cx={x} cy={y} r="4" fill="white" stroke="#3B82F6" strokeWidth="2.5" />
              ))}
              {['Ene','Feb','Mar','Abr','May','Jun','Jul'].map((m, i) => (
                <text key={m} x={80 + i * 80} y="175" textAnchor="middle"
                  fill="#9CA3AF" fontSize="11">{m}</text>
              ))}
            </svg>
          </div>

          {/* Métricas inferiores */}
          <div className="flex items-center justify-between pt-4 border-t border-gray-100">
            <div>
              <p className="text-xs text-gray-400 font-medium uppercase tracking-wide">Promedio Actual</p>
              <p className="text-3xl font-bold text-gray-800 mt-1">8.7</p>
            </div>
            <div>
              <p className="text-xs text-gray-400 font-medium uppercase tracking-wide">Evolución Mensual</p>
              <p className="text-3xl font-bold text-green-500 mt-1">+1.2%</p>
            </div>
            <div className="flex gap-2">
              <button className="flex items-center gap-1.5 border border-gray-200 text-gray-600 hover:bg-gray-50 text-xs font-semibold px-4 py-2 rounded-lg transition">
                ▼ Filtrar Semana
              </button>
              <button className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold px-4 py-2 rounded-lg transition">
                ▼ Filtrar Grupo
              </button>
            </div>
          </div>
        </div>

        {/* Panel derecho */}
        <div className="w-72 bg-white rounded-2xl shadow-sm p-6">
          <div className="flex items-center gap-2 mb-6">
            <span className="text-blue-500">ℹ️</span>
            <h3 className="font-semibold text-gray-700">Información Institucional</h3>
          </div>

          <div className="space-y-5">
            {stats.map((s) => (
              <div key={s.label} className="border-b border-gray-100 pb-4">
                <p className="text-xs text-gray-400 font-semibold uppercase tracking-wider">{s.label}</p>
                <p className={`text-2xl font-bold mt-1 ${s.color}`}>
                  {s.value}<span className="text-sm font-normal text-gray-400 ml-1">{s.suffix}</span>
                </p>
              </div>
            ))}
          </div>

          <div className="mt-4 pt-2">
            <p className="text-xs text-gray-400">
              Sincronizado: <span className="text-green-500 font-medium">Justo ahora</span>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}