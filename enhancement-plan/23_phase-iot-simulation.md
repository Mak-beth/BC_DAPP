# Phase 23 — IoT Sensor Simulation

## Goal

Close the Part 1 §5.4 promise. The proposal explicitly described "temperature and humidity sensors pushing data to the application layer." This phase puts that data permanently on-chain. Any role-holder can log a sensor reading (temperature, humidity) for a product via a new `/iot-simulator` page. The track page gains a recharts line chart showing the readings history. This satisfies the "hybrid on-chain / off-chain architecture" marking criterion by demonstrating a realistic IoT-to-blockchain data path — exactly as described in Part 1.

**IMPORTANT — the contract is UN-FROZEN for this phase.** Two new functions and one new event are added to `SupplyChain.sol`. After completing all contract edits and test additions, redeploy: `npx hardhat run scripts/deploy.ts --network localhost` and update `NEXT_PUBLIC_CONTRACT_ADDRESS` in `frontend/.env.local`.

## Files in scope (ALLOWED to create/edit)

- `hardhat-project/contracts/SupplyChain.sol`
- `hardhat-project/test/SupplyChain.test.ts`
- `frontend/lib/types.ts`
- `frontend/app/iot-simulator/page.tsx` (new)
- `frontend/app/track/[id]/page.tsx`
- `frontend/app/track/[id]/_components/SensorChart.tsx` (new)
- `frontend/components/Navbar.tsx`

## Files OUT of scope

- All other contract files (`hardhat-project/scripts/**`, `hardhat-project/hardhat.config.ts`)
- All other frontend pages and components not listed above
- `documentation/documentation_group13.md` (updated in Phase 19)
- `PRESENTATION.md` (updated in Phase 20)

## Dependencies

No new npm packages. `recharts` is already installed (Phase 13).

## Implementation steps

### 1. Contract — add `SensorEntry` struct, mapping, event, and two functions

In `hardhat-project/contracts/SupplyChain.sol`, make the following additions (insert after the `CertificationEntry` struct and its mapping, before the `productCounter` declaration):

```solidity
struct SensorEntry {
    int256 temperature; // stored in tenths of °C (e.g. 245 = 24.5 °C)
    uint256 humidity;   // 0–100 (percentage)
    uint256 timestamp;
    address logger;
}

mapping(uint256 => SensorEntry[]) private sensorReadings;
```

Add the event after the existing `CertificationAdded` event:

```solidity
event SensorReading(
    uint256 indexed productId,
    int256  temperature,
    uint256 humidity,
    uint256 timestamp,
    address indexed logger
);
```

Add the two functions at the end of the contract, before the closing `}`:

```solidity
function logSensorReading(
    uint256 productId,
    int256  temperature,
    uint256 humidity
) external productExists(productId) {
    require(roles[msg.sender] != Role.NONE, "SupplyChain: Unauthorized");
    require(humidity <= 100, "SupplyChain: Invalid humidity");

    sensorReadings[productId].push(SensorEntry({
        temperature: temperature,
        humidity:    humidity,
        timestamp:   block.timestamp,
        logger:      msg.sender
    }));

    emit SensorReading(productId, temperature, humidity, block.timestamp, msg.sender);
}

function getSensorReadings(uint256 id)
    external
    view
    productExists(id)
    returns (SensorEntry[] memory)
{
    return sensorReadings[id];
}
```

### 2. Contract tests — add IoT test block

In `hardhat-project/test/SupplyChain.test.ts`, add a new `describe` block after the existing `Certifications` block:

```typescript
describe("IoT Sensor Readings", function () {
  beforeEach(async function () {
    // manufacturer adds product once; id = 1
    await contract.connect(manufacturer).addProduct("P", "Origin", "B1");
  });

  it("manufacturer can log a sensor reading", async function () {
    await expect(
      contract.connect(manufacturer).logSensorReading(1, 245, 72)
    ).to.emit(contract, "SensorReading");
  });

  it("address with NONE role cannot log", async function () {
    const [, , , noRole] = await ethers.getSigners();
    await expect(
      contract.connect(noRole).logSensorReading(1, 100, 50)
    ).to.be.revertedWith("SupplyChain: Unauthorized");
  });

  it("rejects humidity > 100", async function () {
    await expect(
      contract.connect(manufacturer).logSensorReading(1, 200, 101)
    ).to.be.revertedWith("SupplyChain: Invalid humidity");
  });

  it("rejects non-existent product", async function () {
    await expect(
      contract.connect(manufacturer).logSensorReading(999, 200, 50)
    ).to.be.revertedWith("Product does not exist");
  });

  it("getSensorReadings returns entries in order", async function () {
    await contract.connect(manufacturer).logSensorReading(1, 200, 60);
    await contract.connect(manufacturer).logSensorReading(1, 210, 65);
    const readings = await contract.getSensorReadings(1);
    expect(readings.length).to.equal(2);
    expect(Number(readings[0].temperature)).to.equal(200);
    expect(Number(readings[1].temperature)).to.equal(210);
  });

  it("getSensorReadings reverts for non-existent product", async function () {
    await expect(contract.getSensorReadings(999)).to.be.revertedWith(
      "Product does not exist"
    );
  });
});
```

