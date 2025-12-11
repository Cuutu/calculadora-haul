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
 * Busca bloques estructurados con Price, Freight, Quantity, Weight
 */
export function parseMultipleProducts(text: string): ExtractedProductData[] {
  const products: ExtractedProductData[] = []
  
  // Normalizar el texto: reemplazar múltiples espacios y saltos de línea
  const normalizedText = text.replace(/\s+/g, ' ').trim()
  
  // Buscar todas las ocurrencias de "Price:" que indican un producto
  // Buscar primero precios con decimales explícitos, luego enteros
  const pricePatternWithDecimal = /price[:\s]*¥?\s*(\d+)[.,](\d{1,2})/gi
  const pricePatternInteger = /price[:\s]*¥?\s*(\d+)(?![.,\d])/gi
  
  const decimalMatches = Array.from(normalizedText.matchAll(pricePatternWithDecimal))
  const integerMatches = Array.from(normalizedText.matchAll(pricePatternInteger))
  
  // Combinar matches, priorizando los que tienen decimales
  const allPriceMatches: Array<{ index: number; priceStr: string; hasDecimal: boolean }> = []
  
  for (const match of decimalMatches) {
    const priceStr = `${match[1]}.${match[2]}`
    allPriceMatches.push({
      index: match.index || 0,
      priceStr: priceStr,
      hasDecimal: true
    })
  }
  
  // Agregar enteros solo si no hay un decimal cerca
  for (const match of integerMatches) {
    const index = match.index || 0
    const priceStr = match[1] || ''
    // Verificar que no haya un decimal match muy cerca (dentro de 20 caracteres)
    const hasNearbyDecimal = allPriceMatches.some(dm => Math.abs(dm.index - index) < 20)
    if (!hasNearbyDecimal) {
      allPriceMatches.push({
        index: index,
        priceStr: priceStr,
        hasDecimal: false
      })
    }
  }
  
  // Ordenar por índice
  allPriceMatches.sort((a, b) => a.index - b.index)
  
  if (allPriceMatches.length === 0) {
    return []
  }
  
  // Para cada precio encontrado, buscar los demás datos en un bloque cercano
  for (let i = 0; i < allPriceMatches.length; i++) {
    const priceMatch = allPriceMatches[i]
    const priceIndex = priceMatch.index
    const priceStr = priceMatch.priceStr
    const price = parseFloat(priceStr.replace(',', '.'))
    
    if (price <= 0 || price >= 10000) {
      continue
    }
    
    // Definir el bloque de texto para este producto
    // Buscar desde el precio hasta encontrar el siguiente "Price:" o hasta 800 caracteres
    const startIndex = Math.max(0, priceIndex)
    let endIndex = normalizedText.length
    
    // Buscar el siguiente precio
    if (i < allPriceMatches.length - 1) {
      const nextPriceIndex = allPriceMatches[i + 1].index
      endIndex = Math.min(endIndex, nextPriceIndex)
    } else {
      // Si es el último, tomar hasta 800 caracteres después
      endIndex = Math.min(normalizedText.length, priceIndex + 800)
    }
    
    const blockText = normalizedText.substring(startIndex, endIndex)
    
    // Extraer datos del bloque
    const product = extractProductFromBlock(blockText, price)
    
    if (product) {
      // Solo agregar si no es duplicado exacto
      if (!isDuplicate(product, products)) {
        products.push(product)
      }
    }
  }
  
  return products
}

/**
 * Extrae datos de un producto de un bloque de texto
 */
function extractProductFromBlock(blockText: string, knownPrice: number): ExtractedProductData | null {
  const result: ExtractedProductData = {
    producto: '',
    precioYuanes: knownPrice,
    freight: 0,
    cantidad: 1,
    peso: 0,
  }
  
  // Buscar Freight - buscar después del precio
  const freightPatterns = [
    /freight[:\s]*¥?\s*(\d+[.,]\d+|\d+)/gi,
    /freight[:\s]*(\d+[.,]\d+|\d+)/gi,
  ]
  
  for (const pattern of freightPatterns) {
    const matches = Array.from(blockText.matchAll(pattern))
    // Tomar el primer match después del inicio (más cercano al precio)
    for (const match of matches) {
      const freightStr = match[1] || ''
      const freight = parseFloat(freightStr.replace(',', '.'))
      if (freight >= 0 && freight < 10000) {
        result.freight = freight
        break
      }
    }
    if (result.freight > 0) break
  }
  
  // Buscar Quantity - buscar después del precio
  // El OCR puede leer "Quantity" como "Quan", "Quant", "Quy", etc.
  // Buscar patrones como: "Quan 3", "Quant 2", "Quantity 1", "Quy 1"
  const quantityPatterns = [
    /quan[tiy]*[:\s]*(\d+)/gi,  // Captura "Quantity", "Quan", "Quant", "Quy"
    /qty[:\s]*(\d+)/gi,
  ]
  
  for (const pattern of quantityPatterns) {
    const matches = Array.from(blockText.matchAll(pattern))
    // Tomar el primer match que tenga sentido
    for (const match of matches) {
      const qty = parseInt(match[1] || '1')
      if (qty > 0 && qty < 1000) {
        result.cantidad = qty
        break
      }
    }
    if (result.cantidad > 1) break
  }
  
  // Si aún no encontramos cantidad, buscar cualquier número después de "Quan" o "Quant" (incluso con espacios)
  if (result.cantidad === 1) {
    // Buscar "Quan" o "Quant" seguido de espacio y número
    const quanMatch = blockText.match(/quan[tiy]*\s+(\d+)/i)
    if (quanMatch && quanMatch[1]) {
      const qty = parseInt(quanMatch[1])
      if (qty > 0 && qty < 1000) {
        result.cantidad = qty
      }
    }
  }
  
  // Buscar Weight - buscar después del precio
  const weightPatterns = [
    /weight[:\s]*(\d+[.,]?\d*)\s*g/gi,
    /weight[:\s]*(\d+)/gi,
    /(\d+)\s*g(?:ram)?/gi,
  ]
  
  for (const pattern of weightPatterns) {
    const matches = Array.from(blockText.matchAll(pattern))
    // Tomar el primer match que tenga sentido (entre 1 y 100000)
    for (const match of matches) {
      const weightStr = match[1] || ''
      const weight = parseFloat(weightStr.replace(',', '.'))
      if (weight > 0 && weight < 100000) {
        result.peso = weight
        break
      }
    }
    if (result.peso > 0) break
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
    
    // Solo considerar duplicado si TODO es exactamente igual
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
