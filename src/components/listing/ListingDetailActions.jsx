import TradeCard from "../trades/TradeCard";

export default function ListingDetailActions({
  isOwnListing,
  editing,
  deleting,
  saving,
  buyingLoading,
  myActiveTrade,
  pendingTradesForSeller,
  acceptedTradeForSeller,
  onStartEditing,
  onCancelEditing,
  onSaveEdit,
  onDelete,
  onBuyNow,
  onTradeAction,
  onOpenChat,
}) {
  return (
    <div className="space-y-3 mb-8">
      {isOwnListing ? (
        <div className="space-y-2">
          <div className="px-4 py-2 rounded-xl bg-primary/5 border border-primary/20 text-primary text-xs text-center font-semibold flex items-center justify-center gap-1.5">
            <span className="material-symbols-outlined text-sm">storefront</span>
            Your Listing
          </div>
          {!editing ? (
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={onStartEditing}
                className="py-3 bg-primary text-white rounded-xl font-bold text-sm hover:shadow-lg hover:shadow-primary/20 transition-all flex items-center justify-center gap-1.5"
              >
                <span className="material-symbols-outlined text-lg">edit</span>Edit
              </button>
              <button
                onClick={onDelete}
                disabled={deleting}
                className="py-3 bg-white text-red-600 border-2 border-red-200 rounded-xl font-bold text-sm hover:bg-red-50 hover:border-red-300 transition-all flex items-center justify-center gap-1.5 disabled:opacity-50"
              >
                <span className="material-symbols-outlined text-lg">{deleting ? "hourglass_empty" : "delete"}</span>
                {deleting ? "Deleting..." : "Delete"}
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={onSaveEdit}
                disabled={saving}
                className="py-3 bg-green-600 text-white rounded-xl font-bold text-sm hover:shadow-lg hover:shadow-green-600/20 transition-all flex items-center justify-center gap-1.5 disabled:opacity-50"
              >
                <span className="material-symbols-outlined text-lg">{saving ? "hourglass_empty" : "check"}</span>
                {saving ? "Saving..." : "Save"}
              </button>
              <button
                onClick={onCancelEditing}
                className="py-3 bg-white text-on-surface-variant border-2 border-outline-variant/30 rounded-xl font-bold text-sm hover:bg-surface-container-high transition-all flex items-center justify-center gap-1.5"
              >
                <span className="material-symbols-outlined text-lg">close</span>Cancel
              </button>
            </div>
          )}
          {pendingTradesForSeller.length > 0 && (
            <div className="mt-3 space-y-2">
              <p className="text-xs font-semibold text-on-surface-variant">Incoming Buy Requests</p>
              {pendingTradesForSeller.map((t) => (
                <TradeCard variant="compact" key={t.id} trade={t} role="seller" onAction={onTradeAction} />
              ))}
            </div>
          )}
          {acceptedTradeForSeller && (
            <div className="mt-3 space-y-2">
              <p className="text-xs font-semibold text-on-surface-variant">Active Trade</p>
              <TradeCard variant="compact" trade={acceptedTradeForSeller} role="seller" onAction={onTradeAction} />
            </div>
          )}
        </div>
      ) : (
        <>
          {myActiveTrade ? (
            <TradeCard variant="compact" trade={myActiveTrade} role="buyer" onAction={onTradeAction} />
          ) : (
            <button
              onClick={onBuyNow}
              disabled={buyingLoading}
              className="w-full py-4 bg-primary text-white rounded-xl font-bold text-lg hover:shadow-xl hover:shadow-primary/30 transition-all flex items-center justify-center gap-2 disabled:opacity-60"
            >
              <span className="material-symbols-outlined text-xl">{buyingLoading ? "hourglass_empty" : "shopping_cart"}</span>
              {buyingLoading ? "Sending Request..." : "Buy Now"}
            </button>
          )}
          <button
            onClick={onOpenChat}
            className="w-full py-4 bg-white text-primary border-2 border-primary/20 rounded-xl font-bold text-lg hover:bg-primary/5 hover:border-primary/40 transition-all flex items-center justify-center gap-2"
          >
            <span className="material-symbols-outlined text-xl">chat</span>
            Chat with Seller
          </button>
        </>
      )}
    </div>
  );
}
