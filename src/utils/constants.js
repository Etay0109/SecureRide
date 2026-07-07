export const VEHICLE_ICONS = {
  "Electric Scooter": "electric_scooter",
  "Bicycle": "pedal_bike",
  "Electric Bicycle": "electric_moped",
};

// Image upload limits (kept in sync with backend schemas).
export const MAX_IMAGE_BYTES = 10 * 1024 * 1024; // 10 MB
export const MAX_PHOTOS = 8;

// Trade status values (mirror backend constants.TradeStatus).
export const TRADE_STATUS = {
  PENDING_SELLER: "pending_seller",
  ACCEPTED: "accepted",
  COMPLETED: "completed",
  REJECTED: "rejected",
  CANCELLED: "cancelled",
};

export const ACTIVE_TRADE_STATUSES = [TRADE_STATUS.PENDING_SELLER, TRADE_STATUS.ACCEPTED];

const FIELD_BASE =
  "w-full rounded-xl border border-outline-variant/30 text-on-surface placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-all";

export const inputCls = `${FIELD_BASE} px-4 py-3 bg-surface-container-low`;

export const inputClsRegister = `${FIELD_BASE} px-4 py-3 bg-surface-container-lowest`;

export const inputClsCompact =
  "w-full px-3 py-2 rounded-lg border border-outline-variant/30 bg-surface-container-low text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 transition-all";
