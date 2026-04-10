"use client";

interface LoaderProps {
  isOverlay?: boolean;
  text?: string;
  subtext?: string;
}

const Loader = ({ 
  isOverlay = false, 
  text = "Syncing...", 
  subtext 
}: LoaderProps) => {

  // Fiber Optic Logo Animation
  const FiberOpticLogo = (
    <div className="relative flex h-24 w-24 items-center justify-center">
      
      {/* Custom Keyframes for the data lasers */}
      <style>{`
        @keyframes laserUp {
          0% { top: 100%; opacity: 0; }
          10% { opacity: 1; }
          90% { opacity: 1; }
          100% { top: -100%; opacity: 0; }
        }
        @keyframes laserDown {
          0% { top: -100%; opacity: 0; }
          10% { opacity: 1; }
          90% { opacity: 1; }
          100% { top: 100%; opacity: 0; }
        }
        @keyframes pulseArrow {
          0%, 100% { opacity: 0.4; filter: drop-shadow(0 0 2px rgba(var(--primary), 0.2)); }
          50% { opacity: 1; filter: drop-shadow(0 0 10px rgba(var(--primary), 1)); }
        }
      `}</style>

      {/* The Container is rotated to match the angled slant of your logo */}
      <div className="relative flex rotate-[45deg] scale-110 items-center justify-center space-x-2">
        
        {/* Background Glow */}
        <div className="absolute h-16 w-16 animate-pulse rounded-full bg-primary/10 blur-xl"></div>

        {/* --- LEFT / TOP TUBE --- (Shifted UP using mb-6) */}
        <div className="relative mb-6 h-16 w-5 overflow-hidden rounded-full border-[2px] border-primary/30 bg-primary/5 shadow-[0_0_15px_rgba(var(--primary),0.1)]">
          
          {/* Arrow Head inside the tube (Pulses when laser hits) */}
          <div 
            className="absolute top-1 left-1/2 z-10 h-0 w-0 -translate-x-1/2 border-b-[6px] border-l-[5px] border-r-[5px] border-b-primary border-l-transparent border-r-transparent"
            style={{ animation: 'pulseArrow 1.5s ease-in-out infinite' }}
          />

          {/* Shooting Data Laser (Up) with comet tail */}
          <div 
            className="absolute left-0 w-full h-8 rounded-full bg-gradient-to-t from-transparent via-primary/80 to-primary blur-[1px]"
            style={{ animation: 'laserUp 1.5s cubic-bezier(0.4, 0, 0.2, 1) infinite' }}
          />
        </div>

        {/* --- RIGHT / BOTTOM TUBE --- (Shifted DOWN using mt-6) */}
        <div className="relative mt-6 h-16 w-5 overflow-hidden rounded-full border-[2px] border-white/20 bg-white/5 shadow-[0_0_15px_rgba(255,255,255,0.1)]">
          
          {/* Shooting Data Laser (Down) with comet tail */}
          <div 
            className="absolute left-0 w-full h-8 rounded-full bg-gradient-to-b from-transparent via-white/80 to-white blur-[1px]"
            style={{ animation: 'laserDown 1.5s cubic-bezier(0.4, 0, 0.2, 1) infinite 0.75s' }}
          />
        </div>

      </div>
    </div>
  );

  const displayText = (text === "Loading..." || text === "Syncing...") ? "SYNCING" : text;

  if (isOverlay) {
    return (
      <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-[#0a0a0a]/95 backdrop-blur-md transition-opacity">
        
        {FiberOpticLogo}
        
        <div className="mt-8 flex flex-col items-center text-center">
          <h3 className="flex items-center space-x-1 text-2xl font-bold tracking-[0.25em] text-white uppercase">
            <span>{displayText}</span>
            <span className="animate-pulse text-primary drop-shadow-[0_0_8px_rgba(var(--primary),0.8)]">++</span>
          </h3>
          
          {subtext && (
            <p className="mt-3 text-xs font-mono tracking-[0.2em] text-primary/70 uppercase">
              {subtext}
            </p>
          )}
        </div>
      </div>
    );
  }

  // Inline version for page loads
  return (
    <div className="flex h-full min-h-[40vh] w-full flex-col items-center justify-center">
      <div className="scale-75">{FiberOpticLogo}</div>
      {text !== "Loading..." && (
        <h3 className="mt-6 flex items-center space-x-1 text-sm font-bold tracking-widest text-gray-400 uppercase">
          <span>{displayText}</span>
          <span className="animate-pulse text-primary">++</span>
        </h3>
      )}
    </div>
  );
};

export default Loader;
