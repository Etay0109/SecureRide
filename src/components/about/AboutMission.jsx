const VALUES = [
  {
    icon: "verified_user",
    title: "Trust & Verification",
    description: "Every vehicle on our platform goes through a verified ownership process, ensuring buyers and sellers can transact with confidence.",
  },
  {
    icon: "shield",
    title: "Theft Protection",
    description: "Our stolen-vehicle detection system automatically flags suspicious registrations and protects the community from fraud.",
  },
  {
    icon: "handshake",
    title: "Secure Trades",
    description: "Our dual-confirmation trade system ensures both parties agree before ownership is transferred - no surprises.",
  },
  {
    icon: "support_agent",
    title: "Admin Support",
    description: "A dedicated admin team monitors the platform, investigates reports, and communicates directly with users when issues arise.",
  },
];

export default function AboutMission() {
  return (
    <section className="max-w-5xl mx-auto px-6 py-20">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 text-primary text-xs font-bold mb-4">
            <span className="material-symbols-outlined text-sm">flag</span>OUR MISSION
          </div>
          <h2 className="text-3xl font-extrabold tracking-tight mb-4">Eliminate Vehicle Theft Through Technology</h2>
          <p className="text-on-surface-variant leading-relaxed mb-4">
            Every year, thousands of electric scooters, bicycles, and e-bikes are stolen. Victims often have no way to prove ownership or recover their property.
          </p>
          <p className="text-on-surface-variant leading-relaxed">
            Secure Ride creates a verified digital record of ownership. When a stolen vehicle is flagged in our system and someone attempts to register it, we automatically block their account and alert our admin team - stopping theft in its tracks.
          </p>
        </div>
        <div className="grid grid-cols-2 gap-4">
          {VALUES.map((v, i) => (
            <div key={i} className="bg-surface-container-lowest rounded-2xl border border-outline-variant/20 p-5 hover:shadow-lg hover:border-primary/30 transition-all">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center mb-3">
                <span className="material-symbols-outlined text-primary text-xl">{v.icon}</span>
              </div>
              <p className="font-bold text-sm text-on-surface mb-1">{v.title}</p>
              <p className="text-xs text-on-surface-variant leading-relaxed">{v.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
