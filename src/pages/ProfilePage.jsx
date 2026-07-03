import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import LoginModal from "../components/LoginModal";
import RegisterModal from "../components/RegisterModal";
import PageHeader from "../components/ui/PageHeader";
import PageFooter from "../components/ui/PageFooter";
import { getStoredUser } from "../utils/auth";
import AccountDetailsSection from "../components/profile/AccountDetailsSection";
import VehiclesSection from "../components/profile/VehiclesSection";
import ActiveListingsSection from "../components/profile/ActiveListingsSection";
import TradesHistorySection from "../components/profile/TradesHistorySection";

export default function ProfilePage() {
  const navigate = useNavigate();
  const [user, setUser] = useState(getStoredUser);
  const [profile, setProfile] = useState(null);
  const [vehicles, setVehicles] = useState([]);
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [showLogin, setShowLogin] = useState(false);
  const [showRegister, setShowRegister] = useState(false);

  const token = localStorage.getItem("token");

  const fetchVehicles = async () => {
    try {
      const res = await fetch("/api/verify/my-vehicles", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) setVehicles(await res.json());
    } catch { /* silently fail */ }
  };

  const fetchProfile = async () => {
    try {
      const res = await fetch("/api/auth/me", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Failed to load profile");
      setProfile(await res.json());
    } catch {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      navigate("/");
    } finally {
      setLoadingProfile(false);
    }
  };

  useEffect(() => {
    if (!token) { navigate("/"); return; }
    fetchProfile();
    fetchVehicles();
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setUser(null);
    navigate("/");
  };

  const openLogin = () => { setShowRegister(false); setShowLogin(true); };
  const openRegister = () => { setShowLogin(false); setShowRegister(true); };

  if (loadingProfile) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface">
        <div className="text-on-surface-variant text-lg">Loading profile...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-surface text-on-surface antialiased">
      <PageHeader
        user={user}
        onLogout={handleLogout}
        onOpenLogin={openLogin}
        onOpenRegister={openRegister}
        activePage="profile"
      />
      <main className="flex-1 w-full max-w-3xl mx-auto px-6 pt-28 pb-16">
        <div className="flex items-center gap-4 mb-10">
          <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
            <span className="material-symbols-outlined text-primary text-3xl">person</span>
          </div>
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight">
              {profile?.first_name} {profile?.last_name}
            </h1>
            <p className="text-on-surface-variant text-sm">
              Member since{" "}
              {profile?.created_at
                ? new Date(profile.created_at).toLocaleDateString("en-US", { year: "numeric", month: "long" })
                : ""}
            </p>
          </div>
        </div>
        <AccountDetailsSection
          profile={profile}
          token={token}
          onProfileUpdated={setProfile}
          onUserUpdated={setUser}
        />
        <VehiclesSection
          token={token}
          vehicles={vehicles}
          onVehiclesChange={fetchVehicles}
        />
        <ActiveListingsSection token={token} navigate={navigate} />
        <TradesHistorySection
          user={user}
          token={token}
          onVehicleTransferred={fetchVehicles}
        />
      </main>
      <PageFooter />
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
