import { Link } from "react-router-dom";
import PageHeader from "../components/ui/PageHeader";
import PageFooter from "../components/ui/PageFooter";
import AboutMission from "../components/about/AboutMission";
import AboutHowItWorks from "../components/about/AboutHowItWorks";

const TEAM = [
  { name: "Etay Zerachowitz", role: "Founder & Backend Developer", icon: "business_center" },
  { name: "Ido Ben Bassat", role: "Founder & Frontend Developer", icon: "code" },
];

export default function AboutPage() {
  return (
    <div className="min-h-screen flex flex-col bg-surface text-on-surface antialiased">
      <PageHeader activePage="about" />
      <main className="flex-1 pt-20">
        <section className="relative bg-gradient-to-br from-slate-900 via-slate-800 to-primary/90 text-white overflow-hidden">
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-10 left-10 w-72 h-72 bg-primary rounded-full blur-3xl" />
            <div className="absolute bottom-10 right-10 w-96 h-96 bg-blue-400 rounded-full blur-3xl" />
          </div>
          <div className="relative max-w-4xl mx-auto px-6 py-24 text-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 text-sm font-medium mb-6">
              <span className="material-symbols-outlined text-base">info</span>Our Story
            </div>
            <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight mb-6 leading-tight">
              Making Vehicle Ownership<br />
              <span className="text-primary-light bg-gradient-to-r from-blue-300 to-cyan-300 bg-clip-text text-transparent">Safe &amp; Transparent</span>
            </h1>
            <p className="text-lg text-white/70 max-w-2xl mx-auto leading-relaxed">
              Secure Ride was created to solve a real problem - verifying vehicle ownership for electric scooters, bicycles, and e-bikes. We believe that every rider deserves to know their vehicle is legitimately theirs, and every buyer deserves peace of mind.
            </p>
          </div>
        </section>

        <AboutMission />
        <AboutHowItWorks />

        <section className="max-w-5xl mx-auto px-6 py-20">
          <div className="text-center mb-14">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 text-primary text-xs font-bold mb-4">
              <span className="material-symbols-outlined text-sm">groups</span>THE TEAM
            </div>
            <h2 className="text-3xl font-extrabold tracking-tight mb-3">Built With Passion</h2>
            <p className="text-on-surface-variant max-w-xl mx-auto">Secure Ride is a final year project, built to make a real difference in vehicle security.</p>
          </div>
          <div className="flex justify-center">
            {TEAM.map((member) => (
              <div key={member.name} className="bg-surface-container-lowest rounded-2xl border border-outline-variant/20 p-8 text-center hover:shadow-lg transition-all max-w-xs w-full">
                <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                  <span className="material-symbols-outlined text-primary text-3xl">{member.icon}</span>
                </div>
                <p className="font-extrabold text-on-surface text-lg">{member.name}</p>
                <p className="text-sm text-primary font-medium">{member.role}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="bg-gradient-to-r from-primary to-blue-600 py-16">
          <div className="max-w-3xl mx-auto px-6 text-center text-white">
            <h2 className="text-3xl font-extrabold tracking-tight mb-4">Ready to Secure Your Ride?</h2>
            <p className="text-white/70 mb-8 max-w-lg mx-auto">Join the community of verified vehicle owners. Register, verify, and trade with confidence.</p>
            <div className="flex items-center justify-center gap-4 flex-wrap">
              <Link to="/verify" className="px-8 py-3.5 bg-white text-primary rounded-xl font-bold hover:shadow-xl hover:shadow-black/20 transition-all inline-flex items-center gap-2">
                <span className="material-symbols-outlined text-lg">verified_user</span>Verify Your Vehicle
              </Link>
              <Link to="/buy" className="px-8 py-3.5 bg-white/15 text-white border border-white/30 rounded-xl font-bold hover:bg-white/25 transition-all inline-flex items-center gap-2">
                <span className="material-symbols-outlined text-lg">search</span>Browse Listings
              </Link>
            </div>
          </div>
        </section>
      </main>
      <PageFooter />
    </div>
  );
}
