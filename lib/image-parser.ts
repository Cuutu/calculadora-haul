/**
 * Parsea el texto extraído de una imagen de producto y extrae:
 * - Nombre del producto
 * - Precio en yuanes (¥)
 * - Freight (¥)
 * - Cantidad
 * - Peso (en gramos)
 */

export interface ExtractedProductData {
  producto: string
  precioYuanes: number
  freight: number
  cantidad: number
  peso: number
}

export function parseProductText(text: string): ExtractedProductData {
  const result: ExtractedProductData = {
    producto: '',
    precioYuanes: 0,
    freight: 0,
    cantidad: 1,
    peso: 0,
  }

  // Normalizar el texto: convertir a minúsculas y limpiar espacios
  const normalizedText = text.toLowerCase().replace(/\s+/g, ' ')

  // Extraer precio en yuanes
  // Buscar patrones como: ¥3.80, ¥ 3.80, price: ¥3.80, price ¥3.80, $0.54 (USD)
  const pricePatterns = [
    /(?:price|precio)[:\s]*¥?\s*(\d+\.?\d*)/i,
    /¥\s*(\d+\.?\d*)/,
    /(\d+\.?\d*)\s*¥/,
    // También buscar precios en USD y convertir (aproximado: 1 USD = 7.2 CNY)
    /(?:price|precio)[:\s]*\$?\s*(\d+\.?\d*)\s*\(?\$0\.\d+\)?/i,
  ]

  for (const pattern of pricePatterns) {
    const match = text.match(pattern)
    if (match && match[1]) {
      const price = parseFloat(match[1])
      if (price > 0 && price < 10000) {
        result.precioYuanes = price
        break
      }
    }
  }
  
  // Si no encontramos precio con ¥, buscar el primer número decimal que parezca un precio
  if (result.precioYuanes === 0) {
    const decimalPriceMatch = text.match(/(\d+\.\d{2})/)
    if (decimalPriceMatch) {
      const potentialPrice = parseFloat(decimalPriceMatch[1])
      if (potentialPrice > 0.1 && potentialPrice < 1000) {
        result.precioYuanes = potentialPrice
      }
    }
  }

  // Extraer freight
  // Buscar patrones como: freight: ¥6.00, freight ¥6.00, freight: 6.00
  const freightPatterns = [
    /(?:freight|env[ií]o|shipping)[:\s]*¥?\s*(\d+\.?\d*)/i,
    /freight[:\s]*(\d+\.?\d*)/i,
  ]

  for (const pattern of freightPatterns) {
    const match = text.match(pattern)
    if (match && match[1]) {
      const freight = parseFloat(match[1])
      if (freight > 0 && freight < 10000) {
        result.freight = freight
        break
      }
    }
  }

  // Extraer cantidad
  // Buscar patrones como: quantity: 3, quantity 3, qty: 3, cantidad: 3
  const quantityPatterns = [
    /(?:quantity|qty|cantidad)[:\s]*(\d+)/i,
    /(?:x|×)\s*(\d+)/, // Formato "x3" o "×3"
  ]

  for (const pattern of quantityPatterns) {
    const match = text.match(pattern)
    if (match && match[1]) {
      const qty = parseInt(match[1])
      if (qty > 0 && qty < 1000) {
        result.cantidad = qty
        break
      }
    }
  }

  // Extraer peso en gramos
  // Buscar patrones como: weight: 33g, weight 33g, peso: 33g, 33g, 33 g
  const weightPatterns = [
    /(?:weight|peso)[:\s]*(\d+\.?\d*)\s*g/i,
    /(\d+\.?\d*)\s*g(?:ram)?/i,
  ]

  for (const pattern of weightPatterns) {
    const match = text.match(pattern)
    if (match && match[1]) {
      const weight = parseFloat(match[1])
      if (weight > 0 && weight < 100000) {
        result.peso = weight
        break
      }
    }
  }

  // Extraer nombre del producto
  // Buscar líneas que contengan descripciones de productos comunes
  const productKeywords = [
    'stainless steel',
    'food grade',
    'water',
    'filter',
    'usb',
    'iphone',
    'magnetic',
    'dongle',
    'universal',
    'secondary',
    'valve',
    'grade',
    'steel',
  ]

  const lines = text.split('\n').map(line => line.trim()).filter(line => line.length > 10)
  
  // Buscar línea con keywords de producto
  for (const line of lines) {
    const lowerLine = line.toLowerCase()
    // Si la línea contiene palabras clave de producto y no es solo números/precios
    if (
      productKeywords.some(keyword => lowerLine.includes(keyword)) &&
      !/^[\d\s¥$.,:()]+$/.test(line) &&
      !line.match(/^(price|freight|quantity|weight|order)/i)
    ) {
      // Limpiar la línea: remover caracteres especiales al inicio/final
      let cleaned = line.replace(/^[^\w]+|[^\w]+$/g, '').trim()
      if (cleaned.length > 5) {
        result.producto = cleaned.substring(0, 100) // Limitar a 100 caracteres
        break
      }
    }
  }

  // Si no encontramos producto por keywords, usar la primera línea significativa que no sea un número
  if (!result.producto && lines.length > 0) {
    for (const line of lines) {
      // Saltar líneas que son claramente números, precios, o campos de datos
      if (
        line.length > 5 &&
        !/^[\d\s¥$.,:()]+$/.test(line) &&
        !line.match(/^(price|freight|quantity|weight|order|sku|color)/i) &&
        !line.match(/^\d+\.?\d*\s*(g|gram|kg|yuan|¥|\$)/i)
      ) {
        result.producto = line.substring(0, 100)
        break
      }
    }
  }

  return result
}

