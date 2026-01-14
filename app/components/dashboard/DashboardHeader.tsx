'use client';
import { ChevronDown } from 'lucide-react';

export default function DashboardHeader() {
  return (
    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
      <div>
        <h2 className="text-2xl font-extrabold tracking-tight text-white">
          Dashboard
        </h2>
        <p className="text-zinc-400 mt-1 text-xs">
          Analisi dettagliata delle tue performance musicali.
        </p>
      </div>
    </div>
  );
}
