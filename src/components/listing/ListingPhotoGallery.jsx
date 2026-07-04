import { VEHICLE_ICONS } from "../../utils/constants";

export default function ListingPhotoGallery({ listing, photoIndex, onPhotoChange }) {
  const hasPhotos = listing?.photos?.length > 0;
  const photoCount = hasPhotos ? listing.photos.length : 0;

  return (
    <div className="lg:col-span-3">
      <div className="relative rounded-2xl overflow-hidden bg-surface-container-high mb-3 aspect-[4/3]">
        {hasPhotos ? (
          <>
            <img
              src={listing.photos[photoIndex]}
              alt={`${listing.vehicle_brand} ${listing.vehicle_model}`}
              className="w-full h-full object-cover"
            />
            {photoCount > 1 && (
              <>
                <button
                  onClick={() => onPhotoChange((photoIndex - 1 + photoCount) % photoCount)}
                  className="absolute left-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/80 backdrop-blur-sm flex items-center justify-center hover:bg-white shadow-md transition-all"
                >
                  <span className="material-symbols-outlined text-on-surface">chevron_left</span>
                </button>
                <button
                  onClick={() => onPhotoChange((photoIndex + 1) % photoCount)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/80 backdrop-blur-sm flex items-center justify-center hover:bg-white shadow-md transition-all"
                >
                  <span className="material-symbols-outlined text-on-surface">chevron_right</span>
                </button>
              </>
            )}
            <div className="absolute top-4 left-4">
              <span className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm font-bold backdrop-blur-sm ${listing.condition === "brand_new" ? "bg-green-500/90 text-white" : "bg-white/90 text-on-surface"}`}>
                <span className="material-symbols-outlined text-base">{listing.condition === "brand_new" ? "new_releases" : "history"}</span>
                {listing.condition === "brand_new" ? "Brand New" : "Used"}
              </span>
            </div>
            <div className="absolute top-4 right-4">
              <span className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm font-bold bg-primary/90 text-white backdrop-blur-sm">
                <span className="material-symbols-outlined text-base">verified_user</span>
                Verified Owner
              </span>
            </div>
            <div className="absolute bottom-4 right-4 bg-black/60 text-white text-xs font-bold px-3 py-1.5 rounded-lg backdrop-blur-sm">
              {photoIndex + 1} / {photoCount}
            </div>
          </>
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center">
            <span className="material-symbols-outlined text-on-surface-variant/30 text-7xl">
              {VEHICLE_ICONS[listing?.vehicle_type] || "pedal_bike"}
            </span>
            <p className="text-sm text-on-surface-variant/50 mt-3">No photos available</p>
          </div>
        )}
      </div>
      {hasPhotos && photoCount > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-2">
          {listing.photos.map((src, i) => (
            <button
              key={i}
              onClick={() => onPhotoChange(i)}
              className={`flex-shrink-0 w-20 h-20 rounded-xl overflow-hidden border-2 transition-all ${i === photoIndex ? "border-primary ring-2 ring-primary/30" : "border-transparent opacity-60 hover:opacity-100"}`}
            >
              <img src={src} alt={`Thumbnail ${i + 1}`} className="w-full h-full object-cover" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
