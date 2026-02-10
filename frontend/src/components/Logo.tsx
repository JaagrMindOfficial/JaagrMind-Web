'use client';

import Image from 'next/image';
import { useTheme } from './ThemeProvider';
import { useState, useEffect } from 'react';

interface LogoProps {
  variant?: 'full' | 'mini';
  className?: string;
  width?: number;
  height?: number;
}

export function Logo({ variant = 'full', className = '', width, height }: LogoProps) {
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Logo paths based on theme and variant
  // DarkColorLogo = dark text (for light backgrounds)
  // LightColorLogo = light text (for dark backgrounds)
  // JM-Dark = dark mini logo (for light backgrounds)
  // JM-White = light mini logo (for dark backgrounds)
  
  const getLogoSrc = () => {
    if (variant === 'mini') {
      // For mini logos: use dark logo on light theme, white logo on dark theme
      return resolvedTheme === 'dark' ? '/JM-White.svg' : '/JM-Dark.svg';
    }
    // For full logos: use dark logo on light theme, light logo on dark theme
    return resolvedTheme === 'dark' ? '/Full-JaagrMind-Blog-Light.svg' : '/Full-JaagrMind-Blog-Dark.svg';
  };

  // Default dimensions based on variant
  const defaultWidth = variant === 'mini' ? 32 : 140;
  const defaultHeight = variant === 'mini' ? 32 : 36;
  
  const logoWidth = width || defaultWidth;
  const logoHeight = height || defaultHeight;

  // Show a placeholder on server and before mount to prevent hydration mismatch
  // Always show the light theme version first (dark logo)
  const initialSrc = variant === 'mini' ? '/JM-Dark.svg' : '/Full-JaagrMind-Blog-Dark.svg';
  const src = mounted ? getLogoSrc() : initialSrc;

  return (
    <Image
      src={src}
      alt="JaagrMind"
      width={logoWidth}
      height={logoHeight}
      className={`${className} transition-opacity duration-200`}
      priority
    />
  );
}

// Simple mini logo that doesn't change with theme (for footer etc)
export function MiniLogo({ className = '' }: { className?: string }) {
  return (
    <div className={`w-8 h-8 bg-accent rounded-lg flex items-center justify-center ${className}`}>
      <span className="text-white font-bold text-sm">JM</span>
    </div>
  );
}
