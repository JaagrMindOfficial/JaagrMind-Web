import { useState, useEffect, useRef } from 'react';
import { X, ChevronDown, Check } from 'lucide-react';

interface Option {
  value: string;
  label: string;
}

interface MultiSelectProps {
  options: Option[];
  value: string[];
  onChange: (value: string[]) => void;
  placeholder?: string;
  label?: string;
}

export function MultiSelect({ options, value, onChange, placeholder = 'Select...', label }: MultiSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Close when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const selectedOptions = options.filter(opt => value.includes(opt.value));

  const toggleOption = (optionValue: string) => {
    if (value.includes(optionValue)) {
      onChange(value.filter(v => v !== optionValue));
    } else {
      onChange([...value, optionValue]);
    }
  };

  const removeOption = (e: React.MouseEvent, optionValue: string) => {
    e.stopPropagation();
    onChange(value.filter(v => v !== optionValue));
  };

  return (
    <div className="relative" ref={containerRef}>
      {label && <label className="block text-sm font-medium mb-1">{label}</label>}
      
      <div
        onClick={() => setIsOpen(!isOpen)}
        className={`
          min-h-[42px] w-full px-3 py-2 bg-input border border-border rounded-lg 
          flex flex-wrap items-center gap-2 cursor-pointer hover:border-accent/50 transition-colors
          ${isOpen ? 'ring-2 ring-accent border-accent' : ''}
        `}
      >
        {selectedOptions.length > 0 ? (
          selectedOptions.map(option => (
            <span
              key={option.value}
              className="inline-flex items-center gap-1 px-2 py-0.5 bg-accent/10 text-accent rounded text-sm group"
            >
              {option.label}
              <button
                onClick={(e) => removeOption(e, option.value)}
                className="hover:bg-accent/20 rounded p-0.5 transition-colors"
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          ))
        ) : (
          <span className="text-muted">{placeholder}</span>
        )}
        
        <div className="flex-1" />
        <ChevronDown className={`w-4 h-4 text-muted transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </div>

      {isOpen && (
        <div className="absolute z-50 w-full mt-1 bg-background border border-border rounded-lg shadow-lg max-h-60 overflow-auto">
          {options.length > 0 ? (
            options.map(option => (
              <div
                key={option.value}
                onClick={() => toggleOption(option.value)}
                className={`
                  flex items-center justify-between px-3 py-2 cursor-pointer hover:bg-accent/5 transition-colors
                  ${value.includes(option.value) ? 'bg-accent/5 text-accent font-medium' : ''}
                `}
              >
                <span>{option.label}</span>
                {value.includes(option.value) && <Check className="w-4 h-4" />}
              </div>
            ))
          ) : (
            <div className="px-3 py-2 text-muted text-sm text-center">No options available</div>
          )}
        </div>
      )}
    </div>
  );
}
