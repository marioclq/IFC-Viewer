"use client";
import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import * as OBC from "@thatopen/components";
import * as WEBIFC from "web-ifc";

type CategoryVisibility = {
  [key: string]: boolean;
};

type FloorVisibility = {
  [key: string]: boolean;
};

type ComponentRefs = {
  components?: OBC.Components;
  fragments?: OBC.FragmentsManager;
  fragmentIfcLoader?: OBC.IfcLoader;
  classifier?: OBC.Classifier;
  hider?: OBC.Hider;
  indexer?: OBC.IfcRelationsIndexer;
  world?: any;
};

export default function IFCViewer() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [categories, setCategories] = useState<CategoryVisibility>({});
  const [floors, setFloors] = useState<FloorVisibility>({});
  const [hasModel, setHasModel] = useState(false);
  const [currentModel, setCurrentModel] = useState<any>(null);
  const componentsRef = useRef<ComponentRefs>({});

  useEffect(() => {
    if (!containerRef.current) return;

    // Limpiar cualquier canvas existente
    const existingCanvases = containerRef.current.querySelectorAll("canvas");
    existingCanvases.forEach((canvas) => canvas.remove());

    const initializeViewer = async () => {
      try {
        const components = new OBC.Components();
        const worlds = components.get(OBC.Worlds);

        const world = worlds.create<
          OBC.SimpleScene,
          OBC.SimpleCamera,
          OBC.SimpleRenderer
        >();

        // Configuración de la escena
        world.scene = new OBC.SimpleScene(components);
        world.renderer = new OBC.SimpleRenderer(
          components,
          containerRef.current as HTMLElement
        );
        world.camera = new OBC.SimpleCamera(components);

        // Asegurar que solo hay un canvas y está configurado correctamente
        if (world.renderer.three) {
          const canvas = world.renderer.three.domElement;
          canvas.style.position = "absolute";
          canvas.style.top = "0";
          canvas.style.left = "0";
          canvas.style.zIndex = "1";

          // Configurar tamaño del renderer
          world.renderer.three.setPixelRatio(window.devicePixelRatio);
          if (containerRef.current) {
            world.renderer.three.setSize(
              containerRef.current?.clientWidth ?? 0,
              containerRef.current?.clientHeight ?? 0
            );
          }
        }

        // Inicializar componentes
        const fragments = components.get(OBC.FragmentsManager);
        const fragmentIfcLoader = components.get(OBC.IfcLoader);
        const classifier = components.get(OBC.Classifier);
        const hider = components.get(OBC.Hider);
        const indexer = components.get(OBC.IfcRelationsIndexer);

        await fragmentIfcLoader.setup();
        fragmentIfcLoader.settings.wasm = {
          path: "https://unpkg.com/web-ifc@0.0.57/",
          absolute: true,
        };

        components.init();

        world.camera.controls.setLookAt(12, 6, 8, 0, 0, -10);

        const grids = components.get(OBC.Grids);
        grids.create(world);

        world.scene.three.background = new THREE.Color(0xffffff);

        // Configuración de luces
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.7);
        world.scene.three.add(ambientLight);

        const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
        directionalLight.position.set(10, 10, 10);
        world.scene.three.add(directionalLight);

        componentsRef.current = {
          components,
          fragments,
          fragmentIfcLoader,
          classifier,
          hider,
          indexer,
          world,
        };
      } catch (error) {
        console.error("Error en la inicialización:", error);
      }
    };

    initializeViewer();

    // Manejar cambios de tamaño de ventana
    const handleResize = () => {
      if (
        !componentsRef.current.world?.renderer?.three ||
        !containerRef.current
      )
        return;

      componentsRef.current.world.renderer.three.setSize(
        containerRef.current.clientWidth,
        containerRef.current.clientHeight
      );
    };

    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
      if (componentsRef.current.components) {
        componentsRef.current.components.dispose();
      }
    };
  }, []);

  const clearCurrentModel = () => {
    if (!componentsRef.current.world || !currentModel) return;

    try {
      // Limpiar modelo actual
      componentsRef.current.world.scene.three.remove(currentModel);

      // Resetear estados
      setCategories({});
      setFloors({});
      setCurrentModel(null);
      setHasModel(false);

      // Hacer visibles todos los elementos antes de limpiar
      if (componentsRef.current.hider) {
        componentsRef.current.hider.set(true);
      }

      // Limpiar fragmentos
      if (componentsRef.current.fragments) {
        componentsRef.current.fragments.dispose();
      }
    } catch (error) {
      console.error("Error al limpiar el modelo:", error);
    }
  };

  const handleFileSelect = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (
      !file ||
      !componentsRef.current.fragmentIfcLoader ||
      !componentsRef.current.world
    )
      return;

    try {
      setIsLoading(true);

      // Limpiar modelo anterior y hacer visibles todos los elementos
      if (componentsRef.current.hider) {
        componentsRef.current.hider.set(true);
      }
      clearCurrentModel();

      const arrayBuffer = await file.arrayBuffer();
      const buffer = new Uint8Array(arrayBuffer);

      // Cargar nuevo modelo
      const model = await componentsRef.current.fragmentIfcLoader.load(buffer);
      model.name = file.name;

      // Añadir el modelo a la escena
      componentsRef.current.world.scene.three.add(model);
      setCurrentModel(model);

      // Clasificar por entidad y pisos
      if (componentsRef.current.classifier) {
        await componentsRef.current.classifier.byEntity(model);
        await componentsRef.current.classifier.byIfcRel(
          model,
          WEBIFC.IFCRELCONTAINEDINSPATIALSTRUCTURE,
          "storeys"
        );

        // Configurar categorías
        const categoryVisibility: Record<string, boolean> = {};
        const classNames = Object.keys(
          componentsRef.current.classifier.list.entities
        );
        for (const name of classNames) {
          categoryVisibility[name] = true; // Inicialmente todo visible
        }
        setCategories(categoryVisibility);
      }

      // Ajustar la cámara al modelo
      const bbox = new THREE.Box3().setFromObject(model);
      const center = new THREE.Vector3();
      const size = new THREE.Vector3();
      bbox.getCenter(center);
      bbox.getSize(size);

      const maxDim = Math.max(size.x, size.y, size.z);
      const distance = maxDim * 2;

      componentsRef.current.world.camera.controls.setLookAt(
        center.x + distance,
        center.y + distance / 2,
        center.z + distance,
        center.x,
        center.y,
        center.z,
        true
      );

      // Asegurar que todo es visible inicialmente
      if (componentsRef.current.hider) {
        componentsRef.current.hider.set(false); // false = mostrar todo
      }
      setHasModel(true);
    } catch (error) {
      console.error("Error al cargar el modelo:", error);
      alert(
        "Error al cargar el modelo: " +
          (error instanceof Error ? error.message : "Error desconocido")
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleCategoryVisibility = (category: string, visible: boolean) => {
    if (
      !componentsRef.current.classifier ||
      !componentsRef.current.hider ||
      !currentModel
    )
      return;

    try {
      const found = componentsRef.current.classifier.find({
        entities: [category],
      });
      if (found) {
        // Invertimos la lógica aquí porque el hider.set(true) oculta y set(false) muestra
        componentsRef.current.hider.set(!visible, found);
        setCategories((prev) => ({
          ...prev,
          [category]: visible,
        }));
      }
    } catch (error) {
      console.error("Error al cambiar visibilidad de categoría:", error);
    }
  };

  const handleFloorVisibility = (floorName: string, visible: boolean) => {
    if (
      !componentsRef.current.classifier ||
      !componentsRef.current.hider ||
      !currentModel
    )
      return;

    try {
      const floorItems =
        componentsRef.current.classifier.list.storeys?.[floorName];
      if (floorItems && floorItems.id !== null) {
        const found = componentsRef.current.classifier.find({
          storeys: [floorName],
        });
        if (found) {
          componentsRef.current.hider.set(!visible, found);
          setFloors((prev) => ({
            ...prev,
            [floorName]: visible,
          }));
        }
      }
    } catch (error) {
      console.error("Error al cambiar visibilidad del piso:", error);
    }
  };

  return (
    <div className="relative w-full h-screen">
      {/* Contenedor del canvas */}
      <div ref={containerRef} className="absolute inset-0" />

      {/* Panel de control - Carga de archivo */}
      <div className="absolute top-4 left-4 z-[110]">
        <div className="bg-white/90 backdrop-blur-sm p-5 rounded-xl shadow-lg border border-gray-100">
          <div className="relative group">
            <input
              type="file"
              accept=".ifc,.ifczip"
              onChange={handleFileSelect}
              disabled={isLoading}
              className="block w-full text-sm text-gray-500
              file:mr-4 file:py-2.5 file:px-4
              file:rounded-lg file:border-0
              file:text-sm file:font-medium
              file:bg-blue-50 file:text-blue-700
              group-hover:file:bg-blue-100
              cursor-pointer transition-all
              file:transition-all duration-300
              disabled:opacity-50 disabled:cursor-not-allowed"
            />
          </div>
        </div>
      </div>

      {/* Indicador de carga */}
      {isLoading && (
        <div className="absolute inset-0 z-20 bg-black/20 backdrop-blur-sm flex items-center justify-center">
          <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-100 flex items-center space-x-3">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-700"></div>
            <span className="text-gray-700 font-medium">
              Cargando modelo...
            </span>
          </div>
        </div>
      )}

      {/* Panel de control - Categorías y Pisos */}
      {hasModel && (
        <div className="absolute top-4 right-4 z-10 max-w-sm">
          <div className="bg-white/90 backdrop-blur-sm p-6 rounded-xl shadow-lg border border-gray-100 max-h-[80vh] overflow-y-auto">
            {/* Sección de Pisos */}

            {/* Separador */}
            <div className="h-px bg-gradient-to-r from-transparent via-gray-200 to-transparent mb-6" />

            {/* Sección de Categorías */}
            <div>
  <div className="flex flex-col space-y-4">
    <div className="flex items-center justify-between">
      <h3 className="text-lg font-semibold text-gray-800">Categorías</h3>
      
      {/* Toggle principal para mostrar/ocultar todo */}
      <div className="flex items-center">
        <span className="mr-3 text-sm font-medium text-gray-700">
          {Object.values(categories).every(v => !v) ? 'Todo visible' : 'Todo oculto'}
        </span>
        <label className="relative inline-flex items-center cursor-pointer">
          <input
            type="checkbox"
            className="sr-only peer"
            checked={Object.values(categories).some(v => v)}
            onChange={(e) => {
              const newState = Object.fromEntries(
                Object.keys(categories).map(key => [key, e.target.checked])
              )
              Object.entries(newState).forEach(([category, visible]) => {
                handleCategoryVisibility(category, visible)
              })
              setCategories(newState)
            }}
          />
          <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 
            peer-focus:ring-blue-300 rounded-full peer 
            peer-checked:after:translate-x-full peer-checked:after:border-white 
            after:content-[''] after:absolute after:top-[2px] after:left-[2px] 
            after:bg-white after:border-gray-300 after:border after:rounded-full 
            after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600">
          </div>
        </label>
      </div>
    </div>

    {/* Separador con gradiente */}
    <div className="h-px bg-gradient-to-r from-transparent via-gray-200 to-transparent" />

    {/* Lista de categorías con toggles */}
    <div className="space-y-3">
      {Object.entries(categories).map(([category, visible]) => (
        <div 
          key={category}
          className="flex items-center justify-between p-2 rounded-lg hover:bg-gray-50 transition-colors"
        >
          <span className="text-sm font-medium text-gray-700">
            {category.replace('IFC', '')}
          </span>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              className="sr-only peer"
              checked={visible}
              onChange={(e) => {
                const newVisibility = e.target.checked
                handleCategoryVisibility(category, newVisibility)
              }}
            />
            <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 
              peer-focus:ring-blue-300 rounded-full peer 
              peer-checked:after:translate-x-full peer-checked:after:border-white 
              after:content-[''] after:absolute after:top-[2px] after:left-[2px] 
              after:bg-white after:border-gray-300 after:border after:rounded-full 
              after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600">
            </div>
          </label>
        </div>
      ))}
    </div>
  </div>
</div>
          </div>
        </div>
      )}

      {/* Mensaje cuando no hay modelo cargado */}
      {!hasModel && !isLoading && (
        <div className="absolute inset-0 z-10 flex items-center justify-center text-gray-500">
          <div className="text-center bg-white/90 backdrop-blur-sm p-8 rounded-xl shadow-lg border border-gray-100">
            <div className="mb-4">
              <svg
                className="mx-auto h-12 w-12 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                />
              </svg>
            </div>
            <p className="text-lg font-semibold mb-2 text-gray-800">
              No hay modelo cargado
            </p>
            <p className="text-sm text-gray-600">
              Selecciona un archivo IFC para comenzar
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
