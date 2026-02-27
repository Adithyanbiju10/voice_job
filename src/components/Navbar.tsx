import { Link, useLocation } from 'react-router-dom';
import { Briefcase, Home, Info, Mic, MicOff, Moon, Sun, Menu, X } from 'lucide-react';
import { useVoice } from '@/contexts/VoiceContext';
import { useTheme } from '@/contexts/ThemeContext';
import { useAuth } from '@/contexts/AuthContext';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { User } from 'lucide-react';

const navLinks = [
  { to: '/', label: 'Home', icon: Home },
  { to: '/jobs', label: 'Jobs', icon: Briefcase },
  { to: '/about', label: 'About', icon: Info },
];

const Navbar = () => {
  const location = useLocation();
  const { isVoiceMode, setIsVoiceMode, speak, isListening, isSpeaking } = useVoice();
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleVoiceToggle = async () => {
    const next = !isVoiceMode;
    setIsVoiceMode(next);
    if (next) {
      await speak('Voice mode activated');
    }
  };

  return (
    <nav className="sticky top-0 z-50 border-b border-border/40 bg-background/60 backdrop-blur-xl supports-[backdrop-filter]:bg-background/60" role="navigation" aria-label="Main navigation">
      <div className="container flex h-16 items-center justify-between">
        <Link to="/" className="flex items-center gap-2 font-heading text-xl font-bold text-primary" aria-label="AbilityJobs Home">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <Briefcase className="h-4 w-4" />
          </div>
          <span>AbilityJobs</span>
        </Link>

        {/* Desktop nav */}
        <div className="hidden md:flex items-center gap-1">
          {navLinks.map(({ to, label, icon: Icon }) => (
            <Link
              key={to}
              to={to}
              className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors
                ${location.pathname === to
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:bg-secondary hover:text-foreground'
                }`}
              aria-current={location.pathname === to ? 'page' : undefined}
            >
              <Icon className="h-4 w-4" />
              {label}
            </Link>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={handleVoiceToggle}
            aria-label={isVoiceMode ? 'Disable voice mode' : 'Enable voice mode'}
            className={isVoiceMode ? 'text-primary voice-pulse' : 'text-muted-foreground'}
          >
            {isVoiceMode ? <Mic className="h-5 w-5" /> : <MicOff className="h-5 w-5" />}
          </Button>

          <Button variant="ghost" size="icon" onClick={toggleTheme} aria-label="Toggle dark mode">
            {theme === 'dark' ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
          </Button>

          {user ? (
            <Button asChild variant="ghost" size="icon" className="hidden sm:inline-flex rounded-full border border-border/50 bg-background/50 hover:bg-secondary">
              <Link to="/profile" aria-label="My Profile">
                <User className="h-5 w-5 text-primary" />
              </Link>
            </Button>
          ) : (
            <Button asChild variant="default" className="hidden sm:flex rounded-full px-6 shadow-md shadow-primary/20 hover:shadow-primary/40 transition-all hover:-translate-y-0.5">
              <Link to="/auth">Sign In</Link>
            </Button>
          )}

          <Button variant="ghost" size="icon" className="md:hidden" onClick={() => setMobileOpen(!mobileOpen)} aria-label="Menu">
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="border-t bg-card p-4 md:hidden">
          {navLinks.map(({ to, label, icon: Icon }) => (
            <Link
              key={to}
              to={to}
              onClick={() => setMobileOpen(false)}
              className={`flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium transition-colors
                ${location.pathname === to
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:bg-secondary'
                }`}
            >
              <Icon className="h-5 w-5" />
              {label}
            </Link>
          ))}
          <div className="pt-2 mt-2 border-t border-border">
            {user ? (
              <div className="flex flex-col gap-2">
                <div className="px-4 py-2 mb-1 bg-secondary/30 rounded-lg">
                  <p className="font-medium text-sm text-foreground">{user.name}</p>
                  <p className="text-xs text-muted-foreground">{user.email}</p>
                </div>
                <Button asChild variant="outline" className="w-full rounded-lg justify-start">
                  <Link to="/profile" onClick={() => setMobileOpen(false)}>
                    <User className="mr-2 h-4 w-4" /> My Profile
                  </Link>
                </Button>
                <Button variant="ghost" className="w-full rounded-lg justify-start text-destructive hover:text-destructive hover:bg-destructive/10" onClick={() => { logout(); setMobileOpen(false); }}>
                  Sign Out
                </Button>
              </div>
            ) : (
              <Button asChild className="w-full rounded-lg shadow-md">
                <Link to="/auth" onClick={() => setMobileOpen(false)}>Sign In / Register</Link>
              </Button>
            )}
          </div>
        </div>
      )}

      {(isListening || isSpeaking) && (
        <div className="absolute left-1/2 -translate-x-1/2 top-full mt-2 rounded-full bg-primary px-4 py-1 text-xs text-primary-foreground font-medium shadow-lg">
          {isListening ? '🎤 Listening...' : '🔊 Speaking...'}
        </div>
      )}
    </nav>
  );
};

export default Navbar;
