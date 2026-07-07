import { useState, useRef } from "react";
import { api } from "../../utils/api";
import { readImageAsDataUrl } from "../../utils/readImageFile";

export default function ChangesRequestedFlow({ changesRequested, onClose, onBack }) {
  const [resubmitLoading, setResubmitLoading] = useState(false);
  const [resubmitSuccess, setResubmitSuccess] = useState(false);
  const [resubmitError, setResubmitError] = useState("");
  const [newIdCardImage, setNewIdCardImage] = useState(null);
  const fileInputRef = useRef(null);

  const handleIdCardFile = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      setResubmitError("");
      setNewIdCardImage(await readImageAsDataUrl(file));
    } catch (err) {
      setResubmitError(err.message);
    }
  };

  const handleResubmit = async (e) => {
    e.preventDefault();
    setResubmitError("");
    setResubmitLoading(true);
    const form = e.target;
    try {
      const payload = {
        email: changesRequested.email,
        password: changesRequested.password,
        first_name: form["resubmit-first-name"].value.trim() || undefined,
        last_name: form["resubmit-last-name"].value.trim() || undefined,
        id_number: form["resubmit-id-number"].value.trim() || undefined,
        id_card_image: newIdCardImage || undefined,
      };
      await api("/auth/resubmit", { method: "POST", body: payload });
      setResubmitSuccess(true);
    } catch (err) { setResubmitError(err.message); }
    finally { setResubmitLoading(false); }
  };

  const overlay = "fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm";
  const panel = "relative w-full max-w-md mx-4 bg-white rounded-2xl shadow-2xl p-8 animate-[fadeIn_0.2s_ease-out]";

  if (resubmitSuccess) {
    return (
      <div className={overlay} onClick={onClose}>
        <div className={panel} onClick={(e) => e.stopPropagation()}>
          <button onClick={onClose} className="absolute top-4 right-4 text-slate-400 hover:text-slate-700 transition-colors">
            <span className="material-symbols-outlined text-2xl">close</span>
          </button>
          <div className="text-center py-4">
            <div className="w-16 h-16 rounded-full bg-amber-100 flex items-center justify-center mx-auto mb-5">
              <span className="material-symbols-outlined text-amber-600 text-3xl">hourglass_top</span>
            </div>
            <h2 className="text-xl font-bold text-on-surface mb-3">Registration Resubmitted</h2>
            <p className="text-sm text-on-surface-variant leading-relaxed mb-6">
              Your updated registration has been resubmitted for admin approval. The approval process may take up to 3 business days.
            </p>
            <button
              onClick={() => { setResubmitSuccess(false); setNewIdCardImage(null); onBack(); }}
              className="px-8 py-3 bg-primary text-white rounded-xl font-bold text-sm hover:shadow-lg hover:shadow-primary/20 transition-all"
            >
              Back to Login
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={overlay} onClick={onClose}>
      <div className={`${panel} max-h-[90vh] overflow-y-auto`} onClick={(e) => e.stopPropagation()}>
        <button onClick={onClose} className="absolute top-4 right-4 text-slate-400 hover:text-slate-700 transition-colors">
          <span className="material-symbols-outlined text-2xl">close</span>
        </button>
        <div className="text-center mb-6">
          <div className="w-14 h-14 rounded-full bg-amber-100 flex items-center justify-center mx-auto mb-3">
            <span className="material-symbols-outlined text-amber-600 text-2xl">edit_note</span>
          </div>
          <h2 className="text-xl font-bold text-on-surface mb-1">Changes Requested</h2>
          <p className="text-sm text-on-surface-variant">An admin reviewed your registration and requested changes.</p>
        </div>
        <div className="mb-5 px-4 py-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-sm">
          <div className="flex items-start gap-2">
            <span className="material-symbols-outlined text-amber-500 text-lg mt-0.5 flex-shrink-0">info</span>
            <div>
              <p className="font-semibold text-xs mb-0.5">Admin Feedback:</p>
              <p className="text-xs leading-relaxed">{changesRequested.reason}</p>
            </div>
          </div>
        </div>
        {resubmitError && <div className="mb-4 px-4 py-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm">{resubmitError}</div>}
        <p className="text-xs text-on-surface-variant mb-4">Update the fields below as needed. Leave fields empty to keep your original values.</p>
        <form onSubmit={handleResubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="resubmit-first-name" className="block text-sm font-semibold text-on-surface mb-1">First Name</label>
              <input id="resubmit-first-name" name="resubmit-first-name" type="text" placeholder="Leave empty to keep" className="w-full px-3 py-2.5 rounded-xl border border-outline-variant/30 bg-surface-container-lowest text-on-surface text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-all" />
            </div>
            <div>
              <label htmlFor="resubmit-last-name" className="block text-sm font-semibold text-on-surface mb-1">Last Name</label>
              <input id="resubmit-last-name" name="resubmit-last-name" type="text" placeholder="Leave empty to keep" className="w-full px-3 py-2.5 rounded-xl border border-outline-variant/30 bg-surface-container-lowest text-on-surface text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-all" />
            </div>
          </div>
          <div>
            <label htmlFor="resubmit-id-number" className="block text-sm font-semibold text-on-surface mb-1">ID Number</label>
            <input id="resubmit-id-number" name="resubmit-id-number" type="text" placeholder="Leave empty to keep" className="w-full px-3 py-2.5 rounded-xl border border-outline-variant/30 bg-surface-container-lowest text-on-surface text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-all" />
          </div>
          <div>
            <label className="block text-sm font-semibold text-on-surface mb-1">New ID Card Image</label>
            {newIdCardImage ? (
              <div className="relative rounded-xl overflow-hidden border border-outline-variant/30 group">
                <img src={newIdCardImage} alt="New ID Card" className="w-full h-32 object-cover" />
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                  <button type="button" onClick={() => fileInputRef.current?.click()} className="p-2 bg-white rounded-full shadow-lg hover:scale-110 transition-transform">
                    <span className="material-symbols-outlined text-primary text-xl">swap_horiz</span>
                  </button>
                  <button type="button" onClick={() => setNewIdCardImage(null)} className="p-2 bg-white rounded-full shadow-lg hover:scale-110 transition-transform">
                    <span className="material-symbols-outlined text-red-500 text-xl">delete</span>
                  </button>
                </div>
              </div>
            ) : (
              <div onClick={() => fileInputRef.current?.click()} className="border-2 border-dashed border-outline-variant/30 rounded-xl flex flex-col items-center justify-center text-center cursor-pointer hover:border-primary/40 hover:bg-primary/[0.02] transition-all py-5 px-4">
                <span className="material-symbols-outlined text-primary/60 text-2xl mb-1">badge</span>
                <p className="text-xs font-medium text-on-surface-variant">Click to upload a new ID card image</p>
                <p className="text-[10px] text-on-surface-variant/70 mt-0.5">Leave empty to keep your original image</p>
              </div>
            )}
            <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleIdCardFile} />
          </div>
          <button type="submit" disabled={resubmitLoading} className="w-full py-3 bg-primary text-white rounded-xl font-bold text-sm hover:shadow-lg hover:shadow-primary/20 transition-all disabled:opacity-60 disabled:cursor-not-allowed">
            {resubmitLoading ? "Submitting..." : "Resubmit Registration"}
          </button>
        </form>
        <button type="button" onClick={onBack} className="w-full mt-3 py-2.5 text-on-surface-variant text-sm font-medium hover:text-on-surface transition-colors">
          Back to Login
        </button>
      </div>
    </div>
  );
}
