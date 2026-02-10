'use client';

import { useState } from 'react';
import { Share, Link2, Twitter, Linkedin, Check } from 'lucide-react';

interface ShareButtonProps {
  url: string;
  title: string;
}

export function ShareButton({ url, title }: ShareButtonProps) {
  const [showMenu, setShowMenu] = useState(false);
  const [copied, setCopied] = useState(false);

  const shareUrl = typeof window !== 'undefined' 
    ? `${window.location.origin}${url}`
    : url;

  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title,
          url: shareUrl,
        });
      } catch (error) {
        // User cancelled or error
        console.log('Share cancelled:', error);
      }
    } else {
      setShowMenu(!showMenu);
    }
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      setShowMenu(false);
    } catch {
      // Fallback for older browsers
      const input = document.createElement('input');
      input.value = shareUrl;
      document.body.appendChild(input);
      input.select();
      document.execCommand('copy');
      document.body.removeChild(input);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      setShowMenu(false);
    }
  };

  const shareLinks = [
    {
      name: 'Copy link',
      icon: copied ? Check : Link2,
      onClick: handleCopyLink,
    },
    {
      name: 'Twitter',
      icon: Twitter,
      href: `https://twitter.com/intent/tweet?text=${encodeURIComponent(title)}&url=${encodeURIComponent(shareUrl)}`,
    },
    {
      name: 'LinkedIn',
      icon: Linkedin,
      href: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}`,
    },
  ];

  return (
    <div className="relative">
      <button
        onClick={handleNativeShare}
        className="flex items-center gap-2 text-muted hover:text-foreground transition-colors"
        aria-label="Share"
      >
        <Share className="w-5 h-5" />
        <span className="text-sm hidden sm:inline">Share</span>
      </button>

      {/* Dropdown menu for desktop */}
      {showMenu && (
        <>
          {/* Backdrop */}
          <div 
            className="fixed inset-0 z-40" 
            onClick={() => setShowMenu(false)} 
          />
          
          {/* Menu */}
          <div className="absolute right-0 mt-2 w-40 bg-background border border-border rounded-lg shadow-lg py-1 z-50">
            {shareLinks.map((link) => (
              link.href ? (
                <a
                  key={link.name}
                  href={link.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 px-4 py-2 text-sm hover:bg-accent/10 transition-colors"
                  onClick={() => setShowMenu(false)}
                >
                  <link.icon className="w-4 h-4" />
                  {link.name}
                </a>
              ) : (
                <button
                  key={link.name}
                  onClick={link.onClick}
                  className="flex items-center gap-3 px-4 py-2 text-sm hover:bg-accent/10 transition-colors w-full text-left"
                >
                  <link.icon className={`w-4 h-4 ${copied && link.name === 'Copy link' ? 'text-green-500' : ''}`} />
                  {link.name === 'Copy link' && copied ? 'Copied!' : link.name}
                </button>
              )
            ))}
          </div>
        </>
      )}
    </div>
  );
}
