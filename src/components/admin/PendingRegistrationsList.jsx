import { useState, useEffect } from "react";

export default function PendingRegistrationsList({ token, onImageView, onCountChange }) {
  const [pendingUsers, setPendingUsers] = useState([]);
  const [pendingLoading, setPendingLoading] = useState(true);
  const [rejectTarget, setRejectTarget] = useState(null);
  const [rejectMode, setRejectMode] = useState(null);
  const [rejectReason, setRejectReason] = useState("");

  useEffect(() => {
    fetchPendingUsers();
  }, []);

  async function fetchPendingUsers() {
    try {
      const res = await fetch("/api/admin/pending-registrations", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setPendingUsers(data);
        onCountChange?.(data.length);
      }
    } catch { /* ignore */ }
    finally { setPendingLoading(false); }
  }

  async function handleApprove(userId) {
    if (!confirm("Approve this registration?")) return;
    try {
      const res = await fetch(`/api/admin/registrations/${userId}/approve`, {
        method: "PUT",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Failed to approve");
      setPendingUsers((prev) => {
        const next = prev.filter((u) => u.id !== userId);
        onCountChange?.(next.length);
        return next;
      });
    } catch (err) { alert(err.message); }
  }

  function openRejectDialog(userId) { setRejectTarget(userId); setRejectMode(null); setRejectReason(""); }

  async function handleRejectAction() {
    if (!rejectReason.trim()) { alert("Please enter a reason"); return; }
    const endpoint = rejectMode === "block"
      ? `/api/admin/registrations/${rejectTarget}/permanently-block`
      : `/api/admin/registrations/${rejectTarget}/request-changes`;
    try {
      const res = await fetch(endpoint, {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ reason: rejectReason.trim() }),
      });
      if (!res.ok) throw new Error("Failed to process rejection");
      setPendingUsers((prev) => {
        const next = prev.filter((u) => u.id !== rejectTarget);
        onCountChange?.(next.length);
        return next;
      });
      setRejectTarget(null); setRejectMode(null); setRejectReason("");
    } catch (err) { alert(err.message); }
  }

  return (
    <>
      {pendingLoading ? (
        <div className="p-8 text-center text-on-surface-variant text-sm">Loading...</div>
      ) : pendingUsers.length === 0 ? (
        <div className="bg-surface-container-lowest rounded-xl border border-outline-variant/20 p-12 text-center">
          <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
            <span className="material-symbols-outlined text-green-600 text-3xl">check_circle</span>
          </div>
          <p className="font-bold text-on-surface mb-1">No pending registrations</p>
          <p className="text-sm text-on-surface-variant">All registration requests have been reviewed.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {pendingUsers.map((pu) => (
            <div key={pu.id} className="bg-surface-container-lowest rounded-xl border border-outline-variant/20 overflow-hidden hover:shadow-lg hover:shadow-primary/5 transition-all">
              {pu.id_card_image && (
                <div className="h-40 bg-surface-container-high cursor-pointer relative group" onClick={() => onImageView(pu.id_card_image)}>
                  <img src={pu.id_card_image} alt="ID Card" className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <span className="material-symbols-outlined text-white text-3xl">zoom_in</span>
                  </div>
                </div>
              )}
              <div className="p-5">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center flex-shrink-0">
                    <span className="material-symbols-outlined text-amber-600 text-xl">person</span>
                  </div>
                  <div className="min-w-0">
                    <p className="font-bold text-on-surface text-sm truncate">{pu.first_name} {pu.last_name}</p>
                    <p className="text-xs text-on-surface-variant truncate">{pu.email}</p>
                  </div>
                </div>
                <div className="space-y-1.5 mb-4">
                  <div className="flex items-center gap-2 text-xs text-on-surface-variant">
                    <span className="material-symbols-outlined text-sm">badge</span>
                    <span>ID: {pu.id_number}</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-on-surface-variant">
                    <span className="material-symbols-outlined text-sm">calendar_today</span>
                    <span>Registered: {new Date(pu.created_at).toLocaleDateString()}</span>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => handleApprove(pu.id)} className="flex-1 py-2 bg-green-600 text-white rounded-lg font-bold text-xs hover:bg-green-700 transition-all flex items-center justify-center gap-1">
                    <span className="material-symbols-outlined text-sm">check</span>Approve
                  </button>
                  <button onClick={() => openRejectDialog(pu.id)} className="flex-1 py-2 bg-white text-red-600 border border-red-200 rounded-lg font-bold text-xs hover:bg-red-50 hover:border-red-300 transition-all flex items-center justify-center gap-1">
                    <span className="material-symbols-outlined text-sm">close</span>Reject
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {rejectTarget && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm" onClick={() => setRejectTarget(null)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 p-6 animate-[fadeIn_0.2s_ease-out]" onClick={(e) => e.stopPropagation()}>
            {!rejectMode ? (
              <>
                <h3 className="text-lg font-bold text-on-surface mb-1 flex items-center gap-2">
                  <span className="material-symbols-outlined text-red-500">gavel</span>Reject Registration
                </h3>
                <p className="text-sm text-on-surface-variant mb-5">Choose how to handle this rejection:</p>
                <div className="space-y-3">
                  <button onClick={() => setRejectMode("changes")} className="w-full p-4 rounded-xl border-2 border-amber-200 bg-amber-50/50 hover:bg-amber-50 hover:border-amber-300 transition-all text-left">
                    <div className="flex items-center gap-3 mb-1">
                      <span className="material-symbols-outlined text-amber-600">edit_note</span>
                      <span className="font-bold text-on-surface text-sm">Request Changes</span>
                    </div>
                    <p className="text-xs text-on-surface-variant pl-9">The user can update their details and resubmit for approval.</p>
                  </button>
                  <button onClick={() => setRejectMode("block")} className="w-full p-4 rounded-xl border-2 border-red-200 bg-red-50/50 hover:bg-red-50 hover:border-red-300 transition-all text-left">
                    <div className="flex items-center gap-3 mb-1">
                      <span className="material-symbols-outlined text-red-600">block</span>
                      <span className="font-bold text-on-surface text-sm">Permanently Block</span>
                    </div>
                    <p className="text-xs text-on-surface-variant pl-9">The user will never be able to access the website.</p>
                  </button>
                </div>
                <button onClick={() => setRejectTarget(null)} className="w-full mt-4 py-2.5 bg-surface-container-high text-on-surface rounded-xl font-bold text-sm hover:bg-surface-container-highest transition-all">Cancel</button>
              </>
            ) : (
              <>
                <h3 className="text-lg font-bold text-on-surface mb-1 flex items-center gap-2">
                  <span className={`material-symbols-outlined ${rejectMode === "block" ? "text-red-500" : "text-amber-500"}`}>{rejectMode === "block" ? "block" : "edit_note"}</span>
                  {rejectMode === "block" ? "Permanently Block User" : "Request Changes"}
                </h3>
                <p className="text-sm text-on-surface-variant mb-4">
                  {rejectMode === "block" ? "This user will be permanently blocked. Please provide a reason." : "The user will be asked to update their registration. Please describe what needs to be fixed."}
                </p>
                <textarea
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  placeholder={rejectMode === "block" ? "Enter the blocking reason..." : "e.g. The ID image is blurry, please upload a clearer photo..."}
                  rows={3}
                  className={`w-full px-4 py-3 rounded-xl border border-outline-variant/30 bg-surface-container-lowest text-on-surface text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 transition-all resize-none ${rejectMode === "block" ? "focus:ring-red-400/40 focus:border-red-400" : "focus:ring-amber-400/40 focus:border-amber-400"}`}
                  autoFocus
                />
                <div className="flex gap-3 mt-4">
                  <button onClick={() => setRejectMode(null)} className="flex-1 py-2.5 bg-surface-container-high text-on-surface rounded-xl font-bold text-sm hover:bg-surface-container-highest transition-all">Back</button>
                  <button onClick={handleRejectAction} className={`flex-1 py-2.5 text-white rounded-xl font-bold text-sm transition-all ${rejectMode === "block" ? "bg-red-600 hover:bg-red-700" : "bg-amber-600 hover:bg-amber-700"}`}>
                    {rejectMode === "block" ? "Permanently Block" : "Request Changes"}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}
