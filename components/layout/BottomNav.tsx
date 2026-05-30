"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Users, Wrench, FileText, User } from "lucide-react";

const NAV = [
  { href: "/dashboard", icon: LayoutDashboard, label: "Início" },
  { href: "/clientes", icon: Users, label: "Clientes" },
  { href: "/ordens", icon: FileText, label: "OS" },
  { href: "/servicos", icon: Wrench, label: "Serviços" },
  { href: "/perfil", icon: User, label: "Perfil" },
];

export default function BottomNav() {
  const path = usePathname();

  return (
    <nav className="bottom-nav-safe">
      <div className="flex items-center justify-around max-w-lg mx-auto px-2">
        {NAV.map(({ href, icon: Icon, label }) => {
          const active = path === href || (href !== "/dashboard" && path.startsWith(href));
          return (
            <Link
              key={href}
              href={href}
              className={`flex flex-col items-center gap-0.5 py-3 px-3 rounded-xl transition-all min-w-[56px] ${
                active ? "text-brand-400" : "text-gray-600 hover:text-gray-400"
              }`}
            >
              <Icon
                className={`w-6 h-6 transition-transform ${active ? "scale-110" : ""}`}
                strokeWidth={active ? 2.5 : 1.8}
              />
              <span className={`text-[10px] font-medium ${active ? "text-brand-400" : ""}`}>
                {label}
              </span>
            </Link>
          );
        })}
      </div>
      {/* safe area iOS */}
      <div className="h-safe-area-inset-bottom" />
    </nav>
  );
}
