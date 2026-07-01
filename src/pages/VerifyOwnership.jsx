import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import LoginModal from "../components/LoginModal";
import RegisterModal from "../components/RegisterModal";
import NotificationBell from "../components/NotificationBell";
import { getStoredUser } from "../utils/auth";

const VEHICLE_TYPES = [
  {
    id: "Electric Scooter",
    label: "Electric Scooter",
    icon: "electric_scooter",
  },
  { id: "Bicycle", label: "Bicycle", icon: "pedal_bike" },
  { id: "Electric Bicycle", label: "Electric Bicycle", icon: "electric_moped" },
];

const STEPS = ["VEHICLE TYPE", "DETAILS"];

export default function VerifyOwnership() {
  const [selectedType, setSelectedType] = useState("Electric Scooter");
  const [showLogin, setShowLogin] = useState(false);
  const [showRegister, setShowRegister] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [user, setUser] = useState(getStoredUser);
  const [activeStep, setActiveStep] = useState(0);
  const navigate = useNavigate();

  const openLogin = () => {
    setShowRegister(false);
    setShowLogin(true);
  };

  const openRegister = () => {
    setShowLogin(false);
    setShowRegister(true);
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setUser(null);
    navigate("/");
  };

  const handleSubmit = async () => {
    setError("");

    const token = localStorage.getItem("token");
    if (!token) {
      setError("You must be logged in to verify ownership.");
      setShowLogin(true);
      return;
    }

    const form = document.getElementById("verify-form");
    const frameNumber = form
      .querySelector('[name="frame_number"]')
      .value.trim();

    if (!frameNumber) {
      setError("Frame number is required.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/verify/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          frame_number: frameNumber,
          vehicle_type: selectedType,
          brand: form.querySelector('[name="brand"]').value.trim() || null,
          model: form.querySelector('[name="model"]').value.trim() || null,
          color: form.querySelector('[name="color"]').value.trim() || null,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        if (res.status === 403 && data.detail?.startsWith("BLOCKED")) {
          window.dispatchEvent(
            new CustomEvent("accountBlocked", {
              detail: { reason: data.detail },
            }),
          );
          throw new Error(data.detail);
        }
        throw new Error(data.detail || "Verification submission failed");
      }

      setSuccess(true);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-surface text-on-surface antialiased">
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
                  className="text-blue-700 font-bold border-b-2 border-blue-700 pb-1 tracking-tight"
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

      <main className="flex-1 w-full max-w-2xl mx-auto px-6 pt-28 pb-12">
        <h1 className="text-3xl font-extrabold tracking-tight mb-2">
          Verify Ownership
        </h1>
        <p className="text-on-surface-variant mb-10">
          Secure your assets by registering them with our precision verification
          system.
        </p>

        <div className="flex items-center justify-between mb-14">
          {STEPS.map((step, i) => {
            const reached = i <= activeStep;
            return (
              <div
                key={step}
                className="flex items-center flex-1 last:flex-none"
              >
                <div className="flex flex-col items-center gap-2">
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-colors duration-300 ${
                      reached
                        ? "bg-primary text-white"
                        : "bg-surface-container-high text-on-surface-variant"
                    }`}
                  >
                    {i + 1}
                  </div>
                  <span
                    className={`text-[11px] font-bold tracking-wider transition-colors duration-300 ${
                      reached ? "text-primary" : "text-on-surface-variant"
                    }`}
                  >
                    {step}
                  </span>
                </div>
                {i < STEPS.length - 1 && (
                  <div className="flex-1 h-[2px] mx-3 mt-[-20px] overflow-hidden bg-surface-container-high">
                    <div
                      className={`h-full bg-primary transition-all duration-500 ${
                        i < activeStep ? "w-full" : "w-0"
                      }`}
                    />
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {success ? (
          <div className="text-center py-16">
            <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-6">
              <span className="material-symbols-outlined text-green-600 text-4xl">
                verified_user
              </span>
            </div>
            <h2 className="text-2xl font-bold mb-2">Ownership Verified</h2>
            <p className="text-on-surface-variant mb-8">
              Your vehicle ownership has been successfully verified
              <br />
              and recorded in our secure registry.
            </p>
            <button
              onClick={() => {
                setSuccess(false);
                setError("");
              }}
              className="px-8 py-3 bg-primary text-white rounded-xl font-bold hover:shadow-lg hover:shadow-primary/20 transition-all"
            >
              Verify Another Vehicle
            </button>
          </div>
        ) : (
          <div id="verify-form">
            {error && (
              <div className="mb-6 px-4 py-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm">
                {error}
              </div>
            )}

            {/* 1. Vehicle Type Selection */}
            <div
              onFocus={() => setActiveStep(0)}
              onClick={() => setActiveStep(0)}
            >
              <SectionHeading
                icon="bolt"
                number={1}
                title="Vehicle Type Selection"
              />
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-10">
                {VEHICLE_TYPES.map((type) => {
                  const active = selectedType === type.id;
                  return (
                    <button
                      key={type.id}
                      type="button"
                      onClick={() => {
                        setSelectedType(type.id);
                        setActiveStep(0);
                      }}
                      className={`flex flex-col items-start gap-3 p-5 rounded-xl border-2 transition-all text-left ${
                        active
                          ? "bg-primary border-primary text-white shadow-lg shadow-primary/20"
                          : "bg-surface-container-lowest border-outline-variant/20 hover:border-primary/30 hover:shadow-md"
                      }`}
                    >
                      <span
                        className={`material-symbols-outlined text-3xl ${
                          active ? "text-white" : "text-primary"
                        }`}
                      >
                        {type.icon}
                      </span>
                      <div className="font-bold text-sm">{type.label}</div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 2. Vehicle Details */}
            <div onFocus={() => setActiveStep(1)}>
              <div className="bg-white rounded-2xl p-6 shadow-sm border border-outline-variant/10 mb-10">
                <SectionHeading
                  icon="directions_bike"
                  number={2}
                  title="Vehicle Details"
                />
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <FormField
                    name="brand"
                    label="Brand"
                    placeholder="e.g. Specialized, Xiaomi"
                  />
                  <FormField
                    name="model"
                    label="Model"
                    placeholder="e.g. Turbo Vado 4.0"
                  />
                  <FormField
                    name="color"
                    label="Color"
                    placeholder="e.g. Matte Graphite"
                  />
                  <FormField
                    name="frame_number"
                    label="Frame number"
                    placeholder="Enter serial or frame number"
                    required
                  />
                </div>
              </div>
            </div>

            {/* Submit */}
            <div className="text-center mb-6">
              <button
                type="button"
                onClick={handleSubmit}
                disabled={loading}
                className="px-10 py-4 bg-primary text-white rounded-full font-bold text-lg hover:shadow-xl hover:shadow-primary/30 transition-all inline-flex items-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {loading ? "Submitting..." : "Submit for Verification"}
                <span className="material-symbols-outlined text-xl">
                  verified
                </span>
              </button>
              <p className="text-xs text-on-surface-variant mt-4 max-w-md mx-auto">
                By submitting, you agree to our verification protocols and data
                privacy policy. Verification typically takes 24-48 hours.
              </p>
            </div>
          </div>
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
            setError("");
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

function SectionHeading({ icon, number, title }) {
  return (
    <div className="flex items-center gap-3 mb-5">
      <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
        <span className="material-symbols-outlined text-primary text-lg">
          {icon}
        </span>
      </div>
      <h2 className="text-lg font-bold">
        {number}. {title}
      </h2>
    </div>
  );
}

function FormField({ name, label, placeholder, fullWidth, required }) {
  return (
    <div className={fullWidth ? "col-span-full" : ""}>
      <label className="block text-sm font-semibold text-on-surface mb-1.5">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>
      <input
        type="text"
        name={name}
        placeholder={placeholder}
        className="w-full px-4 py-3 rounded-xl border border-outline-variant/30 bg-surface-container-low text-on-surface placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-all"
      />
    </div>
  );
}