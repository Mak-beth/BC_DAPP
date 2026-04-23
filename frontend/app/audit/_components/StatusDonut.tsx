"use client";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";

interface Row { action: string }

const palette = ["#818CF8", "#F59E0B", "#0EA5E9", "#34D399", "#A78BFA", "#F472B6"];

export function StatusDonut({ rows }: { rows: Row[] }) {
  const counts = rows.reduce<Record<string, number>>((acc, r) => {
    acc[r.action] = (acc[r.action] ?? 0) + 1;
    return acc;
  }, {});
  const data = Object.entries(counts).map(([name, value]) => ({ name, value }));
  if (data.length === 0) return null;

  return (
    <div className="rounded-xl border border-border-subtle bg-bg-raised/60 backdrop-blur-xl p-4">
      <p className="text-xs uppercase tracking-wide text-gray-400 mb-2">Event Distribution</p>
      <div className="h-48">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie data={data} dataKey="value" nameKey="name" innerRadius={40} outerRadius={70} paddingAngle={3}>
              {data.map((_, i) => <Cell key={i} fill={palette[i % palette.length]} />)}
            </Pie>
            <Tooltip contentStyle={{ background: "#111726", border: "1px solid rgba(255,255,255,0.12)", borderRadius: 8 }} />
          </PieChart>
        </ResponsiveContainer>
      </div>
      <div className="flex flex-wrap gap-3 mt-2">
        {data.map((d, i) => (
          <div key={d.name} className="flex items-center gap-1.5 text-xs text-gray-300">
            <span className="w-2.5 h-2.5 rounded-sm" style={{ background: palette[i % palette.length] }} />
            {d.name} <span className="text-gray-500">({d.value})</span>
          </div>
        ))}
      </div>
    </div>
  );
}
