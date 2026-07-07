import { TRADE_STATUS } from "../../utils/constants";

// Two-row checklist showing who has confirmed the handover.
function ConfirmationStatus({ trade }) {
  const rows = [
    { done: trade.seller_confirmed, label: "Seller confirmed transfer" },
    { done: trade.buyer_confirmed, label: "Buyer confirmed receipt" },
  ];
  return (
    <div className="space-y-2">
      {rows.map((row) => (
        <div key={row.label} className="flex items-center gap-2">
          <span className={`material-symbols-outlined text-base ${row.done ? "text-green-600" : "text-slate-400"}`}>
            {row.done ? "check_circle" : "radio_button_unchecked"}
          </span>
          <span className="text-xs text-on-surface">{row.label}</span>
        </div>
      ))}
    </div>
  );
}

// Action buttons for a trade, driven by its status and the viewer's role.
function TradeActions({ trade, role, onAction }) {
  const isBuyer = role === "buyer";
  const isSeller = role === "seller";
  const myConfirmed = isBuyer ? trade.buyer_confirmed : trade.seller_confirmed;

  const confirmAbort = () => {
    if (confirm("Are you sure the trade did not happen? This will cancel the trade.")) {
      onAction(trade.id, "abort");
    }
  };

  if (trade.status === TRADE_STATUS.PENDING_SELLER) {
    if (isSeller) {
      return (
        <div className="flex gap-2">
          <button
            onClick={() => onAction(trade.id, "accept")}
            className="flex-1 py-2.5 bg-green-600 text-white rounded-lg font-bold text-sm hover:bg-green-700 transition-all flex items-center justify-center gap-1"
          >
            <span className="material-symbols-outlined text-base">check</span>Accept Trade
          </button>
          <button
            onClick={() => onAction(trade.id, "reject")}
            className="flex-1 py-2.5 bg-white text-red-600 border border-red-200 rounded-lg font-bold text-sm hover:bg-red-50 transition-all flex items-center justify-center gap-1"
          >
            <span className="material-symbols-outlined text-base">close</span>Reject
          </button>
        </div>
      );
    }
    return (
      <button
        onClick={() => onAction(trade.id, "cancel")}
        className="w-full py-2.5 bg-white text-on-surface-variant border border-outline-variant/30 rounded-lg font-bold text-sm hover:bg-surface-container-high transition-all flex items-center justify-center gap-1"
      >
        <span className="material-symbols-outlined text-base">close</span>Cancel Request
      </button>
    );
  }

  if (trade.status === TRADE_STATUS.ACCEPTED) {
    return (
      <div className="flex flex-col gap-2">
        {!myConfirmed ? (
          <button
            onClick={() => onAction(trade.id, isBuyer ? "confirm-receipt" : "confirm-transfer")}
            className="w-full py-2.5 bg-blue-600 text-white rounded-lg font-bold text-sm hover:bg-blue-700 transition-all flex items-center justify-center gap-1.5"
          >
            <span className="material-symbols-outlined text-base">verified</span>
            {isBuyer ? "I Confirm I Received the Vehicle" : "I Confirm I Transferred the Vehicle"}
          </button>
        ) : (
          <div className="w-full py-2.5 text-center text-xs font-semibold text-blue-600 bg-blue-100/50 rounded-lg">
            You confirmed — waiting for the other party
          </div>
        )}
        <button
          onClick={confirmAbort}
          className="w-full py-2 bg-white text-red-600 border border-red-200 rounded-lg font-bold text-xs hover:bg-red-50 hover:border-red-300 transition-all flex items-center justify-center gap-1"
        >
          <span className="material-symbols-outlined text-sm">cancel</span>Trade Did Not Happen
        </button>
      </div>
    );
  }

  return null;
}

