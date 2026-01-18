import { useMemo, useEffect, useState, useCallback } from 'react';
import { Navbar } from '@/components/layout/Navbar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useDemo } from '@/contexts/DemoContext';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { formatEmissions } from '@/lib/carbonCalculations';
import { Chart } from "react-google-charts";
import {
  TrendingDown,
  Leaf,
  Loader2,
  Calendar,
  Target,
  Activity,
} from 'lucide-react';
import { format, subDays } from 'date-fns';
import { EcoTips } from '@/components/EcoTips';

interface CarbonEntry {
  id: string;
  entry_date: string;
  total_emissions: number | null; // kg
  travel_mode: string | null;
  food_type: string | null;
  travel_distance_km: number | null;
  created_at: string;
}

export default function Dashboard() {
  const { isDemoMode, demoEntries } = useDemo();
  const { user } = useAuth();

  const [entries, setEntries] = useState<CarbonEntry[]>([]);
  const [loading, setLoading] = useState(true);

  // ===============================
  // Fetch entries
  // ===============================
  const fetchEntries = useCallback(async () => {
    if (!user || isDemoMode) {
      setLoading(false);
      return;
    }

    try {
      const weekAgo = format(subDays(new Date(), 6), 'yyyy-MM-dd');

      const { data, error } = await supabase
        .from('carbon_entries')
        .select('*')
        .eq('user_id', user.id)
        .gte('entry_date', weekAgo)
        .order('entry_date', { ascending: true });

      if (error) throw error;
      setEntries(data || []);
    } catch (err) {
      console.error('Error fetching entries:', err);
    } finally {
      setLoading(false);
    }
  }, [user, isDemoMode]);

  useEffect(() => {
    fetchEntries();
  }, [fetchEntries]);

  // ===============================
  // Realtime updates
  // ===============================
  useEffect(() => {
    if (!user || isDemoMode) return;

    const channel = supabase
      .channel('carbon_entries_realtime')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'carbon_entries',
          filter: `user_id=eq.${user.id}`,
        },
        fetchEntries
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, isDemoMode, fetchEntries]);

  // ===============================
  // Stats calculation (ALL IN KG)
  // ===============================
  const stats = useMemo(() => {
    // ---------- DEMO MODE ----------
    if (isDemoMode && demoEntries.length > 0) {
      const todayEntry = demoEntries[demoEntries.length - 1];
      const weeklyTotal = demoEntries.reduce((sum, e) => sum + e.total, 0);

      // Google Charts Data - Line Chart (Weekly Trend)
      const lineChartData = [['Day', 'Emissions']];
      demoEntries.forEach(entry => {
        lineChartData.push([
          entry.date.toLocaleDateString('en-US', { weekday: 'short' }),
          entry.total
        ]);
      });

      // Google Charts Data - Bar Chart (Daily Emissions)
      // Reusing same data format as both map day to emission
      const barChartData = [['Day', 'Emissions']];
      demoEntries.forEach(entry => {
        barChartData.push([
          entry.date.toLocaleDateString('en-US', { weekday: 'short' }),
          entry.total
        ]);
      });


      return {
        todayTotal: todayEntry?.total || 0,
        weeklyTotal,
        entriesCount: demoEntries.length,
        todayEntriesCount: 1,
        avgEmission: weeklyTotal / demoEntries.length,
        lineChartData,
        barChartData
      };
    }

    // ---------- REAL DATA ----------
    const today = format(new Date(), 'yyyy-MM-dd');

    const todayEntries = entries.filter(e => e.entry_date === today);
    const todayTotal = todayEntries.reduce(
      (sum, e) => sum + (e.total_emissions || 0),
      0
    );

    const weeklyTotal = entries.reduce(
      (sum, e) => sum + (e.total_emissions || 0),
      0
    );

    // Group by date
    const entriesByDate: Record<string, number> = {};
    entries.forEach(e => {
      entriesByDate[e.entry_date] =
        (entriesByDate[e.entry_date] || 0) + (e.total_emissions || 0);
    });

    // Last 7 days chart
    const lineChartData = [['Day', 'Emissions']];
    const barChartData = [['Day', 'Emissions']];

    for (let i = 6; i >= 0; i--) {
      const dateKey = format(subDays(new Date(), i), 'yyyy-MM-dd');
      const dayLabel = format(subDays(new Date(), i), 'EEE');
      const val = entriesByDate[dateKey] || 0;

      lineChartData.push([dayLabel, val]);
      barChartData.push([dayLabel, val]);
    }

    const avgEmission =
      entries.length > 0 ? weeklyTotal / entries.length : 0;

    return {
      todayTotal,
      weeklyTotal,
      entriesCount: entries.length,
      todayEntriesCount: todayEntries.length,
      avgEmission,
      lineChartData,
      barChartData
    };
  }, [isDemoMode, demoEntries, entries]);

  const {
    todayTotal,
    weeklyTotal,
    entriesCount,
    avgEmission,
    lineChartData,
    barChartData
  } = stats;

  // Chart Configs
  const lineChartOptions = {
    title: 'Weekly Carbon Emission Trend',
    curveType: 'function',
    legend: { position: 'bottom' },
    backgroundColor: 'transparent',
    colors: ['#10b981'], // Emerald 500
    hAxis: { title: 'Day', textStyle: { color: '#666' } },
    vAxis: { title: 'kg CO₂', textStyle: { color: '#666' } },
    chartArea: { width: '80%', height: '70%' },
  };

  const barChartOptions = {
    title: 'Daily CO₂ Emissions',
    legend: { position: 'none' },
    backgroundColor: 'transparent',
    colors: ['#10b981'],
    hAxis: { title: 'Day', textStyle: { color: '#666' } },
    vAxis: { title: 'kg CO₂', textStyle: { color: '#666' } },
    chartArea: { width: '80%', height: '70%' },
  };


  // ===============================
  // Loading
  // ===============================
  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <main className="container mx-auto px-4 py-8 flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </main>
      </div>
    );
  }

  // ===============================
  // UI
  // ===============================
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="font-display text-3xl font-bold mb-2">Dashboard</h1>
          <p className="text-muted-foreground">
            Your carbon footprint overview
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <StatCard
            title="Today"
            value={formatEmissions(todayTotal)}
            icon={<Leaf className="w-5 h-5 text-primary" />}
          />
          <StatCard
            title="This Week"
            value={formatEmissions(weeklyTotal)}
            icon={<TrendingDown className="w-5 h-5 text-accent" />}
          />
          <StatCard
            title="Avg / Entry"
            value={formatEmissions(avgEmission)}
            icon={<Target className="w-5 h-5 text-emerald" />}
          />
          <StatCard
            title="Entries"
            value={entriesCount.toString()}
            icon={<Activity className="w-5 h-5 text-sky" />}
          />
        </div>

        {/* Charts */}
        <div className="grid lg:grid-cols-2 gap-6">
          <ChartCard title="Weekly Trend (kg CO₂)">
            {/* GOOGLE CHART: LINE */}
            {lineChartData.length > 1 ? (
              <Chart
                chartType="LineChart"
                width="100%"
                height="100%"
                data={lineChartData}
                options={lineChartOptions}
              />
            ) : (
              <EmptyChart icon={<Leaf />} text="No entries yet" />
            )}
          </ChartCard>

          <ChartCard title="Daily Emissions (kg CO₂)">
            {/* GOOGLE CHART: BAR */}
            {barChartData.length > 1 ? (
              <Chart
                chartType="ColumnChart"
                width="100%"
                height="100%"
                data={barChartData}
                options={barChartOptions}
              />
            ) : (
              <EmptyChart icon={<Calendar />} text="No data this week" />
            )}
          </ChartCard>
        </div>

        {/* Eco Tips */}
        <div className="mt-6">
          <EcoTips
            carbonData={{
              todayTotal,
              weeklyTotal,
              travelEmissions: 0,
              electricityEmissions: 0,
              foodEmissions: 0,
              entriesCount,
            }}
          />
        </div>
      </main>
    </div>
  );
}


// ===============================
// Small components
// ===============================

function StatCard({
  title,
  value,
  icon,
}: {
  title: string;
  value: string;
  icon: React.ReactNode;
}) {
  return (
    <Card className="glass">
      <CardContent className="p-4 flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
          {icon}
        </div>
        <div>
          <p className="text-sm text-muted-foreground">{title}</p>
          <p className="font-display text-xl font-bold">{value}</p>
        </div>
      </CardContent>
    </Card>
  );
}

function ChartCard({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-64">{children}</div>
      </CardContent>
    </Card>
  );
}

function EmptyChart({
  icon,
  text,
}: {
  icon: React.ReactNode;
  text: string;
}) {
  return (
    <div className="h-full flex items-center justify-center text-muted-foreground">
      <div className="text-center">
        <div className="w-12 h-12 mx-auto mb-2 opacity-30">{icon}</div>
        <p>{text}</p>
      </div>
    </div>
  );
}
