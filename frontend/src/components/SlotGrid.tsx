import { cn } from '@/lib/utils';
import { Lock, Car, CheckCircle2, Clock, CalendarClock } from 'lucide-react';
import { motion } from 'framer-motion';

interface UpcomingBooking {
  start_time: string;
  end_time: string | null;
}

interface Slot {
  id: string;
  slot_number: number;
  is_active: boolean;
  status: 'available' | 'occupied';
  occupied_start?: string;
  occupied_end?: string;
  upcoming_bookings?: UpcomingBooking[];
}

interface SlotGridProps {
  slots: Slot[];
  onSelect?: (id: string) => void;
  selectedId?: string | null;
}

const formatTime = (d: string) =>
  new Date(d).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

const formatShortDate = (d: string) => {
  const date = new Date(d);
  const today = new Date();
  const tomorrow = new Date();
  tomorrow.setDate(today.getDate() + 1);

  if (date.toDateString() === today.toDateString()) return 'Today';
  if (date.toDateString() === tomorrow.toDateString()) return 'Tomorrow';
  return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
};

const SlotGrid = ({ slots, onSelect, selectedId }: SlotGridProps) => {
  const activeSlots = slots.filter((s) => s.is_active);

  if (activeSlots.length === 0) return null;

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
      {activeSlots.map((slot, i) => {
        const isSelected = selectedId === slot.id;
        const isAvailable = slot.status === 'available';
        const bookings = slot.upcoming_bookings || [];
        const hasBookings = bookings.length > 0;
        const displayBookings = bookings.slice(0, 2);
        const moreCount = bookings.length - 2;

        return (
          <motion.div
            key={slot.id}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.03, duration: 0.3 }}
            onClick={() => isAvailable && onSelect?.(slot.id)}
            className={cn(
              'relative rounded-2xl flex flex-col border-2 transition-all duration-300 p-3 min-h-[100px]',
              isSelected
                ? 'bg-primary/5 border-primary shadow-lg shadow-primary/15 scale-[1.02]'
                : isAvailable
                  ? 'bg-card border-border/50 hover:border-primary/40 hover:shadow-md hover:scale-[1.01] cursor-pointer'
                  : 'bg-muted/20 border-border/30 cursor-not-allowed'
            )}
          >
            {/* Selection badge */}
            {isSelected && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="absolute -top-1.5 -right-1.5 bg-primary text-primary-foreground rounded-full p-0.5 shadow-md z-10"
              >
                <CheckCircle2 className="h-4 w-4" />
              </motion.div>
            )}

            {/* Header: icon + number + status */}
            <div className="flex items-center gap-2 mb-1.5">
              <div
                className={cn(
                  'p-1.5 rounded-lg',
                  isSelected
                    ? 'bg-primary/15'
                    : isAvailable
                      ? 'bg-emerald-500/10'
                      : 'bg-rose-500/10'
                )}
              >
                {isAvailable ? (
                  <Car
                    className={cn(
                      'h-4 w-4',
                      isSelected ? 'text-primary' : 'text-emerald-500'
                    )}
                  />
                ) : (
                  <Lock className="h-4 w-4 text-rose-400" />
                )}
              </div>
              <div className="min-w-0">
                <span
                  className={cn(
                    'text-sm font-bold block leading-tight',
                    isSelected && 'text-primary'
                  )}
                >
                  #{slot.slot_number}
                </span>
                <span
                  className={cn(
                    'text-[10px] font-semibold uppercase tracking-wider',
                    isSelected
                      ? 'text-primary/80'
                      : isAvailable
                        ? 'text-emerald-500'
                        : 'text-rose-500'
                  )}
                >
                  {isAvailable ? 'Available' : 'Booked'}
                </span>
              </div>
            </div>

            {/* Schedule section */}
            {hasBookings && (
              <div className="mt-auto pt-2 border-t border-border/30 space-y-1">
                <div className="flex items-center gap-1">
                  <CalendarClock className="h-2.5 w-2.5 text-muted-foreground/60" />
                  <span className="text-[9px] font-bold text-muted-foreground/60 uppercase tracking-widest">
                    Schedule
                  </span>
                </div>
                {displayBookings.map((b, idx) => (
                  <div
                    key={idx}
                    className={cn(
                      'text-[10px] rounded-md px-2 py-1 font-medium flex items-center gap-1 leading-tight',
                      !isAvailable && idx === 0
                        ? 'bg-rose-500/10 text-rose-500 border border-rose-500/15'
                        : 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/10'
                    )}
                  >
                    <Clock className="h-2.5 w-2.5 flex-shrink-0" />
                    <span className="truncate">
                      {formatShortDate(b.start_time)} {formatTime(b.start_time)}{' '}
                      – {b.end_time ? formatTime(b.end_time) : 'Open'}
                    </span>
                  </div>
                ))}
                {moreCount > 0 && (
                  <p className="text-[9px] text-muted-foreground pl-1">
                    +{moreCount} more
                  </p>
                )}
              </div>
            )}
          </motion.div>
        );
      })}
    </div>
  );
};

export default SlotGrid;
