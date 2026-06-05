"use client";

import { signOut } from "next-auth/react";
import { Session } from "next-auth";
import { Bell, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";

interface HeaderProps {
  session: Session;
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

export function Header({ session }: HeaderProps) {
  const firstName = getFirstName(session.user.name);
  const greeting = getGreeting();
  const date = getFormattedDate();

  return (
    <header
      className="h-16 flex items-center justify-between px-6 border-b"
      style={{ backgroundColor: "#FDFAF7", borderColor: "#F3C8D8" }}
    >
      <div>
        <p className="text-sm font-semibold" style={{ color: "#1A0D12" }}>
          {greeting}{firstName ? `, ${firstName}` : ""}
        </p>
        <p className="text-xs capitalize" style={{ color: "#5C4A52" }}>
          {date}
        </p>
      </div>

      <div className="flex items-center gap-2">
        <button
          className="w-9 h-9 flex items-center justify-center rounded-xl transition-colors"
          style={{ color: "#5C4A52" }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLButtonElement).style.backgroundColor = "#F9E8EF";
            (e.currentTarget as HTMLButtonElement).style.color = "#A33258";
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLButtonElement).style.backgroundColor = "transparent";
            (e.currentTarget as HTMLButtonElement).style.color = "#5C4A52";
          }}
        >
          <Bell className="w-4.5 h-4.5" />
        </button>

        <Button
          variant="ghost"
          size="sm"
          onClick={() => signOut({ callbackUrl: "/login" })}
          className="gap-2 text-sm"
          style={{ color: "#5C4A52" }}
        >
          <LogOut className="w-4 h-4" />
          Sair
        </Button>
      </div>
    </header>
  );
}
