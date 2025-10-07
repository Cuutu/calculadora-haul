import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const rawName = (body?.name ?? '').toString();
    const rawUsername = (body?.username ?? '').toString();
    const rawPassword = (body?.password ?? '').toString();

    const name = rawName.trim();
    const username = rawUsername.trim().toLowerCase();
    const password = rawPassword.trim();

    if (!name || !username || !password) {
      return NextResponse.json(
        { message: 'Todos los campos son requeridos' },
        { status: 400 }
      );
    }

    if (username.length < 3) {
      return NextResponse.json(
        { message: 'El nombre de usuario debe tener al menos 3 caracteres' },
        { status: 400 }
      );
    }

    // Solo letras minúsculas, números y guion bajo. Sin espacios ni acentos.
    const usernameRegex = /^[a-z0-9_]+$/;
    if (!usernameRegex.test(username)) {
      return NextResponse.json(
        { message: 'El nombre de usuario solo puede contener letras (a-z), números y _' },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { message: 'La contraseña debe tener al menos 6 caracteres' },
        { status: 400 }
      );
    }

    await connectDB();

    // Check if user already exists
    const existingUser = await User.findOne({ username });
    if (existingUser) {
      return NextResponse.json(
        { message: 'El nombre de usuario ya existe' },
        { status: 400 }
      );
    }

    // Create new user
    const user = new User({ name, username, password });

    await user.save();

    return NextResponse.json(
      { message: 'Usuario creado exitosamente', user: { id: user._id, username: user.username, name: user.name } },
      { status: 201 }
    );
  } catch (error) {
    console.error('Registration error:', error);
    // Manejo específico para errores de índice duplicado de Mongo (11000)
    // Esto puede ocurrir si existe un índice único en un campo como `username` o `email`.
    if (typeof error === 'object' && error && (error as any).code === 11000) {
      // Independientemente del campo involucrado, retornamos el mensaje de username
      // porque el registro solo usa nombre de usuario como identificador único.
      return NextResponse.json(
        { message: 'El nombre de usuario ya existe' },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { message: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
