import { useState } from "react";
import ChangesRequestedFlow from "./auth/ChangesRequestedFlow";
import LoginForm from "./auth/LoginForm";

export default function LoginModal({ onClose, onSwitchToRegister, onLoginSuccess }) {
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [changesRequested, setChangesRequested] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    const form = e.target;
    const email = form["login-email"].value;
    const password = form["login-password"].value;
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      if (!res.ok) {
        let message = "Login failed";
        try { const data = await res.json(); message = data.detail || message; } catch {}
        if (message.startsWith("__CHANGES_REQUESTED__|")) {
          setChangesRequested({ email, password, reason: message.replace("__CHANGES_REQUESTED__|", "") });
          return;
        }
        throw new Error(message);
      }
      const data = await res.json();
      localStorage.setItem("token", data.access_token);
      localStorage.setItem("user", JSON.stringify(data.user));
      if (data.user?.blocked) {
        window.dispatchEvent(new CustomEvent("accountBlocked", { detail: { reason: data.user.blocked_reason } }));
      }
      onClose();
      if (onLoginSuccess) onLoginSuccess(data.user);
      else window.location.reload();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (changesRequested) {
    return (
      <ChangesRequestedFlow
        changesRequested={changesRequested}
        onClose={onClose}
        onBack={() => setChangesRequested(null)}
      />
    );
  }

  return (
    <LoginForm
      error={error}
      loading={loading}
      onSubmit={handleSubmit}
      onSwitchToRegister={onSwitchToRegister}
      onClose={onClose}
    />
  );
}
