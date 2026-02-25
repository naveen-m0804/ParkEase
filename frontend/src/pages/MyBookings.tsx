import { useState, useEffect } from 'react';
import { Phone, Navigation, X, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { VEHICLE_TYPES, BOOKING_STATUS, formatAmount, formatDuration } from '@/lib/formatters';
import api from '@/api/axios';
import { toast } from 'sonner';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { usePageTitle } from '@/hooks/usePageTitle';

const MyBookings = () => {
  usePageTitle('My Bookings');
  const [myBookings, setMyBookings] = useState<any[]>([]);
  const [ownerBookings, setOwnerBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [cancelId, setCancelId] = useState<string | null>(null);
  const [cancelType, setCancelType] = useState<'user' | 'owner'>('user');
  const [endBookingId, setEndBookingId] = useState<string | null>(null);
  const [endTime, setEndTime] = useState('');

  const fetchBookings = async () => {
    setLoading(true);
    try {
      const [myRes, ownerRes] = await Promise.all([
        api.get('/bookings/my'),
        api.get('/bookings/owner').catch(() => ({ data: { data: [] } })),
      ]);
      setMyBookings(myRes.data.data || []);
      setOwnerBookings(ownerRes.data.data || []);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBookings();
  }, []);

  const handleCancel = async () => {
    if (!cancelId) return;
    try {
      const url = cancelType === 'owner' ? `/bookings/${cancelId}/owner-cancel` : `/bookings/${cancelId}/cancel`;
      await api.post(url);
      toast.success('Booking cancelled');
      setCancelId(null);
      fetchBookings();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to cancel');
    }
  };

  const handleEndBooking = async () => {
    if (!endBookingId || !endTime) return;

    // Client-side validation
    const endDate = new Date(endTime);
    const booking = myBookings.find(b => b.id === endBookingId);
    if (booking) {
      const startDate = new Date(booking.start_time);
      if (endDate <= startDate) {
        toast.error('⏰ End time must be after the booking start time. Please choose a valid time.');
        return;
      }
    }

    try {
      await api.put(`/bookings/${endBookingId}/end`, { endTime: endDate.toISOString() });
      toast.success('Booking ended');
      setEndBookingId(null);
      fetchBookings();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to end booking');
    }
  };

  const getStatusInfo = (b: any) => {
    const now = new Date();
    const end = b.end_time ? new Date(b.end_time) : null;

    if (b.booking_status === 'confirmed') {
       if (end && now > end) {
         return { label: 'Completed', colorClass: 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20' };
       }
       if (!b.end_time) {
         return { label: 'Ongoing', colorClass: 'bg-status-warning/20 text-status-warning' };
       }
    }

    if (b.booking_status === 'cancelled') {
      return {
        label: b.cancelled_by === 'owner' ? 'Cancelled by Owner' : 'Cancelled',
        colorClass: b.cancelled_by === 'owner' ? 'bg-status-occupied/20 text-status-occupied' : BOOKING_STATUS.cancelled.colorClass,
      };
    }
    return BOOKING_STATUS[b.booking_status] || BOOKING_STATUS.confirmed;
  };

  const formatTime = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };
  const formatDate = (iso: string) => new Date(iso).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' });

  const BookingCard = ({ b, isOwner = false }: { b: any; isOwner?: boolean }) => {
    const status = getStatusInfo(b);
    const vehicle = VEHICLE_TYPES.find(v => v.value === b.vehicle_type);
    const isOngoing = b.booking_status === 'confirmed' && !b.end_time;
    
    const now = new Date();
    const start = new Date(b.start_time);
    const end = b.end_time ? new Date(b.end_time) : null;
    
    // User can cancel only BEFORE start time. Owner can cancel anytime BEFORE end time.
    const canCancel = isOwner 
        ? (!end || now < end)
        : (now < start);

    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-card rounded-lg border border-border p-4 space-y-3"
      >
        <div className="flex items-center justify-between">
          <span className={cn('text-xs font-semibold px-2 py-1 rounded-full', status.colorClass)}>
            {status.label}
          </span>
          <span className="text-xs text-muted-foreground font-medium">Slot #{b.slot_number}</span>
        </div>

        <div>
          <h3 className="font-bold">{b.place_name}</h3>
          <p className="text-xs text-muted-foreground">{b.address}</p>
        </div>

        <div className="text-sm space-y-1">
          <p>{vehicle?.label} • {formatTime(b.start_time)}{b.end_time ? ` - ${formatTime(b.end_time)}` : ' - Ongoing'}</p>
          <p className="text-muted-foreground">{formatDate(b.start_time)}</p>
        </div>

        <div className="text-sm">
          <span className="text-muted-foreground">₹{parseFloat(b.hourly_rate).toFixed(0)}/hr</span>
          {' • '}
          <span className="font-bold">{b.total_amount ? formatAmount(b.total_amount) : 'Calculating...'}</span>
        </div>

        {/* Contact info */}
        {isOwner ? (
          <div className="bg-muted rounded-lg p-3 text-sm space-y-1">
            <p className="text-xs text-muted-foreground">Customer:</p>
            <p className="font-medium">👤 {b.user_name}</p>
            {b.user_phone && <p>📞 {b.user_phone}</p>}
            {b.user_email && <p>📧 {b.user_email}</p>}
          </div>
        ) : (
          <p className="text-xs text-muted-foreground">Owner: {b.owner_name}</p>
        )}

        {/* Actions */}
        {b.booking_status === 'confirmed' && (
          <div className="flex gap-2 flex-wrap">
            {!isOwner && (
              <a href={`tel:${b.owner_phone}`} className="flex items-center gap-1 text-xs font-medium bg-muted px-3 py-2 rounded-md">
                <Phone className="h-3 w-3" /> Call Owner
              </a>
            )}
            <button
              onClick={() => window.open(`https://www.google.com/maps/dir/?api=1&destination=${b.latitude},${b.longitude}`, '_blank')}
              className="flex items-center gap-1 text-xs font-medium bg-muted px-3 py-2 rounded-md"
            >
              <Navigation className="h-3 w-3" /> Navigate
            </button>
            {isOngoing && !isOwner && (
              <button
                onClick={() => { setEndBookingId(b.id); setEndTime(new Date().toISOString().slice(0, 16)); }}
                className="flex items-center gap-1 text-xs font-semibold bg-status-warning/20 text-status-warning px-3 py-2 rounded-md"
              >
                <Clock className="h-3 w-3" /> End Booking
              </button>
            )}
            {canCancel && (
                <button
                onClick={() => { setCancelId(b.id); setCancelType(isOwner ? 'owner' : 'user'); }}
                className="flex items-center gap-1 text-xs font-medium bg-destructive/10 text-destructive px-3 py-2 rounded-md"
                >
                <X className="h-3 w-3" /> Cancel
                </button>
            )}
          </div>
        )}
      </motion.div>
    );
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-30 bg-background/95 backdrop-blur-md border-b border-border px-4 py-4">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-xl font-extrabold">My Bookings</h1>
        </div>
      </header>

      <div className="max-w-3xl mx-auto p-4">
        <Tabs defaultValue="my" className="space-y-4">
          <TabsList className="w-full bg-muted">
            <TabsTrigger value="my" className="flex-1">My Bookings</TabsTrigger>
            <TabsTrigger value="received" className="flex-1">Received Orders</TabsTrigger>
          </TabsList>

          <TabsContent value="my" className="space-y-3">
            {loading ? (
              [1, 2].map(i => <div key={i} className="skeleton-shimmer h-48 rounded-lg" />)
            ) : myBookings.length === 0 ? (
              <p className="text-center text-muted-foreground py-12">No bookings yet</p>
            ) : (
              myBookings.map(b => <BookingCard key={b.id} b={b} />)
            )}
          </TabsContent>

          <TabsContent value="received" className="space-y-3">
            {loading ? (
              [1, 2].map(i => <div key={i} className="skeleton-shimmer h-48 rounded-lg" />)
            ) : ownerBookings.length === 0 ? (
              <p className="text-center text-muted-foreground py-12">
                No received orders. List a parking space from your Profile page.
              </p>
            ) : (
              ownerBookings.map(b => <BookingCard key={b.id} b={b} isOwner />)
            )}
          </TabsContent>
        </Tabs>
      </div>

      {/* Cancel Dialog */}
      <Dialog open={!!cancelId} onOpenChange={() => setCancelId(null)}>
        <DialogContent className="glass border-border">
          <DialogHeader>
            <DialogTitle>Cancel Booking?</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">This action cannot be undone.</p>
          <DialogFooter>
            <Button variant="secondary" onClick={() => setCancelId(null)}>Keep Booking</Button>
            <Button variant="destructive" onClick={handleCancel}>Cancel Booking</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* End Booking Dialog */}
      <Dialog open={!!endBookingId} onOpenChange={() => setEndBookingId(null)}>
        <DialogContent className="glass border-border">
          <DialogHeader>
            <DialogTitle>End Booking</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <label className="text-sm text-muted-foreground">Select end time:</label>
            <Input
              type="datetime-local"
              value={endTime}
              onChange={(e) => setEndTime(e.target.value)}
              className="h-12 bg-muted border-border"
            />
          </div>
          <DialogFooter>
            <Button variant="secondary" onClick={() => setEndBookingId(null)}>Cancel</Button>
            <Button onClick={handleEndBooking}>End Booking</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default MyBookings;
