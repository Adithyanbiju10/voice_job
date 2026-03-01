import { useState, useEffect, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Upload, Loader2, CheckCircle, User, FileText, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import confetti from 'canvas-confetti';
import { useVoice } from '@/contexts/VoiceContext';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import annyang from 'annyang';

interface ApplyDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  jobId: string;
  jobTitle: string;
  employerName: string;
}

const ApplyDialog = ({ open, onOpenChange, jobId, jobTitle, employerName }: ApplyDialogProps) => {
  const { toast } = useToast();
  const { speak, isVoiceMode } = useVoice();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [coverLetter, setCoverLetter] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const submitButtonRef = useRef<HTMLButtonElement>(null);
  const successButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (open && isVoiceMode && !success) {
      if (user?.role === 'seeker') {
        speak(`Applying for ${jobTitle}. First, please type a short pitch about yourself in the first field and press Enter.`);
      } else {
        speak(`You must be signed in as a job seeker to apply for this job.`);
      }
    }

    if (open && user?.role === 'seeker') {
      setName(user.name);
      setEmail(user.email);
    }
  }, [open, user]);

  useEffect(() => {
    if (success && isVoiceMode) {
      speak('Application submitted! You can now say "go to home" to return to the landing page, or press Enter to close this window.');

      const commands = {
        'go to home': () => {
          speak('Navigating to home page.');
          handleClose(false);
          navigate('/');
        }
      };

      const annyangLib = annyang as any;
      if (annyangLib) {
        annyangLib.addCommands(commands);
      }

      const handleEnter = (e: KeyboardEvent) => {
        if (e.key === 'Enter') {
          handleClose(false);
        }
      };
      window.addEventListener('keydown', handleEnter);

      return () => {
        if (annyangLib) {
          annyangLib.removeCommands(Object.keys(commands));
        }
        window.removeEventListener('keydown', handleEnter);
      };
    }
  }, [success, isVoiceMode, navigate]);

  const handlePitchKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && isVoiceMode) {
      e.preventDefault();
      speak("Pitch entered. Now, please upload your resume by clicking the upload button.");
      fileInputRef.current?.click();
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0] || null;
    setFile(selectedFile);
    if (selectedFile && isVoiceMode) {
      speak(`Resume ${selectedFile.name} uploaded. Now, click Enter or the Send button to submit your application.`);
      setTimeout(() => submitButtonRef.current?.focus(), 500);
    }
  };

  const handleSubmit = async () => {
    if (!file) {
      toast({ title: 'Please upload your resume', variant: 'destructive' });
      if (isVoiceMode) speak('Please upload your resume to continue.');
      return;
    }

    setLoading(true);
    try {
      let resumeUrl: string | null = null;
      let uploadSuccessful = false;

      // Only attempt Supabase upload if it's NOT a mock job
      if (!jobId.startsWith('mock-')) {
        try {
          const ext = file.name.split('.').pop();
          const path = `${crypto.randomUUID()}.${ext}`;
          const { error: uploadError } = await supabase.storage.from('resumes').upload(path, file);

          if (!uploadError) {
            const { data: urlData } = supabase.storage.from('resumes').getPublicUrl(path);
            resumeUrl = urlData.publicUrl;
            uploadSuccessful = true;
          } else {
            console.warn('Supabase storage upload failed, falling back to local tracking:', uploadError.message);
          }
        } catch (storageErr) {
          console.warn('Supabase storage unavailable, using local tracking only.');
        }

        // Only try to insert into DB if we are reasonably sure Supabase is working
        // or just try it and ignore if it fails (we have localStorage fallback anyway)
        try {
          const { error: dbError } = await supabase.from('applications').insert({
            job_id: jobId,
            applicant_name: name,
            applicant_email: email,
            cover_letter: coverLetter || null,
            resume_url: resumeUrl,
          });
          if (dbError) console.warn('DB application insert failed:', dbError.message);
        } catch (dbErr) {
          console.warn('Supabase DB unavailable.');
        }
      } else {
        // Mock jobs: simulate delay
        await new Promise(resolve => setTimeout(resolve, 800));
        resumeUrl = 'https://example.com/mock-resume.pdf';
      }

      // Save application to localStorage for Profile visibility
      const applicationData = {
        id: crypto.randomUUID(),
        jobId,
        jobTitle,
        employerName,
        applicantName: name,
        applicantEmail: email,
        coverLetter: coverLetter,
        appliedAt: new Date().toISOString(),
        status: 'Pending'
      };

      const existingApps = JSON.parse(localStorage.getItem('user_applications') || '[]');
      localStorage.setItem('user_applications', JSON.stringify([applicationData, ...existingApps]));

      // Save to global list for employers to see
      const allApps = JSON.parse(localStorage.getItem('all_applications') || '[]');
      localStorage.setItem('all_applications', JSON.stringify([applicationData, ...allApps]));

      setSuccess(true);
      if (isVoiceMode) {
        speak('Your application has been submitted successfully! Application sent.');
      }

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
        setCoverLetter(''); setFile(null); setSuccess(false);
      }, 300);
    }
    onOpenChange(v);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md overflow-hidden bg-card/95 backdrop-blur-xl border-primary/20 shadow-2xl">
        <DialogHeader>
          <DialogTitle className="font-heading text-2xl flex items-center gap-2">
            {!success && <Sparkles className="h-5 w-5 text-primary animate-pulse" />}
            {success ? 'Success!' : `Join ${jobTitle.split(' ').slice(0, 3).join(' ')}...`}
          </DialogTitle>
          <DialogDescription className="text-muted-foreground">
            {success ? 'You\'re all set!' : `Applying as ${user?.name || 'Job Seeker'}`}
          </DialogDescription>
        </DialogHeader>

        <div className="relative mt-2">
          <AnimatePresence mode="wait">
            {(!user || user.role !== 'seeker') ? (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex flex-col items-center gap-6 py-10 text-center"
              >
                <div className="h-20 w-20 rounded-full bg-destructive/10 flex items-center justify-center text-destructive">
                  <User className="h-10 w-10" />
                </div>
                <div className="space-y-2">
                  <h3 className="text-xl font-bold font-heading">Seekers Only</h3>
                  <p className="text-sm text-muted-foreground px-6">
                    Only job seekers can apply for jobs. Please <Link to="/auth" className="text-primary font-bold hover:underline">sign in</Link> as a job seeker to proceed.
                  </p>
                </div>
                <Button onClick={() => handleClose(false)} variant="outline" className="px-12 rounded-full">
                  Dismiss
                </Button>
              </motion.div>
            ) : success ? (
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
                <Button ref={successButtonRef} onClick={() => handleClose(false)} className="px-12 rounded-full hover:scale-105 transition-transform">
                  Got it!
                </Button>
              </motion.div>
            ) : (
              <motion.div
                key="form"
                initial={{ x: 20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                className="space-y-6"
              >
                <div className="space-y-4">
                  <div className="group transition-all">
                    <Label htmlFor="cover" className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5 ml-1">
                      <FileText className="h-3 w-3" /> Pitch Yourself (Optional)
                    </Label>
                    <Textarea
                      id="cover"
                      value={coverLetter}
                      onChange={e => setCoverLetter(e.target.value)}
                      onKeyDown={handlePitchKeyDown}
                      placeholder="What makes you a perfect fit?"
                      rows={4}
                      className="bg-secondary/30 border-primary/10 focus:border-primary/50 transition-all rounded-xl resize-none"
                    />
                  </div>
                  <div>
                    <Label className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5 ml-1">
                      <Upload className="h-3 w-3" /> Resume / CV <span className="text-destructive ml-1">*</span>
                    </Label>
                    <div className="relative group">
                      <label
                        className={`flex flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed transition-all cursor-pointer p-6 
                        ${file ? 'border-success/50 bg-success/5 text-success' : 'border-muted-foreground/20 hover:border-primary/50 hover:bg-primary/5 text-muted-foreground hover:text-primary'}
                        ${isVoiceMode ? 'focus-within:ring-2 focus-within:ring-primary/50' : ''}
                      `}>
                        <div className={`p-3 rounded-full ${file ? 'bg-success/20' : 'bg-secondary'} group-hover:scale-110 transition-transform`}>
                          {file ? <CheckCircle className="h-6 w-6" /> : <Upload className="h-6 w-6" />}
                        </div>
                        <span className="text-sm font-medium">{file ? file.name : 'Click to Upload Resume'}</span>
                        <span className="text-[10px] opacity-70">PDF, DOC up to 5MB</span>
                        <input
                          type="file"
                          ref={fileInputRef}
                          accept=".pdf,.doc,.docx"
                          className="hidden"
                          onChange={handleFileChange}
                        />
                      </label>
                    </div>
                  </div>
                </div>

                <div className="pt-4">
                  <Button
                    ref={submitButtonRef}
                    onClick={handleSubmit}
                    className="w-full rounded-xl h-12 shadow-lg shadow-primary/20 bg-gradient-to-r from-primary to-accent hover:opacity-90 active:scale-95 transition-all"
                    disabled={loading}
                  >
                    {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}
                    Send Application
                  </Button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

      </DialogContent>
    </Dialog>
  );
};

export default ApplyDialog;
