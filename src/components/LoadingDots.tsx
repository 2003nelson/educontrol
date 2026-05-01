// src/components/LoadingDots.tsx
'use client'

interface Props {
  mensaje?: string
  submensaje?: string
}

export default function LoadingDots({ mensaje, submensaje }: Props) {
  return (
    <div style={{
      position: 'fixed', inset: 0,
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      background: 'white',
      zIndex: 9999,
    }}>
      <style>{`
        @keyframes dotBounce {
          0%, 100% { transform: translateY(0);     opacity: 0.4; }
          40%       { transform: translateY(-10px); opacity: 1;   }
          60%       { transform: translateY(-5px);  opacity: 1;   }
        }
      `}</style>

      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1.5rem' }}>
        {/* 3 dots */}
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          {[
            { color: '#ef4444', delay: '0s'    },
            { color: '#f59e0b', delay: '0.15s' },
            { color: '#22c55e', delay: '0.3s'  },
          ].map((dot, i) => (
            <div key={i} style={{
              width: 12, height: 12, borderRadius: '50%',
              background: dot.color,
              animation: `dotBounce 1.1s ease-in-out ${dot.delay} infinite`,
            }}/>
          ))}
        </div>

        {/* Texto opcional */}
        {(mensaje || submensaje) && (
          <div style={{ textAlign: 'center' }}>
            {mensaje && <p style={{ fontSize: '0.8rem', fontWeight: 500, color: '#94a3b8', margin: 0 }}>{mensaje}</p>}
            {submensaje && <p style={{ fontSize: '0.72rem', color: '#cbd5e1', margin: '0.25rem 0 0' }}>{submensaje}</p>}
          </div>
        )}
      </div>
    </div>
  )
}