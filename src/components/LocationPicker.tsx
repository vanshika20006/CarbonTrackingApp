import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { MapPin, Navigation, Loader2, Route } from 'lucide-react';
import { cn } from '@/lib/utils';

interface LocationPickerProps {
  onDistanceCalculated: (distance: number) => void;
  travelMode: string;
}

export function LocationPicker({ onDistanceCalculated, travelMode }: LocationPickerProps) {
  const [origin, setOrigin] = useState('');
  const [destination, setDestination] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<{
    distance: { km: number; text: string };
    duration: { minutes: number; text: string };
    origin: string;
    destination: string;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);

  const calculateDistance = async () => {
    if (!origin.trim() || !destination.trim()) {
      setError('Please enter both origin and destination');
      return;
    }

    setIsLoading(true);
    setError(null);
    setResult(null);

    try {
      const { data, error: fnError } = await supabase.functions.invoke('calculate-distance', {
        body: { origin, destination, mode: travelMode },
      });

      if (fnError) throw fnError;
      if (!data.success) throw new Error(data.error);

      setResult(data);
      onDistanceCalculated(Math.round(data.distance.km));
    } catch (err: any) {
      setError(err.message || 'Failed to calculate distance');
    } finally {
      setIsLoading(false);
    }
  };

  const getCurrentLocation = () => {
    if (!navigator.geolocation) {
      setError('Geolocation is not supported by your browser');
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setOrigin(`${position.coords.latitude},${position.coords.longitude}`);
      },
      () => {
        setError('Unable to get your location');
      }
    );
  };

  return (
    <Card variant="glass" className="mt-4">
      <CardContent className="p-4 space-y-4">
        <div className="flex items-center gap-2 text-sm font-medium text-primary">
          <Route className="w-4 h-4" />
          <span>Calculate Distance via Maps</span>
        </div>

        <div className="space-y-3">
          <div>
            <Label className="text-xs text-muted-foreground">From</Label>
            <div className="flex gap-2 mt-1">
              <Input
                placeholder="Enter starting location..."
                value={origin}
                onChange={(e) => setOrigin(e.target.value)}
                className="flex-1"
              />
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={getCurrentLocation}
                title="Use current location"
              >
                <Navigation className="w-4 h-4" />
              </Button>
            </div>
          </div>

          <div>
            <Label className="text-xs text-muted-foreground">To</Label>
            <div className="flex gap-2 mt-1">
              <Input
                placeholder="Enter destination..."
                value={destination}
                onChange={(e) => setDestination(e.target.value)}
                className="flex-1"
              />
              <div className="w-10" /> {/* Spacer for alignment */}
            </div>
          </div>
        </div>

        <Button
          type="button"
          onClick={calculateDistance}
          disabled={isLoading || !origin || !destination}
          className="w-full"
          variant="secondary"
        >
          {isLoading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Calculating...
            </>
          ) : (
            <>
              <MapPin className="w-4 h-4" />
              Calculate Distance
            </>
          )}
        </Button>

        {error && (
          <p className="text-sm text-destructive text-center">{error}</p>
        )}

        {result && (
          <div className="p-3 rounded-lg bg-primary/10 space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Distance</span>
              <span className="font-semibold text-primary">{result.distance.text}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Duration</span>
              <span className="font-medium">{result.duration.text}</span>
            </div>
            <div className="text-xs text-muted-foreground pt-2 border-t border-border/50">
              <p className="truncate">{result.origin}</p>
              <p className="truncate">→ {result.destination}</p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
