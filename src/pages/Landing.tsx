import React from 'react';
import { motion } from 'motion/react';
import { Sparkles, ArrowRight, ShieldCheck, FileCheck, Share2 } from 'lucide-react';
import BentoGrid from '../components/BentoGrid';

interface LandingProps {
  onStart: () => void;
  isAuthenticated: boolean;
  onNavigateToDashboard: () => void;
}

export default function Landing({ onStart, isAuthenticated, onNavigateToDashboard }: LandingProps) {
  return (
    <div id="landing-page" className="relative min-h-screen bg-[#050505] overflow-hidden text-slate-100">
      
      {/* Background radial overlays */}
      <div className="absolute top-0 left-1/4 w-[500px] h-[500px] rounded-full bg-[#c4a661]/5 blur-3xl -translate-y-1/2 opacity-30"></div>
      <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] rounded-full bg-[#8c7340]/5 blur-3xl translate-y-1/2 opacity-20"></div>

      {/* Grid pattern */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff03_1px,transparent_1px),linear-gradient(to_bottom,#ffffff03_1px,transparent_1px)] bg-[size:5rem_5rem]" />

      {/* HERO SECTION */}
      <div className="relative max-w-5xl mx-auto px-4 pt-24 pb-20 text-center">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full border border-[#c4a661]/15 bg-[#c4a661]/5 text-[10px] font-mono tracking-[0.2em] text-[#c4a661] mb-6"
        >
          <Sparkles className="w-3.5 h-3.5 text-[#c4a661]" />
          POWERED BY GEMINI 3.5 FLASH
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.15 }}
          className="text-4xl sm:text-6xl md:text-7xl font-serif font-light tracking-tight text-white mt-2 text-center leading-[1.1]"
        >
          Turn Booking PDFs Into <br className="hidden sm:inline" />
          <span className="text-[#c4a661] italic font-normal">
            Smart AI Itineraries
          </span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.3 }}
          className="text-white/50 text-sm md:text-base max-w-2xl mx-auto leading-relaxed mt-6 tracking-wide"
        >
          Stop copy-pasting flights, accommodations, and vouchers. Drop your confirmation receipts or images and watch Gemini instantly draft optimized chronological expeditions.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.45 }}
          className="mt-12 flex flex-col sm:flex-row gap-4 justify-center"
        >
          {isAuthenticated ? (
            <button
              onClick={onNavigateToDashboard}
              className="px-8 py-3.5 text-xs font-semibold tracking-widest uppercase flex items-center justify-center gap-2 rounded-sm bg-[#c4a661] hover:bg-[#b09352] text-black shadow-lg shadow-[#c4a661]/10 transition-all cursor-pointer"
            >
              Enter Traveler Dashboard
              <ArrowRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              onClick={onStart}
              className="px-8 py-3.5 text-xs font-semibold tracking-widest uppercase flex items-center justify-center gap-2 rounded-sm bg-[#c4a661] hover:bg-[#b09352] text-black shadow-lg shadow-[#c4a661]/10 transition-all cursor-pointer"
            >
              Get Started for Free
              <ArrowRight className="w-4 h-4" />
            </button>
          )}
        </motion.div>
      </div>

      {/* BENTO GRID MODULE */}
      <div className="py-8 relative">
        <BentoGrid />
      </div>

      {/* HOW IT WORKS (3-STEP GRAPHICS) */}
      <div className="max-w-5xl mx-auto px-4 py-24 border-t border-white/5 mt-20 relative">
        <h2 className="text-3xl md:text-4xl font-serif font-light text-white mb-16 text-center leading-tight">
          Drafted in Three <span className="text-[#c4a661] italic font-normal">Sleek Steps</span>
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-12 relative">
          <div className="flex flex-col items-center text-center p-4">
            <div className="h-14 w-14 rounded-full bg-[#111] border border-white/10 flex items-center justify-center text-lg font-serif italic text-[#c4a661] mb-6 shadow-md relative">
              01
              <div className="absolute -inset-1 rounded-full border border-[#c4a661]/20 animate-pulse"></div>
            </div>
            <h4 className="text-md font-medium text-white tracking-wider uppercase">
              Securely Upload PDF / Images
            </h4>
            <p className="text-white/40 text-xs mt-3 leading-relaxed tracking-wide">
              Drag in PDF ticket reservations, boarding screenshots, hotel confirmations, or simply describe target coordinates.
            </p>
          </div>

          <div className="flex flex-col items-center text-center p-4">
            <div className="h-14 w-14 rounded-full bg-[#111] border border-white/10 flex items-center justify-center text-lg font-serif italic text-[#c4a661] mb-6 shadow-md relative">
              02
              <div className="absolute -inset-1 rounded-full border border-[#c4a661]/20 animate-pulse"></div>
            </div>
            <h4 className="text-md font-medium text-white tracking-wider uppercase">
              Advanced AI Processing
            </h4>
            <p className="text-white/40 text-xs mt-3 leading-relaxed tracking-wide">
              Gemini 3.5 Flash structural reasoning maps raw lines, extracts times and dates, compiles packing checklists, and budgets.
            </p>
          </div>

          <div className="flex flex-col items-center text-center p-4">
            <div className="h-14 w-14 rounded-full bg-[#111] border border-white/10 flex items-center justify-center text-lg font-serif italic text-[#c4a661] mb-6 shadow-md relative">
              03
              <div className="absolute -inset-1 rounded-full border border-[#c4a661]/20 animate-pulse"></div>
            </div>
            <h4 className="text-md font-medium text-white tracking-wider uppercase">
              Live Interactive Sharing
            </h4>
            <p className="text-white/40 text-xs mt-3 leading-relaxed tracking-wide">
              Print pristine optimized travel maps, export offline budgets, and share persistent read-only URL boards of trips with friends.
            </p>
          </div>
        </div>

        {/* Dynamic Trust Card */}
        <div className="mt-20 p-6 rounded-sm bg-white/[0.02] border border-white/5 flex items-center gap-5 max-w-2xl mx-auto shadow-sm">
          <ShieldCheck className="w-8 h-8 text-[#c4a661] shrink-0" />
          <p className="text-[10px] text-white/40 leading-relaxed font-mono uppercase tracking-[0.1em]">
            Enterprise Grade Sandboxed Data Safety. All uploaded documents are parsed ephemerally on runtime structures. Your keys are mapped securely inside internal secrets vaults.
          </p>
        </div>
      </div>
    </div>
  );
}
