import SectionHeading from "../ui/SectionHeading";
import PhotoUploader from "./PhotoUploader";

const VEHICLE_ICONS = {
  "Electric Scooter": "electric_scooter",
  "Bicycle": "pedal_bike",
  "Electric Bicycle": "electric_moped",
};

const inputCls = "w-full px-4 py-3 rounded-xl border border-outline-variant/30 bg-surface-container-low text-on-surface placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-all";

export default function ListingFormStep({
  vehicle,
  condition,
  setCondition,
  ownershipDuration,
  setOwnershipDuration,
  price,
  setPrice,
  city,
  setCity,
  address,
  setAddress,
  description,
  setDescription,
  photos,
  setPhotos,
  submitLoading,
  submitError,
  onSubmit,
  onBack,
}) {
  return (
    <div>
      <button onClick={onBack} className="flex items-center gap-1 text-sm text-primary font-semibold mb-6 hover:underline">
        <span className="material-symbols-outlined text-base">arrow_back</span>Back to vehicles
      </button>
      <div className="bg-primary/5 rounded-xl border border-primary/20 p-4 flex items-center gap-4 mb-8">
        <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
          <span className="material-symbols-outlined text-primary text-2xl">{VEHICLE_ICONS[vehicle.vehicle_type] || "pedal_bike"}</span>
        </div>
        <div>
          <p className="font-bold text-on-surface">{vehicle.brand || "Unknown"} {vehicle.model || ""}</p>
          <p className="text-xs text-on-surface-variant">
            Frame: <span className="font-mono">{vehicle.frame_number}</span>
            {vehicle.color && <> &middot; {vehicle.color}</>}
          </p>
        </div>
      </div>
      {submitError && <div className="mb-6 px-4 py-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm">{submitError}</div>}
      <SectionHeading icon="star" title="Condition" />
      <div className="grid grid-cols-2 gap-4 mb-8">
        {[{ id: "brand_new", label: "Brand New", icon: "new_releases" }, { id: "used", label: "Used", icon: "history" }].map((opt) => (
          <button
            key={opt.id}
            type="button"
            onClick={() => setCondition(opt.id)}
            className={`flex items-center gap-3 p-4 rounded-xl border-2 transition-all text-left ${condition === opt.id ? "bg-primary border-primary text-white shadow-lg shadow-primary/20" : "bg-surface-container-lowest border-outline-variant/20 hover:border-primary/30 hover:shadow-md"}`}
          >
            <span className={`material-symbols-outlined text-2xl ${condition === opt.id ? "text-white" : "text-primary"}`}>{opt.icon}</span>
            <span className="font-bold text-sm">{opt.label}</span>
          </button>
        ))}
      </div>
      <SectionHeading icon="schedule" title="Ownership Duration" />
      <div className="mb-8">
        <input type="text" value={ownershipDuration} onChange={(e) => setOwnershipDuration(e.target.value)} placeholder='e.g. "6 months", "2 years"' className={inputCls} />
      </div>
      <SectionHeading icon="payments" title="Asking Price" />
      <div className="mb-8 relative">
        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant font-bold">₪</span>
        <input type="number" min="0" step="0.01" value={price} onChange={(e) => setPrice(e.target.value)} placeholder="0.00" className={`${inputCls} pl-8`} />
      </div>
      <SectionHeading icon="location_on" title="Location" />
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
        <div>
          <label className="block text-xs font-semibold text-on-surface-variant mb-1.5">City *</label>
          <input type="text" value={city} onChange={(e) => setCity(e.target.value)} placeholder="e.g. Tel Aviv" className={inputCls} />
        </div>
        <div>
          <label className="block text-xs font-semibold text-on-surface-variant mb-1.5">Street Address (optional)</label>
          <input type="text" value={address} onChange={(e) => setAddress(e.target.value)} placeholder="e.g. 12 Rothschild Blvd" className={inputCls} />
        </div>
      </div>
      <SectionHeading icon="photo_camera" title="Photos" />
      <PhotoUploader photos={photos} setPhotos={setPhotos} />
      <SectionHeading icon="description" title="Additional Details" />
      <div className="mb-10">
        <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={4} placeholder="Any modifications, accessories, scratches, or other details a buyer should know..." className={`${inputCls} resize-none`} />
      </div>
      <div className="text-center">
        <button
          type="button"
          onClick={onSubmit}
          disabled={submitLoading}
          className="px-10 py-4 bg-primary text-white rounded-full font-bold text-lg hover:shadow-xl hover:shadow-primary/30 transition-all inline-flex items-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {submitLoading ? "Submitting..." : "Submit Listing"}
          <span className="material-symbols-outlined text-xl">storefront</span>
        </button>
      </div>
    </div>
  );
}
