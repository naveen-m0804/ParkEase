import { NavLink } from 'react-router-dom';
import { Home, Search, ClipboardList, User } from 'lucide-react';
import { cn } from '@/lib/utils';

const items = [
  { to: '/', icon: Home, label: 'Home' },
  { to: '/search', icon: Search, label: 'Search' },
  { to: '/bookings', icon: ClipboardList, label: 'Bookings' },
  { to: '/profile', icon: User, label: 'Profile' },
];

interface BottomNavProps {
  variant: 'bottom' | 'sidebar';
}

const BottomNav = ({ variant }: BottomNavProps) => {
  if (variant === 'sidebar') {
    return (
      <nav className="flex flex-col gap-1 px-3">
        {items.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === '/'}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors',
                isActive
                  ? 'text-primary bg-primary/10'
                  : 'text-muted-foreground hover:text-foreground hover:bg-accent'
              )
            }
          >
            <item.icon className="h-5 w-5" />
            {item.label}
          </NavLink>
        ))}
      </nav>
    );
  }

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 h-16 bg-secondary/95 backdrop-blur-md border-t border-border">
      <div className="flex h-full items-center justify-around">
        {items.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === '/'}
            className={({ isActive }) =>
              cn(
                'flex flex-col items-center gap-1 text-xs font-medium transition-colors',
                isActive ? 'text-primary' : 'text-muted-foreground'
              )
            }
          >
            <item.icon className="h-5 w-5" />
            <span>{item.label}</span>
          </NavLink>
        ))}
      </div>
    </nav>
  );
};

export default BottomNav;