// Compact card used in the listing sidebar.
function CompactTradeCard({ trade, role, onAction }) {
  const isBuyer = role === "buyer";
  const isPending = trade.status === TRADE_STATUS.PENDING_SELLER;
  const isAccepted = trade.status === TRADE_STATUS.ACCEPTED;

  if (isPending) {
    return (
      <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
        <div className="flex items-center gap-2 mb-2">
          <span className="material-symbols-outlined text-amber-600 text-lg">hourglass_top</span>
          <span className="text-sm font-bold text-amber-800">
            {isBuyer
              ? "Waiting for seller to accept..."
              : `Buy request from ${trade.buyer_first_name} ${trade.buyer_last_name}`}
          </span>
        </div>
        <p className="text-xs text-amber-700 mb-3">
          {isBuyer
            ? "Your purchase request has been sent. The seller needs to accept before the trade can proceed."
            : `₪${trade.price.toLocaleString()} — Awaiting your decision.`}
        </p>
        <TradeActions trade={trade} role={role} onAction={onAction} />
      </div>
    );
  }

  if (isAccepted) {
    return (
      <div className="rounded-xl border border-blue-200 bg-blue-50 p-4">
        <div className="flex items-center gap-2 mb-2">
          <span className="material-symbols-outlined text-blue-600 text-lg">handshake</span>
          <span className="text-sm font-bold text-blue-800">Trade Accepted</span>
        </div>
        <div className="mb-3">
          <ConfirmationStatus trade={trade} />
        </div>
        <TradeActions trade={trade} role={role} onAction={onAction} />
      </div>
    );
  }

  return null;
}

// Full card used in the trades history section.
function FullTradeCard({ trade, role, onAction }) {
  const isBuyer = role === "buyer";
  const isPending = trade.status === TRADE_STATUS.PENDING_SELLER;
  const isAccepted = trade.status === TRADE_STATUS.ACCEPTED;

  const otherName = isBuyer
    ? `${trade.seller_first_name} ${trade.seller_last_name}`
    : `${trade.buyer_first_name} ${trade.buyer_last_name}`;
  const vehicleName = `${trade.vehicle_brand || "Unknown"} ${trade.vehicle_model || ""}`.trim();

  const borderColor = isPending ? "border-amber-200" : "border-blue-200";
  const bgColor = isPending ? "bg-amber-50/50" : "bg-blue-50/50";

  return (
    <div className={`rounded-xl border ${borderColor} ${bgColor} p-5`}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${isPending ? "bg-amber-100" : "bg-blue-100"}`}>
            <span className={`material-symbols-outlined text-xl ${isPending ? "text-amber-600" : "text-blue-600"}`}>
              {isPending ? "hourglass_top" : "handshake"}
            </span>
          </div>
          <div>
            <p className="font-bold text-on-surface text-sm">{vehicleName}</p>
            <p className="text-xs text-on-surface-variant">
              {isBuyer ? "Buying from" : "Selling to"} {otherName}
            </p>
          </div>
        </div>
        <div className="text-right">
          <p className="font-black text-primary text-lg">₪{trade.price.toLocaleString()}</p>
          <p className="text-xs text-on-surface-variant">{new Date(trade.created_at).toLocaleDateString()}</p>
        </div>
      </div>

      {isPending && (
        <div className="flex items-center gap-2 mb-3 px-3 py-2 rounded-lg bg-amber-100/60">
          <span className="material-symbols-outlined text-amber-600 text-sm">info</span>
          <span className="text-xs text-amber-800 font-medium">
            {isBuyer ? "Waiting for the seller to accept your offer" : "You have a new purchase offer"}
          </span>
        </div>
      )}

      {isAccepted && (
        <div className="space-y-2 mb-3">
          <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-blue-100/60">
            <span className="material-symbols-outlined text-blue-600 text-sm">info</span>
            <span className="text-xs text-blue-800 font-medium">Both parties need to confirm the handover</span>
          </div>
          <ConfirmationStatus trade={trade} />
        </div>
      )}

      <TradeActions trade={trade} role={role} onAction={onAction} />
    </div>
  );
}

export default function TradeCard({ trade, variant = "full", role, onAction }) {
  if (variant === "compact") {
    return <CompactTradeCard trade={trade} role={role} onAction={onAction} />;
  }
  return <FullTradeCard trade={trade} role={role} onAction={onAction} />;
}