Run `npx hardhat test` inside `hardhat-project/`. All tests must pass before proceeding (total count increases by 6).

### 3. Redeploy the contract

```bash
cd hardhat-project
npx hardhat run scripts/deploy.ts --network localhost
```

Copy the printed contract address into `frontend/.env.local` as `NEXT_PUBLIC_CONTRACT_ADDRESS=0x...`.

### 4. Add `SensorEntry` type to `frontend/lib/types.ts`

Append after the `CertificationEntry` interface:

```typescript
export interface SensorEntry {
  temperature: number; // stored ×10; display as (value / 10).toFixed(1)
  humidity: number;
  timestamp: number;
  logger: string;
}
```

### 5. Create `frontend/app/iot-simulator/page.tsx`

This page allows any connected wallet with a role to push temperature and humidity readings for a product onto the chain.

```tsx
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
        <Input
          label="Product ID"
          type="number"
          min={1}
          value={productId}
          onChange={(e) => setProductId(e.target.value)}
          required
        />

        <div className="flex items-center gap-3">
          <Thermometer className="w-5 h-5" style={{ color: "var(--sig-1)" }} />
          <Input
            label="Temperature (°C)"
            type="number"
            step="0.1"
            value={temperature}
            onChange={(e) => setTemperature(e.target.value)}
            required
          />
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
```

### 6. Create `frontend/app/track/[id]/_components/SensorChart.tsx`

```tsx
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
```

### 7. Update `frontend/app/track/[id]/page.tsx` — add sensor readings section

Add to the import list:

```tsx
import { SensorChart } from "./_components/SensorChart";
import type { SensorEntry } from "@/lib/types";
import { Activity } from "lucide-react";
```

Add state:

```tsx
const [sensorReadings, setSensorReadings] = useState<SensorEntry[]>([]);
```

Inside the `load()` function, after fetching certifications, add:

```tsx
try {
  const rawSensors = await contract.getSensorReadings(id);
  setSensorReadings(
    rawSensors.map((r: any) => ({
      temperature: Number(r.temperature),
      humidity:    Number(r.humidity),
      timestamp:   Number(r.timestamp),
      logger:      r.logger,
    }))
  );
} catch { /* product may have no readings */ }
```

At the end of the page JSX (after `<HistoryTimeline>`), insert:

```tsx
{/* Sensor Readings — Part 1 §5.4 */}
<div className="glass-card rounded-xl p-5 space-y-3">
  <div className="flex items-center gap-2">
    <Activity className="w-4 h-4" style={{ color: "var(--sig-1)" }} />
    <span className="text-sm font-semibold" style={{ color: "var(--text-secondary)" }}>
      Sensor Readings
    </span>
  </div>
  {sensorReadings.length === 0 ? (
    <p className="text-sm" style={{ color: "var(--text-muted)" }}>
      No sensor data recorded for this product yet.
    </p>
  ) : (
    <SensorChart readings={sensorReadings} />
  )}
</div>
```

### 8. Update `frontend/components/Navbar.tsx` — add IoT Simulator link

Add "IoT Simulator" to the `navLinks` array (or wherever the nav items are defined), pointing to `/iot-simulator`. Gate it with the same `walletState.isConnected && walletState.role !== "NONE"` condition used by other role-restricted links. Use the `Activity` icon from lucide-react.

## Acceptance checks

- [ ] `npx hardhat test` inside `hardhat-project/` passes (6 new tests; total ≥ 35).
- [ ] Contract is redeployed and `.env.local` updated.
- [ ] `/iot-simulator` page loads when wallet is connected with a role.
- [ ] Submitting the form triggers MetaMask; after approval the reading appears in the table below.
- [ ] `/track/1` shows a "Sensor Readings" section with a line chart after at least two readings are logged.
- [ ] `/track/1` shows "No sensor data recorded" when no readings exist.
- [ ] Navbar shows "IoT Simulator" link when connected; hides it when not connected.
- [ ] `npm run build` exits with 0 TypeScript errors.

## STOP — request user review

After finishing, post exactly: `Phase 23 complete — requesting review.`
