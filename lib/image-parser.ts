/**
 * Parsea el texto extraído de una imagen de producto y extrae:
 * - Price (precio en yuanes)
 * - Freight (freight en yuanes, puede ser 0)
 * - Quantity (cantidad)
 * - Weight (peso en gramos)
 * 
 * NO busca el título del producto - debe ser completado manualmente
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
 * Busca bloques con Price, Freight, Quantity, Weight
 */
export function parseMultipleProducts(text: string): ExtractedProductData[] {
  const products: ExtractedProductData[] = []
  
  // Buscar todas las ocurrencias de "Price:" que indican un producto
  const pricePattern = /(?:price|precio)[:\s]*¥?\s*(\d+[.,]?\d*)/gi
  const priceMatches = Array.from(text.matchAll(pricePattern))
  
  if (priceMatches.length === 0) {
    return []
  }
  
  // Para cada precio encontrado, buscar los demás datos cerca
  for (let i = 0; i < priceMatches.length; i++) {
    const priceMatch = priceMatches[i]
    const priceIndex = priceMatch.index || 0
    const price = parseFloat(priceMatch[1].replace(',', '.'))
    
    if (price <= 0 || price >= 10000) continue
    
    // Definir el bloque de texto para este producto
    // Desde 300 caracteres antes del precio hasta 500 caracteres después
    // O hasta el siguiente precio si existe
    const startIndex = Math.max(0, priceIndex - 300)
    const endIndex = i < priceMatches.length - 1
      ? Math.min(text.length, (priceMatches[i + 1].index || text.length) - 100)
      : Math.min(text.length, priceIndex + 500)
    
    const blockText = text.substring(startIndex, endIndex)
    
    // Extraer datos del bloque
    const product = extractProductFromBlock(blockText, price)
    
    if (product && !isDuplicate(product, products)) {
      products.push(product)
    }
  }
  
  return products
}

/**
 * Extrae datos de un producto de un bloque de texto
 */
function extractProductFromBlock(blockText: string, knownPrice: number): ExtractedProductData | null {
  const result: ExtractedProductData = {
    producto: '', // No buscamos el título
    precioYuanes: knownPrice,
    freight: 0,
    cantidad: 1,
    peso: 0,
  }
  
  // Buscar Freight (puede ser 0)
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
  
  // Buscar Quantity
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
  
  // Buscar Weight
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
  
  // Solo retornar si tenemos precio válido
  if (result.precioYuanes > 0) {
    return result
  }
  
  return null
}

/**
 * Verifica si un producto es duplicado de uno ya existente
 */
function isDuplicate(newProduct: ExtractedProductData, existingProducts: ExtractedProductData[]): boolean {
  for (const existing of existingProducts) {
    // Si precio, freight, cantidad y peso son iguales, es un duplicado
    const priceDiff = Math.abs(newProduct.precioYuanes - existing.precioYuanes)
    const freightDiff = Math.abs(newProduct.freight - existing.freight)
    const qtyDiff = Math.abs(newProduct.cantidad - existing.cantidad)
    const weightDiff = Math.abs(newProduct.peso - existing.peso)
    
    if (priceDiff < 0.01 && freightDiff < 0.01 && qtyDiff === 0 && weightDiff < 1) {
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
