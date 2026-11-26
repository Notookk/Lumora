import { useEffect, useRef, useState } from 'react';
import type { MochiGlow } from '../types/lumora';

export default function MochiAvatar({
  glow,
  doNotDisturb,
  celebrating,
}: {
  glow: MochiGlow;
  doNotDisturb: boolean;
  celebrating: boolean;
}) {
  const [blinking, setBlinking] = useState(false);
  const avatarRef = useRef<HTMLDivElement>(null);
  const pupilsRef = useRef<SVGGElement>(null);

  useEffect(() => {
    let blinkTimer = 0;
    let nextTimer = 0;
    const blink = () => {
      setBlinking(true);
      blinkTimer = window.setTimeout(() => {
        setBlinking(false);
        nextTimer = window.setTimeout(blink, 3000 + Math.random() * 3000);
      }, 140);
    };
    nextTimer = window.setTimeout(blink, 2600 + Math.random() * 2400);
    return () => {
      window.clearTimeout(blinkTimer);
      window.clearTimeout(nextTimer);
    };
  }, []);

  useEffect(() => {
    if (doNotDisturb) return;
    const onPointerMove = (event: PointerEvent) => {
      const bounds = avatarRef.current?.getBoundingClientRect();
      if (!bounds || !pupilsRef.current) return;
      const x = (event.clientX - (bounds.left + bounds.width / 2)) / (window.innerWidth / 2);
      const y = (event.clientY - (bounds.top + bounds.height / 2)) / (window.innerHeight / 2);
      const offsetX = Math.max(-3.4, Math.min(3.4, x * 4.2));
      const offsetY = Math.max(-2.6, Math.min(2.6, y * 3.4));
      pupilsRef.current.style.transform = `translate(${offsetX}px, ${offsetY}px)`;
    };
    window.addEventListener('pointermove', onPointerMove, { passive: true });
    return () => window.removeEventListener('pointermove', onPointerMove);
  }, [doNotDisturb]);

  return (
    <div ref={avatarRef} className={`mochi-avatar glow-${glow} ${doNotDisturb ? 'is-sleepy' : ''} ${celebrating ? 'is-celebrating' : ''}`}>
      <div className="mochi-halo" aria-hidden="true" />
      <svg viewBox="0 0 120 112" role="img" aria-label={doNotDisturb ? 'Mochi is sleeping' : 'Mochi, your Lumora companion'}>
        <defs>
          <radialGradient id="mochi-body" cx="38%" cy="24%" r="82%">
            <stop offset="0" stopColor="#FFFFFF" stopOpacity="0.98" />
            <stop offset="0.56" stopColor="#EEF7FF" stopOpacity="0.93" />
            <stop offset="1" stopColor="#B7D8F2" stopOpacity="0.78" />
          </radialGradient>
          <linearGradient id="mochi-edge" x1="0" y1="0" x2="1" y2="1">
            <stop stopColor="#FFFFFF" stopOpacity="0.92" />
            <stop offset="1" stopColor="#9EC8E8" stopOpacity="0.28" />
          </linearGradient>
          <filter id="mochi-shadow" x="-40%" y="-40%" width="180%" height="190%">
            <feDropShadow dx="0" dy="7" stdDeviation="7" floodColor="#020811" floodOpacity="0.42" />
          </filter>
          <filter id="mochi-soft" x="-30%" y="-30%" width="160%" height="170%">
            <feGaussianBlur stdDeviation="4" />
          </filter>
        </defs>
        <path d="M60 10C86 10 106 27 107 52c1 28-17 49-47 50C33 103 13 86 13 59 12 32 32 10 60 10Z" fill="#B9DCFF" opacity="0.2" filter="url(#mochi-soft)" />
        <path d="M60 13C85 13 103 29 104 53c1 26-16 45-44 46-27 1-46-16-47-41-1-26 17-42 47-45Z" fill="url(#mochi-body)" stroke="url(#mochi-edge)" strokeWidth="1.4" filter="url(#mochi-shadow)" />
        <path d="M31 34c8-11 20-16 34-16" fill="none" stroke="#FFFFFF" strokeWidth="4" strokeLinecap="round" opacity="0.42" />
        <g ref={pupilsRef} className="mochi-pupils">
          {doNotDisturb ? (
            <>
              <path d="M35 56c4 4 9 4 13 0" fill="none" stroke="#16283A" strokeWidth="3.4" strokeLinecap="round" />
              <path d="M72 56c4 4 9 4 13 0" fill="none" stroke="#16283A" strokeWidth="3.4" strokeLinecap="round" />
            </>
          ) : blinking ? (
            <>
              <path d="M36 57h11" stroke="#16283A" strokeWidth="3.4" strokeLinecap="round" />
              <path d="M73 57h11" stroke="#16283A" strokeWidth="3.4" strokeLinecap="round" />
            </>
          ) : (
            <>
              <ellipse cx="41.5" cy="55" rx="5.7" ry="8.2" fill="#142638" />
              <ellipse cx="78.5" cy="55" rx="5.7" ry="8.2" fill="#142638" />
              <circle cx="39.8" cy="52.3" r="1.7" fill="#FFFFFF" opacity="0.8" />
              <circle cx="76.8" cy="52.3" r="1.7" fill="#FFFFFF" opacity="0.8" />
            </>
          )}
        </g>
        <ellipse cx="31" cy="68" rx="7" ry="3.5" fill="#F3A9B5" opacity="0.24" />
        <ellipse cx="89" cy="68" rx="7" ry="3.5" fill="#F3A9B5" opacity="0.24" />
        <path d={doNotDisturb ? 'M56 72h8' : 'M57 70c2 3 4 3 6 0'} fill="none" stroke="#385069" strokeWidth="2" strokeLinecap="round" opacity="0.7" />
      </svg>
    </div>
  );
}
