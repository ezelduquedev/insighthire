import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import bcrypt from "bcryptjs"

export async function POST(req: NextRequest) {
  try {
    const { name, email, password } = await req.json()

    // 1. Validar campos requeridos
    if (!name || !email || !password) {
      return NextResponse.json(
        { error: "Faltan campos requeridos" },
        { status: 400 }
      )
    }

    // 2. Validar longitud de contraseña
    if (password.length < 6) {
      return NextResponse.json(
        { error: "La contraseña debe tener al menos 6 caracteres" },
        { status: 400 }
      )
    }

    // 3. Verificar si el usuario ya existe
    const existingUser = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    })

    if (existingUser) {
      return NextResponse.json(
        { error: "El correo electrónico ya está registrado" },
        { status: 409 }
      )
    }

    // 4. Encriptar contraseña
    const hashedPassword = await bcrypt.hash(password, 10)

    // 5. Crear usuario en la base de datos
    const user = await prisma.user.create({
      data: {
        name,
        email: email.toLowerCase(),
        password: hashedPassword,
      },
    })

    // Retornar éxito
    return NextResponse.json(
      {
        message: "Usuario registrado con éxito",
        user: { id: user.id, name: user.name, email: user.email },
      },
      { status: 201 }
    )
  } catch (error) {
    console.error("Error en registro de usuario:", error)
    return NextResponse.json(
      { error: "Error interno del servidor al crear la cuenta" },
      { status: 500 }
    )
  }
}
