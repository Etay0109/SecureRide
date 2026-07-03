import { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { getStoredUser } from "../utils/auth";

export default function BlockedBanner() {
  const [user, setUser] = useState(getStoredUser);
  const [blocked, setBlocked] = useState(() => getStoredUser()?.blocked === true);
  const [reason, setReason] = useState(() => getStoredUser()?.blocked_reason || "");
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token || !user) return;

    fetch("/api/auth/me", { headers: { Authorization: `Bearer ${token}` } })
      .then(async (r) => {
        if (!r.ok) {
          // Cannot determine server state — keep whatever is in localStorage as-is.
          return;
        }
        const data = await r.json();
        if (data.blocked) {
          setBlocked(true);
          setReason(data.blocked_reason || "");
          const stored = getStoredUser();
          if (stored) {
            stored.blocked = true;
            stored.blocked_reason = data.blocked_reason;
            localStorage.setItem("user", JSON.stringify(stored));
          }
        } else {
          setBlocked(false);
          setReason("");
          const stored = getStoredUser();
          if (stored && stored.blocked) {
            stored.blocked = false;
            stored.blocked_reason = null;
            localStorage.setItem("user", JSON.stringify(stored));
          }
        }
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    function handleBlocked(e) {
      setBlocked(true);
      setReason(e.detail?.reason || "Your account has been blocked.");
      const stored = getStoredUser();
      if (stored) {
        stored.blocked = true;
        stored.blocked_reason = e.detail?.reason || "";
        localStorage.setItem("user", JSON.stringify(stored));
      }
    }
    window.addEventListener("accountBlocked", handleBlocked);
    return () => window.removeEventListener("accountBlocked", handleBlocked);
  }, []);

  useEffect(() => {
    if (!blocked) return;
    const interval = setInterval(() => {
      if (!localStorage.getItem("token")) {
        setBlocked(false);
        setReason("");
      }
    }, 500);
    return () => clearInterval(interval);
  }, [blocked]);

  useEffect(() => {
    if (!blocked) return;
    if (location.pathname !== "/") {
      navigate("/", { replace: true });
    }
  }, [blocked, location.pathname, navigate]);

  if (!blocked) return null;

  return (
    <div className="fixed top-20 left-0 right-0 z-[100]">
      <div className="max-w-screen-2xl mx-auto px-4">
        <div className="bg-red-600 text-white rounded-xl shadow-xl px-5 py-3 flex items-center gap-3">
          <span className="material-symbols-outlined text-2xl flex-shrink-0">gpp_bad</span>
          <div className="flex-1 min-w-0">
            <p className="font-bold text-sm">Account Blocked</p>
            <p className="text-xs text-red-100 truncate">
              {reason || "Your account has been suspended. An admin may contact you."}
            </p>
          </div>
          <button
            onClick={() => window.dispatchEvent(new CustomEvent("openChat"))}
            className="flex-shrink-0 px-3 py-1.5 bg-white/20 hover:bg-white/30 rounded-lg text-xs font-bold transition-all flex items-center gap-1"
          >
            <span className="material-symbols-outlined text-sm">chat</span>
            Open Chat
          </button>
        </div>
      </div>
    </div>
  );
}
