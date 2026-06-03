import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Plus, 
  History, 
  Upload, 
  MapPin, 
  Calendar, 
  DollarSign, 
  Sparkles, 
  LogOut, 
  Loader2, 
  Compass, 
  FileText, 
  Image as ImageIcon,
  User,
  Clock,
  ChevronRight,
  ClipboardList,
  AlertCircle
} from 'lucide-react';
import { apiRequest } from '../utils/api';
import { clearStoredToken } from '../utils/auth';
import { Trip, User as UserType } from '../types';
import ItineraryViewer from '../components/ItineraryViewer';

interface DashboardProps {
  user: UserType;
  onLogout: () => void;
}

export default function Dashboard({ user, onLogout }: DashboardProps) {
  // Navigation / UI View controllers
  const [tripsHistory, setTripsHistory] = useState<Trip[]>([]);
  const [selectedTrip, setSelectedTrip] = useState<Trip | null>(null);
  
  // Controls
  const [isCreatingNew, setIsCreatingNew] = useState(true);
  const [isDragActive, setIsDragActive] = useState(false);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [dbStatus, setDbStatus] = useState<{
    mode: string;
    isMongoDB: boolean;
    isConnecting: boolean;
    error: string | null;
  } | null>(null);

  // File Upload coordinate state
  const [uploadedFile, setUploadedFile] = useState<{
    name: string;
    mimeType: string;
    base64: string;
  } | null>(null);

  // Manual trip generation coordinate states
  const [destination, setDestination] = useState('');
  const [durationDays, setDurationDays] = useState(3);
  const [budgetLevel, setBudgetLevel] = useState('Moderate');
  const [startDate, setStartDate] = useState('');
  const [customNotes, setCustomNotes] = useState('');

  // Fetch travel history logs on load
  const loadHistory = async () => {
    setLoadingHistory(true);
    setErrorMessage(null);
    try {
      const data = await apiRequest('/api/trips/history');
      setTripsHistory(data);
      // Automatically select latest trip if custom dashboard opens
      if (data && data.length > 0 && !selectedTrip) {
        setSelectedTrip(data[data.length - 1]);
        setIsCreatingNew(false);
      }
    } catch (err: any) {
      console.error('Error fetching itineraries history:', err);
      setErrorMessage(err.message || 'Failed to sync travel record archives.');
    } finally {
      setLoadingHistory(false);
    }
  };

  useEffect(() => {
    loadHistory();

    const fetchDbStatus = async () => {
      try {
        const res = await fetch('/api/db-status');
        if (res.ok) {
          const data = await res.json();
          setDbStatus(data);
        }
      } catch (e) {
        console.error('Error fetching db-status:', e);
      }
    };
    fetchDbStatus();
  }, []);

  // Handle Drag Events
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setIsDragActive(true);
    } else if (e.type === 'dragleave') {
      setIsDragActive(false);
    }
  };

  // Convert files into Base64 format asynchronously
  const processSelectedFile = (file: File) => {
    if (!file) return;

    // Type validation constraints
    const allowedTypes = ['application/pdf', 'image/png', 'image/jpeg', 'image/jpg'];
    if (!allowedTypes.includes(file.type)) {
      setErrorMessage('Unsupported file format. Please upload PDF tickets, PNG receipts, or JPEG clips.');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setUploadedFile({
        name: file.name,
        mimeType: file.type,
        base64: reader.result as string
      });
      setErrorMessage(null);
    };
    reader.onerror = () => {
      setErrorMessage('Failed to translate booking file correctly.');
    };
    reader.readAsDataURL(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processSelectedFile(e.dataTransfer.files[0]);
    }
  };

  const handleManualFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processSelectedFile(e.target.files[0]);
    }
  };

  // Trigger submission to the server-side compiler
  const handleGenerateItinerary = async (e: React.FormEvent) => {
    e.preventDefault();
    setGenerating(true);
    setErrorMessage(null);

    // Build payload conditions
    const payload: any = { customNotes };

    if (uploadedFile) {
      payload.file = uploadedFile.base64;
      payload.mimeType = uploadedFile.mimeType;
      payload.fileName = uploadedFile.name;
    } else {
      if (!destination.trim()) {
        setErrorMessage('Please either drop a booking file or specify a destination city.');
        setGenerating(false);
        return;
      }
      payload.destination = destination.trim();
      payload.durationDays = durationDays;
      payload.budgetLevel = budgetLevel;
      payload.startDate = startDate;
    }

    try {
      const generatedTrip = await apiRequest('/api/trips/upload', {
        method: 'POST',
        body: JSON.stringify(payload)
      });

      // Insert trip into historical logs array
      setTripsHistory(prev => [...prev, generatedTrip]);
      setSelectedTrip(generatedTrip);
      
      // Pivot display view
      setIsCreatingNew(false);
      
      // Clean states
      setUploadedFile(null);
      setDestination('');
      setStartDate('');
      setCustomNotes('');
    } catch (err: any) {
      console.error('Itinerary compilation failure:', err);
      setErrorMessage(err.message || 'Internal AI reasoning timeline compilation faulted. Please try again.');
    } finally {
      setGenerating(false);
    }
  };

  // Handle posting comments on active viewing trip
  const handlePostLocalComment = async (author: string, commentText: string) => {
    if (!selectedTrip) return;
    try {
      const newComment = await apiRequest(`/api/trips/share/${selectedTrip.id}/comment`, {
        method: 'POST',
        body: JSON.stringify({ name: author, comment: commentText })
      });

      // Synchronize in-memory trip logs immediately
      setSelectedTrip(prev => {
        if (!prev) return null;
        return {
          ...prev,
          comments: [...(prev.comments || []), newComment]
        };
      });

      // Sync historical archives de-duplicate list view
      setTripsHistory(prev => {
        return prev.map(t => {
          if (t.id === selectedTrip.id) {
            return {
              ...t,
              comments: [...(t.comments || []), newComment]
            };
          }
          return t;
        });
      });
    } catch (err) {
      console.error('Comment registration faulted:', err);
      throw err;
    }
  };

  // Logout routine clearing JWT
  const handleTriggerLogout = () => {
    clearStoredToken();
    onLogout();
  };

  // Format date readable helper
  const formatDateLabel = (dateStr: string) => {
    try {
      return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    } catch {
      return dateStr;
    }
  };

  return (
    <div id="traveler-dashboard" className="min-h-screen bg-[#050505] text-[#e0e0e0] flex flex-col md:flex-row relative">
      
      {/* SIDEBAR NAVIGATION COLUMN */}
      <aside className="w-full md:w-80 shrink-0 bg-[#080808] border-b md:border-b-0 md:border-r border-white/5 px-5 py-6 flex flex-col justify-between print:hidden">
        <div className="space-y-6">
          {/* Dashboard branding */}
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-[#c4a661]/10 rounded-sm text-[#c4a661] border border-[#c4a661]/15">
              <Compass className="w-4 h-4 animate-spin" style={{ animationDuration: '24s' }} />
            </div>
            <h1 className="text-xs font-mono font-bold tracking-[0.25em] text-white uppercase">
              Traveler Vault
            </h1>
          </div>
 
          {/* New Trip Creation button CTA */}
          <button
            onClick={() => {
              setIsCreatingNew(true);
              setSelectedTrip(null);
              setErrorMessage(null);
            }}
            className="w-full py-2.5 px-4 bg-[#c4a661] hover:bg-[#b09352] text-black font-semibold text-xs tracking-widest uppercase rounded-sm flex items-center justify-center gap-2 transition-all shadow-md shadow-[#c4a661]/10 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            Build New Trip Itinerary
          </button>
 
          {/* Historical archived trips timeline list */}
          <div className="space-y-3">
            <h3 className="text-[9px] font-mono text-white/30 tracking-[0.2em] uppercase flex items-center gap-1.5 pt-4 border-t border-white/5">
              <History className="w-3.5 h-3.5 text-[#c4a661]" />
              Past Trips History
            </h3>
 
            {loadingHistory ? (
              <div className="flex justify-center items-center py-8">
                <Loader2 className="w-5 h-5 text-[#c4a661] animate-spin" />
              </div>
            ) : tripsHistory.length === 0 ? (
              <div className="text-center py-6 text-xs font-mono text-white/30 italic border border-white/5 rounded-sm bg-white/[0.01]">
                Empty vault repository. <br className="hidden md:inline" />
                Plan your first expedition!
              </div>
            ) : (
              <div className="space-y-2 max-h-[350px] overflow-y-auto pr-1">
                {tripsHistory.slice().reverse().map((trip) => {
                  const isActive = selectedTrip?.id === trip.id;
                  return (
                    <div
                      key={trip.id}
                      onClick={() => {
                        setSelectedTrip(trip);
                        setIsCreatingNew(false);
                        setErrorMessage(null);
                      }}
                      className={`w-full group text-left px-3.5 py-3 rounded-sm border cursor-pointer flex justify-between items-center transition-all ${
                        isActive
                          ? 'border-[#c4a661]/40 bg-[#c4a661]/10 text-white shadow-sm'
                          : 'border-white/5 bg-white/[0.01] text-white/50 hover:border-white/10 hover:text-white'
                      }`}
                    >
                      <div className="overflow-hidden mr-2">
                        <div className="font-medium text-xs text-white/80 truncate group-hover:text-white">
                          {trip.destination}
                        </div>
                        <div className="text-[9px] font-mono text-white/30 mt-1 flex items-center gap-1 uppercase tracking-wide">
                          <span>{formatDateLabel(trip.startDate)}</span>
                          <span>•</span>
                          <span>{trip.itinerary?.length || 0} Days</span>
                        </div>
                      </div>
                      <ChevronRight className={`w-3.5 h-3.5 shrink-0 transition-transform ${isActive ? 'text-[#c4a661] translate-x-0.5' : 'text-white/20 group-hover:text-white/40'}`} />
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
 
        {/* User Account / Profile metadata cards */}
        <div className="border-t border-white/5 pt-5 mt-6 justify-self-end">
          <div className="flex items-center gap-3 mb-4">
            <div className="h-9 w-9 rounded-sm bg-[#111111] border border-white/5 flex items-center justify-center text-[#c4a661] font-mono text-xs font-bold uppercase shadow-sm">
              <User className="w-4 h-4 text-[#c4a661]" />
            </div>
            <div className="overflow-hidden">
              <div className="text-xs font-medium text-white/80 truncate">{user.email}</div>
              <div className="text-[9px] font-mono text-white/30 mt-0.5 uppercase tracking-wider">SECURED CONSOLE</div>
            </div>
          </div>

          {/* Database active telemetry engine indicator */}
          {dbStatus && (
            <div className="mb-4 p-2.5 rounded-sm border border-white/5 bg-white/[0.01] text-[9px] font-mono uppercase tracking-wider space-y-1">
              <div className="flex justify-between items-center">
                <span className="text-white/30">DATA STORAGE</span>
                <span className={`px-1.5 py-0.5 rounded-sm text-[8px] font-bold tracking-wide ${dbStatus.isMongoDB ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-[#c4a661]/10 text-[#c4a661] border border-[#c4a661]/20'}`}>
                  {dbStatus.isMongoDB ? 'MongoDB ATLAS' : 'LOCAL db.json'}
                </span>
              </div>
              <div className="text-white/40 text-[8px] lowercase italic normal-case tracking-normal leading-relaxed">
                {dbStatus.isMongoDB 
                  ? 'Active direct syncing connection' 
                  : 'Specify MONGODB_URI in Settings to connect cloud database'
                }
              </div>
            </div>
          )}
 
          <button
            onClick={handleTriggerLogout}
            className="w-full py-2 px-3 border border-white/5 hover:border-white/10 bg-transparent hover:bg-white/5 text-white/40 hover:text-[#c4a661] font-medium text-xs font-mono rounded-sm flex items-center justify-center gap-2 transition-colors cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            De-auth Session
          </button>
        </div>
      </aside>      {/* PRIMARY WORKSPACE CONTENT ZONE */}
      <main className="flex-1 min-w-0 flex flex-col">
        {/* Errors view popup banner */}
        {errorMessage && (
          <div className="m-4 p-4 rounded-sm bg-rose-500/10 border border-rose-500/20 text-rose-450 text-xs flex items-start gap-3 shadow-md">
            <AlertCircle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
            <span className="font-mono">{errorMessage}</span>
          </div>
        )}
 
        {/* LOADING SKELETON SHIMMER DISPLAY ON REQUEST */}
        {generating ? (
          <div className="flex-1 flex flex-col justify-center items-center px-4 py-16 text-center max-w-2xl mx-auto">
            {/* Pulsing travel spinner */}
            <div className="relative mb-6">
              <div className="h-20 w-20 rounded-full border border-white/5 bg-white/[0.02] flex items-center justify-center relative">
                <Loader2 className="w-10 h-10 text-[#c4a661] animate-spin" />
              </div>
              <div className="absolute -inset-1 rounded-full border border-[#c4a661]/10 animate-ping" style={{ animationDuration: '3s' }}></div>
            </div>
 
            {/* Glowing Text */}
            <h2 className="text-xl md:text-2xl font-serif font-light text-white mb-2 leading-snug">
              Gemini AI is crafting your <span className="text-[#c4a661] italic">itinerary...</span>
            </h2>
            <p className="text-white/30 text-[9px] font-mono uppercase tracking-[0.2em] leading-relaxed">
              EPHEMERAL DOCUMENT DE-SEGREGATION INDEX PARSING ACTIVE
            </p>
 
            {/* Simulated Shimmer layout boxes for perceived latency recovery */}
            <div className="w-full max-w-xl mt-12 space-y-4 text-left animate-pulse">
              <div className="h-16 w-full rounded-sm bg-[#111111] border border-white/5"></div>
              <div className="h-6 w-1/3 rounded-sm bg-[#111111] border border-white/5"></div>
              <div className="space-y-2 pl-4 border-l-2 border-[#c4a661]/35">
                <div className="h-12 w-full rounded-sm bg-[#111111]/60 border border-white/5"></div>
                <div className="h-12 w-3/4 rounded-sm bg-[#111111]/60 border border-white/5"></div>
              </div>
            </div>
          </div>
        ) : isCreatingNew ? (
          // BUILD NEW TRIP ITINERARY INPUT FORM PANELS
          <div className="p-6 md:p-10 max-w-4xl mx-auto w-full space-y-8 flex-1">
            <div className="border-b border-white/5 pb-5">
              <span className="text-[9px] font-mono tracking-[0.2em] text-[#c4a661] uppercase font-bold">WORKSPACE MATRIX</span>
              <h2 className="text-3xl md:text-4xl font-serif font-light text-white mt-1 leading-tight">
                Configure New <span className="text-[#c4a661] italic font-normal">Journey</span>
              </h2>
              <p className="text-white/40 text-xs mt-2 leading-relaxed tracking-wide">
                Choose between dropping voucher booking PDFs, screenshots or typing manual locations dynamically.
              </p>
            </div>
 
            <form onSubmit={handleGenerateItinerary} className="space-y-6">
              {/* WAYPOINT A: File reservation dropzone */}
              <div className="space-y-2">
                <div className="flex justify-between items-baseline">
                  <label className="text-[10px] font-mono tracking-[0.15em] text-[#c4a661] uppercase font-bold">
                    Option 1: Upload Booking PDF / Images
                  </label>
                  {uploadedFile && (
                    <button
                      type="button"
                      onClick={() => setUploadedFile(null)}
                      className="text-[10px] font-mono text-rose-455 hover:underline decoration-rose-500 cursor-pointer"
                    >
                      Remove File Clear Frame
                    </button>
                  )}
                </div>
 
                <div
                  onDragEnter={handleDrag}
                  onDragOver={handleDrag}
                  onDragLeave={handleDrag}
                  onDrop={handleDrop}
                  className={`border-2 border-dashed rounded-sm p-8 text-center transition-all ${
                    isDragActive
                      ? 'border-[#c4a661] bg-[#c4a661]/5 shadow-lg shadow-[#c4a661]/5'
                      : uploadedFile
                      ? 'border-emerald-500/40 bg-emerald-555/5'
                      : 'border-white/10 bg-[#080808] hover:border-[#c4a661]/30 hover:bg-[#111111]/30'
                  }`}
                >
                  <input
                    type="file"
                    id="booking-document-upload"
                    onChange={handleManualFileSelect}
                    accept="application/pdf,image/png,image/jpeg"
                    className="hidden"
                  />
                  <label
                    htmlFor="booking-document-upload"
                    className="flex flex-col items-center justify-center cursor-pointer space-y-3"
                  >
                    {uploadedFile ? (
                      <>
                        <div className="p-3 bg-emerald-555/15 rounded-sm border border-emerald-500/20 text-emerald-400 text-center animate-bounce">
                          <FileText className="w-6 h-6" />
                        </div>
                        <div>
                          <div className="text-xs font-bold text-[#c4a661] font-mono">{uploadedFile.name}</div>
                          <div className="text-[9px] font-mono text-white/30 mt-1 uppercase tracking-wider">Ready for AI parsing</div>
                        </div>
                      </>
                    ) : (
                      <>
                        <div className="p-3 bg-white/5 rounded-sm border border-white/5 text-[#c4a661] text-center">
                          <Upload className="w-6 h-6" />
                        </div>
                        <div>
                          <p className="text-xs font-medium text-white/70 uppercase tracking-widest">Drag and drop reservation files here</p>
                          <p className="text-[10px] text-white/30 mt-1">Accepts PDF booking papers, PNG / JPG coupons & confirmations</p>
                        </div>
                        <span className="px-4 py-1.5 bg-white/5 hover:bg-white/10 text-[#c4a661] text-[9px] font-mono font-bold uppercase rounded-sm border border-white/10 tracking-widest cursor-pointer">
                          Manually Browse Files
                        </span>
                      </>
                    )}
                  </label>
                </div>
              </div>
 
              {/* DIVIDER ACCENT */}
              <div className="relative py-4 flex items-center justify-center">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-white/5"></div>
                </div>
                <span className="relative px-3 text-[10px] font-mono text-white/30 uppercase tracking-widest bg-[#050505]">OR</span>
              </div>
 
              {/* WAYPOINT B: Manual inputs config */}
              <div className={`space-y-4 p-5 rounded-sm bg-white/[0.01] border border-white/5 transition-all ${uploadedFile ? 'opacity-30 blur-[1px] pointer-events-none' : ''}`}>
                <h4 className="text-[10px] font-mono tracking-[0.15em] text-[#c4a661] uppercase font-bold border-b border-white/5 pb-2">
                  Option 2: Direct Destination Specifics
                </h4>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Destination */}
                  <div>
                    <label className="block text-[9px] font-mono text-white/40 uppercase tracking-wider mb-1">Target Landmark / City</label>
                    <input
                      type="text"
                      placeholder="e.g. Kyoto, Japan"
                      value={destination}
                      onChange={(e) => setDestination(e.target.value)}
                      className="w-full bg-[#080808] border border-white/5 rounded-sm px-3.5 py-2 text-xs text-white placeholder-white/20 focus:outline-none focus:border-[#c4a661]"
                    />
                  </div>
 
                  {/* Dates input */}
                  <div>
                    <label className="block text-[9px] font-mono text-white/40 uppercase tracking-wider mb-1">StartDate</label>
                    <input
                      type="date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      className="w-full bg-[#080808] border border-white/5 rounded-sm px-3.5 py-2 text-xs text-white focus:outline-none focus:border-[#c4a661]"
                    />
                  </div>
 
                  {/* Duration days */}
                  <div>
                    <label className="block text-[9px] font-mono text-white/40 uppercase tracking-wider mb-1">Trip Duration</label>
                    <select
                      value={durationDays}
                      onChange={(e) => setDurationDays(Number(e.target.value))}
                      className="w-full bg-[#080808] border border-white/5 rounded-sm px-3.5 py-2 text-xs text-white focus:outline-none focus:border-[#c4a661]"
                    >
                      {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14].map((d) => (
                        <option key={d} value={d}>
                          {d} Day{d > 1 ? 's' : ''} Journey
                        </option>
                      ))}
                    </select>
                  </div>
 
                  {/* Budget Level */}
                  <div>
                    <label className="block text-[9px] font-mono text-white/40 uppercase tracking-wider mb-1">Budget level</label>
                    <select
                      value={budgetLevel}
                      onChange={(e) => setBudgetLevel(e.target.value)}
                      className="w-full bg-[#080808] border border-white/5 rounded-sm px-3.5 py-2 text-xs text-white focus:outline-none focus:border-[#c4a661]"
                    >
                      <option value="Conservative (Backpacker)">Conservative (Backpacker)</option>
                      <option value="Moderate">Moderate (Exploration Sights)</option>
                      <option value="Luxury (Premium Lodging)">Luxury (Premium Lodging)</option>
                    </select>
                  </div>
                </div>
              </div>
 
              {/* Waypoint C: Common Custom instruction context */}
              <div>
                <label className="block text-[10px] font-mono tracking-[0.15em] text-[#c4a661] uppercase font-bold mb-1.5 flex items-center gap-1">
                  Custom Travel Constraints
                  <span className="text-[9px] font-mono text-white/30 capitalize tracking-normal font-medium">(Dietary, pace, lodging keys)</span>
                </label>
                <textarea
                  rows={2}
                  placeholder="e.g. Vegetarian diet, relaxed pace, early check-out required, focusing on local heritage walks..."
                  value={customNotes}
                  onChange={(e) => setCustomNotes(e.target.value)}
                  className="w-full bg-[#080808] border border-white/5 rounded-sm px-3.5 py-2 text-xs text-white placeholder-white/20 focus:outline-none focus:border-[#c4a661]"
                />
              </div>
 
              {/* Submit CTA */}
              <button
                type="submit"
                className="w-full py-4 bg-[#c4a661] hover:bg-[#b09352] shadow-xl shadow-[#c4a661]/15 text-black text-xs font-semibold uppercase tracking-widest rounded-sm transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <Sparkles className="w-4 h-4 text-black" />
                Compile Intelligent Itinerary Map
              </button>
            </form>
          </div>
        ) : (
          // DYNAMIC ITINERARY VIEWER LOAD
          selectedTrip && (
            <div className="flex-1 overflow-y-auto">
              {/* Back to inputs bar trigger */}
              <div className="bg-[#080808] border-b border-white/5 px-6 py-2 flex items-center justify-between print:hidden">
                <button
                  onClick={() => setIsCreatingNew(true)}
                  className="text-[10px] font-mono tracking-widest uppercase font-semibold text-white/40 hover:text-[#c4a661] flex items-center gap-1 cursor-pointer"
                >
                  ← Build another timeline trip
                </button>
                <span className="text-[9px] font-mono text-white/30 uppercase tracking-widest">
                  PERSISTED IDENTIFIER ID: {selectedTrip.id.substring(0, 8)}
                </span>
              </div>
              <ItineraryViewer 
                trip={selectedTrip} 
                onPostComment={handlePostLocalComment}
              />
            </div>
          )
        )}
      </main>
    </div>
  );
}
