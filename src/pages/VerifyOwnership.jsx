import { useState } from "react";
import PageHeader from "../components/ui/PageHeader";
import PageFooter from "../components/ui/PageFooter";
import StepProgress from "../components/verify/StepProgress";
import VehicleTypeSelector from "../components/verify/VehicleTypeSelector";
import VehicleDetailsFields from "../components/verify/VehicleDetailsFields";
import { api } from "../utils/api";
import { useAuth } from "../context/AuthContext";

export default function VerifyOwnership() {
  const { user, openLogin } = useAuth();
  const [selectedType, setSelectedType] = useState("Electric Scooter");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [activeStep, setActiveStep] = useState(0);

  const handleSubmit = async () => {
    setError("");
    if (!user) { openLogin(); return; }
    const form = document.getElementById("verify-form");
    const frameNumber = form.querySelector('[name="frame_number"]').value.trim();
    if (!frameNumber) { setError("Frame number is required."); return; }
    if (!/^[A-Za-z0-9]{16,18}$/.test(frameNumber)) {
      setError("Frame number must contain 16–18 letters and numbers only.");
      return;
    }
    setLoading(true);
    try {
      await api("/verify/", {
        method: "POST",
        body: {
          frame_number: frameNumber,
          vehicle_type: selectedType,
          brand: form.querySelector('[name="brand"]').value.trim() || null,
          model: form.querySelector('[name="model"]').value.trim() || null,
          color: form.querySelector('[name="color"]').value.trim() || null,
        },
      });
      setSuccess(true);
    } catch (err) {
      if (err.status === 403 && err.detail?.code === "account_blocked") {
        window.dispatchEvent(new CustomEvent("accountBlocked", { detail: { reason: err.detail.reason } }));
      }
      setError(err.message);
    }
    finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen flex flex-col bg-surface text-on-surface antialiased">
      <PageHeader activePage="verify" />
      <main className="flex-1 w-full max-w-2xl mx-auto px-6 pt-28 pb-12">
        <h1 className="text-3xl font-extrabold tracking-tight mb-2">Verify Ownership</h1>
        <p className="text-on-surface-variant mb-10">Secure your assets by registering them with our precision verification system.</p>
        <StepProgress activeStep={activeStep} />
        {success ? (
          <div className="text-center py-16">
            <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-6">
              <span className="material-symbols-outlined text-green-600 text-4xl">verified_user</span>
            </div>
            <h2 className="text-2xl font-bold mb-2">Ownership Verified</h2>
            <p className="text-on-surface-variant mb-8">Your vehicle ownership has been successfully verified<br />and recorded in our secure registry.</p>
            <button onClick={() => { setSuccess(false); setError(""); }} className="px-8 py-3 bg-primary text-white rounded-xl font-bold hover:shadow-lg hover:shadow-primary/20 transition-all">
              Verify Another Vehicle
            </button>
          </div>
        ) : (
          <div id="verify-form">
            {error && <div className="mb-6 px-4 py-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm">{error}</div>}
            <div onFocus={() => setActiveStep(0)} onClick={() => setActiveStep(0)}>
              <VehicleTypeSelector selectedType={selectedType} onSelect={(type) => { setSelectedType(type); setActiveStep(0); }} />
            </div>
            <div onFocus={() => setActiveStep(1)}>
              <VehicleDetailsFields />
            </div>
            <div className="text-center mb-6">
              <button
                type="button" onClick={handleSubmit} disabled={loading}
                className="px-10 py-4 bg-primary text-white rounded-full font-bold text-lg hover:shadow-xl hover:shadow-primary/30 transition-all inline-flex items-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {loading ? "Submitting..." : "Submit for Verification"}
                <span className="material-symbols-outlined text-xl">verified</span>
              </button>
              <p className="text-xs text-on-surface-variant mt-4 max-w-md mx-auto">
                By submitting, you agree to our verification protocols and data privacy policy. Verification typically takes 24-48 hours.
              </p>
            </div>
          </div>
        )}
      </main>
      <PageFooter />
    </div>
  );
}
