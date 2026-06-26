import { useState, useEffect, useCallback } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import LoginModal from "../components/LoginModal";
import RegisterModal from "../components/RegisterModal";
import NotificationBell from "../components/NotificationBell";

const VEHICLE_ICONS = {
  "Electric Scooter": "electric_scooter",
  "Bicycle": "pedal_bike",
  "Electric Bicycle": "electric_moped",
};

const VEHICLE_TYPE_OPTIONS = [
  { id: "all", label: "All Types", icon: "apps" },
  {
    id: "Electric Scooter",
    label: "Electric Scooter",
    icon: "electric_scooter",
  },
  { id: "Bicycle", label: "Bicycle", icon: "pedal_bike" },
  { id: "Electric Bicycle", label: "Electric Bicycle", icon: "electric_moped" },
];

function getStoredUser() {
  try {
    const raw = localStorage.getItem("user");
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export default function BuyPage() {
  const location = useLocation();
  const [user, setUser] = useState(getStoredUser);
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showLogin, setShowLogin] = useState(false);
  const [showRegister, setShowRegister] = useState(false);

  const [recommendations, setRecommendations] = useState([]);
  const [recsLoading, setRecsLoading] = useState(false);

  const [typeFilter, setTypeFilter] = useState("all");
  const [conditionFilter, setConditionFilter] = useState("all");
  const [sortBy, setSortBy] = useState("newest");
  const [maxPrice, setMaxPrice] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    fetch("/api/sell/listings")
      .then((res) => res.json())
      .then((data) => setListings(data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token || !user) return;
    setRecsLoading(true);
    fetch("/api/recommendations/?limit=6", {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => (res.ok ? res.json() : []))
      .then((data) => setRecommendations(data))
      .catch(() => {})
      .finally(() => setRecsLoading(false));
  }, [user, location.key]);

  const navigate = useNavigate();
  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setUser(null);
    navigate("/");
  };

  const openLogin = () => {
    setShowRegister(false);
    setShowLogin(true);
  };

  const openRegister = () => {
    setShowLogin(false);
    setShowRegister(true);
  };

  const filtered = listings
    .filter((l) => typeFilter === "all" || l.vehicle_type === typeFilter)
    .filter((l) => conditionFilter === "all" || l.condition === conditionFilter)
    .filter((l) => !maxPrice || l.price <= parseFloat(maxPrice))
    .filter((l) => {
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      return (
        (l.vehicle_brand || "").toLowerCase().includes(q) ||
        (l.vehicle_model || "").toLowerCase().includes(q) ||
        (l.city || "").toLowerCase().includes(q) ||
        (l.description || "").toLowerCase().includes(q)
      );
    })
    .sort((a, b) => {
      if (sortBy === "newest")
        return new Date(b.created_at) - new Date(a.created_at);
      if (sortBy === "price_low") return a.price - b.price;
      if (sortBy === "price_high") return b.price - a.price;
      return 0;
    });

  return (
    <div className="min-h-screen flex flex-col bg-surface text-on-surface antialiased">
      {/* Nav */}
      <nav className="fixed top-0 w-full z-50 bg-white/80 backdrop-blur-lg shadow-[0_20px_40px_rgba(25,28,29,0.05)]">
        <div className="flex justify-between items-center px-8 h-20 max-w-screen-2xl mx-auto">
          <Link
            to="/"
            className="text-2xl font-black tracking-tighter text-slate-900"
          >
            Secure Ride
          </Link>
          <div className="hidden md:flex items-center gap-8">
            <Link
              to="/"
              className="text-slate-500 hover:text-slate-900 transition-colors tracking-tight"
            >
              Home
            </Link>
            {user && (
              <>
                <Link
                  to="/buy"
                  className="text-blue-700 font-bold border-b-2 border-blue-700 pb-1 tracking-tight"
                >
                  Buy
                </Link>
                <Link
                  to="/sell"
                  className="text-slate-500 hover:text-slate-900 transition-colors tracking-tight"
                >
                  Sell
                </Link>
                <Link
                  to="/verify"
                  className="text-slate-500 hover:text-slate-900 transition-colors tracking-tight"
                >
                  Verify Ownership
                </Link>
              </>
            )}
            <Link
              to="/about"
              className="text-slate-500 hover:text-slate-900 transition-colors tracking-tight"
            >
              About Us
            </Link>
            {user?.is_admin && (
              <Link
                to="/admin"
                className="text-red-500 hover:text-red-700 font-semibold transition-colors tracking-tight"
              >
                Admin
              </Link>
            )}
          </div>
          {user ? (
            <div className="flex items-center gap-4">
              <Link to="/profile" className="flex items-center gap-2 group">
                <div
                  className={`w-9 h-9 rounded-full flex items-center justify-center transition-all ${user.blocked ? "bg-red-100 ring-2 ring-red-300" : "bg-primary/10 group-hover:ring-2 group-hover:ring-primary/30"}`}
                >
                  <span
                    className={`material-symbols-outlined text-lg ${user.blocked ? "text-red-600" : "text-primary"}`}
                  >
                    {user.blocked ? "person_off" : "person"}
                  </span>
                </div>
                <span
                  className={`text-sm font-semibold hidden sm:inline transition-colors ${user.blocked ? "text-red-600" : "text-on-surface group-hover:text-primary"}`}
                >
                  {user.first_name} {user.last_name}
                </span>
              </Link>
              <NotificationBell />
              <button
                onClick={handleLogout}
                className="px-4 py-2 text-slate-500 hover:text-red-600 font-medium text-sm transition-all"
              >
                Log Out
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-4">
              <button
                onClick={() => setShowLogin(true)}
                className="px-6 py-2 text-slate-500 hover:text-slate-900 font-medium transition-all"
              >
                Log In
              </button>
              <button
                onClick={openRegister}
                className="px-6 py-2.5 bg-primary text-white rounded-xl font-bold hover:shadow-lg hover:shadow-primary/20 transition-all"
              >
                Sign Up
              </button>
            </div>
          )}
        </div>
      </nav>

      {/* Main */}
      <main className="flex-1 w-full max-w-screen-xl mx-auto px-6 pt-28 pb-16">
        <div className="mb-8">
          <h1 className="text-3xl font-extrabold tracking-tight mb-2">
            Browse Vehicles
          </h1>
          <p className="text-on-surface-variant">
            Find your next ride from verified owners.
          </p>
        </div>

        {/* Search bar */}
        <div className="relative mb-6">
          <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant text-xl">
            search
          </span>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by brand, model, or description..."
            className="w-full pl-12 pr-4 py-3.5 rounded-xl border border-outline-variant/30 bg-surface-container-lowest text-on-surface placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-all text-sm"
          />
        </div>

        {/* Filters */}
        <div className="bg-surface-container-lowest rounded-xl border border-outline-variant/20 p-5 mb-8">
          <div className="flex flex-wrap items-center gap-3 mb-4">
            <span className="text-sm font-bold text-on-surface flex items-center gap-1.5">
              <span className="material-symbols-outlined text-base text-primary">
                filter_list
              </span>
              Vehicle Type
            </span>
            {VEHICLE_TYPE_OPTIONS.map((opt) => (
              <button
                key={opt.id}
                onClick={() => setTypeFilter(opt.id)}
                className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-sm font-medium transition-all ${
                  typeFilter === opt.id
                    ? "bg-primary text-white shadow-sm"
                    : "bg-surface-container-high text-on-surface-variant hover:bg-primary/10"
                }`}
              >
                <span className="material-symbols-outlined text-base">
                  {opt.icon}
                </span>
                {opt.label}
              </button>
            ))}
          </div>

          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold text-on-surface">
                Condition
              </span>
              <select
                value={conditionFilter}
                onChange={(e) => setConditionFilter(e.target.value)}
                className="px-3 py-1.5 rounded-lg border border-outline-variant/30 bg-surface-container-low text-on-surface text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
              >
                <option value="all">All</option>
                <option value="brand_new">Brand New</option>
                <option value="used">Used</option>
              </select>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-sm font-bold text-on-surface">
                Max Price
              </span>
              <div className="relative">
                <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-on-surface-variant text-sm font-bold">
                  ₪
                </span>
                <input
                  type="number"
                  value={maxPrice}
                  onChange={(e) => setMaxPrice(e.target.value)}
                  placeholder="Any"
                  className="w-28 pl-7 pr-3 py-1.5 rounded-lg border border-outline-variant/30 bg-surface-container-low text-on-surface text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary/40"
                />
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-sm font-bold text-on-surface">Sort</span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="px-3 py-1.5 rounded-lg border border-outline-variant/30 bg-surface-container-low text-on-surface text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
              >
                <option value="newest">Newest First</option>
                <option value="price_low">Price: Low to High</option>
                <option value="price_high">Price: High to Low</option>
              </select>
            </div>

            {(typeFilter !== "all" ||
              conditionFilter !== "all" ||
              maxPrice ||
              searchQuery) && (
              <button
                onClick={() => {
                  setTypeFilter("all");
                  setConditionFilter("all");
                  setMaxPrice("");
                  setSearchQuery("");
                }}
                className="text-sm text-red-500 font-medium hover:underline flex items-center gap-1"
              >
                <span className="material-symbols-outlined text-base">
                  close
                </span>
                Clear Filters
              </button>
            )}
          </div>
        </div>

        {/* Recommended for You */}
        {user && recommendations.length > 0 && (
          <div className="mb-10">
            <div className="flex items-center gap-2 mb-4">
              <span className="material-symbols-outlined text-primary text-xl">
                recommend
              </span>
              <h2 className="text-lg font-extrabold tracking-tight">
                Recommended for You
              </h2>
              <span className="text-xs text-on-surface-variant bg-primary/10 px-2 py-0.5 rounded-full font-semibold">
                Based on your activity
              </span>
            </div>
            {recsLoading ? (
              <div className="text-sm text-on-surface-variant">Loading recommendations...</div>
            ) : (
              <div className="flex gap-4 overflow-x-auto pb-3 -mx-1 px-1 snap-x">
                {recommendations.map((listing) => (
                  <div key={listing.id} className="flex-shrink-0 w-72 snap-start">
                    <ListingCard listing={listing} />
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Results count */}
        <p className="text-sm text-on-surface-variant mb-6">
          {loading
            ? "Loading..."
            : `${filtered.length} listing${filtered.length !== 1 ? "s" : ""} found`}
        </p>

        {/* Listings grid */}
        {loading ? (
          <div className="text-center py-16 text-on-surface-variant">
            Loading listings...
          </div>
        ) : filtered.length === 0 ? (
          <div className="bg-surface-container-lowest rounded-xl border border-outline-variant/20 p-10 text-center">
            <div className="w-14 h-14 rounded-full bg-surface-container-high flex items-center justify-center mx-auto mb-4">
              <span className="material-symbols-outlined text-on-surface-variant text-2xl">
                search_off
              </span>
            </div>
            <p className="font-semibold text-on-surface mb-1">
              No listings found
            </p>
            <p className="text-sm text-on-surface-variant">
              {listings.length === 0
                ? "There are no vehicles for sale yet. Check back soon!"
                : "Try adjusting your filters to see more results."}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filtered.map((listing) => (
              <ListingCard key={listing.id} listing={listing} />
            ))}
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="bg-surface-container-lowest border-t border-outline-variant/20 py-6 px-8">
        <div className="max-w-screen-2xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-on-surface-variant">
          <div className="font-black text-on-surface tracking-tighter">
            Secure Ride
          </div>
          <p>&copy; 2026 Secure Ride. Precision Ownership Verification.</p>
          <div className="flex gap-6">
            <a href="#" className="hover:text-primary transition-colors">
              Privacy Policy
            </a>
            <a href="#" className="hover:text-primary transition-colors">
              Terms of Service
            </a>
            <a href="#" className="hover:text-primary transition-colors">
              Contact Support
            </a>
          </div>
        </div>
      </footer>

      {showLogin && (
        <LoginModal
          onClose={() => setShowLogin(false)}
          onSwitchToRegister={openRegister}
          onLoginSuccess={(userData) => {
            setShowLogin(false);
            setUser(userData);
          }}
        />
      )}
      {showRegister && (
        <RegisterModal
          onClose={() => setShowRegister(false)}
          onSwitchToLogin={openLogin}
          onRegisterSuccess={(userData) => { setShowRegister(false); setUser(userData); }}
        />
      )}
    </div>
  );
}

function ListingCard({ listing }) {
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
