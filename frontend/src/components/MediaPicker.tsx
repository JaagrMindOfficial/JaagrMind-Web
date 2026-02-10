'use client';

import { useState } from 'react';
import { MediaLibrary } from './MediaLibrary';
import { X, Image as ImageIcon } from 'lucide-react';

interface MediaPickerProps {
  onSelect: (url: string) => void;
  trigger?: React.ReactNode;
}

export function MediaPicker({ onSelect, trigger }: MediaPickerProps) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <div onClick={() => setOpen(true)} className="cursor-pointer">
        {trigger || (
          <button className="flex items-center gap-2 px-4 py-2 bg-accent/10 text-accent rounded-md hover:bg-accent/20 transition-colors">
            <ImageIcon className="w-4 h-4" />
            Select from Library
          </button>
        )}
      </div>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-background w-full max-w-4xl rounded-lg shadow-xl overflow-hidden flex flex-col max-h-[85vh]">
            <div className="p-4 border-b border-border flex items-center justify-between bg-card">
              <h3 className="font-bold">Select Media</h3>
              <button 
                onClick={() => setOpen(false)}
                className="p-1 hover:bg-accent/10 rounded-full"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="flex-1 overflow-hidden p-0">
               <MediaLibrary 
                 selectionMode={true}
                 onSelect={(media) => {
                   onSelect(media.url);
                   setOpen(false);
                 }}
               />
            </div>
          </div>
        </div>
      )}
    </>
  );
}
