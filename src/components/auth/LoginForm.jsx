export default function LoginForm({ error, loading, onSubmit, onSwitchToRegister, onClose }) {
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm" onClick={onClose}>
      <div className="relative w-full max-w-md mx-4 bg-white rounded-2xl shadow-2xl p-8 animate-[fadeIn_0.2s_ease-out]" onClick={(e) => e.stopPropagation()}>
        <button onClick={onClose} className="absolute top-4 right-4 text-slate-400 hover:text-slate-700 transition-colors">
          <span className="material-symbols-outlined text-2xl">close</span>
        </button>
        <div className="text-center mb-8">
          <div className="text-2xl font-black tracking-tighter text-slate-900 mb-2">Secure Ride</div>
          <p className="text-on-surface-variant text-sm">Log in to your account</p>
        </div>
        {error && <div className="mb-4 px-4 py-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm">{error}</div>}
        <form onSubmit={onSubmit} className="space-y-5">
          <div>
            <label htmlFor="login-email" className="block text-sm font-semibold text-on-surface mb-1.5">Email</label>
            <input
              id="login-email" name="login-email" type="email" required placeholder="you@example.com"
              className="w-full px-4 py-3 rounded-xl border border-outline-variant/30 bg-surface-container-lowest text-on-surface placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-all"
            />
          </div>
          <div>
            <label htmlFor="login-password" className="block text-sm font-semibold text-on-surface mb-1.5">Password</label>
            <input
              id="login-password" name="login-password" type="password" required placeholder="••••••••"
              className="w-full px-4 py-3 rounded-xl border border-outline-variant/30 bg-surface-container-lowest text-on-surface placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-all"
            />
          </div>
          <button
            type="submit" disabled={loading}
            className="w-full py-3.5 bg-primary text-white rounded-xl font-bold text-lg hover:shadow-lg hover:shadow-primary/20 transition-all disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {loading ? "Logging In..." : "Log In"}
          </button>
        </form>
        <p className="text-center text-sm text-on-surface-variant mt-6">
          Don&apos;t have an account?{" "}
          <button type="button" onClick={onSwitchToRegister} className="text-primary font-semibold hover:underline">Sign Up</button>
        </p>
      </div>
    </div>
  );
}
