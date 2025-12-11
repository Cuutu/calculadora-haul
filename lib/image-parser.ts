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
  const pricePattern = /price[:\s]*¥?\s*(\d+[.,]\d+|\d+)/gi
  const priceMatches = Array.from(normalizedText.matchAll(pricePattern))
  
  console.log('Precios encontrados:', priceMatches.length, priceMatches.map(m => ({ index: m.index, price: m[1] })))
  
  if (priceMatches.length === 0) {
    console.log('No se encontraron precios. Texto completo:', normalizedText.substring(0, 500))
    return []
  }
  
  // Para cada precio encontrado, buscar los demás datos en un bloque cercano
  for (let i = 0; i < priceMatches.length; i++) {
    const priceMatch = priceMatches[i]
    const priceIndex = priceMatch.index || 0
    const priceStr = priceMatch[1] || ''
    const price = parseFloat(priceStr.replace(',', '.'))
    
    if (price <= 0 || price >= 10000) {
      console.log('Precio inválido:', price)
      continue
    }
    
    // Definir el bloque de texto para este producto
    // Buscar desde el precio hasta encontrar el siguiente "Price:" o hasta 800 caracteres
    const startIndex = Math.max(0, priceIndex)
    let endIndex = normalizedText.length
    
    // Buscar el siguiente precio
    if (i < priceMatches.length - 1) {
      const nextPriceIndex = priceMatches[i + 1].index || normalizedText.length
      endIndex = Math.min(endIndex, nextPriceIndex)
    } else {
      // Si es el último, tomar hasta 800 caracteres después
      endIndex = Math.min(normalizedText.length, priceIndex + 800)
    }
    
    const blockText = normalizedText.substring(startIndex, endIndex)
    
    console.log(`\nProducto ${i + 1}:`)
    console.log('Bloque de texto:', blockText.substring(0, 200))
    console.log('Precio encontrado:', price)
    
    // Extraer datos del bloque
    const product = extractProductFromBlock(blockText, price)
    
    if (product) {
      console.log('Producto extraído:', product)
      // Solo agregar si no es duplicado exacto
      if (!isDuplicate(product, products)) {
        products.push(product)
      } else {
        console.log('Producto duplicado, omitido')
      }
    }
  }
  
  console.log(`\nTotal de productos extraídos: ${products.length}`)
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
        console.log('Freight encontrado:', freight)
        break
      }
    }
    if (result.freight > 0) break
  }
  
  // Buscar Quantity - buscar después del precio
  const quantityPatterns = [
    /quantity[:\s]*(\d+)/gi,
    /qty[:\s]*(\d+)/gi,
  ]
  
  for (const pattern of quantityPatterns) {
    const matches = Array.from(blockText.matchAll(pattern))
    // Tomar el primer match después del inicio
    for (const match of matches) {
      const qty = parseInt(match[1] || '1')
      if (qty > 0 && qty < 1000) {
        result.cantidad = qty
        console.log('Quantity encontrada:', qty)
        break
      }
    }
    if (result.cantidad > 1) break
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
        console.log('Weight encontrado:', weight)
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
