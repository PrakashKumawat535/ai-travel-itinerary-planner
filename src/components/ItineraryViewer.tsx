import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Calendar, 
  DollarSign, 
  MapPin, 
  CheckSquare, 
  Square, 
  Clock, 
  Printer, 
  Share2, 
  Clipboard, 
  PieChart, 
  ListCheck, 
  Map, 
  MessageSquare, 
  CornerDownRight, 
  Send 
} from 'lucide-react';
import { Trip, Comment } from '../types';

interface ItineraryViewerProps {
  trip: Trip;
  isReadonly?: boolean;
  onPostComment?: (author: string, commentText: string) => Promise<void>;
  commentLoading?: boolean;
}

export default function ItineraryViewer({ 
  trip, 
  isReadonly = false, 
  onPostComment, 
  commentLoading = false 
}: ItineraryViewerProps) {
  
  const [activeTab, setActiveTab] = useState<'timeline' | 'packing' | 'expenses'>('timeline');
  const [openDays, setOpenDays] = useState<{ [key: number]: boolean }>({ 1: true });
  const [checkedItems, setCheckedItems] = useState<{ [key: string]: boolean }>({});
  
  // Comment Posting Form State
  const [guestName, setGuestName] = useState('');
  const [guestComment, setGuestComment] = useState('');
  const [commentSuccess, setCommentSuccess] = useState(false);
  const [copySuccess, setCopySuccess] = useState(false);

  // Toggle Accordion Days
  const toggleDay = (dayNum: number) => {
    setOpenDays(prev => ({
      ...prev,
      [dayNum]: !prev[dayNum]
    }));
  };

  // Toggle checkbox state for packing items
  const togglePackingItem = (item: string) => {
    setCheckedItems(prev => ({
      ...prev,
      [item]: !prev[item]
    }));
  };

  // Handle printer action optimized viewport PDF download
  const handlePrint = () => {
    try {
      window.focus();
      window.print();
    } catch (err) {
      console.error('Print call failed:', err);
    }
  };

  // Copy private/public live shareable URL
  const handleCopyLink = () => {
    const shareUrl = `${window.location.origin}/share/${trip.id}`;
    navigator.clipboard.writeText(shareUrl).then(() => {
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2500);
    }).catch(err => {
      console.error('Failed to copy links:', err);
    });
  };

  // Calculate Dynamic Expense Category Ratios
  const getExpensesBreakdown = () => {
    let lodging = 0;
    let transport = 0;
    let activities = 0;
    let food = 0;

    trip.itinerary.forEach(day => {
      day.activities.forEach(act => {
        const titleLower = act.title.toLowerCase();
        const descLower = act.description.toLowerCase();
        const costVal = Number(act.cost) || 0;

        if (titleLower.includes('hotel') || titleLower.includes('airbnb') || titleLower.includes('stay') || titleLower.includes('lodging') || titleLower.includes('resort')) {
          lodging += costVal;
        } else if (titleLower.includes('flight') || titleLower.includes('taxi') || titleLower.includes('uber') || titleLower.includes('cab') || titleLower.includes('metro') || titleLower.includes('train') || titleLower.includes('rent') || titleLower.includes('drive')) {
          transport += costVal;
        } else if (titleLower.includes('restaurant') || titleLower.includes('dinner') || titleLower.includes('lunch') || titleLower.includes('food') || titleLower.includes('cafe') || titleLower.includes('breakfast') || titleLower.includes('bar ') || titleLower.includes('street food')) {
          food += costVal;
        } else {
          activities += costVal;
        }
      });
    });

    const calculatedSum = lodging + transport + activities + food;
    const finalTotal = calculatedSum || trip.totalEstimatedBudget || 1;

    return {
      lodging: { amount: lodging, pct: Math.round((lodging / finalTotal) * 100) },
      transport: { amount: transport, pct: Math.round((transport / finalTotal) * 100) },
      food: { amount: food, pct: Math.round((food / finalTotal) * 100) },
      activities: { amount: activities, pct: Math.round((activities / finalTotal) * 100) },
      total: finalTotal
    };
  };

  const expenseStats = getExpensesBreakdown();

  // Handle local comment submission
  const handleSubmitComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!guestComment.trim() || !onPostComment) return;

    try {
      await onPostComment(guestName, guestComment);
      setGuestComment('');
      setCommentSuccess(true);
      setTimeout(() => setCommentSuccess(false), 3000);
    } catch (err) {
      console.error('Error recording guest comments:', err);
    }
  };

  // Convert Date formatting nicely
  const formatDate = (dateStr: string) => {
    try {
      const option: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric', year: 'numeric' };
      return new Date(dateStr).toLocaleDateString('en-US', option);
    } catch {
      return dateStr;
    }
  };

  return (
    <div id={`trip-viewer-${trip.id}`} className="w-full max-w-5xl mx-auto px-4 py-8 text-slate-100">
      
      {/* Print-only Header Brand */}
      <div className="hidden print:block mb-8 text-black border-b pb-4">
        <h1 className="text-3xl font-bold tracking-tight">AI Travel Itinerary Master</h1>
        <p className="text-sm text-gray-500">Curated specifically via AI Travel Itinerary Planner Inc.</p>
      </div>

      {/* Hero Meta Banner Card */}
      <div className="relative mb-8 overflow-hidden rounded-sm border border-white/5 bg-[#0a0a0a] p-6 md:p-8 shadow-xl">
        {/* Glow Element */}
        <div className="absolute right-0 top-0 -mr-20 -mt-20 h-56 w-56 rounded-full bg-[#c4a661]/5 blur-3xl opacity-60"></div>
        
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div className="flex items-start gap-4">
            <div className="rounded-sm bg-[#c4a661]/10 p-3.5 border border-[#c4a661]/15 text-[#c4a661]">
              <MapPin className="w-7 h-7" />
            </div>
            <div>
              <span className="text-[9px] font-mono tracking-[0.2em] text-[#c4a661] uppercase">
                ITINERARY RETRIEVED
              </span>
              <h2 className="text-2xl md:text-3xl font-serif text-white mt-1">
                {trip.destination}
              </h2>
              <div className="flex flex-wrap gap-y-1 gap-x-4 text-[10px] text-white/40 mt-2 font-mono uppercase tracking-wider">
                <span className="flex items-center gap-1.5">
                  <Calendar className="w-4 h-4 text-[#c4a661]/80" />
                  {formatDate(trip.startDate)}
                </span>
                <span className="text-white/10">|</span>
                <span>
                  {trip.itinerary?.length || 0} Day Expedition
                </span>
                {trip.fileAttached && (
                  <>
                    <span className="text-white/10">|</span>
                    <span className="text-[#c4a661] normal-case animate-pulse">Parsed from Booking Document</span>
                  </>
                )}
              </div>
            </div>
          </div>

          <div className="flex flex-row md:flex-col items-center md:items-end justify-between md:justify-center border-t border-white/5 md:border-0 pt-4 md:pt-0 gap-2">
            <span className="text-[9px] font-mono text-white/40 uppercase tracking-widest">
              ESTIMATED TOTAL BUDGET
            </span>
            <div className="flex items-center text-[#c4a661] text-3xl font-bold font-mono tracking-tight">
              <DollarSign className="w-7 h-7" />
              {trip.totalEstimatedBudget.toLocaleString()}
            </div>
          </div>
        </div>

        {/* Action Controls Panel */}
        <div className="flex flex-wrap gap-3 mt-6 pt-6 border-t border-white/5 print:hidden justify-between items-center w-full">
          <div className="flex gap-2">
            <button
              onClick={handleCopyLink}
              className="px-4 py-2 text-xs font-mono font-semibold flex items-center gap-2 rounded-sm bg-[#121212] border border-white/5 text-white/70 transition-colors hover:bg-white/5 hover:text-white cursor-pointer"
            >
              <Share2 className="w-4 h-4 text-[#c4a661]" />
              {copySuccess ? 'Copied Share Link!' : 'Copy Share Link'}
            </button>
            <button
              onClick={handlePrint}
              className="px-4 py-2 text-xs font-mono font-semibold flex items-center gap-2 rounded-sm bg-[#121212] border border-white/5 text-white/70 transition-colors hover:bg-white/5 hover:text-white cursor-pointer"
            >
              <Printer className="w-4 h-4 text-[#c4a661]" />
              Print / Save PDF
            </button>
          </div>
          <span className="text-[9px] font-mono text-white/20 tracking-wider uppercase">
            SECURE ACCESS SHA-256 VALIDATED
          </span>
        </div>
      </div>

      {/* Tab Navigation Switches */}
      <div className="flex overflow-x-auto scrollbar-none whitespace-nowrap border-b border-white/5 mb-6 print:hidden">
        <button
          onClick={() => setActiveTab('timeline')}
          className={`shrink-0 flex items-center gap-2 px-5 py-3 text-xs uppercase tracking-widest font-semibold border-b-2 transition-all cursor-pointer ${
            activeTab === 'timeline'
              ? 'border-[#c4a661] text-[#c4a661] bg-white/[0.02] rounded-t-sm'
              : 'border-transparent text-white/40 hover:text-white hover:bg-white/[0.01]'
          }`}
        >
          <Map className="w-4 h-4" />
          Day-Wise Timeline
        </button>
        <button
          onClick={() => setActiveTab('packing')}
          className={`shrink-0 flex items-center gap-2 px-5 py-3 text-xs uppercase tracking-widest font-semibold border-b-2 transition-all cursor-pointer ${
            activeTab === 'packing'
              ? 'border-[#c4a661] text-[#c4a661] bg-white/[0.02] rounded-t-sm'
              : 'border-transparent text-white/40 hover:text-white hover:bg-white/[0.01]'
          }`}
        >
          <ListCheck className="w-4 h-4" />
          Packing Checklist
        </button>
        <button
          onClick={() => setActiveTab('expenses')}
          className={`shrink-0 flex items-center gap-2 px-5 py-3 text-xs uppercase tracking-widest font-semibold border-b-2 transition-all cursor-pointer ${
            activeTab === 'expenses'
              ? 'border-[#c4a661] text-[#c4a661] bg-white/[0.02] rounded-t-sm'
              : 'border-transparent text-white/40 hover:text-white hover:bg-white/[0.01]'
          }`}
        >
          <PieChart className="w-4 h-4" />
          Expense Breakdown
        </button>
      </div>

      {/* CORE TAB SWITCHBOARDS */}
      <div className="min-h-[300px]">
        {/* TAB 1: Day-Wise Timeline */}
        {(activeTab === 'timeline' || true) && (
          <div className={`space-y-6 ${activeTab === 'timeline' ? 'block' : 'hidden print:block'}`}>
            {activeTab !== 'timeline' && (
              <h3 className="hidden print:flex text-sm font-mono tracking-[0.2em] text-[#c4a661] uppercase mt-10 mb-4 items-center gap-2 border-b border-white/10 pb-2 font-bold select-none">
                <Map className="w-4 h-4 text-[#c4a661]" />
                Day-Wise Timeline Detail
              </h3>
            )}
            {trip.itinerary?.map((dayNode) => {
              const isOpen = openDays[dayNode.day] || false;
              return (
                <div 
                  key={dayNode.day} 
                  className="rounded-sm border border-white/5 bg-[#0a0a0a] overflow-hidden shadow-md print:border-neutral-300 print:bg-white print:text-black print:mb-8"
                >
                  {/* Day Header Trigger accordion */}
                  <div 
                    onClick={() => toggleDay(dayNode.day)}
                    className="flex justify-between items-center p-4 md:p-5 bg-white/[0.01] border-b border-white/5 cursor-pointer select-none print:bg-neutral-100 print:text-black print:cursor-default"
                  >
                    <div className="flex items-center gap-4">
                      <div className="rounded-sm bg-[#c4a661]/10 px-3.5 py-1 text-xs font-mono font-semibold text-[#c4a661] print:bg-neutral-200 print:text-black">
                        DAY {dayNode.day}
                      </div>
                      <h3 className="text-sm md:text-base font-serif text-white tracking-wide print:text-black">
                        {dayNode.theme}
                      </h3>
                    </div>
                    <span className="text-[10px] font-mono text-[#c4a661] font-medium uppercase print:hidden">
                      {isOpen ? 'Collapse' : 'Expand'}
                    </span>
                  </div>

                  {/* Accordion Content Panel */}
                  <AnimatePresence initial={false}>
                    {isOpen ? (
                      <motion.div
                        initial={{ height: 0 }}
                        animate={{ height: 'auto' }}
                        exit={{ height: 0 }}
                        transition={{ duration: 0.25 }}
                        className="overflow-hidden"
                      >
                        <div className="p-5 md:p-6 space-y-6 border-t border-white/5 print:border-neutral-300">
                          {dayNode.activities?.length === 0 ? (
                            <p className="text-white/40 font-mono text-center text-xs print:text-black">No scheduled event activities recorded for this day.</p>
                          ) : (
                            <div className="relative pl-4 space-y-6 border-l border-white/10 print:border-neutral-300">
                              {dayNode.activities.map((activity, actIdx) => (
                                <div key={actIdx} className="relative group">
                                  {/* Activity node dot */}
                                  <div className="absolute -left-[21px] top-1.5 h-3 w-3 rounded-full border border-[#c4a661] bg-[#050505] group-hover:bg-[#c4a661] transition-colors duration-200 print:bg-black print:border-black"></div>
                                  
                                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                                    <div>
                                      <span className="flex items-center gap-1.5 text-[10px] font-bold font-mono text-[#c4a661]/80 uppercase tracking-widest print:text-neutral-700">
                                        <Clock className="w-3.5 h-3.5" />
                                        {activity.time}
                                      </span>
                                      <h4 className="text-sm font-serif font-light text-white mt-1 group-hover:text-[#c4a661] transition-colors print:text-black">
                                        {activity.title}
                                      </h4>
                                      <p className="text-white/60 text-xs mt-1 leading-relaxed print:text-neutral-700">
                                        {activity.description}
                                      </p>
                                    </div>

                                    <div className="flex items-center text-emerald-450 font-semibold font-mono text-xs self-start sm:self-center shrink-0 bg-emerald-500/5 px-2.5 py-1 rounded-sm border border-emerald-500/10 print:text-neutral-900 print:bg-transparent print:border-0 print:p-0">
                                      {activity.cost > 0 ? `+$${activity.cost.toLocaleString()}` : 'Free Activity'}
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </motion.div>
                    ) : (
                      /* Static Content block that shows up ONLY on print when collapsed on screen */
                      <div className="hidden print:block p-5 md:p-6 space-y-6 border-t border-white/5 print:border-neutral-300">
                        {dayNode.activities?.length === 0 ? (
                          <p className="text-white/40 font-mono text-center text-xs print:text-black">No scheduled event activities recorded for this day.</p>
                        ) : (
                          <div className="relative pl-4 space-y-6 border-l border-white/10 print:border-neutral-300">
                            {dayNode.activities.map((activity, actIdx) => (
                              <div key={actIdx} className="relative group">
                                <div className="absolute -left-[21px] top-1.5 h-3 w-3 rounded-full border border-[#c4a661] bg-[#050505] print:bg-black print:border-black"></div>
                                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                                  <div>
                                    <span className="flex items-center gap-1.5 text-[10px] font-bold font-mono text-[#c4a661]/80 uppercase tracking-widest print:text-neutral-700">
                                      <Clock className="w-3.5 h-3.5" />
                                      {activity.time}
                                    </span>
                                    <h4 className="text-sm font-serif font-light text-white mt-1 print:text-black">
                                      {activity.title}
                                    </h4>
                                    <p className="text-white/60 text-xs mt-1 leading-relaxed print:text-neutral-700">
                                      {activity.description}
                                    </p>
                                  </div>
                                  <div className="flex items-center text-emerald-450 font-semibold font-mono text-xs self-start sm:self-center shrink-0 bg-emerald-500/5 px-2.5 py-1 rounded-sm border border-emerald-500/10 print:text-neutral-900 print:bg-transparent print:border-0 print:p-0">
                                    {activity.cost > 0 ? `+$${activity.cost.toLocaleString()}` : 'Free Activity'}
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })}
          </div>
        )}

        {/* TAB 2: Packing Checklist */}
        {(activeTab === 'packing' || true) && (
          <div className={`rounded-sm border border-white/5 bg-[#0a0a0a] p-6 shadow-md print:bg-white print:border-neutral-300 print:text-black print:page-break-before ${activeTab === 'packing' ? 'block' : 'hidden print:block mt-8'}`}>
            <h3 className="text-lg font-serif font-light text-white tracking-wide mb-3 flex items-center gap-2 print:text-black print:border-b print:border-neutral-300 print:pb-2">
              <CheckSquare className="text-[#c4a661] w-5 h-5 print:text-black" />
              Dynamic Travel Packing Checklist
            </h3>
            <p className="text-white/40 text-xs mb-6 leading-relaxed print:text-neutral-500">
              Based on the weather, activities, and duration metadata of your itinerary, the planner generated this checklist.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
              {trip.packingChecklist?.map((item, idx) => {
                const isChecked = checkedItems[item] || false;
                return (
                  <div
                    key={idx}
                    onClick={() => togglePackingItem(item)}
                    className={`flex items-center gap-3.5 p-3.5 rounded-sm border cursor-pointer select-none transition-all print:border-neutral-200 print:py-2 ${
                      isChecked
                        ? 'border-[#c4a661]/20 bg-[#c4a661]/5 text-white/30 line-through print:text-neutral-400'
                        : 'border-white/5 bg-white/[0.01] text-white/80 hover:border-white/10 hover:bg-white/[0.02] print:text-black print:border-neutral-200'
                    }`}
                  >
                    {isChecked ? (
                      <CheckSquare className="w-5 h-5 text-[#c4a661] shrink-0 print:text-black" />
                    ) : (
                      <div className="w-4 h-4 border border-white/20 rounded-sm shrink-0 print:border-neutral-400"></div>
                    )}
                    <span className="text-xs font-mono uppercase tracking-wider">
                      {item}
                    </span>
                  </div>
                );
              })}
            </div>

            {/* Checklist Completion Gauge */}
            <div className="mt-8 pt-6 border-t border-white/5 print:hidden">
              <div className="flex justify-between text-[10px] font-mono text-white/40 uppercase mb-2">
                <span>Checklist completion tracker</span>
                <span>
                  {Object.values(checkedItems).filter(Boolean).length} / {trip.packingChecklist?.length || 0} Packed
                </span>
              </div>
              <div className="w-full bg-[#111111] rounded-none h-1.5 overflow-hidden border border-white/5">
                <div 
                  className="bg-[#c4a661] h-1.5 transition-all duration-300"
                  style={{ 
                    width: `${Math.round(
                      ((Object.values(checkedItems).filter(Boolean).length) / Math.max(1, trip.packingChecklist?.length || 1)) * 100
                    )}%` 
                  }}
                ></div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: Expense Breakdown Dynamic Analysis */}
        {(activeTab === 'expenses' || true) && (
          <div className={`rounded-sm border border-white/5 bg-[#0a0a0a] p-6 shadow-md print:bg-white print:border-neutral-300 print:text-black print:page-break-before ${activeTab === 'expenses' ? 'block' : 'hidden print:block mt-8'}`}>
            <h3 className="text-lg font-serif font-light text-white tracking-wide mb-3 flex items-center gap-2 print:text-black print:border-b print:border-neutral-300 print:pb-2">
              <PieChart className="text-[#c4a661] w-5 h-5 print:text-black" />
              Interactive Expense Profiler
            </h3>
            <p className="text-white/40 text-xs mb-8 leading-relaxed print:text-neutral-500">
              These calculations group scheduled daily expenses into main strategic cost nodes. Total scheduled sum: <b className="text-[#c4a661] font-mono print:text-black">${expenseStats.total.toLocaleString()}</b>.
            </p>

            <div className="space-y-6">
              {/* Category 1: Lodging */}
              <div>
                <div className="flex justify-between text-xs font-mono uppercase tracking-wider text-white/70 mb-2 print:text-black">
                  <span>Lodging & Accommodations</span>
                  <span className="font-mono text-emerald-450 print:text-neutral-700">${expenseStats.lodging.amount.toLocaleString()} ({expenseStats.lodging.pct}%)</span>
                </div>
                <div className="w-full bg-[#111111] h-2 border border-white/5 print:border-neutral-200">
                  <div className="bg-[#c4a661] h-2 transition-all print:bg-neutral-800" style={{ width: `${expenseStats.lodging.pct}%` }}></div>
                </div>
              </div>

              {/* Category 2: Transport */}
              <div>
                <div className="flex justify-between text-xs font-mono uppercase tracking-wider text-white/70 mb-2 print:text-black">
                  <span>Transit & Flights</span>
                  <span className="font-mono text-emerald-450 print:text-neutral-700">${expenseStats.transport.amount.toLocaleString()} ({expenseStats.transport.pct}%)</span>
                </div>
                <div className="w-full bg-[#111111] h-2 border border-white/5 print:border-neutral-200">
                  <div className="bg-emerald-555 h-2 transition-all print:bg-neutral-800" style={{ width: `${expenseStats.transport.pct}%` }}></div>
                </div>
              </div>

              {/* Category 3: Dining */}
              <div>
                <div className="flex justify-between text-xs font-mono uppercase tracking-wider text-white/70 mb-2 print:text-black">
                  <span>Food & Restaurants</span>
                  <span className="font-mono text-emerald-450 print:text-neutral-700">${expenseStats.food.amount.toLocaleString()} ({expenseStats.food.pct}%)</span>
                </div>
                <div className="w-full bg-[#111111] h-2 border border-white/5 print:border-neutral-200">
                  <div className="bg-amber-600/80 h-2 transition-all print:bg-neutral-800" style={{ width: `${expenseStats.food.pct}%` }}></div>
                </div>
              </div>

              {/* Category 4: Activities */}
              <div>
                <div className="flex justify-between text-xs font-mono uppercase tracking-wider text-[#e0e0e0] mb-2 print:text-black">
                  <span>Entry Sightseeing & Custom Excursions</span>
                  <span className="font-mono text-emerald-450 print:text-neutral-700">${expenseStats.activities.amount.toLocaleString()} ({expenseStats.activities.pct}%)</span>
                </div>
                <div className="w-full bg-[#111111] h-2 border border-white/5 print:border-neutral-200">
                  <div className="bg-purple-600/70 h-2 transition-all print:bg-neutral-800" style={{ width: `${expenseStats.activities.pct}%` }}></div>
                </div>
              </div>
            </div>

            <div className="p-4 rounded-sm bg-white/[0.01] border border-white/5 text-white/40 text-xs leading-relaxed mt-8 font-mono print:border-neutral-200 print:text-neutral-600">
              Note: Expense valuations are intelligent estimates of base rates in local regions. Real-world exchange indexes may present minor shifts.
            </div>
          </div>
        )}
      </div>

      {/* COOPERATIVE ANONYMOUS GUEST COMMENTS SECTION */}
      <div className="mt-12 pt-8 border-t border-white/5 print:hidden">
        <h3 className="text-lg font-serif font-light text-white mb-6 flex items-center gap-2">
          <MessageSquare className="text-[#c4a661] w-5 h-5 animate-pulse" />
          Collaborative Discussion Board (Public Trip Feedback)
        </h3>

        {/* Post Comment form triggers on request */}
        {onPostComment ? (
          <form onSubmit={handleSubmitComment} className="mb-8 p-5 bg-[#0a0a0a] rounded-sm border border-white/5">
            <h4 className="text-[9px] font-mono uppercase tracking-[0.15em] text-white/40 mb-4 border-b border-white/5 pb-2">
              Contribute anonymous travel tip or feedback
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              <div className="md:col-span-1">
                <label className="block text-[9px] font-mono text-white/40 uppercase mb-1">Your Alias Name</label>
                <input
                  type="text"
                  placeholder="e.g. Explorer007"
                  value={guestName}
                  onChange={(e) => setGuestName(e.target.value)}
                  className="w-full bg-[#111] border border-white/5 rounded-sm px-3 py-2 text-xs text-white placeholder-white/20 focus:outline-none focus:border-[#c4a661]"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-[9px] font-mono text-white/40 uppercase mb-1">Comment / Travel Warning (Required)</label>
                <div className="relative">
                  <input
                    type="text"
                    required
                    placeholder="Provide comments, warning tips (e.g. Wear sunscreen!)"
                    value={guestComment}
                    onChange={(e) => setGuestComment(e.target.value)}
                    className="w-full bg-[#111] border border-white/10 rounded-sm pl-3.5 pr-12 py-2 text-xs text-white placeholder-white/20 focus:outline-none focus:border-[#c4a661]"
                  />
                  <button
                    type="submit"
                    disabled={commentLoading}
                    className="absolute right-1.5 top-1/2 -translate-y-1/2 p-1.5 bg-[#c4a661] hover:bg-[#b09352] rounded-sm text-black transition-colors duration-200 cursor-pointer"
                  >
                    <Send className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>

            {commentSuccess && (
              <p className="text-emerald-400 text-[10px] font-mono">✓ Travel comment added successfully!</p>
            )}
          </form>
        ) : (
          <div className="mb-6 p-4 bg-white/[0.01] border border-white/5 rounded-sm text-xs font-mono text-white/40">
            🔒 Log-in as reviewer to write directly. Real-time review comments can be posted on public links.
          </div>
        )}

        {/* Comments Feed Logs */}
        <div className="space-y-4">
          {!trip.comments || trip.comments.length === 0 ? (
            <p className="text-white/30 text-xs font-mono italic text-center py-4 bg-white/[0.01] rounded-sm border border-dashed border-white/5">
              No remarks logged on this shared itinerary board yet. Be the first to advise!
            </p>
          ) : (
            trip.comments.slice().reverse().map((item) => (
              <div 
                key={item.id} 
                className="flex items-start gap-3.5 p-4 rounded-sm border border-white/5 bg-[#0a0a0a] relative overflow-hidden"
              >
                <div className="rounded-sm bg-[#111] p-2 border border-white/5 text-[#c4a661] mt-0.5">
                  <MessageSquare className="w-4 h-4" />
                </div>
                <div className="flex-1">
                  <div className="flex justify-between items-baseline gap-2">
                    <span className="text-xs font-bold text-white/80">{item.name}</span>
                    <span className="text-[9px] font-mono text-[#c4a661]">{formatDate(item.createdAt)}</span>
                  </div>
                  <p className="text-white/60 text-xs mt-1.5 leading-relaxed font-sans flex items-start gap-1">
                    <CornerDownRight className="w-3 h-3 text-[#c4a661] inline shrink-0 mt-0.5" />
                    {item.comment}
                  </p>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
