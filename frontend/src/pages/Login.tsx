import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { signInWithEmailAndPassword, signInWithPopup, GoogleAuthProvider, signOut } from 'firebase/auth';
import { auth } from '@/config/firebase';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Mail, Lock, Eye, EyeOff, Clock, Shield, Map, Smartphone } from 'lucide-react';
import { toast } from 'sonner';
import api from '@/api/axios';
import { BrandLogo } from '@/components/BrandLogo';
import heroImg from '@/assets/hero.png';

import { usePageTitle } from '@/hooks/usePageTitle';

const Login = () => {
  usePageTitle('Login');
  const navigate = useNavigate();
  const { firebaseUser } = useAuth();
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { 
      opacity: 1,
      transition: { 
        staggerChildren: 0.15,
        delayChildren: 0.2
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: { 
        duration: 0.8, 
        ease: "easeOut" as const 
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    // ... same logic
    e.preventDefault();
    setLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email, password);
      try {
        await api.get('/users/me');
        toast.success('Login successful!');
        navigate('/');
      } catch (backendErr: any) {
        if (backendErr.response?.status === 404) {
          // User exists in Firebase but not in DB (Zombie state)
          // Sign out immediately preventing the "Complete Profile" screen
          await signOut(auth);
          toast.error('Account not found. Please sign up.');
          // Do NOT navigate to register, let them choose.
        } else {
          throw backendErr;
        }
      }
    } catch (err: any) {
      console.error(err);
      if (err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password') {
        toast.error('Invalid email or password.');
      } else {
        toast.error('Login failed. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGoogle = async () => {
    try {
       await signInWithPopup(auth, new GoogleAuthProvider());
       navigate('/');
    } catch (err: any) {
      toast.error(err.message || 'Google sign-in failed');
    }
  };

  if (firebaseUser) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background p-4 relative overflow-hidden">
        <div className="fixed inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/10 via-background to-background -z-10" />
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, ease: "easeOut" as const }}
          className="w-full max-w-md glass rounded-xl border border-border p-8 text-center relative z-10"
        >
            <BrandLogo className="h-16 w-16 mx-auto mb-6" />
            <h1 className="text-2xl font-bold mb-4">You are logged in</h1>
            <p className="mb-6 text-muted-foreground">{firebaseUser.email}</p>
            <div className="space-y-3">
                <Button onClick={() => navigate('/')} className="w-full font-bold">
                    Go to Dashboard
                </Button>
                <Button variant="outline" onClick={() => navigate('/register')} className="w-full">
                    Complete Registration
                </Button>
                <Button variant="ghost" onClick={() => signOut(auth)} className="w-full text-rose-500 hover:text-rose-600 hover:bg-rose-500/10">
                    Sign Out
                </Button>
            </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background relative overflow-x-hidden selection:bg-primary/20">
      <div className="fixed inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/5 via-background to-background -z-10" />
      <div className="fixed top-0 left-0 w-96 h-96 bg-primary/10 rounded-full blur-[100px] -translate-x-1/2 -translate-y-1/2 -z-10" />
      
      <motion.div 
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="container mx-auto px-4 py-8 flex flex-col items-center justify-center min-h-screen gap-16"
      >
        
        {/* Main Login Card */}
        <motion.div
          variants={itemVariants}
          className="w-full max-w-md glass rounded-2xl border border-white/10 p-8 shadow-2xl shadow-black/50"
        >
          <div className="flex flex-col items-center mb-8">
            <BrandLogo className="h-14 w-auto mb-4" />
            <h1 className="text-3xl font-black tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white to-white/70">
              ParkEase
            </h1>
            <p className="text-muted-foreground text-sm font-medium">Smart Parking Solution</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-4">
              <div className="relative group">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                <Input
                  type="email"
                  placeholder="Email address"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-10 h-12 bg-muted/50 border-white/5 focus:border-primary/50 transition-all"
                  required
                />
              </div>

              <div className="relative group">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                <Input
                  type={showPass ? 'text' : 'password'}
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-10 pr-10 h-12 bg-muted/50 border-white/5 focus:border-primary/50 transition-all"
                  required
                  minLength={6}
                />
                <button
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  {showPass ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <Button type="submit" size="lg" className="w-full font-bold text-base h-12 shadow-lg shadow-primary/20 hover:shadow-primary/40 transition-all" disabled={loading}>
              {loading ? 'Please wait...' : 'Sign In'}
            </Button>
          </form>

          <div className="relative my-8">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-white/10" />
            </div>
            <div className="relative flex justify-center text-xs uppercase tracking-widest font-bold">
              <span className="bg-background/50 backdrop-blur px-4 text-muted-foreground">Or continue with</span>
            </div>
          </div>

          <Button variant="secondary" size="lg" className="w-full h-12 font-semibold bg-white/5 hover:bg-white/10 border border-white/5 transition-all text-white" onClick={handleGoogle}>
            <svg className="h-5 w-5 mr-3" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            Google
          </Button>

          <p className="text-center mt-8 text-sm text-muted-foreground">
            Don't have an account?{' '}
            <Link to="/register" className="text-primary font-bold hover:underline underline-offset-4 decoration-2 decoration-primary/50">
              Sign Up
            </Link>
          </p>
        </motion.div>

        {/* Hero & Features Section */}
        <motion.div 
           variants={itemVariants} 
           className="w-full max-w-5xl space-y-16 text-center pb-12"
        >
            {/* Hero Image Card */}
            <div className="relative mx-auto w-full max-w-2xl aspect-[16/9] md:aspect-[21/9] rounded-3xl overflow-hidden shadow-2xl shadow-primary/10 border border-white/10 bg-card/30 backdrop-blur-sm group">
               {/* Placeholder until image loads */}
               <div className="absolute inset-0 bg-muted/20 animate-pulse -z-10" />
               <img 
                 src={heroImg} 
                 alt="Smart Parking Experience" 
                 className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-700 ease-out"
                 onError={(e) => {
                    e.currentTarget.style.display = 'none';
                    e.currentTarget.parentElement?.classList.add('flex', 'items-center', 'justify-center');
                    e.currentTarget.parentElement.innerHTML = '<div class="text-muted-foreground font-bold p-4">Please add hero.png to assets</div>';
                 }}
               />
               <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent opacity-80" />
               
               <div className="absolute bottom-6 left-6 right-6 text-left">
                  <div className="inline-flex items-center gap-2 bg-primary/90 text-primary-foreground px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider backdrop-blur-md mb-2 shadow-lg shadow-primary/20">
                    <Smartphone className="h-3 w-3" /> Mobile Ready
                  </div>
                  <h2 className="text-2xl md:text-3xl font-black text-white leading-tight">
                    Parking Reimagined for the Modern Driver.
                  </h2>
               </div>
            </div>

            {/* Features Grid */}
            <div className="grid md:grid-cols-3 gap-6 text-left">
               <FeatureCard 
                 icon={<Clock className="h-6 w-6" />} 
                 title="Real-Time Availability" 
                 desc="Find spots instantly with live updates. No more circling the block endlessly." 
                 delay={0.1} 
               />
               <FeatureCard 
                 icon={<Shield className="h-6 w-6" />} 
                 title="Secure Transactions" 
                 desc="Book with absolute confidence using our industry-standard encrypted gateway." 
                 delay={0.2} 
               />
               <FeatureCard 
                 icon={<Map className="h-6 w-6" />} 
                 title="Smart Navigation" 
                 desc="Get precise turn-by-turn directions directly to your reserved parking spot." 
                 delay={0.3} 
               />
            </div>
            
        </motion.div>
      </motion.div>
    </div>
  );
};

const FeatureCard = ({ icon, title, desc, delay }: any) => (
  <motion.div 
    initial={{ opacity: 0, y: 20 }}
    whileInView={{ opacity: 1, y: 0 }}
    transition={{ delay, duration: 0.5 }}
    viewport={{ once: true }}
    className="bg-card/20 backdrop-blur-md border border-white/5 p-8 rounded-2xl hover:bg-card/40 transition-colors group"
  >
    <div className="h-12 w-12 bg-primary/10 text-primary rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300 shadow-lg shadow-primary/5">
      {icon}
    </div>
    <h3 className="font-bold text-lg mb-3 text-foreground/90">{title}</h3>
    <p className="text-muted-foreground text-sm leading-relaxed">{desc}</p>
  </motion.div>
);

export default Login;
