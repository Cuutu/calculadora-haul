"use client"

import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import type { ExchangeRates } from "@/types"

interface TaxSectionProps {
  totalProductsUSD: number
  shippingUSD: number
  useFranquicia: boolean
  setUseFranquicia: (value: boolean) => void
  exchangeRates: ExchangeRates | null
}

export function TaxSection({
  totalProductsUSD,
  shippingUSD,
  useFranquicia,
  setUseFranquicia,
  exchangeRates,
}: TaxSectionProps) {
  const precioEnvioUSD = totalProductsUSD + shippingUSD
  const precioEnvioARS = precioEnvioUSD * (exchangeRates?.cripto.venta || 0)

  // Tax calculation
  let impuestosUSD = 0
  if (useFranquicia) {
    impuestosUSD = Math.max(0, (precioEnvioUSD - 50) / 2)
  } else {
    impuestosUSD = precioEnvioUSD / 2
  }

  const impuestosARS = impuestosUSD * (exchangeRates?.oficial.venta || 0)

  const tasaCorreo = 4900 // Fixed value as shown in the image
  const tasaCorreoUSD = tasaCorreo / (exchangeRates?.oficial.venta || 1)

  const haulTotalUSD = totalProductsUSD + shippingUSD + impuestosUSD + tasaCorreoUSD
  const haulTotalARS = precioEnvioARS + impuestosARS + tasaCorreo

  return (
    <div className="space-y-4">
      <div className="bg-primary text-primary-foreground p-4 rounded-lg border-4 border-primary">
        <h2 className="text-xl font-bold text-center mb-4">IMPUESTOS</h2>

        <div className="space-y-3 bg-card text-card-foreground p-4 rounded-lg">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-bold mb-1">PRECIO + ENVIO (USD)</label>
              <div className="p-2 bg-muted rounded text-center font-mono font-semibold">
                ${precioEnvioUSD.toFixed(2)}
              </div>
            </div>
            <div>
              <label className="block text-sm font-bold mb-1">PRECIO + ENVIO (ARS)</label>
              <div className="p-2 bg-muted rounded text-center font-mono font-semibold">
                ${precioEnvioARS.toFixed(2)}
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
            <Label htmlFor="franquicia" className="font-bold cursor-pointer">
              FRANQUICIA (50 USD)
            </Label>
            <div className="flex items-center gap-3">
              <span className="text-sm font-semibold">{useFranquicia ? "SÍ" : "NO"}</span>
              <Switch id="franquicia" checked={useFranquicia} onCheckedChange={setUseFranquicia} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-bold mb-1">IMPUESTOS (EN USD)</label>
              <div className="p-2 bg-muted rounded text-center font-mono font-semibold">${impuestosUSD.toFixed(2)}</div>
            </div>
            <div>
              <label className="block text-sm font-bold mb-1">IMPUESTOS (ARS)</label>
              <div className="p-2 bg-muted rounded text-center font-mono font-semibold">${impuestosARS.toFixed(2)}</div>
            </div>
          </div>

          <div className="pt-3 border-t-2 border-primary">
            <label className="block text-sm font-bold mb-1">TASA (CORREO ARG)</label>
            <div className="p-3 bg-accent text-accent-foreground rounded text-center font-mono text-lg font-bold">
              ${tasaCorreo.toFixed(2)}
            </div>
          </div>
        </div>
      </div>

      <div className="bg-accent text-accent-foreground p-4 rounded-lg border-4 border-accent">
        <h2 className="text-xl font-bold text-center mb-4">HAUL TOTAL</h2>

        <div className="grid grid-cols-2 gap-4 bg-card text-card-foreground p-4 rounded-lg">
          <div>
            <label className="block text-sm font-bold mb-1 text-center">TOTAL (USD)</label>
            <div className="p-3 bg-primary text-primary-foreground rounded text-center font-mono text-2xl font-bold">
              ${haulTotalUSD.toFixed(2)}
            </div>
          </div>
          <div>
            <label className="block text-sm font-bold mb-1 text-center">TOTAL (ARS)</label>
            <div className="p-3 bg-primary text-primary-foreground rounded text-center font-mono text-2xl font-bold">
              ${haulTotalARS.toFixed(2)}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
