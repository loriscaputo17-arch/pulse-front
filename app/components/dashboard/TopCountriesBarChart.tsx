'use client';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  LabelList
} from 'recharts';

export default function TopCountriesBarChart({ data = [] }: any) {
  return (
    <div className="bg-zinc-900/50 border border-zinc-800 rounded-3xl p-8">
      <h3 className="text-lg font-bold mb-6">Top Countries</h3>

      <div className="h-[350px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={data}
            layout="vertical"
            margin={{ left: 20, right: 40 }}
          >
            <XAxis type="number" hide />
            
            {/* Y axis: Rank + Country */}
            <YAxis
              type="category"
              dataKey="paese"
              width={120}
              tickFormatter={(value, index) =>
                `${data[index]?.rank}. ${value}`
              }
            />

            <Tooltip />

            <Bar
              dataKey="listeners"
              fill="#8b5cf6"
              barSize={20}
              radius={[0, 6, 6, 0]}
            >
              {/* Numero listeners sulla barra */}
              <LabelList
                dataKey="listeners"
                position="right"
                fill="#fff"
                formatter={(value) =>
                  typeof value === 'number'
                    ? value.toLocaleString()
                    : ''
                }
              />
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
