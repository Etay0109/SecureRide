export default function ProtocolSection() {
  return (
    <section className="py-32 bg-surface-container-low">
      <div className="max-w-7xl mx-auto px-8">
        <div className="text-center mb-24">
          <h2 className="text-4xl font-extrabold tracking-tight mb-4 text-on-surface">Precision Protocols</h2>
          <p className="text-on-surface-variant text-lg">Three steps to absolute ownership certainty.</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-16 relative">
          <div className="group relative">
            <div className="mb-8 w-16 h-16 bg-surface-container-lowest rounded-2xl flex items-center justify-center shadow-sm group-hover:shadow-xl group-hover:bg-primary transition-all duration-300">
              <span className="material-symbols-outlined text-primary group-hover:text-white text-3xl">app_registration</span>
            </div>
            <h3 className="text-2xl font-bold mb-4 text-on-surface">1. Register</h3>
            <p className="text-on-surface-variant leading-relaxed">
              Link your vehicle&apos;s frame number to your profile. Our encrypted database secures your claim to the asset.
            </p>
            <div className="absolute top-8 left-full w-full h-[2px] bg-gradient-to-r from-primary/20 to-transparent hidden md:block" />
          </div>
          <div className="group relative">
            <div className="mb-8 w-16 h-16 bg-surface-container-lowest rounded-2xl flex items-center justify-center shadow-sm group-hover:shadow-xl group-hover:bg-primary transition-all duration-300">
              <span className="material-symbols-outlined text-primary group-hover:text-white text-3xl">verified_user</span>
            </div>
            <h3 className="text-2xl font-bold mb-4 text-on-surface">2. Verify</h3>
            <p className="text-on-surface-variant leading-relaxed">
              Buyers can check the ownership status instantly using our secure registry, ensuring the vehicle isn&apos;t flagged.
            </p>
            <div className="absolute top-8 left-full w-full h-[2px] bg-gradient-to-r from-primary/20 to-transparent hidden md:block" />
          </div>
          <div className="group">
            <div className="mb-8 w-16 h-16 bg-surface-container-lowest rounded-2xl flex items-center justify-center shadow-sm group-hover:shadow-xl group-hover:bg-primary transition-all duration-300">
              <span className="material-symbols-outlined text-primary group-hover:text-white text-3xl">move_up</span>
            </div>
            <h3 className="text-2xl font-bold mb-4 text-on-surface">3. Transfer</h3>
            <p className="text-on-surface-variant leading-relaxed">
              Securely hand over the digital title upon sale. The immutable record updates in real-time, completing the chain.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
