import { NextResponse } from "next/server"

export async function GET() {
  try {
    const [oficialResponse, criptoResponse] = await Promise.all([
      fetch("https://dolarapi.com/v1/dolares/oficial", { cache: "no-store" }),
      fetch("https://dolarapi.com/v1/dolares/cripto", { cache: "no-store" }),
    ])

    if (!oficialResponse.ok || !criptoResponse.ok) {
      throw new Error("Failed to fetch exchange rates")
    }

    const oficialData = await oficialResponse.json()
    const criptoData = await criptoResponse.json()

    return NextResponse.json({
      oficial: {
        compra: oficialData.compra || 0,
        venta: oficialData.venta || 0,
      },
      cripto: {
        compra: criptoData.compra || 0,
        venta: criptoData.venta || 0,
      },
    })
  } catch (error) {
    console.error("[v0] Error fetching exchange rates:", error)
    return NextResponse.json({ error: "Failed to fetch exchange rates" }, { status: 500 })
  }
}
