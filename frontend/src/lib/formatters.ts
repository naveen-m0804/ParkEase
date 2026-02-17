export const formatDistance = (meters: string | number) => {
  const m = parseFloat(String(meters));
  return m < 1000 ? `${Math.round(m)}m` : `${(m / 1000).toFixed(1)} km`;
};

export const formatDuration = (start: string, end: string) => {
  const ms = new Date(end).getTime() - new Date(start).getTime();
  const hours = Math.floor(ms / 3600000);
  const mins = Math.floor((ms % 3600000) / 60000);
  return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
};

export const formatAmount = (amount: string | number | null) => {
  if (!amount) return 'Calculating...';
  return `₹${parseFloat(String(amount)).toFixed(0)}`;
};

export const VEHICLE_TYPES = [
  { value: 'car', label: '🚗 Car', icon: '🚗' },
  { value: 'bike', label: '🏍️ Bike', icon: '🏍️' },
  { value: 'other', label: '🚐 Other', icon: '🚐' },
] as const;

export const PRICE_FIELD_MAP: Record<string, string> = {
  car: 'price_per_hour_car',
  bike: 'price_per_hour_bike',
  other: 'price_per_hour_other',
};

export const BOOKING_STATUS: Record<string, { label: string; colorClass: string }> = {
  confirmed: { label: 'Confirmed', colorClass: 'bg-status-available/20 text-status-available' },
  completed: { label: 'Completed', colorClass: 'bg-status-completed/20 text-status-completed' },
  cancelled: { label: 'Cancelled', colorClass: 'bg-status-cancelled/20 text-status-cancelled' },
};
