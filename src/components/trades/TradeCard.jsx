export default function TradeCard({ trade, variant = "full", isBuyer, isSeller, role, onAction }) {
  if (variant === "compact") {
    const isB = role === "buyer";
    const isS = role === "seller";
    const isPending = trade.status === "pending_seller";
    const isAccepted = trade.status === "accepted";

    if (isPending) {
      return (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
          <div className="flex items-center gap-2 mb-2">
            <span className="material-symbols-outlined text-amber-600 text-lg">hourglass_top</span>
            <span className="text-sm font-bold text-amber-800">
              {isB
                ? "Waiting for seller to accept..."
                : `Buy request from ${trade.buyer_first_name} ${trade.buyer_last_name}`}
            </span>
          </div>
          <p className="text-xs text-amber-700 mb-3">
            {isB
              ? "Your purchase request has been sent. The seller needs to accept before the trade can proceed."
              : `₪${trade.price.toLocaleString()} — Awaiting your decision.`}
          </p>
          {isS && (
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => onAction(trade.id, "accept")}
                className="py-2 bg-green-600 text-white rounded-lg font-bold text-sm hover:bg-green-700 transition-all flex items-center justify-center gap-1"
              >
                <span className="material-symbols-outlined text-base">check</span>Accept
              </button>
              <button
                onClick={() => onAction(trade.id, "reject")}
                className="py-2 bg-white text-red-600 border border-red-200 rounded-lg font-bold text-sm hover:bg-red-50 transition-all flex items-center justify-center gap-1"
              >
                <span className="material-symbols-outlined text-base">close</span>Reject
              </button>
            </div>
          )}
          {isB && (
            <button
              onClick={() => onAction(trade.id, "cancel")}
              className="w-full py-2 bg-white text-on-surface-variant border border-outline-variant/30 rounded-lg font-bold text-xs hover:bg-surface-container-high transition-all"
            >
              Cancel Request
            </button>
          )}
        </div>
      );
    }

    if (isAccepted) {
      const myConfirmed = isB ? trade.buyer_confirmed : trade.seller_confirmed;
      const otherName = isB ? `${trade.seller_first_name}` : `${trade.buyer_first_name}`;
      return (
        <div className="rounded-xl border border-blue-200 bg-blue-50 p-4">
          <div className="flex items-center gap-2 mb-2">
            <span className="material-symbols-outlined text-blue-600 text-lg">handshake</span>
            <span className="text-sm font-bold text-blue-800">Trade Accepted</span>
          </div>
          <div className="space-y-2 mb-3">
            <div className="flex items-center gap-2">
              <span className={`material-symbols-outlined text-base ${trade.seller_confirmed ? "text-green-600" : "text-slate-400"}`}>
                {trade.seller_confirmed ? "check_circle" : "radio_button_unchecked"}
              </span>
              <span className="text-xs text-blue-800">
                Seller confirmed transfer {trade.seller_confirmed ? "✓" : ""}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className={`material-symbols-outlined text-base ${trade.buyer_confirmed ? "text-green-600" : "text-slate-400"}`}>
                {trade.buyer_confirmed ? "check_circle" : "radio_button_unchecked"}
              </span>
              <span className="text-xs text-blue-800">
                Buyer confirmed receipt {trade.buyer_confirmed ? "✓" : ""}
              </span>
            </div>
          </div>
          {!myConfirmed ? (
            <button
              onClick={() => onAction(trade.id, isB ? "confirm-receipt" : "confirm-transfer")}
              className="w-full py-3 bg-blue-600 text-white rounded-lg font-bold text-sm hover:bg-blue-700 transition-all flex items-center justify-center gap-1.5"
            >
              <span className="material-symbols-outlined text-base">verified</span>
              {isB ? "I Confirm I Received the Vehicle" : "I Confirm I Transferred the Vehicle"}
            </button>
          ) : (
            <div className="text-center py-2 text-xs font-semibold text-blue-600">
              You confirmed — waiting for {otherName} to confirm
            </div>
          )}
          <button
            onClick={() => {
              if (confirm("Are you sure the trade did not happen? This will cancel the trade.")) {
                onAction(trade.id, "abort");
              }
            }}
            className="w-full mt-2 py-2 bg-white text-red-600 border border-red-200 rounded-lg font-bold text-xs hover:bg-red-50 hover:border-red-300 transition-all flex items-center justify-center gap-1"
          >
            <span className="material-symbols-outlined text-sm">cancel</span>Trade Did Not Happen
          </button>
        </div>
      );
    }

    return null;
  }

  // variant === "full"
  const otherName = isBuyer
    ? `${trade.seller_first_name} ${trade.seller_last_name}`
    : `${trade.buyer_first_name} ${trade.buyer_last_name}`;
  const vehicleName = `${trade.vehicle_brand || "Unknown"} ${trade.vehicle_model || ""}`.trim();

  const isPending = trade.status === "pending_seller";
  const isAccepted = trade.status === "accepted";
  const myConfirmed = isBuyer ? trade.buyer_confirmed : trade.seller_confirmed;

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
          <div className="flex items-center gap-2">
            <span className={`material-symbols-outlined text-base ${trade.seller_confirmed ? "text-green-600" : "text-slate-400"}`}>
              {trade.seller_confirmed ? "check_circle" : "radio_button_unchecked"}
            </span>
            <span className="text-xs text-on-surface">Seller confirmed transfer</span>
          </div>
          <div className="flex items-center gap-2">
            <span className={`material-symbols-outlined text-base ${trade.buyer_confirmed ? "text-green-600" : "text-slate-400"}`}>
              {trade.buyer_confirmed ? "check_circle" : "radio_button_unchecked"}
            </span>
            <span className="text-xs text-on-surface">Buyer confirmed transfer</span>
          </div>
        </div>
      )}

      <div className="flex gap-2">
        {isPending && isSeller && (
          <>
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
          </>
        )}
        {isPending && isBuyer && (
          <button
            onClick={() => onAction(trade.id, "cancel")}
            className="flex-1 py-2.5 bg-white text-on-surface-variant border border-outline-variant/30 rounded-lg font-bold text-sm hover:bg-surface-container-high transition-all flex items-center justify-center gap-1"
          >
            <span className="material-symbols-outlined text-base">close</span>Cancel Request
          </button>
        )}
        {isAccepted && !myConfirmed && (
          <button
            onClick={() => onAction(trade.id, isBuyer ? "confirm-receipt" : "confirm-transfer")}
            className="flex-1 py-2.5 bg-blue-600 text-white rounded-lg font-bold text-sm hover:bg-blue-700 transition-all flex items-center justify-center gap-1.5"
          >
            <span className="material-symbols-outlined text-base">verified</span>
            {isBuyer ? "I Confirm I Received the Vehicle" : "I Confirm I Transferred the Vehicle"}
          </button>
        )}
        {isAccepted && myConfirmed && (
          <div className="flex-1 py-2.5 text-center text-xs font-semibold text-blue-600 bg-blue-100/50 rounded-lg">
            You confirmed — waiting for the other party
          </div>
        )}
        {isAccepted && (
          <button
            onClick={() => {
              if (confirm("Are you sure the trade did not happen? This will cancel the trade.")) {
                onAction(trade.id, "abort");
              }
            }}
            className="flex-1 py-2.5 bg-white text-red-600 border border-red-200 rounded-lg font-bold text-sm hover:bg-red-50 hover:border-red-300 transition-all flex items-center justify-center gap-1"
          >
            <span className="material-symbols-outlined text-base">cancel</span>Trade Did Not Happen
          </button>
        )}
      </div>
    </div>
  );
}
