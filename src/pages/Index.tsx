import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Hero } from '@/components/landing/Hero';
import { Features } from '@/components/landing/Features';
import { CTA } from '@/components/landing/CTA';
import { Footer } from '@/components/landing/Footer';
import { useAuth } from '@/contexts/AuthContext';
import { useDemo } from '@/contexts/DemoContext';

const Index = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { isDemoMode } = useDemo();

  useEffect(() => {
    if (user || isDemoMode) {
      navigate('/dashboard');
    }
  }, [user, isDemoMode, navigate]);

  return (
    <div className="min-h-screen">
      <Hero />
      <Features />
      <CTA />
      <Footer />
    </div>
  );
};

export default Index;
