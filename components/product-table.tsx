"use client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Trash2, Plus } from "lucide-react"
import { ImageUploader } from "@/components/image-uploader"
import type { Product, ExchangeRates } from "@/types"

interface ProductTableProps {
  products: Product[]
  setProducts: (products: Product[]) => void
  exchangeRates: ExchangeRates | null
  yuanToUSD: number
  setShippingUSD?: (value: number) => void
}

export function ProductTable({ products, setProducts, exchangeRates, yuanToUSD, setShippingUSD }: ProductTableProps) {
  const addProduct = () => {
    const newProduct: Product = {
      id: Math.random().toString(36).substr(2, 9),
      cantidad: 1,
      producto: "",
      peso: 0,
      precioYuanes: 0,
      precioUSD: 0,
      precioARS: 0,
      link: "",
    }
    setProducts([...products, newProduct])
  }

  const handleProductExtracted = (extractedData: Partial<Product>) => {
    // Crear un nuevo producto con los datos extraídos
    const newProduct: Product = {
      id: Math.random().toString(36).substr(2, 9),
      cantidad: extractedData.cantidad || 1,
      producto: extractedData.producto || "",
      peso: extractedData.peso || 0,
      precioYuanes: extractedData.precioYuanes || 0,
      precioUSD: (extractedData.precioYuanes || 0) * yuanToUSD,
      precioARS: (extractedData.precioYuanes || 0) * yuanToUSD * (exchangeRates?.cripto.venta || 0),
      link: "",
    }
    setProducts([...products, newProduct])
  }

  const handleFreightExtracted = (freight: number) => {
    // Convertir freight de yuanes a USD y actualizar shipping
    if (setShippingUSD) {
      const freightUSD = freight * yuanToUSD
      setShippingUSD(freightUSD)
    }
  }

  const removeProduct = (id: string) => {
    setProducts(products.filter((p) => p.id !== id))
  }

  const updateProduct = (id: string, field: keyof Product, value: string | number) => {
    setProducts(
      products.map((p) => {
        if (p.id === id) {
          const updated = { ...p, [field]: value }

          // Auto-calculate USD and ARS when Yuanes changes
          if (field === "precioYuanes") {
            const yuanes = Number(value)
            updated.precioUSD = yuanes * yuanToUSD
            updated.precioARS = updated.precioUSD * (exchangeRates?.cripto.venta || 0)
          }

          return updated
        }
        return p
      }),
    )
  }

  const totalUnidades = products.reduce((sum, p) => sum + p.cantidad, 0)
  const totalPeso = products.reduce((sum, p) => sum + p.peso * p.cantidad, 0)
  const totalYuanes = products.reduce((sum, p) => sum + p.precioYuanes * p.cantidad, 0)
  const totalUSD = products.reduce((sum, p) => sum + p.precioUSD * p.cantidad, 0)
  const totalARS = products.reduce((sum, p) => sum + p.precioARS * p.cantidad, 0)

  return (
    <div className="space-y-4">
      <div className="bg-primary text-primary-foreground p-4 rounded-lg">
        <h2 className="text-xl font-bold text-center mb-4">HAUL (INGRESE MANUALMENTE EL PRECIO EN YUANES)</h2>
        <div className="bg-card text-card-foreground p-4 rounded-lg border-2 border-primary-foreground/20">
          <ImageUploader 
            onProductExtracted={handleProductExtracted}
            onFreightExtracted={handleFreightExtracted}
          />
        </div>
      </div>

      <div className="overflow-x-auto border-4 border-primary rounded-lg">
        <table className="w-full">
          <thead className="bg-muted">
            <tr>
              <th className="p-3 text-left font-bold border-r-2 border-primary">CANT</th>
              <th className="p-3 text-left font-bold border-r-2 border-primary">PRODUCTO</th>
              <th className="p-3 text-left font-bold border-r-2 border-primary">PESO (GR)</th>
              <th className="p-3 text-left font-bold border-r-2 border-primary">PRECIO EN YUANES</th>
              <th className="p-3 text-left font-bold border-r-2 border-primary">PRECIO USD</th>
              <th className="p-3 text-left font-bold border-r-2 border-primary">PRECIO ARS</th>
              <th className="p-3 text-left font-bold border-r-2 border-primary">LINKS (Opcional) </th>
              <th className="p-3 text-left font-bold">ACCIÓN</th>
            </tr>
          </thead>
          <tbody>
            {products.map((product) => (
              <tr key={product.id} className="border-t-2 border-primary bg-card">
                <td className="p-2 border-r-2 border-primary">
                  <Input
                    type="number"
                    min="1"
                    value={product.cantidad}
                    onChange={(e) => updateProduct(product.id, "cantidad", Number(e.target.value))}
                    className="w-20 text-center font-mono"
                  />
                </td>
                <td className="p-2 border-r-2 border-primary">
                  <Input
                    type="text"
                    value={product.producto}
                    onChange={(e) => updateProduct(product.id, "producto", e.target.value)}
                    placeholder="Nombre del producto"
                    className="min-w-[150px]"
                  />
                </td>
                <td className="p-2 border-r-2 border-primary">
                  <Input
                    type="number"
                    min="0"
                    value={product.peso || ""}
                    onChange={(e) => updateProduct(product.id, "peso", Number(e.target.value))}
                    className="w-24 text-center font-mono"
                    placeholder="0"
                  />
                </td>
                <td className="p-2 border-r-2 border-primary">
                  <Input
                    type="number"
                    min="0"
                    step="0.01"
                    value={product.precioYuanes || ""}
                    onChange={(e) => updateProduct(product.id, "precioYuanes", Number(e.target.value))}
                    className="w-28 text-center font-mono"
                    placeholder="¥0.00"
                  />
                </td>
                <td className="p-2 border-r-2 border-primary">
                  <div className="text-center font-mono font-semibold">${product.precioUSD.toFixed(2)}</div>
                </td>
                <td className="p-2 border-r-2 border-primary">
                  <div className="text-center font-mono font-semibold">${product.precioARS.toFixed(2)}</div>
                </td>
                <td className="p-2 border-r-2 border-primary">
                  <Input
                    type="url"
                    value={product.link}
                    onChange={(e) => updateProduct(product.id, "link", e.target.value)}
                    placeholder="https://..."
                    className="min-w-[150px]"
                  />
                </td>
                <td className="p-2">
                  <Button variant="destructive" size="sm" onClick={() => removeProduct(product.id)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot className="bg-secondary text-secondary-foreground font-bold">
            <tr className="border-t-4 border-primary">
              <td className="p-3 border-r-2 border-primary">
                <Button
                  onClick={addProduct}
                  variant="outline"
                  size="sm"
                  className="w-full bg-primary text-primary-foreground hover:bg-primary/90"
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Agregar
                </Button>
              </td>
              <td className="p-3 text-center border-r-2 border-primary">TOTAL DE UNIDADES</td>
              <td className="p-3 text-center border-r-2 border-primary">PESO TOTAL (GR)</td>
              <td className="p-3 text-center border-r-2 border-primary">PRECIO EN YUANES</td>
              <td className="p-3 text-center border-r-2 border-primary">PRECIO USD</td>
              <td className="p-3 text-center border-r-2 border-primary" colSpan={3}>
                PRECIO ARS
              </td>
            </tr>
            <tr className="bg-primary text-primary-foreground">
              <td className="p-3 border-r-2 border-background"></td>
              <td className="p-3 text-center text-xl border-r-2 border-background">{totalUnidades}</td>
              <td className="p-3 text-center text-xl border-r-2 border-background">{totalPeso.toFixed(0)}</td>
              <td className="p-3 text-center text-xl border-r-2 border-background">¥{totalYuanes.toFixed(2)}</td>
              <td className="p-3 text-center text-xl border-r-2 border-background">${totalUSD.toFixed(2)}</td>
              <td className="p-3 text-center text-xl border-r-2 border-background" colSpan={3}>
                ${totalARS.toFixed(2)}
              </td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  )
}
