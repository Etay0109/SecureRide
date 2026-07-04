import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { VEHICLE_ICONS } from "../../utils/constants";

export default function ListingCard({ listing }) {
  const navigate = useNavigate();
  const [photoIndex, setPhotoIndex] = useState(0);
  const hasPhotos = listing.photos && listing.photos.length > 0;
  const photoCount = hasPhotos ? listing.photos.length : 0;

  const nextPhoto = (e) => {
    e.stopPropagation();
    e.preventDefault();
    setPhotoIndex((prev) => (prev + 1) % photoCount);
  };

  const prevPhoto = (e) => {
    e.stopPropagation();
    e.preventDefault();
    setPhotoIndex((prev) => (prev - 1 + photoCount) % photoCount);
  };

  return (
    <div
      onClick={() => navigate(`/listing/${listing.id}`)}
      className="bg-surface-container-lowest rounded-xl border border-outline-variant/20 overflow-hidden hover:shadow-lg transition-all group cursor-pointer"
    >
      {/* Photo carousel */}
      <div className="relative h-52 bg-surface-container-high">
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
                  onClick={prevPhoto}
                  className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white/80 backdrop-blur-sm flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-white shadow-sm"
                >
                  <span className="material-symbols-outlined text-on-surface text-lg">
                    chevron_left
                  </span>
                </button>
                <button
                  onClick={nextPhoto}
                  className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white/80 backdrop-blur-sm flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-white shadow-sm"
                >
                  <span className="material-symbols-outlined text-on-surface text-lg">
                    chevron_right
                  </span>
                </button>
                {/* Dots */}
                <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1.5">
                  {listing.photos.map((_, i) => (
                    <button
                      key={i}
                      onClick={(e) => {
                        e.stopPropagation();
                        setPhotoIndex(i);
                      }}
                      className={`w-2 h-2 rounded-full transition-all ${
                        i === photoIndex ? "bg-white w-4" : "bg-white/50"
                      }`}
                    />
                  ))}
                </div>
              </>
            )}
          </>
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center">
            <span className="material-symbols-outlined text-on-surface-variant/40 text-5xl">
              {VEHICLE_ICONS[listing.vehicle_type] || "pedal_bike"}
            </span>
            <p className="text-xs text-on-surface-variant/50 mt-2">No photos</p>
          </div>
        )}
        {/* Condition badge */}
        <div className="absolute top-3 left-3">
          <span
            className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold backdrop-blur-sm ${
              listing.condition === "brand_new"
                ? "bg-green-500/90 text-white"
                : "bg-white/90 text-on-surface"
            }`}
          >
            <span className="material-symbols-outlined text-sm">
              {listing.condition === "brand_new" ? "new_releases" : "history"}
            </span>
            {listing.condition === "brand_new" ? "Brand New" : "Used"}
          </span>
        </div>
        {/* Verified badge */}
        <div className="absolute top-3 right-3">
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold bg-primary/90 text-white backdrop-blur-sm">
            <span className="material-symbols-outlined text-sm">
              verified_user
            </span>
            Verified
          </span>
        </div>
      </div>

      {/* Content */}
      <div className="p-5">
        <div className="flex items-start justify-between mb-3">
          <div>
            <h3 className="font-bold text-on-surface text-lg leading-tight">
              {listing.vehicle_brand || "Unknown"} {listing.vehicle_model || ""}
            </h3>
            <p className="text-xs text-on-surface-variant capitalize mt-0.5">
              {listing.vehicle_type || ""}
              {listing.vehicle_color && <> &middot; {listing.vehicle_color}</>}
            </p>
          </div>
          <div className="text-right flex-shrink-0">
            <p className="text-xl font-black text-primary">
              ₪{listing.price.toLocaleString()}
            </p>
          </div>
        </div>

        {listing.description && (
          <p className="text-sm text-on-surface-variant mb-3 line-clamp-2">
            {listing.description}
          </p>
        )}

        <div className="flex flex-wrap gap-2 mb-4">
          {listing.city && <InfoChip icon="location_on" text={listing.city} />}
          <InfoChip icon="schedule" text={listing.ownership_duration} />
          <InfoChip icon="tag" text={listing.frame_number} mono />
        </div>

        {/* Match score */}
        {listing.score != null && listing.score > 0 && (
          <MatchScoreBar score={listing.score} />
        )}

        {/* Seller info */}
        <div className="flex items-center gap-2 pt-3 border-t border-outline-variant/15">
          <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center">
            <span className="material-symbols-outlined text-primary text-sm">
              person
            </span>
          </div>
          <span className="text-xs text-on-surface-variant">
            Listed by{" "}
            <span className="font-semibold text-on-surface">
              {listing.seller_first_name} {listing.seller_last_name}
            </span>
          </span>
          <span className="text-xs text-on-surface-variant ml-auto">
            {new Date(listing.created_at).toLocaleDateString()}
          </span>
        </div>
      </div>
    </div>
  );
}

function MatchScoreBar({ score }) {
  const pct = Math.round(score * 100);
  const color =
    pct >= 75
      ? "bg-green-500"
      : pct >= 50
        ? "bg-blue-500"
        : pct >= 25
          ? "bg-amber-500"
          : "bg-slate-400";

  return (
    <div className="mb-3">
      <div className="flex items-center justify-between mb-1">
        <span className="text-[11px] font-semibold text-on-surface-variant flex items-center gap-1">
          <span className="material-symbols-outlined text-xs text-primary">
            analytics
          </span>
          Match Score
        </span>
        <span className="text-[11px] font-bold text-on-surface">{pct}%</span>
      </div>
      <div className="w-full h-1.5 rounded-full bg-surface-container-high overflow-hidden">
        <div
          className={`h-full rounded-full transition-all ${color}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

function InfoChip({ icon, text, mono }) {
  return (
    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-surface-container-high text-xs text-on-surface-variant">
      <span className="material-symbols-outlined text-sm">{icon}</span>
      <span className={mono ? "font-mono" : ""}>{text}</span>
    </span>
  );
}
