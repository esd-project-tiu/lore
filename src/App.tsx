import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Navbar } from './components/Navbar';
import { LandingPage } from './components/LandingPage';
import { Dashboard } from './components/Dashboard';
import { AddTitlePage } from './components/AddTitlePage';
import { WorldPage } from './components/WorldPage';
import { CartographicCompass } from './components/CartographicCompass';
import { World } from './types';
import { ALICE_DEMO_WORLD } from './data/aliceDemoWorld';
import { worldsService } from './services/worldsService';

type ViewMode = 'landing' | 'dashboard' | 'add' | 'world';

const LoreMain: React.FC = () => {
  const { user, loading } = useAuth();
  const [currentView, setCurrentView] = useState<ViewMode>('landing');
  const [activeWorld, setActiveWorld] = useState<World | null>(null);
  const [isGeneratingLore, setIsGeneratingLore] = useState(false);
  const [isSharedWorld, setIsSharedWorld] = useState(false);
  const [isLoadingSharedWorld, setIsLoadingSharedWorld] = useState(false);

  // Check URL query parameters for public share link: ?world=<id> or ?share=<id>
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const sharedWorldId = params.get('world') || params.get('share');

    if (sharedWorldId) {
      setIsLoadingSharedWorld(true);
      worldsService
        .getPublicWorld(sharedWorldId)
        .then((world) => {
          if (world) {
            setActiveWorld(world);
            setIsSharedWorld(true);
            setCurrentView('world');
          }
        })
        .catch((err) => {
          console.warn('Could not load shared world:', err);
        })
        .finally(() => {
          setIsLoadingSharedWorld(false);
        });
    }
  }, []);

  // Once auth finishes loading, default authenticated users to their dashboard if on landing and not viewing a shared world
  useEffect(() => {
    if (!loading && user && currentView === 'landing' && !isSharedWorld) {
      setCurrentView('dashboard');
    }
  }, [user, loading, isSharedWorld, currentView]);

  const handleOpenWorld = (world: World) => {
    setIsSharedWorld(false);
    setActiveWorld(world);
    setCurrentView('world');
  };

  const handleOpenDemoWorld = () => {
    setIsSharedWorld(true);
    setActiveWorld(ALICE_DEMO_WORLD);
    setCurrentView('world');
  };

  const handleGenerateLore = async (world: World) => {
    if (!user) return;
    setIsGeneratingLore(true);
    try {
      const result = await worldsService.generateWorldViaServer(
        world.title,
        world.type,
        world.note,
        world.id,
        world.sources
      );

      const updatedWorld: World = {
        ...world,
        tone: result.data.tone,
        themes: result.data.themes,
        blurb: result.data.blurb,
        places: result.data.places,
        characters: result.data.characters,
        storyHooks: result.data.storyHooks || [],
        status: 'ready',
        updatedAt: new Date().toISOString(),
      };

      setActiveWorld(updatedWorld);
    } catch (err: any) {
      console.error('Failed to generate lore on WorldPage:', err);
    } finally {
      setIsGeneratingLore(false);
    }
  };

  if (isLoadingSharedWorld) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#f3e7cf] text-[#2b2118]">
        <div className="w-16 h-16 rounded-full bg-[#ead9b8] border-2 border-[#826a4c] flex items-center justify-center animate-pulse mb-4 shadow-md">
          <CartographicCompass size={36} color="#5a4632" />
        </div>
        <p className="text-xs font-sc text-[#5a4632] uppercase tracking-widest">
          Consulting the Explorer's Archive...
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#f3e7cf] text-[#2b2118] selection:bg-[#a2562b]/20 selection:text-[#2b2118]">
      <Navbar
        currentView={currentView === 'world' ? 'dashboard' : currentView}
        onNavigate={(view) => {
          if (view === 'landing') {
            setActiveWorld(null);
            setIsSharedWorld(false);
            if (window.location.search) {
              window.history.replaceState({}, '', window.location.pathname);
            }
          }
          setCurrentView(view);
        }}
      />

      <main className="flex-1">
        {currentView === 'landing' && (
          <LandingPage
            onGoToDashboard={() => setCurrentView('dashboard')}
            onGoToAdd={() => setCurrentView('add')}
            onExploreDemoWorld={handleOpenDemoWorld}
          />
        )}

        {currentView === 'dashboard' && (
          <>
            {user ? (
              <Dashboard
                onNavigateToAdd={() => setCurrentView('add')}
                onNavigateToPreview={() => setCurrentView('landing')}
                onOpenWorld={handleOpenWorld}
              />
            ) : (
              <div className="py-24 px-4 text-center max-w-lg mx-auto">
                <div className="w-16 h-16 rounded-full bg-[#ead9b8] border-2 border-[#826a4c] flex items-center justify-center mx-auto mb-6 shadow-md">
                  <CartographicCompass size={34} color="#5a4632" />
                </div>
                <h2 className="font-heading text-3xl text-[#2b2118] mb-3">
                  Explorer's Study
                </h2>
                <p className="text-sm text-[#5a4632] mb-6 font-body leading-relaxed">
                  Please sign in with your Google account to open your personal folio of fictional world maps.
                </p>
                <button
                  onClick={() => setCurrentView('landing')}
                  className="btn-seal px-6 py-2.5 rounded-lg text-xs font-medium cursor-pointer"
                >
                  Return to Atlas Overview
                </button>
              </div>
            )}
          </>
        )}

        {currentView === 'add' && (
          <>
            {user ? (
              <AddTitlePage
                onBackToDashboard={() => setCurrentView('dashboard')}
                onSuccess={(createdWorld) => {
                  if (createdWorld) {
                    setActiveWorld(createdWorld);
                    setIsSharedWorld(false);
                    setCurrentView('world');
                  } else {
                    setCurrentView('dashboard');
                  }
                }}
              />
            ) : (
              <div className="py-24 px-4 text-center max-w-lg mx-auto">
                <h2 className="font-heading text-3xl text-[#2b2118] mb-3">
                  Sign in to Chart a Realm
                </h2>
                <p className="text-sm text-[#5a4632] mb-6 font-body leading-relaxed">
                  Sign in with Google to bind and preserve your world chronicles in your personal atlas.
                </p>
                <button
                  onClick={() => setCurrentView('landing')}
                  className="btn-seal px-6 py-2.5 rounded-lg text-xs font-medium cursor-pointer"
                >
                  Go to Sign In
                </button>
              </div>
            )}
          </>
        )}

        {currentView === 'world' && activeWorld && (
          <WorldPage
            world={activeWorld}
            readOnly={isSharedWorld && (!user || user.uid !== activeWorld.userId)}
            onBack={() => {
              if (window.location.search) {
                window.history.replaceState({}, '', window.location.pathname);
              }
              setCurrentView(user ? 'dashboard' : 'landing');
            }}
            onGenerateLore={handleGenerateLore}
            isGenerating={isGeneratingLore}
          />
        )}
      </main>

      {/* Handcrafted Atlas Footer */}
      <footer className="mt-auto border-t border-[#d8c5a2] bg-[#ead9b8]/80 py-8 px-4 sm:px-6 text-center text-xs text-[#5a4632]">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <CartographicCompass size={20} color="#5a4632" />
            <span className="font-heading text-lg font-semibold text-[#2b2118]">Lore</span>
            <span className="text-[#8a7355]">·</span>
            <span className="text-xs font-sc text-[#5a4632] tracking-wider">
              An Explorer's Atlas for Writers & Tabletop GMs
            </span>
          </div>

          <div className="text-xs font-notes text-[#5a4632]">
            45° 18' N · 12° 20' E · Folio No. 04
          </div>

          <div className="text-xs text-[#735d44] font-body">
            Hand-drawn cartography on aged parchment
          </div>
        </div>
      </footer>
    </div>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <LoreMain />
    </AuthProvider>
  );
}
