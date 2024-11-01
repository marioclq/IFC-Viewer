// // src/app/components/IFCViewer/Scene.tsx
// import { useEffect, useRef } from 'react'
// import * as OBC from '@thatopen/components'
// import { ViewerState } from './types'

// interface SceneProps {
//   onInitialized: (state: ViewerState) => void;
// }

// export default function Scene({ onInitialized }: SceneProps) {
//   const containerRef = useRef<HTMLDivElement>(null)
  
//   useEffect(() => {
//     if (!containerRef.current) return

//     try {
//       // Inicializamos los componentes
//       const components = new OBC.Components()
      
//       // Creamos el mundo 3D
//       const worlds = components.get(OBC.Worlds)
//       const world = worlds.create()
      
//       // Configuramos la escena
//       world.scene = new OBC.SimpleScene(components)
//       world.renderer = new OBC.SimpleRenderer(components, containerRef.current)
//       world.camera = new OBC.SimpleCamera(components)
      
//       // Inicializamos el gestor de fragmentos
//       components.get(OBC.FragmentsManager)
      
//       // Inicializamos 
//       components.init()
      
//       // Configuración inicial de la cámara
//       if (world.camera.controls) {
//         world.camera.controls.setLookAt(12, 6, 8, 0, 0, -10)
//       }
//       if ('setup' in world.scene) {
//         (world.scene as OBC.SimpleScene).setup()
//       }
//       // Configuramos la escena
//       world.scene.setup()
      
//       // Añadimos la cuadrícula
//       if (world.scene.three instanceof THREE.Scene) {
//         (world.scene.three as THREE.Scene).background = null
//       }
//       grids.create(world)

//       // Color de fondo transparente
//       world.scene.three.background = null

//         currentWorld: world as OBC.SimpleWorld<OBC.SimpleScene, OBC.SimpleCamera, OBC.SimpleRenderer>
//       onInitialized({
//         components,
//         isLoading: false,
//         error: null,
//         models: [],
//         currentWorld: world
//       })

//       // Limpieza
//       return () => {
//         components.dispose()
//       }
//     } catch (error) {
//       console.error('Error en la inicialización:', error)
//       onInitialized({
//         components: null,
//         isLoading: false,
//         error: 'Error al inicializar el visor 3D',
//         models: [],
//         currentWorld: null
//       })
//     }
//   }, [onInitialized])

//   return (
//     <div 
//       ref={containerRef} 
//       className="w-full h-full bg-gray-100"
//     />
//   )
// }