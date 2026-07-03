import { Link } from "react-router-dom";

export default function SuccessView({ onBack }) {
  return (
    <div className="text-center py-16">
      <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-6">
        <span className="material-symbols-outlined text-green-600 text-4xl">check_circle</span>
      </div>
      <h2 className="text-2xl font-bold mb-2">Listing Created</h2>
      <p className="text-on-surface-variant mb-8">
        Your vehicle has been listed for sale.
        <br />
        Potential buyers can now see your listing.
      </p>
      <div className="flex flex-col sm:flex-row gap-4 justify-center">
        <button
          onClick={onBack}
          className="px-8 py-3 bg-primary text-white rounded-xl font-bold hover:shadow-lg hover:shadow-primary/20 transition-all"
        >
          Sell Another Vehicle
        </button>
        <Link
          to="/profile"
          className="px-8 py-3 bg-white text-primary border border-primary/20 rounded-xl font-bold hover:bg-primary/5 transition-all"
        >
          Go to Profile
        </Link>
      </div>
    </div>
  );
}
