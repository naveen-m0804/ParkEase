import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Navigation, Phone, MapPin } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import SlotGrid from '@/components/SlotGrid';
import { VEHICLE_TYPES, PRICE_FIELD_MAP, formatAmount } from '@/lib/formatters';
import api from '@/api/axios';
import { toast } from 'sonner';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';

const ParkingDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [parking, setParking] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Booking form
  const [vehicleType, setVehicleType] = useState('car');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [openEnded, setOpenEnded] = useState(false);
  const [booking, setBooking] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [bookingResult, setBookingResult] = useState<any>(null);
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);

  // Helper for timezone
  const toLocalISO = (date: Date) => {
    const d = new Date(date);
    d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
    return d.toISOString().slice(0, 16);
  };

  // Minimum datetime for Start Time (current time)
  const nowLocal = toLocalISO(new Date());

  // Validation helpers
  const isStartTimeInPast = () => {
    if (!startTime) return false;
    const selected = new Date(startTime);
    const now = new Date();
    // 5-minute grace window to match backend
    return selected.getTime() < now.getTime() - 5 * 60 * 1000;
  };

  const isEndTimeInvalid = () => {
    if (openEnded || !endTime) return false;
    const end = new Date(endTime);
    const now = new Date();
    if (end.getTime() < now.getTime()) return 'past';
    if (startTime && end <= new Date(startTime)) return 'before_start';
    return false;
  };

  const getValidationError = (): string | null => {
    if (!startTime) return null;
    if (isStartTimeInPast()) return 'Start time cannot be in the past';
    const endIssue = isEndTimeInvalid();
    if (endIssue === 'past') return 'End time cannot be in the past';
    if (endIssue === 'before_start') return 'End time must be after start time';
    return null;
  };

  const validationError = startTime ? getValidationError() : null;

  useEffect(() => {
    const fetchParking = async () => {
      try {
        // Build query params
        const params = new URLSearchParams();
        if (startTime) params.append('startTime', new Date(startTime).toISOString());
        if (endTime && !openEnded) params.append('endTime', new Date(endTime).toISOString());
        
        const { data } = await api.get(`/parking/${id}?${params.toString()}`);
        setParking(data.data);

        // Auto-deselect if selected slot is no longer available for the chosen time
        if (selectedSlot && data.data?.slots) {
          const slot = data.data.slots.find((s: any) => s.id === selectedSlot);
          if (slot && slot.status !== 'available') {
            setSelectedSlot(null);
            toast.info('Selected slot is not available for this time range. Please choose another.');
          }
        }
      } catch {
        toast.error('Parking space not found');
        navigate('/');
      } finally {
        setLoading(false);
      }
    };

    // Debounce fetch to avoid spamming as user picks dates
    const timer = setTimeout(() => {
      fetchParking();
    }, 300);

    return () => clearTimeout(timer);
  }, [id, navigate, startTime, endTime]);

  const hourlyRate = parking ? parseFloat(parking[PRICE_FIELD_MAP[vehicleType]] || '0') : 0;
  
  // Filter slots for grid first
  const displayedSlots = parking?.slots?.filter((s:any) => s.vehicle_type === vehicleType) || [];

  // Calculate dynamic availability from slots
  const availableCount = displayedSlots.filter((s:any) => s.status === 'available' && s.is_active).length;
  const totalCount = parking ? parseInt(parking[`total_slots_${vehicleType}`] || '0') : 0;

  const calculateTotal = () => {
    if (openEnded || !startTime || !endTime) return null;
    const start = new Date(startTime);
    const end = new Date(endTime);
    
    if (isNaN(start.getTime()) || isNaN(end.getTime())) return null;
    if (end <= start) return null;

    const hours = (end.getTime() - start.getTime()) / 3600000;
    // Minimum 1 hour charge usually, or exact? Let's do ceil for now as per previous logic
    return Math.ceil(hours * hourlyRate);
  };

  const handleBook = async () => {
    // Client-side validation before sending to server
    if (isStartTimeInPast()) {
      toast.error('⏰ Cannot book for a past date or time. Please select a current or future start time.');
      return;
    }

    const endIssue = isEndTimeInvalid();
    if (endIssue === 'past') {
      toast.error('⏰ End time cannot be in the past. Please select a future end time.');
      return;
    }
    if (endIssue === 'before_start') {
      toast.error('⏰ End time must be after the start time. Please select a valid time range.');
      return;
    }

    setBooking(true);
    try {
      const body: any = {
        parkingId: id,
        vehicleType,
        startTime: new Date(startTime).toISOString(),
      };
      if (!openEnded && endTime) {
        body.endTime = new Date(endTime).toISOString();
      }
      
      if (selectedSlot) body.slotId = selectedSlot;

      const { data } = await api.post('/bookings', body);
      setBookingResult(data.data);
      setShowConfirm(true);
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Booking failed');
    } finally {
      setBooking(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background p-4 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
           <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
           <p className="text-muted-foreground animate-pulse">Finding best spots...</p>
        </div>
      </div>
    );
  }

  if (!parking) return null;

  const total = calculateTotal();

  return (
    <div className="min-h-screen bg-background pb-32 md:pb-20">
      {/* Hero */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-primary/10 -z-10 skew-y-3 origin-top-left scale-110" />
        <div className="max-w-3xl mx-auto px-4 py-6">
          <div className="flex items-center gap-3 mb-4">
            <button onClick={() => navigate(-1)} className="p-2 rounded-full bg-background/50 hover:bg-background border border-border transition-colors">
              <ArrowLeft className="h-5 w-5" />
            </button>
            <h1 className="text-2xl font-black tracking-tight">{parking.place_name}</h1>
          </div>
          
          <div className="flex flex-wrap gap-2 items-center text-sm text-muted-foreground mb-4">
             <MapPin className="h-4 w-4 text-primary" />
             <span>{parking.address}</span>
          </div>

          <div className="flex gap-3">
            <a href={`tel:${parking.owner_phone}`} className="flex items-center gap-2 text-xs font-bold bg-primary text-primary-foreground px-4 py-2.5 rounded-full shadow-lg shadow-primary/20 hover:scale-105 transition-transform">
              <Phone className="h-3.5 w-3.5" /> Call Owner
            </a>
            <button
              onClick={() => window.open(`https://www.google.com/maps/dir/?api=1&destination=${parking.latitude},${parking.longitude}`, '_blank')}
              className="flex items-center gap-2 text-xs font-bold bg-secondary text-secondary-foreground px-4 py-2.5 rounded-full hover:bg-secondary/80 transition-colors"
            >
              <Navigation className="h-3.5 w-3.5" /> Navigate
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 space-y-8 mt-2">
        {/* Description */}
        <div className="bg-card/50 rounded-xl p-4 border border-border/50">
           <h3 className="font-bold text-sm mb-2 text-foreground/80">About this parking</h3>
           <p className="text-sm text-muted-foreground leading-relaxed">
             {parking.description || "No description provided by owner."}
           </p>
        </div>

        {/* Price cards */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="grid grid-cols-3 gap-3">
          {VEHICLE_TYPES.map((v) => {
            const isSelected = vehicleType === v.value;
            return (
              <button 
                key={v.value} 
                onClick={() => { setVehicleType(v.value); setSelectedSlot(null); }}
                className={cn(
                  "relative overflow-hidden rounded-xl border-2 p-3 text-center transition-all duration-300",
                  isSelected ? "bg-card border-primary shadow-xl shadow-primary/10 scale-105" : "bg-muted/30 border-transparent hover:bg-muted"
                )}
              >
                {isSelected && <div className="absolute inset-x-0 bottom-0 h-1 bg-primary" />}
                <div className={cn("text-2xl mb-1 transition-transform", isSelected ? "scale-110" : "grayscale opacity-70")}>{v.icon}</div>
                <div className={cn("text-sm font-extrabold", isSelected && "text-primary")}>₹{parseFloat(parking[PRICE_FIELD_MAP[v.value]] || '0').toFixed(0)}<span className="text-[10px] font-normal text-muted-foreground">/hr</span></div>
                <div className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider mt-1">{v.value}</div>
              </button>
            );
          })}
        </motion.div>

        {/* Slot Selection */}
        <section>
          <div className="flex items-center justify-between mb-4">
             <h2 className="text-sm font-bold uppercase tracking-widest text-muted-foreground">
              Select a Spot
            </h2>
            <span className={cn("text-xs font-bold px-2.5 py-1 rounded-full border", availableCount > 0 ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-600" : "bg-rose-500/10 border-rose-500/20 text-rose-600")}>
              {availableCount} Available
            </span>
          </div>
          
          {displayedSlots.length > 0 ? (
            <SlotGrid slots={displayedSlots} onSelect={setSelectedSlot} selectedId={selectedSlot} />
          ) : (
            <div className="text-center py-10 bg-muted/20 rounded-xl border border-dashed border-border/50 text-sm text-muted-foreground">
              No {vehicleType} slots configured.
            </div>
          )}
        </section>

        {/* Booking Form */}
        <section className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden">
          <div className="bg-muted/30 px-6 py-4 border-b border-border flex justify-between items-center">
             <h2 className="font-bold text-lg">Booking Details</h2>
             {selectedSlot && (
               <span className="text-xs font-bold bg-primary text-primary-foreground px-2 py-1 rounded">
                 Slot #{displayedSlots.find((s:any) => s.id === selectedSlot)?.slot_number}
               </span>
             )}
          </div>
          
          <div className="p-6 space-y-6">
            {/* Times */}
            <div className="space-y-4">
              <div className="grid gap-2">
                <label className="text-xs font-bold uppercase text-muted-foreground">Start Time</label>
                <Input
                  type="datetime-local"
                  value={startTime}
                  min={nowLocal}
                  onChange={(e) => setStartTime(e.target.value)}
                  className={cn("h-12 bg-muted/50 border-input font-medium", isStartTimeInPast() && "border-destructive/50 bg-destructive/5")}
                />
                {isStartTimeInPast() && (
                  <p className="text-xs text-destructive font-medium">⚠️ Start time cannot be in the past</p>
                )}
              </div>

              <div className="flex items-center justify-between bg-muted/30 p-3 rounded-lg border border-border/50">
                <label className="text-sm font-medium">Open-Ended (Pay later)</label>
                <Switch checked={openEnded} onCheckedChange={setOpenEnded} />
              </div>

              {!openEnded && (
                <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} className="grid gap-2">
                  <label className="text-xs font-bold uppercase text-muted-foreground">End Time</label>
                  <Input
                    type="datetime-local"
                    value={endTime}
                    min={startTime || nowLocal}
                    onChange={(e) => setEndTime(e.target.value)}
                    className={cn("h-12 bg-muted/50 border-input font-medium", isEndTimeInvalid() && "border-destructive/50 bg-destructive/5")}
                  />
                  {isEndTimeInvalid() === 'past' && (
                    <p className="text-xs text-destructive font-medium">⚠️ End time cannot be in the past</p>
                  )}
                  {isEndTimeInvalid() === 'before_start' && (
                    <p className="text-xs text-destructive font-medium">⚠️ End time must be after start time</p>
                  )}
                </motion.div>
              )}
            </div>

            {/* Total */}
            <div className="flex items-center justify-between pt-4 border-t border-dashed">
              <span className="text-sm text-muted-foreground">Estimated Total</span>
              <div className="text-right">
                {openEnded ? (
                   <span className="text-xl font-black">₹{hourlyRate.toFixed(0)}<span className="text-sm text-muted-foreground font-normal">/hr</span></span>
                ) : (
                   <span className="text-2xl font-black text-primary">{total !== null ? formatAmount(total) : '--'}</span>
                )}
              </div>
            </div>

            {validationError && (
              <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-3 text-center">
                <p className="text-sm font-medium text-destructive">⚠️ {validationError}</p>
              </div>
            )}

            <Button 
                size="lg" 
                className={cn("w-full text-lg font-bold h-14 shadow-xl transition-all", 
                    availableCount > 0 && !validationError ? "shadow-primary/25 hover:shadow-primary/40 hover:scale-[1.02]" : "opacity-80"
                )}
                onClick={handleBook} 
                disabled={booking || !startTime || availableCount === 0 || !!validationError}
            >
              {availableCount === 0 ? 'Fully Booked' : booking ? 'Confirming...' : 'Confirm Booking'}
            </Button>
            
            {!selectedSlot && availableCount > 0 && (
                <p className="text-xs text-center text-muted-foreground">
                   * Slot will be auto-assigned if not selected
                </p>
            )}
          </div>
        </section>
      </div>

      {/* Confirmation Dialog - Keeping existing structure but styled */}
      <Dialog open={showConfirm} onOpenChange={setShowConfirm}>
         {/* ... (Keep existing dialog content logic, heavily depends on props) ... */}
         {/* I'll paste the existing dialog code here to ensure it's preserved */}
        <DialogContent className="glass border-border w-[90%] max-w-sm rounded-xl">
          <DialogHeader>
            <DialogTitle className="text-center text-xl">✅ Booking Confirmed!</DialogTitle>
            <DialogDescription className="sr-only">
              Your booking has been successfully confirmed.
            </DialogDescription>
          </DialogHeader>
          {bookingResult && (
            <div className="space-y-4 text-sm text-center pt-2">
              <div className="bg-muted/50 p-4 rounded-xl space-y-2">
                <p className="font-medium text-base">
                  Slot #{bookingResult.slot?.slotNumber} • {parking.place_name}
                </p>
                <div className="flex justify-center gap-2 text-muted-foreground text-xs uppercase tracking-wide">
                  <span>{VEHICLE_TYPES.find(v => v.value === bookingResult.booking?.vehicle_type)?.label}</span>
                  <span>•</span>
                  <span>{bookingResult.pricing?.isOpenEnded ? 'Open-Ended' : 'Fixed'}</span>
                </div>
              </div>
              
              {bookingResult.pricing && (
                <div className="py-2">
                  <p className="text-3xl font-extrabold text-primary">
                    {bookingResult.pricing.isOpenEnded
                      ? `₹${bookingResult.pricing.hourlyRate}/hr`
                      : formatAmount(bookingResult.pricing.totalAmount)
                    }
                  </p>
                </div>
              )}
              
              <Button variant="outline" className="w-full border-primary text-primary hover:bg-primary/10 transition-colors font-bold" onClick={() => { setShowConfirm(false); navigate('/bookings'); }}>
                View My Bookings
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ParkingDetail;
