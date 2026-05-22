import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import LoginModal from "../components/LoginModal";
import RegisterModal from "../components/RegisterModal";
import NotificationBell from "../components/NotificationBell";

function getStoredUser() {
  try {
    const raw = localStorage.getItem("user");
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export default function LandingPage() {
  const [showLogin, setShowLogin] = useState(false);
  const [showRegister, setShowRegister] = useState(false);
  const [user, setUser] = useState(getStoredUser);
  const [vehicleCount, setVehicleCount] = useState(0);

  useEffect(() => {
    fetch("/api/stats")
      .then((res) => res.json())
      .then((data) => setVehicleCount(data.vehicles_verified))
      .catch(() => {});
  }, []);

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
  };

  return (
    <>
      <nav className="fixed top-0 w-full z-50 bg-white/80 backdrop-blur-lg shadow-[0_20px_40px_rgba(25,28,29,0.05)]">
        <div className="flex justify-between items-center px-8 h-20 max-w-screen-2xl mx-auto">
          <div className="text-2xl font-black tracking-tighter text-slate-900">
            Secure Ride
          </div>

          <div className="hidden md:flex items-center gap-8">
            <Link
              to="/"
              className="text-blue-700 font-bold border-b-2 border-blue-700 pb-1 tracking-tight"
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

      <main className="pt-20 bg-surface text-on-surface antialiased">
        <section className="relative min-h-[920px] flex items-start overflow-hidden bg-surface pt-12 lg:pt-16">
          <div className="max-w-screen-2xl mx-auto px-8 grid grid-cols-1 lg:grid-cols-12 gap-12 items-center w-full">
            <div className="lg:col-span-6 z-10">
              <h1 className="text-6xl md:text-7xl font-extrabold text-on-surface tracking-tight leading-[1.1] mb-6">
                The Secure Standard for Buying and{" "}
                <span className="text-primary">Selling Rides.</span>
              </h1>

              <p className="text-xl text-on-surface-variant leading-relaxed mb-10 max-w-xl">
                Verify ownership via frame number and transfer titles instantly.
                Secure, transparent, and theft-proof digital ledger for
                high-performance vehicles.
              </p>

              <div className="flex flex-col sm:flex-row gap-4">
                <button
                  onClick={openRegister}
                  className="px-8 py-4 bg-primary text-on-primary rounded-xl font-bold text-lg hover:shadow-2xl hover:shadow-primary/30 transition-all"
                >
                  Get Started
                </button>
              </div>
            </div>

            <div className="lg:col-span-6 relative h-[600px] lg:h-auto flex items-center justify-center">
              <div className="relative w-[100%] max-w-[600px]">
                <img
                  src="https://lh3.googleusercontent.com/aida-public/AB6AXuDP89aoJDleEfK_Xhno3XOaj3ebHg9iccXFNse-w6Ws_NuCSAQ_hp_sltSmUz_vJ-bBnArNaMd2ueb-axkhgz9skbuNspTAwZKaXU774Q089YEDqyVXVOxep5SEAjko0FLGmsCJKKK9t3nrOIazC6fv3AmO3o5xxLPluBI760RshvYjtEHto8DXmxq_JX2g4wqoqACZkz26z6qlahUqlrOo1_pqhf21AV9vnj5i3xcMU6Qen0edw9k7nJfEAAIkplqvjbbjgQHFFw"
                  alt="Premium electric bicycle"
                  className="w-full h-auto object-contain drop-shadow-[0_40px_60px_rgba(0,62,199,0.15)]"
                />
              </div>
            </div>
          </div>

          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-primary/5 rounded-full blur-[120px] pointer-events-none" />
        </section>

        <section className="py-32 bg-surface-container-low">
          <div className="max-w-7xl mx-auto px-8">
            <div className="text-center mb-24">
              <h2 className="text-4xl font-extrabold tracking-tight mb-4 text-on-surface">
                Precision Protocols
              </h2>
              <p className="text-on-surface-variant text-lg">
                Three steps to absolute ownership certainty.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-16 relative">
              <div className="group relative">
                <div className="mb-8 w-16 h-16 bg-surface-container-lowest rounded-2xl flex items-center justify-center shadow-sm group-hover:shadow-xl group-hover:bg-primary transition-all duration-300">
                  <span className="material-symbols-outlined text-primary group-hover:text-white text-3xl">
                    app_registration
                  </span>
                </div>
                <h3 className="text-2xl font-bold mb-4 text-on-surface">
                  1. Register
                </h3>
                <p className="text-on-surface-variant leading-relaxed">
                  Link your vehicle&apos;s frame number to your profile. Our
                  encrypted database secures your claim to the asset.
                </p>
                <div className="absolute top-8 left-full w-full h-[2px] bg-gradient-to-r from-primary/20 to-transparent hidden md:block" />
              </div>

              <div className="group relative">
                <div className="mb-8 w-16 h-16 bg-surface-container-lowest rounded-2xl flex items-center justify-center shadow-sm group-hover:shadow-xl group-hover:bg-primary transition-all duration-300">
                  <span className="material-symbols-outlined text-primary group-hover:text-white text-3xl">
                    verified_user
                  </span>
                </div>
                <h3 className="text-2xl font-bold mb-4 text-on-surface">
                  2. Verify
                </h3>
                <p className="text-on-surface-variant leading-relaxed">
                  Buyers can check the ownership status instantly using our
                  secure registry, ensuring the vehicle isn&apos;t flagged.
                </p>
                <div className="absolute top-8 left-full w-full h-[2px] bg-gradient-to-r from-primary/20 to-transparent hidden md:block" />
              </div>

              <div className="group">
                <div className="mb-8 w-16 h-16 bg-surface-container-lowest rounded-2xl flex items-center justify-center shadow-sm group-hover:shadow-xl group-hover:bg-primary transition-all duration-300">
                  <span className="material-symbols-outlined text-primary group-hover:text-white text-3xl">
                    move_up
                  </span>
                </div>
                <h3 className="text-2xl font-bold mb-4 text-on-surface">
                  3. Transfer
                </h3>
                <p className="text-on-surface-variant leading-relaxed">
                  Securely hand over the digital title upon sale. The immutable
                  record updates in real-time, completing the chain.
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="py-32 bg-surface">
          <div className="max-w-7xl mx-auto px-8">
            <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
              <div className="md:col-span-8 bg-surface-container-lowest p-10 rounded-xl shadow-[0_20px_40px_rgba(25,28,29,0.03)] border border-outline-variant/10 hover:shadow-[0_30px_60px_rgba(0,0,0,0.06)] transition-all">
                <span className="material-symbols-outlined text-primary text-4xl mb-6">
                  fingerprint
                </span>
                <h3 className="text-2xl font-bold mb-4 text-on-surface">
                  Ownership Verification
                </h3>
                <p className="text-on-surface-variant text-lg max-w-md">
                  Immutable records tied to frame numbers ensure that every bike
                  and e-scooter on the platform has a verified origin and
                  legitimate owner.
                </p>
              </div>

              <div className="md:col-span-4 bg-primary p-10 rounded-xl shadow-xl hover:-translate-y-1 transition-all">
                <span className="material-symbols-outlined text-white text-4xl mb-6">
                  gpp_good
                </span>
                <h3 className="text-2xl font-bold mb-4 text-white">
                  Fraud Prevention
                </h3>
                <p className="text-blue-100">
                  Our advanced algorithms and cross-database checks stop the
                  sale of stolen vehicles before they are even listed for sale.
                </p>
              </div>

              <div className="md:col-span-12 bg-surface-container-lowest p-10 rounded-xl shadow-[0_20px_40px_rgba(25,28,29,0.03)] border border-outline-variant/10 hover:shadow-[0_30px_60px_rgba(0,0,0,0.06)] transition-all">
                <span className="material-symbols-outlined text-primary text-4xl mb-6">
                  swap_horiz
                </span>
                <h3 className="text-2xl font-bold mb-4 text-on-surface">
                  Instant Title Transfer
                </h3>
                <p className="text-on-surface-variant text-lg">
                  Seamlessly move ownership to the new rider via digital
                  signature, updating the secure registry in seconds to ensure
                  total marketplace integrity.
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="py-24 bg-surface-container-highest">
          <div className="max-w-7xl mx-auto px-8">
            <div className="flex flex-col md:flex-row justify-around items-center gap-12">
              <div className="text-center">
                <div className="text-6xl font-black text-primary mb-2 tracking-tighter">
                  {vehicleCount.toLocaleString()}
                </div>
                <p className="text-on-surface font-bold text-lg">
                  Vehicles Verified
                </p>
              </div>

              <div className="h-16 w-[1px] bg-outline-variant hidden md:block" />

              <div className="text-center">
                <div className="text-6xl font-black text-primary mb-2 tracking-tighter">
                  0
                </div>
                <p className="text-on-surface font-bold text-lg">
                  Fraudulent Sales
                </p>
              </div>

              <div className="h-16 w-[1px] bg-outline-variant hidden md:block" />

              <div className="text-center">
                <div className="text-6xl font-black text-primary mb-2 tracking-tighter">
                  100%
                </div>
                <p className="text-on-surface font-bold text-lg">
                  Secure Transfers
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="py-32 relative overflow-hidden">
          <div className="max-w-4xl mx-auto px-8 text-center relative z-10">
            <h2 className="text-5xl font-black text-on-surface mb-8 tracking-tight">
              Join the future of safe mobility.
            </h2>
            <p className="text-xl text-on-surface-variant mb-12">
              Create your account today and experience the peace of mind that
              comes with verified ownership.
            </p>

            <div className="flex flex-col sm:flex-row justify-center gap-4">
              <button
                onClick={openRegister}
                className="px-10 py-5 bg-primary text-white rounded-xl font-bold text-xl shadow-2xl shadow-primary/40 hover:scale-105 transition-all"
              >
                Create Your Account
              </button>
              <button className="px-10 py-5 bg-white text-primary border border-primary/20 rounded-xl font-bold text-xl hover:bg-primary/5 transition-all">
                Learn More
              </button>
            </div>
          </div>

          <div className="absolute top-1/2 left-0 -translate-y-1/2 -translate-x-1/2 w-96 h-96 bg-primary/10 rounded-full blur-3xl" />
          <div className="absolute bottom-0 right-0 translate-y-1/2 translate-x-1/3 w-80 h-80 bg-secondary-container/20 rounded-full blur-3xl" />
        </section>
      </main>

      <footer className="bg-slate-50 w-full py-16 px-8 border-t border-slate-100">
        <div className="max-w-7xl mx-auto">
          <div className="text-xl font-black text-slate-900 mb-6">
            Secure Ride
          </div>
          <p className="text-slate-500 text-sm leading-relaxed">
            &copy; 2026. Providing a professional framework for vehicle
            verification and secure ownership transfer.
          </p>
        </div>
      </footer>

      {showLogin && (
        <LoginModal
          onClose={() => setShowLogin(false)}
          onSwitchToRegister={openRegister}
          onLoginSuccess={(userData) => {
            setShowLogin(false);
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
    </>
  );
}
