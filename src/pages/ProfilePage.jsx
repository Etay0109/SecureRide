import { useState, useEffect, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import LoginModal from "../components/LoginModal";
import RegisterModal from "../components/RegisterModal";
import NotificationBell from "../components/NotificationBell";
import { getStoredUser } from "../utils/auth";
import SectionHeading from "../components/ui/SectionHeading";
import EmptyState from "../components/ui/EmptyState";
import TradeCard from "../components/trades/TradeCard";

const VEHICLE_ICONS = {
  "Electric Scooter": "electric_scooter",
  "Bicycle": "pedal_bike",
  "Electric Bicycle": "electric_moped",
};

export default function ProfilePage() {
  const navigate = useNavigate();
  const [user, setUser] = useState(getStoredUser);
  const [profile, setProfile] = useState(null);
  const [vehicles, setVehicles] = useState([]);
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [showLogin, setShowLogin] = useState(false);
  const [showRegister, setShowRegister] = useState(false);

  const [editingEmail, setEditingEmail] = useState(false);
  const [newEmail, setNewEmail] = useState("");
  const [emailPassword, setEmailPassword] = useState("");
  const [emailError, setEmailError] = useState("");
  const [emailLoading, setEmailLoading] = useState(false);
  const [emailSuccess, setEmailSuccess] = useState("");

  const [editingPassword, setEditingPassword] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordSuccess, setPasswordSuccess] = useState("");

  const [trades, setTrades] = useState([]);

  const token = localStorage.getItem("token");

  const fetchTrades = useCallback(async () => {
    if (!token) return;
    try {
      const res = await fetch("/api/trades/my", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) setTrades(await res.json());
    } catch {
      /* silently fail */
    }
  }, [token]);

  useEffect(() => {
    if (!token) {
      navigate("/");
      return;
    }
    fetchProfile();
    fetchVehicles();
    fetchTrades();
  }, []);

  const fetchProfile = async () => {
    try {
      const res = await fetch("/api/auth/me", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Failed to load profile");
      const data = await res.json();
      setProfile(data);
    } catch {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      navigate("/");
    } finally {
      setLoadingProfile(false);
    }
  };

  const fetchVehicles = async () => {
    try {
      const res = await fetch("/api/verify/my-vehicles", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setVehicles(data);
      }
    } catch {
      /* silently fail */
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

  const handleEmailUpdate = async (e) => {
    e.preventDefault();
    setEmailError("");
    setEmailSuccess("");
    if (!newEmail.trim()) {
      setEmailError("Please enter a new email.");
      return;
    }
    if (!emailPassword) {
      setEmailError("Password is required to confirm this change.");
      return;
    }
    setEmailLoading(true);
    try {
      const res = await fetch("/api/auth/email", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ new_email: newEmail, password: emailPassword }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.detail || "Failed to update email");
      }
      const updated = await res.json();
      setProfile(updated);
      const storedUser = getStoredUser();
      if (storedUser) {
        storedUser.email = updated.email;
        localStorage.setItem("user", JSON.stringify(storedUser));
        setUser(storedUser);
      }
      setEmailSuccess("Email updated successfully.");
      setEditingEmail(false);
      setNewEmail("");
      setEmailPassword("");
    } catch (err) {
      setEmailError(err.message);
    } finally {
      setEmailLoading(false);
    }
  };

  const handlePasswordUpdate = async (e) => {
    e.preventDefault();
    setPasswordError("");
    setPasswordSuccess("");
    if (!currentPassword || !newPassword) {
      setPasswordError("All fields are required.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordError("New passwords do not match.");
      return;
    }
    if (newPassword.length < 8) {
      setPasswordError("New password must be at least 8 characters.");
      return;
    }
    setPasswordLoading(true);
    try {
      const res = await fetch("/api/auth/password", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          current_password: currentPassword,
          new_password: newPassword,
        }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.detail || "Failed to update password");
      }
      setPasswordSuccess("Password updated successfully.");
      setEditingPassword(false);
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err) {
      setPasswordError(err.message);
    } finally {
      setPasswordLoading(false);
    }
  };

  const handleToggleStolen = async (frameNumber, currentlyStolen) => {
    const message = currentlyStolen
      ? "Mark this vehicle as found?"
      : "Are you sure you want to report this vehicle as stolen?";
    if (!confirm(message)) return;
    try {
      const res = await fetch(
        `/api/verify/${encodeURIComponent(frameNumber)}/toggle-stolen`,
        {
          method: "PUT",
          headers: { Authorization: `Bearer ${token}` },
        },
      );
      if (!res.ok) {
        let msg = "Failed to update vehicle status";
        try {
          const data = await res.json();
          msg = data.detail || msg;
        } catch {}
        throw new Error(msg);
      }
      const updated = await res.json();
      setVehicles((prev) =>
        prev.map((v) =>
          v.frame_number === updated.frame_number ? updated : v,
        ),
      );
    } catch (err) {
      alert(err.message);
    }
  };

  const handleTradeAction = async (tradeId, action) => {
    try {
      const res = await fetch(`/api/trades/${tradeId}/${action}`, {
        method: "PUT",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) {
        const d = await res.json().catch(() => null);
        throw new Error(d?.detail || `Failed to ${action}`);
      }
      await fetchTrades();
      if (action === "confirm-transfer" || action === "confirm-receipt") {
        fetchVehicles();
      }
    } catch (err) {
      alert(err.message);
    }
  };

  const activeTrades = trades.filter((t) =>
    ["pending_seller", "accepted"].includes(t.status),
  );
  const completedBuys = trades.filter(
    (t) => t.status === "completed" && t.buyer_id === user?.id,
  );
  const completedSales = trades.filter(
    (t) => t.status === "completed" && t.seller_id === user?.id,
  );

  if (loadingProfile) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface">
        <div className="text-on-surface-variant text-lg">
          Loading profile...
        </div>
      </div>
    );
  }

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
                  className="text-slate-500 hover:text-slate-900 transition-colors tracking-tight"
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
                  className={`w-9 h-9 rounded-full flex items-center justify-center ring-2 ${user.blocked ? "bg-red-100 ring-red-300" : "bg-primary/10 ring-primary/30"}`}
                >
                  <span
                    className={`material-symbols-outlined text-lg ${user.blocked ? "text-red-600" : "text-primary"}`}
                  >
                    {user.blocked ? "person_off" : "person"}
                  </span>
                </div>
                <span
                  className={`text-sm font-semibold hidden sm:inline ${user.blocked ? "text-red-600" : "text-primary"}`}
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

      {/* Main Content */}
      <main className="flex-1 w-full max-w-3xl mx-auto px-6 pt-28 pb-16">
        <div className="flex items-center gap-4 mb-10">
          <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
            <span className="material-symbols-outlined text-primary text-3xl">
              person
            </span>
          </div>
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight">
              {profile?.first_name} {profile?.last_name}
            </h1>
            <p className="text-on-surface-variant text-sm">
              Member since{" "}
              {profile?.created_at
                ? new Date(profile.created_at).toLocaleDateString("en-US", {
                    year: "numeric",
                    month: "long",
                  })
                : ""}
            </p>
          </div>
        </div>

        {/* Account Details */}
        <section className="mb-10">
          <SectionHeading icon="manage_accounts" title="Account Details" />
          <div className="bg-surface-container-lowest rounded-xl border border-outline-variant/20 p-6 space-y-5">
            <DetailRow label="First Name" value={profile?.first_name} />
            <DetailRow label="Last Name" value={profile?.last_name} />
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider mb-1">
                  Email
                </p>
                <p className="text-on-surface font-medium">{profile?.email}</p>
              </div>
              <button
                onClick={() => {
                  setEditingEmail(!editingEmail);
                  setEmailError("");
                  setEmailSuccess("");
                }}
                className="text-sm font-semibold text-primary hover:text-primary/80 transition-colors flex items-center gap-1"
              >
                <span className="material-symbols-outlined text-base">
                  edit
                </span>
                {editingEmail ? "Cancel" : "Change"}
              </button>
            </div>

            {emailSuccess && (
              <div className="px-4 py-2 rounded-lg bg-green-50 border border-green-200 text-green-700 text-sm">
                {emailSuccess}
              </div>
            )}

            {editingEmail && (
              <form
                onSubmit={handleEmailUpdate}
                className="space-y-3 pt-2 border-t border-outline-variant/20"
              >
                {emailError && (
                  <div className="px-4 py-2 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">
                    {emailError}
                  </div>
                )}
                <div>
                  <label className="block text-sm font-semibold text-on-surface mb-1">
                    New Email
                  </label>
                  <input
                    type="email"
                    value={newEmail}
                    onChange={(e) => setNewEmail(e.target.value)}
                    placeholder="Enter new email"
                    className="w-full px-4 py-3 rounded-xl border border-outline-variant/30 bg-surface-container-low text-on-surface placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-all"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-on-surface mb-1">
                    Confirm with Password
                  </label>
                  <input
                    type="password"
                    value={emailPassword}
                    onChange={(e) => setEmailPassword(e.target.value)}
                    placeholder="Enter your current password"
                    className="w-full px-4 py-3 rounded-xl border border-outline-variant/30 bg-surface-container-low text-on-surface placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-all"
                  />
                </div>
                <button
                  type="submit"
                  disabled={emailLoading}
                  className="px-6 py-2.5 bg-primary text-white rounded-xl font-bold text-sm hover:shadow-lg hover:shadow-primary/20 transition-all disabled:opacity-60"
                >
                  {emailLoading ? "Saving..." : "Save Email"}
                </button>
              </form>
            )}

            <div className="flex items-center justify-between pt-2 border-t border-outline-variant/20">
              <div>
                <p className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider mb-1">
                  Password
                </p>
                <p className="text-on-surface font-medium">••••••••</p>
              </div>
              <button
                onClick={() => {
                  setEditingPassword(!editingPassword);
                  setPasswordError("");
                  setPasswordSuccess("");
                }}
                className="text-sm font-semibold text-primary hover:text-primary/80 transition-colors flex items-center gap-1"
              >
                <span className="material-symbols-outlined text-base">
                  lock_reset
                </span>
                {editingPassword ? "Cancel" : "Change"}
              </button>
            </div>

            {passwordSuccess && (
              <div className="px-4 py-2 rounded-lg bg-green-50 border border-green-200 text-green-700 text-sm">
                {passwordSuccess}
              </div>
            )}

            {editingPassword && (
              <form onSubmit={handlePasswordUpdate} className="space-y-3 pt-2">
                {passwordError && (
                  <div className="px-4 py-2 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">
                    {passwordError}
                  </div>
                )}
                <div>
                  <label className="block text-sm font-semibold text-on-surface mb-1">
                    Current Password
                  </label>
                  <input
                    type="password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    placeholder="Enter current password"
                    className="w-full px-4 py-3 rounded-xl border border-outline-variant/30 bg-surface-container-low text-on-surface placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-all"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-on-surface mb-1">
                    New Password
                  </label>
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Enter new password"
                    className="w-full px-4 py-3 rounded-xl border border-outline-variant/30 bg-surface-container-low text-on-surface placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-all"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-on-surface mb-1">
                    Confirm New Password
                  </label>
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Confirm new password"
                    className="w-full px-4 py-3 rounded-xl border border-outline-variant/30 bg-surface-container-low text-on-surface placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-all"
                  />
                </div>
                <button
                  type="submit"
                  disabled={passwordLoading}
                  className="px-6 py-2.5 bg-primary text-white rounded-xl font-bold text-sm hover:shadow-lg hover:shadow-primary/20 transition-all disabled:opacity-60"
                >
                  {passwordLoading ? "Saving..." : "Update Password"}
                </button>
              </form>
            )}
          </div>
        </section>

        {/* My Verified Vehicles */}
        <section className="mb-10">
          <SectionHeading icon="verified_user" title="My Verified Vehicles" />
          {vehicles.length === 0 ? (
            <EmptyState
              icon="directions_bike"
              title="No verified vehicles yet"
              description="Once you verify ownership of a vehicle, it will appear here."
              actionLabel="Verify a Vehicle"
              actionTo="/verify"
            />
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {vehicles.map((v) => (
                <div
                  key={v.frame_number}
                  className={`bg-surface-container-lowest rounded-xl border p-5 hover:shadow-md transition-all ${
                    v.stolen
                      ? "border-red-300 bg-red-50/30"
                      : "border-outline-variant/20"
                  }`}
                >
                  <div className="flex items-center gap-3 mb-3">
                    <div
                      className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                        v.stolen ? "bg-red-100" : "bg-primary/10"
                      }`}
                    >
                      <span
                        className={`material-symbols-outlined text-xl ${
                          v.stolen ? "text-red-500" : "text-primary"
                        }`}
                      >
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
                    {v.stolen ? (
                      <span className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-red-100 text-red-700 text-xs font-bold">
                        <span className="material-symbols-outlined text-sm">
                          warning
                        </span>
                        Stolen
                      </span>
                    ) : (
                      <span className="material-symbols-outlined text-green-500 text-xl">
                        verified
                      </span>
                    )}
                  </div>
                  <div className="space-y-1.5 text-sm">
                    <div className="flex justify-between">
                      <span className="text-on-surface-variant">Frame #</span>
                      <span className="font-medium text-on-surface font-mono text-xs">
                        {v.frame_number}
                      </span>
                    </div>
                    {v.color && (
                      <div className="flex justify-between">
                        <span className="text-on-surface-variant">Color</span>
                        <span className="font-medium text-on-surface">
                          {v.color}
                        </span>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <span className="text-on-surface-variant">Verified</span>
                      <span className="font-medium text-on-surface text-xs">
                        {new Date(v.created_at).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={() => handleToggleStolen(v.frame_number, v.stolen)}
                    className={`mt-4 w-full py-2 rounded-xl border text-sm font-semibold transition-all flex items-center justify-center gap-1.5 ${
                      v.stolen
                        ? "border-green-200 text-green-600 hover:bg-green-50 hover:border-green-300"
                        : "border-red-200 text-red-600 hover:bg-red-50 hover:border-red-300"
                    }`}
                  >
                    <span className="material-symbols-outlined text-base">
                      {v.stolen ? "check_circle" : "report"}
                    </span>
                    {v.stolen ? "Report as Found" : "Report as Stolen"}
                  </button>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Active Trades */}
        <section className="mb-10">
          <SectionHeading icon="sync_alt" title="Active Trades" />
          {activeTrades.length === 0 ? (
            <EmptyState
              icon="handshake"
              title="No active trades"
              description="When you buy or receive a purchase offer, active trades will appear here."
            />
          ) : (
            <div className="space-y-4">
              {activeTrades.map((t) => {
                const isBuyer = t.buyer_id === user?.id;
                const isSeller = t.seller_id === user?.id;
                return (
                  <TradeCard
                    key={t.id}
                    trade={t}
                    isBuyer={isBuyer}
                    isSeller={isSeller}
                    onAction={handleTradeAction}
                  />
                );
              })}
            </div>
          )}
        </section>

        {/* Buy History */}
        <section className="mb-10">
          <SectionHeading icon="shopping_cart" title="Buy History" />
          {completedBuys.length === 0 ? (
            <EmptyState
              icon="receipt_long"
              title="No purchase history yet"
              description="Your vehicle purchase records will appear here once completed."
            />
          ) : (
            <div className="space-y-3">
              {completedBuys.map((t) => (
                <CompletedTradeRow key={t.id} trade={t} role="buyer" />
              ))}
            </div>
          )}
        </section>

        {/* Sale History */}
        <section className="mb-10">
          <SectionHeading icon="sell" title="Sale History" />
          {completedSales.length === 0 ? (
            <EmptyState
              icon="storefront"
              title="No sale history yet"
              description="Your vehicle sale records will appear here once completed."
            />
          ) : (
            <div className="space-y-3">
              {completedSales.map((t) => (
                <CompletedTradeRow key={t.id} trade={t} role="seller" />
              ))}
            </div>
          )}
        </section>
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
            fetchProfile();
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

function DetailRow({ label, value }) {
  return (
    <div>
      <p className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider mb-1">
        {label}
      </p>
      <p className="text-on-surface font-medium">{value}</p>
    </div>
  );
}

function CompletedTradeRow({ trade, role }) {
  const isBuyer = role === "buyer";
  const otherName = isBuyer
    ? `${trade.seller_first_name} ${trade.seller_last_name}`
    : `${trade.buyer_first_name} ${trade.buyer_last_name}`;
  const vehicleName =
    `${trade.vehicle_brand || "Unknown"} ${trade.vehicle_model || ""}`.trim();

  return (
    <div className="bg-surface-container-lowest rounded-xl border border-outline-variant/20 p-4 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-green-100 flex items-center justify-center">
          <span className="material-symbols-outlined text-green-600 text-xl">
            {isBuyer ? "shopping_cart" : "sell"}
          </span>
        </div>
        <div>
          <p className="font-bold text-on-surface text-sm">{vehicleName}</p>
          <p className="text-xs text-on-surface-variant">
            {isBuyer ? "Bought from" : "Sold to"} {otherName}
          </p>
        </div>
      </div>
      <div className="text-right">
        <p className="font-black text-primary">
          ₪{trade.price.toLocaleString()}
        </p>
        <p className="text-xs text-on-surface-variant">
          {trade.completed_at
            ? new Date(trade.completed_at).toLocaleDateString()
            : ""}
        </p>
      </div>
    </div>
  );
}
