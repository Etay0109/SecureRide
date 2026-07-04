import { useState } from "react";
import ChangesRequestedFlow from "./auth/ChangesRequestedFlow";
import LoginForm from "./auth/LoginForm";
import { api } from "../utils/api";

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
      const data = await api("/auth/login", { method: "POST", body: { email, password } });
      localStorage.setItem("token", data.access_token);
      localStorage.setItem("user", JSON.stringify(data.user));
      if (data.user?.blocked) {
        window.dispatchEvent(new CustomEvent("accountBlocked", { detail: { reason: data.user.blocked_reason } }));
      }
      onClose();
      if (onLoginSuccess) onLoginSuccess(data.user);
      else window.location.reload();
    } catch (err) {
      if (err.detail?.code === "changes_requested") {
        setChangesRequested({ email, password, reason: err.detail.reason });
        return;
      }
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
