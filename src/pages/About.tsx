import { Accessibility, Star, Users, Globe, Sparkles } from 'lucide-react';
import { useVoice } from '@/contexts/VoiceContext';
import { useEffect } from 'react';

const stats = [
  { label: 'Jobs Posted', value: '500+' },
  { label: 'Inclusive Employers', value: '120+' },
  { label: 'Successful Placements', value: '1,200+' },
  { label: 'Accessibility Features', value: '50+' },
];

const values = [
  { icon: Accessibility, title: 'Accessibility First', desc: 'Every feature is designed with accessibility as the primary concern, not an afterthought.', iconColor: 'text-primary', bg: 'bg-primary/10' },
  { icon: Star, title: 'Inclusive by Design', desc: 'We work only with employers committed to creating truly inclusive workplaces.', iconColor: 'text-destructive', bg: 'bg-destructive/10' },
  { icon: Users, title: 'Community Driven', desc: 'Built by and for people with disabilities, with continuous community feedback.', iconColor: 'text-success', bg: 'bg-success/10' },
  { icon: Globe, title: 'Equal Opportunity', desc: 'We believe everyone deserves equal access to meaningful employment.', iconColor: 'text-accent-foreground', bg: 'bg-accent/10' },
];

const About = () => {
  const { isVoiceMode, speak, skipGlobalNextRef } = useVoice();

  useEffect(() => {
    if (isVoiceMode) {
      if (skipGlobalNextRef) skipGlobalNextRef.current = true;
      speak('About Ability Jobs. We are an inclusive job platform. You can explore learning resources and message employers, or browse open jobs. Say "home" to go back.');
    }
  }, [isVoiceMode, skipGlobalNextRef]);

  return (
    <main>
      <section className="container py-16 md:py-24 text-center max-w-3xl mx-auto">
        <h1 className="font-heading text-4xl font-bold mb-4">About AbilityJobs</h1>
        <p className="text-lg text-muted-foreground leading-relaxed">
          We're on a mission to make employment accessible to everyone. AbilityJobs connects talented individuals with disabilities
          to inclusive employers who value diverse abilities and perspectives.
        </p>
      </section>

      <section className="bg-primary/5 py-16">
        <div className="container grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
          {stats.map(({ label, value }) => (
            <div key={label}>
              <p className="font-heading text-3xl font-bold text-primary">{value}</p>
              <p className="text-sm text-muted-foreground mt-1">{label}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="container py-16 md:py-24">
        <h2 className="font-heading text-2xl font-bold text-center mb-12">Our Values</h2>
        <div className="grid gap-6 sm:grid-cols-2">
          {values.map(({ icon: Icon, title, desc, iconColor, bg }) => (
            <div key={title} className="rounded-xl border bg-card p-6 flex gap-4 transition-all hover:shadow-lg hover:shadow-primary/5">
              <div className={`flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-lg ${bg}`}>
                <Icon className={`h-6 w-6 ${iconColor}`} />
              </div>
              <div>
                <h3 className="font-heading font-semibold mb-1">{title}</h3>
                <p className="text-sm text-muted-foreground">{desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
};

export default About;
