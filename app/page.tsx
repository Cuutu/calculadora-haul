"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { ProductTable } from "@/components/product-table"
import { ShippingSection } from "@/components/shipping-section"
import { TaxSection } from "@/components/tax-section"
import { ExchangeRateDisplay } from "@/components/exchange-rate-display"
import Navbar from "@/components/navbar"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Modal } from "@/components/ui/modal"
import type { Product, ExchangeRates } from "@/types"

const YUAN_TO_USD = 0.14 // Approximate conversion rate

export default function Home() {
  const { data: session } = useSession()
  const [products, setProducts] = useState<Product[]>([
    {
      id: "1",
      cantidad: 1,
      producto: "",
      peso: 0,
      precioYuanes: 0,
      freightYuanes: 0,
      precioUSD: 0,
      precioARS: 0,
      link: "",
    },
  ])
  const [shippingUSD, setShippingUSD] = useState(0)
  const [useFranquicia, setUseFranquicia] = useState(true)
  const [exchangeRates, setExchangeRates] = useState<ExchangeRates | null>(null)
  const [loading, setLoading] = useState(false)
  const [haulName, setHaulName] = useState("")
  const [saving, setSaving] = useState(false)
  const [showLoginModal, setShowLoginModal] = useState(false)
  const [showSaveModal, setShowSaveModal] = useState(false)

  const fetchExchangeRates = async () => {
    setLoading(true)
    try {
      const response = await fetch("/api/exchange-rates")
      const data = await response.json()
      setExchangeRates(data)
    } catch (error) {
      console.error("[v0] Error fetching exchange rates:", error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchExchangeRates()
  }, [])

  const totalProductsUSD = products.reduce((sum, p) => sum + p.precioUSD * p.cantidad, 0)

  const handleSaveHaulClick = () => {
    if (!session) {
      setShowLoginModal(true)
      return
    }
    setShowSaveModal(true)
  }

  const saveHaul = async () => {
    if (!haulName.trim()) {
      alert('Por favor ingresa un nombre para tu haul')
      return
    }

    if (!exchangeRates) {
      alert('Espera a que se carguen las tasas de cambio')
      return
    }

    setSaving(true)
    try {
      const response = await fetch('/api/hauls', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: haulName,
          products,
          exchangeRates,
          shippingUSD,
        }),
      })

      if (response.ok) {
        alert('¡Haul guardado exitosamente! 🎉')
        setHaulName('')
        setShowSaveModal(false)
      } else {
        alert('Error al guardar el haul')
      }
    } catch (error) {
      console.error('Error saving haul:', error)
      alert('Error al guardar el haul')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <main className="p-4 md:p-8">
        <div className="max-w-7xl mx-auto space-y-6">
          <header className="text-center space-y-2 mb-8">
            <h1 className="text-4xl md:text-5xl text-primary font-sans font-extrabold leading-7 tracking-normal">{"CALCULADORA"}</h1>
            <p className="text-muted-foreground text-lg font-mono">{"Calcula el costo real de tu próxima haul."}</p>
          </header>

        <ExchangeRateDisplay exchangeRates={exchangeRates} loading={loading} onRefresh={fetchExchangeRates} />

        <ProductTable
          products={products}
          setProducts={setProducts}
          exchangeRates={exchangeRates}
          yuanToUSD={YUAN_TO_USD}
        />

        <ShippingSection shippingUSD={shippingUSD} setShippingUSD={setShippingUSD} exchangeRates={exchangeRates} />

        <TaxSection
          totalProductsUSD={totalProductsUSD}
          shippingUSD={shippingUSD}
          useFranquicia={useFranquicia}
          setUseFranquicia={setUseFranquicia}
          exchangeRates={exchangeRates}
        />

        {/* Botón de Guardar Haul */}
        <div className="flex justify-center">
          <Button
            onClick={handleSaveHaulClick}
            size="lg"
            className="bg-green-600 hover:bg-green-700 text-white px-8 py-3 text-lg"
          >
            💾 Guardar Haul
          </Button>
        </div>

        <footer className="text-center text-sm text-muted-foreground pt-8 border-t-2 border-primary">
          <p>•Tasas actualizadas desde dolarito.ar • </p>
        </footer>
        </div>
      </main>

      {/* Modal de Login */}
      <Modal
        isOpen={showLoginModal}
        onClose={() => setShowLoginModal(false)}
        title="Iniciar Sesión Requerido"
      >
        <div className="text-center">
          <p className="text-gray-600 mb-4">
            Debes iniciar sesión para guardar tu haul
          </p>
          <div className="flex space-x-3 justify-center">
            <Button
              variant="outline"
              onClick={() => setShowLoginModal(false)}
            >
              Cancelar
            </Button>
            <Button
              onClick={() => {
                setShowLoginModal(false)
                window.location.href = '/auth/signin'
              }}
            >
              Iniciar Sesión
            </Button>
          </div>
        </div>
      </Modal>

      {/* Modal de Guardar Haul */}
      <Modal
        isOpen={showSaveModal}
        onClose={() => {
          setShowSaveModal(false)
          setHaulName('')
        }}
        title="Guardar Haul"
        onConfirm={saveHaul}
        confirmText={saving ? 'Guardando...' : 'Guardar'}
        confirmDisabled={saving || !haulName.trim()}
      >
        <div>
          <Label htmlFor="modalHaulName">Nombre del haul</Label>
          <Input
            id="modalHaulName"
            value={haulName}
            onChange={(e) => setHaulName(e.target.value)}
            placeholder="Mi haul de invierno 2024"
            className="mt-1"
            autoFocus
          />
          <p className="text-sm text-gray-500 mt-2">
            Este nombre te ayudará a identificar tu haul más tarde
          </p>
        </div>
      </Modal>
    </div>
  )
}
