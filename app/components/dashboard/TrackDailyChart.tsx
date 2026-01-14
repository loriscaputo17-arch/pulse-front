'use client';

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

type Props = {
  data: {
    date: string;
    streams: number;
    listeners: number;
  }[];
};

export default function TrackDailyChart({ data }: Props) {
  return (
    <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-6">
      <h3 className="font-semibold mb-4">Daily performance</h3>

      <div className="h-[320px]">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data}>
            <XAxis
              dataKey="date"
              tick={{ fill: '#a1a1aa', fontSize: 12 }}
            />
            <YAxis
              tick={{ fill: '#a1a1aa', fontSize: 12 }}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: '#09090b',
                border: '1px solid #27272a',
                borderRadius: 8,
              }}
              labelStyle={{ color: '#e4e4e7' }}
            />

            <Line
              type="monotone"
              dataKey="streams"
              stroke="#8b5cf6"
              strokeWidth={2}
              dot={false}
              name="Streams"
            />

            <Line
              type="monotone"
              dataKey="listeners"
              stroke="#22c55e"
              strokeWidth={2}
              dot={false}
              name="Listeners"
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
