import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  Sparkles,
  Search,
  Clock,
  ArrowRight,
  HelpCircle
} from 'lucide-react';

export const LandingPage: React.FC = () => {
  const { isAuthenticated, isAdmin } = useAuth();

  const steps = [
    { num: '1', title: 'Register', desc: 'Create your worker account in 30 seconds.' },
    { num: '2', title: 'Complete Profile', desc: 'Add your occupation, income, and state.' },
    { num: '3', title: 'AI Recommendation', desc: 'Explainable AI ranks 0-100% matched schemes.' },
    { num: '4', title: 'Check Eligibility', desc: 'Instant breakdown of satisfied criteria.' },
    { num: '5', title: 'Apply Online', desc: 'Submit with unique Application ID.' },
    { num: '6', title: 'Upload Proofs', desc: 'Attach Aadhaar, income or trade documents.' },
    { num: '7', title: 'Track Lifecycle', desc: 'Follow real-time status history timeline.' },
    { num: '8', title: 'Receive Benefits', desc: 'Direct benefit transfer to bank account.' },
  ];

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-b from-emerald-900 via-emerald-800 to-slate-900 text-white py-16 sm:py-24 px-4 sm:px-6 lg:px-8">
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:16px_16px]" />
        
        <div className="relative max-w-5xl mx-auto text-center space-y-6">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-500/20 border border-emerald-400/30 text-emerald-200 text-xs font-bold uppercase tracking-wider backdrop-blur-sm">
            <Sparkles className="w-3.5 h-3.5" /> Explainable AI Government Welfare Platform
          </div>

          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black tracking-tight leading-tight">
            Apana <span className="text-emerald-400">Benefits</span>
          </h1>
          <p className="text-lg sm:text-xl font-bold text-emerald-200">
            Informal Worker Welfare & Support Platform
          </p>

          <p className="text-base sm:text-xl text-emerald-100/90 max-w-3xl mx-auto leading-relaxed">
            Helping street vendors, construction workers, domestic helpers, and agricultural laborers
            discover eligible welfare schemes, understand qualifications, and track applications from submission to benefit receipt.
          </p>

          {/* Call to actions */}
          <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-4 pt-4">
            {isAuthenticated ? (
              <Link
                to={isAdmin ? '/admin' : '/dashboard'}
                className="px-6 py-3.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold text-sm sm:text-base shadow-lg hover:shadow-xl transition-all flex items-center gap-2"
              >
                Go to {isAdmin ? 'Admin Portal' : 'My Dashboard'} <ArrowRight className="w-4 h-4" />
              </Link>
            ) : (
              <>
                <Link
                  to="/register"
                  className="px-6 py-3.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold text-sm sm:text-base shadow-lg hover:shadow-xl transition-all flex items-center gap-2"
                >
                  Find Benefits for Me <ArrowRight className="w-4 h-4" />
                </Link>
                <Link
                  to="/track"
                  className="px-6 py-3.5 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 text-white font-bold text-sm sm:text-base backdrop-blur-sm transition-all flex items-center gap-2"
                >
                  <Search className="w-4 h-4" /> Track Application
                </Link>
              </>
            )}

            <Link
              to="/schemes"
              className="px-6 py-3.5 rounded-xl bg-slate-800/80 hover:bg-slate-800 text-slate-200 border border-slate-700 font-bold text-sm sm:text-base transition-all"
            >
              Browse 16+ Schemes
            </Link>
          </div>

          {/* Quick Metrics */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-10 border-t border-emerald-700/50 max-w-4xl mx-auto">
            <div className="p-3 bg-white/5 rounded-xl border border-white/10">
              <span className="text-2xl sm:text-3xl font-black text-emerald-300">16+</span>
              <p className="text-xs text-emerald-100/70 font-medium mt-1">Welfare Schemes</p>
            </div>
            <div className="p-3 bg-white/5 rounded-xl border border-white/10">
              <span className="text-2xl sm:text-3xl font-black text-emerald-300">20+</span>
              <p className="text-xs text-emerald-100/70 font-medium mt-1">Worker Trades</p>
            </div>
            <div className="p-3 bg-white/5 rounded-xl border border-white/10">
              <span className="text-2xl sm:text-3xl font-black text-emerald-300">0 - 100%</span>
              <p className="text-xs text-emerald-100/70 font-medium mt-1">Explainable Match Score</p>
            </div>
            <div className="p-3 bg-white/5 rounded-xl border border-white/10">
              <span className="text-2xl sm:text-3xl font-black text-emerald-300">7 Stages</span>
              <p className="text-xs text-emerald-100/70 font-medium mt-1">Lifecycle Audit Trail</p>
            </div>
          </div>

        </div>
      </section>

      {/* Problem & Solution */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="text-center max-w-3xl mx-auto mb-12">
          <h2 className="text-xs font-bold uppercase tracking-widest text-emerald-600 mb-2">The Challenge & Solution</h2>
          <h3 className="text-2xl sm:text-3xl font-extrabold text-slate-900">Bridging the Welfare Information Gap for Informal Workers</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-6 bg-white rounded-2xl border border-slate-200 shadow-xs space-y-3">
            <div className="w-12 h-12 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center font-bold">
              <HelpCircle className="w-6 h-6" />
            </div>
            <h4 className="text-base font-bold text-slate-900">Information Fragmentation</h4>
            <p className="text-xs text-slate-600 leading-relaxed">
              Informal workers often miss out on pensions, accident insurance, and grants due to complex gazette notifications and lack of awareness.
            </p>
          </div>

          <div className="p-6 bg-white rounded-2xl border border-slate-200 shadow-xs space-y-3">
            <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
              <Sparkles className="w-6 h-6" />
            </div>
            <h4 className="text-base font-bold text-slate-900">Transparent AI Recommendation</h4>
            <p className="text-xs text-slate-600 leading-relaxed">
              Our explainable engine matches workers based on occupation, income cap, age, family size, and state with 100% transparent reasoning.
            </p>
          </div>

          <div className="p-6 bg-white rounded-2xl border border-slate-200 shadow-xs space-y-3">
            <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
              <Clock className="w-6 h-6" />
            </div>
            <h4 className="text-base font-bold text-slate-900">End-to-End Application Tracking</h4>
            <p className="text-xs text-slate-600 leading-relaxed">
              Real-time audit history and visual step timeline from <span className="font-semibold text-slate-800">Applied</span> to <span className="font-semibold text-slate-800">Benefit Disbursed</span>.
            </p>
          </div>
        </div>
      </section>

      {/* How it works - 8 Steps */}
      <section className="bg-slate-100 py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center max-w-3xl mx-auto mb-12">
            <h2 className="text-xs font-bold uppercase tracking-widest text-emerald-600 mb-2">Workflow Demonstration</h2>
            <h3 className="text-2xl sm:text-3xl font-extrabold text-slate-900">How The System Works in 8 Simple Steps</h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {steps.map((s, i) => (
              <div key={i} className="p-5 bg-white rounded-xl border border-slate-200 shadow-xs space-y-2">
                <div className="w-8 h-8 rounded-lg bg-emerald-600 text-white flex items-center justify-center font-black text-sm">
                  {s.num}
                </div>
                <h4 className="text-sm font-bold text-slate-900">{s.title}</h4>
                <p className="text-xs text-slate-600">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="mt-auto bg-slate-900 text-slate-400 py-8 px-4 sm:px-6 lg:px-8 border-t border-slate-800 text-xs">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>
            <p className="font-bold text-slate-200">Apana Benefits</p>
            <p className="text-[11px] text-slate-500">Government Social Welfare Recommendation & Tracking Platform</p>
          </div>
          <div className="flex items-center gap-4">
            <Link to="/schemes" className="hover:text-emerald-400">All Schemes</Link>
            <Link to="/track" className="hover:text-emerald-400">Track Application</Link>
            <Link to="/login" className="hover:text-emerald-400">Admin Login</Link>
          </div>
        </div>
      </footer>

    </div>
  );
};
