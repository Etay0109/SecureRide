import { useRef } from "react";

function DetailRow({ label, value, mono, capitalize }) {
  return (
    <div className="flex justify-between items-center">
      <span className="text-sm text-on-surface-variant">{label}</span>
      <span className={`text-sm font-medium text-on-surface ${mono ? "font-mono text-xs" : ""} ${capitalize ? "capitalize" : ""}`}>
        {value}
      </span>
    </div>
  );
}

function EditField({ label, children }) {
  return (
    <div>
      <label className="text-xs font-semibold text-on-surface-variant mb-1 block">{label}</label>
      {children}
    </div>
  );
}

const inputCls = "w-full px-3 py-2 rounded-lg border border-outline-variant/30 bg-surface-container-low text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 transition-all";

export default function ListingEditForm({ listing, editing, editData, setEditData, editPhotos, setEditPhotos, onPhotoFiles }) {
  const editPhotoRef = useRef(null);

  if (editing) {
    return (
      <div className="bg-surface-container-lowest rounded-xl border border-primary/30 p-5 space-y-4 mb-6">
        <h3 className="font-bold text-on-surface flex items-center gap-2">
          <span className="material-symbols-outlined text-primary text-lg">edit</span>
          Edit Listing Details
        </h3>
        <DetailRow label="Brand" value={listing.vehicle_brand || "—"} />
        <DetailRow label="Model" value={listing.vehicle_model || "—"} />
        <DetailRow label="Type" value={listing.vehicle_type || ""} capitalize />
        <DetailRow label="Color" value={listing.vehicle_color || "—"} />
        <DetailRow label="Frame Number" value={listing.frame_number} mono />
        <EditField label="Condition">
          <select value={editData.condition} onChange={(e) => setEditData({ ...editData, condition: e.target.value })} className={inputCls}>
            <option value="brand_new">Brand New</option>
            <option value="used">Used</option>
          </select>
        </EditField>
        <EditField label="Owned for">
          <input type="text" value={editData.ownership_duration} onChange={(e) => setEditData({ ...editData, ownership_duration: e.target.value })} className={inputCls} />
        </EditField>
        <EditField label="City">
          <input type="text" value={editData.city} onChange={(e) => setEditData({ ...editData, city: e.target.value })} className={inputCls} />
        </EditField>
        <EditField label="Address">
          <input type="text" value={editData.address} onChange={(e) => setEditData({ ...editData, address: e.target.value })} className={inputCls} />
        </EditField>
        <EditField label="Description">
          <textarea value={editData.description} onChange={(e) => setEditData({ ...editData, description: e.target.value })} rows={3} className={`${inputCls} resize-none`} />
        </EditField>
        <div>
          <label className="text-xs font-semibold text-on-surface-variant mb-2 block">Photos</label>
          <div className="flex flex-wrap gap-2 mb-2">
            {editPhotos.map((src, i) => (
              <div key={i} className="relative w-20 h-20 rounded-lg overflow-hidden border border-outline-variant/20 group">
                <img src={src} alt="" className="w-full h-full object-cover" />
                <button
                  onClick={() => setEditPhotos((prev) => prev.filter((_, idx) => idx !== i))}
                  className="absolute inset-0 bg-red-600/70 text-white opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
                >
                  <span className="material-symbols-outlined text-lg">close</span>
                </button>
              </div>
            ))}
            <button
              onClick={() => editPhotoRef.current?.click()}
              className="w-20 h-20 rounded-lg border-2 border-dashed border-outline-variant/40 flex items-center justify-center hover:border-primary/50 hover:bg-primary/5 transition-all"
            >
              <span className="material-symbols-outlined text-on-surface-variant text-xl">add_photo_alternate</span>
            </button>
          </div>
          <input type="file" ref={editPhotoRef} accept="image/*" multiple className="hidden" onChange={(e) => onPhotoFiles(e.target.files)} />
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="bg-surface-container-lowest rounded-xl border border-outline-variant/20 p-5 space-y-4 mb-6">
        <h3 className="font-bold text-on-surface flex items-center gap-2">
          <span className="material-symbols-outlined text-primary text-lg">info</span>
          Vehicle Details
        </h3>
        <DetailRow label="Brand" value={listing.vehicle_brand || "—"} />
        <DetailRow label="Model" value={listing.vehicle_model || "—"} />
        <DetailRow label="Type" value={(listing.vehicle_type || "").replace(/-/g, " ")} capitalize />
        <DetailRow label="Color" value={listing.vehicle_color || "—"} />
        <DetailRow label="Frame Number" value={listing.frame_number} mono />
        <DetailRow label="Condition" value={listing.condition === "brand_new" ? "Brand New" : "Used"} />
        <DetailRow label="Owned for" value={listing.ownership_duration} />
        {listing.city && <DetailRow label="City" value={listing.city} />}
        {listing.address && <DetailRow label="Address" value={listing.address} />}
      </div>
      {listing.description && (
        <div className="bg-surface-container-lowest rounded-xl border border-outline-variant/20 p-5 mb-6">
          <h3 className="font-bold text-on-surface flex items-center gap-2 mb-3">
            <span className="material-symbols-outlined text-primary text-lg">description</span>
            Description
          </h3>
          <p className="text-sm text-on-surface-variant leading-relaxed whitespace-pre-wrap">{listing.description}</p>
        </div>
      )}
    </>
  );
}
