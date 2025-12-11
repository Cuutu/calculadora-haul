/**
 * Parsea el texto extraído de una imagen de producto y extrae:
 * - Nombre del producto
 * - Precio en yuanes (¥)
 * - Freight (¥)
 * - Cantidad
 * - Peso (en gramos)
 * 
 * Soporta múltiples productos en una sola imagen
 */

export interface ExtractedProductData {
  producto: string
  precioYuanes: number
  freight: number
  cantidad: number
  peso: number
}

/**
 * Extrae un solo producto del texto
 */
function parseSingleProduct(text: string, startIndex: number = 0): ExtractedProductData | null {
  const result: ExtractedProductData = {
    producto: '',
    precioYuanes: 0,
    freight: 0,
    cantidad: 1,
    peso: 0,
  }

  // Buscar precio en yuanes - patrones como: Price: ¥3.80, ¥3.80, price ¥3.80
  const pricePatterns = [
    /(?:price|precio)[:\s]*¥?\s*(\d+[.,]?\d*)/i,
    /¥\s*(\d+[.,]?\d*)/,
    /(\d+[.,]?\d*)\s*¥/,
  ]

  for (const pattern of pricePatterns) {
    const match = text.substring(startIndex).match(pattern)
    if (match && match[1]) {
      const price = parseFloat(match[1].replace(',', '.'))
      if (price > 0 && price < 10000) {
        result.precioYuanes = price
        break
      }
    }
  }

  // Buscar freight - patrones como: Freight: ¥6.00, freight ¥6.00
  const freightPatterns = [
    /(?:freight|env[ií]o|shipping)[:\s]*¥?\s*(\d+[.,]?\d*)/i,
    /freight[:\s]*(\d+[.,]?\d*)/i,
  ]

  for (const pattern of freightPatterns) {
    const match = text.substring(startIndex).match(pattern)
    if (match && match[1]) {
      const freight = parseFloat(match[1].replace(',', '.'))
      if (freight >= 0 && freight < 10000) {
        result.freight = freight
        break
      }
    }
  }

  // Buscar cantidad - patrones como: Quantity: 3, quantity 3, qty: 3
  const quantityPatterns = [
    /(?:quantity|qty|cantidad)[:\s]*(\d+)/i,
    /(?:x|×)\s*(\d+)/,
  ]

  for (const pattern of quantityPatterns) {
    const match = text.substring(startIndex).match(pattern)
    if (match && match[1]) {
      const qty = parseInt(match[1])
      if (qty > 0 && qty < 1000) {
        result.cantidad = qty
        break
      }
    }
  }

  // Buscar peso en gramos - patrones como: Weight: 33g, weight 33g, 33g
  const weightPatterns = [
    /(?:weight|peso)[:\s]*(\d+[.,]?\d*)\s*g/i,
    /(\d+[.,]?\d*)\s*g(?:ram)?/i,
  ]

  for (const pattern of weightPatterns) {
    const match = text.substring(startIndex).match(pattern)
    if (match && match[1]) {
      const weight = parseFloat(match[1].replace(',', '.'))
      if (weight > 0 && weight < 100000) {
        result.peso = weight
        break
      }
    }
  }

  // Buscar nombre del producto - líneas con keywords de producto
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
    'coffee',
    'powder',
    'ring',
    'tamper',
    'distributor',
  ]

  const lines = text.split('\n').map(line => line.trim()).filter(line => line.length > 10)
  
  // Buscar línea con keywords de producto cerca del startIndex
  for (const line of lines) {
    const lineIndex = text.indexOf(line)
    // Si la línea está cerca del área que estamos procesando
    if (lineIndex >= startIndex - 200 && lineIndex <= startIndex + 500) {
      const lowerLine = line.toLowerCase()
      if (
        productKeywords.some(keyword => lowerLine.includes(keyword)) &&
        !/^[\d\s¥$.,:()]+$/.test(line) &&
        !line.match(/^(price|freight|quantity|weight|order)/i)
      ) {
        let cleaned = line.replace(/^[^\w]+|[^\w]+$/g, '').trim()
        if (cleaned.length > 5) {
          result.producto = cleaned.substring(0, 100)
          break
        }
      }
    }
  }

  // Si encontramos al menos precio o freight, consideramos que hay un producto
  if (result.precioYuanes > 0 || result.freight > 0) {
    // Si no encontramos producto por keywords, usar la primera línea significativa cerca
    if (!result.producto) {
      for (const line of lines) {
        const lineIndex = text.indexOf(line)
        if (lineIndex >= startIndex - 200 && lineIndex <= startIndex + 500) {
          if (
            line.length > 5 &&
            !/^[\d\s¥$.,:()]+$/.test(line) &&
            !line.match(/^(price|freight|quantity|weight|order|sku|color)/i) &&
            !line.match(/^\d+[.,]?\d*\s*(g|gram|kg|yuan|¥|\$)/i)
          ) {
            result.producto = line.substring(0, 100)
            break
          }
        }
      }
    }
    return result
  }

  return null
}

/**
 * Extrae múltiples productos del texto OCR
 */
export function parseMultipleProducts(text: string): ExtractedProductData[] {
  const products: ExtractedProductData[] = []
  
  // Buscar todas las ocurrencias de "Price:" o "¥" que indiquen un nuevo producto
  const priceMarkers = [
    ...Array.from(text.matchAll(/(?:price|precio)[:\s]*¥?\s*(\d+[.,]?\d*)/gi)),
    ...Array.from(text.matchAll(/¥\s*(\d+[.,]?\d*)/g)),
  ]

  // Si encontramos múltiples precios, procesar cada uno como un producto separado
  if (priceMarkers.length > 1) {
    for (let i = 0; i < priceMarkers.length; i++) {
      const marker = priceMarkers[i]
      const startIndex = marker.index || 0
      
      // Buscar el siguiente marcador o el final del texto
      const endIndex = i < priceMarkers.length - 1 
        ? (priceMarkers[i + 1].index || text.length)
        : text.length
      
      // Extraer el bloque de texto para este producto
      const productText = text.substring(Math.max(0, startIndex - 300), endIndex)
      const product = parseSingleProduct(productText, Math.max(0, startIndex - 300))
      
      if (product) {
        products.push(product)
      }
    }
  } else if (priceMarkers.length === 1) {
    // Solo un producto
    const product = parseSingleProduct(text, 0)
    if (product) {
      products.push(product)
    }
  } else {
    // Intentar parsear como un solo producto sin marcadores claros
    const product = parseSingleProduct(text, 0)
    if (product && (product.precioYuanes > 0 || product.freight > 0)) {
      products.push(product)
    }
  }

  return products
}

/**
 * Función legacy para compatibilidad - extrae un solo producto
 */
export function parseProductText(text: string): ExtractedProductData {
  const products = parseMultipleProducts(text)
  return products.length > 0 ? products[0] : {
    producto: '',
    precioYuanes: 0,
    freight: 0,
    cantidad: 1,
    peso: 0,
  }
}
