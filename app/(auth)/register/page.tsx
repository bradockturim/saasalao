import type { Metadata } from "next";
import { RegisterForm } from "@/components/auth/register-form";

export const metadata: Metadata = { title: "Cadastrar Salão" };

export default function RegisterPage() {
  return (
    <div className="space-y-6">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-900">SaaSAlão</h1>
        <p className="mt-2 text-gray-600">Cadastre seu salão gratuitamente</p>
      </div>
      <RegisterForm />
      <p className="text-center text-sm text-gray-600">
        Já tem conta?{" "}
        <a href="/login" className="text-primary-600 hover:text-primary-700 font-medium">
          Entrar
        </a>
      </p>
    </div>
  );
}
