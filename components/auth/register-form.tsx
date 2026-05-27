"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import { slugify } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export function RegisterForm() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    salonName: "",
    name: "",
    email: "",
    password: "",
    phone: "",
  });

  const previewSlug = slugify(form.salonName);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? "Erro ao cadastrar. Tente novamente.");
        return;
      }

      await signIn("credentials", {
        redirect: false,
        email: form.email,
        password: form.password,
        salonSlug: data.slug,
      });

      router.push("/dashboard");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card>
      <CardContent className="pt-6">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Input
              id="salonName"
              label="Nome do salão"
              placeholder="Salão da Ana"
              value={form.salonName}
              onChange={(e) => setForm({ ...form, salonName: e.target.value })}
              required
            />
            {previewSlug && (
              <p className="mt-1 text-xs text-gray-500">
                Código de acesso:{" "}
                <span className="font-mono font-medium text-primary-600">{previewSlug}</span>
              </p>
            )}
          </div>
          <Input
            id="name"
            label="Seu nome"
            placeholder="Ana Silva"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            required
          />
          <Input
            id="email"
            type="email"
            label="Email"
            placeholder="ana@salao.com"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            required
          />
          <Input
            id="phone"
            type="tel"
            label="Telefone (opcional)"
            placeholder="(11) 99999-9999"
            value={form.phone}
            onChange={(e) => setForm({ ...form, phone: e.target.value })}
          />
          <Input
            id="password"
            type="password"
            label="Senha"
            placeholder="Mínimo 6 caracteres"
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
            minLength={6}
            required
          />

          {error && (
            <div className="rounded-lg bg-red-50 border border-red-200 p-3 text-sm text-red-700">
              {error}
            </div>
          )}

          <Button type="submit" className="w-full" loading={loading}>
            Criar salão grátis
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
