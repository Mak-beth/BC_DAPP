"use client";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  Legend, ResponsiveContainer,
} from "recharts";
import type { SensorEntry } from "@/lib/types";

interface Props { readings: SensorEntry[]; }

export function SensorChart({ readings }: Props) {
  const data = readings.map((r) => ({
    time: new Date(r.timestamp * 1000).toLocaleTimeString(),
    temperature: parseFloat((r.temperature / 10).toFixed(1)),
    humidity: r.humidity,
  }));

  return (
    <ResponsiveContainer width="100%" height={220}>
      <LineChart data={data} margin={{ top: 4, right: 16, left: 0, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.07)" />
        <XAxis dataKey="time" tick={{ fontSize: 10, fill: "var(--text-muted)" }} />
        <YAxis yAxisId="temp" tick={{ fontSize: 10, fill: "var(--text-muted)" }} />
        <YAxis yAxisId="hum" orientation="right" domain={[0, 100]}
          tick={{ fontSize: 10, fill: "var(--text-muted)" }} />
        <Tooltip
          contentStyle={{ background: "var(--bg-raised)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8 }}
        />
        <Legend wrapperStyle={{ fontSize: 12 }} />
        <Line yAxisId="temp" type="monotone" dataKey="temperature"
          name="Temp (°C)" stroke="var(--sig-1)" strokeWidth={2} dot={false} />
        <Line yAxisId="hum" type="monotone" dataKey="humidity"
          name="Humidity (%)" stroke="var(--sig-2)" strokeWidth={2} dot={false} />
      </LineChart>
    </ResponsiveContainer>
  );
}
