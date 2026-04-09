import { Search, MapPin, Navigation2, Crosshair, Loader2 } from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
import { cn } from '@/lib/utils';
import { getSuggestions, GeocodeResult } from '@/services/geocodingService';

interface LocationSearchProps {
  onSearch: (from: string, to: string) => void;
  onUseCurrentLocation?: () => void;
  isDetectingLocation?: boolean;
  startName?: string;
  endName?: string;
}

interface SearchInputProps {
  icon: React.ReactNode;
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  className?: string;
  onSelect?: (location: GeocodeResult) => void;
  rightElement?: React.ReactNode;
}

const SearchInput = ({ icon, value, onChange, placeholder, className, onSelect, rightElement }: SearchInputProps) => {
  const [suggestions, setSuggestions] = useState<GeocodeResult[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    const fetchSuggestions = async () => {
      if (value.length < 3) {
        setSuggestions([]);
        return;
      }

      setIsLoading(true);
      try {
        const results = await getSuggestions(value);
        setSuggestions(results);
        // Only show suggestions if the input is currently focused
        if (document.activeElement === inputRef.current) {
          setShowSuggestions(true);
        }
      } catch (error) {
        console.error("Error fetching suggestions", error);
      } finally {
        setIsLoading(false);
      }
    };

    const timeoutId = setTimeout(fetchSuggestions, 500);
    return () => clearTimeout(timeoutId);
  }, [value]);

  const handleSelect = (location: GeocodeResult) => {
    onChange(location.display_name);
    setShowSuggestions(false);
    onSelect?.(location);
  };

  return (
    <div className="relative" ref={wrapperRef}>
      <div className="absolute left-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-lg bg-muted flex items-center justify-center">
        {icon}
      </div>
      <input
        ref={inputRef}
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onFocus={() => value.length >= 3 && setShowSuggestions(true)}
        placeholder={placeholder}
        className={cn(
          'w-full pl-14 pr-12 py-3 rounded-xl',
          'bg-muted/50 border border-border',
          'text-sm text-foreground placeholder:text-muted-foreground',
          'focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary',
          'transition-all',
          className
        )}
      />
      {rightElement}

      {showSuggestions && suggestions.length > 0 && (
        <div className="absolute left-0 right-0 top-[calc(100%+0.5rem)] z-50 overflow-hidden rounded-2xl border border-white/10 bg-zinc-950/95 text-foreground shadow-2xl backdrop-blur-xl">
          {suggestions.map((suggestion, index) => (
            <button
              key={index}
              onClick={() => handleSelect(suggestion)}
              className="flex w-full items-start gap-3 border-b border-white/5 px-4 py-3 text-left text-sm text-foreground transition-colors hover:bg-white/5 last:border-0"
            >
              <MapPin className="w-4 h-4 mt-0.5 text-muted-foreground shrink-0" />
              <span className="line-clamp-2 text-foreground/90">{suggestion.display_name}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

const LocationSearch = ({
  onSearch,
  onUseCurrentLocation,
  isDetectingLocation = false,
  startName,
  endName
}: LocationSearchProps) => {
  const [from, setFrom] = useState(startName || 'Central Station');
  const [to, setTo] = useState(endName || 'Business District');

  useEffect(() => {
    if (startName) setFrom(startName);
  }, [startName]);

  useEffect(() => {
    if (endName) setTo(endName);
  }, [endName]);

  const handleSearch = () => {
    onSearch(from, to);
  };

  return (
    <div className="glass-panel p-4 space-y-3">
      {/* From Input */}
      <SearchInput
        icon={<Navigation2 className="w-4 h-4 text-primary" />}
        value={from}
        onChange={setFrom}
        placeholder="Starting point"
        className="pr-14"
        rightElement={
          <button
            onClick={onUseCurrentLocation}
            disabled={isDetectingLocation}
            className={cn(
              'absolute right-2 top-1/2 -translate-y-1/2',
              'p-2 rounded-lg',
              'hover:bg-primary/10 transition-colors',
              'disabled:opacity-50 disabled:cursor-not-allowed',
              'z-10'
            )}
            title="Use Current Location"
          >
            {isDetectingLocation ? (
              <Loader2 className="w-4 h-4 text-primary animate-spin" />
            ) : (
              <Crosshair className="w-4 h-4 text-primary" />
            )}
          </button>
        }
      />

      {/* Connector */}
      <div className="flex items-center gap-2 pl-5">
        <div className="w-0.5 h-4 bg-border rounded-full" />
      </div>

      {/* To Input */}
      <SearchInput
        icon={<MapPin className="w-4 h-4 text-secondary" />}
        value={to}
        onChange={setTo}
        placeholder="Destination"
        className="pr-6"
      />

      {/* Search Button */}
      <button
        onClick={handleSearch}
        className={cn(
          'w-full py-3 px-4 rounded-xl',
          'gradient-clean text-primary-foreground',
          'font-medium text-sm',
          'flex items-center justify-center gap-2',
          'hover:opacity-90 transition-opacity',
          'shadow-glow'
        )}
      >
        <Search className="w-4 h-4" />
        <span>Find Routes</span>
      </button>
    </div>
  );
};

export default LocationSearch;
