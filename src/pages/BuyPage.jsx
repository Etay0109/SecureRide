import { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import PageHeader from "../components/ui/PageHeader";
import PageFooter from "../components/ui/PageFooter";
import ListingCard from "../components/listings/ListingCard";
import FilterBar from "../components/buy/FilterBar";
import { api } from "../utils/api";
import { useAuth } from "../context/AuthContext";
import EmptyState from "../components/ui/EmptyState";

export default function BuyPage() {
  const location = useLocation();
  const { user } = useAuth();
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [recommendations, setRecommendations] = useState([]);
  const [recsLoading, setRecsLoading] = useState(false);
  const [typeFilter, setTypeFilter] = useState("all");
  const [conditionFilter, setConditionFilter] = useState("all");
  const [sortBy, setSortBy] = useState("newest");
  const [maxPrice, setMaxPrice] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    api("/sell/listings")
      .then((data) => setListings(data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!localStorage.getItem("token") || !user) return;
    setRecsLoading(true);
    api("/recommendations/?limit=6")
      .then((data) => setRecommendations(data))
      .catch(() => {})
      .finally(() => setRecsLoading(false));
  }, [user, location.key]);


  const filtered = listings
    .filter((l) => typeFilter === "all" || l.vehicle_type === typeFilter)
    .filter((l) => conditionFilter === "all" || l.condition === conditionFilter)
    .filter((l) => !maxPrice || l.price <= parseFloat(maxPrice))
    .filter((l) => {
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      return (l.vehicle_brand || "").toLowerCase().includes(q) || (l.vehicle_model || "").toLowerCase().includes(q) || (l.city || "").toLowerCase().includes(q) || (l.description || "").toLowerCase().includes(q);
    })
    .sort((a, b) => {
      if (sortBy === "newest") return new Date(b.created_at) - new Date(a.created_at);
      if (sortBy === "price_low") return a.price - b.price;
      if (sortBy === "price_high") return b.price - a.price;
      return 0;
    });

  return (
    <div className="min-h-screen flex flex-col bg-surface text-on-surface antialiased">
      <PageHeader activePage="buy" />
      <main className="flex-1 w-full max-w-screen-xl mx-auto px-6 pt-28 pb-16">
        <div className="mb-8">
          <h1 className="text-3xl font-extrabold tracking-tight mb-2">Browse Vehicles</h1>
          <p className="text-on-surface-variant">Find your next ride from verified owners.</p>
        </div>
        <FilterBar
          searchQuery={searchQuery} setSearchQuery={setSearchQuery}
          typeFilter={typeFilter} setTypeFilter={setTypeFilter}
          conditionFilter={conditionFilter} setConditionFilter={setConditionFilter}
          maxPrice={maxPrice} setMaxPrice={setMaxPrice}
          sortBy={sortBy} setSortBy={setSortBy}
        />
        {user && recommendations.length > 0 && (
          <div className="mb-10">
            <div className="flex items-center gap-2 mb-4">
              <span className="material-symbols-outlined text-primary text-xl">recommend</span>
              <h2 className="text-lg font-extrabold tracking-tight">Recommended for You</h2>
              <span className="text-xs text-on-surface-variant bg-primary/10 px-2 py-0.5 rounded-full font-semibold">Based on your activity</span>
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
        <p className="text-sm text-on-surface-variant mb-6">
          {loading ? "Loading..." : `${filtered.length} listing${filtered.length !== 1 ? "s" : ""} found`}
        </p>
        {loading ? (
          <div className="text-center py-16 text-on-surface-variant">Loading listings...</div>
        ) : filtered.length === 0 ? (
          <EmptyState
            icon="search_off"
            title="No listings found"
            description={listings.length === 0 ? "There are no vehicles for sale yet. Check back soon!" : "Try adjusting your filters to see more results."}
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filtered.map((listing) => <ListingCard key={listing.id} listing={listing} />)}
          </div>
        )}
      </main>
      <PageFooter />
    </div>
  );
}
