import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import LoginModal from "../components/LoginModal";
import RegisterModal from "../components/RegisterModal";
import PageHeader from "../components/ui/PageHeader";
import PageFooter from "../components/ui/PageFooter";
import { getStoredUser } from "../utils/auth";
import VehicleSelectionStep from "../components/sell/VehicleSelectionStep";
import ListingFormStep from "../components/sell/ListingFormStep";
import SuccessView from "../components/sell/SuccessView";

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
    if (!token) { setLoading(false); setShowLogin(true); return; }
    fetchVehicles();
  }, []);

  const fetchVehicles = async () => {
    try {
      const res = await fetch("/api/sell/available-vehicles", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) setVehicles(await res.json());
    } catch { /* silently fail */ }
    finally { setLoading(false); }
  };

  const handleLogout = () => { localStorage.removeItem("token"); localStorage.removeItem("user"); setUser(null); navigate("/"); };
  const openLogin = () => { setShowRegister(false); setShowLogin(true); };
  const openRegister = () => { setShowLogin(false); setShowRegister(true); };

  const handleSubmit = async () => {
    setSubmitError("");
    if (!ownershipDuration.trim()) { setSubmitError("Please enter how long you've owned this vehicle."); return; }
    if (!price || parseFloat(price) <= 0) { setSubmitError("Please enter a valid price."); return; }
    if (!city.trim()) { setSubmitError("Please enter the city where the vehicle is located."); return; }
    setSubmitLoading(true);
    try {
      const res = await fetch("/api/sell/", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
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
        try { const data = await res.json(); message = data.detail || message; } catch {}
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
      <PageHeader
        user={user}
        onLogout={handleLogout}
        onOpenLogin={openLogin}
        onOpenRegister={openRegister}
        activePage="sell"
      />
      <main className="flex-1 w-full max-w-3xl mx-auto px-6 pt-28 pb-16">
        <h1 className="text-3xl font-extrabold tracking-tight mb-2">Sell Your Vehicle</h1>
        <p className="text-on-surface-variant mb-10">Select a verified vehicle from your collection and create a listing.</p>
        {loading ? (
          <div className="text-center py-16 text-on-surface-variant">Loading your vehicles...</div>
        ) : success ? (
          <SuccessView onBack={handleBack} />
        ) : selectedVehicle ? (
          <ListingFormStep
            vehicle={selectedVehicle}
            condition={condition} setCondition={setCondition}
            ownershipDuration={ownershipDuration} setOwnershipDuration={setOwnershipDuration}
            price={price} setPrice={setPrice}
            city={city} setCity={setCity}
            address={address} setAddress={setAddress}
            description={description} setDescription={setDescription}
            photos={photos} setPhotos={setPhotos}
            submitLoading={submitLoading} submitError={submitError}
            onSubmit={handleSubmit} onBack={handleBack}
          />
        ) : (
          <VehicleSelectionStep vehicles={vehicles} onSelect={setSelectedVehicle} />
        )}
      </main>
      <PageFooter />
      {showLogin && (
        <LoginModal
          onClose={() => setShowLogin(false)}
          onSwitchToRegister={openRegister}
          onLoginSuccess={(userData) => { setShowLogin(false); setUser(userData); fetchVehicles(); }}
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
