import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowRight, Leaf } from 'lucide-react';

export function CTA() {
  const navigate = useNavigate();

  return (
    <section className="py-24 relative overflow-hidden">
      <div className="absolute inset-0 gradient-nature opacity-90" />
      
      <div className="container mx-auto px-4 relative z-10">
        <div className="max-w-3xl mx-auto text-center text-primary-foreground">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-white/20 backdrop-blur mb-8">
            <Leaf className="w-8 h-8" />
          </div>
          
          <h2 className="font-display text-4xl sm:text-5xl font-bold mb-6">
            Start Your Green Journey Today
          </h2>
          
          <p className="text-lg opacity-90 mb-10 max-w-xl mx-auto">
            Join thousands of conscious individuals making a real difference. 
            Every small action counts towards a sustainable future.
          </p>
          
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button 
              size="lg"
              className="bg-white text-primary hover:bg-white/90 shadow-lg"
              onClick={() => navigate('/auth')}
            >
              Create Free Account
              <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
