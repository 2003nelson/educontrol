'use client'

import React, { useState, useEffect } from 'react'

const DOTS_DECO = ['#ef4444', '#f59e0b', '#22c55e']

const FAQS = [
  {
    id: 1,
    icon: (
      <svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round">
        <path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/>
      </svg>
    ),
    color: '#2563eb', bg: '#eff6ff',
    q: '¿Cómo registro la asistencia?',
    a: 'Ve a la sección de Asistencia en el menú principal, selecciona tu grupo, luego elige la asignatura y finalmente presiona el botón "Tomar asistencia ahora".',
    extra: null,
  },
  {
    id: 2,
    icon: (
      <svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round">
        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
      </svg>
    ),
    color: '#d97706', bg: '#fffbeb',
    q: '¿Puedo editar una asistencia ya registrada?',
    a: 'Sí. En la pantalla de confirmación de tu grupo aparecerá el botón "Editar" siempre y cuando la asistencia se haya registrado en el día en curso.',
    extra: null,
  },
  {
    id: 3,
    icon: (
      <svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10"/><path d="M12 8v4M12 16h.01"/>
      </svg>
    ),
    color: '#7c3aed', bg: '#f5f3ff',
    q: '¿Qué significan P, A, J y R?',
    a: 'El sistema maneja la siguiente nomenclatura oficial para el pase de lista:',
    extra: 'estados',
  },
  {
    id: 4,
    icon: (
      <svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/>
        <path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/>
      </svg>
    ),
    color: '#16a34a', bg: '#f0fdf4',
    q: '¿Cómo contacto al administrador?',
    a: 'Si presentas un error de sistema o necesitas recuperar tu acceso, el soporte técnico está disponible para ayudarte. Revisa el botón de "Contactar a Sistemas" en esta misma página.',
    extra: 'dots',
  },
  {
    id: 5,
    icon: (
      <svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/>
      </svg>
    ),
    color: '#0d9488', bg: '#f0fdfa',
    q: '¿Cuándo estará disponible Calificaciones?',
    a: 'Estamos trabajando en el módulo de gestión de notas. Estará habilitado en la próxima actualización importante del sistema.',
    extra: null,
  },
  {
    id: 6,
    icon: (
      <svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/>
        <line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
      </svg>
    ),
    color: '#db2777', bg: '#fdf2f8',
    q: '¿Qué otros módulos tendrá la plataforma?',
    a: 'Próximamente integraremos: Reportes avanzados de desempeño, Mensajería interna docente-alumno y un gestor de Planeaciones didácticas.',
    extra: 'dots',
  },
]

const ESTADOS = [
  { letra: 'P', label: 'Presente',    bg: '#dcfce7', color: '#16a34a', border: '#86efac' },
  { letra: 'A', label: 'Ausente',     bg: '#fee2e2', color: '#dc2626', border: '#fca5a5' },
  { letra: 'J', label: 'Justificada', bg: '#fef3c7', color: '#d97706', border: '#fcd34d' },
  { letra: 'R', label: 'Retardo',     bg: '#f3e8ff', color: '#7c3aed', border: '#c4b5fd' },
]

