import { useState } from "react";

export default function RegisterModal({ onClose, onSwitchToLogin, onRegisterSuccess }) {
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    const form = e.target;
    const password = form["register-password"].value;
    const confirmPassword = form["register-confirm-password"].value;
    const idNumber = form["register-id-number"].value.trim();

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    if (!idNumber) {
      setError("ID number is required");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          first_name: form["register-first-name"].value,
          last_name: form["register-last-name"].value,
          email: form["register-email"].value,
          password,
          id_number: idNumber,
        }),
      });

      if (!res.ok) {
        let message = "Registration failed";
        try {
          const data = await res.json();
          message = data.detail || message;
        } catch { /* response body was not JSON */ }
        throw new Error(message);
      }

      const loginRes = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: form["register-email"].value,
          password,
        }),
      });

      if (!loginRes.ok) {
        onSwitchToLogin();
        return;
      }

      const loginData = await loginRes.json();
      localStorage.setItem("token", loginData.access_token);
      localStorage.setItem("user", JSON.stringify(loginData.user));
      if (onRegisterSuccess) {
        onRegisterSuccess(loginData.user);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-md mx-4 bg-white rounded-2xl shadow-2xl p-8 animate-[fadeIn_0.2s_ease-out]"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-700 transition-colors"
        >
          <span className="material-symbols-outlined text-2xl">close</span>
        </button>

        <div className="text-center mb-8">
          <div className="text-2xl font-black tracking-tighter text-slate-900 mb-2">
            Secure Ride
          </div>
          <p className="text-on-surface-variant text-sm">
            Create your account
          </p>
        </div>

        {error && (
          <div className="mb-4 px-4 py-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label
                htmlFor="register-first-name"
                className="block text-sm font-semibold text-on-surface mb-1.5"
              >
                First Name
              </label>
              <input
                id="register-first-name"
                name="register-first-name"
                type="text"
                required
                placeholder="John"
                className="w-full px-4 py-3 rounded-xl border border-outline-variant/30 bg-surface-container-lowest text-on-surface placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-all"
              />
            </div>
            <div>
              <label
                htmlFor="register-last-name"
                className="block text-sm font-semibold text-on-surface mb-1.5"
              >
                Last Name
              </label>
              <input
                id="register-last-name"
                name="register-last-name"
                type="text"
                required
                placeholder="Doe"
                className="w-full px-4 py-3 rounded-xl border border-outline-variant/30 bg-surface-container-lowest text-on-surface placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-all"
              />
            </div>
          </div>

          <div>
            <label
              htmlFor="register-id-number"
              className="block text-sm font-semibold text-on-surface mb-1.5"
            >
              ID Number
            </label>
            <input
              id="register-id-number"
              name="register-id-number"
              type="text"
              required
              placeholder="Enter your ID number"
              className="w-full px-4 py-3 rounded-xl border border-outline-variant/30 bg-surface-container-lowest text-on-surface placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-all"
            />
          </div>

          <div>
            <label
              htmlFor="register-email"
              className="block text-sm font-semibold text-on-surface mb-1.5"
            >
              Email
            </label>
            <input
              id="register-email"
              name="register-email"
              type="email"
              required
              placeholder="you@example.com"
              className="w-full px-4 py-3 rounded-xl border border-outline-variant/30 bg-surface-container-lowest text-on-surface placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-all"
            />
          </div>

          <div>
            <label
              htmlFor="register-password"
              className="block text-sm font-semibold text-on-surface mb-1.5"
            >
              Password
            </label>
            <input
              id="register-password"
              name="register-password"
              type="password"
              required
              placeholder="••••••••"
              className="w-full px-4 py-3 rounded-xl border border-outline-variant/30 bg-surface-container-lowest text-on-surface placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-all"
            />
          </div>

          <div>
            <label
              htmlFor="register-confirm-password"
              className="block text-sm font-semibold text-on-surface mb-1.5"
            >
              Confirm Password
            </label>
            <input
              id="register-confirm-password"
              name="register-confirm-password"
              type="password"
              required
              placeholder="••••••••"
              className="w-full px-4 py-3 rounded-xl border border-outline-variant/30 bg-surface-container-lowest text-on-surface placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-all"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 bg-primary text-white rounded-xl font-bold text-lg hover:shadow-lg hover:shadow-primary/20 transition-all disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {loading ? "Creating Account..." : "Create Account"}
          </button>
        </form>

        <p className="text-center text-sm text-on-surface-variant mt-6">
          Already have an account?{" "}
          <button
            type="button"
            onClick={onSwitchToLogin}
            className="text-primary font-semibold hover:underline"
          >
            Log In
          </button>
        </p>
      </div>
    </div>
  );
}
