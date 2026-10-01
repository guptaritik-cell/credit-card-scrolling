import React, { useState, useEffect } from 'react';
import { CardData, TuningConfig, INITIAL_CARDS, DEFAULT_TUNING } from './types';
import { CardCarousel3D } from './components/CardCarousel3D';
import { TuningSidebar } from './components/TuningSidebar';
import { haptics } from './utils/haptics';

export default function App() {
  const [cards, setCards] = useState<CardData[]>(INITIAL_CARDS);
  const [tuning, setTuning] = useState<TuningConfig>({
    ...DEFAULT_TUNING,
  });
  const [activeCardId, setActiveCardId] = useState<string>(INITIAL_CARDS[0].id);

  // Mobile detection: screen width <= 768px or mobile touch userAgent
  const [isMobile, setIsMobile] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    return (
      window.innerWidth <= 768 ||
      /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
    );
  });

  // Sidebar sizing and drag-resizing state
  // On desktop: 25% default width (resizable). On mobile: completely hidden!
  const [sidebarWidthPercent, setSidebarWidthPercent] = useState<number>(25);
  const [isResizing, setIsResizing] = useState<boolean>(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(() => {
    if (typeof window === 'undefined') return true;
    return !(
      window.innerWidth <= 768 ||
      /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
    );
  });
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);

  // Resize listener to adapt immediately when orientation changes or viewport resizes
  useEffect(() => {
    const handleViewportChange = () => {
      const mobile =
        window.innerWidth <= 768 ||
        /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
      setIsMobile(mobile);
      if (mobile) {
        setIsSidebarOpen(false);
      }
    };

    window.addEventListener('resize', handleViewportChange);
    window.addEventListener('orientationchange', handleViewportChange);
    return () => {
      window.removeEventListener('resize', handleViewportChange);
      window.removeEventListener('orientationchange', handleViewportChange);
    };
  }, []);

  const handleCardUpdate = (updatedCard: CardData) => {
    setCards((prev) =>
      prev.map((c) => (c.id === updatedCard.id ? updatedCard : c))
    );
  };

  const handleSoundToggle = () => {
    const next = !soundEnabled;
    setSoundEnabled(next);
    haptics.setSoundEnabled(next);
    if (next) {
      haptics.unlockAudio();
      haptics.triggerTick(1.2);
    }
  };

  const handlePointerDownResize = (e: React.PointerEvent) => {
    e.preventDefault();
    setIsResizing(true);
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  };

  const handlePointerMoveResize = (e: React.PointerEvent) => {
    if (!isResizing) return;
    const windowWidth = window.innerWidth;
    const newWidthPx = windowWidth - e.clientX;
    const newPercent = (newWidthPx / windowWidth) * 100;
    // Clamp comfortably between 18% and 60%
    setSidebarWidthPercent(Math.min(60, Math.max(18, newPercent)));
  };

  const handlePointerUpResize = (e: React.PointerEvent) => {
    if (isResizing) {
      setIsResizing(false);
      try {
        (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);
      } catch {
        // ignore
      }
    }
  };

  // Prevent unwanted selection while dragging
  useEffect(() => {
    if (isResizing) {
      document.body.style.cursor = 'col-resize';
      document.body.style.userSelect = 'none';
    } else {
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    }
    return () => {
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };
  }, [isResizing]);

  return (
    <div className="h-screen w-screen bg-neutral-950 text-neutral-100 flex overflow-hidden font-sans select-none">
      {/* 3D Interactive Carousel Screen */}
      <main
        className="h-full flex-1 flex flex-col justify-center items-center relative overflow-hidden bg-neutral-950 transition-[width] duration-75 w-full"
        style={{
          width: !isMobile && isSidebarOpen ? `${100 - sidebarWidthPercent}%` : '100%',
        }}
      >
        {/* Subtle radial ambient glow */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(16,185,129,0.03),transparent_70%)] pointer-events-none" />

        {/* 3D Carousel Stage */}
        <CardCarousel3D
          cards={cards}
          tuning={tuning}
          onTuningChange={setTuning}
          activeCardId={activeCardId}
          onActiveCardChange={setActiveCardId}
          onCardUpdate={handleCardUpdate}
          soundEnabled={soundEnabled}
          onSoundToggle={handleSoundToggle}
          onToggleSidebar={() => setIsSidebarOpen((prev) => !prev)}
          isSidebarOpen={isSidebarOpen}
          isMobile={isMobile}
        />
      </main>

      {/* Draggable Divider Handle between 3D Stage and Sidebar (Desktop only) */}
      {!isMobile && isSidebarOpen && (
        <div
          onPointerDown={handlePointerDownResize}
          onPointerMove={handlePointerMoveResize}
          onPointerUp={handlePointerUpResize}
          onPointerCancel={handlePointerUpResize}
          className={`hidden md:flex w-2.5 h-full shrink-0 relative z-40 cursor-col-resize items-center justify-center transition-colors group ${
            isResizing ? 'bg-emerald-500' : 'bg-neutral-900/90 hover:bg-emerald-500/50'
          }`}
          title="Drag to resize 3D Physics Tuning Sidebar"
        >
          {/* Subtle vertical dots / grip visual */}
          <div className="flex flex-col gap-1 items-center justify-center pointer-events-none py-2">
            <span className={`w-1 h-1 rounded-full ${isResizing ? 'bg-black' : 'bg-neutral-600 group-hover:bg-emerald-200'}`} />
            <span className={`w-1 h-1 rounded-full ${isResizing ? 'bg-black' : 'bg-neutral-600 group-hover:bg-emerald-200'}`} />
            <span className={`w-1 h-1 rounded-full ${isResizing ? 'bg-black' : 'bg-neutral-600 group-hover:bg-emerald-200'}`} />
            <span className={`w-1 h-1 rounded-full ${isResizing ? 'bg-black' : 'bg-neutral-600 group-hover:bg-emerald-200'}`} />
          </div>
        </div>
      )}

      {/* Right Area: Tuning Sidebar (Desktop only) */}
      {!isMobile && isSidebarOpen && (
        <div
          className="hidden md:block h-full shrink-0 overflow-hidden"
          style={{
            width: `${sidebarWidthPercent}%`,
          }}
        >
          <TuningSidebar
            tuning={tuning}
            onTuningChange={setTuning}
            soundEnabled={soundEnabled}
            onSoundToggle={handleSoundToggle}
          />
        </div>
      )}
    </div>
  );
}
