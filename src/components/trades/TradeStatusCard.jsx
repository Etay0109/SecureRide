export default function TradeStatusCard({ trade, role, onAction }) {
  const isBuyer = role === "buyer";
  const isSeller = role === "seller";

  if (trade.status === "pending_seller") {
    return (
      <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
        <div className="flex items-center gap-2 mb-2">
          <span className="material-symbols-outlined text-amber-600 text-lg">
            hourglass_top
          </span>
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
        {isSeller && (
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => onAction(trade.id, "accept")}
              className="py-2 bg-green-600 text-white rounded-lg font-bold text-sm hover:bg-green-700 transition-all flex items-center justify-center gap-1"
            >
              <span className="material-symbols-outlined text-base">check</span>
              Accept
            </button>
            <button
              onClick={() => onAction(trade.id, "reject")}
              className="py-2 bg-white text-red-600 border border-red-200 rounded-lg font-bold text-sm hover:bg-red-50 transition-all flex items-center justify-center gap-1"
            >
              <span className="material-symbols-outlined text-base">close</span>
              Reject
            </button>
          </div>
        )}
        {isBuyer && (
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

  if (trade.status === "accepted") {
    const myConfirmed = isBuyer
      ? trade.buyer_confirmed
      : trade.seller_confirmed;
    const otherName = isBuyer
      ? `${trade.seller_first_name}`
      : `${trade.buyer_first_name}`;

    return (
      <div className="rounded-xl border border-blue-200 bg-blue-50 p-4">
        <div className="flex items-center gap-2 mb-2">
          <span className="material-symbols-outlined text-blue-600 text-lg">
            handshake
          </span>
          <span className="text-sm font-bold text-blue-800">
            Trade Accepted
          </span>
        </div>
        <div className="space-y-2 mb-3">
          <div className="flex items-center gap-2">
            <span
              className={`material-symbols-outlined text-base ${trade.seller_confirmed ? "text-green-600" : "text-slate-400"}`}
            >
              {trade.seller_confirmed
                ? "check_circle"
                : "radio_button_unchecked"}
            </span>
            <span className="text-xs text-blue-800">
              Seller confirmed transfer {trade.seller_confirmed ? "✓" : ""}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span
              className={`material-symbols-outlined text-base ${trade.buyer_confirmed ? "text-green-600" : "text-slate-400"}`}
            >
              {trade.buyer_confirmed
                ? "check_circle"
                : "radio_button_unchecked"}
            </span>
            <span className="text-xs text-blue-800">
              Buyer confirmed receipt {trade.buyer_confirmed ? "✓" : ""}
            </span>
          </div>
        </div>
        {!myConfirmed ? (
          <button
            onClick={() =>
              onAction(
                trade.id,
                isBuyer ? "confirm-receipt" : "confirm-transfer",
              )
            }
            className="w-full py-3 bg-blue-600 text-white rounded-lg font-bold text-sm hover:bg-blue-700 transition-all flex items-center justify-center gap-1.5"
          >
            <span className="material-symbols-outlined text-base">
              verified
            </span>
            {isBuyer
              ? "I Confirm I Received the Vehicle"
              : "I Confirm I Transferred the Vehicle"}
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
          <span className="material-symbols-outlined text-sm">
            cancel
          </span>
          Trade Did Not Happen
        </button>
      </div>
    );
  }

  return null;
}
