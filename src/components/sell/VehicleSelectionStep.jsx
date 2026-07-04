import EmptyState from "../ui/EmptyState";
import { VEHICLE_ICONS } from "../../utils/constants";

export default function VehicleSelectionStep({ vehicles, onSelect }) {
  if (vehicles.length === 0) {
    return (
      <EmptyState
        icon="directions_bike"
        title="No vehicles available to sell"
        description="You need to verify ownership of a vehicle before you can sell it."
        actionLabel="Verify a Vehicle"
        actionTo="/verify"
      />
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      {vehicles.map((v) => (
        <div key={v.frame_number} className="bg-surface-container-lowest rounded-xl border border-outline-variant/20 p-5 hover:shadow-md transition-all">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <span className="material-symbols-outlined text-primary text-xl">{VEHICLE_ICONS[v.vehicle_type] || "pedal_bike"}</span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-bold text-on-surface text-sm truncate">{v.brand || "Unknown"} {v.model || ""}</p>
              <p className="text-xs text-on-surface-variant capitalize">{v.vehicle_type}</p>
            </div>
            <span className="material-symbols-outlined text-green-500 text-xl">verified</span>
          </div>
          <div className="space-y-1.5 text-sm mb-4">
            <div className="flex justify-between">
              <span className="text-on-surface-variant">Frame #</span>
              <span className="font-medium text-on-surface font-mono text-xs">{v.frame_number}</span>
            </div>
            {v.color && (
              <div className="flex justify-between">
                <span className="text-on-surface-variant">Color</span>
                <span className="font-medium text-on-surface">{v.color}</span>
              </div>
            )}
          </div>
          <button
            onClick={() => onSelect(v)}
            className="w-full py-2.5 rounded-xl bg-primary text-white font-bold text-sm hover:shadow-lg hover:shadow-primary/20 transition-all flex items-center justify-center gap-1.5"
          >
            <span className="material-symbols-outlined text-base">sell</span>
            Sell this vehicle
          </button>
        </div>
      ))}
    </div>
  );
}
