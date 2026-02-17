import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { signOut } from 'firebase/auth';
import { auth } from '@/config/firebase';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { useGeolocation } from '@/hooks/useGeolocation';
import api from '@/api/axios';
import { toast } from 'sonner';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { Edit2, Trash2, Plus, MapPin, LogOut, Map, Car, Bike, Truck } from 'lucide-react';
import MapPicker from '@/components/MapPicker';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';

const Profile = () => {
  const navigate = useNavigate();
  const { profile, refreshProfile } = useAuth();
  const { location, requestLocation } = useGeolocation();

  // Edit profile
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');

  // Parking spaces
  const [spaces, setSpaces] = useState<any[]>([]);
  const [loadingSpaces, setLoadingSpaces] = useState(true);

  // Add/Edit parking dialog
  const [parkingDialog, setParkingDialog] = useState(false);
  const [editingParkingId, setEditingParkingId] = useState<string | null>(null);
  const [pForm, setPForm] = useState({
    placeName: '', address: '', latitude: '', longitude: '',
    pricePerHourCar: '0', totalSlotsCar: '0',
    pricePerHourBike: '0', totalSlotsBike: '0',
    pricePerHourOther: '0', totalSlotsOther: '0',
    description: '',
  });
  const [savingParking, setSavingParking] = useState(false);
  const [mapOpen, setMapOpen] = useState(false);

  // Delete account
  const [deleteDialog, setDeleteDialog] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState('');

  useEffect(() => {
    if (profile) {
      setName(profile.name);
      setPhone(profile.phone || '');
      setEmail(profile.email || '');
    }
  }, [profile]);

  const fetchSpaces = async () => {
    try {
      const { data } = await api.get('/parking/my');
      setSpaces(data.data || []);
    } catch { /* ignore */ }
    setLoadingSpaces(false);
  };

  useEffect(() => { fetchSpaces(); }, []);

  const handleSaveProfile = async () => {
    try {
      await api.put('/users/me', { name, phone: phone || null, email: email || null });
      await refreshProfile();
      toast.success('Profile updated');
      setEditing(false);
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Update failed');
    }
  };

  const handleToggleActive = async (id: string, isActive: boolean) => {
    try {
      await api.put(`/parking/${id}`, { isActive });
      fetchSpaces();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to update');
    }
  };

  const handleDeleteParking = async (id: string) => {
    if (!confirm('Delete this parking space?')) return;
    try {
      await api.delete(`/parking/${id}`);
      toast.success('Parking deleted');
      fetchSpaces();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Delete failed');
    }
  };

  const openAddParking = () => {
    setEditingParkingId(null);
    setPForm({ 
      placeName: '', address: '', latitude: '', longitude: '', 
      pricePerHourCar: '0', totalSlotsCar: '5',
      pricePerHourBike: '0', totalSlotsBike: '10',
      pricePerHourOther: '0', totalSlotsOther: '0',
      description: '' 
    });
    setParkingDialog(true);
  };

  const openEditParking = (s: any) => {
    setEditingParkingId(s.id);
    setPForm({
      placeName: s.place_name, address: s.address,
      latitude: String(s.latitude), longitude: String(s.longitude),
      
      pricePerHourCar: String(parseFloat(s.price_per_hour_car || 0)),
      totalSlotsCar: String(s.total_slots_car || 0),
      
      pricePerHourBike: String(parseFloat(s.price_per_hour_bike || 0)),
      totalSlotsBike: String(s.total_slots_bike || 0),
      
      pricePerHourOther: String(parseFloat(s.price_per_hour_other || 0)),
      totalSlotsOther: String(s.total_slots_other || 0),
      
      description: s.description || '',
    });
    setParkingDialog(true);
  };

  const handleSaveParking = async () => {
    setSavingParking(true);
    const body = {
      placeName: pForm.placeName,
      address: pForm.address,
      latitude: parseFloat(pForm.latitude),
      longitude: parseFloat(pForm.longitude),
      
      pricePerHourCar: parseFloat(pForm.pricePerHourCar),
      totalSlotsCar: parseInt(pForm.totalSlotsCar),
      
      pricePerHourBike: parseFloat(pForm.pricePerHourBike),
      totalSlotsBike: parseInt(pForm.totalSlotsBike),
      
      pricePerHourOther: parseFloat(pForm.pricePerHourOther),
      totalSlotsOther: parseInt(pForm.totalSlotsOther),
      
      description: pForm.description || null,
    };
    try {
      if (editingParkingId) {
        await api.put(`/parking/${editingParkingId}`, body);
      } else {
        await api.post('/parking', body);
      }
      toast.success(editingParkingId ? 'Parking updated' : 'Parking created');
      setParkingDialog(false);
      fetchSpaces();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to save');
    } finally {
      setSavingParking(false);
    }
  };

  const detectLocation = () => {
    requestLocation();
    if (location) {
      setPForm(f => ({ ...f, latitude: String(location.lat), longitude: String(location.lng) }));
    }
  };

  useEffect(() => {
    if (location && parkingDialog) {
      setPForm(f => ({ ...f, latitude: String(location.lat), longitude: String(location.lng) }));
    }
  }, [location, parkingDialog]);

  const handleDeleteAccount = async () => {
    try {
      await api.delete('/users/me');
      await signOut(auth);
      toast.success('Account deleted');
      navigate('/login');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Delete failed');
    }
  };

  const handleLogout = async () => {
    await signOut(auth);
    navigate('/login');
  };

  if (!profile) return null;

  return (
    <div className="min-h-screen bg-background pb-20">
      <header className="sticky top-0 z-30 bg-background/95 backdrop-blur-md border-b border-border px-4 py-4">
        <div className="max-w-3xl mx-auto flex justify-between items-center">
          <h1 className="text-xl font-extrabold">Profile</h1>
          <button onClick={handleLogout} className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
            <LogOut className="h-4 w-4" /> Logout
          </button>
        </div>
      </header>

      <div className="max-w-3xl mx-auto p-4 space-y-6">
        {/* User Info */}
        <motion.section initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-card rounded-lg border border-border p-6 shadow-sm">
          <div className="flex flex-col items-center mb-4">
            <div className="w-16 h-16 rounded-full accent-gradient flex items-center justify-center text-2xl font-bold text-primary-foreground mb-3 shadow-md">
              {profile.name.charAt(0).toUpperCase()}
            </div>
          </div>

          {editing ? (
            <div className="space-y-3">
              <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Name" className="h-11 bg-muted border-border" />
              <Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="Phone" className="h-11 bg-muted border-border" />
              <Input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" className="h-11 bg-muted border-border" />
              <div className="flex gap-2 justify-center mt-4">
                <Button size="sm" onClick={handleSaveProfile}>Save Changes</Button>
                <Button size="sm" variant="secondary" onClick={() => setEditing(false)}>Cancel</Button>
              </div>
            </div>
          ) : (
            <div className="space-y-2 text-center">
              <h2 className="font-bold text-xl">{profile.name}</h2>
              {profile.phone && <p className="text-sm text-muted-foreground">{profile.phone}</p>}
              {profile.email && <p className="text-sm text-muted-foreground">{profile.email}</p>}
              <p className="text-xs text-muted-foreground">Member since {new Date(profile.created_at).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}</p>
              <Button size="sm" variant="ghost" className="mt-2" onClick={() => setEditing(true)}>
                <Edit2 className="h-3 w-3 mr-1" /> Edit Profile
              </Button>
            </div>
          )}
        </motion.section>

        {/* My Parking Spaces */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">My Parking Spaces</h2>
            <Button size="sm" onClick={openAddParking}>
              <Plus className="h-4 w-4 mr-1" /> Add New
            </Button>
          </div>

          {loadingSpaces ? (
            <div className="skeleton-shimmer h-24 rounded-lg" />
          ) : spaces.length === 0 ? (
            <div className="text-center py-12 bg-muted/30 rounded-lg border border-dashed border-border">
              <p className="text-muted-foreground text-sm">No parking spaces listed yet</p>
              <Button variant="link" onClick={openAddParking}>Add your first space</Button>
            </div>
          ) : (
            <div className="space-y-4">
              {spaces.map(s => (
                <div key={s.id} className="bg-card rounded-lg border border-border p-4 shadow-sm hover:border-primary/50 transition-colors">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h3 className="font-bold text-base">{s.place_name}</h3>
                      <p className="text-xs text-muted-foreground truncate max-w-[200px]">{s.address}</p>
                    </div>
                    <span className={cn('text-[10px] font-bold px-2 py-1 rounded-full uppercase tracking-wide', s.is_active ? 'bg-emerald-500/10 text-emerald-500' : 'bg-rose-500/10 text-rose-500')}>
                      {s.is_active ? 'Active' : 'Paused'}
                    </span>
                  </div>
                  
                  <div className="grid grid-cols-3 gap-2 mb-4">
                    <div className="bg-muted/50 p-2 rounded text-center">
                      <div className="text-xs text-muted-foreground"><Car className="h-3 w-3 inline mr-1" /> Car</div>
                      <div className="font-bold">₹{s.price_per_hour_car}</div>
                      <div className="text-[10px] text-muted-foreground">
                         <span className={parseInt(s.available_slots_car) > 0 ? "text-emerald-500 font-bold" : "text-rose-500"}>{s.available_slots_car}</span>/{s.total_slots_car} slots
                      </div>
                    </div>
                    <div className="text-center p-2 rounded bg-secondary/20">
                      <div className="text-xs text-muted-foreground"><Bike className="h-3 w-3 inline mr-1" /> Bike</div>
                      <div className="font-bold">₹{s.price_per_hour_bike}</div>
                      <div className="text-[10px] text-muted-foreground">
                         <span className={parseInt(s.available_slots_bike) > 0 ? "text-emerald-500 font-bold" : "text-rose-500"}>{s.available_slots_bike}</span>/{s.total_slots_bike} slots
                      </div>
                    </div>
                    <div className="text-center p-2 rounded bg-secondary/20">
                      <div className="text-xs text-muted-foreground"><Truck className="h-3 w-3 inline mr-1" /> Other</div>
                      <div className="font-bold">₹{s.price_per_hour_other}</div>
                      <div className="text-[10px] text-muted-foreground">
                         <span className={parseInt(s.available_slots_other) > 0 ? "text-emerald-500 font-bold" : "text-rose-500"}>{s.available_slots_other}</span>/{s.total_slots_other} slots
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 border-t border-border pt-3">
                    <Button size="sm" variant="ghost" className="h-8 w-8 p-0" onClick={() => openEditParking(s)}>
                      <Edit2 className="h-3 w-3" />
                    </Button>
                    <Button size="sm" variant="ghost" className="h-8 w-8 p-0 text-destructive hover:text-destructive" onClick={() => handleDeleteParking(s.id)}>
                      <Trash2 className="h-3 w-3" />
                    </Button>
                    <div className="ml-auto flex items-center gap-2">
                       <label className="text-xs text-muted-foreground">Availability</label>
                      <Switch checked={s.is_active} onCheckedChange={(v) => handleToggleActive(s.id, v)} />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Danger Zone */}
        <section className="bg-destructive/5 rounded-lg border border-destructive/20 p-6 mt-8">
          <h2 className="font-bold text-sm text-destructive mb-2">⚠️ Danger Zone</h2>
          <p className="text-xs text-muted-foreground mb-4">Permanently delete your account, all bookings, and parking spaces.</p>
          <Button variant="destructive" size="sm" onClick={() => setDeleteDialog(true)}>Delete My Account</Button>
        </section>
      </div>

      {/* Parking Form Dialog */}
      <Dialog open={parkingDialog} onOpenChange={setParkingDialog}>
        <DialogContent className="glass border-border max-h-[85vh] overflow-y-auto w-full max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingParkingId ? 'Edit Parking Space' : 'Add Parking Space'}</DialogTitle>
            <DialogDescription>
              Enter the details for your parking location. Accurate info helps drivers find you.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-2">
            <div>
              <label className="text-xs font-medium mb-1 block">Location Details</label>
              <Input placeholder="Place Name (e.g. Saveetha Parking)" value={pForm.placeName} onChange={e => setPForm(f => ({ ...f, placeName: e.target.value }))} className="bg-muted border-border mb-2" />
              <Input placeholder="Full Address" value={pForm.address} onChange={e => setPForm(f => ({ ...f, address: e.target.value }))} className="bg-muted border-border" />
            </div>

            <div>
              <label className="text-xs font-medium mb-1 block">Coordinates</label>
              <div className="flex gap-2 mb-2">
                <Input placeholder="Latitude" value={pForm.latitude} onChange={e => setPForm(f => ({ ...f, latitude: e.target.value }))} className="bg-muted border-border" />
                <Input placeholder="Longitude" value={pForm.longitude} onChange={e => setPForm(f => ({ ...f, longitude: e.target.value }))} className="bg-muted border-border" />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <Button size="sm" variant="secondary" type="button" onClick={detectLocation} className="w-full">
                  <MapPin className="h-3 w-3 mr-1" /> Auto-Detect
                </Button>
                <Button size="sm" variant="outline" type="button" onClick={() => setMapOpen(true)} className="w-full">
                  <Map className="h-3 w-3 mr-1" /> Locate on Map
                </Button>
              </div>
            </div>

            <div>
              <label className="text-xs font-medium mb-2 block">Capacities & Pricing</label>
              <div className="grid grid-cols-[1fr,1fr,1fr] gap-4 mb-2">
                <div className="text-xs text-center text-muted-foreground">Type</div>
                <div className="text-xs text-center text-muted-foreground">Price/Hr (₹)</div>
                <div className="text-xs text-center text-muted-foreground">Total Slots</div>
              </div>
              
              {/* Car Row */}
              <div className="grid grid-cols-[1fr,1fr,1fr] gap-4 items-center mb-2">
                <div className="flex items-center gap-2 text-sm font-medium">🚗 Car</div>
                <Input type="number" placeholder="₹" value={pForm.pricePerHourCar} onChange={e => setPForm(f => ({ ...f, pricePerHourCar: e.target.value }))} className="bg-muted border-border h-9" />
                <Input type="number" placeholder="#" value={pForm.totalSlotsCar} onChange={e => setPForm(f => ({ ...f, totalSlotsCar: e.target.value }))} className="bg-muted border-border h-9" />
              </div>

              {/* Bike Row */}
              <div className="grid grid-cols-[1fr,1fr,1fr] gap-4 items-center mb-2">
                <div className="flex items-center gap-2 text-sm font-medium">🏍️ Bike</div>
                <Input type="number" placeholder="₹" value={pForm.pricePerHourBike} onChange={e => setPForm(f => ({ ...f, pricePerHourBike: e.target.value }))} className="bg-muted border-border h-9" />
                <Input type="number" placeholder="#" value={pForm.totalSlotsBike} onChange={e => setPForm(f => ({ ...f, totalSlotsBike: e.target.value }))} className="bg-muted border-border h-9" />
              </div>

              {/* Other Row */}
              <div className="grid grid-cols-[1fr,1fr,1fr] gap-4 items-center">
                <div className="flex items-center gap-2 text-sm font-medium">🚐 Other</div>
                <Input type="number" placeholder="₹" value={pForm.pricePerHourOther} onChange={e => setPForm(f => ({ ...f, pricePerHourOther: e.target.value }))} className="bg-muted border-border h-9" />
                <Input type="number" placeholder="#" value={pForm.totalSlotsOther} onChange={e => setPForm(f => ({ ...f, totalSlotsOther: e.target.value }))} className="bg-muted border-border h-9" />
              </div>
            </div>

            <div>
              <label className="text-xs font-medium mb-1 block">Description</label>
              <Textarea placeholder="Any instructions for drivers? (Optional)" value={pForm.description} onChange={e => setPForm(f => ({ ...f, description: e.target.value }))} className="bg-muted border-border" />
            </div>
          </div>

          <DialogFooter>
            <Button variant="ghost" onClick={() => setParkingDialog(false)}>Cancel</Button>
            <Button onClick={handleSaveParking} disabled={savingParking}>
              {savingParking ? 'Saving...' : 'Save Space'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Account Dialog */}
      <Dialog open={deleteDialog} onOpenChange={setDeleteDialog}>
        <DialogContent className="glass border-border">
          <DialogHeader>
            <DialogTitle>Delete Account</DialogTitle>
            <DialogDescription>
              This action cannot be undone. All your data will be lost.
            </DialogDescription>
          </DialogHeader>
          <div className="py-2">
            <p className="text-sm text-muted-foreground mb-3">Type <span className="font-bold text-foreground">DELETE</span> to confirm:</p>
            <Input value={deleteConfirm} onChange={e => setDeleteConfirm(e.target.value)} className="bg-muted border-border" />
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setDeleteDialog(false)}>Cancel</Button>
            <Button variant="destructive" onClick={handleDeleteAccount} disabled={deleteConfirm !== 'DELETE'}>Delete Account</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      {/* Map Picker Dialog */}
      <Dialog open={mapOpen} onOpenChange={setMapOpen}>
        <DialogContent className="glass border-border max-w-4xl h-[80vh] flex flex-col p-6 overflow-hidden">
          <DialogHeader>
            <DialogTitle>Pin Location</DialogTitle>
            <DialogDescription>Move the map to pinpoint the exact entrance.</DialogDescription>
          </DialogHeader>
          <div className="flex-1 min-h-0">
             {mapOpen && (
               <MapPicker 
                 initialLat={parseFloat(pForm.latitude) || 13.0827} 
                 initialLng={parseFloat(pForm.longitude) || 80.2707}
                 onConfirm={(lat, lng) => {
                   setPForm(f => ({ ...f, latitude: String(lat), longitude: String(lng) }));
                   setMapOpen(false);
                 }}
                 onCancel={() => setMapOpen(false)}
               />
             )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Profile;
