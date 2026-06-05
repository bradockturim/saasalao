"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Session } from "next-auth";
import {
  LayoutDashboard,
  Calendar,
  Users,
  Scissors,
  Settings,
  UserCheck,
  Zap,
  Sparkles,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/dashboard",               label: "Dashboard",     icon: LayoutDashboard },
  { href: "/dashboard/appointments",  label: "Agendamentos",  icon: Calendar },
  { href: "/dashboard/clients",       label: "Clientes",      icon: Users },
  { href: "/dashboard/services",      label: "Serviços",      icon: Scissors },
  { href: "/dashboard/profissionais", label: "Profissionais", icon: UserCheck },
];

const adminItems = [
  { href: "/dashboard/automacoes", label: "Automações",    icon: Zap,      roles: ["OWNER", "ADMIN"] },
  { href: "/dashboard/settings",   label: "Configurações", icon: Settings, roles: ["OWNER", "ADMIN"] },
];

interface SidebarProps {
  session: Session;
  onClose?: () => void;
}

export function Sidebar({ session, onClose }: SidebarProps) {
  const pathname = usePathname();
  const initials = session.user.name
    ?.split(" ")
    .slice(0, 2)
    .map((n) => n[0])
    .join("")
    .toUpperCase() ?? "?";

  function NavLink({ href, label, icon: Icon }: { href: string; label: string; icon: React.ElementType }) {
    const isActive = pathname === href;
    return (
      <Link
        href={href}
        onClick={onClose}
        className={cn(
          "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150",
          isActive
            ? "bg-primary-500/20 text-primary-300"
            : "text-white/55 hover:text-white/90 hover:bg-white/[0.06]"
        )}
      >
        <Icon className={cn("w-4 h-4 shrink-0", isActive && "text-primary-400")} />
        {label}
      </Link>
    );
  }

  const adminFiltered = adminItems.filter((item) => item.roles.includes(session.user.role));

  return (
    <aside className="w-64 flex flex-col h-full" style={{ backgroundColor: "#1A1117" }}>
      {/* Logo / Salon name */}
      <div className="px-5 py-5 border-b flex items-center justify-between" style={{ borderColor: "rgba(255,255,255,0.07)" }}>
        <div className="flex items-center gap-3 min-w-0">
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
            style={{ background: "linear-gradient(135deg, #D96B8F 0%, #A33258 100%)" }}
          >
            <Sparkles className="w-4 h-4 text-white" />
          </div>
          <div className="min-w-0">
            <p className="font-display font-bold text-white text-sm leading-tight truncate">
              {session.user.salonName}
            </p>
            <p className="text-[11px] mt-0.5 truncate" style={{ color: "rgba(255,255,255,0.38)" }}>
              Painel de gestão
            </p>
          </div>
        </div>
        {/* Close button — mobile only */}
        {onClose && (
          <button
            onClick={onClose}
            className="md:hidden ml-2 p-1.5 rounded-lg text-white/40 hover:text-white/80 hover:bg-white/10 shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 overflow-y-auto">
        <div className="space-y-0.5">
          {navItems.map((item) => (
            <NavLink key={item.href} {...item} />
          ))}
        </div>

        {adminFiltered.length > 0 && (
          <>
            <div className="mt-6 mb-2 px-3">
              <p className="text-[10px] font-semibold uppercase tracking-widest" style={{ color: "rgba(255,255,255,0.25)" }}>
                Admin
              </p>
            </div>
            <div className="space-y-0.5">
              {adminFiltered.map((item) => (
                <NavLink key={item.href} {...item} />
              ))}
            </div>
          </>
        )}
      </nav>

      {/* User profile */}
      <div className="px-4 py-4 border-t" style={{ borderColor: "rgba(255,255,255,0.07)" }}>
        <div className="flex items-center gap-3 px-2 py-2 rounded-xl">
          <div
            className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 text-xs font-bold"
            style={{ backgroundColor: "rgba(196,71,111,0.3)", color: "#E99DB8" }}
          >
            {initials}
          </div>
          <div className="min-w-0">
            <p className="text-sm font-medium text-white/90 truncate">{session.user.name}</p>
            <p className="text-[11px] truncate" style={{ color: "rgba(255,255,255,0.38)" }}>
              {session.user.email}
            </p>
          </div>
        </div>
      </div>
    </aside>
  );
}
