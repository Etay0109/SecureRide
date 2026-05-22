import { useState, useEffect, useRef } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import LoginModal from "../components/LoginModal";
import RegisterModal from "../components/RegisterModal";
import NotificationBell from "../components/NotificationBell";

const VEHICLE_ICONS = {
  "electric-scooter": "electric_scooter",
  bicycle: "pedal_bike",
  "electric-bicycle": "electric_moped",
};

function getStoredUser() {
  try {
    const raw = localStorage.getItem("user");
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export default function ListingDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [user, setUser] = useState(getStoredUser);
  const [listing, setListing] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showLogin, setShowLogin] = useState(false);
  const [showRegister, setShowRegister] = useState(false);
  const [photoIndex, setPhotoIndex] = useState(0);
  const [editing, setEditing] = useState(false);
  const [editData, setEditData] = useState({});
  const [editPhotos, setEditPhotos] = useState([]);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [trades, setTrades] = useState([]);
  const [buyingLoading, setBuyingLoading] = useState(false);
  const editPhotoRef = useRef(null);

  useEffect(() => {
    fetch(`/api/sell/listings/${id}`)
      .then((res) => {
        if (!res.ok) throw new Error("Listing not found");
        return res.json();
      })
      .then((data) => setListing(data))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [id]);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token || !id) return;
    fetch(`/api/trades/listing/${id}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => (r.ok ? r.json() : []))
      .then((data) => setTrades(data))
      .catch(() => {});
  }, [id, user]);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setUser(null);
  };

  const openLogin = () => {
    setShowRegister(false);
    setShowLogin(true);
  };

  const openRegister = () => {
    setShowLogin(false);
    setShowRegister(true);
  };

  function startEditing() {
    setEditData({
      condition: listing.condition,
      ownership_duration: listing.ownership_duration,
      price: listing.price,
      city: listing.city || "",
      address: listing.address || "",
      description: listing.description || "",
    });
    setEditPhotos([...(listing.photos || [])]);
    setEditing(true);
  }

  function cancelEditing() {
    setEditing(false);
    setEditData({});
    setEditPhotos([]);
  }

  async function handleSaveEdit() {
    setSaving(true);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`/api/sell/listings/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ ...editData, photos: editPhotos }),
      });
      if (!res.ok) {
        const d = await res.json().catch(() => null);
        throw new Error(d?.detail || "Failed to save");
      }
      const updated = await res.json();
      setListing(updated);
      setEditing(false);
    } catch (err) {
      alert(err.message);
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (
      !confirm(
        "Are you sure you want to delete this listing? This cannot be undone.",
      )
    )
      return;
    setDeleting(true);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`/api/sell/listings/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) {
        const d = await res.json().catch(() => null);
        throw new Error(d?.detail || "Failed to delete");
      }
      navigate("/buy", { replace: true });
    } catch (err) {
      alert(err.message);
      setDeleting(false);
    }
  }

  function handleEditPhotoFiles(files) {
    Array.from(files).forEach((file) => {
      if (!file.type.startsWith("image/")) return;
      const reader = new FileReader();
      reader.onload = (e) =>
        setEditPhotos((prev) => [...prev, e.target.result]);
      reader.readAsDataURL(file);
    });
  }

  async function handleBuyNow() {
    if (!user) {
      setShowLogin(true);
      return;
    }
    setBuyingLoading(true);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch("/api/trades/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ listing_id: listing.id }),
      });
      if (!res.ok) {
        const d = await res.json().catch(() => null);
        throw new Error(d?.detail || "Failed to create trade request");
      }
      const newTrade = await res.json();
      setTrades((prev) => [newTrade, ...prev]);
    } catch (err) {
      alert(err.message);
    } finally {
      setBuyingLoading(false);
    }
  }

  async function handleTradeAction(tradeId, action) {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`/api/trades/${tradeId}/${action}`, {
        method: "PUT",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) {
        const d = await res.json().catch(() => null);
        throw new Error(d?.detail || `Failed to ${action}`);
      }
      const updated = await res.json();
      if (updated.status === "completed") {
        navigate("/profile", { replace: true });
        return;
      }
      setTrades((prev) => prev.map((t) => (t.id === updated.id ? updated : t)));
    } catch (err) {
      alert(err.message);
    }
  }

  const myActiveTrade = trades.find(
    (t) =>
      t.buyer_id === user?.id &&
      ["pending_seller", "accepted"].includes(t.status),
  );
  const pendingTradesForSeller = trades.filter(
    (t) => t.seller_id === user?.id && t.status === "pending_seller",
  );
  const acceptedTradeForSeller = trades.find(
    (t) => t.seller_id === user?.id && t.status === "accepted",
  );

  const hasPhotos = listing?.photos?.length > 0;
  const photoCount = hasPhotos ? listing.photos.length : 0;
  const isOwnListing = user && listing && user.id === listing.seller_id;

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
                  className="text-slate-500 hover:text-slate-900 transition-colors tracking-tight"
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
      <main className="flex-1 w-full max-w-5xl mx-auto px-6 pt-28 pb-16">
        {/* Back link */}
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-1 text-sm text-primary font-semibold mb-6 hover:underline"
        >
          <span className="material-symbols-outlined text-base">
            arrow_back
          </span>
          Back to listings
        </button>

        {loading ? (
          <div className="text-center py-16 text-on-surface-variant">
            Loading listing...
          </div>
        ) : error ? (
          <div className="text-center py-16">
            <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
              <span className="material-symbols-outlined text-red-500 text-3xl">
                error
              </span>
            </div>
            <p className="font-bold text-on-surface mb-2">Listing not found</p>
            <p className="text-sm text-on-surface-variant mb-6">
              This listing may have been removed or doesn't exist.
            </p>
            <Link
              to="/buy"
              className="px-6 py-2.5 bg-primary text-white rounded-xl font-bold text-sm hover:shadow-lg hover:shadow-primary/20 transition-all"
            >
              Browse Listings
            </Link>
          </div>
        ) : (
          listing && (
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
              {/* Left: Photos */}
              <div className="lg:col-span-3">
                {/* Main photo */}
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
                            onClick={() =>
                              setPhotoIndex(
                                (prev) => (prev - 1 + photoCount) % photoCount,
                              )
                            }
                            className="absolute left-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/80 backdrop-blur-sm flex items-center justify-center hover:bg-white shadow-md transition-all"
                          >
                            <span className="material-symbols-outlined text-on-surface">
                              chevron_left
                            </span>
                          </button>
                          <button
                            onClick={() =>
                              setPhotoIndex((prev) => (prev + 1) % photoCount)
                            }
                            className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/80 backdrop-blur-sm flex items-center justify-center hover:bg-white shadow-md transition-all"
                          >
                            <span className="material-symbols-outlined text-on-surface">
                              chevron_right
                            </span>
                          </button>
                        </>
                      )}
                      <div className="absolute top-4 left-4">
                        <span
                          className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm font-bold backdrop-blur-sm ${
                            listing.condition === "brand_new"
                              ? "bg-green-500/90 text-white"
                              : "bg-white/90 text-on-surface"
                          }`}
                        >
                          <span className="material-symbols-outlined text-base">
                            {listing.condition === "brand_new"
                              ? "new_releases"
                              : "history"}
                          </span>
                          {listing.condition === "brand_new"
                            ? "Brand New"
                            : "Used"}
                        </span>
                      </div>
                      <div className="absolute top-4 right-4">
                        <span className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm font-bold bg-primary/90 text-white backdrop-blur-sm">
                          <span className="material-symbols-outlined text-base">
                            verified_user
                          </span>
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
                        {VEHICLE_ICONS[listing.vehicle_type] || "pedal_bike"}
                      </span>
                      <p className="text-sm text-on-surface-variant/50 mt-3">
                        No photos available
                      </p>
                    </div>
                  )}
                </div>

                {/* Thumbnails */}
                {hasPhotos && photoCount > 1 && (
                  <div className="flex gap-2 overflow-x-auto pb-2">
                    {listing.photos.map((src, i) => (
                      <button
                        key={i}
                        onClick={() => setPhotoIndex(i)}
                        className={`flex-shrink-0 w-20 h-20 rounded-xl overflow-hidden border-2 transition-all ${
                          i === photoIndex
                            ? "border-primary ring-2 ring-primary/30"
                            : "border-transparent opacity-60 hover:opacity-100"
                        }`}
                      >
                        <img
                          src={src}
                          alt={`Thumbnail ${i + 1}`}
                          className="w-full h-full object-cover"
                        />
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Right: Details & Actions */}
              <div className="lg:col-span-2">
                <div className="sticky top-28">
                  {/* Title & Price */}
                  <h1 className="text-2xl font-extrabold tracking-tight mb-1">
                    {listing.vehicle_brand || "Unknown"}{" "}
                    {listing.vehicle_model || ""}
                  </h1>
                  <p className="text-sm text-on-surface-variant capitalize mb-4">
                    {(listing.vehicle_type || "").replace(/-/g, " ")}
                    {listing.vehicle_color && (
                      <> &middot; {listing.vehicle_color}</>
                    )}
                  </p>
                  {editing ? (
                    <div className="mb-6">
                      <label className="text-xs font-semibold text-on-surface-variant mb-1 block">
                        Price (₪)
                      </label>
                      <input
                        type="number"
                        min="0"
                        value={editData.price}
                        onChange={(e) =>
                          setEditData({
                            ...editData,
                            price: parseFloat(e.target.value) || 0,
                          })
                        }
                        className="w-full px-4 py-3 rounded-xl border border-outline-variant/30 bg-surface-container-low text-2xl font-black text-primary focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-all"
                      />
                    </div>
                  ) : (
                    <div className="text-4xl font-black text-primary mb-6">
                      ₪{listing.price.toLocaleString()}
                    </div>
                  )}

                  {/* Action buttons */}
                  <div className="space-y-3 mb-8">
                    {isOwnListing ? (
                      <div className="space-y-2">
                        <div className="px-4 py-2 rounded-xl bg-primary/5 border border-primary/20 text-primary text-xs text-center font-semibold flex items-center justify-center gap-1.5">
                          <span className="material-symbols-outlined text-sm">
                            storefront
                          </span>
                          Your Listing
                        </div>
                        {!editing ? (
                          <div className="grid grid-cols-2 gap-2">
                            <button
                              onClick={startEditing}
                              className="py-3 bg-primary text-white rounded-xl font-bold text-sm hover:shadow-lg hover:shadow-primary/20 transition-all flex items-center justify-center gap-1.5"
                            >
                              <span className="material-symbols-outlined text-lg">
                                edit
                              </span>
                              Edit
                            </button>
                            <button
                              onClick={handleDelete}
                              disabled={deleting}
                              className="py-3 bg-white text-red-600 border-2 border-red-200 rounded-xl font-bold text-sm hover:bg-red-50 hover:border-red-300 transition-all flex items-center justify-center gap-1.5 disabled:opacity-50"
                            >
                              <span className="material-symbols-outlined text-lg">
                                {deleting ? "hourglass_empty" : "delete"}
                              </span>
                              {deleting ? "Deleting..." : "Delete"}
                            </button>
                          </div>
                        ) : (
                          <div className="grid grid-cols-2 gap-2">
                            <button
                              onClick={handleSaveEdit}
                              disabled={saving}
                              className="py-3 bg-green-600 text-white rounded-xl font-bold text-sm hover:shadow-lg hover:shadow-green-600/20 transition-all flex items-center justify-center gap-1.5 disabled:opacity-50"
                            >
                              <span className="material-symbols-outlined text-lg">
                                {saving ? "hourglass_empty" : "check"}
                              </span>
                              {saving ? "Saving..." : "Save"}
                            </button>
                            <button
                              onClick={cancelEditing}
                              className="py-3 bg-white text-on-surface-variant border-2 border-outline-variant/30 rounded-xl font-bold text-sm hover:bg-surface-container-high transition-all flex items-center justify-center gap-1.5"
                            >
                              <span className="material-symbols-outlined text-lg">
                                close
                              </span>
                              Cancel
                            </button>
                          </div>
                        )}

                        {/* Incoming trade requests for the seller */}
                        {pendingTradesForSeller.length > 0 && (
                          <div className="mt-3 space-y-2">
                            <p className="text-xs font-semibold text-on-surface-variant">
                              Incoming Buy Requests
                            </p>
                            {pendingTradesForSeller.map((t) => (
                              <TradeStatusCard
                                key={t.id}
                                trade={t}
                                role="seller"
                                onAction={handleTradeAction}
                              />
                            ))}
                          </div>
                        )}
                        {acceptedTradeForSeller && (
                          <div className="mt-3 space-y-2">
                            <p className="text-xs font-semibold text-on-surface-variant">
                              Active Trade
                            </p>
                            <TradeStatusCard
                              trade={acceptedTradeForSeller}
                              role="seller"
                              onAction={handleTradeAction}
                            />
                          </div>
                        )}
                      </div>
                    ) : (
                      <>
                        {myActiveTrade ? (
                          <TradeStatusCard
                            trade={myActiveTrade}
                            role="buyer"
                            onAction={handleTradeAction}
                          />
                        ) : (
                          <button
                            onClick={handleBuyNow}
                            disabled={buyingLoading}
                            className="w-full py-4 bg-primary text-white rounded-xl font-bold text-lg hover:shadow-xl hover:shadow-primary/30 transition-all flex items-center justify-center gap-2 disabled:opacity-60"
                          >
                            <span className="material-symbols-outlined text-xl">
                              {buyingLoading
                                ? "hourglass_empty"
                                : "shopping_cart"}
                            </span>
                            {buyingLoading ? "Sending Request..." : "Buy Now"}
                          </button>
                        )}
                        <button
                          onClick={async () => {
                            if (!user) {
                              setShowLogin(true);
                              return;
                            }
                            try {
                              const token = localStorage.getItem("token");
                              const res = await fetch(
                                "/api/chat/conversations",
                                {
                                  method: "POST",
                                  headers: {
                                    "Content-Type": "application/json",
                                    Authorization: `Bearer ${token}`,
                                  },
                                  body: JSON.stringify({
                                    listing_id: listing.id,
                                  }),
                                },
                              );
                              if (!res.ok) {
                                const data = await res.json().catch(() => null);
                                throw new Error(
                                  data?.detail ||
                                    "Failed to start conversation",
                                );
                              }
                              const { id: convId } = await res.json();
                              window.dispatchEvent(
                                new CustomEvent("openChat", {
                                  detail: { conversationId: convId },
                                }),
                              );
                            } catch (err) {
                              alert(err.message);
                            }
                          }}
                          className="w-full py-4 bg-white text-primary border-2 border-primary/20 rounded-xl font-bold text-lg hover:bg-primary/5 hover:border-primary/40 transition-all flex items-center justify-center gap-2"
                        >
                          <span className="material-symbols-outlined text-xl">
                            chat
                          </span>
                          Chat with Seller
                        </button>
                      </>
                    )}
                  </div>

                  {/* Details card */}
                  {editing ? (
                    <div className="bg-surface-container-lowest rounded-xl border border-primary/30 p-5 space-y-4 mb-6">
                      <h3 className="font-bold text-on-surface flex items-center gap-2">
                        <span className="material-symbols-outlined text-primary text-lg">
                          edit
                        </span>
                        Edit Listing Details
                      </h3>
                      <DetailRow
                        label="Brand"
                        value={listing.vehicle_brand || "—"}
                      />
                      <DetailRow
                        label="Model"
                        value={listing.vehicle_model || "—"}
                      />
                      <DetailRow
                        label="Type"
                        value={(listing.vehicle_type || "").replace(/-/g, " ")}
                        capitalize
                      />
                      <DetailRow
                        label="Color"
                        value={listing.vehicle_color || "—"}
                      />
                      <DetailRow
                        label="Frame Number"
                        value={listing.frame_number}
                        mono
                      />
                      <EditField label="Condition">
                        <select
                          value={editData.condition}
                          onChange={(e) =>
                            setEditData({
                              ...editData,
                              condition: e.target.value,
                            })
                          }
                          className="w-full px-3 py-2 rounded-lg border border-outline-variant/30 bg-surface-container-low text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 transition-all"
                        >
                          <option value="brand_new">Brand New</option>
                          <option value="used">Used</option>
                        </select>
                      </EditField>
                      <EditField label="Owned for">
                        <input
                          type="text"
                          value={editData.ownership_duration}
                          onChange={(e) =>
                            setEditData({
                              ...editData,
                              ownership_duration: e.target.value,
                            })
                          }
                          className="w-full px-3 py-2 rounded-lg border border-outline-variant/30 bg-surface-container-low text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 transition-all"
                        />
                      </EditField>
                      <EditField label="City">
                        <input
                          type="text"
                          value={editData.city}
                          onChange={(e) =>
                            setEditData({ ...editData, city: e.target.value })
                          }
                          className="w-full px-3 py-2 rounded-lg border border-outline-variant/30 bg-surface-container-low text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 transition-all"
                        />
                      </EditField>
                      <EditField label="Address">
                        <input
                          type="text"
                          value={editData.address}
                          onChange={(e) =>
                            setEditData({
                              ...editData,
                              address: e.target.value,
                            })
                          }
                          className="w-full px-3 py-2 rounded-lg border border-outline-variant/30 bg-surface-container-low text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 transition-all"
                        />
                      </EditField>
                      <EditField label="Description">
                        <textarea
                          value={editData.description}
                          onChange={(e) =>
                            setEditData({
                              ...editData,
                              description: e.target.value,
                            })
                          }
                          rows={3}
                          className="w-full px-3 py-2 rounded-lg border border-outline-variant/30 bg-surface-container-low text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 transition-all resize-none"
                        />
                      </EditField>

                      {/* Photo editor */}
                      <div>
                        <label className="text-xs font-semibold text-on-surface-variant mb-2 block">
                          Photos
                        </label>
                        <div className="flex flex-wrap gap-2 mb-2">
                          {editPhotos.map((src, i) => (
                            <div
                              key={i}
                              className="relative w-20 h-20 rounded-lg overflow-hidden border border-outline-variant/20 group"
                            >
                              <img
                                src={src}
                                alt=""
                                className="w-full h-full object-cover"
                              />
                              <button
                                onClick={() =>
                                  setEditPhotos((prev) =>
                                    prev.filter((_, idx) => idx !== i),
                                  )
                                }
                                className="absolute inset-0 bg-red-600/70 text-white opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
                              >
                                <span className="material-symbols-outlined text-lg">
                                  close
                                </span>
                              </button>
                            </div>
                          ))}
                          <button
                            onClick={() => editPhotoRef.current?.click()}
                            className="w-20 h-20 rounded-lg border-2 border-dashed border-outline-variant/40 flex items-center justify-center hover:border-primary/50 hover:bg-primary/5 transition-all"
                          >
                            <span className="material-symbols-outlined text-on-surface-variant text-xl">
                              add_photo_alternate
                            </span>
                          </button>
                        </div>
                        <input
                          type="file"
                          ref={editPhotoRef}
                          accept="image/*"
                          multiple
                          className="hidden"
                          onChange={(e) => handleEditPhotoFiles(e.target.files)}
                        />
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="bg-surface-container-lowest rounded-xl border border-outline-variant/20 p-5 space-y-4 mb-6">
                        <h3 className="font-bold text-on-surface flex items-center gap-2">
                          <span className="material-symbols-outlined text-primary text-lg">
                            info
                          </span>
                          Vehicle Details
                        </h3>
                        <DetailRow
                          label="Brand"
                          value={listing.vehicle_brand || "—"}
                        />
                        <DetailRow
                          label="Model"
                          value={listing.vehicle_model || "—"}
                        />
                        <DetailRow
                          label="Type"
                          value={(listing.vehicle_type || "").replace(
                            /-/g,
                            " ",
                          )}
                          capitalize
                        />
                        <DetailRow
                          label="Color"
                          value={listing.vehicle_color || "—"}
                        />
                        <DetailRow
                          label="Frame Number"
                          value={listing.frame_number}
                          mono
                        />
                        <DetailRow
                          label="Condition"
                          value={
                            listing.condition === "brand_new"
                              ? "Brand New"
                              : "Used"
                          }
                        />
                        <DetailRow
                          label="Owned for"
                          value={listing.ownership_duration}
                        />
                        {listing.city && (
                          <DetailRow label="City" value={listing.city} />
                        )}
                        {listing.address && (
                          <DetailRow label="Address" value={listing.address} />
                        )}
                      </div>

                      {listing.description && (
                        <div className="bg-surface-container-lowest rounded-xl border border-outline-variant/20 p-5 mb-6">
                          <h3 className="font-bold text-on-surface flex items-center gap-2 mb-3">
                            <span className="material-symbols-outlined text-primary text-lg">
                              description
                            </span>
                            Description
                          </h3>
                          <p className="text-sm text-on-surface-variant leading-relaxed whitespace-pre-wrap">
                            {listing.description}
                          </p>
                        </div>
                      )}
                    </>
                  )}

                  {/* Seller card */}
                  <div className="bg-surface-container-lowest rounded-xl border border-outline-variant/20 p-5">
                    <h3 className="font-bold text-on-surface flex items-center gap-2 mb-3">
                      <span className="material-symbols-outlined text-primary text-lg">
                        person
                      </span>
                      Seller
                    </h3>
                    <div className="flex items-center gap-3">
                      <div className="w-11 h-11 rounded-full bg-primary/10 flex items-center justify-center">
                        <span className="material-symbols-outlined text-primary text-xl">
                          person
                        </span>
                      </div>
                      <div>
                        <p className="font-bold text-on-surface">
                          {listing.seller_first_name} {listing.seller_last_name}
                        </p>
                        <p className="text-xs text-on-surface-variant">
                          Listed on{" "}
                          {new Date(listing.created_at).toLocaleDateString(
                            "en-US",
                            { year: "numeric", month: "long", day: "numeric" },
                          )}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )
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

function DetailRow({ label, value, mono, capitalize }) {
  return (
    <div className="flex justify-between items-center">
      <span className="text-sm text-on-surface-variant">{label}</span>
      <span
        className={`text-sm font-medium text-on-surface ${mono ? "font-mono text-xs" : ""} ${capitalize ? "capitalize" : ""}`}
      >
        {value}
      </span>
    </div>
  );
}

function EditField({ label, children }) {
  return (
    <div>
      <label className="text-xs font-semibold text-on-surface-variant mb-1 block">
        {label}
      </label>
      {children}
    </div>
  );
}

function TradeStatusCard({ trade, role, onAction }) {
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
    const otherConfirmed = isBuyer
      ? trade.seller_confirmed
      : trade.buyer_confirmed;
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
      </div>
    );
  }

  return null;
}
