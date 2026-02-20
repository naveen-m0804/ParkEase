import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, MapPin, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { useGeolocation } from '@/hooks/useGeolocation';
import ParkingCard from '@/components/ParkingCard';
import api from '@/api/axios';
import { motion } from 'framer-motion';
import { BrandLogo } from '@/components/BrandLogo';
import { usePageTitle } from '@/hooks/usePageTitle';

const Dashboard = () => {
  usePageTitle('Dashboard');
  const { location, requestLocation, loading: geoLoading, error: geoError } = useGeolocation();
  const [parkingSpaces, setParkingSpaces] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[] | null>(null);
  const [searchOpen, setSearchOpen] = useState(false);

  useEffect(() => {
    requestLocation();
  }, [requestLocation]);

  const fetchNearby = useCallback(async () => {
    if (!location) return;
    setLoading(true);
    try {
      const { data } = await api.get(`/parking/nearby?lat=${location.lat}&lng=${location.lng}`);
      setParkingSpaces(data.data || []);
    } catch {
      // Silently fail — user sees empty state
    } finally {
      setLoading(false);
    }
  }, [location]);

  useEffect(() => {
    if (location) fetchNearby();
  }, [location, fetchNearby]);

  // Search debounce
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults(null);
      return;
    }
    const timer = setTimeout(async () => {
      try {
        const { data } = await api.get(`/parking/search?query=${encodeURIComponent(searchQuery)}`);
        setSearchResults(data.data || []);
      } catch {
        setSearchResults([]);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const displayedSpaces = searchResults ?? parkingSpaces;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-30 bg-background/95 backdrop-blur-md border-b border-border px-4 py-3">
        <div className="max-w-3xl mx-auto flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 shrink-0 md:hidden">
             <BrandLogo className="h-8 w-8" />
             <h1 className="text-lg font-extrabold">VoidPark</h1>
          </div>

          {searchOpen ? (
            <div className="flex-1 flex items-center gap-2 animate-fade-in-up">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  autoFocus
                  placeholder="Search parking..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 h-10 bg-muted border-border"
                />
              </div>
              <button onClick={() => { setSearchOpen(false); setSearchQuery(''); setSearchResults(null); }}>
                <X className="h-5 w-5 text-muted-foreground" />
              </button>
            </div>
          ) : (
            <button onClick={() => setSearchOpen(true)} className="p-2 rounded-lg hover:bg-accent">
              <Search className="h-5 w-5 text-muted-foreground" />
            </button>
          )}
        </div>
      </header>

      <div className="max-w-3xl mx-auto p-4 space-y-4">
        {/* Location status */}
        <div className="flex items-center gap-2 text-sm">
          <MapPin className="h-4 w-4 text-primary" />
          {location ? (
            <span className="text-muted-foreground">
              Near {location.lat.toFixed(3)}, {location.lng.toFixed(3)}
            </span>
          ) : geoLoading ? (
            <span className="text-muted-foreground">Getting location...</span>
          ) : geoError ? (
            <button onClick={requestLocation} className="text-primary font-medium">
              Enable Location
            </button>
          ) : null}
        </div>

        {/* Content */}
        {loading || geoLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="skeleton-shimmer h-48 rounded-lg" />
            ))}
          </div>
        ) : !location && !searchResults ? (
          <div className="text-center py-20">
            <MapPin className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h2 className="text-lg font-bold mb-2">Enable Location</h2>
            <p className="text-muted-foreground text-sm mb-4">Allow location access to see nearby parking spaces</p>
            <button onClick={requestLocation} className="text-primary font-semibold">
              Enable Location
            </button>
          </div>
        ) : displayedSpaces.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-muted-foreground">
              {searchQuery ? 'No results found' : 'No parking spaces found nearby'}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
              {searchResults ? `Search Results (${searchResults.length})` : `Nearby Parking (${parkingSpaces.length})`}
            </h2>
            {displayedSpaces.map((p: any, i: number) => (
              <ParkingCard key={p.id} parking={p} index={i} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
