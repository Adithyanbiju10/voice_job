import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Upload, Loader2, CheckCircle, User, Mail, FileText, ArrowRight, ArrowLeft, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import confetti from 'canvas-confetti';
import { useVoice } from '@/contexts/VoiceContext';

interface ApplyDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  jobId: string;
  jobTitle: string;
}

const ApplyDialog = ({ open, onOpenChange, jobId, jobTitle }: ApplyDialogProps) => {
  const { toast } = useToast();
  const { speak, isVoiceMode } = useVoice();
  const [step, setStep] = useState(1);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [coverLetter, setCoverLetter] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (open && isVoiceMode && !success) {
      speak(`Applying for ${jobTitle}. Let's start with your contact information.`);
    }
  }, [open]);

  const handleSubmit = async () => {
    if (!name || !email) {
      toast({ title: 'Please fill in all required fields', variant: 'destructive' });
      return;
    }
    setLoading(true);
    try {
      let resumeUrl: string | null = null;

      if (file) {
        try {
          const ext = file.name.split('.').pop();
          const path = `${crypto.randomUUID()}.${ext}`;
          const { error: uploadError } = await supabase.storage.from('resumes').upload(path, file);
          if (uploadError) throw new Error(`Resume upload failed: ${uploadError.message}`);

          const { data: urlData } = supabase.storage.from('resumes').getPublicUrl(path);
          resumeUrl = urlData.publicUrl;
        } catch (storageErr: any) {
          console.error('Storage error:', storageErr);
          toast({
            title: 'Resume upload failed',
            description: 'Please ensure you are connected to the internet. You can also try applying without a resume.',
            variant: 'destructive'
          });
          setLoading(false);
          return;
        }
      }

      if (jobId.startsWith('mock-')) {
        // Simulate database delay for mock jobs
        await new Promise(resolve => setTimeout(resolve, 1000));
      } else {
        const { error } = await supabase.from('applications').insert({
          job_id: jobId,
          applicant_name: name,
          applicant_email: email,
          cover_letter: coverLetter || null,
          resume_url: resumeUrl,
        });

        if (error) throw error;
      }

      // Save application to localStorage for Profile visibility
      const applicationData = {
        id: crypto.randomUUID(),
        jobId,
        jobTitle,
        applicantName: name,
        appliedAt: new Date().toISOString(),
        status: 'Pending'
      };

      const existingApps = JSON.parse(localStorage.getItem('user_applications') || '[]');
      localStorage.setItem('user_applications', JSON.stringify([applicationData, ...existingApps]));

      setSuccess(true);
      speak('Your application has been submitted successfully! Congratulations.');

      confetti({
        particleCount: 150,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#8B5CF6', '#D946EF', '#0EA5E9']
      });

      toast({ title: 'Application submitted!', description: 'We will get back to you soon.' });
    } catch (err: any) {
      toast({ title: 'Error submitting application', description: err.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const handleClose = (v: boolean) => {
    if (!v) {
      setTimeout(() => {
        setName(''); setEmail(''); setCoverLetter(''); setFile(null); setSuccess(false); setStep(1);
      }, 300);
    }
    onOpenChange(v);
  };

  const nextStep = () => {
    if (step === 1 && (!name || !email)) {
      toast({ title: 'Please enter your name and email', variant: 'destructive' });
      return;
    }
    setStep(prev => prev + 1);
    if (isVoiceMode) {
      speak("Now, tell us about your experience or upload a resume.");
    }
  };

  const prevStep = () => setStep(prev => prev - 1);

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md overflow-hidden bg-card/95 backdrop-blur-xl border-primary/20 shadow-2xl">
        <DialogHeader>
          <DialogTitle className="font-heading text-2xl flex items-center gap-2">
            {!success && <Sparkles className="h-5 w-5 text-primary animate-pulse" />}
            {success ? 'Success!' : `Join ${jobTitle.split(' ').slice(0, 3).join(' ')}...`}
          </DialogTitle>
          <DialogDescription className="text-muted-foreground">
            {success ? 'You\'re all set!' : `Step ${step} of 2: ${step === 1 ? 'Contact Details' : 'Experience'}`}
          </DialogDescription>
        </DialogHeader>

        <div className="relative mt-2">
          <AnimatePresence mode="wait">
            {success ? (
              <motion.div
                key="success"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex flex-col items-center gap-6 py-10"
              >
                <div className="relative">
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.2, type: "spring" }}
                    className="h-24 w-24 rounded-full bg-success/20 flex items-center justify-center"
                  >
                    <CheckCircle className="h-16 w-16 text-success" />
                  </motion.div>
                  <motion.div
                    animate={{ scale: [1, 1.2, 1], opacity: [0.5, 0.2, 0.5] }}
                    transition={{ repeat: Infinity, duration: 2 }}
                    className="absolute inset-0 rounded-full bg-success/30 -z-10"
                  />
                </div>
                <div className="text-center space-y-2">
                  <h3 className="text-xl font-bold font-heading">Application Sent!</h3>
                  <p className="text-sm text-muted-foreground px-6 text-balance">
                    Your application for <strong>{jobTitle}</strong> has been transmitted. Keep an eye on your inbox!
                  </p>
                </div>
                <Button onClick={() => handleClose(false)} className="px-12 rounded-full hover:scale-105 transition-transform">
                  Got it!
                </Button>
              </motion.div>
            ) : (
              <motion.div
                key={step}
                initial={{ x: 20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                exit={{ x: -20, opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="space-y-6"
              >
                {step === 1 ? (
                  <div className="space-y-4">
                    <div className="group transition-all">
                      <Label htmlFor="name" className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5 ml-1">
                        <User className="h-3 w-3" /> Full Name
                      </Label>
                      <Input
                        id="name"
                        value={name}
                        onChange={e => setName(e.target.value)}
                        placeholder="e.g. Alex Johnson"
                        className="h-12 bg-secondary/30 border-primary/10 focus:border-primary/50 transition-all rounded-xl shadow-inner-sm"
                        required
                      />
                    </div>
                    <div className="group transition-all">
                      <Label htmlFor="email" className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5 ml-1">
                        <Mail className="h-3 w-3" /> Email Address
                      </Label>
                      <Input
                        id="email"
                        type="email"
                        value={email}
                        onChange={e => setEmail(e.target.value)}
                        placeholder="alex@example.com"
                        className="h-12 bg-secondary/30 border-primary/10 focus:border-primary/50 transition-all rounded-xl shadow-inner-sm"
                        required
                      />
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="group transition-all">
                      <Label htmlFor="cover" className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5 ml-1">
                        <FileText className="h-3 w-3" /> Pitch Yourself (Optional)
                      </Label>
                      <Textarea
                        id="cover"
                        value={coverLetter}
                        onChange={e => setCoverLetter(e.target.value)}
                        placeholder="What makes you a perfect fit?"
                        rows={4}
                        className="bg-secondary/30 border-primary/10 focus:border-primary/50 transition-all rounded-xl resize-none"
                      />
                    </div>
                    <div>
                      <Label className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5 ml-1">
                        <Upload className="h-3 w-3" /> Resume / CV
                      </Label>
                      <div className="relative group">
                        <label className={`flex flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed transition-all cursor-pointer p-6 
                          ${file ? 'border-success/50 bg-success/5 text-success' : 'border-muted-foreground/20 hover:border-primary/50 hover:bg-primary/5 text-muted-foreground hover:text-primary'}
                        `}>
                          <div className={`p-3 rounded-full ${file ? 'bg-success/20' : 'bg-secondary'} group-hover:scale-110 transition-transform`}>
                            {file ? <CheckCircle className="h-6 w-6" /> : <Upload className="h-6 w-6" />}
                          </div>
                          <span className="text-sm font-medium">{file ? file.name : 'Click to Upload Resume'}</span>
                          <span className="text-[10px] opacity-70">PDF, DOC up to 5MB</span>
                          <input type="file" accept=".pdf,.doc,.docx" className="hidden" onChange={e => setFile(e.target.files?.[0] || null)} />
                        </label>
                      </div>
                    </div>
                  </div>
                )}

                <div className="flex gap-3 pt-4">
                  {step > 1 && (
                    <Button variant="outline" onClick={prevStep} className="rounded-xl h-12 flex-1">
                      <ArrowLeft className="mr-2 h-4 w-4" /> Back
                    </Button>
                  )}
                  {step < 2 ? (
                    <Button onClick={nextStep} className="rounded-xl h-12 flex-1 shadow-lg shadow-primary/20 bg-gradient-to-r from-primary to-accent hover:opacity-90">
                      Continue <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  ) : (
                    <Button
                      onClick={handleSubmit}
                      className="rounded-xl h-12 flex-1 shadow-lg shadow-primary/20 bg-gradient-to-r from-primary to-accent hover:opacity-90 active:scale-95 transition-all"
                      disabled={loading}
                    >
                      {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}
                      Send Application
                    </Button>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Progress indicator */}
        {!success && (
          <div className="flex justify-center gap-1.5 mt-6 mb-2">
            {[1, 2].map(i => (
              <div key={i} className={`h-1.5 rounded-full transition-all duration-300 ${step === i ? 'w-8 bg-primary' : 'w-2 bg-muted-foreground/20'}`} />
            ))}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default ApplyDialog;
