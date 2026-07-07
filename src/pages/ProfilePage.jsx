import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import PageHeader from "../components/ui/PageHeader";
import PageFooter from "../components/ui/PageFooter";
import AccountDetailsSection from "../components/profile/AccountDetailsSection";
import VehiclesSection from "../components/profile/VehiclesSection";
import ActiveListingsSection from "../components/profile/ActiveListingsSection";
import TradesHistorySection from "../components/profile/TradesHistorySection";
import { api } from "../utils/api";
import { useAuth } from "../context/AuthContext";

export default function ProfilePage() {
  const navigate = useNavigate();
  const { user, setUser } = useAuth();
  const [profile, setProfile] = useState(null);
  const [vehicles, setVehicles] = useState([]);
  const [loadingProfile, setLoadingProfile] = useState(true);

  const fetchVehicles = useCallback(async () => {
    try {
      setVehicles(await api("/verify/my-vehicles"));
    } catch { /* silently fail */ }
  }, []);

  const fetchProfile = useCallback(async () => {
    try {
      setProfile(await api("/auth/me"));
    } catch {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      navigate("/");
    } finally {
      setLoadingProfile(false);
    }
  }, [navigate]);

  // Regression guard: refetch when user changes (e.g., after login via modal)
  useEffect(() => {
    if (!user) return;
    fetchProfile();
    fetchVehicles();
  }, [user, fetchProfile, fetchVehicles]);

  if (loadingProfile) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface">
        <div className="text-on-surface-variant text-lg">Loading profile...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-surface text-on-surface antialiased">
      <PageHeader activePage="profile" />
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
          onProfileUpdated={setProfile}
          onUserUpdated={setUser}
        />
        <VehiclesSection
          vehicles={vehicles}
          onVehiclesChange={fetchVehicles}
        />
        <ActiveListingsSection />
        <TradesHistorySection
          user={user}
          onVehicleTransferred={fetchVehicles}
        />
      </main>
      <PageFooter />
    </div>
  );
}
