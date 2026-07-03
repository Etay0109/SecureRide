const VEHICLE_TYPE_OPTIONS = [
  { id: "all", label: "All Types", icon: "apps" },
  { id: "Electric Scooter", label: "Electric Scooter", icon: "electric_scooter" },
  { id: "Bicycle", label: "Bicycle", icon: "pedal_bike" },
  { id: "Electric Bicycle", label: "Electric Bicycle", icon: "electric_moped" },
];

export default function FilterBar({
  searchQuery, setSearchQuery,
  typeFilter, setTypeFilter,
  conditionFilter, setConditionFilter,
  maxPrice, setMaxPrice,
  sortBy, setSortBy,
}) {
  const hasFilters = typeFilter !== "all" || conditionFilter !== "all" || maxPrice || searchQuery;

  return (
    <>
      <div className="relative mb-6">
        <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant text-xl">search</span>
        <input
          type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search by brand, model, or description..."
          className="w-full pl-12 pr-4 py-3.5 rounded-xl border border-outline-variant/30 bg-surface-container-lowest text-on-surface placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-all text-sm"
        />
      </div>
      <div className="bg-surface-container-lowest rounded-xl border border-outline-variant/20 p-5 mb-8">
        <div className="flex flex-wrap items-center gap-3 mb-4">
          <span className="text-sm font-bold text-on-surface flex items-center gap-1.5">
            <span className="material-symbols-outlined text-base text-primary">filter_list</span>
            Vehicle Type
          </span>
          {VEHICLE_TYPE_OPTIONS.map((opt) => (
            <button
              key={opt.id} onClick={() => setTypeFilter(opt.id)}
              className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-sm font-medium transition-all ${typeFilter === opt.id ? "bg-primary text-white shadow-sm" : "bg-surface-container-high text-on-surface-variant hover:bg-primary/10"}`}
            >
              <span className="material-symbols-outlined text-base">{opt.icon}</span>
              {opt.label}
            </button>
          ))}
        </div>
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="text-sm font-bold text-on-surface">Condition</span>
            <select value={conditionFilter} onChange={(e) => setConditionFilter(e.target.value)} className="px-3 py-1.5 rounded-lg border border-outline-variant/30 bg-surface-container-low text-on-surface text-sm focus:outline-none focus:ring-2 focus:ring-primary/40">
              <option value="all">All</option>
              <option value="brand_new">Brand New</option>
              <option value="used">Used</option>
            </select>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm font-bold text-on-surface">Max Price</span>
            <div className="relative">
              <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-on-surface-variant text-sm font-bold">₪</span>
              <input type="number" value={maxPrice} onChange={(e) => setMaxPrice(e.target.value)} placeholder="Any" className="w-28 pl-7 pr-3 py-1.5 rounded-lg border border-outline-variant/30 bg-surface-container-low text-on-surface text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary/40" />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm font-bold text-on-surface">Sort</span>
            <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} className="px-3 py-1.5 rounded-lg border border-outline-variant/30 bg-surface-container-low text-on-surface text-sm focus:outline-none focus:ring-2 focus:ring-primary/40">
              <option value="newest">Newest First</option>
              <option value="price_low">Price: Low to High</option>
              <option value="price_high">Price: High to Low</option>
            </select>
          </div>
          {hasFilters && (
            <button
              onClick={() => { setTypeFilter("all"); setConditionFilter("all"); setMaxPrice(""); setSearchQuery(""); }}
              className="text-sm text-red-500 font-medium hover:underline flex items-center gap-1"
            >
              <span className="material-symbols-outlined text-base">close</span>Clear Filters
            </button>
          )}
        </div>
      </div>
    </>
  );
}
