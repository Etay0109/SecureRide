import { useRef } from "react";

const inputCls = "w-full px-4 py-3 rounded-xl border border-outline-variant/30 bg-surface-container-lowest text-on-surface placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-all";

export default function RegistrationForm({ error, loading, onSubmit, onSwitchToLogin, onClose, idCardImage, setIdCardImage }) {
  const fileInputRef = useRef(null);

  const handleIdCardFile = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) { return; }
    const reader = new FileReader();
    reader.onload = (ev) => setIdCardImage(ev.target.result);
    reader.readAsDataURL(file);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm" onClick={onClose}>
      <div className="relative w-full max-w-md mx-4 bg-white rounded-2xl shadow-2xl p-8 animate-[fadeIn_0.2s_ease-out] max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <button onClick={onClose} className="absolute top-4 right-4 text-slate-400 hover:text-slate-700 transition-colors">
          <span className="material-symbols-outlined text-2xl">close</span>
        </button>
        <div className="text-center mb-8">
          <div className="text-2xl font-black tracking-tighter text-slate-900 mb-2">Secure Ride</div>
          <p className="text-on-surface-variant text-sm">Create your account</p>
        </div>
        {error && <div className="mb-4 px-4 py-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm">{error}</div>}
        <form onSubmit={onSubmit} className="space-y-5">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="register-first-name" className="block text-sm font-semibold text-on-surface mb-1.5">First Name</label>
              <input id="register-first-name" name="register-first-name" type="text" required placeholder="John" className={inputCls} />
            </div>
            <div>
              <label htmlFor="register-last-name" className="block text-sm font-semibold text-on-surface mb-1.5">Last Name</label>
              <input id="register-last-name" name="register-last-name" type="text" required placeholder="Doe" className={inputCls} />
            </div>
          </div>
          <div>
            <label htmlFor="register-id-number" className="block text-sm font-semibold text-on-surface mb-1.5">
              ID Number <span className="text-red-500">*</span>
            </label>
            <input id="register-id-number" name="register-id-number" type="text" required placeholder="Enter your ID number" className={inputCls} />
          </div>
          <div>
            <label className="block text-sm font-semibold text-on-surface mb-1.5">
              ID Card Image <span className="text-red-500">*</span>
            </label>
            {idCardImage ? (
              <div className="relative rounded-xl overflow-hidden border border-outline-variant/30 group">
                <img src={idCardImage} alt="ID Card Preview" className="w-full h-36 object-cover" />
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                  <button type="button" onClick={() => fileInputRef.current?.click()} className="p-2 bg-white rounded-full shadow-lg hover:scale-110 transition-transform">
                    <span className="material-symbols-outlined text-primary text-xl">swap_horiz</span>
                  </button>
                  <button type="button" onClick={() => setIdCardImage(null)} className="p-2 bg-white rounded-full shadow-lg hover:scale-110 transition-transform">
                    <span className="material-symbols-outlined text-red-500 text-xl">delete</span>
                  </button>
                </div>
              </div>
            ) : (
              <div onClick={() => fileInputRef.current?.click()} className="border-2 border-dashed border-outline-variant/30 rounded-xl flex flex-col items-center justify-center text-center cursor-pointer hover:border-primary/40 hover:bg-primary/[0.02] transition-all py-6 px-4">
                <span className="material-symbols-outlined text-primary/60 text-3xl mb-1.5">badge</span>
                <p className="text-sm font-medium text-on-surface-variant">Click to upload your ID card</p>
                <p className="text-xs text-on-surface-variant/70 mt-0.5">PNG, JPG up to 10MB</p>
              </div>
            )}
            <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleIdCardFile} />
          </div>
          <div>
            <label htmlFor="register-email" className="block text-sm font-semibold text-on-surface mb-1.5">Email</label>
            <input id="register-email" name="register-email" type="email" required placeholder="you@example.com" className={inputCls} />
          </div>
          <div>
            <label htmlFor="register-password" className="block text-sm font-semibold text-on-surface mb-1.5">Password</label>
            <input id="register-password" name="register-password" type="password" required placeholder="••••••••" className={inputCls} />
          </div>
          <div>
            <label htmlFor="register-confirm-password" className="block text-sm font-semibold text-on-surface mb-1.5">Confirm Password</label>
            <input id="register-confirm-password" name="register-confirm-password" type="password" required placeholder="••••••••" className={inputCls} />
          </div>
          <button type="submit" disabled={loading} className="w-full py-3.5 bg-primary text-white rounded-xl font-bold text-lg hover:shadow-lg hover:shadow-primary/20 transition-all disabled:opacity-60 disabled:cursor-not-allowed">
            {loading ? "Submitting..." : "Create Account"}
          </button>
        </form>
        <p className="text-center text-sm text-on-surface-variant mt-6">
          Already have an account?{" "}
          <button type="button" onClick={onSwitchToLogin} className="text-primary font-semibold hover:underline">Log In</button>
        </p>
      </div>
    </div>
  );
}
