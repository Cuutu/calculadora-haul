"use client"

import { useState, useEffect } from "react"
import { ProductTable } from "@/components/product-table"
import { ShippingSection } from "@/components/shipping-section"
import { TaxSection } from "@/components/tax-section"
import { ExchangeRateDisplay } from "@/components/exchange-rate-display"
import type { Product, ExchangeRates } from "@/types"

const YUAN_TO_USD = 0.14 // Approximate conversion rate

export default function Home() {
  const [products, setProducts] = useState<Product[]>([
    {
      id: "1",
      cantidad: 1,
      producto: "",
      peso: 0,
      precioYuanes: 0,
      precioUSD: 0,
      precioARS: 0,
      link: "",
    },
  ])
  const [shippingUSD, setShippingUSD] = useState(0)
  const [useFranquicia, setUseFranquicia] = useState(true)
  const [exchangeRates, setExchangeRates] = useState<ExchangeRates | null>(null)
  const [loading, setLoading] = useState(false)

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

  return (
    <main className="min-h-screen p-4 md:p-8">
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

        <footer className="text-center text-sm text-muted-foreground pt-8 border-t-2 border-primary">
          <p>•Tasas actualizadas desde dolarito.ar • </p>
        </footer>
      </div>
    </main>
  )
}
