import type { Metadata } from "next";
import { Sparkles } from "lucide-react";
import { RegisterForm } from "@/components/auth/register-form";

export const metadata: Metadata = { title: "Cadastrar Salão" };

export default function RegisterPage() {
  return (
    <div className="space-y-7">
      <div className="text-center">
        <div
          className="inline-flex items-center justify-center w-14 h-14 rounded-2xl shadow-warm mb-5"
          style={{ background: "linear-gradient(135deg, #D96B8F 0%, #A33258 100%)" }}
        >
          <Sparkles className="w-6 h-6 text-white" />
        </div>
        <h1 className="font-display text-3xl font-bold" style={{ color: "#1A0D12" }}>
          SaaSAlão
        </h1>
        <p className="mt-2 text-sm" style={{ color: "#5C4A52" }}>
          Cadastre seu salão gratuitamente
        </p>
      </div>

      <RegisterForm />

      <p className="text-center text-sm" style={{ color: "#5C4A52" }}>
        Já tem conta?{" "}
        <a href="/login" className="font-semibold hover:underline" style={{ color: "#A33258" }}>
          Entrar
        </a>
      </p>
    </div>
  );
}
