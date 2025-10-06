"use client"

import { RefreshCw } from "lucide-react"
import { Button } from "@/components/ui/button"
import type { ExchangeRates } from "@/types"

interface ExchangeRateDisplayProps {
  exchangeRates: ExchangeRates | null
  loading: boolean
  onRefresh: () => void
}

export function ExchangeRateDisplay({ exchangeRates, loading, onRefresh }: ExchangeRateDisplayProps) {
  if (!exchangeRates) {
    return (
      <div className="bg-card p-4 rounded-lg border-2 border-primary text-center">
        <p className="text-muted-foreground">Cargando tasas de cambio...</p>
      </div>
    )
  }

  return (
    <div className="bg-card p-4 rounded-lg border-2 border-primary">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-lg font-bold">Tasas de Cambio</h3>
        <Button variant="outline" size="sm" onClick={onRefresh} disabled={loading}>
          <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
        </Button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <h4 className="font-semibold text-sm">Dólar Cripto</h4>
          <div className="flex justify-between text-sm">
            <span>Compra:</span>
            <span className="font-mono font-bold">${exchangeRates.cripto.compra.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span>Venta:</span>
            <span className="font-mono font-bold">${exchangeRates.cripto.venta.toFixed(2)}</span>
          </div>
        </div>
        <div className="space-y-2">
          <h4 className="font-semibold text-sm">Dólar Oficial</h4>
          <div className="flex justify-between text-sm">
            <span>Compra:</span>
            <span className="font-mono font-bold">${exchangeRates.oficial.compra.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span>Venta:</span>
            <span className="font-mono font-bold">${exchangeRates.oficial.venta.toFixed(2)}</span>
          </div>
        </div>
      </div>
    </div>
  )
}
