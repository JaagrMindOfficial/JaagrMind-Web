'use client';

import { useState, useEffect } from 'react';
import { Clap } from '@/components/icons/Clap';
import { addClaps, getSessionId } from '@/lib/api';

interface ClapsButtonProps {
  postId: string;
  initialCount?: number;
}

export function ClapsButton({ postId, initialCount = 0 }: ClapsButtonProps) {
  const [count, setCount] = useState(initialCount);
  const [isClapping, setIsClapping] = useState(false);
  const [showBurst, setShowBurst] = useState(false);
  const [pendingClaps, setPendingClaps] = useState(0);

  console.log('[ClapsButton] Initial:', initialCount, 'Current:', count);

  // Debounced clap submission
  useEffect(() => {
    if (pendingClaps === 0) return;

    const timer = setTimeout(async () => {
      try {
        const sessionId = getSessionId();
        const result = await addClaps(postId, pendingClaps, sessionId);
        if (result) {
          setCount(result.totalClaps);
        }
        setPendingClaps(0);
      } catch (error) {
        console.error('Failed to submit claps:', error);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [pendingClaps, postId]);

  const handleClap = () => {
    // Max 50 claps per user
    if (pendingClaps >= 50) return;

    setIsClapping(true);
    setShowBurst(true);
    setPendingClaps((prev) => Math.min(prev + 1, 50));
    setCount((prev) => prev + 1);

    // Reset animation states
    setTimeout(() => setIsClapping(false), 150);
    setTimeout(() => setShowBurst(false), 400);
  };

  return (
    <button
      onClick={handleClap}
      className="group flex items-center gap-2 text-muted hover:text-accent transition-colors"
      aria-label="Clap"
    >
      <div className="relative">
        {/* Burst effect */}
        {showBurst && (
          <div className="absolute inset-0 animate-ping">
            <Clap className="w-6 h-6 text-accent fill-accent" />
          </div>
        )}
        
        {/* Main clap icon */}
        <Clap
          className={`w-6 h-6 transition-transform ${
            isClapping ? 'scale-125' : 'scale-100'
          } ${pendingClaps > 0 ? 'text-accent fill-accent/20' : 'text-muted-foreground'}`}
        />
      </div>
      
      <span className="text-sm tabular-nums">
        {count > 0 ? count.toLocaleString() : 'Clap'}
      </span>
      
      {/* Pending indicator */}
      {pendingClaps > 0 && (
        <span className="text-xs text-accent">+{pendingClaps}</span>
      )}
    </button>
  );
}
