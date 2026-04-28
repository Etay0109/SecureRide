import { useState } from "react";
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

const TEAM = [
  {
    name: "Etay Zerachowitz",
    role: "Founder & Backend Developer",
    icon: "business_center",
  },
  {
    name: "Ido Ben Bassat",
    role: "Founder & Frontend Developer",
    icon: "code",
  },
];

const VALUES = [
  {
    icon: "verified_user",
    title: "Trust & Verification",
    description:
      "Every vehicle on our platform goes through a verified ownership process, ensuring buyers and sellers can transact with confidence.",
  },
  {
    icon: "shield",
    title: "Theft Protection",
    description:
      "Our stolen-vehicle detection system automatically flags suspicious registrations and protects the community from fraud.",
  },
  {
    icon: "handshake",
    title: "Secure Trades",
    description:
      "Our dual-confirmation trade system ensures both parties agree before ownership is transferred — no surprises.",
  },
  {
    icon: "support_agent",
    title: "Admin Support",
    description:
      "A dedicated admin team monitors the platform, investigates reports, and communicates directly with users when issues arise.",
  },
];

const STATS = [
  { label: "Verified Vehicles", icon: "two_wheeler", id: "vehicles" },
  { label: "Secure Trades", icon: "swap_horiz", id: "trades" },
  { label: "Active Users", icon: "group", id: "users" },
];

