"use client";
import { useState } from "react";
import { motion } from "framer-motion";
import { Thermometer, Droplets, Send } from "lucide-react";
import { useWallet } from "@/lib/WalletContext";
import { getContract } from "@/lib/contract";
import { useToast } from "@/components/ui/Toast";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import type { SensorEntry } from "@/lib/types";

export default function IoTSimulatorPage() {
  const { walletState } = useWallet();
  const toast = useToast();

  const [productId, setProductId] = useState("");
  const [temperature, setTemperature] = useState("");
  const [humidity, setHumidity] = useState(50);
  const [submitting, setSubmitting] = useState(false);
  const [readings, setReadings] = useState<SensorEntry[]>([]);

  async function fetchReadings(id: number) {
    try {
      const contract = await getContract(false);
      const raw = await contract.getSensorReadings(id);
      setReadings(
        raw.map((r: any) => ({
          temperature: Number(r.temperature),
          humidity: Number(r.humidity),
          timestamp: Number(r.timestamp),
          logger: r.logger,
        }))
      );
    } catch {
      // silently ignore — product may not exist yet
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!walletState.isConnected || walletState.role === "NONE") {
      toast.error("Connect a wallet with a role to log sensor data.");
      return;
    }
    const id = Number(productId);
    const temp = Math.round(parseFloat(temperature) * 10);
    if (isNaN(id) || id <= 0) { toast.error("Enter a valid product ID."); return; }
    if (isNaN(temp)) { toast.error("Enter a valid temperature."); return; }
    setSubmitting(true);
    try {
      const contract = await getContract(true);
      const tx = await contract.logSensorReading(id, temp, humidity);
      await tx.wait();
      toast.success("Sensor reading recorded on-chain.");
      await fetchReadings(id);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Transaction failed.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-xl mx-auto space-y-8 py-8"
    >
      <div>
        <h1 className="text-3xl font-bold text-gradient">IoT Simulator</h1>
        <p className="text-sm mt-1" style={{ color: "var(--text-muted)" }}>
          Push temperature and humidity readings onto the blockchain for any
          product. Implements Part 1 §5.4 IoT sensor integration.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="glass-card p-6 space-y-5 rounded-xl">
        <div className="space-y-1">
          <label className="text-sm font-medium" style={{ color: "var(--text-secondary)" }}>Product ID</label>
          <Input
            type="number"
            min={1}
            value={productId}
            onChange={(e) => setProductId(e.target.value)}
            required
          />
        </div>

        <div className="flex items-center gap-3">
          <Thermometer className="w-5 h-5" style={{ color: "var(--sig-1)" }} />
          <div className="flex-1 space-y-1">
            <label className="text-sm font-medium" style={{ color: "var(--text-secondary)" }}>Temperature (°C)</label>
            <Input
              type="number"
              step="0.1"
              value={temperature}
              onChange={(e) => setTemperature(e.target.value)}
              required
            />
          </div>
        </div>

        <div className="space-y-2">
          <label className="flex items-center gap-2 text-sm font-medium" style={{ color: "var(--text-secondary)" }}>
            <Droplets className="w-4 h-4" style={{ color: "var(--sig-2)" }} />
            Humidity: {humidity}%
          </label>
          <input
            type="range"
            min={0}
            max={100}
            value={humidity}
            onChange={(e) => setHumidity(Number(e.target.value))}
            className="w-full accent-[var(--sig-1)]"
          />
        </div>

        <Button type="submit" variant="primary" loading={submitting} icon={<Send className="w-4 h-4" />}>
          Log Reading On-Chain
        </Button>
      </form>

      {readings.length > 0 && (
        <div className="glass-card rounded-xl overflow-hidden">
          <div className="px-4 py-3 border-b border-white/10">
            <span className="text-sm font-semibold" style={{ color: "var(--text-secondary)" }}>
              Recent readings for Product #{productId}
            </span>
          </div>
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left" style={{ color: "var(--text-muted)" }}>
                <th className="px-4 py-2">Temp (°C)</th>
                <th className="px-4 py-2">Humidity (%)</th>
                <th className="px-4 py-2">Time</th>
              </tr>
            </thead>
            <tbody>
              {[...readings].reverse().slice(0, 10).map((r, i) => (
                <tr key={i} className="border-t border-white/5">
                  <td className="px-4 py-2">{(r.temperature / 10).toFixed(1)}</td>
                  <td className="px-4 py-2">{r.humidity}</td>
                  <td className="px-4 py-2 text-xs" style={{ color: "var(--text-muted)" }}>
                    {new Date(r.timestamp * 1000).toLocaleTimeString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </motion.div>
  );
}
