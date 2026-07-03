const STEPS = [
  { step: "01", icon: "app_registration", title: "Register", desc: "Create your account and join the Secure Ride community." },
  { step: "02", icon: "verified_user", title: "Verify", desc: "Register your vehicle with its frame number to prove ownership." },
  { step: "03", icon: "storefront", title: "List", desc: "Put your verified vehicle up for sale with photos and details." },
  { step: "04", icon: "handshake", title: "Trade", desc: "Both buyer and seller confirm the exchange before ownership transfers." },
];

export default function AboutHowItWorks() {
  return (
    <section className="bg-surface-container-high/30 py-20">
      <div className="max-w-5xl mx-auto px-6">
        <div className="text-center mb-14">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 text-primary text-xs font-bold mb-4">
            <span className="material-symbols-outlined text-sm">route</span>HOW IT WORKS
          </div>
          <h2 className="text-3xl font-extrabold tracking-tight mb-3">Simple, Secure Process</h2>
          <p className="text-on-surface-variant max-w-xl mx-auto">From registration to trade - every step is designed with safety in mind.</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {STEPS.map((item) => (
            <div key={item.step} className="relative bg-surface-container-lowest rounded-2xl border border-outline-variant/20 p-6 text-center hover:shadow-lg transition-all group">
              <div className="text-5xl font-black text-primary/10 group-hover:text-primary/20 transition-colors absolute top-3 right-4">{item.step}</div>
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
                <span className="material-symbols-outlined text-primary text-2xl">{item.icon}</span>
              </div>
              <p className="font-bold text-on-surface mb-2">{item.title}</p>
              <p className="text-sm text-on-surface-variant leading-relaxed">{item.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
