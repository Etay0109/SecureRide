import { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import LoginModal from "../components/LoginModal";
import RegisterModal from "../components/RegisterModal";
import NotificationBell from "../components/NotificationBell";

const VEHICLE_ICONS = {
  "Electric Scooter": "electric_scooter",
  "Bicycle": "pedal_bike",
  "Electric Bicycle": "electric_moped",
};

function getStoredUser() {
  try {
    const raw = localStorage.getItem("user");
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export default function SellPage() {
  const navigate = useNavigate();
  const [user, setUser] = useState(getStoredUser);
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showLogin, setShowLogin] = useState(false);
  const [showRegister, setShowRegister] = useState(false);

  const [selectedVehicle, setSelectedVehicle] = useState(null);
  const [condition, setCondition] = useState("used");
  const [ownershipDuration, setOwnershipDuration] = useState("");
  const [price, setPrice] = useState("");
  const [city, setCity] = useState("");
  const [address, setAddress] = useState("");
  const [description, setDescription] = useState("");
  const [photos, setPhotos] = useState([]);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [success, setSuccess] = useState(false);

  const token = localStorage.getItem("token");

  useEffect(() => {
    if (!token) {
      setLoading(false);
      setShowLogin(true);
      return;
    }
    fetchVehicles();
  }, []);

  const fetchVehicles = async () => {
    try {
      const res = await fetch("/api/sell/available-vehicles", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setVehicles(data);
      }
    } catch {
      /* silently fail */
    } finally {
      setLoading(false);
    }
  };

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

  const handleSubmit = async () => {
    setSubmitError("");
    if (!ownershipDuration.trim()) {
      setSubmitError("Please enter how long you've owned this vehicle.");
      return;
    }
    if (!price || parseFloat(price) <= 0) {
      setSubmitError("Please enter a valid price.");
      return;
    }
    if (!city.trim()) {
      setSubmitError("Please enter the city where the vehicle is located.");
      return;
    }

    setSubmitLoading(true);
    try {
      const res = await fetch("/api/sell/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          frame_number: selectedVehicle.frame_number,
          condition,
          ownership_duration: ownershipDuration,
          price: parseFloat(price),
          city: city.trim(),
          address: address.trim() || null,
          description: description.trim() || null,
          photos,
        }),
      });
      if (!res.ok) {
        let message = "Failed to create listing";
        try {
          const data = await res.json();
          message = data.detail || message;
        } catch {}
        throw new Error(message);
      }
      setSuccess(true);
    } catch (err) {
      setSubmitError(err.message);
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleBack = () => {
    setSelectedVehicle(null);
    setCondition("used");
    setOwnershipDuration("");
    setPrice("");
    setCity("");
    setAddress("");
    setDescription("");
    setPhotos([]);
    setSubmitError("");
    setSuccess(false);
  };

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
                  className="text-blue-700 font-bold border-b-2 border-blue-700 pb-1 tracking-tight"
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
      <main className="flex-1 w-full max-w-3xl mx-auto px-6 pt-28 pb-16">
        <h1 className="text-3xl font-extrabold tracking-tight mb-2">
          Sell Your Vehicle
        </h1>
        <p className="text-on-surface-variant mb-10">
          Select a verified vehicle from your collection and create a listing.
        </p>

        {loading ? (
          <div className="text-center py-16 text-on-surface-variant">
            Loading your vehicles...
          </div>
        ) : success ? (
          <SuccessView onBack={handleBack} />
        ) : selectedVehicle ? (
          <ListingForm
            vehicle={selectedVehicle}
            condition={condition}
            setCondition={setCondition}
            ownershipDuration={ownershipDuration}
            setOwnershipDuration={setOwnershipDuration}
            price={price}
            setPrice={setPrice}
            city={city}
            setCity={setCity}
            address={address}
            setAddress={setAddress}
            description={description}
            setDescription={setDescription}
            photos={photos}
            setPhotos={setPhotos}
            submitLoading={submitLoading}
            submitError={submitError}
            onSubmit={handleSubmit}
            onBack={handleBack}
          />
        ) : (
          <VehicleSelection vehicles={vehicles} onSelect={setSelectedVehicle} />
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
            fetchVehicles();
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

function VehicleSelection({ vehicles, onSelect }) {
  if (vehicles.length === 0) {
    return (
      <div className="bg-surface-container-lowest rounded-xl border border-outline-variant/20 p-10 text-center">
        <div className="w-14 h-14 rounded-full bg-surface-container-high flex items-center justify-center mx-auto mb-4">
          <span className="material-symbols-outlined text-on-surface-variant text-2xl">
            directions_bike
          </span>
        </div>
        <p className="font-semibold text-on-surface mb-1">
          No vehicles available to sell
        </p>
        <p className="text-sm text-on-surface-variant mb-4">
          You need to verify ownership of a vehicle before you can sell it.
        </p>
        <Link
          to="/verify"
          className="inline-flex items-center gap-1.5 px-5 py-2.5 bg-primary text-white rounded-xl font-bold text-sm hover:shadow-lg hover:shadow-primary/20 transition-all"
        >
          Verify a Vehicle
          <span className="material-symbols-outlined text-base">
            arrow_forward
          </span>
        </Link>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      {vehicles.map((v) => (
        <div
          key={v.frame_number}
          className="bg-surface-container-lowest rounded-xl border border-outline-variant/20 p-5 hover:shadow-md transition-all"
        >
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <span className="material-symbols-outlined text-primary text-xl">
                {VEHICLE_ICONS[v.vehicle_type] || "pedal_bike"}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-bold text-on-surface text-sm truncate">
                {v.brand || "Unknown"} {v.model || ""}
              </p>
              <p className="text-xs text-on-surface-variant capitalize">
                {v.vehicle_type}
              </p>
            </div>
            <span className="material-symbols-outlined text-green-500 text-xl">
              verified
            </span>
          </div>
          <div className="space-y-1.5 text-sm mb-4">
            <div className="flex justify-between">
              <span className="text-on-surface-variant">Frame #</span>
              <span className="font-medium text-on-surface font-mono text-xs">
                {v.frame_number}
              </span>
            </div>
            {v.color && (
              <div className="flex justify-between">
                <span className="text-on-surface-variant">Color</span>
                <span className="font-medium text-on-surface">{v.color}</span>
              </div>
            )}
          </div>
          <button
            onClick={() => onSelect(v)}
            className="w-full py-2.5 rounded-xl bg-primary text-white font-bold text-sm hover:shadow-lg hover:shadow-primary/20 transition-all flex items-center justify-center gap-1.5"
          >
            <span className="material-symbols-outlined text-base">sell</span>
            Sell this vehicle
          </button>
        </div>
      ))}
    </div>
  );
}

function ListingForm({
  vehicle,
  condition,
  setCondition,
  ownershipDuration,
  setOwnershipDuration,
  price,
  setPrice,
  city,
  setCity,
  address,
  setAddress,
  description,
  setDescription,
  photos,
  setPhotos,
  submitLoading,
  submitError,
  onSubmit,
  onBack,
}) {
  return (
    <div>
      <button
        onClick={onBack}
        className="flex items-center gap-1 text-sm text-primary font-semibold mb-6 hover:underline"
      >
        <span className="material-symbols-outlined text-base">arrow_back</span>
        Back to vehicles
      </button>

      {/* Selected vehicle summary */}
      <div className="bg-primary/5 rounded-xl border border-primary/20 p-4 flex items-center gap-4 mb-8">
        <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
          <span className="material-symbols-outlined text-primary text-2xl">
            {VEHICLE_ICONS[vehicle.vehicle_type] || "pedal_bike"}
          </span>
        </div>
        <div>
          <p className="font-bold text-on-surface">
            {vehicle.brand || "Unknown"} {vehicle.model || ""}
          </p>
          <p className="text-xs text-on-surface-variant">
            Frame: <span className="font-mono">{vehicle.frame_number}</span>
            {vehicle.color && <> &middot; {vehicle.color}</>}
          </p>
        </div>
      </div>

      {submitError && (
        <div className="mb-6 px-4 py-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm">
          {submitError}
        </div>
      )}

      {/* Condition */}
      <SectionHeading icon="star" title="Condition" />
      <div className="grid grid-cols-2 gap-4 mb-8">
        {[
          { id: "brand_new", label: "Brand New", icon: "new_releases" },
          { id: "used", label: "Used", icon: "history" },
        ].map((opt) => (
          <button
            key={opt.id}
            type="button"
            onClick={() => setCondition(opt.id)}
            className={`flex items-center gap-3 p-4 rounded-xl border-2 transition-all text-left ${
              condition === opt.id
                ? "bg-primary border-primary text-white shadow-lg shadow-primary/20"
                : "bg-surface-container-lowest border-outline-variant/20 hover:border-primary/30 hover:shadow-md"
            }`}
          >
            <span
              className={`material-symbols-outlined text-2xl ${condition === opt.id ? "text-white" : "text-primary"}`}
            >
              {opt.icon}
            </span>
            <span className="font-bold text-sm">{opt.label}</span>
          </button>
        ))}
      </div>

      {/* Ownership Duration */}
      <SectionHeading icon="schedule" title="Ownership Duration" />
      <div className="mb-8">
        <input
          type="text"
          value={ownershipDuration}
          onChange={(e) => setOwnershipDuration(e.target.value)}
          placeholder='e.g. "6 months", "2 years"'
          className="w-full px-4 py-3 rounded-xl border border-outline-variant/30 bg-surface-container-low text-on-surface placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-all"
        />
      </div>

      {/* Price */}
      <SectionHeading icon="payments" title="Asking Price" />
      <div className="mb-8 relative">
        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant font-bold">
          ₪
        </span>
        <input
          type="number"
          min="0"
          step="0.01"
          value={price}
          onChange={(e) => setPrice(e.target.value)}
          placeholder="0.00"
          className="w-full pl-8 pr-4 py-3 rounded-xl border border-outline-variant/30 bg-surface-container-low text-on-surface placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-all"
        />
      </div>

      {/* Location */}
      <SectionHeading icon="location_on" title="Location" />
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
        <div>
          <label className="block text-xs font-semibold text-on-surface-variant mb-1.5">
            City *
          </label>
          <input
            type="text"
            value={city}
            onChange={(e) => setCity(e.target.value)}
            placeholder="e.g. Tel Aviv"
            className="w-full px-4 py-3 rounded-xl border border-outline-variant/30 bg-surface-container-low text-on-surface placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-all"
          />
        </div>
        <div>
          <label className="block text-xs font-semibold text-on-surface-variant mb-1.5">
            Street Address (optional)
          </label>
          <input
            type="text"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            placeholder="e.g. 12 Rothschild Blvd"
            className="w-full px-4 py-3 rounded-xl border border-outline-variant/30 bg-surface-container-low text-on-surface placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-all"
          />
        </div>
      </div>

      {/* Photos */}
      <SectionHeading icon="photo_camera" title="Photos" />
      <PhotoUploader photos={photos} setPhotos={setPhotos} />

      {/* Description */}
      <SectionHeading icon="description" title="Additional Details" />
      <div className="mb-10">
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={4}
          placeholder="Any modifications, accessories, scratches, or other details a buyer should know..."
          className="w-full px-4 py-3 rounded-xl border border-outline-variant/30 bg-surface-container-low text-on-surface placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-all resize-none"
        />
      </div>

      {/* Submit */}
      <div className="text-center">
        <button
          type="button"
          onClick={onSubmit}
          disabled={submitLoading}
          className="px-10 py-4 bg-primary text-white rounded-full font-bold text-lg hover:shadow-xl hover:shadow-primary/30 transition-all inline-flex items-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {submitLoading ? "Submitting..." : "Submit Listing"}
          <span className="material-symbols-outlined text-xl">storefront</span>
        </button>
      </div>
    </div>
  );
}

function PhotoUploader({ photos, setPhotos }) {
  const inputRef = useRef(null);

  const handleFiles = (files) => {
    Array.from(files).forEach((file) => {
      if (!file.type.startsWith("image/")) return;
      const reader = new FileReader();
      reader.onload = (e) => {
        setPhotos((prev) => [...prev, e.target.result]);
      };
      reader.readAsDataURL(file);
    });
  };

  const removePhoto = (index) => {
    setPhotos((prev) => prev.filter((_, i) => i !== index));
  };

  return (
    <div className="mb-8">
      {photos.length > 0 && (
        <div className="grid grid-cols-3 gap-3 mb-4">
          {photos.map((src, i) => (
            <div
              key={i}
              className="relative rounded-xl overflow-hidden border border-outline-variant/30 group"
            >
              <img
                src={src}
                alt={`Photo ${i + 1}`}
                className="w-full h-28 object-cover"
              />
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <button
                  type="button"
                  onClick={() => removePhoto(i)}
                  className="p-2 bg-white rounded-full shadow-lg hover:scale-110 transition-transform"
                >
                  <span className="material-symbols-outlined text-red-500 text-xl">
                    delete
                  </span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
      <div
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          e.preventDefault();
          handleFiles(e.dataTransfer.files);
        }}
        className="border-2 border-dashed border-outline-variant/30 rounded-xl flex flex-col items-center justify-center text-center cursor-pointer hover:border-primary/40 hover:bg-primary/[0.02] transition-all py-8 px-4"
      >
        <span className="material-symbols-outlined text-primary/60 text-4xl mb-2">
          add_photo_alternate
        </span>
        <p className="text-sm font-medium text-on-surface-variant">
          Click or drag photos here
        </p>
        <p className="text-xs text-on-surface-variant/70 mt-1">
          PNG, JPG up to 10MB each
        </p>
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={(e) => handleFiles(e.target.files)}
        />
      </div>
    </div>
  );
}

function SuccessView({ onBack }) {
  return (
    <div className="text-center py-16">
      <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-6">
        <span className="material-symbols-outlined text-green-600 text-4xl">
          check_circle
        </span>
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

function SectionHeading({ icon, title }) {
  return (
    <div className="flex items-center gap-3 mb-4">
      <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
        <span className="material-symbols-outlined text-primary text-lg">
          {icon}
        </span>
      </div>
      <h2 className="text-lg font-bold">{title}</h2>
    </div>
  );
}
