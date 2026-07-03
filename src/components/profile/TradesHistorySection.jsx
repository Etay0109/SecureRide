import { useState, useEffect, useCallback } from "react";
import SectionHeading from "../ui/SectionHeading";
import EmptyState from "../ui/EmptyState";
import TradeCard from "../trades/TradeCard";

function CompletedTradeRow({ trade, role }) {
  const isBuyer = role === "buyer";
  const otherName = isBuyer
    ? `${trade.seller_first_name} ${trade.seller_last_name}`
    : `${trade.buyer_first_name} ${trade.buyer_last_name}`;
  const vehicleName = `${trade.vehicle_brand || "Unknown"} ${trade.vehicle_model || ""}`.trim();

  return (
    <div className="bg-surface-container-lowest rounded-xl border border-outline-variant/20 p-4 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-green-100 flex items-center justify-center">
          <span className="material-symbols-outlined text-green-600 text-xl">{isBuyer ? "shopping_cart" : "sell"}</span>
        </div>
        <div>
          <p className="font-bold text-on-surface text-sm">{vehicleName}</p>
          <p className="text-xs text-on-surface-variant">{isBuyer ? "Bought from" : "Sold to"} {otherName}</p>
        </div>
      </div>
      <div className="text-right">
        <p className="font-black text-primary">₪{trade.price.toLocaleString()}</p>
        <p className="text-xs text-on-surface-variant">{trade.completed_at ? new Date(trade.completed_at).toLocaleDateString() : ""}</p>
      </div>
    </div>
  );
}

export default function TradesHistorySection({ user, token, onVehicleTransferred }) {
  const [trades, setTrades] = useState([]);

  const fetchTrades = useCallback(async () => {
    if (!token) return;
    try {
      const res = await fetch("/api/trades/my", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) setTrades(await res.json());
    } catch { /* silently fail */ }
  }, [token]);

  useEffect(() => {
    fetchTrades();
  }, [fetchTrades]);

  const handleTradeAction = async (tradeId, action) => {
    try {
      const res = await fetch(`/api/trades/${tradeId}/${action}`, {
        method: "PUT",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) {
        const d = await res.json().catch(() => null);
        throw new Error(d?.detail || `Failed to ${action}`);
      }
      await fetchTrades();
      if (action === "confirm-transfer" || action === "confirm-receipt") {
        onVehicleTransferred();
      }
    } catch (err) {
      alert(err.message);
    }
  };

  const activeTrades = trades.filter((t) => ["pending_seller", "accepted"].includes(t.status));
  const completedBuys = trades.filter((t) => t.status === "completed" && t.buyer_id === user?.id);
  const completedSales = trades.filter((t) => t.status === "completed" && t.seller_id === user?.id);

  return (
    <>
      <section className="mb-10">
        <SectionHeading icon="sync_alt" title="Active Trades" />
        {activeTrades.length === 0 ? (
          <EmptyState icon="handshake" title="No active trades" description="When you buy or receive a purchase offer, active trades will appear here." />
        ) : (
          <div className="space-y-4">
            {activeTrades.map((t) => (
              <TradeCard key={t.id} trade={t} isBuyer={t.buyer_id === user?.id} isSeller={t.seller_id === user?.id} onAction={handleTradeAction} />
            ))}
          </div>
        )}
      </section>

      <section className="mb-10">
        <SectionHeading icon="shopping_cart" title="Buy History" />
        {completedBuys.length === 0 ? (
          <EmptyState icon="receipt_long" title="No purchase history yet" description="Your vehicle purchase records will appear here once completed." />
        ) : (
          <div className="space-y-3">
            {completedBuys.map((t) => <CompletedTradeRow key={t.id} trade={t} role="buyer" />)}
          </div>
        )}
      </section>

      <section className="mb-10">
        <SectionHeading icon="sell" title="Sale History" />
        {completedSales.length === 0 ? (
          <EmptyState icon="storefront" title="No sale history yet" description="Your vehicle sale records will appear here once completed." />
        ) : (
          <div className="space-y-3">
            {completedSales.map((t) => <CompletedTradeRow key={t.id} trade={t} role="seller" />)}
          </div>
        )}
      </section>
    </>
  );
}
