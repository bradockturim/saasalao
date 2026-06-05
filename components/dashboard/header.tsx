"use client";

import { signOut } from "next-auth/react";
import { Session } from "next-auth";
import { Bell, LogOut, Menu } from "lucide-react";
import { Button } from "@/components/ui/button";

interface HeaderProps {
  session: Session;
  onMenuToggle?: () => void;
}

function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return "Bom dia";
  if (hour < 18) return "Boa tarde";
  return "Boa noite";
}

function getFirstName(name: string | null | undefined) {
  return name?.split(" ")[0] ?? "";
}

function getFormattedDate() {
  return new Date().toLocaleDateString("pt-BR", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });
}

export function Header({ session, onMenuToggle }: HeaderProps) {
  const firstName = getFirstName(session.user.name);
  const greeting = getGreeting();
  const date = getFormattedDate();

  return (
    <header
      className="h-14 md:h-16 flex items-center justify-between px-4 md:px-6 border-b shrink-0"
      style={{ backgroundColor: "#FDFAF7", borderColor: "#F3C8D8" }}
    >
      <div className="flex items-center gap-3">
        {/* Hamburger — mobile only */}
        <button
          onClick={onMenuToggle}
          className="md:hidden p-2 rounded-xl transition-colors"
          style={{ color: "#5C4A52" }}
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="hidden sm:block">
          <p className="text-sm font-semibold" style={{ color: "#1A0D12" }}>
            {greeting}{firstName ? `, ${firstName}` : ""}
          </p>
          <p className="text-xs capitalize" style={{ color: "#5C4A52" }}>
            {date}
          </p>
        </div>
        {/* Mobile: só o greeting curto */}
        <p className="sm:hidden text-sm font-semibold" style={{ color: "#1A0D12" }}>
          {greeting}{firstName ? `, ${firstName}` : ""}
        </p>
      </div>

      <div className="flex items-center gap-1 md:gap-2">
        <button
          className="w-9 h-9 flex items-center justify-center rounded-xl transition-colors"
          style={{ color: "#5C4A52" }}
        >
          <Bell className="w-4 h-4" />
        </button>

        <Button
          variant="ghost"
          size="sm"
          onClick={() => signOut({ callbackUrl: "/login" })}
          className="gap-1.5 text-sm px-2 md:px-3"
          style={{ color: "#5C4A52" }}
        >
          <LogOut className="w-4 h-4" />
          <span className="hidden sm:inline">Sair</span>
        </Button>
      </div>
    </header>
  );
}