export default function AboutPage() {
  const [user, setUser] = useState(getStoredUser);
  const [showLogin, setShowLogin] = useState(false);
  const [showRegister, setShowRegister] = useState(false);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setUser(null);
  };

  const openLogin = () => {
    setShowRegister(false);
    setShowLogin(true);
  };

  const openRegister = () => {
    setShowLogin(false);
    setShowRegister(true);
  };

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
            <Link
              to="/about"
              className="text-blue-700 font-bold border-b-2 border-blue-700 pb-1 tracking-tight"
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

      <main className="flex-1 pt-20">
        {/* Hero */}
        <section className="relative bg-gradient-to-br from-slate-900 via-slate-800 to-primary/90 text-white overflow-hidden">
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-10 left-10 w-72 h-72 bg-primary rounded-full blur-3xl" />
            <div className="absolute bottom-10 right-10 w-96 h-96 bg-blue-400 rounded-full blur-3xl" />
          </div>
          <div className="relative max-w-4xl mx-auto px-6 py-24 text-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 text-sm font-medium mb-6">
              <span className="material-symbols-outlined text-base">info</span>
              Our Story
            </div>
            <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight mb-6 leading-tight">
              Making Vehicle Ownership
              <br />
              <span className="text-primary-light bg-gradient-to-r from-blue-300 to-cyan-300 bg-clip-text text-transparent">
                Safe & Transparent
              </span>
            </h1>
            <p className="text-lg text-white/70 max-w-2xl mx-auto leading-relaxed">
              Secure Ride was created to solve a real problem - verifying
              vehicle ownership for electric scooters, bicycles, and e-bikes. We
              believe that every rider deserves to know their vehicle is
              legitimately theirs, and every buyer deserves peace of mind.
            </p>
          </div>
        </section>

        {/* Mission */}
        <section className="max-w-5xl mx-auto px-6 py-20">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 text-primary text-xs font-bold mb-4">
                <span className="material-symbols-outlined text-sm">flag</span>
                OUR MISSION
              </div>
              <h2 className="text-3xl font-extrabold tracking-tight mb-4">
                Eliminate Vehicle Theft Through Technology
              </h2>
              <p className="text-on-surface-variant leading-relaxed mb-4">
                Every year, thousands of electric scooters, bicycles, and
                e-bikes are stolen. Victims often have no way to prove ownership
                or recover their property.
              </p>
              <p className="text-on-surface-variant leading-relaxed">
                Secure Ride creates a verified digital record of ownership. When
                a stolen vehicle is flagged in our system and someone attempts
                to register it, we automatically block their account and alert
                our admin team — stopping theft in its tracks.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              {VALUES.slice(0, 4).map((v, i) => (
                <div
                  key={i}
                  className="bg-surface-container-lowest rounded-2xl border border-outline-variant/20 p-5 hover:shadow-lg hover:border-primary/30 transition-all"
                >
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center mb-3">
                    <span className="material-symbols-outlined text-primary text-xl">
                      {v.icon}
                    </span>
                  </div>
                  <p className="font-bold text-sm text-on-surface mb-1">
                    {v.title}
                  </p>
                  <p className="text-xs text-on-surface-variant leading-relaxed">
                    {v.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* How It Works */}
        <section className="bg-surface-container-high/30 py-20">
          <div className="max-w-5xl mx-auto px-6">
            <div className="text-center mb-14">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 text-primary text-xs font-bold mb-4">
                <span className="material-symbols-outlined text-sm">route</span>
                HOW IT WORKS
              </div>
              <h2 className="text-3xl font-extrabold tracking-tight mb-3">
                Simple, Secure Process
              </h2>
              <p className="text-on-surface-variant max-w-xl mx-auto">
                From registration to trade — every step is designed with safety
                in mind.
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              {[
                {
                  step: "01",
                  icon: "app_registration",
                  title: "Register",
                  desc: "Create your account and join the Secure Ride community.",
                },
                {
                  step: "02",
                  icon: "verified_user",
                  title: "Verify",
                  desc: "Register your vehicle with its frame number to prove ownership.",
                },
                {
                  step: "03",
                  icon: "storefront",
                  title: "List",
                  desc: "Put your verified vehicle up for sale with photos and details.",
                },
                {
                  step: "04",
                  icon: "handshake",
                  title: "Trade",
                  desc: "Both buyer and seller confirm the exchange before ownership transfers.",
                },
              ].map((item) => (
                <div
                  key={item.step}
                  className="relative bg-surface-container-lowest rounded-2xl border border-outline-variant/20 p-6 text-center hover:shadow-lg transition-all group"
                >
                  <div className="text-5xl font-black text-primary/10 group-hover:text-primary/20 transition-colors absolute top-3 right-4">
                    {item.step}
                  </div>
                  <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
                    <span className="material-symbols-outlined text-primary text-2xl">
                      {item.icon}
                    </span>
                  </div>
                  <p className="font-bold text-on-surface mb-2">{item.title}</p>
                  <p className="text-sm text-on-surface-variant leading-relaxed">
                    {item.desc}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Team */}
        <section className="max-w-5xl mx-auto px-6 py-20">
          <div className="text-center mb-14">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 text-primary text-xs font-bold mb-4">
              <span className="material-symbols-outlined text-sm">groups</span>
              THE TEAM
            </div>
            <h2 className="text-3xl font-extrabold tracking-tight mb-3">
              Built With Passion
            </h2>
            <p className="text-on-surface-variant max-w-xl mx-auto">
              Secure Ride is a final year project, built to make a real
              difference in vehicle security.
            </p>
          </div>
          <div className="flex justify-center">
            {TEAM.map((member) => (
              <div
                key={member.name}
                className="bg-surface-container-lowest rounded-2xl border border-outline-variant/20 p-8 text-center hover:shadow-lg transition-all max-w-xs w-full"
              >
                <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                  <span className="material-symbols-outlined text-primary text-3xl">
                    {member.icon}
                  </span>
                </div>
                <p className="font-extrabold text-on-surface text-lg">
                  {member.name}
                </p>
                <p className="text-sm text-primary font-medium">
                  {member.role}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* CTA */}
        <section className="bg-gradient-to-r from-primary to-blue-600 py-16">
          <div className="max-w-3xl mx-auto px-6 text-center text-white">
            <h2 className="text-3xl font-extrabold tracking-tight mb-4">
              Ready to Secure Your Ride?
            </h2>
            <p className="text-white/70 mb-8 max-w-lg mx-auto">
              Join the community of verified vehicle owners. Register, verify,
              and trade with confidence.
            </p>
            <div className="flex items-center justify-center gap-4 flex-wrap">
              <Link
                to="/verify"
                className="px-8 py-3.5 bg-white text-primary rounded-xl font-bold hover:shadow-xl hover:shadow-black/20 transition-all inline-flex items-center gap-2"
              >
                <span className="material-symbols-outlined text-lg">
                  verified_user
                </span>
                Verify Your Vehicle
              </Link>
              <Link
                to="/buy"
                className="px-8 py-3.5 bg-white/15 text-white border border-white/30 rounded-xl font-bold hover:bg-white/25 transition-all inline-flex items-center gap-2"
              >
                <span className="material-symbols-outlined text-lg">
                  search
                </span>
                Browse Listings
              </Link>
            </div>
          </div>
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