export default function AyudaPage() {
  const [openId, setOpenId] = useState<number | null>(1);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const toggleFaq = (id: number) => {
    setOpenId(openId === id ? null : id);
  };

  // Prevenir scroll en el body cuando el modal está abierto (Buena práctica de UX)
  useEffect(() => {
    if (isModalOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => { document.body.style.overflow = 'unset' };
  }, [isModalOpen]);

  return (
    <div className="min-h-screen bg-[#f8fafc] p-4 md:p-8 lg:p-12 relative">
      <div className="max-w-7xl mx-auto flex flex-col lg:flex-row gap-12">
        
        {/* Columna Izquierda: Encabezado y Contexto (Sticky) */}
        {/* Usamos h-max y top-12 para asegurar que se quede pegada correctamente al hacer scroll */}
        <div className="lg:w-1/3 flex flex-col gap-6 lg:sticky lg:top-12 h-max">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1.5 mb-4 text-xs font-bold tracking-widest text-blue-700 uppercase bg-blue-100/80 rounded-full border border-blue-200">
              <span className="w-2 h-2 rounded-full bg-blue-600 animate-pulse"></span>
              Soporte EduControl
            </div>
            <h1 className="text-3xl md:text-5xl font-extrabold text-slate-800 tracking-tight leading-tight">
              ¿En qué podemos <br className="hidden lg:block" />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">
                ayudarte hoy?
              </span>
            </h1>
            <p className="mt-4 text-slate-500 text-lg leading-relaxed">
              Encuentra respuestas rápidas a las dudas más comunes sobre el uso de la plataforma.
            </p>
          </div>

          {/* Tarjeta de Contacto Directo */}
          <div className="bg-white rounded-[2rem] p-6 border border-slate-200 shadow-sm mt-4 transition-transform hover:scale-[1.02] duration-300">
            <h3 className="font-bold text-slate-800 mb-2">¿No encuentras lo que buscas?</h3>
            <p className="text-sm text-slate-500 mb-6">Nuestro equipo de soporte técnico está disponible para atender casos específicos.</p>
            <button 
              onClick={() => setIsModalOpen(true)}
              className="w-full py-3.5 px-4 bg-slate-900 hover:bg-slate-800 active:scale-95 text-white font-semibold rounded-2xl transition-all flex items-center justify-center gap-2"
            >
              <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
              Contactar a Sistemas
            </button>
          </div>
        </div>

        {/* Columna Derecha: Acordeón de Preguntas (Esta es la que hace Scroll) */}
        <div className="lg:w-2/3 flex flex-col gap-3 pb-20">
          {FAQS.map((faq) => {
            const isOpen = openId === faq.id;

            return (
              <div 
                key={faq.id}
                className={`group border rounded-[1.5rem] transition-all duration-300 overflow-hidden ${
                  isOpen 
                    ? 'bg-white border-blue-200 shadow-md ring-4 ring-blue-50/50' 
                    : 'bg-white border-slate-200 hover:border-slate-300 hover:shadow-sm'
                }`}
              >
                {/* Botón Cabecera */}
                <button
                  onClick={() => toggleFaq(faq.id)}
                  className="w-full flex items-center justify-between p-5 md:p-6 text-left focus:outline-none"
                >
                  <div className="flex items-center gap-4">
                    <div 
                      className={`flex-shrink-0 w-12 h-12 rounded-[1rem] flex items-center justify-center transition-transform duration-300 ${isOpen ? 'scale-110' : ''}`}
                      style={{ backgroundColor: faq.bg, color: faq.color }}
                    >
                      {faq.icon}
                    </div>
                    <span className={`text-base md:text-lg font-bold transition-colors ${isOpen ? 'text-blue-700' : 'text-slate-700 group-hover:text-slate-900'}`}>
                      {faq.q}
                    </span>
                  </div>
                  
                  {/* Flecha Animada */}
                  <div className={`flex-shrink-0 ml-4 transition-transform duration-300 ${isOpen ? 'rotate-180 text-blue-600' : 'text-slate-400'}`}>
                    <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M6 9l6 6 6-6"/></svg>
                  </div>
                </button>

                {/* Contenido Desplegable */}
                <div 
                  className={`grid transition-all duration-300 ease-in-out ${
                    isOpen ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'
                  }`}
                >
                  <div className="overflow-hidden">
                    <div className="px-5 md:px-6 pb-6 pt-0 md:pl-22">
                      {/* Respuesta en Texto */}
                      {faq.a && (
                        <p className="text-slate-600 leading-relaxed mb-3 md:ml-16">
                          {faq.a}
                        </p>
                      )}

                      {/* Elementos Extras */}
                      {faq.extra === 'estados' && (
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-4 md:ml-16">
                          {ESTADOS.map(e => (
                            <div 
                              key={e.letra} 
                              className="flex items-center gap-2.5 p-2.5 rounded-xl border"
                              style={{ backgroundColor: e.bg, borderColor: e.border }}
                            >
                              <span 
                                className="w-8 h-8 flex items-center justify-center rounded-lg font-black text-sm shadow-sm bg-white"
                                style={{ color: e.color }}
                              >
                                {e.letra}
                              </span>
                              <span className="font-semibold text-sm" style={{ color: e.color }}>
                                {e.label}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}

                      {faq.extra === 'dots' && (
                        <div className="flex gap-2 mt-4 md:ml-16">
                          {DOTS_DECO.map((c, di) => (
                            <div 
                              key={di} 
                              className="w-2 h-2 rounded-full animate-pulse" 
                              style={{ backgroundColor: c, opacity: 0.6, animationDelay: `${di * 150}ms` }}
                            />
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* MODAL DE CONTACTO (Apple Style Spring Animation) */}
      <div 
        className={`fixed inset-0 z-50 flex items-center justify-center p-4 transition-all duration-300 ${
          isModalOpen ? 'opacity-100 visible' : 'opacity-0 invisible'
        }`}
      >
        {/* Fondo oscuro borroso (Backdrop) */}
        <div 
          className="absolute inset-0 bg-slate-900/30 backdrop-blur-sm transition-opacity"
          onClick={() => setIsModalOpen(false)}
        ></div>

        {/* Tarjeta del Modal con animación Spring */}
        {/* ease-[cubic-bezier(0.34,1.56,0.64,1)] es la magia para el efecto resorte */}
        <div 
          className={`relative w-full max-w-sm bg-white rounded-[2rem] p-8 shadow-2xl transition-all duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)] ${
            isModalOpen ? 'translate-y-0 scale-100 opacity-100' : 'translate-y-24 scale-90 opacity-0'
          }`}
        >
          {/* Botón Cerrar (Estilo iOS) */}
          <button 
            onClick={() => setIsModalOpen(false)}
            className="absolute top-5 right-5 w-8 h-8 flex items-center justify-center bg-slate-100 hover:bg-slate-200 text-slate-500 rounded-full transition-colors"
          >
            <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M18 6L6 18M6 6l12 12"/></svg>
          </button>

          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-blue-100 text-blue-600 rounded-[1.2rem] flex items-center justify-center mx-auto mb-4">
              <svg width="32" height="32" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 0 1-3.46 0"/></svg>
            </div>
            <h2 className="text-2xl font-bold text-slate-800">Soporte Técnico</h2>
            <p className="text-slate-500 text-sm mt-2">Comunícate con nosotros para resolver cualquier inconveniente con EduControl.</p>
          </div>

          <div className="flex flex-col gap-4">
            {/* Campo Teléfono */}
            <div className="flex items-center gap-4 p-4 rounded-2xl bg-slate-50 border border-slate-100 hover:bg-slate-100 transition-colors cursor-pointer">
              <div className="w-10 h-10 rounded-full bg-green-100 text-green-600 flex items-center justify-center flex-shrink-0">
                <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
              </div>
              <div>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Teléfono</p>
                <p className="text-slate-800 font-semibold text-lg">+52 (55) 1234 5678</p>
              </div>
            </div>

            {/* Campo Correo */}
            <div className="flex items-center gap-4 p-4 rounded-2xl bg-slate-50 border border-slate-100 hover:bg-slate-100 transition-colors cursor-pointer">
              <div className="w-10 h-10 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center flex-shrink-0">
                <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><path d="M22 6l-10 7L2 6"/></svg>
              </div>
              <div className="overflow-hidden">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Correo Electrónico</p>
                <p className="text-slate-800 font-semibold text-base truncate">soporte@educontrol.com</p>
              </div>
            </div>
          </div>
          
          <div className="mt-6 text-center">
            <span className="text-xs text-slate-400 font-medium">Horario de atención: Lunes a Viernes, 8am - 4pm</span>
          </div>
        </div>
      </div>

    </div>
  )
}