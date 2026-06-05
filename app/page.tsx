import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import Link from "next/link";
import {
  Calendar, MessageCircle, Users, Sparkles,
  Scissors, Clock, CheckCircle2, ChevronRight,
  BarChart3, Smartphone, Zap, Star, ArrowRight,
  Bell, Shield, Globe,
} from "lucide-react";

export default async function HomePage() {
  const session = await getSession();
  if (session) redirect("/dashboard");

  return (
    <div className="min-h-screen font-sans antialiased" style={{ backgroundColor: "#FDFAF7", color: "#1A0D12" }}>

      {/* ── Nav ──────────────────────────────────────────────────────────────── */}
      <nav className="sticky top-0 z-50 border-b backdrop-blur-sm" style={{ backgroundColor: "rgba(253,250,247,0.92)", borderColor: "#F3C8D8" }}>
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: "linear-gradient(135deg,#D96B8F,#A33258)" }}>
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            <span className="font-display font-bold text-lg" style={{ color: "#1A0D12" }}>SaaSAlão</span>
          </div>
          <div className="hidden md:flex items-center gap-6 text-sm font-medium" style={{ color: "#5C4A52" }}>
            <a href="#funcionalidades" className="hover:text-primary-600 transition-colors">Funcionalidades</a>
            <a href="#como-funciona" className="hover:text-primary-600 transition-colors">Como funciona</a>
            <a href="#planos" className="hover:text-primary-600 transition-colors">Planos</a>
            <a href="#faq" className="hover:text-primary-600 transition-colors">FAQ</a>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/login" className="text-sm font-medium hover:text-primary-600 transition-colors hidden sm:block" style={{ color: "#5C4A52" }}>
              Entrar
            </Link>
            <Link href="/register"
              className="inline-flex items-center gap-1.5 text-sm font-semibold text-white px-4 py-2 rounded-xl transition-all hover:opacity-90"
              style={{ background: "linear-gradient(135deg,#C4476F,#A33258)" }}>
              Começar grátis
              <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </nav>

      {/* ── Hero ─────────────────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden pt-20 pb-28 px-4">
        {/* Blobs decorativos */}
        <div className="pointer-events-none absolute inset-0" aria-hidden>
          <div className="absolute -top-40 -right-40 w-96 h-96 rounded-full opacity-25" style={{ background: "radial-gradient(circle,#E99DB8,transparent 70%)" }} />
          <div className="absolute top-60 -left-32 w-72 h-72 rounded-full opacity-15" style={{ background: "radial-gradient(circle,#D96B8F,transparent 70%)" }} />
        </div>

        <div className="relative max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 text-xs font-semibold px-3 py-1.5 rounded-full mb-6" style={{ backgroundColor: "#F9E8EF", color: "#A33258" }}>
            <Sparkles className="w-3 h-3" />
            Sistema completo para salões de beleza
          </div>

          <h1 className="font-display text-5xl sm:text-6xl md:text-7xl font-bold leading-tight mb-6" style={{ color: "#1A0D12" }}>
            Seu salão cheio,{" "}
            <span style={{ color: "#C4476F" }}>sem esforço</span>
          </h1>

          <p className="text-lg sm:text-xl mb-10 max-w-2xl mx-auto leading-relaxed" style={{ color: "#5C4A52" }}>
            Agendamento online, lembretes automáticos no WhatsApp e gestão completa da sua agenda — tudo em um só lugar, feito para donas de salão no Brasil.
          </p>

          <div className="flex flex-col sm:flex-row gap-3 justify-center items-center">
            <Link href="/register"
              className="inline-flex items-center gap-2 text-base font-semibold text-white px-8 py-3.5 rounded-2xl transition-all hover:opacity-90 shadow-lg"
              style={{ background: "linear-gradient(135deg,#C4476F,#A33258)", boxShadow: "0 8px 24px rgba(163,50,88,0.30)" }}>
              Criar conta grátis
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link href="/login" className="text-base font-medium px-6 py-3.5 rounded-2xl border transition-all hover:border-primary-300 hover:bg-primary-50" style={{ borderColor: "#EDD5DF", color: "#5C4A52" }}>
              Já tenho conta
            </Link>
          </div>

          <p className="mt-5 text-sm" style={{ color: "#A89CA0" }}>
            Sem cartão de crédito · Configura em 5 minutos
          </p>
        </div>

        {/* Dashboard preview */}
        <div className="relative max-w-5xl mx-auto mt-16 px-4">
          <div className="rounded-3xl border overflow-hidden shadow-2xl" style={{ borderColor: "#EDD5DF", boxShadow: "0 32px 80px rgba(163,50,88,0.12)" }}>
            <div className="h-8 flex items-center gap-1.5 px-4" style={{ backgroundColor: "#1A1117" }}>
              {["#FF5F57","#FEBC2E","#28C840"].map((c, i) => (
                <div key={i} className="w-3 h-3 rounded-full" style={{ backgroundColor: c }} />
              ))}
            </div>
            <div className="grid grid-cols-12 h-64 sm:h-80">
              {/* Sidebar preview */}
              <div className="col-span-2 sm:col-span-2 hidden sm:flex flex-col p-3 gap-2" style={{ backgroundColor: "#1A1117" }}>
                {["Dashboard","Agenda","Clientes","Serviços"].map((item) => (
                  <div key={item} className="h-7 rounded-lg px-2 flex items-center gap-1.5" style={{ backgroundColor: "rgba(255,255,255,0.06)" }}>
                    <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: "#D96B8F" }} />
                    <span className="text-[9px] text-white/50 truncate hidden lg:block">{item}</span>
                  </div>
                ))}
              </div>
              {/* Content preview */}
              <div className="col-span-12 sm:col-span-10 p-4 sm:p-6" style={{ backgroundColor: "#FDFAF7" }}>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
                  {[
                    { label: "Hoje", value: "8", color: "#C4476F" },
                    { label: "Semana", value: "42", color: "#D96B8F" },
                    { label: "Clientes", value: "128", color: "#A33258" },
                    { label: "Receita", value: "R$4.2k", color: "#C4476F" },
                  ].map((s) => (
                    <div key={s.label} className="rounded-2xl border p-3" style={{ borderColor: "#EDD5DF", backgroundColor: "#fff" }}>
                      <p className="text-[10px]" style={{ color: "#5C4A52" }}>{s.label}</p>
                      <p className="text-lg font-bold mt-0.5" style={{ color: s.color }}>{s.value}</p>
                    </div>
                  ))}
                </div>
                <div className="rounded-2xl border p-3" style={{ borderColor: "#EDD5DF", backgroundColor: "#fff" }}>
                  <p className="text-[10px] font-semibold mb-2" style={{ color: "#5C4A52" }}>Agenda de hoje</p>
                  {[
                    { time: "09:00", name: "Maria Silva", service: "Balayage", color: "#C4476F" },
                    { time: "11:00", name: "Ana Costa",  service: "Escova",   color: "#A33258" },
                    { time: "14:30", name: "Juliana F.",  service: "Coloração", color: "#D96B8F" },
                  ].map((a) => (
                    <div key={a.time} className="flex items-center gap-2 py-1">
                      <span className="text-[9px] font-mono w-10 shrink-0" style={{ color: "#A89CA0" }}>{a.time}</span>
                      <div className="w-1.5 h-5 rounded-full shrink-0" style={{ backgroundColor: a.color }} />
                      <span className="text-[10px] font-medium truncate" style={{ color: "#1A0D12" }}>{a.name}</span>
                      <span className="text-[9px] ml-auto shrink-0" style={{ color: "#A89CA0" }}>{a.service}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Números ──────────────────────────────────────────────────────────── */}
      <section className="py-14 border-y" style={{ borderColor: "#F3C8D8", backgroundColor: "#FDF4F7" }}>
        <div className="max-w-4xl mx-auto px-4 grid grid-cols-2 sm:grid-cols-4 gap-8 text-center">
          {[
            { value: "5 min", label: "para configurar" },
            { value: "24/7", label: "agendamento online" },
            { value: "0%", label: "comissão por agendamento" },
            { value: "∞", label: "clientes cadastrados" },
          ].map((s) => (
            <div key={s.label}>
              <p className="font-display text-3xl sm:text-4xl font-bold" style={{ color: "#C4476F" }}>{s.value}</p>
              <p className="text-sm mt-1" style={{ color: "#5C4A52" }}>{s.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Funcionalidades ───────────────────────────────────────────────────── */}
      <section id="funcionalidades" className="py-24 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-14">
            <p className="text-sm font-semibold mb-3" style={{ color: "#C4476F" }}>Funcionalidades</p>
            <h2 className="font-display text-4xl sm:text-5xl font-bold mb-4" style={{ color: "#1A0D12" }}>
              Tudo que seu salão precisa
            </h2>
            <p className="text-lg max-w-xl mx-auto" style={{ color: "#5C4A52" }}>
              Cada funcionalidade foi pensada para a realidade das donas de salão no Brasil.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              {
                icon: Globe,
                title: "Agendamento online",
                desc: "Link personalizado para suas clientes agendarem 24h por dia, sem precisar ligar.",
                color: "#C4476F",
              },
              {
                icon: MessageCircle,
                title: "WhatsApp automático",
                desc: "Confirmações de agendamento e lembretes 24h e 2h antes — tudo no WhatsApp.",
                color: "#25D366",
              },
              {
                icon: Bell,
                title: "Resumo diário às 20h",
                desc: "Receba toda noite a lista de agendamentos do dia seguinte direto no WhatsApp.",
                color: "#A33258",
              },
              {
                icon: Scissors,
                title: "Perfil capilar",
                desc: "Preço personalizado por tipo e comprimento de cabelo — liso, cacheado, curto, longo.",
                color: "#D96B8F",
              },
              {
                icon: Calendar,
                title: "Agenda semanal",
                desc: "Visão completa da semana, bloqueio de horários e agendamento manual pelo painel.",
                color: "#C4476F",
              },
              {
                icon: Users,
                title: "Gestão de clientes",
                desc: "Histórico completo, perfil capilar salvo e cancelamento com regras personalizadas.",
                color: "#A33258",
              },
              {
                icon: Zap,
                title: "Automações",
                desc: "Regras automáticas de follow-up para recuperar clientes que sumiram.",
                color: "#D96B8F",
              },
              {
                icon: BarChart3,
                title: "Dashboard",
                desc: "Visão geral de agendamentos, receita, clientes e serviços mais populares.",
                color: "#C4476F",
              },
              {
                icon: Shield,
                title: "Multi-profissional",
                desc: "Gerencie toda a equipe com permissões por função — dona, admin ou profissional.",
                color: "#A33258",
              },
            ].map((f) => (
              <div key={f.title} className="rounded-2xl border p-6 hover:shadow-warm transition-all" style={{ borderColor: "#EDD5DF", backgroundColor: "#fff" }}>
                <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-4" style={{ backgroundColor: f.color + "18" }}>
                  <f.icon className="w-5 h-5" style={{ color: f.color }} />
                </div>
                <h3 className="font-semibold text-base mb-2" style={{ color: "#1A0D12" }}>{f.title}</h3>
                <p className="text-sm leading-relaxed" style={{ color: "#5C4A52" }}>{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Como funciona ─────────────────────────────────────────────────────── */}
      <section id="como-funciona" className="py-24 px-4" style={{ backgroundColor: "#FDF4F7" }}>
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-14">
            <p className="text-sm font-semibold mb-3" style={{ color: "#C4476F" }}>Como funciona</p>
            <h2 className="font-display text-4xl sm:text-5xl font-bold mb-4" style={{ color: "#1A0D12" }}>
              Configure em 5 minutos
            </h2>
          </div>

          <div className="grid sm:grid-cols-3 gap-8">
            {[
              { step: "01", title: "Crie sua conta", desc: "Cadastre seu salão gratuitamente. Nenhum cartão de crédito necessário." },
              { step: "02", title: "Configure os serviços", desc: "Adicione seus serviços, preços por tipo de cabelo e horário de funcionamento." },
              { step: "03", title: "Compartilhe o link", desc: "Envie o link do seu salão para as clientes e comece a receber agendamentos." },
            ].map((s) => (
              <div key={s.step} className="text-center">
                <div className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-5 font-display font-bold text-xl text-white" style={{ background: "linear-gradient(135deg,#D96B8F,#A33258)" }}>
                  {s.step}
                </div>
                <h3 className="font-semibold text-lg mb-2" style={{ color: "#1A0D12" }}>{s.title}</h3>
                <p className="text-sm leading-relaxed" style={{ color: "#5C4A52" }}>{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── WhatsApp highlight ────────────────────────────────────────────────── */}
      <section className="py-24 px-4">
        <div className="max-w-5xl mx-auto">
          <div className="rounded-3xl overflow-hidden border" style={{ borderColor: "#EDD5DF" }}>
            <div className="grid md:grid-cols-2">
              <div className="p-8 sm:p-12" style={{ backgroundColor: "#1A0D12" }}>
                <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-6" style={{ backgroundColor: "#25D366" + "22" }}>
                  <MessageCircle className="w-5 h-5" style={{ color: "#25D366" }} />
                </div>
                <h2 className="font-display text-3xl sm:text-4xl font-bold text-white mb-4 leading-tight">
                  WhatsApp que trabalha por você
                </h2>
                <p className="text-sm leading-relaxed mb-6" style={{ color: "rgba(255,255,255,0.6)" }}>
                  Conecte seu WhatsApp uma vez e esqueça os lembretes manuais. O sistema avisa suas clientes automaticamente.
                </p>
                <ul className="space-y-3">
                  {[
                    "Confirmação ao agendar",
                    "Lembrete 24h antes",
                    "Lembrete 2h antes",
                    "Resumo da agenda às 20h",
                  ].map((item) => (
                    <li key={item} className="flex items-center gap-2.5 text-sm" style={{ color: "rgba(255,255,255,0.8)" }}>
                      <CheckCircle2 className="w-4 h-4 shrink-0" style={{ color: "#25D366" }} />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
              <div className="p-8 sm:p-12 flex flex-col justify-center gap-4" style={{ backgroundColor: "#fff" }}>
                {[
                  { type: "out", text: "📅 Novo agendamento — Studio Bella\n\n👤 Maria Silva\n✂️ Balayage\n🗓️ Quinta, 12 de junho\n🕐 09:00" },
                  { type: "out", text: "Olá, Maria! 👋\nLembrando do seu horário amanhã em Studio Bella: Balayage às 09:00 🌸" },
                ].map((m, i) => (
                  <div key={i} className={`max-w-xs rounded-2xl px-4 py-3 text-xs leading-relaxed whitespace-pre-line ${i === 0 ? "ml-auto" : ""}`}
                    style={{
                      backgroundColor: i === 0 ? "#DCF8C6" : "#F0F0F0",
                      color: "#1A0D12",
                    }}>
                    {m.text}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Planos ───────────────────────────────────────────────────────────── */}
      <section id="planos" className="py-24 px-4" style={{ backgroundColor: "#FDF4F7" }}>
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-14">
            <p className="text-sm font-semibold mb-3" style={{ color: "#C4476F" }}>Planos</p>
            <h2 className="font-display text-4xl sm:text-5xl font-bold mb-4" style={{ color: "#1A0D12" }}>
              Simples e transparente
            </h2>
            <p className="text-lg" style={{ color: "#5C4A52" }}>Sem taxas por agendamento. Sem surpresas na fatura.</p>
          </div>

          <div className="grid sm:grid-cols-3 gap-6">
            {[
              {
                name: "Essencial",
                price: "R$79",
                period: "/mês",
                desc: "Para salões que estão começando",
                highlight: false,
                items: [
                  "2 profissionais",
                  "Agendamentos ilimitados",
                  "Link de agendamento",
                  "Painel de gestão",
                  "WhatsApp automático",
                  "Cadastro de clientes",
                ],
                missing: ["Automações de follow-up", "Multi-profissional ilimitado"],
                cta: "Começar 14 dias grátis",
              },
              {
                name: "Pro",
                price: "R$129",
                period: "/mês",
                desc: "Para salões em crescimento",
                highlight: true,
                items: [
                  "Profissionais ilimitados",
                  "Agendamentos ilimitados",
                  "WhatsApp automático",
                  "Resumo diário às 20h",
                  "Automações de follow-up",
                  "Perfil capilar personalizado",
                  "Relatórios completos",
                ],
                missing: [],
                cta: "Começar 14 dias grátis",
              },
              {
                name: "Premium",
                price: "R$199",
                period: "/mês",
                desc: "Para redes e múltiplas unidades",
                highlight: false,
                items: [
                  "Tudo do Pro",
                  "Múltiplas unidades",
                  "Relatórios por unidade",
                  "Suporte prioritário",
                  "Onboarding personalizado",
                  "API de integração",
                ],
                missing: [],
                cta: "Falar com vendas",
              },
            ].map((plan) => (
              <div
                key={plan.name}
                className={`rounded-2xl border p-7 flex flex-col ${plan.highlight ? "ring-2 shadow-warm-lg" : ""}`}
                style={{
                  borderColor: plan.highlight ? "#C4476F" : "#EDD5DF",
                  backgroundColor: plan.highlight ? "#fff" : "#fff",
                  ...(plan.highlight ? { ringColor: "#C4476F" } : {}),
                }}
              >
                {plan.highlight && (
                  <div className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-full mb-4 self-start" style={{ backgroundColor: "#F9E8EF", color: "#A33258" }}>
                    <Star className="w-3 h-3" />
                    Mais popular
                  </div>
                )}
                <p className="font-semibold text-sm" style={{ color: "#5C4A52" }}>{plan.name}</p>
                <div className="flex items-end gap-1 mt-2 mb-1">
                  <span className="font-display text-4xl font-bold" style={{ color: "#1A0D12" }}>{plan.price}</span>
                  <span className="text-sm pb-1" style={{ color: "#A89CA0" }}>{plan.period}</span>
                </div>
                <p className="text-xs mb-6" style={{ color: "#5C4A52" }}>{plan.desc}</p>

                <ul className="space-y-2.5 mb-6 flex-1">
                  {plan.items.map((item) => (
                    <li key={item} className="flex items-start gap-2 text-sm" style={{ color: "#1A0D12" }}>
                      <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" style={{ color: "#C4476F" }} />
                      {item}
                    </li>
                  ))}
                  {plan.missing.map((item) => (
                    <li key={item} className="flex items-start gap-2 text-sm line-through" style={{ color: "#C4B8BC" }}>
                      <div className="w-4 h-4 shrink-0 mt-0.5 rounded-full border flex items-center justify-center" style={{ borderColor: "#EDD5DF" }}>
                        <div className="w-1.5 h-0.5 rounded" style={{ backgroundColor: "#EDD5DF" }} />
                      </div>
                      {item}
                    </li>
                  ))}
                </ul>

                <Link href="/register"
                  className="w-full text-center text-sm font-semibold py-3 rounded-xl transition-all"
                  style={plan.highlight ? {
                    background: "linear-gradient(135deg,#C4476F,#A33258)",
                    color: "#fff",
                  } : {
                    border: "1.5px solid #EDD5DF",
                    color: "#A33258",
                  }}>
                  {plan.cta}
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FAQ ──────────────────────────────────────────────────────────────── */}
      <section id="faq" className="py-24 px-4">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="font-display text-4xl font-bold mb-4" style={{ color: "#1A0D12" }}>Dúvidas frequentes</h2>
          </div>
          <div className="space-y-4">
            {[
              {
                q: "Preciso saber usar computador para configurar?",
                a: "Não. O painel foi feito para ser simples — se você usa WhatsApp, consegue configurar. E se tiver dúvidas, nossa equipe ajuda.",
              },
              {
                q: "As clientes precisam criar uma conta para agendar?",
                a: "Não. Elas acessam o link do seu salão, escolhem o serviço e preenchem nome e telefone. Simples assim.",
              },
              {
                q: "O WhatsApp que uso pessoalmente funciona?",
                a: "Sim. Você conecta seu WhatsApp pessoal ou comercial uma vez escaneando um QR Code. As mensagens são enviadas a partir desse número.",
              },
              {
                q: "Posso cancelar a qualquer momento?",
                a: "Sim. Sem multa, sem fidelidade. Se não gostar, cancela com um clique e seus dados ficam disponíveis por 30 dias.",
              },
              {
                q: "Funciona para salão com mais de uma profissional?",
                a: "Sim. No plano Pro você adiciona profissionais ilimitadas, cada uma com sua própria agenda e disponibilidade.",
              },
            ].map((item) => (
              <details key={item.q} className="group rounded-2xl border p-6 cursor-pointer" style={{ borderColor: "#EDD5DF", backgroundColor: "#fff" }}>
                <summary className="flex items-center justify-between font-semibold text-sm list-none" style={{ color: "#1A0D12" }}>
                  {item.q}
                  <ChevronRight className="w-4 h-4 shrink-0 transition-transform group-open:rotate-90" style={{ color: "#C4476F" }} />
                </summary>
                <p className="mt-3 text-sm leading-relaxed" style={{ color: "#5C4A52" }}>{item.a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA final ────────────────────────────────────────────────────────── */}
      <section className="py-24 px-4">
        <div className="max-w-3xl mx-auto text-center">
          <div className="rounded-3xl p-10 sm:p-14" style={{ background: "linear-gradient(135deg,#1A0D12 0%,#2E1020 100%)" }}>
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-6" style={{ background: "linear-gradient(135deg,#D96B8F,#A33258)" }}>
              <Sparkles className="w-7 h-7 text-white" />
            </div>
            <h2 className="font-display text-3xl sm:text-4xl font-bold text-white mb-4">
              Pronta para ter seu salão no piloto automático?
            </h2>
            <p className="text-sm mb-8" style={{ color: "rgba(255,255,255,0.6)" }}>
              Crie sua conta grátis e comece a receber agendamentos online ainda hoje.
            </p>
            <Link href="/register"
              className="inline-flex items-center gap-2 text-base font-semibold text-white px-8 py-4 rounded-2xl transition-all hover:opacity-90"
              style={{ background: "linear-gradient(135deg,#C4476F,#A33258)", boxShadow: "0 8px 24px rgba(196,71,111,0.40)" }}>
              Criar conta grátis
              <ArrowRight className="w-4 h-4" />
            </Link>
            <p className="mt-4 text-xs" style={{ color: "rgba(255,255,255,0.4)" }}>
              Sem cartão de crédito · Cancele quando quiser
            </p>
          </div>
        </div>
      </section>

      {/* ── Footer ───────────────────────────────────────────────────────────── */}
      <footer className="border-t py-10 px-4" style={{ borderColor: "#F3C8D8" }}>
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg flex items-center justify-center" style={{ background: "linear-gradient(135deg,#D96B8F,#A33258)" }}>
              <Sparkles className="w-3 h-3 text-white" />
            </div>
            <span className="font-display font-bold text-sm" style={{ color: "#1A0D12" }}>SaaSAlão</span>
          </div>
          <p className="text-xs" style={{ color: "#A89CA0" }}>
            © {new Date().getFullYear()} SaaSAlão. Feito com 💗 para salões brasileiros.
          </p>
          <div className="flex gap-4 text-xs" style={{ color: "#A89CA0" }}>
            <Link href="/login" className="hover:text-primary-600">Entrar</Link>
            <Link href="/register" className="hover:text-primary-600">Cadastrar</Link>
          </div>
        </div>
      </footer>

    </div>
  );
}
