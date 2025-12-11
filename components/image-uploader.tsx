"use client"

import { useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Upload, Loader2, X } from "lucide-react"
import { createWorker } from "tesseract.js"
import { parseProductText } from "@/lib/image-parser"
import type { Product } from "@/types"

interface ImageUploaderProps {
  onProductExtracted: (product: Partial<Product>) => void
  onFreightExtracted?: (freight: number) => void
}

export function ImageUploader({ onProductExtracted, onFreightExtracted }: ImageUploaderProps) {
  const [isProcessing, setIsProcessing] = useState(false)
  const [processingProgress, setProcessingProgress] = useState(0)
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

    // Procesar imagen con Tesseract.js (gratuito, funciona en el cliente)
    try {
      // Crear worker de Tesseract
      const worker = await createWorker('eng', 1, {
        logger: (m) => {
          // Mostrar progreso al usuario
          if (m.status === 'recognizing text') {
            const progress = Math.round(m.progress * 100)
            setProcessingProgress(progress)
          }
        },
      })

      // Realizar OCR
      const { data: { text } } = await worker.recognize(file)
      
      // Terminar el worker
      await worker.terminate()
      
      setProcessingProgress(100)

      // Parsear el texto extraído
      const extractedData = parseProductText(text)
      
      // Log del texto extraído para debugging (opcional)
      if (extractedData.precioYuanes === 0 && extractedData.freight === 0) {
        console.log('Texto extraído para debugging:', text.substring(0, 500))
      }

      // Llamar al callback con los datos extraídos
      onProductExtracted({
        producto: extractedData.producto || '',
        precioYuanes: extractedData.precioYuanes || 0,
        cantidad: extractedData.cantidad || 1,
        peso: extractedData.peso || 0,
      })

      // Si hay freight, también lo pasamos
      if (onFreightExtracted && extractedData.freight) {
        onFreightExtracted(extractedData.freight)
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
                  Procesando... {processingProgress > 0 && `${processingProgress}%`}
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
        📸 Sube una imagen del producto para extraer automáticamente: precio, freight, cantidad y peso (OCR gratuito)
      </p>
    </div>
  )
}

