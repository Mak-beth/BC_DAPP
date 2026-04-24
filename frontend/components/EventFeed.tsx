"use client";
import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  PackagePlus, ArrowRightLeft, RefreshCw,
  FileCheck, AlertTriangle, Activity, Zap,
} from "lucide-react";
import { getContract, shortenAddress } from "@/lib/contract";
import { ethers } from "ethers";

interface FeedEvent {
  key: string;
  type: string;
  productId: number;
  detail: string;
  actor: string;
  blockNumber: number;
  time: Date;
}

const EVENT_META: Record<string, { icon: React.ReactNode; colour: string; label: string }> = {
  ProductAdded:         { icon: <PackagePlus   className="w-4 h-4" />, colour: "var(--verified)",    label: "Product Added"       },
  OwnershipTransferred: { icon: <ArrowRightLeft className="w-4 h-4" />, colour: "var(--sig-2)",      label: "Ownership Transfer"  },
  StatusUpdated:        { icon: <RefreshCw      className="w-4 h-4" />, colour: "var(--sig-3)",      label: "Status Updated"      },
  CertificationAdded:   { icon: <FileCheck      className="w-4 h-4" />, colour: "var(--sig-1)",      label: "Cert Anchored"       },
  ProductRecalled:      { icon: <AlertTriangle  className="w-4 h-4" />, colour: "#ef4444",           label: "Recall Issued"       },
  SensorReading:        { icon: <Activity       className="w-4 h-4" />, colour: "var(--role-mfr)",   label: "Sensor Reading"      },
};

function parseLog(log: ethers.EventLog | ethers.Log): FeedEvent | null {
  try {
    const el = log as ethers.EventLog;
    const name = el.eventName;
    const args = el.args;
    if (!name || !args) return null;
    const meta = EVENT_META[name];
    if (!meta) return null;

    let productId = 0;
    let detail    = "";
    let actor     = "";

    if (name === "ProductAdded") {
      productId = Number(args[0]);
      actor     = args[1] as string;
    } else if (name === "OwnershipTransferred") {
      productId = Number(args[0]);
      actor     = args[1] as string;
      detail    = `→ ${shortenAddress(args[2] as string)}`;
    } else if (name === "StatusUpdated") {
      productId = Number(args[0]);
    } else if (name === "CertificationAdded") {
      productId = Number(args[0]);
      actor     = args[2] as string;
    } else if (name === "ProductRecalled") {
      productId = Number(args[0]);
      detail    = args[1] as string;
      actor     = args[2] as string;
    } else if (name === "SensorReading") {
      productId = Number(args[0]);
      detail    = `${(Number(args[1]) / 10).toFixed(1)} °C · ${Number(args[2])} %`;
      actor     = args[4] as string;
    }

    return {
      key: `${el.blockNumber}-${el.transactionIndex ?? 0}-${name}`,
      type: name,
      productId,
      detail,
      actor,
      blockNumber: el.blockNumber,
      time: new Date(),
    };
  } catch {
    return null;
  }
}

export function EventFeed() {
  const [events, setEvents]   = useState<FeedEvent[]>([]);
  const [open, setOpen]       = useState(true);
  const [loading, setLoading] = useState(true);
  const lastBlock             = useRef<number>(0);

  function prepend(ev: FeedEvent) {
    setEvents((prev) => [ev, ...prev].slice(0, 50));
  }

  useEffect(() => {
    let contract: ethers.Contract | null = null;
    let cancelled = false;

    async function init() {
      try {
        contract = await getContract(false);

        // Load recent history (last 200 blocks)
        const provider = contract.runner?.provider as ethers.JsonRpcProvider | null;
        const currentBlock = provider ? await provider.getBlockNumber() : 0;
        lastBlock.current = currentBlock;
        const fromBlock = Math.max(0, currentBlock - 200);

        const logs = await contract.queryFilter("*", fromBlock, currentBlock);
        if (!cancelled) {
          const parsed = (logs as (ethers.EventLog | ethers.Log)[])
            .map(parseLog)
            .filter((e): e is FeedEvent => e !== null)
            .sort((a, b) => b.blockNumber - a.blockNumber)
            .slice(0, 50);
          setEvents(parsed);
          setLoading(false);
        }

        // Live listener for each known event
        const listen = (name: string) => {
          contract!.on(name, (...args) => {
            if (cancelled) return;
            const ev = args[args.length - 1] as ethers.EventLog;
            const parsed = parseLog(ev);
            if (parsed) prepend(parsed);
          });
        };
        Object.keys(EVENT_META).forEach(listen);
      } catch {
        if (!cancelled) setLoading(false);
      }
    }

    init();
    return () => {
      cancelled = true;
      contract?.removeAllListeners();
    };
  }, []);

  return (
    <div className="glass-card rounded-xl overflow-hidden">
      {/* Header — collapsible toggle */}
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between px-5 py-3 text-left hover:bg-white/5 transition-colors"
      >
        <span className="flex items-center gap-2 text-sm font-semibold" style={{ color: "var(--text-secondary)" }}>
          <Zap className="w-4 h-4" style={{ color: "var(--sig-1)" }} />
          Live Chain Events
        </span>
        <span className="text-xs" style={{ color: "var(--text-muted)" }}>
          {open ? "▲ collapse" : "▼ expand"}
        </span>
      </button>

      {open && (
        <div className="max-h-64 overflow-y-auto divide-y divide-white/5">
          {loading && (
            <p className="px-5 py-4 text-sm" style={{ color: "var(--text-muted)" }}>
              Loading recent events…
            </p>
          )}
          {!loading && events.length === 0 && (
            <p className="px-5 py-4 text-sm" style={{ color: "var(--text-muted)" }}>
              No events in the last 200 blocks. Add a product to see the feed come alive.
            </p>
          )}
          <AnimatePresence initial={false}>
            {events.map((ev) => {
              const meta = EVENT_META[ev.type];
              return (
                <motion.div
                  key={ev.key}
                  initial={{ opacity: 0, x: -12 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.18 }}
                  className="flex items-start gap-3 px-5 py-3"
                >
                  <span className="mt-0.5 shrink-0" style={{ color: meta.colour }}>
                    {meta.icon}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium truncate" style={{ color: "var(--text-primary)" }}>
                      Product #{ev.productId} — {meta.label}
                      {ev.detail && (
                        <span className="ml-1 font-normal" style={{ color: "var(--text-muted)" }}>
                          {ev.detail}
                        </span>
                      )}
                    </p>
                    {ev.actor && (
                      <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                        {shortenAddress(ev.actor)} · block #{ev.blockNumber}
                      </p>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}
