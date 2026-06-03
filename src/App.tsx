/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Compass, Sparkles, Navigation, User as UserIcon } from 'lucide-react';
import Landing from './pages/Landing';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import SharedView from './pages/SharedView';
import { getStoredUser } from './utils/auth';
import { User } from './types';

export default function App() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [currentView, setCurrentView] = useState<'landing' | 'login' | 'dashboard' | 'share'>('landing');

  // Synchronize on startup authentication records
  useEffect(() => {
    const user = getStoredUser();
    if (user) {
      setCurrentUser(user);
    }

    // Direct url routes mapping
    const handleRouteSync = () => {
      const path = window.location.pathname;
      if (path.startsWith('/share/')) {
        setCurrentView('share');
      } else if (path === '/dashboard') {
        const authedUser = getStoredUser();
        if (authedUser) {
          setCurrentView('dashboard');
        } else {
          // If unauthenticated, divert to logging hub
          setCurrentView('login');
        }
      } else if (path === '/login') {
        setCurrentView('login');
      } else {
        setCurrentView('landing');
      }
    };

    handleRouteSync();
    window.addEventListener('popstate', handleRouteSync);
    
    return () => {
      window.removeEventListener('popstate', handleRouteSync);
    };
  }, []);

  // Custom navigator hook pushing history states
  const navigateTo = (view: 'landing' | 'login' | 'dashboard' | 'share', customUrl?: string) => {
    const targetPath = customUrl || (
      view === 'landing' ? '/' :
      view === 'login' ? '/login' :
      view === 'dashboard' ? '/dashboard' : '/'
    );

    window.history.pushState({}, '', targetPath);
    setCurrentView(view);
  };

  // Callback on authentication resolution
  const handleAuthResolution = (user: User) => {
    setCurrentUser(user);
    navigateTo('dashboard');
  };

  // Callback on session de-authentication
  const handleLogoutResolution = () => {
    setCurrentUser(null);
    navigateTo('landing');
  };

  return (
    <div className="bg-[#050505] min-h-screen font-sans selection:bg-[#c4a661]/20 selection:text-white">
      
      {/* GLOBAL NAVBAR HEADER CARD (Hidden on dashboard/share view for workspace size) */}
      {(currentView === 'landing' || currentView === 'login') && (
        <header className="sticky top-0 z-50 w-full border-b border-white/5 bg-[#050505]/90 backdrop-blur-md px-6 py-4 flex items-center justify-between print:hidden">
          <div 
            onClick={() => navigateTo('landing')}
            className="flex items-center gap-2.5 cursor-pointer select-none group"
          >
            <div className="p-2 bg-[#c4a661]/10 border border-[#c4a661]/15 rounded-sm text-[#c4a661] transition-colors group-hover:bg-[#c4a661]/20">
              <Navigation className="w-4 h-4" />
            </div>
            <div>
              <span className="text-xs font-mono font-bold text-white tracking-[0.15em] uppercase flex items-center gap-1">
                AI Travel Planner
                <Sparkles className="w-3.5 h-3.5 text-[#c4a661] animate-pulse" />
              </span>
              <p className="text-[9px] font-mono text-white/40 uppercase tracking-[0.1em] mt-0.5">SaaS TRAVEL COMPULATOR</p>
            </div>
          </div>

          <nav className="flex items-center gap-4">
            {currentUser ? (
              <button
                onClick={() => navigateTo('dashboard')}
                className="px-4 py-2 bg-[#c4a661] hover:bg-[#b09352] text-black font-semibold text-xs tracking-widest uppercase rounded-sm shadow-md transition-all cursor-pointer"
              >
                Traveler Profile
              </button>
            ) : (
              <button
                onClick={() => navigateTo('login')}
                className="px-4 py-2 border border-[#c4a661]/35 hover:bg-[#c4a661]/5 text-[#c4a661] font-semibold text-xs tracking-widest uppercase rounded-sm shadow-md transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                <UserIcon className="w-3.5 h-3.5" />
                Sign In / Access
              </button>
            )}
          </nav>
        </header>
      )}

      {/* CORE PAGES RENDER ENGINE */}
      <main className="w-full">
        {currentView === 'landing' && (
          <Landing 
            onStart={() => navigateTo('login')}
            isAuthenticated={!!currentUser}
            onNavigateToDashboard={() => navigateTo('dashboard')}
          />
        )}
        
        {currentView === 'login' && (
          <Login 
            onAuthSuccess={handleAuthResolution} 
            onNavigateHome={() => navigateTo('landing')}
          />
        )}
        
        {currentView === 'dashboard' && currentUser && (
          <Dashboard 
            user={currentUser} 
            onLogout={handleLogoutResolution}
          />
        )}

        {currentView === 'share' && (
          <SharedView 
            onNavigateHome={() => navigateTo('landing')}
          />
        )}
      </main>

      {/* GLOBAL FOOTER BRAND (Hidden on dashboard/share view) */}
      {(currentView === 'landing' || currentView === 'login') && (
        <footer className="border-t border-white/5 bg-[#050505] py-8 text-center text-[9px] font-mono text-white/30 uppercase tracking-[0.2em] print:hidden">
          Curated globally in deep sandboxed environments • AI Travel Itinerary Planner 2026
        </footer>
      )}
    </div>
  );
}
