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
import VisualCommandCenter from "@/components/VisualCommandCenter";
import Index from "./pages/Index";
import Jobs from "./pages/Jobs";
import JobDetail from "./pages/JobDetail";
import About from "./pages/About";
import Auth from "./pages/Auth";
import Profile from "./pages/Profile";
import Admin from "./pages/Admin";
import NotFound from "./pages/NotFound";
import LoginNotifier from "@/components/LoginNotifier";

const GlobalVoiceController = () => {
  return (
    <>
      <LoginNotifier />
      <VoiceOverlay />
      <VisualCommandCenter />
      <Navbar />
      <Routes>
        <Route path="/" element={<Index />} />
        <Route path="/jobs" element={<Jobs />} />
        <Route path="/jobs/:id" element={<JobDetail />} />
        <Route path="/about" element={<About />} />
        <Route path="/auth" element={<Auth />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/admin" element={<Admin />} />
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
