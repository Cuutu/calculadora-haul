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
 * Extrae múltiples productos del texto OCR
 * Solo detecta productos cuando hay Price y Freight cerca uno del otro
 */
export function parseMultipleProducts(text: string): ExtractedProductData[] {
  const products: ExtractedProductData[] = []
  
  // Buscar todos los bloques que contengan "Price:" y "Freight:" cerca uno del otro
  // Esto indica un producto real
  const lines = text.split('\n').map(line => line.trim())
  
  // Buscar patrones de "Price:" seguido de "Freight:" en un rango cercano
  const priceFreightPattern = /(?:price|precio)[:\s]*¥?\s*(\d+[.,]?\d*)[\s\S]*?(?:freight|env[ií]o|shipping)[:\s]*¥?\s*(\d+[.,]?\d*)/gi
  
  let match
  const productBlocks: Array<{ start: number; end: number; price: number; freight: number }> = []
  
  while ((match = priceFreightPattern.exec(text)) !== null) {
    const price = parseFloat(match[1].replace(',', '.'))
    const freight = parseFloat(match[2].replace(',', '.'))
    
    if (price > 0 && price < 10000 && freight >= 0 && freight < 10000) {
      const start = Math.max(0, match.index - 500)
      const end = Math.min(text.length, match.index + match[0].length + 500)
      productBlocks.push({ start, end, price, freight })
    }
  }
  
  // Si no encontramos el patrón Price+Freight, buscar solo "Price:" y verificar que haya datos cerca
  if (productBlocks.length === 0) {
    const priceOnlyPattern = /(?:price|precio)[:\s]*¥?\s*(\d+[.,]?\d*)/gi
    const priceMatches = Array.from(text.matchAll(priceOnlyPattern))
    
    for (const priceMatch of priceMatches) {
      const price = parseFloat(priceMatch[1].replace(',', '.'))
      if (price > 0 && price < 10000) {
        const start = Math.max(0, (priceMatch.index || 0) - 500)
        const end = Math.min(text.length, (priceMatch.index || 0) + 1000)
        
        // Buscar freight cerca de este precio
        const blockText = text.substring(start, end)
        const freightMatch = blockText.match(/(?:freight|env[ií]o|shipping)[:\s]*¥?\s*(\d+[.,]?\d*)/i)
        const freight = freightMatch ? parseFloat(freightMatch[1].replace(',', '.')) : 0
        
        if (freight >= 0 && freight < 10000) {
          productBlocks.push({ start, end, price, freight })
        }
      }
    }
  }
  
  // Procesar cada bloque encontrado
  for (const block of productBlocks) {
    const blockText = text.substring(block.start, block.end)
    const product = extractProductFromBlock(blockText, block.price, block.freight)
    
    if (product && !isDuplicate(product, products)) {
      products.push(product)
    }
  }
  
  // Si no encontramos nada con el método anterior, intentar un solo producto
  if (products.length === 0) {
    const singleProduct = extractProductFromBlock(text, 0, 0)
    if (singleProduct && (singleProduct.precioYuanes > 0 || singleProduct.freight > 0)) {
      products.push(singleProduct)
    }
  }
  
  return products
}

/**
 * Extrae datos de un producto de un bloque de texto
 */
function extractProductFromBlock(blockText: string, knownPrice: number = 0, knownFreight: number = 0): ExtractedProductData | null {
  const result: ExtractedProductData = {
    producto: '',
    precioYuanes: knownPrice,
    freight: knownFreight,
    cantidad: 1,
    peso: 0,
  }
  
  // Si no tenemos precio conocido, buscarlo
  if (result.precioYuanes === 0) {
    const pricePatterns = [
      /(?:price|precio)[:\s]*¥?\s*(\d+[.,]?\d*)/i,
      /¥\s*(\d+[.,]?\d*)/,
    ]
    
    for (const pattern of pricePatterns) {
      const match = blockText.match(pattern)
      if (match && match[1]) {
        const price = parseFloat(match[1].replace(',', '.'))
        if (price > 0 && price < 10000) {
          result.precioYuanes = price
          break
        }
      }
    }
  }
  
  // Si no tenemos freight conocido, buscarlo
  if (result.freight === 0) {
    const freightPatterns = [
      /(?:freight|env[ií]o|shipping)[:\s]*¥?\s*(\d+[.,]?\d*)/i,
    ]
    
    for (const pattern of freightPatterns) {
      const match = blockText.match(pattern)
      if (match && match[1]) {
        const freight = parseFloat(match[1].replace(',', '.'))
        if (freight >= 0 && freight < 10000) {
          result.freight = freight
          break
        }
      }
    }
  }
  
  // Buscar cantidad
  const quantityPatterns = [
    /(?:quantity|qty|cantidad)[:\s]*(\d+)/i,
  ]
  
  for (const pattern of quantityPatterns) {
    const match = blockText.match(pattern)
    if (match && match[1]) {
      const qty = parseInt(match[1])
      if (qty > 0 && qty < 1000) {
        result.cantidad = qty
        break
      }
    }
  }
  
  // Buscar peso
  const weightPatterns = [
    /(?:weight|peso)[:\s]*(\d+[.,]?\d*)\s*g/i,
    /(\d+[.,]?\d*)\s*g(?:ram)?/i,
  ]
  
  for (const pattern of weightPatterns) {
    const match = blockText.match(pattern)
    if (match && match[1]) {
      const weight = parseFloat(match[1].replace(',', '.'))
      if (weight > 0 && weight < 100000) {
        result.peso = weight
        break
      }
    }
  }
  
  // Buscar nombre del producto
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
    'coffee',
    'powder',
    'ring',
    'tamper',
    'distributor',
  ]
  
  const lines = blockText.split('\n').map(line => line.trim()).filter(line => line.length > 10)
  
  for (const line of lines) {
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
  
  // Si no encontramos producto por keywords, usar la primera línea significativa
  if (!result.producto && lines.length > 0) {
    for (const line of lines) {
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
  
  // Solo retornar si tenemos al menos precio o freight
  if (result.precioYuanes > 0 || result.freight > 0) {
    return result
  }
  
  return null
}

/**
 * Verifica si un producto es duplicado de uno ya existente
 */
function isDuplicate(newProduct: ExtractedProductData, existingProducts: ExtractedProductData[]): boolean {
  for (const existing of existingProducts) {
    // Si precio y freight son iguales (o muy similares), es probablemente un duplicado
    const priceDiff = Math.abs(newProduct.precioYuanes - existing.precioYuanes)
    const freightDiff = Math.abs(newProduct.freight - existing.freight)
    
    if (priceDiff < 0.01 && freightDiff < 0.01) {
      return true
    }
  }
  return false
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
