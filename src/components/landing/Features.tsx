import { Card, CardContent } from '@/components/ui/card';
import { 
  BarChart3, 
  Brain, 
  Trophy, 
  Zap, 
  Leaf, 
  Target,
  TrendingUp,
  Bell
} from 'lucide-react';

const features = [
  {
    icon: BarChart3,
    title: 'Track Daily Emissions',
    description: 'Log your travel, electricity, and food choices to calculate your daily carbon footprint with scientific accuracy.',
    color: 'bg-primary/10 text-primary',
  },
  {
    icon: Brain,
    title: 'AI-Powered Insights',
    description: 'Get personalized recommendations from AI to help you make more sustainable choices every day.',
    color: 'bg-accent/10 text-accent',
  },
  {
    icon: TrendingUp,
    title: 'Visual Progress',
    description: 'Beautiful charts and graphs show your emission trends over time, celebrating your improvements.',
    color: 'bg-emerald-light/20 text-emerald',
  },
  {
    icon: Trophy,
    title: 'Compete & Compare',
    description: 'Join the leaderboard and compare your carbon footprint with others in your community.',
    color: 'bg-sky/10 text-sky',
  },
  {
    icon: Target,
    title: 'Personal Goals',
    description: 'Set weekly carbon targets and receive notifications to help you stay on track.',
    color: 'bg-coral/10 text-coral',
  },
  {
    icon: Zap,
    title: 'Earn Badges',
    description: 'Unlock achievement badges as you hit milestones and develop eco-friendly habits.',
    color: 'bg-amber/10 text-amber',
  },
];

export function Features() {
  return (
    <section className="py-24 bg-background">
      <div className="container mx-auto px-4">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-secondary mb-6">
            <Leaf className="w-4 h-4 text-primary" />
            <span className="text-sm font-medium">Features</span>
          </div>
          <h2 className="font-display text-4xl sm:text-5xl font-bold mb-4">
            Everything You Need to
            <span className="text-gradient block">Go Green</span>
          </h2>
          <p className="text-muted-foreground text-lg">
            Powerful tools to measure, track, and reduce your environmental impact.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <Card 
                key={feature.title} 
                variant="elevated"
                className="animate-slide-up"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <CardContent className="p-6">
                  <div className={`w-12 h-12 rounded-xl ${feature.color} flex items-center justify-center mb-4`}>
                    <Icon className="w-6 h-6" />
                  </div>
                  <h3 className="font-display text-lg font-semibold mb-2">{feature.title}</h3>
                  <p className="text-muted-foreground text-sm">{feature.description}</p>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </section>
  );
}
