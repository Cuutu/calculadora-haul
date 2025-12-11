"use client"

import { useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Upload, Loader2, X } from "lucide-react"
import type { Product } from "@/types"

interface ImageUploaderProps {
  onProductExtracted: (product: Partial<Product>) => void
  onFreightExtracted?: (freight: number) => void
}

export function ImageUploader({ onProductExtracted, onFreightExtracted }: ImageUploaderProps) {
  const [isProcessing, setIsProcessing] = useState(false)
  const [preview, setPreview] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    // Validar tipo de archivo
    if (!file.type.startsWith('image/')) {
      setError('Por favor selecciona un archivo de imagen')
      return
    }

    // Validar tamaño (máximo 10MB)
    if (file.size > 10 * 1024 * 1024) {
      setError('La imagen es demasiado grande. Máximo 10MB')
      return
    }

    setError(null)
    setIsProcessing(true)

    // Crear preview
    const reader = new FileReader()
    reader.onloadend = () => {
      setPreview(reader.result as string)
    }
    reader.readAsDataURL(file)

    // Procesar imagen
    try {
      const formData = new FormData()
      formData.append('image', file)

      const response = await fetch('/api/process-image', {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Error al procesar la imagen')
      }

      const data = await response.json()

      // Llamar al callback con los datos extraídos
      onProductExtracted({
        producto: data.producto || '',
        precioYuanes: data.precioYuanes || 0,
        cantidad: data.cantidad || 1,
        peso: data.peso || 0,
      })

      // Si hay freight, también lo pasamos
      if (onFreightExtracted && data.freight) {
        onFreightExtracted(data.freight)
      }

      // Limpiar el input
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
      setPreview(null)

    } catch (err) {
      console.error('Error processing image:', err)
      setError(err instanceof Error ? err.message : 'Error desconocido al procesar la imagen')
    } finally {
      setIsProcessing(false)
    }
  }

  const handleRemovePreview = () => {
    setPreview(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileSelect}
          className="hidden"
          id="image-upload"
          disabled={isProcessing}
        />
        <label htmlFor="image-upload">
          <Button
            type="button"
            variant="outline"
            disabled={isProcessing}
            className="cursor-pointer"
            asChild
          >
            <span>
              {isProcessing ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Procesando...
                </>
              ) : (
                <>
                  <Upload className="h-4 w-4 mr-2" />
                  Subir Imagen del Producto
                </>
              )}
            </span>
          </Button>
        </label>
      </div>

      {preview && (
        <div className="relative inline-block">
          <img
            src={preview}
            alt="Preview"
            className="max-w-xs max-h-48 rounded-lg border-2 border-primary"
          />
          <Button
            type="button"
            variant="destructive"
            size="sm"
            className="absolute top-2 right-2"
            onClick={handleRemovePreview}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      )}

      {error && (
        <div className="text-sm text-red-600 bg-red-50 p-2 rounded border border-red-200">
          {error}
        </div>
      )}

      <p className="text-xs text-muted-foreground">
        📸 Sube una imagen del producto para extraer automáticamente: precio, freight, cantidad y peso
      </p>
    </div>
  )
}

