import { cn } from '@/lib/utils';
import { Lock, Car, CheckCircle2 } from 'lucide-react';
import { motion } from 'framer-motion';

interface Slot {
  id: string;
  slot_number: number;
  is_active: boolean;
  status: 'available' | 'occupied';
  occupied_start?: string;
  occupied_end?: string;
}

interface SlotGridProps {
  slots: Slot[];
  onSelect?: (id: string) => void;
  selectedId?: string | null;
}

const formatTime = (d: string) => new Date(d).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

const SlotGrid = ({ slots, onSelect, selectedId }: SlotGridProps) => {
  return (
    <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3">
      {slots.filter(s => s.is_active).map((slot, i) => {
        const isSelected = selectedId === slot.id;
        const isAvailable = slot.status === 'available';
        
        let statusText: string = slot.status;
        if (!isAvailable && slot.occupied_start) {
           statusText = `${formatTime(slot.occupied_start)} - ${slot.occupied_end ? formatTime(slot.occupied_end) : 'Late'}`;
        }
        
        return (
          <motion.div
            key={slot.id}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: i * 0.05 }}
            onClick={() => isAvailable && onSelect?.(slot.id)}
            className={cn(
              'aspect-square relative rounded-xl flex flex-col items-center justify-center gap-1 border-2 transition-all duration-200 cursor-pointer shadow-sm',
              isSelected 
                ? 'bg-primary/20 border-primary shadow-md shadow-primary/10' 
                : isAvailable
                  ? 'bg-card border-border hover:border-primary/50 hover:bg-muted/50'
                  : 'bg-muted/50 border-border opacity-60 cursor-not-allowed',
            )}
          >
            {isSelected && (
              <div className="absolute top-1 right-1 text-primary">
                <CheckCircle2 className="h-4 w-4" />
              </div>
            )}
            
            {isAvailable ? (
               <Car className={cn("h-6 w-6 transition-colors", isSelected ? "text-primary" : "text-muted-foreground")} />
            ) : (
               <Lock className="h-6 w-6 text-muted-foreground/50" />
            )}
            
            <span className={cn("text-xs font-bold", isSelected ? "text-primary" : "text-foreground")}>
              #{slot.slot_number}
            </span>
            
            <span className={cn("text-[10px] uppercase font-semibold text-center leading-tight px-1", 
              isAvailable ? (isSelected ? "text-primary" : "text-emerald-500") : "text-rose-500"
            )}>
              {statusText}
            </span>
          </motion.div>
        );
      })}
    </div>
  );
};

export default SlotGrid;
