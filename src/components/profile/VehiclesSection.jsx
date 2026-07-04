import { useState } from "react";
import SectionHeading from "../ui/SectionHeading";
import EmptyState from "../ui/EmptyState";
import { api } from "../../utils/api";

import { VEHICLE_ICONS } from "../../utils/constants";

const VEHICLES_PER_PAGE = 5;

export default function VehiclesSection({ vehicles, onVehiclesChange }) {
  const [vehicleSearch, setVehicleSearch] = useState("");
  const [vehiclePage, setVehiclePage] = useState(1);

  const handleToggleStolen = async (frameNumber, currentlyStolen) => {
    const message = currentlyStolen ? "Mark this vehicle as found?" : "Are you sure you want to report this vehicle as stolen?";
    if (!confirm(message)) return;
    try {
      await api(`/verify/${encodeURIComponent(frameNumber)}/toggle-stolen`, { method: "PUT" });
      onVehiclesChange();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleDeleteVehicle = async (frameNumber) => {
    if (!confirm("Are you sure you want to delete this vehicle? This cannot be undone.")) return;
    try {
      await api(`/verify/${encodeURIComponent(frameNumber)}`, { method: "DELETE" });
      onVehiclesChange();
    } catch (err) {
      alert(err.message);
    }
  };

  const filteredVehicles = vehicles.filter((v) => {
    if (!vehicleSearch) return true;
    const q = vehicleSearch.toLowerCase();
    return (
      v.frame_number?.toLowerCase().includes(q) ||
      v.brand?.toLowerCase().includes(q) ||
      v.model?.toLowerCase().includes(q) ||
      v.vehicle_type?.toLowerCase().includes(q) ||
      v.color?.toLowerCase().includes(q)
    );
  });
  const totalVehiclePages = Math.max(1, Math.ceil(filteredVehicles.length / VEHICLES_PER_PAGE));
  const pagedVehicles = filteredVehicles.slice((vehiclePage - 1) * VEHICLES_PER_PAGE, vehiclePage * VEHICLES_PER_PAGE);

  return (
    <section className="mb-10">
      <SectionHeading icon="verified_user" title="My Verified Vehicles" />
      {vehicles.length > 0 && (
        <div className="relative mb-4">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-lg pointer-events-none">search</span>
          <input
            type="text"
            placeholder="Search by frame #, brand, model, type, color…"
            value={vehicleSearch}
            onChange={(e) => { setVehicleSearch(e.target.value); setVehiclePage(1); }}
            className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-outline-variant/30 bg-surface-container-lowest text-on-surface text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-all"
          />
        </div>
      )}
      {vehicles.length === 0 ? (
        <EmptyState icon="directions_bike" title="No verified vehicles yet" description="Once you verify ownership of a vehicle, it will appear here." actionLabel="Verify a Vehicle" actionTo="/verify" />
      ) : filteredVehicles.length === 0 ? (
        <p className="text-sm text-on-surface-variant text-center py-6">No vehicles match your search.</p>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {pagedVehicles.map((v) => (
              <div key={v.frame_number} className={`bg-surface-container-lowest rounded-xl border p-5 hover:shadow-md transition-all ${v.stolen ? "border-red-300 bg-red-50/30" : "border-outline-variant/20"}`}>
                <div className="flex items-center gap-3 mb-3">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${v.stolen ? "bg-red-100" : "bg-primary/10"}`}>
                    <span className={`material-symbols-outlined text-xl ${v.stolen ? "text-red-500" : "text-primary"}`}>{VEHICLE_ICONS[v.vehicle_type] || "pedal_bike"}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-on-surface text-sm truncate">{v.brand || "Unknown"} {v.model || ""}</p>
                    <p className="text-xs text-on-surface-variant capitalize">{v.vehicle_type}</p>
                  </div>
                  {v.stolen ? (
                    <span className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-red-100 text-red-700 text-xs font-bold">
                      <span className="material-symbols-outlined text-sm">warning</span>Stolen
                    </span>
                  ) : (
                    <span className="material-symbols-outlined text-green-500 text-xl">verified</span>
                  )}
                </div>
                <div className="space-y-1.5 text-sm">
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
                  <div className="flex justify-between">
                    <span className="text-on-surface-variant">Verified</span>
                    <span className="font-medium text-on-surface text-xs">{new Date(v.created_at).toLocaleDateString()}</span>
                  </div>
                </div>
                <button
                  onClick={() => handleToggleStolen(v.frame_number, v.stolen)}
                  className={`mt-4 w-full py-2 rounded-xl border text-sm font-semibold transition-all flex items-center justify-center gap-1.5 ${v.stolen ? "border-green-200 text-green-600 hover:bg-green-50 hover:border-green-300" : "border-red-200 text-red-600 hover:bg-red-50 hover:border-red-300"}`}
                >
                  <span className="material-symbols-outlined text-base">{v.stolen ? "check_circle" : "report"}</span>
                  {v.stolen ? "Report as Found" : "Report as Stolen"}
                </button>
                <button
                  onClick={() => handleDeleteVehicle(v.frame_number)}
                  className="mt-2 w-full py-2 rounded-xl border border-slate-200 text-slate-500 hover:bg-red-50 hover:border-red-200 hover:text-red-600 text-sm font-semibold transition-all flex items-center justify-center gap-1.5"
                >
                  <span className="material-symbols-outlined text-base">delete</span>Delete Vehicle
                </button>
              </div>
            ))}
          </div>
          {totalVehiclePages > 1 && (
            <div className="flex items-center justify-between mt-4">
              <button onClick={() => setVehiclePage((p) => p - 1)} disabled={vehiclePage === 1} className="px-4 py-2 rounded-xl border border-outline-variant/30 text-sm font-semibold text-on-surface disabled:opacity-40 hover:bg-surface-container transition-all">Previous</button>
              <span className="text-sm text-on-surface-variant">Page {vehiclePage} of {totalVehiclePages}</span>
              <button onClick={() => setVehiclePage((p) => p + 1)} disabled={vehiclePage === totalVehiclePages} className="px-4 py-2 rounded-xl border border-outline-variant/30 text-sm font-semibold text-on-surface disabled:opacity-40 hover:bg-surface-container transition-all">Next</button>
            </div>
          )}
        </>
      )}
    </section>
  );
}
