import { useState } from "react";
import RegistrationForm from "./auth/RegistrationForm";
import { api } from "../utils/api";

export default function RegisterModal({ onClose, onSwitchToLogin, onRegisterSuccess }) {
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [pending, setPending] = useState(false);
  const [idCardImage, setIdCardImage] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    const form = e.target;
    const password = form["register-password"].value;
    const confirmPassword = form["register-confirm-password"].value;
    const idNumber = form["register-id-number"].value.trim();
    if (password !== confirmPassword) { setError("Passwords do not match"); return; }
    if (!idNumber) { setError("ID number is required"); return; }
    if (!idCardImage) { setError("Please upload an image of your ID card"); return; }
    setLoading(true);
    try {
      await api("/auth/register", {
        method: "POST",
        body: {
          first_name: form["register-first-name"].value,
          last_name: form["register-last-name"].value,
          email: form["register-email"].value,
          password,
          id_number: idNumber,
          id_card_image: idCardImage,
        },
      });
      setPending(true);
    } catch (err) {
      let message = "Registration failed";
      if (err.status === 422 && Array.isArray(err.detail)) {
        const first = err.detail[0];
        if (first.loc?.includes("password")) message = "Password must contain at least 8 characters";
        else if (first.loc?.includes("email")) message = "Please enter a valid email address";
        else message = first.msg || "Invalid input";
      } else {
        message = err.message || message;
      }
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  if (pending) {
    return (
      <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm" onClick={onClose}>
        <div className="relative w-full max-w-md mx-4 bg-white rounded-2xl shadow-2xl p-8 animate-[fadeIn_0.2s_ease-out]" onClick={(e) => e.stopPropagation()}>
          <button onClick={onClose} className="absolute top-4 right-4 text-slate-400 hover:text-slate-700 transition-colors">
            <span className="material-symbols-outlined text-2xl">close</span>
          </button>
          <div className="text-center py-4">
            <div className="w-16 h-16 rounded-full bg-amber-100 flex items-center justify-center mx-auto mb-5">
              <span className="material-symbols-outlined text-amber-600 text-3xl">hourglass_top</span>
            </div>
            <h2 className="text-xl font-bold text-on-surface mb-3">Registration Submitted</h2>
            <p className="text-sm text-on-surface-variant leading-relaxed mb-6">
              Your registration request has been sent for admin approval. The approval process may take up to 3 business days.
            </p>
            <button onClick={onSwitchToLogin} className="px-8 py-3 bg-primary text-white rounded-xl font-bold text-sm hover:shadow-lg hover:shadow-primary/20 transition-all">
              Back to Login
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <RegistrationForm
      error={error}
      loading={loading}
      onSubmit={handleSubmit}
      onSwitchToLogin={onSwitchToLogin}
      onClose={onClose}
      idCardImage={idCardImage}
      setIdCardImage={setIdCardImage}
    />
  );
}
