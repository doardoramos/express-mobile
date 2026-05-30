"use client";

import { Zap } from "lucide-react";

interface Props {
  title: string;
  subtitle?: string;
  right?: React.ReactNode;
}

export default function AppHeader({ title, subtitle, right }: Props) {
  return (
    <header className="sticky top-0 z-40 bg-surface-0/90 backdrop-blur-md border-b border-surface-border">
      <div className="max-w-lg mx-auto px-4 py-3 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-brand-500/20 border border-brand-500/30 flex items-center justify-center">
            <Zap className="w-4 h-4 text-brand-400 fill-brand-400" />
          </div>
          <div>
            <h1 className="text-base font-bold text-white leading-none">{title}</h1>
            {subtitle && <p className="text-xs text-gray-500 mt-0.5">{subtitle}</p>}
          </div>
        </div>
        {right && <div className="flex items-center gap-2">{right}</div>}
      </div>
    </header>
  );
}
