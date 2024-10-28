'use client'

import { Suspense } from 'react'
import dynamic from 'next/dynamic'

// Importamos el componente del visor de manera dinámica para evitar problemas con SSR
const IFCViewer = dynamic(
  () => import('@/src/app/components/IFCViewer'),
  { 
    ssr: false,
    loading: () => <ViewerPlaceholder />
  }
)
function ViewerPlaceholder() {
  return (
    <div className="w-full h-screen bg-gray-100 flex items-center justify-center">
      <div className="text-gray-600">Cargando visor 3D...</div>
    </div>
  )
}

export default function Home() {
  return (
    <main className="w-full h-screen">
      <IFCViewer />
    </main>
  )
}