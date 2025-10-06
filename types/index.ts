export interface Product {
  id: string
  cantidad: number
  producto: string
  peso: number
  precioYuanes: number
  precioUSD: number
  precioARS: number
  link: string
}

export interface ExchangeRates {
  oficial: {
    compra: number
    venta: number
  }
  cripto: {
    compra: number
    venta: number
  }
}
