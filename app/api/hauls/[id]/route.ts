import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import connectDB from '@/lib/mongodb';
import Haul from '@/models/Haul';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { message: 'No autorizado' },
        { status: 401 }
      );
    }

    await connectDB();

    const haul = await Haul.findOne({
      _id: params.id,
      userId: session.user.id,
    });

    if (!haul) {
      return NextResponse.json(
        { message: 'Haul no encontrado' },
        { status: 404 }
      );
    }

    return NextResponse.json(haul);
  } catch (error) {
    console.error('Error fetching haul:', error);
    return NextResponse.json(
      { message: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { message: 'No autorizado' },
        { status: 401 }
      );
    }

    const { name, products, exchangeRates } = await request.json();

    await connectDB();

    const haul = await Haul.findOneAndUpdate(
      {
        _id: params.id,
        userId: session.user.id,
      },
      {
        name,
        products,
        exchangeRates,
      },
      { new: true }
    );

    if (!haul) {
      return NextResponse.json(
        { message: 'Haul no encontrado' },
        { status: 404 }
      );
    }

    return NextResponse.json(haul);
  } catch (error) {
    console.error('Error updating haul:', error);
    return NextResponse.json(
      { message: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { message: 'No autorizado' },
        { status: 401 }
      );
    }

    await connectDB();

    const haul = await Haul.findOneAndDelete({
      _id: params.id,
      userId: session.user.id,
    });

    if (!haul) {
      return NextResponse.json(
        { message: 'Haul no encontrado' },
        { status: 404 }
      );
    }

    return NextResponse.json({ message: 'Haul eliminado exitosamente' });
  } catch (error) {
    console.error('Error deleting haul:', error);
    return NextResponse.json(
      { message: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
