import { useEffect, useState } from 'react';
import { MapContainer, TileLayer, useMap } from 'react-leaflet';
import { Button } from './ui/button';
import { MapPin } from 'lucide-react';
import 'leaflet/dist/leaflet.css';

// Component to handle map center updates
const MapCenterUpdater = ({ onCenterChange, initialCenter }: { onCenterChange: (lat: number, lng: number) => void, initialCenter: [number, number] }) => {
  const map = useMap();
  
  // Update view only if initialCenter drastically changes or on mount? 
  // We don't want to reset if user moved it. 
  // Actually, we pass initialCenter only once.
  
  useEffect(() => {
    const onMove = () => {
      const center = map.getCenter();
      onCenterChange(center.lat, center.lng);
    };
    
    map.on('move', onMove);
    map.on('moveend', onMove);
    
    return () => {
      map.off('move', onMove);
      map.off('moveend', onMove);
    };
  }, [map, onCenterChange]);

  return null;
};

interface MapPickerProps {
  initialLat: number;
  initialLng: number;
  onConfirm: (lat: number, lng: number) => void;
  onCancel: () => void;
}

const MapPicker = ({ initialLat, initialLng, onConfirm, onCancel }: MapPickerProps) => {
  // Use defaults if 0 or NaN
  const startLat = initialLat || 13.0827; // Chennai default
  const startLng = initialLng || 80.2707;
  
  const [localCenter, setLocalCenter] = useState({ lat: startLat, lng: startLng });

  return (
    <div className="flex flex-col h-full">
        <div className="relative flex-1 min-h-[350px] rounded-lg overflow-hidden border border-border">
          <MapContainer 
            center={[startLat, startLng]} 
            zoom={15} 
            style={{ height: '100%', width: '100%' }}
            className="z-0"
          >
            <TileLayer
                url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
                attribution='&copy; <a href="https://carto.com/attributions">CARTO</a>'
            />
            <MapCenterUpdater onCenterChange={(lat, lng) => setLocalCenter({lat, lng})} initialCenter={[startLat, startLng]} />
          </MapContainer>
          
          {/* Center Pin Overlay */}
          <div className="absolute inset-0 pointer-events-none z-10 flex items-center justify-center pb-7">
            {/* Bounce effect maybe too much? Just a pin. */}
            <MapPin className="h-10 w-10 text-primary drop-shadow-xl" fill="currentColor" strokeWidth={1} />
          </div>

          {/* Coordinates Overlay */}
          <div className="absolute top-2 right-2 z-20 bg-background/90 backdrop-blur px-3 py-1 rounded-md text-xs font-mono border border-border shadow-sm">
             {localCenter.lat.toFixed(5)}, {localCenter.lng.toFixed(5)}
          </div>
        </div>
        
        <div className="flex justify-end gap-2 mt-4">
             <Button variant="outline" onClick={onCancel}>Cancel</Button>
             <Button onClick={() => onConfirm(localCenter.lat, localCenter.lng)}>
               <MapPin className="h-4 w-4 mr-2" /> Confirm Location
             </Button>
        </div>
    </div>
  );
};

export default MapPicker;
