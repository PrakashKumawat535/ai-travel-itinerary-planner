import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Compass, Sparkles, Loader2, AlertCircle, Home } from 'lucide-react';
import { apiRequest } from '../utils/api';
import { Trip } from '../types';
import ItineraryViewer from '../components/ItineraryViewer';

interface SharedViewProps {
  onNavigateHome: () => void;
}

export default function SharedView({ onNavigateHome }: SharedViewProps) {
  const [trip, setTrip] = useState<Trip | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorText, setErrorText] = useState<string | null>(null);
  const [commenting, setCommenting] = useState(false);

  // Extract itineraryId from URL pathname: /share/:id
  const getItineraryId = (): string | null => {
    const parts = window.location.pathname.split('/share/');
    return parts.length > 1 && parts[1] ? parts[1].trim() : null;
  };

  const itineraryId = getItineraryId();

  // Load the public trip details
  const fetchSharedTrip = async (id: string) => {
    setLoading(true);
    setErrorText(null);
    try {
      const data = await apiRequest(`/api/trips/share/${id}`);
      setTrip(data);
    } catch (err: any) {
      console.error('Failed to retrieve public share trip:', err);
      setErrorText(err.message || 'The requested travel plan profile could not be loaded.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (itineraryId) {
      fetchSharedTrip(itineraryId);
    } else {
      setLoading(false);
      setErrorText('Malformed share URL. Missing travel itinerary identifier.');
    }
  }, [itineraryId]);

  // Handle anonymous comments submission on shared view
  const handlePostAnonymousComment = async (name: string, commentText: string) => {
    if (!itineraryId) return;
    setCommenting(true);
    try {
      const newComment = await apiRequest(`/api/trips/share/${itineraryId}/comment`, {
        method: 'POST',
        body: JSON.stringify({ name, comment: commentText })
      });

      // Update local state instantly so reviewer sees physical additions
      setTrip(prev => {
        if (!prev) return null;
        return {
          ...prev,
          comments: [...(prev.comments || []), newComment]
        };
      });
    } catch (err: any) {
      console.error('Error posting anonymous feedback comment:', err);
      throw err;
    } finally {
      setCommenting(false);
    }
  };

  return (
    <div id="shared-view-page" className="min-h-screen bg-[#050505] text-[#e0e0e0] flex flex-col justify-between relative overflow-hidden">
      
      {/* Background gradients */}
      <div className="absolute top-0 right-1/4 w-[400px] h-[400px] rounded-full bg-[#c4a661]/5 blur-3xl opacity-50"></div>

      {/* HEADER BAR */}
      <header className="border-b border-white/5 bg-[#080808]/80 backdrop-blur-md px-6 py-4 flex items-center justify-between print:hidden">
        <div className="flex items-center gap-2 cursor-pointer" onClick={onNavigateHome}>
          <div className="p-1.5 bg-[#c4a661]/10 border border-[#c4a661]/20 rounded-sm text-[#c4a661]">
            <Compass className="w-4 h-4" />
          </div>
          <span className="text-xs font-mono font-bold text-white tracking-[0.2em] uppercase">
            AI Travel Share Client
          </span>
        </div>

        <button
          onClick={onNavigateHome}
          className="px-3 py-1.5 bg-[#111111] hover:bg-white/5 text-[#c4a661] text-xs font-mono font-semibold flex items-center gap-2 rounded-sm border border-white/5 transition-colors cursor-pointer"
        >
          <Home className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Plan Your Own Trip</span>
        </button>
      </header>

      {/* BODY WORKSPACE CONTAINER */}
      <main className="flex-1 max-w-5xl mx-auto w-full py-8">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <Loader2 className="w-8 h-8 text-[#c4a661] animate-spin mb-4" />
            <p className="text-white/30 text-xs font-mono uppercase tracking-widest">
              Syncing travel timeline nodes...
            </p>
          </div>
        ) : errorText ? (
          <div className="mx-4 p-8 rounded-sm border border-rose-500/20 bg-[#0a0a0a] max-w-md mx-auto text-center space-y-4 shadow-xl">
            <AlertCircle className="w-12 h-12 text-rose-500 mx-auto" />
            <h3 className="text-lg font-serif text-white">Itinerary Load Fault</h3>
            <p className="text-white/60 text-sm">{errorText}</p>
            <button
              onClick={onNavigateHome}
              className="px-5 py-2.5 bg-[#c4a661] hover:bg-[#b09352] text-black text-xs font-semibold rounded-sm shadow-md transition-colors w-full uppercase tracking-widest cursor-pointer"
            >
              Back to Home page
            </button>
          </div>
        ) : (
          trip && (
            <div className="space-y-4">
              <div className="mx-4 bg-[#c4a661]/5 border border-[#c4a661]/15 p-4 rounded-sm flex items-center justify-between text-xs font-mono text-[#c4a661] print:hidden shadow-sm">
                <span className="flex items-center gap-1.5 font-semibold uppercase tracking-wider">
                  <Sparkles className="w-4 h-4 text-[#c4a661]" />
                  READ-ONLY ACCREDITED VIEW BOARD
                </span>
                <span>Id: {trip.id.substring(0, 8)}</span>
              </div>
              <ItineraryViewer 
                trip={trip} 
                isReadonly={true}
                onPostComment={handlePostAnonymousComment}
                commentLoading={commenting}
              />
            </div>
          )
        )}
      </main>

      {/* FOOTER BAR */}
      <footer className="border-t border-white/5 bg-[#080808] py-4 text-center text-[9px] font-mono text-white/30 uppercase tracking-[0.2em] print:hidden">
        Secure SHA-256 cloud parsing structure © 2026 AI Travel Itinerary Planner
      </footer>
    </div>
  );
}
