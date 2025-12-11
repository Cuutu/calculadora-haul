import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('image') as File

    if (!file) {
      return NextResponse.json(
        { error: 'No se proporcionó ninguna imagen' },
        { status: 400 }
      )
    }

    // Verificar que OpenAI API key esté configurada
    const openaiApiKey = process.env.OPENAI_API_KEY
    if (!openaiApiKey) {
      return NextResponse.json(
        { error: 'OPENAI_API_KEY no está configurada en las variables de entorno' },
        { status: 500 }
      )
    }

    // Convertir la imagen a base64
    const arrayBuffer = await file.arrayBuffer()
    const base64Image = Buffer.from(arrayBuffer).toString('base64')
    const mimeType = file.type || 'image/jpeg'

    // Llamar a OpenAI Vision API
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: `Analiza esta imagen de un producto de un haul. Extrae la siguiente información en formato JSON:
{
  "producto": "nombre o descripción del producto",
  "precioYuanes": número (solo el número, sin el símbolo ¥),
  "freight": número (solo el número, sin el símbolo ¥),
  "cantidad": número,
  "peso": número (en gramos, sin la unidad "g")
}

Si algún campo no está visible o no se puede determinar, usa null para ese campo. 
Solo devuelve el JSON, sin texto adicional.`
              },
              {
                type: 'image_url',
                image_url: {
                  url: `data:${mimeType};base64,${base64Image}`
                }
              }
            ]
          }
        ],
        max_tokens: 500,
        response_format: { type: 'json_object' }
      })
    })

    if (!response.ok) {
      const errorData = await response.text()
      console.error('OpenAI API Error:', errorData)
      return NextResponse.json(
        { error: 'Error al procesar la imagen con OpenAI', details: errorData },
        { status: response.status }
      )
    }

    const data = await response.json()
    const content = data.choices[0]?.message?.content

    if (!content) {
      return NextResponse.json(
        { error: 'No se pudo extraer información de la imagen' },
        { status: 500 }
      )
    }

    // Parsear el JSON de respuesta
    let extractedData
    try {
      extractedData = JSON.parse(content)
    } catch (parseError) {
      console.error('Error parsing JSON:', parseError)
      return NextResponse.json(
        { error: 'Error al parsear la respuesta de OpenAI' },
        { status: 500 }
      )
    }

    // Validar y limpiar los datos
    const result = {
      producto: extractedData.producto || '',
      precioYuanes: extractedData.precioYuanes !== null && extractedData.precioYuanes !== undefined 
        ? parseFloat(extractedData.precioYuanes) || 0 
        : 0,
      freight: extractedData.freight !== null && extractedData.freight !== undefined 
        ? parseFloat(extractedData.freight) || 0 
        : 0,
      cantidad: extractedData.cantidad !== null && extractedData.cantidad !== undefined 
        ? parseInt(extractedData.cantidad) || 1 
        : 1,
      peso: extractedData.peso !== null && extractedData.peso !== undefined 
        ? parseFloat(extractedData.peso) || 0 
        : 0,
    }

    return NextResponse.json(result)

  } catch (error) {
    console.error('Error processing image:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor al procesar la imagen' },
      { status: 500 }
    )
  }
}

