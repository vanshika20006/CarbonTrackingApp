import { useEffect, useState } from 'react';
import { Navbar } from '@/components/layout/Navbar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { formatEmissions } from '@/lib/carbonCalculations';
import { Trophy, Medal, Award, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface LeaderboardEntry {
  user_id: string;
  full_name: string;
  avatar_url: string | null;
  weekly_emissions: number;
  entries_count: number;
}

export default function Leaderboard() {
  const { user } = useAuth();
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchLeaderboard() {
      try {
        const { data, error } = await supabase.rpc('get_weekly_leaderboard');
        
        if (error) throw error;
        setLeaderboard(data || []);
      } catch (err) {
        console.error('Error fetching leaderboard:', err);
      } finally {
        setIsLoading(false);
      }
    }

    fetchLeaderboard();
  }, []);

  const getRankIcon = (rank: number) => {
    if (rank === 1) return <Trophy className="w-6 h-6 text-amber" />;
    if (rank === 2) return <Medal className="w-6 h-6 text-gray-400" />;
    if (rank === 3) return <Award className="w-6 h-6 text-amber-light" />;
    return <span className="w-6 h-6 flex items-center justify-center font-bold text-muted-foreground">{rank}</span>;
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="container mx-auto px-4 py-8 max-w-2xl">
        <div className="mb-8">
          <h1 className="font-display text-3xl font-bold mb-2">Leaderboard</h1>
          <p className="text-muted-foreground">Weekly lowest carbon footprint rankings</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Trophy className="w-5 h-5 text-amber" /> This Week's Top Performers
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-primary" />
              </div>
            ) : leaderboard.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No entries this week yet. Be the first to log your carbon footprint!
              </div>
            ) : (
              leaderboard.map((entry, index) => {
                const rank = index + 1;
                const isCurrentUser = user?.id === entry.user_id;
                
                return (
                  <div 
                    key={entry.user_id} 
                    className={`flex items-center gap-4 p-4 rounded-xl transition-all ${
                      rank <= 3 ? 'bg-primary/5 border border-primary/10' : 'bg-muted/30'
                    } ${isCurrentUser ? 'ring-2 ring-primary' : ''}`}
                  >
                    {getRankIcon(rank)}
                    <div className="flex-1">
                      <p className="font-semibold">
                        {entry.full_name || 'Anonymous'} 
                        {isCurrentUser && <span className="text-primary ml-2">(You)</span>}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {entry.entries_count} {entry.entries_count === 1 ? 'entry' : 'entries'} this week
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-display font-bold text-primary">
                        {formatEmissions(Number(entry.weekly_emissions))}
                      </p>
                      <p className="text-xs text-muted-foreground">CO₂/week</p>
                    </div>
                  </div>
                );
              })
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
