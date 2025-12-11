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
  // Patrones más flexibles para capturar mejor
  const pricePatterns = [
    /(?:price|precio)[:\s]*¥?\s*(\d+[.,]?\d*)/gi,
    /¥\s*(\d+[.,]?\d*)\s*\(\$/gi, // Formato: ¥3.80 ($0.54)
  ]
  
  const priceMatches: Array<{ index: number; price: number }> = []
  
  for (const pattern of pricePatterns) {
    const matches = Array.from(text.matchAll(pattern))
    for (const match of matches) {
      const price = parseFloat((match[1] || '').replace(',', '.'))
      if (price > 0 && price < 10000) {
        priceMatches.push({ index: match.index || 0, price })
      }
    }
  }
  
  // Ordenar por índice
  priceMatches.sort((a, b) => a.index - b.index)
  
  if (priceMatches.length === 0) {
    return []
  }
  
  // Para cada precio encontrado, buscar los demás datos cerca
  for (let i = 0; i < priceMatches.length; i++) {
    const priceMatch = priceMatches[i]
    const priceIndex = priceMatch.index
    const price = priceMatch.price
    
    // Definir el bloque de texto para este producto
    // Desde 400 caracteres antes del precio hasta 600 caracteres después
    // O hasta el siguiente precio si existe
    const startIndex = Math.max(0, priceIndex - 400)
    const endIndex = i < priceMatches.length - 1
      ? Math.min(text.length, priceMatches[i + 1].index - 50)
      : Math.min(text.length, priceIndex + 600)
    
    const blockText = text.substring(startIndex, endIndex)
    
    // Extraer datos del bloque
    const product = extractProductFromBlock(blockText, price, priceIndex - startIndex)
    
    if (product && !isDuplicate(product, products)) {
      products.push(product)
    }
  }
  
  return products
}

/**
 * Extrae datos de un producto de un bloque de texto
 */
function extractProductFromBlock(blockText: string, knownPrice: number, priceOffset: number = 0): ExtractedProductData | null {
  const result: ExtractedProductData = {
    producto: '', // No buscamos el título
    precioYuanes: knownPrice,
    freight: 0,
    cantidad: 1,
    peso: 0,
  }
  
  // Buscar Freight (puede ser 0) - buscar TODOS los matches y tomar el más cercano al precio
  const freightPatterns = [
    /(?:freight|env[ií]o|shipping)[:\s]*¥?\s*(\d+[.,]?\d*)/gi,
    /freight[:\s]*¥?\s*(\d+[.,]?\d*)/gi,
  ]
  
  let closestFreight: { value: number; distance: number } | null = null
  
  for (const pattern of freightPatterns) {
    const matches = Array.from(blockText.matchAll(pattern))
    for (const match of matches) {
      const freight = parseFloat((match[1] || '').replace(',', '.'))
      if (freight >= 0 && freight < 10000) {
        const matchIndex = match.index || 0
        const distance = Math.abs(matchIndex - priceOffset)
        if (!closestFreight || distance < closestFreight.distance) {
          closestFreight = { value: freight, distance }
        }
      }
    }
  }
  
  if (closestFreight) {
    result.freight = closestFreight.value
  }
  
  // Buscar Quantity - buscar TODOS los matches y tomar el más cercano al precio
  const quantityPatterns = [
    /(?:quantity|qty|cantidad)[:\s]*(\d+)/gi,
    /quantity[:\s]*(\d+)/gi,
  ]
  
  let closestQuantity: { value: number; distance: number } | null = null
  
  for (const pattern of quantityPatterns) {
    const matches = Array.from(blockText.matchAll(pattern))
    for (const match of matches) {
      const qty = parseInt(match[1] || '1')
      if (qty > 0 && qty < 1000) {
        const matchIndex = match.index || 0
        const distance = Math.abs(matchIndex - priceOffset)
        if (!closestQuantity || distance < closestQuantity.distance) {
          closestQuantity = { value: qty, distance }
        }
      }
    }
  }
  
  if (closestQuantity) {
    result.cantidad = closestQuantity.value
  }
  
  // Buscar Weight - buscar TODOS los matches y tomar el más cercano al precio
  const weightPatterns = [
    /(?:weight|peso)[:\s]*(\d+[.,]?\d*)\s*g/gi,
    /(\d+[.,]?\d*)\s*g(?:ram)?/gi,
    /weight[:\s]*(\d+[.,]?\d*)\s*g/gi,
  ]
  
  let closestWeight: { value: number; distance: number } | null = null
  
  for (const pattern of weightPatterns) {
    const matches = Array.from(blockText.matchAll(pattern))
    for (const match of matches) {
      const weight = parseFloat((match[1] || '').replace(',', '.'))
      if (weight > 0 && weight < 100000) {
        const matchIndex = match.index || 0
        const distance = Math.abs(matchIndex - priceOffset)
        if (!closestWeight || distance < closestWeight.distance) {
          closestWeight = { value: weight, distance }
        }
      }
    }
  }
  
  if (closestWeight) {
    result.peso = closestWeight.value
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
    
    // Ser más permisivo con duplicados - solo si TODO es igual
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
