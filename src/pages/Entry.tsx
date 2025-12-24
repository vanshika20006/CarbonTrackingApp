import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Navbar } from '@/components/layout/Navbar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { LocationPicker } from '@/components/LocationPicker';
import { useDemo } from '@/contexts/DemoContext';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { checkAndAwardBadges, getBadgeById } from '@/lib/badgeChecker';
import { 
  Car, Bike, Bus, Train, Footprints, Save, MapPin, Loader2, 
  ShoppingCart, Tv, Wifi, Shirt, Trash2, User, Utensils 
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface TodayEntry {
  id: string;
  entry_date: string;
  total_emissions: number;
}

const transportModes = [
  { id: 'public', label: 'Public', icon: Bus },
  { id: 'walk', label: 'Walk/Bike', icon: Footprints },
  { id: 'private', label: 'Private', icon: Car },
];

const vehicleTypes = [
  { id: 'petrol', label: 'Petrol' },
  { id: 'electric', label: 'Electric' },
  { id: 'hybrid', label: 'Hybrid' },
  { id: 'lpg', label: 'LPG' },
];

const dietTypes = [
  { id: 'vegetarian', label: 'Vegetarian', emoji: '🥗' },
  { id: 'vegan', label: 'Vegan', emoji: '🥬' },
  { id: 'pescatarian', label: 'Pescatarian', emoji: '🐟' },
  // { id: 'omnivore', label: 'Omnivore', emoji: '🍖' },
];

const bodyTypes = [
  { id: 'underweight', label: 'Underweight' },
  // { id: 'normal', label: 'Normal' },
  { id: 'overweight', label: 'Overweight' },
  { id: 'obese', label: 'Obese' },
];

export default function Entry() {
  const { isDemoMode, addDemoEntry } = useDemo();
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(false);
  const [showLocationPicker, setShowLocationPicker] = useState(false);
  const [todayEntries, setTodayEntries] = useState<TodayEntry[]>([]);

  // Form state for ML model
  const [form, setForm] = useState({
    grocery: 3000,
    distance: 10,
    waste: 2,
    tv: 3,
    internet: 5,
    clothes: 1,
    gender: 'male',
    body: 'overweight',
    diet: 'vegetarian',
    transport: 'public',
    vehicle: 'petrol',
  });

  // ML API prediction
  const predictEmission = async (): Promise<number> => {
    const payload = {
      Monthly_Grocery_Bill: form.grocery,
      Vehicle_Monthly_Distance_Km: form.distance,
      Waste_Bag_Weekly_Count: form.waste,
      How_Long_TV_PC_Daily_Hour: form.tv,
      How_Many_New_Clothes_Monthly: form.clothes,
      How_Long_Internet_Daily_Hour: form.internet,

      Body_Type_obese: form.body === 'obese' ? 1 : 0,
      Body_Type_overweight: form.body === 'overweight' ? 1 : 0,
      Body_Type_underweight: form.body === 'underweight' ? 1 : 0,

      Sex_male: form.gender === 'male' ? 1 : 0,

      Diet_pescatarian: form.diet === 'pescatarian' ? 1 : 0,
      Diet_vegan: form.diet === 'vegan' ? 1 : 0,
      Diet_vegetarian: form.diet === 'vegetarian' ? 1 : 0,

      Transport_public: form.transport === 'public' ? 1 : 0,
      Transport_walk_bicycle: form.transport === 'walk' ? 1 : 0,

      Vehicle_Type_electric: form.vehicle === 'electric' ? 1 : 0,
      Vehicle_Type_hybrid: form.vehicle === 'hybrid' ? 1 : 0,
      Vehicle_Type_lpg: form.vehicle === 'lpg' ? 1 : 0,
      Vehicle_Type_petrol: form.vehicle === 'petrol' ? 1 : 0,
    };

    const res = await fetch('https://carbon-ml-backend.onrender.com/predict', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    const rawText = await res.text();
    const match = rawText.match(/[-+]?[0-9]*\.?[0-9]+/);

    if (!match) throw new Error('Invalid ML response');

    return parseFloat(match[0]);
  };

  // Fetch today's entries
  const fetchTodayEntries = async () => {
    if (!user || isDemoMode) return;

    const today = new Date().toISOString().split('T')[0];

    const { data, error } = await supabase
      .from('carbon_entries')
      .select('id, entry_date, total_emissions')
      .eq('user_id', user.id)
      .eq('entry_date', today)
      .order('created_at', { ascending: false });

    if (!error) setTodayEntries(data || []);
  };

  useEffect(() => {
    fetchTodayEntries();
  }, [user, isDemoMode]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user && !isDemoMode) return;

    setLoading(true);
    try {
      const emission = await predictEmission();

      if (isDemoMode) {
        addDemoEntry({
          date: new Date(),
          travel: 0,
          electricity: 0,
          food: 0,
          total: emission, // Store in kg
          travelMode: form.transport,
          foodType: form.diet,
        });
        toast({
          title: '✅ Entry Saved',
          description: `Estimated Emission: ${emission.toFixed(2)} kg CO₂`,
        });
      } else if (user) {
        const { error } = await supabase.from('carbon_entries').insert({
          user_id: user.id,
          entry_date: format(new Date(), 'yyyy-MM-dd'),
          total_emissions: emission, // Store in kg directly
          travel_distance_km: form.distance,
          travel_mode: form.transport,
          food_type: form.diet,
        });

        if (error) throw error;

        // Check and award badges
        const newBadges = await checkAndAwardBadges(user.id);
        if (newBadges.length > 0) {
          const badgeNames = newBadges.map((id) => getBadgeById(id)?.name).filter(Boolean).join(', ');
          toast({
            title: '🎉 New Badge Earned!',
            description: badgeNames,
          });
        }

        toast({
          title: '✅ Entry Saved',
          description: `Estimated Emission: ${emission.toFixed(2)} kg CO₂`,
        });

        await fetchTodayEntries();
      }
    } catch (err: any) {
      toast({
        title: '❌ Error',
        description: err.message || 'Failed to calculate emissions',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="container mx-auto px-4 py-8 max-w-2xl">
        <div className="mb-8">
          <h1 className="font-display text-3xl font-bold mb-2">Carbon Footprint Entry</h1>
          <p className="text-muted-foreground">ML-powered carbon emission prediction</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Personal Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="w-5 h-5 text-primary" /> Personal Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Gender</Label>
                  <Select value={form.gender} onValueChange={(value) => setForm({ ...form, gender: value })}>
                    <SelectTrigger className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="male">Male</SelectItem>
                      <SelectItem value="female">Female</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Body Type</Label>
                  <Select value={form.body} onValueChange={(value) => setForm({ ...form, body: value })}>
                    <SelectTrigger className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {bodyTypes.map((type) => (
                        <SelectItem key={type.id} value={type.id}>{type.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Lifestyle */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ShoppingCart className="w-5 h-5 text-accent" /> Lifestyle
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="flex items-center gap-2">
                    <ShoppingCart className="w-4 h-4" /> Monthly Grocery Bill (₹)
                  </Label>
                  <Input
                    type="number"
                    value={form.grocery}
                    onChange={(e) => setForm({ ...form, grocery: +e.target.value })}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label className="flex items-center gap-2">
                    <Tv className="w-4 h-4" /> TV/PC Usage (hrs/day)
                  </Label>
                  <Input
                    type="number"
                    value={form.tv}
                    onChange={(e) => setForm({ ...form, tv: +e.target.value })}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label className="flex items-center gap-2">
                    <Wifi className="w-4 h-4" /> Internet Usage (hrs/day)
                  </Label>
                  <Input
                    type="number"
                    value={form.internet}
                    onChange={(e) => setForm({ ...form, internet: +e.target.value })}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label className="flex items-center gap-2">
                    <Shirt className="w-4 h-4" /> New Clothes (per month)
                  </Label>
                  <Input
                    type="number"
                    value={form.clothes}
                    onChange={(e) => setForm({ ...form, clothes: +e.target.value })}
                    className="mt-1"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Diet */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Utensils className="w-5 h-5 text-emerald" /> Diet
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                {dietTypes.map((diet) => (
                  <button
                    key={diet.id}
                    type="button"
                    onClick={() => setForm({ ...form, diet: diet.id })}
                    className={cn(
                      "p-4 rounded-xl border-2 transition-all text-center",
                      form.diet === diet.id
                        ? "border-primary bg-primary/10"
                        : "border-border hover:border-primary/50"
                    )}
                  >
                    <span className="text-2xl">{diet.emoji}</span>
                    <p className="text-sm mt-1">{diet.label}</p>
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Transport */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <Car className="w-5 h-5 text-primary" /> Transport
                </span>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowLocationPicker(!showLocationPicker)}
                  className="text-xs"
                >
                  <MapPin className="w-4 h-4 mr-1" />
                  {showLocationPicker ? 'Manual Entry' : 'Use Maps'}
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Transport Mode</Label>
                <div className="grid grid-cols-3 gap-2 mt-2">
                  {transportModes.map((mode) => {
                    const Icon = mode.icon;
                    return (
                      <button
                        key={mode.id}
                        type="button"
                        onClick={() => setForm({ ...form, transport: mode.id })}
                        className={cn(
                          "p-3 rounded-xl border-2 transition-all flex flex-col items-center gap-1",
                          form.transport === mode.id
                            ? "border-primary bg-primary/10"
                            : "border-border hover:border-primary/50"
                        )}
                      >
                        <Icon className="w-5 h-5" />
                        <span className="text-xs">{mode.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {!showLocationPicker ? (
                <div>
                  <Label>Monthly Distance (km): {form.distance}</Label>
                  <Input
                    type="range"
                    min="0"
                    max="1000"
                    value={form.distance}
                    onChange={(e) => setForm({ ...form, distance: Number(e.target.value) })}
                    className="mt-2"
                  />
                </div>
              ) : (
                <LocationPicker
                  travelMode={form.transport}
                  onDistanceCalculated={(distance) => setForm({ ...form, distance })}
                />
              )}

              {form.transport === 'private' && (
                <div>
                  <Label>Vehicle Type</Label>
                  <Select value={form.vehicle} onValueChange={(value) => setForm({ ...form, vehicle: value })}>
                    <SelectTrigger className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {vehicleTypes.map((type) => (
                        <SelectItem key={type.id} value={type.id}>{type.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Waste */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Trash2 className="w-5 h-5 text-muted-foreground" /> Waste
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Label>Waste Bags (per week): {form.waste}</Label>
              <Input
                type="range"
                min="0"
                max="10"
                value={form.waste}
                onChange={(e) => setForm({ ...form, waste: Number(e.target.value) })}
                className="mt-2"
              />
            </CardContent>
          </Card>

          {/* Submit Button */}
          <Button
            type="submit"
            variant="nature"
            size="xl"
            className="w-full"
            disabled={loading}
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 mr-2 animate-spin" /> Calculating...
              </>
            ) : (
              <>
                <Save className="w-5 h-5 mr-2" /> Calculate & Save
              </>
            )}
          </Button>
        </form>

        {/* Today's Entries */}
        {!isDemoMode && todayEntries.length > 0 && (
          <Card className="mt-8">
            <CardHeader>
              <CardTitle>📅 Today's Entries</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {todayEntries.map((entry, index) => (
                  <div
                    key={entry.id}
                    className="flex justify-between items-center p-3 rounded-lg bg-muted/50"
                  >
                    <span className="text-sm text-muted-foreground">
                      Entry {todayEntries.length - index}
                    </span>
                    <span className="font-semibold">
                      {(entry.total_emissions || 0).toFixed(2)} kg CO₂
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
}
