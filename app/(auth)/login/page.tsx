import type { Metadata } from "next";
import { Sparkles } from "lucide-react";
import { LoginForm } from "@/components/auth/login-form";

export const metadata: Metadata = { title: "Entrar" };

export default function LoginPage() {
  return (
    <div className="space-y-7">
      <div className="text-center">
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl shadow-warm mb-5"
          style={{ background: "linear-gradient(135deg, #D96B8F 0%, #A33258 100%)" }}>
          <Sparkles className="w-6 h-6 text-white" />
        </div>
        <h1 className="font-display text-3xl font-bold" style={{ color: "#1A0D12" }}>
          SaaSAlão
        </h1>
        <p className="mt-2 text-sm" style={{ color: "#5C4A52" }}>
          Gerencie seu salão com elegância
        </p>
      </div>

      <LoginForm />

      <p className="text-center text-sm" style={{ color: "#5C4A52" }}>
        Não tem conta?{" "}
        <a
          href="/register"
          className="font-semibold hover:underline"
          style={{ color: "#A33258" }}
        >
          Cadastre seu salão
        </a>
      </p>
    </div>
  );
}
