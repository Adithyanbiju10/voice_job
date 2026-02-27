import { Link } from 'react-router-dom';
import { ArrowRight, Accessibility, Mic, Search, Shield, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useVoice } from '@/contexts/VoiceContext';
import { useEffect } from 'react';

const features = [
  { icon: Accessibility, title: 'Fully Accessible', desc: 'Built for all abilities with WCAG compliance and adaptive features.', iconColor: 'text-primary', bgColor: 'bg-primary/10' },
  { icon: Mic, title: 'Voice Navigation', desc: 'Complete voice control for visually impaired users.', iconColor: 'text-accent-foreground', bgColor: 'bg-accent/10' },
  { icon: Search, title: 'Smart Job Matching', desc: 'Filter jobs by your specific accessibility needs.', iconColor: 'text-success', bgColor: 'bg-success/10' },
  { icon: Shield, title: 'Safe & Inclusive', desc: 'Every employer is vetted for inclusive workplace practices.', iconColor: 'text-primary', bgColor: 'bg-primary/10' },
];

const Index = () => {

  return (
    <main>
      {/* Hero */}
      <section className="relative overflow-hidden min-h-[90vh] flex items-center justify-center">
        {/* Animated background blobs */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary/20 rounded-full blur-[100px] opacity-60 pointer-events-none" />
        <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-accent/20 rounded-full blur-[80px] opacity-40 pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-success/20 rounded-full blur-[90px] opacity-30 pointer-events-none" />

        <div className="container relative z-10 flex flex-col items-center py-20 text-center animate-in fade-in duration-1000 slide-in-from-bottom-6">
          <span className="mb-6 inline-flex items-center gap-2 rounded-full bg-white/50 dark:bg-black/50 backdrop-blur-md px-5 py-2 text-sm font-semibold text-primary border border-primary/20 shadow-sm transition-all hover:shadow-md hover:scale-105">
            <Sparkles className="h-4 w-4" /> Jobs for Everyone
          </span>
          <h1 className="font-heading text-5xl font-extrabold tracking-tight sm:text-6xl md:text-7xl max-w-4xl leading-[1.1]">
            Find Your Dream Job,{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-accent">Without Barriers</span>
          </h1>
          <p className="mt-8 max-w-2xl text-xl text-muted-foreground leading-relaxed">
            The inclusive job platform designed for people of all abilities. Voice-enabled, accessible, and packed with opportunities from inclusive employers.
          </p>
          <div className="mt-10 flex flex-wrap gap-5 justify-center">
            <Button asChild size="lg" className="h-14 px-8 text-lg rounded-full shadow-lg shadow-primary/25 transition-transform hover:scale-105 hover:shadow-primary/40">
              <Link to="/jobs">
                Browse Jobs <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg" className="h-14 px-8 text-lg rounded-full backdrop-blur-sm bg-background/50 border-primary/20 hover:bg-primary/5 transition-transform hover:scale-105">
              <Link to="/about">Learn More</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="container py-16 md:py-24">
        <h2 className="font-heading text-3xl md:text-4xl font-bold text-center mb-14">Why AbilityJobs?</h2>
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {features.map(({ icon: Icon, title, desc, iconColor, bgColor }, i) => (
            <div
              key={title}
              className="group relative rounded-2xl border bg-card/50 backdrop-blur-sm p-8 text-center transition-all duration-300 hover:shadow-xl hover:shadow-primary/10 hover:-translate-y-2 overflow-hidden animate-in fade-in"
              style={{ animationDelay: `${i * 150}ms`, animationFillMode: 'both' }}
            >
              <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className={`mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl ${bgColor} transition-transform group-hover:scale-110 group-hover:rotate-3`}>
                <Icon className={`h-8 w-8 ${iconColor}`} />
              </div>
              <h3 className="font-heading text-xl font-bold mb-3">{title}</h3>
              <p className="text-base text-muted-foreground leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="relative py-24 overflow-hidden">
        <div className="absolute inset-0 bg-primary/5" />
        <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-primary/20 to-transparent" />
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/20 to-transparent" />

        <div className="container relative z-10 text-center">
          <h2 className="font-heading text-4xl font-bold mb-6">Ready to Start?</h2>
          <p className="text-lg text-muted-foreground mb-10 max-w-2xl mx-auto leading-relaxed">
            Browse hundreds of accessible job opportunities from employers who value inclusion and transparency.
          </p>
          <Button asChild size="lg" className="h-14 px-10 text-lg rounded-full shadow-xl shadow-primary/25 transition-transform hover:scale-105 hover:shadow-primary/40">
            <Link to="/jobs" className="group">
              View All Jobs <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-2 transition-transform" />
            </Link>
          </Button>
        </div>
      </section>
    </main>
  );
};

export default Index;
