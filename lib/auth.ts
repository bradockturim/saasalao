import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { db } from "@/lib/db";
import bcrypt from "bcryptjs";
import { z } from "zod";

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  salonSlug: z.string().min(1),
});

export const authOptions: NextAuthOptions = {
  session: { strategy: "jwt" },
  pages: {
    signIn: "/login",
    error: "/login",
  },
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Senha", type: "password" },
        salonSlug: { label: "Salão", type: "text" },
      },
      async authorize(credentials) {
        const parsed = loginSchema.safeParse(credentials);
        if (!parsed.success) return null;

        const { email, password, salonSlug } = parsed.data;

        const salon = await db.salon.findUnique({
          where: { slug: salonSlug, isActive: true },
        });
        if (!salon) return null;

        const user = await db.user.findUnique({
          where: { email_salonId: { email, salonId: salon.id } },
        });
        if (!user || !user.isActive) return null;

        const passwordMatch = await bcrypt.compare(password, user.password);
        if (!passwordMatch) return null;

        return {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          salonId: user.salonId,
          salonSlug: salon.slug,
          salonName: salon.name,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
        token.salonId = user.salonId;
        token.salonSlug = user.salonSlug;
        token.salonName = user.salonName;
      }
      return token;
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.id as string;
        session.user.role = token.role as string;
        session.user.salonId = token.salonId as string;
        session.user.salonSlug = token.salonSlug as string;
        session.user.salonName = token.salonName as string;
      }
      return session;
    },
  },
};
