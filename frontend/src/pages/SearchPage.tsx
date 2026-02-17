import { useNavigate } from 'react-router-dom';
import { Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { useState, useEffect } from 'react';
import api from '@/api/axios';
import ParkingCard from '@/components/ParkingCard';

const SearchPage = () => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  useEffect(() => {
    if (!query.trim()) { setResults([]); setSearched(false); return; }
    setLoading(true);
    const timer = setTimeout(async () => {
      try {
        const { data } = await api.get(`/parking/search?query=${encodeURIComponent(query)}`);
        setResults(data.data || []);
      } catch { setResults([]); }
      setLoading(false);
      setSearched(true);
    }, 300);
    return () => clearTimeout(timer);
  }, [query]);

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-30 bg-background/95 backdrop-blur-md border-b border-border px-4 py-3">
        <div className="max-w-3xl mx-auto">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              autoFocus
              placeholder="Search by name or address..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="pl-9 h-11 bg-muted border-border"
            />
          </div>
        </div>
      </header>
      <div className="max-w-3xl mx-auto p-4 space-y-3">
        {loading ? (
          [1, 2].map(i => <div key={i} className="skeleton-shimmer h-48 rounded-lg" />)
        ) : searched && results.length === 0 ? (
          <p className="text-center text-muted-foreground py-12">No results found</p>
        ) : (
          results.map((p, i) => <ParkingCard key={p.id} parking={p} index={i} />)
        )}
      </div>
    </div>
  );
};

export default SearchPage;
