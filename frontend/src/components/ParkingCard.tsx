import { useNavigate } from 'react-router-dom';
import { Phone, Navigation, MapPin } from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatDistance } from '@/lib/formatters';
import { motion } from 'framer-motion';

interface ParkingSpace {
  id: string;
  place_name: string;
  address: string;
  latitude: number;
  longitude: number;
  price_per_hour_car: string;
  price_per_hour_bike: string;
  price_per_hour_other: string;
  available_slots_car?: string;
  total_slots_car?: string;
  available_slots_bike?: string;
  total_slots_bike?: string;
  available_slots_other?: string;
  total_slots_other?: string;
  available_slots?: string; // Legacy support or transient
  total_active_slots?: string; // Legacy support or transient
  owner_name: string;
  owner_phone: string;
  distance_meters?: string;
  description?: string;
}

interface ParkingCardProps {
  parking: ParkingSpace;
  index?: number;
}

const ParkingCard = ({ parking, index = 0 }: ParkingCardProps) => {
  const navigate = useNavigate();
  
  const available = (parseInt(parking.available_slots_car || '0') + 
                     parseInt(parking.available_slots_bike || '0') + 
                     parseInt(parking.available_slots_other || '0'));
                     
  const total = (parseInt(parking.total_slots_car || '0') + 
                 parseInt(parking.total_slots_bike || '0') + 
                 parseInt(parking.total_slots_other || '0'));

  const isFull = available === 0;
  const fillPercent = total > 0 ? (available / total) * 100 : 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.05 }}
      onClick={() => navigate(`/parking/${parking.id}`)}
      className={cn(
        'group relative rounded-lg border border-border bg-card p-4 cursor-pointer transition-all duration-250',
        'hover:scale-[1.02] hover:border-muted-foreground/30',
        isFull && 'opacity-70'
      )}
      style={{ boxShadow: 'var(--shadow-card)' }}
    >
      {/* Distance badge */}
      {parking.distance_meters && (
        <span className="absolute top-3 right-3 text-xs font-semibold bg-muted px-2 py-1 rounded-full text-muted-foreground">
          {formatDistance(parking.distance_meters)}
        </span>
      )}

      {/* Title */}
      <div className="flex items-start gap-2 mb-1 pr-16">
        <MapPin className="h-4 w-4 text-primary mt-0.5 shrink-0" />
        <h3 className="font-bold text-foreground leading-tight">{parking.place_name}</h3>
      </div>
      <p className="text-xs text-muted-foreground mb-3 ml-6 line-clamp-1">{parking.address}</p>

      {/* Prices */}
      <div className="flex gap-3 text-xs font-medium mb-3 ml-6">
        <span>🚗 ₹{parseFloat(parking.price_per_hour_car).toFixed(0)}/hr</span>
        <span>🏍️ ₹{parseFloat(parking.price_per_hour_bike).toFixed(0)}/hr</span>
        <span>🚐 ₹{parseFloat(parking.price_per_hour_other).toFixed(0)}/hr</span>
      </div>

      {/* Availability */}
      <div className="mb-3 ml-6">
        <div className="flex items-center justify-between mb-1">
          <span className={cn(
            'text-xs font-semibold flex items-center gap-1',
            isFull ? 'text-status-occupied' : 'text-status-available'
          )}>
            {isFull ? (
              '🔴 Full'
            ) : (
              <><span className="status-pulse">🟢</span> {available}/{total} Available</>
            )}
          </span>
        </div>
        <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
          <div
            className={cn('h-full rounded-full transition-all duration-500', isFull ? 'bg-status-occupied' : 'bg-status-available')}
            style={{ width: `${fillPercent}%` }}
          />
        </div>
      </div>

      {/* Owner */}
      <p className="text-xs text-muted-foreground mb-3 ml-6">Listed by {parking.owner_name}</p>

      {/* Actions */}
      <div className="flex gap-2 ml-6" onClick={(e) => e.stopPropagation()}>
        <a
          href={`tel:${parking.owner_phone}`}
          className="flex items-center gap-1.5 text-xs font-medium bg-muted px-3 py-2 rounded-md hover:bg-accent transition-colors"
        >
          <Phone className="h-3.5 w-3.5" /> Call Owner
        </a>
        <button
          onClick={() => window.open(`https://www.google.com/maps/dir/?api=1&destination=${parking.latitude},${parking.longitude}`, '_blank')}
          className="flex items-center gap-1.5 text-xs font-medium bg-muted px-3 py-2 rounded-md hover:bg-accent transition-colors"
        >
          <Navigation className="h-3.5 w-3.5" /> Navigate
        </button>
      </div>
    </motion.div>
  );
};

export default ParkingCard;
