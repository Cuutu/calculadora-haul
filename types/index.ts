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

export interface User {
  _id: string;
  email: string;
  name: string;
  password: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Haul {
  _id: string;
  userId: string;
  name: string;
  products: Product[];
  exchangeRates: ExchangeRates;
  totalCost: number;
  totalWeight: number;
  createdAt: Date;
  updatedAt: Date;
}

// Global types for mongoose
declare global {
  var mongoose: any;
}
