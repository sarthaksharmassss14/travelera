import TripWizard from "@/components/TripWizard";
import { UserButton, SignedIn, SignedOut, SignInButton } from "@clerk/nextjs";
import { PlaneTakeoff, Globe, MapPin } from "lucide-react";

export default function Home() {
  return (
    <main className="relative flex flex-col items-center justify-center min-h-screen px-4 overflow-hidden">
      {/* Background patterns */}
      <div className="absolute inset-0 z-0">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-indigo-500/10 blur-[120px] rounded-full" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-cyan-500/10 blur-[120px] rounded-full" />
      </div>

      <nav className="fixed top-0 w-full z-50 p-6 flex justify-between items-center backdrop-blur-sm">
        <div className="flex items-center gap-2">
          <PlaneTakeoff className="h-8 w-8 text-cyan-400" />
          <span className="text-xl font-bold tracking-tight">Travelera</span>
        </div>
        <div className="flex items-center gap-4">
          <SignedIn>
            <UserButton afterSignOutUrl="/" />
          </SignedIn>
          <SignedOut>
            <SignInButton mode="modal">
              <button className="px-4 py-2 rounded-full bg-slate-800 hover:bg-slate-700 transition-colors text-sm font-medium">
                Sign In
              </button>
            </SignInButton>
          </SignedOut>
        </div>
      </nav>

      <section className="relative z-10 w-full max-w-5xl text-center space-y-12">
        <div className="space-y-4">
          <h1 className="text-5xl md:text-7xl font-extrabold tracking-tighter">
            Your Next Path, <br />
            <span className="bg-gradient-to-r from-cyan-400 via-indigo-500 to-purple-600 bg-clip-text text-transparent">
              Defined by AI
            </span>
          </h1>
          <p className="text-slate-400 text-lg md:text-xl max-w-2xl mx-auto">
            Experience the future of travel planning. Tell us where, when, and how you want to roam.
            We'll handle the rest.
          </p>
        </div>

        <div className="w-full">
          <TripWizard />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 pt-12">
          <div className="p-6 rounded-2xl bg-slate-900/40 border border-slate-800/50 backdrop-blur-sm">
            <Globe className="h-10 w-10 text-cyan-400 mb-4 mx-auto" />
            <h3 className="text-lg font-bold mb-2">Global Insights</h3>
            <p className="text-slate-500 text-sm">Deep cultural and currency data for every country.</p>
          </div>
          <div className="p-6 rounded-2xl bg-slate-900/40 border border-slate-800/50 backdrop-blur-sm">
            <MapPin className="h-10 w-10 text-indigo-400 mb-4 mx-auto" />
            <h3 className="text-lg font-bold mb-2">Dynamic Itinerary</h3>
            <p className="text-slate-500 text-sm">Hour-by-hour plans tailored to your budget.</p>
          </div>
          <div className="p-6 rounded-2xl bg-slate-900/40 border border-slate-800/50 backdrop-blur-sm">
            <PlaneTakeoff className="h-10 w-10 text-purple-400 mb-4 mx-auto" />
            <h3 className="text-lg font-bold mb-2">Cost Estimator</h3>
            <p className="text-slate-500 text-sm">Real-time flight and hotel price benchmarks.</p>
          </div>
        </div>
      </section>

      <footer className="mt-20 py-10 text-slate-600 text-sm border-t border-slate-900/50 w-full text-center">
        &copy; 2024 Travelera AI. Built for the modern traveler.
      </footer>
    </main>
  );
}
