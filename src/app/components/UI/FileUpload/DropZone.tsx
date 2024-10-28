'use client'

import { useState, useRef, DragEvent, ChangeEvent } from 'react'

interface DropZoneProps {
  onFileSelected: (file: File) => void;
  isLoading?: boolean;
}

export function DropZone({ onFileSelected, isLoading = false }: DropZoneProps) {
  const [isDragging, setIsDragging] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  
  const handleDragEnter = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    if (!isLoading) setIsDragging(true)
  }

  const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)
  }

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    if (!isLoading) setIsDragging(true)
  }

  const validateFile = (file: File): boolean => {
    // Validar que sea un archivo IFC
    if (!file.name.toLowerCase().endsWith('.ifc')) {
      alert('Por favor, selecciona un archivo IFC válido')
      return false
    }
    return true
  }

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)

    if (isLoading) return

    const file = e.dataTransfer.files[0]
    if (file && validateFile(file)) {
      onFileSelected(file)
    }
  }

  const handleFileInput = (e: ChangeEvent<HTMLInputElement>) => {
    if (isLoading || !e.target.files?.length) return

    const file = e.target.files[0]
    if (validateFile(file)) {
      onFileSelected(file)
    }
    // Limpiar el input para permitir cargar el mismo archivo múltiples veces
    e.target.value = ''
  }

  const handleClick = () => {
    if (!isLoading && fileInputRef.current) {
      fileInputRef.current.click()
    }
  }

  return (
    <div
      onClick={handleClick}
      onDragEnter={handleDragEnter}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={`
        relative w-full h-48 
        border-2 border-dashed rounded-lg
        transition-colors duration-200
        ${isDragging ? 'border-blue-500 bg-blue-50' : 'border-gray-300'}
        ${isLoading 
          ? 'opacity-50 cursor-not-allowed' 
          : 'cursor-pointer hover:border-blue-400 hover:bg-blue-50'
        }
      `}
    >
      <input
        ref={fileInputRef}
        type="file"
        accept=".ifc"
        onChange={handleFileInput}
        className="hidden"
        disabled={isLoading}
      />
      
      <div className="absolute inset-0 flex flex-col items-center justify-center p-4">
        <svg
          className={`w-10 h-10 mb-3 ${isDragging ? 'text-blue-500' : 'text-gray-400'}`}
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
        
        <div className="text-center">
          {isLoading ? (
            <p className="text-sm text-gray-500">
              Cargando archivo...
            </p>
          ) : (
            <>
              <p className="text-sm text-gray-600">
                {isDragging
                  ? 'Suelta el archivo aquí'
                  : 'Arrastra un archivo IFC aquí o'}
              </p>
              <p className="text-sm text-blue-500">
                {!isDragging && 'haz clic para seleccionar'}
              </p>
            </>
          )}
        </div>

        <p className="mt-2 text-xs text-gray-500">
          Solo archivos IFC
        </p>
      </div>
    </div>
  )
}