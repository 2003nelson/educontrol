// src/app/[slug]/layout.tsx

export async function generateStaticParams() {
  // Lista de slugs válidos para pre-generar
  return [
    { slug: 'localhost' },
    { slug: 'cbta62' },
    { slug: 'demo' },
    { slug: 'dinoti' },
  ]
}

export default function SlugLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}