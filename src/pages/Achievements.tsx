import { useState, useEffect } from 'react';
import { Navbar } from '@/components/layout/Navbar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useDemo } from '@/contexts/DemoContext';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { BADGES } from '@/lib/carbonCalculations';
import { Award, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function Achievements() {
  const { isDemoMode, demoBadges } = useDemo();
  const { user } = useAuth();
  const [earnedBadges, setEarnedBadges] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchBadges() {
      if (isDemoMode || !user) {
        setEarnedBadges(demoBadges);
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from('achievements')
        .select('badge_id')
        .eq('user_id', user.id);

      if (!error && data) {
        setEarnedBadges(data.map((b) => b.badge_id));
      }
      setLoading(false);
    }

    fetchBadges();
  }, [user, isDemoMode, demoBadges]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <main className="container mx-auto px-4 py-8 flex justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="container mx-auto px-4 py-8 max-w-2xl">
        <div className="mb-8">
          <h1 className="font-display text-3xl font-bold mb-2">Achievements</h1>
          <p className="text-muted-foreground">Collect badges as you build eco-friendly habits</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Award className="w-5 h-5 text-accent" /> Your Badges ({earnedBadges.length}/{BADGES.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {BADGES.map((badge) => {
                const earned = earnedBadges.includes(badge.id);
                return (
                  <div key={badge.id} className={cn("text-center p-4 rounded-xl border-2 transition-all", earned ? "border-primary bg-primary/5" : "border-border opacity-40 grayscale")}>
                    <span className="text-4xl">{badge.icon}</span>
                    <p className="font-semibold text-sm mt-2">{badge.name}</p>
                    <p className="text-xs text-muted-foreground mt-1">{badge.description}</p>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
