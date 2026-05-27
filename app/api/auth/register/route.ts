import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { slugify } from "@/lib/utils";

const registerSchema = z.object({
  salonName: z.string().min(2, "Nome do salão deve ter pelo menos 2 caracteres"),
  name: z.string().min(2, "Nome deve ter pelo menos 2 caracteres"),
  email: z.string().email("Email inválido"),
  password: z.string().min(6, "Senha deve ter pelo menos 6 caracteres"),
  phone: z.string().optional(),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const data = registerSchema.parse(body);

    const slug = slugify(data.salonName);

    const existingSalon = await db.salon.findUnique({ where: { slug } });
    if (existingSalon) {
      return NextResponse.json(
        { error: "Já existe um salão com esse nome. Tente um nome diferente." },
        { status: 409 }
      );
    }

    const hashedPassword = await bcrypt.hash(data.password, 12);

    const salon = await db.salon.create({
      data: {
        name: data.salonName,
        slug,
        email: data.email,
        phone: data.phone,
        users: {
          create: {
            name: data.name,
            email: data.email,
            password: hashedPassword,
            role: "OWNER",
          },
        },
        workingHours: {
          create: [1, 2, 3, 4, 5].map((day) => ({
            dayOfWeek: day,
            openTime: "09:00",
            closeTime: "18:00",
            isOpen: true,
          })),
        },
      },
    });

    return NextResponse.json({ slug: salon.slug }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors[0].message }, { status: 400 });
    }

    // Prisma unique constraint violation
    if (
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      (error as { code: string }).code === "P2002"
    ) {
      return NextResponse.json(
        { error: "Este email já está cadastrado. Tente fazer login." },
        { status: 409 }
      );
    }

    const message = error instanceof Error ? error.message : String(error);
    console.error("[REGISTER]", message);

    if (process.env.NODE_ENV === "development") {
      return NextResponse.json({ error: message }, { status: 500 });
    }
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 });
  }
}
