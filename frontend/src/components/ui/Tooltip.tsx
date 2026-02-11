import React from 'react';

interface TooltipProps {
  content: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}

export function Tooltip({ content, children, className = '' }: TooltipProps) {
  return (
    <div className={`relative group/tooltip flex items-center ${className}`}>
      {children}
      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover/tooltip:block z-50">
        <div className="bg-neutral-900 text-white text-xs font-medium rounded py-1.5 px-3 whitespace-nowrap relative shadow-xl">
          {content}
          {/* Arrow */}
          <div className="absolute top-full left-1/2 -translate-x-1/2 border-[6px] border-transparent border-t-neutral-900" />
        </div>
      </div>
    </div>
  );
}
