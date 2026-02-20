import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import BottomNav from './BottomNav';
import { BrandLogo } from '@/components/BrandLogo';

const ProtectedLayout = () => {
  const { firebaseUser, profile, isNewUser, loading } = useAuth();
  const location = useLocation();

  if (loading) {
     // ...
     return (
       <div className="flex min-h-screen items-center justify-center bg-background">
         <div className="flex flex-col items-center gap-4">
           <div className="h-10 w-10 rounded-full border-2 border-primary border-t-transparent animate-spin" />
           <p className="text-muted-foreground text-sm">Loading...</p>
         </div>
       </div>
     );
  }

  if (!firebaseUser) return <Navigate to="/login" replace />;
  if (isNewUser) return <Navigate to="/login" replace />;

  return (
    <div className="min-h-screen bg-background pb-20 md:pb-0 md:pl-60">
      {/* Desktop sidebar */}
      <aside className="hidden md:flex fixed left-0 top-0 bottom-0 w-60 flex-col bg-secondary border-r border-border z-40">
        <div className="p-6 flex items-center gap-3">
          <BrandLogo className="h-8 w-8" />
          <h1 className="text-xl font-extrabold">VoidPark</h1>
        </div>
        <BottomNav variant="sidebar" />
      </aside>

      {/* Mobile bottom nav */}
      <div className="md:hidden">
        <BottomNav variant="bottom" />
      </div>

      <main className="min-h-screen">
        <Outlet />
      </main>
    </div>
  );
};

export default ProtectedLayout;
