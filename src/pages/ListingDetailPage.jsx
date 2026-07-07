import { useState, useEffect } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import PageHeader from "../components/ui/PageHeader";
import PageFooter from "../components/ui/PageFooter";
import ListingPhotoGallery from "../components/listing/ListingPhotoGallery";
import ListingDetailActions from "../components/listing/ListingDetailActions";
import ListingEditForm from "../components/listing/ListingEditForm";
import { api } from "../utils/api";
import { useAuth } from "../context/AuthContext";
import { MAX_PHOTOS, TRADE_STATUS, ACTIVE_TRADE_STATUSES } from "../utils/constants";
import { readImageAsDataUrl } from "../utils/readImageFile";

export default function ListingDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, openLogin } = useAuth();
  const [listing, setListing] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [photoIndex, setPhotoIndex] = useState(0);
  const [editing, setEditing] = useState(false);
  const [editData, setEditData] = useState({});
  const [editPhotos, setEditPhotos] = useState([]);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [trades, setTrades] = useState([]);
  const [buyingLoading, setBuyingLoading] = useState(false);

  useEffect(() => {
    api(`/sell/listings/${id}`)
      .then((data) => setListing(data))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [id]);

  useEffect(() => {
    if (!localStorage.getItem("token") || !id) return;
    api(`/trades/listing/${id}`)
      .then((data) => setTrades(data))
      .catch(() => {});
  }, [id, user]);

  useEffect(() => {
    if (!localStorage.getItem("token") || !id) return;
    api("/recommendations/track", {
      method: "POST",
      body: { listing_id: id, action_type: "view" },
    }).catch(() => {});
  }, [id]);

  function startEditing() {
    setEditData({ condition: listing.condition, ownership_duration: listing.ownership_duration, price: listing.price, city: listing.city || "", address: listing.address || "", description: listing.description || "" });
    setEditPhotos([...(listing.photos || [])]);
    setEditing(true);
  }

  function cancelEditing() { setEditing(false); setEditData({}); setEditPhotos([]); }

  async function handleSaveEdit() {
    setSaving(true);
    try {
      setListing(await api(`/sell/listings/${id}`, { method: "PUT", body: { ...editData, photos: editPhotos } }));
      setEditing(false);
    } catch (err) { alert(err.message); }
    finally { setSaving(false); }
  }

  async function handleDelete() {
    if (!confirm("Are you sure you want to delete this listing? This cannot be undone.")) return;
    setDeleting(true);
    try {
      await api(`/sell/listings/${id}`, { method: "DELETE" });
      navigate("/buy", { replace: true });
    } catch (err) { alert(err.message); setDeleting(false); }
  }

  function handleEditPhotoFiles(files) {
    Array.from(files).forEach(async (file) => {
      try {
        const dataUrl = await readImageAsDataUrl(file);
        setEditPhotos((prev) => (prev.length >= MAX_PHOTOS ? prev : [...prev, dataUrl]));
      } catch {
        // Skip files that fail validation (wrong type or too large).
      }
    });
  }

  async function handleBuyNow() {
    if (!user) { openLogin(); return; }
    setBuyingLoading(true);
    try {
      const newTrade = await api("/trades/", { method: "POST", body: { listing_id: listing.id } });
      setTrades((prev) => [newTrade, ...prev]);
    } catch (err) { alert(err.message); }
    finally { setBuyingLoading(false); }
  }

  async function handleTradeAction(tradeId, action) {
    try {
      const updated = await api(`/trades/${tradeId}/${action}`, { method: "PUT" });
      if (updated.status === TRADE_STATUS.COMPLETED) { navigate("/profile", { replace: true }); return; }
      setTrades((prev) => prev.map((t) => (t.id === updated.id ? updated : t)));
    } catch (err) { alert(err.message); }
  }

  async function handleOpenChat() {
    if (!user) { openLogin(); return; }
    try {
      const { id: convId } = await api("/chat/conversations", { method: "POST", body: { listing_id: listing.id } });
      window.dispatchEvent(new CustomEvent("openChat", { detail: { conversationId: convId } }));
    } catch (err) { alert(err.message); }
  }

  const myActiveTrade = trades.find((t) => t.buyer_id === user?.id && ACTIVE_TRADE_STATUSES.includes(t.status));
  const pendingTradesForSeller = trades.filter((t) => t.seller_id === user?.id && t.status === TRADE_STATUS.PENDING_SELLER);
  const acceptedTradeForSeller = trades.find((t) => t.seller_id === user?.id && t.status === TRADE_STATUS.ACCEPTED);
  const isOwnListing = user && listing && user.id === listing.seller_id;

  return (
    <div className="min-h-screen flex flex-col bg-surface text-on-surface antialiased">
      <PageHeader />
      <main className="flex-1 w-full max-w-5xl mx-auto px-6 pt-28 pb-16">
        <button onClick={() => navigate(-1)} className="flex items-center gap-1 text-sm text-primary font-semibold mb-6 hover:underline">
          <span className="material-symbols-outlined text-base">arrow_back</span>Back to listings
        </button>
        {loading ? (
          <div className="text-center py-16 text-on-surface-variant">Loading listing...</div>
        ) : error ? (
          <div className="text-center py-16">
            <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
              <span className="material-symbols-outlined text-red-500 text-3xl">error</span>
            </div>
            <p className="font-bold text-on-surface mb-2">Listing not found</p>
            <p className="text-sm text-on-surface-variant mb-6">This listing may have been removed or doesn&apos;t exist.</p>
            <Link to="/buy" className="px-6 py-2.5 bg-primary text-white rounded-xl font-bold text-sm hover:shadow-lg hover:shadow-primary/20 transition-all">Browse Listings</Link>
          </div>
        ) : (
          listing && (
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
              <ListingPhotoGallery listing={listing} photoIndex={photoIndex} onPhotoChange={setPhotoIndex} />
              <div className="lg:col-span-2">
                <div className="sticky top-28">
                  <h1 className="text-2xl font-extrabold tracking-tight mb-1">{listing.vehicle_brand || "Unknown"} {listing.vehicle_model || ""}</h1>
                  <p className="text-sm text-on-surface-variant capitalize mb-4">{listing.vehicle_type || ""}{listing.vehicle_color && <> &middot; {listing.vehicle_color}</>}</p>
                  {editing ? (
                    <div className="mb-6">
                      <label className="text-xs font-semibold text-on-surface-variant mb-1 block">Price (₪)</label>
                      <input
                        type="number" min="0" value={editData.price}
                        onChange={(e) => setEditData({ ...editData, price: parseFloat(e.target.value) || 0 })}
                        className="w-full px-4 py-3 rounded-xl border border-outline-variant/30 bg-surface-container-low text-2xl font-black text-primary focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-all"
                      />
                    </div>
                  ) : (
                    <div className="text-4xl font-black text-primary mb-6">₪{listing.price.toLocaleString()}</div>
                  )}
                  <ListingDetailActions
                    isOwnListing={isOwnListing} editing={editing}
                    deleting={deleting} saving={saving} buyingLoading={buyingLoading}
                    myActiveTrade={myActiveTrade} pendingTradesForSeller={pendingTradesForSeller}
                    acceptedTradeForSeller={acceptedTradeForSeller}
                    onStartEditing={startEditing} onCancelEditing={cancelEditing}
                    onSaveEdit={handleSaveEdit} onDelete={handleDelete}
                    onBuyNow={handleBuyNow} onTradeAction={handleTradeAction}
                    onOpenChat={handleOpenChat}
                  />
                  <ListingEditForm
                    listing={listing} editing={editing} editData={editData} setEditData={setEditData}
                    editPhotos={editPhotos} setEditPhotos={setEditPhotos} onPhotoFiles={handleEditPhotoFiles}
                  />
                  <div className="bg-surface-container-lowest rounded-xl border border-outline-variant/20 p-5">
                    <h3 className="font-bold text-on-surface flex items-center gap-2 mb-3">
                      <span className="material-symbols-outlined text-primary text-lg">person</span>Seller
                    </h3>
                    <div className="flex items-center gap-3">
                      <div className="w-11 h-11 rounded-full bg-primary/10 flex items-center justify-center">
                        <span className="material-symbols-outlined text-primary text-xl">person</span>
                      </div>
                      <div>
                        <p className="font-bold text-on-surface">{listing.seller_first_name} {listing.seller_last_name}</p>
                        <p className="text-xs text-on-surface-variant">Listed on {new Date(listing.created_at).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )
        )}
      </main>
      <PageFooter />
    </div>
  );
}
