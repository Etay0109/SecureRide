import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import SectionHeading from "../ui/SectionHeading";
import EmptyState from "../ui/EmptyState";
import { api } from "../../utils/api";

const LISTINGS_PER_PAGE = 5;

export default function ActiveListingsSection() {
  const navigate = useNavigate();
  const [listings, setListings] = useState([]);
  const [listingSearch, setListingSearch] = useState("");
  const [listingPage, setListingPage] = useState(1);

  useEffect(() => {
    fetchListings();
  }, []);

  const fetchListings = async () => {
    try {
      setListings(await api("/sell/my-listings"));
    } catch { /* silently fail */ }
  };

  const handleDeleteListing = async (listingId) => {
    if (!confirm("Are you sure you want to delete this listing?")) return;
    try {
      await api(`/sell/listings/${listingId}`, { method: "DELETE" });
      setListings((prev) => prev.filter((l) => l.id !== listingId));
    } catch (err) {
      alert(err.message);
    }
  };

  const filteredListings = listings.filter((l) => {
    if (!listingSearch) return true;
    const q = listingSearch.toLowerCase();
    return (
      l.vehicle_brand?.toLowerCase().includes(q) ||
      l.vehicle_model?.toLowerCase().includes(q) ||
      l.vehicle_type?.toLowerCase().includes(q) ||
      l.city?.toLowerCase().includes(q) ||
      l.price?.toString().includes(q)
    );
  });
  const totalListingPages = Math.max(1, Math.ceil(filteredListings.length / LISTINGS_PER_PAGE));
  const pagedListings = filteredListings.slice((listingPage - 1) * LISTINGS_PER_PAGE, listingPage * LISTINGS_PER_PAGE);

  return (
    <section className="mb-10">
      <SectionHeading icon="sell" title="My Active Listings" />
      {listings.length > 0 && (
        <div className="relative mb-4">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-lg pointer-events-none">search</span>
          <input
            type="text"
            placeholder="Search by brand, model, type, city, price…"
            value={listingSearch}
            onChange={(e) => { setListingSearch(e.target.value); setListingPage(1); }}
            className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-outline-variant/30 bg-surface-container-lowest text-on-surface text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-all"
          />
        </div>
      )}
      {listings.length === 0 ? (
        <EmptyState icon="storefront" title="No active listings" description="Vehicles you list for sale will appear here." actionLabel="List a Vehicle" actionTo="/sell" />
      ) : filteredListings.length === 0 ? (
        <p className="text-sm text-on-surface-variant text-center py-6">No listings match your search.</p>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {pagedListings.map((l) => (
              <div key={l.id} className="bg-surface-container-lowest rounded-xl border border-outline-variant/20 p-5 hover:shadow-md transition-all">
                <div className="flex items-start justify-between gap-2 mb-3">
                  <div className="min-w-0">
                    <p className="font-bold text-on-surface text-sm truncate">{l.vehicle_brand || "Unknown"} {l.vehicle_model || ""}</p>
                    <p className="text-xs text-on-surface-variant capitalize">{l.vehicle_type}</p>
                  </div>
                  <span className="text-primary font-bold text-sm whitespace-nowrap">₪{l.price.toLocaleString()}</span>
                </div>
                <div className="space-y-1.5 text-sm mb-4">
                  {l.city && (
                    <div className="flex justify-between">
                      <span className="text-on-surface-variant">City</span>
                      <span className="font-medium text-on-surface">{l.city}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-on-surface-variant">Listed</span>
                    <span className="font-medium text-on-surface text-xs">{new Date(l.created_at).toLocaleDateString()}</span>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => navigate(`/listing/${l.id}`)}
                    className="flex-1 py-2 rounded-xl border border-primary/30 text-primary text-sm font-semibold hover:bg-primary/5 transition-all flex items-center justify-center gap-1.5"
                  >
                    <span className="material-symbols-outlined text-base">open_in_new</span>View
                  </button>
                  <button
                    onClick={() => handleDeleteListing(l.id)}
                    className="flex-1 py-2 rounded-xl border border-slate-200 text-slate-500 hover:bg-red-50 hover:border-red-200 hover:text-red-600 text-sm font-semibold transition-all flex items-center justify-center gap-1.5"
                  >
                    <span className="material-symbols-outlined text-base">delete</span>Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
          {totalListingPages > 1 && (
            <div className="flex items-center justify-between mt-4">
              <button onClick={() => setListingPage((p) => p - 1)} disabled={listingPage === 1} className="px-4 py-2 rounded-xl border border-outline-variant/30 text-sm font-semibold text-on-surface disabled:opacity-40 hover:bg-surface-container transition-all">Previous</button>
              <span className="text-sm text-on-surface-variant">Page {listingPage} of {totalListingPages}</span>
              <button onClick={() => setListingPage((p) => p + 1)} disabled={listingPage === totalListingPages} className="px-4 py-2 rounded-xl border border-outline-variant/30 text-sm font-semibold text-on-surface disabled:opacity-40 hover:bg-surface-container transition-all">Next</button>
            </div>
          )}
        </>
      )}
    </section>
  );
}
