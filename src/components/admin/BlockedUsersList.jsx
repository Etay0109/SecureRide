import { useState, useEffect } from "react";
import { api } from "../../utils/api";

export default function BlockedUsersList({ activeChatUserId, onSelectUser, onCountChange, onUnblocked }) {
  const [blockedUsers, setBlockedUsers] = useState([]);
  const [blockedLoading, setBlockedLoading] = useState(true);

  useEffect(() => {
    fetchBlockedUsers();
  }, []);

  async function fetchBlockedUsers() {
    try {
      const data = await api("/admin/blocked-users");
      setBlockedUsers(data);
      onCountChange?.(data.length);
    } catch { /* ignore */ }
    finally { setBlockedLoading(false); }
  }

  async function handleUnblock(userId) {
    if (!confirm("Are you sure you want to unblock this user?")) return;
    try {
      await api(`/admin/users/${userId}/unblock`, { method: "PUT" });
      setBlockedUsers((prev) => {
        const next = prev.filter((u) => u.id !== userId);
        onCountChange?.(next.length);
        return next;
      });
      onUnblocked?.(userId);
    } catch (err) { alert(err.message); }
  }

  async function handleKeepBlocked(userId) {
    try {
      await api(`/admin/users/${userId}/block`, { method: "PUT" });
      alert("User remains blocked.");
    } catch (err) { alert(err.message); }
  }

  return (
    <div className="bg-surface-container-lowest rounded-xl border border-outline-variant/20 overflow-hidden">
      <div className="px-5 py-4 border-b border-outline-variant/20 flex items-center justify-between">
        <h2 className="font-bold text-on-surface flex items-center gap-2">
          <span className="material-symbols-outlined text-red-500 text-lg">block</span>Blocked Users
        </h2>
        <span className="text-xs font-bold bg-red-100 text-red-700 px-2.5 py-1 rounded-full">{blockedUsers.length}</span>
      </div>
      {blockedLoading ? (
        <div className="p-8 text-center text-on-surface-variant text-sm">Loading...</div>
      ) : blockedUsers.length === 0 ? (
        <div className="p-8 text-center">
          <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-3">
            <span className="material-symbols-outlined text-green-600 text-2xl">check_circle</span>
          </div>
          <p className="font-semibold text-on-surface text-sm">No blocked users</p>
          <p className="text-xs text-on-surface-variant mt-1">All clear — no accounts are currently blocked.</p>
        </div>
      ) : (
        <div className="divide-y divide-outline-variant/10 max-h-[60vh] overflow-y-auto">
          {blockedUsers.map((bu) => (
            <div
              key={bu.id}
              className={`p-4 hover:bg-surface-container-high/50 transition-colors cursor-pointer ${activeChatUserId === bu.id ? "bg-primary/5 border-l-4 border-l-primary" : ""}`}
              onClick={() => onSelectUser(bu)}
            >
              <div className="flex items-center gap-3 mb-2">
                <div className="w-9 h-9 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
                  <span className="material-symbols-outlined text-red-500 text-lg">person_off</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-on-surface text-sm truncate">{bu.first_name} {bu.last_name}</p>
                  <p className="text-xs text-on-surface-variant truncate">{bu.email}</p>
                </div>
              </div>
              {bu.blocked_reason && (
                <div className="flex items-start gap-1.5 px-3 py-2 rounded-lg bg-red-50 border border-red-100 mb-2">
                  <span className="material-symbols-outlined text-red-400 text-sm mt-0.5">warning</span>
                  <p className="text-xs text-red-700 leading-relaxed">{bu.blocked_reason}</p>
                </div>
              )}
              <div className="flex gap-2">
                <button
                  onClick={(e) => { e.stopPropagation(); handleUnblock(bu.id); }}
                  className="flex-1 py-1.5 bg-green-600 text-white rounded-lg font-bold text-xs hover:bg-green-700 transition-all flex items-center justify-center gap-1"
                >
                  <span className="material-symbols-outlined text-sm">lock_open</span>Unblock
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); handleKeepBlocked(bu.id); }}
                  className="flex-1 py-1.5 bg-white text-red-600 border border-red-200 rounded-lg font-bold text-xs hover:bg-red-50 transition-all flex items-center justify-center gap-1"
                >
                  <span className="material-symbols-outlined text-sm">block</span>Keep Blocked
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
