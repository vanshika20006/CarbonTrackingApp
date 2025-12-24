import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Lightbulb, Car, Zap, Utensils, Leaf, TrendingUp, TrendingDown } from 'lucide-react';

interface CarbonData {
  todayTotal: number;
  weeklyTotal: number;
  travelEmissions: number;
  electricityEmissions: number;
  foodEmissions: number;
  travelMode?: string | null;
  foodType?: string | null;
  entriesCount: number;
}

interface EcoTip {
  icon: React.ReactNode;
  title: string;
  description: string;
  priority: 'high' | 'medium' | 'low';
}

interface EcoTipsProps {
  carbonData: CarbonData;
}

export function EcoTips({ carbonData }: EcoTipsProps) {
  const tips = useMemo(() => {
    const generatedTips: EcoTip[] = [];
    const { todayTotal, weeklyTotal, travelEmissions, electricityEmissions, foodEmissions, entriesCount } = carbonData;

    // No data tips
    if (entriesCount === 0) {
      generatedTips.push({
        icon: <Leaf className="w-5 h-5 text-primary" />,
        title: "Start Tracking Today!",
        description: "Log your first carbon entry to get personalized eco-tips based on your lifestyle.",
        priority: 'high'
      });
      return generatedTips;
    }

    // Calculate percentages
    const totalEmissions = travelEmissions + electricityEmissions + foodEmissions;
    const travelPercent = totalEmissions > 0 ? (travelEmissions / totalEmissions) * 100 : 0;
    const electricityPercent = totalEmissions > 0 ? (electricityEmissions / totalEmissions) * 100 : 0;
    const foodPercent = totalEmissions > 0 ? (foodEmissions / totalEmissions) * 100 : 0;

    // High travel emissions tips
    if (travelPercent > 50) {
      generatedTips.push({
        icon: <Car className="w-5 h-5 text-amber-500" />,
        title: "Reduce Travel Emissions",
        description: "Travel makes up most of your footprint. Try carpooling, public transport, or cycling for short trips.",
        priority: 'high'
      });
    } else if (travelPercent > 30) {
      generatedTips.push({
        icon: <Car className="w-5 h-5 text-emerald" />,
        title: "Optimize Your Commute",
        description: "Consider remote work days or combine errands to reduce travel frequency.",
        priority: 'medium'
      });
    }

    // High electricity emissions tips
    if (electricityPercent > 40) {
      generatedTips.push({
        icon: <Zap className="w-5 h-5 text-amber-500" />,
        title: "Cut Energy Use",
        description: "Switch to LED bulbs, unplug devices when not in use, and consider energy-efficient appliances.",
        priority: 'high'
      });
    } else if (electricityPercent > 20) {
      generatedTips.push({
        icon: <Zap className="w-5 h-5 text-sky" />,
        title: "Smart Energy Habits",
        description: "Use natural light during the day and set thermostats efficiently to save energy.",
        priority: 'medium'
      });
    }

    // Food emissions tips
    if (foodPercent > 40) {
      generatedTips.push({
        icon: <Utensils className="w-5 h-5 text-amber-500" />,
        title: "Mindful Eating",
        description: "Consider more plant-based meals. Even one meat-free day per week makes a difference!",
        priority: 'high'
      });
    } else if (foodPercent > 20) {
      generatedTips.push({
        icon: <Utensils className="w-5 h-5 text-primary" />,
        title: "Sustainable Food Choices",
        description: "Buy local and seasonal produce to reduce food transportation emissions.",
        priority: 'medium'
      });
    }

    // Weekly total based tips
    const avgDailyEmissions = weeklyTotal / 7;
    if (avgDailyEmissions > 15000) { // More than 15kg/day
      generatedTips.push({
        icon: <TrendingUp className="w-5 h-5 text-red-500" />,
        title: "High Carbon Footprint",
        description: "Your emissions are above average. Focus on your biggest category first for maximum impact.",
        priority: 'high'
      });
    } else if (avgDailyEmissions < 5000 && entriesCount > 3) { // Less than 5kg/day
      generatedTips.push({
        icon: <TrendingDown className="w-5 h-5 text-primary" />,
        title: "Great Progress!",
        description: "You're doing well! Keep up the sustainable habits and inspire others.",
        priority: 'low'
      });
    }

    // General tips if no specific issues
    if (generatedTips.length < 2) {
      generatedTips.push({
        icon: <Lightbulb className="w-5 h-5 text-amber-500" />,
        title: "Daily Tip",
        description: "Carry a reusable water bottle and shopping bags to reduce single-use plastic waste.",
        priority: 'low'
      });
    }

    // Sort by priority
    return generatedTips.sort((a, b) => {
      const priorityOrder = { high: 0, medium: 1, low: 2 };
      return priorityOrder[a.priority] - priorityOrder[b.priority];
    }).slice(0, 3);
  }, [carbonData]);

  const priorityColors = {
    high: 'border-l-amber-500',
    medium: 'border-l-primary',
    low: 'border-l-muted-foreground'
  };

  return (
    <Card className="glass">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2">
          <Lightbulb className="w-5 h-5 text-amber-500" />
          Personalized Eco-Tips
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {tips.map((tip, index) => (
          <div
            key={index}
            className={`p-3 rounded-lg bg-muted/50 border-l-4 ${priorityColors[tip.priority]} transition-all hover:bg-muted/70`}
          >
            <div className="flex items-start gap-3">
              <div className="mt-0.5">{tip.icon}</div>
              <div>
                <h4 className="font-medium text-sm">{tip.title}</h4>
                <p className="text-sm text-muted-foreground mt-0.5">{tip.description}</p>
              </div>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
