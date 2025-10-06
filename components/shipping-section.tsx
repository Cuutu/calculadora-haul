"use client"

import { Input } from "@/components/ui/input"
import type { ExchangeRates } from "@/types"

interface ShippingSectionProps {
  shippingUSD: number
  setShippingUSD: (value: number) => void
  exchangeRates: ExchangeRates | null
}

export function ShippingSection({ shippingUSD, setShippingUSD, exchangeRates }: ShippingSectionProps) {
  const shippingARS = shippingUSD * (exchangeRates?.cripto.venta || 0)

  return (
    <div className="space-y-4">
      <div className="bg-secondary text-secondary-foreground p-4 rounded-lg border-4 border-primary">
        <h2 className="text-xl font-bold text-center mb-4">ENVÍO</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-bold mb-2">Envío (USD)</label>
            <Input
              type="number"
              min="0"
              step="0.01"
              value={shippingUSD || ""}
              onChange={(e) => setShippingUSD(Number(e.target.value))}
              className="text-center font-mono text-lg bg-card"
              placeholder="$0.00"
            />
          </div>
          <div>
            <label className="block text-sm font-bold mb-2">Envío (ARS)</label>
            <div className="p-3 bg-card rounded-md text-center font-mono text-lg font-semibold border-2 border-primary">
              ${shippingARS.toFixed(2)}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
