'use client';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';

export default function StreamsAreaChart({ data }: any) {
  return (
    <div className="lg:col-span-2 bg-zinc-900/50 border border-zinc-800 rounded-3xl p-8">
      <h3 className="text-lg font-bold mb-6">
        Streaming Trend
        <span className="ml-2 text-xs text-violet-400 bg-violet-400/10 px-2 py-0.5 rounded-full">
          Live
        </span>
      </h3>

      <div className="h-[350px]">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data}>
            <defs>
              <linearGradient id="colorStreams" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
              </linearGradient>
            </defs>

            <CartesianGrid stroke="#27272a" vertical={false} />
            <XAxis dataKey="date" tickFormatter={(d) => new Date(d).toLocaleDateString('it-IT', { day: 'numeric', month: 'short' })} />
            <YAxis />
            <Tooltip />

            <Area
              type="monotone"
              dataKey="streams"
              stroke="#8b5cf6"
              fill="url(#colorStreams)"
              strokeWidth={3}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
