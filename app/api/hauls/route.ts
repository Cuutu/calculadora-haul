import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import connectDB from '@/lib/mongodb';
import Haul from '@/models/Haul';
import { Product, ExchangeRates } from '@/types';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { message: 'No autorizado' },
        { status: 401 }
      );
    }

    await connectDB();

    const hauls = await Haul.find({ userId: session.user.id })
      .sort({ createdAt: -1 });

    return NextResponse.json(hauls);
  } catch (error) {
    console.error('Error fetching hauls:', error);
    return NextResponse.json(
      { message: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { message: 'No autorizado' },
        { status: 401 }
      );
    }

    const { name, products, exchangeRates } = await request.json();

    if (!name || !products || !exchangeRates) {
      return NextResponse.json(
        { message: 'Todos los campos son requeridos' },
        { status: 400 }
      );
    }

    await connectDB();

    const haul = new Haul({
      userId: session.user.id,
      name,
      products,
      exchangeRates,
    });

    await haul.save();

    return NextResponse.json(haul, { status: 201 });
  } catch (error) {
    console.error('Error creating haul:', error);
    return NextResponse.json(
      { message: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
