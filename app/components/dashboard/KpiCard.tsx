'use client';

type Props = {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  trend?: string;
};

export default function KpiCard({ title, value, icon, trend }: Props) {
  return (
    <div className="bg-zinc-900/50 border border-zinc-800 p-4 rounded-3xl backdrop-blur-sm hover:border-violet-500/30 transition-all group">
      <div className="flex items-center justify-between mb-4">
        <div className="p-3 bg-black border border-zinc-800 rounded-2xl">
          {icon}
        </div>
        {trend && (
          <span className="text-xs font-medium text-emerald-400 bg-emerald-400/10 px-2 py-1 rounded-lg">
            {trend}
          </span>
        )}
      </div>
      <p className="text-xs text-zinc-500 font-medium">{title}</p>
      <p className="text-xl font-bold mt-1 text-white tracking-tight">{value}</p>
    </div>
  );
}
