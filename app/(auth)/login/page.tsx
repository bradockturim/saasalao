import type { Metadata } from "next";
import { LoginForm } from "@/components/auth/login-form";

export const metadata: Metadata = { title: "Entrar" };

export default function LoginPage() {
  return (
    <div className="space-y-6">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-900">SaaSAlão</h1>
        <p className="mt-2 text-gray-600">Entre na sua conta</p>
      </div>
      <LoginForm />
      <p className="text-center text-sm text-gray-600">
        Não tem conta?{" "}
        <a href="/register" className="text-primary-600 hover:text-primary-700 font-medium">
          Cadastre seu salão
        </a>
      </p>
    </div>
  );
}
