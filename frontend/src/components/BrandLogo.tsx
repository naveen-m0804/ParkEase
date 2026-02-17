import { useState } from 'react';
import { cn } from '@/lib/utils';
import logo from '../assets/logo.png';

export const BrandLogo = ({ className }: { className?: string }) => {
  const [error, setError] = useState(false);
  
  if (error) {
    // Fallback if image fails (until user adds it)
    return <span className={cn("text-3xl font-extrabold text-primary", className)}>🅿️</span>;
  }
  
  return (
    <img 
      src={logo} 
      alt="ParkEase Logo" 
      className={cn("h-10 w-auto object-contain drop-shadow-md", className)}
      onError={() => setError(true)}
    />
  );
};
