import { Link } from "react-router-dom";

import NotificationBell from "../NotificationBell";

const ACTIVE = "text-blue-700 font-bold border-b-2 border-blue-700 pb-1 tracking-tight";
const DEFAULT = "text-slate-500 hover:text-slate-900 transition-colors tracking-tight";

export default function PageHeader({ user, onLogout, onOpenLogin, onOpenRegister, activePage }) {
  return (
    <nav className="fixed top-0 w-full z-50 bg-white/80 backdrop-blur-lg shadow-[0_20px_40px_rgba(25,28,29,0.05)]">
      <div className="flex justify-between items-center px-8 h-20 max-w-screen-2xl mx-auto">
        <Link to="/" className="text-2xl font-black tracking-tighter text-slate-900">
          Secure Ride
        </Link>

        <div className="hidden md:flex items-center gap-8">
          <Link to="/" className={activePage === "home" ? ACTIVE : DEFAULT}>
            Home
          </Link>
          {user && (
            <>
              <Link to="/buy" className={activePage === "buy" ? ACTIVE : DEFAULT}>
                Buy
              </Link>
              <Link to="/sell" className={activePage === "sell" ? ACTIVE : DEFAULT}>
                Sell
              </Link>
              <Link to="/verify" className={activePage === "verify" ? ACTIVE : DEFAULT}>
                Verify Ownership
              </Link>
            </>
          )}
          <Link to="/about" className={activePage === "about" ? ACTIVE : DEFAULT}>
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
              onClick={onLogout}
              className="px-4 py-2 text-slate-500 hover:text-red-600 font-medium text-sm transition-all"
            >
              Log Out
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-4">
            <button
              onClick={onOpenLogin}
              className="px-6 py-2 text-slate-500 hover:text-slate-900 font-medium transition-all"
            >
              Log In
            </button>
            <button
              onClick={onOpenRegister}
              className="px-6 py-2.5 bg-primary text-white rounded-xl font-bold hover:shadow-lg hover:shadow-primary/20 transition-all"
            >
              Sign Up
            </button>
          </div>
        )}
      </div>
    </nav>
  );
}
