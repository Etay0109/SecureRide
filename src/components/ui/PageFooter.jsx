export default function PageFooter() {
  return (
    <footer className="bg-surface-container-lowest border-t border-outline-variant/20 py-6 px-8">
      <div className="max-w-screen-2xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-on-surface-variant">
        <div className="font-black text-on-surface tracking-tighter">
          Secure Ride
        </div>
        <p>&copy; 2026 Secure Ride. Precision Ownership Verification.</p>
        <div className="flex gap-6">
          <a href="#" className="hover:text-primary transition-colors">
            Privacy Policy
          </a>
          <a href="#" className="hover:text-primary transition-colors">
            Terms of Service
          </a>
          <a href="#" className="hover:text-primary transition-colors">
            Contact Support
          </a>
        </div>
      </div>
    </footer>
  );
}
