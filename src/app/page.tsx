import TripWizard from "@/components/TripWizard";
import { UserButton, SignedIn, SignedOut, SignInButton } from "@clerk/nextjs";
import { PlaneTakeoff, Globe, MapPin } from "lucide-react";
import HeroBackground from "@/components/HeroBackground";

export default function Home() {
  return (
    <main className="relative flex flex-col items-center justify-center min-h-screen px-4 overflow-hidden">
      {/* Background Slideshow */}
      <HeroBackground />

      <nav className="fixed top-0 w-full z-50 p-6 flex justify-between items-center backdrop-blur-sm">
        <div className="flex items-center gap-2">
          <PlaneTakeoff className="h-8 w-8 text-cyan-400" />
          <span className="text-xl font-bold tracking-tight text-white/90">Travelera</span>
        </div>
        <div className="flex items-center gap-4">
          <SignedIn>
            <UserButton afterSignOutUrl="/" />
          </SignedIn>
          <SignedOut>
            <SignInButton mode="modal">
              <button className="px-4 py-2 rounded-full bg-indigo-600/80 hover:bg-indigo-600 transition-colors text-white text-sm font-medium backdrop-blur-md border border-white/10">
                Sign In
              </button>
            </SignInButton>
          </SignedOut>
        </div>
      </nav>

      <section className="relative z-10 w-full max-w-5xl text-center space-y-12 pt-20">
        <div className="space-y-6">
          <h1 className="text-5xl md:text-8xl font-black tracking-tighter text-white drop-shadow-2xl">
            Your Next Path, <br />
            <span className="bg-gradient-to-r from-cyan-300 via-blue-500 to-purple-600 bg-clip-text text-transparent animate-text-gradient">
              Defined by AI
            </span>
          </h1>
          <p className="text-slate-200 text-lg md:text-xl max-w-2xl mx-auto drop-shadow-md">
            Experience the future of travel planning. Tell us where, when, and how you want to roam.
            We&apos;ll handle the rest.
          </p>
        </div>

        <div className="w-full relative z-30">
          <TripWizard />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 pt-12 relative z-10">
          <div className="p-6 rounded-2xl bg-black/40 border border-white/10 backdrop-blur-md hover:bg-black/50 transition-colors">
            <Globe className="h-10 w-10 text-cyan-400 mb-4 mx-auto" />
            <h3 className="text-lg font-bold mb-2 text-white">Global Insights</h3>
            <p className="text-slate-300 text-sm">Deep cultural and currency data for every country.</p>
          </div>
          <div className="p-6 rounded-2xl bg-black/40 border border-white/10 backdrop-blur-md hover:bg-black/50 transition-colors relative">
            <MapPin className="h-10 w-10 text-indigo-400 mb-4 mx-auto" />
            <h3 className="text-lg font-bold mb-2 text-white">Dynamic Itinerary</h3>
            <p className="text-slate-300 text-sm">Hour-by-hour plans tailored to your budget.</p>
          </div>
          <div className="p-6 rounded-2xl bg-black/40 border border-white/10 backdrop-blur-md hover:bg-black/50 transition-colors">
            <PlaneTakeoff className="h-10 w-10 text-purple-400 mb-4 mx-auto" />
            <h3 className="text-lg font-bold mb-2 text-white">Cost Estimator</h3>
            <p className="text-slate-300 text-sm">Real-time flight and hotel price benchmarks.</p>
          </div>
        </div>
      </section>

      <footer className="mt-20 py-10 text-slate-400 text-sm border-t border-white/10 w-full text-center backdrop-blur-sm">
        &copy; 2026 Travelera AI. Built for the modern traveler.
      </footer>
    </main>
  );
}
