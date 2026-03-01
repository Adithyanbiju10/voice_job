import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useNavigate } from "react-router-dom";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { VoiceProvider, useVoice } from "@/contexts/VoiceContext";
import { AuthProvider } from "@/contexts/AuthContext";
import { useEffect } from 'react';
import Navbar from "@/components/Navbar";
import VoiceOverlay from "@/components/VoiceOverlay";
import Index from "./pages/Index";
import Jobs from "./pages/Jobs";
import JobDetail from "./pages/JobDetail";
import About from "./pages/About";
import Auth from "./pages/Auth";
import Profile from "./pages/Profile";
import NotFound from "./pages/NotFound";
import annyang from 'annyang';

const GlobalVoiceController = () => {
  const navigate = useNavigate();
  const { isVoiceMode, speak, readPageContent } = useVoice();

  useEffect(() => {
    const annyangLib = annyang as any;
    if (isVoiceMode && annyangLib) {
      // Define the voice navigation commands
      const commands = {
        'go back': () => { speak('Going back'); navigate(-1); },
        'go to home': () => { speak('Navigating home'); navigate('/'); },
        'go home': () => { speak('Navigating home'); navigate('/'); },
        'jobs': () => { speak('Navigating to jobs'); navigate('/jobs'); },
        'go to jobs': () => { speak('Navigating to jobs'); navigate('/jobs'); },
        'search for jobs': () => { speak('Navigating to jobs'); navigate('/jobs'); },
        'about': () => { speak('Navigating to about page'); navigate('/about'); },
        'go to profile': () => { speak('Navigating to profile'); navigate('/profile'); },
        'go to login': () => { speak('Navigating to authentication page'); navigate('/auth'); },
        'sign in': () => { speak('Navigating to sign in'); navigate('/auth'); },
        'log in': () => { speak('Navigating to sign in'); navigate('/auth'); },
        'sign up': () => { speak('Navigating to sign up'); navigate('/auth'); },
        'register': () => { speak('Navigating to sign up'); navigate('/auth'); },
        'create account': () => { speak('Navigating to sign up'); navigate('/auth'); },
        'read this page': () => { readPageContent(); },
        'read page': () => { readPageContent(); },
        'stop speaking': () => { window.speechSynthesis.cancel(); }
      };

      // Add commands to annyang
      annyangLib.addCommands(commands);

      return () => {
        if (annyangLib) {
          annyangLib.removeCommands(Object.keys(commands));
        }
      };
    }
  }, [isVoiceMode, navigate, speak, readPageContent]);

  return (
    <>
      <VoiceOverlay />
      <Navbar />
      <Routes>
        <Route path="/" element={<Index />} />
        <Route path="/jobs" element={<Jobs />} />
        <Route path="/jobs/:id" element={<JobDetail />} />
        <Route path="/about" element={<About />} />
        <Route path="/auth" element={<Auth />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </>
  );
};

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <AuthProvider>
            <VoiceProvider>
              <GlobalVoiceController />
            </VoiceProvider>
          </AuthProvider>
        </BrowserRouter>
      </TooltipProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
