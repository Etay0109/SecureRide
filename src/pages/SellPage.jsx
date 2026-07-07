import { useState, useEffect } from "react";
import PageHeader from "../components/ui/PageHeader";
import PageFooter from "../components/ui/PageFooter";
import VehicleSelectionStep from "../components/sell/VehicleSelectionStep";
import ListingFormStep from "../components/sell/ListingFormStep";
import SuccessView from "../components/sell/SuccessView";
import { api } from "../utils/api";
import { useAuth } from "../context/AuthContext";

export default function SellPage() {
  const { user } = useAuth();
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);

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

  const fetchVehicles = async () => {
    try {
      setVehicles(await api("/sell/available-vehicles"));
    } catch { /* silently fail */ }
    finally { setLoading(false); }
  };

  useEffect(() => {
    if (!user) { setLoading(false); return; }
    fetchVehicles();
  }, [user]);

  const handleSubmit = async () => {
    setSubmitError("");
    if (!ownershipDuration.trim()) { setSubmitError("Please enter how long you've owned this vehicle."); return; }
    if (!price || parseFloat(price) <= 0) { setSubmitError("Please enter a valid price."); return; }
    if (!city.trim()) { setSubmitError("Please enter the city where the vehicle is located."); return; }
    setSubmitLoading(true);
    try {
      await api("/sell/", {
        method: "POST",
        body: {
          frame_number: selectedVehicle.frame_number,
          condition,
          ownership_duration: ownershipDuration,
          price: parseFloat(price),
          city: city.trim(),
          address: address.trim() || null,
          description: description.trim() || null,
          photos,
        },
      });
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
      <PageHeader activePage="sell" />
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
    </div>
  );
}
