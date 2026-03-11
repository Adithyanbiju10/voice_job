import { useState, useEffect, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Badge } from '@/components/ui/badge';
import { Upload, Loader2, CheckCircle, User, FileText, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import confetti from 'canvas-confetti';
import { useVoice } from '@/contexts/VoiceContext';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import annyang from 'annyang';
import { jsPDF } from 'jspdf';

interface ApplyDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  jobId: string;
  jobTitle: string;
  employerName: string;
}

const ApplyDialog = ({ open, onOpenChange, jobId, jobTitle, employerName }: ApplyDialogProps) => {
  const { toast } = useToast();
  const { speak, isVoiceMode, isAwake } = useVoice();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [coverLetter, setCoverLetter] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [alreadyApplied, setAlreadyApplied] = useState(false);
  const [useVoiceResume, setUseVoiceResume] = useState(false);
  const [hasVoiceResume, setHasVoiceResume] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const submitButtonRef = useRef<HTMLButtonElement>(null);
  const successButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (open && user?.role === 'seeker') {
      setName(user.name);
      setEmail(user.email);

      // Check for duplicate application and retrieve its details
      const existingApps = JSON.parse(localStorage.getItem('user_applications') || '[]');
      const existingApp = existingApps.find(
        (app: any) => app.jobId === jobId && app.applicantEmail === user.email
      );
      const duplicate = !!existingApp;
      setAlreadyApplied(duplicate);

      // Check for saved voice resume
      const savedVoiceResume = localStorage.getItem('ability_voice_resume');
      setHasVoiceResume(!!savedVoiceResume);

      if (isVoiceMode && isAwake && !success) {
        if (duplicate && existingApp) {
          const appliedDate = new Date(existingApp.appliedAt).toLocaleDateString('en-US', {
            weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
          });
          const statusMsg =
            existingApp.status === 'Accepted'
              ? 'Congratulations! Your application has been accepted.'
              : existingApp.status === 'Rejected'
                ? 'Unfortunately, your application was rejected.'
                : 'Your application is currently pending review.';
          speak(
            `You have already applied for ${jobTitle}. ` +
            `You applied on ${appliedDate}. ` +
            `${statusMsg} ` +
            `You cannot submit another application for this role.`
          );
        } else {
          let msg = `Applying for ${jobTitle}. First, please type a short pitch about yourself in the first field and press Enter. `;
          if (savedVoiceResume) {
            msg += "I see you have a voice resume saved in your profile. Would you like to use it? You can just say 'Yes' or 'use voice resume'.";
          }
          speak(msg);
        }
      }
    } else if (open && isVoiceMode && isAwake && !success) {
      speak(`You must be signed in as a job seeker to apply for this job.`);
    }
  }, [open, user]);

  useEffect(() => {
    if (success && isVoiceMode) {
      // Ensure the AI is awake to catch the next command
      const triggerSuccessVoice = async () => {
        await speak('Application submitted successfully! You are all set.');
        speak('Would you like to go back to the home page or continue searching for other jobs?');
      };
      triggerSuccessVoice();

      const commands = {
        'go to home': () => {
          speak('Navigating to home page.');
          handleClose(false);
          navigate('/');
        },
        'search for jobs': () => {
          speak('Opening the browse jobs section. Let\'s find your next opportunity.');
          handleClose(false);
          navigate('/jobs');
        },
        'find more': () => {
          speak('Heading back to the search page.');
          handleClose(false);
          navigate('/jobs');
        },
        'browse': () => {
          speak('Redirecting you to the jobs list.');
          handleClose(false);
          navigate('/jobs');
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
  }, [success, isVoiceMode, navigate, speak]);

  const handlePitchKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && isVoiceMode) {
      e.preventDefault();
      if (!useVoiceResume) {
        speak("Pitch entered. Would you like to upload a new resume or use your voice generated resume? You can say 'upload new' or 'use voice resume'.");
      } else {
        speak("Pitch entered. I will use your saved voice resume for this application. Press Enter or say 'send' to submit.");
        setTimeout(() => submitButtonRef.current?.focus(), 500);
      }
    }
    speakCharacter(e);
  };

  const handleUploadLocal = () => {
    setUseVoiceResume(false);
    if (isVoiceMode) {
      speak("Please use your screen reader to navigate the file explorer. Once you have selected your file, you can turn off the screen reader and return to the application.");
      // Small delay to allow the voice to finish before the explorer window steals focus
      setTimeout(() => {
        fileInputRef.current?.click();
      }, 1000);
    } else {
      fileInputRef.current?.click();
    }
  };

  useEffect(() => {
    const commands = {
      'use my voice resume': () => handleSelectVoiceResume(),
      'use voice resume': () => handleSelectVoiceResume(),
      'voice resume': () => handleSelectVoiceResume(),
      'voice': () => handleSelectVoiceResume(),
      'my voice': () => handleSelectVoiceResume(),
      'audio resume': () => handleSelectVoiceResume(),
      'generated resume': () => handleSelectVoiceResume(),
      'resume': () => handleSelectVoiceResume(),
      'attach resume': () => handleSelectVoiceResume(),
      'yes use it': () => handleSelectVoiceResume(),
      'attach': () => handleSelectVoiceResume(),
      'upload new resume': () => handleUploadLocal(),
      'upload file': () => handleUploadLocal(),
      'select file': () => handleUploadLocal(),
      'upload new': () => handleUploadLocal(),
      'send application': () => !alreadyApplied && !loading && handleSubmit(),
      'submit': () => !alreadyApplied && !loading && handleSubmit(),
    };

    const handleSelectVoiceResume = () => {
      if (hasVoiceResume) {
        setUseVoiceResume(true);
        speak("Voice resume selected. I'll use your profile's voice resume.");
      } else {
        speak("You don't have a voice resume saved yet. You can create one in your profile.");
      }
    };

    const handleConfirmation = (e: any) => {
      if (e.detail === 'yes' && hasVoiceResume && !useVoiceResume) {
        handleSelectVoiceResume();
      }
    };

    const handleVoiceCommand = (e: any) => {
      if (e.detail === 'voice resume' || e.detail === 'resume') {
        handleSelectVoiceResume();
      } else if (e.detail === 'upload') {
        handleUploadLocal();
      }
    };

    window.addEventListener('voice-confirmation', handleConfirmation);
    window.addEventListener('voice-command', handleVoiceCommand);

    const annyangLib = annyang as any;
    if (annyangLib && open) {
      annyangLib.addCommands(commands);
    }

    return () => {
      window.removeEventListener('voice-confirmation', handleConfirmation);
      window.removeEventListener('voice-command', handleVoiceCommand);
      if (annyangLib) {
        annyangLib.removeCommands(Object.keys(commands));
      }
    };
  }, [open, hasVoiceResume, alreadyApplied, loading, useVoiceResume]);

  // Speaks each character aloud for visually impaired users
  const speakCharacter = (e: React.KeyboardEvent) => {
    if (!isVoiceMode) return;
    const key = e.key;
    if (key.length > 1 && key !== 'Backspace' && key !== 'Space' && key !== 'Enter') return;
    if (key === 'Backspace') { speak('deleted'); return; }
    if (key === 'Enter') return;
    const specialMap: Record<string, string> = {
      ' ': 'space', '@': 'at sign', '.': 'dot', ',': 'comma',
      '-': 'dash', '_': 'underscore', '+': 'plus', '=': 'equals',
      '!': 'exclamation mark', '?': 'question mark', '#': 'hash',
      '$': 'dollar', '%': 'percent', '^': 'caret', '&': 'ampersand',
      '*': 'asterisk', '(': 'open parenthesis', ')': 'close parenthesis',
      '/': 'slash', '\\': 'backslash', ':': 'colon', ';': 'semicolon',
      "'": 'apostrophe', '"': 'quote',
    };
    speak(specialMap[key] ?? key);
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
    // Guard: prevent duplicate applications
    const existingApps = JSON.parse(localStorage.getItem('user_applications') || '[]');
    const duplicate = existingApps.some(
      (app: any) => app.jobId === jobId && app.applicantEmail === email
    );
    if (duplicate) {
      toast({ title: 'Already applied', description: `You have already applied for ${jobTitle}.`, variant: 'destructive' });
      if (isVoiceMode) speak(`You have already applied for ${jobTitle}. Duplicate applications are not allowed.`);
      setAlreadyApplied(true);
      return;
    }

    if (!file && !useVoiceResume) {
      toast({ title: 'Please upload your resume', variant: 'destructive' });
      if (isVoiceMode) speak('Please upload your resume to continue.');
      return;
    }

    setLoading(true);
    try {
      let resumeUrl: string | null = null;
      let uploadSuccessful = false;

      // Only attempt Supabase upload if it's NOT a mock job and we have a physical file
      if (!jobId.startsWith('mock-') && file && !useVoiceResume) {
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
      } else if (jobId.startsWith('mock-')) {
        // Mock jobs: simulate delay
        await new Promise(resolve => setTimeout(resolve, 800));
        resumeUrl = 'https://example.com/mock-resume.pdf';
      }

      // Fallback for demo purposes if no URL was set
      if (!resumeUrl) {
        resumeUrl = 'https://example.com/mock-resume-fallback.pdf';
      }

      // Also store file as base64 data URI so employers can open it directly (works offline/demo)
      let resumeData: string | null = null;
      let resumeFilenameHeader: string = useVoiceResume ? 'AI-Generated Voice Resume.pdf' : (file?.name || 'Resume');

      if (useVoiceResume) {
        // Generate PDF from Voice Resume Data
        const savedResume = JSON.parse(localStorage.getItem('ability_voice_resume') || '{}');
        const doc = new jsPDF();

        // Header
        doc.setFontSize(22);
        doc.setTextColor(63, 81, 181); // Primary color
        doc.text(name || 'Applicant Profile', 20, 20);

        doc.setFontSize(10);
        doc.setTextColor(100, 100, 100);
        doc.text(email || '', 20, 26);
        doc.text(`Generated by Ability Jobs AI Assistant - ${new Date().toLocaleDateString()}`, 20, 31);

        doc.setLineWidth(0.5);
        doc.line(20, 35, 190, 35);

        let y = 45;

        // Sections
        const addSection = (title: string, content: string) => {
          if (!content) return;
          doc.setFontSize(14);
          doc.setTextColor(33, 33, 33);
          doc.setFont('helvetica', 'bold');
          doc.text(title, 20, y);
          y += 7;

          doc.setFontSize(10);
          doc.setFont('helvetica', 'normal');
          doc.setTextColor(66, 66, 66);

          // Wrap text
          const splitContent = doc.splitTextToSize(content, 170);
          doc.text(splitContent, 20, y);
          y += (splitContent.length * 5) + 10;
        };

        addSection('PROFESSIONAL EXPERIENCE', savedResume.experience);
        addSection('CORE SKILLS', savedResume.skills);
        addSection('EDUCATIONAL BACKGROUND', savedResume.education);

        // Pitch/Cover Letter if exists
        if (coverLetter) {
          addSection('PERSONAL PITCH', coverLetter);
        }

        resumeData = doc.output('datauristring');
      } else if (file) {
        try {
          resumeData = await new Promise<string>((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result as string);
            reader.onerror = reject;
            reader.readAsDataURL(file);
          });
        } catch {
          console.warn('Could not read file as base64.');
        }
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
        status: 'Pending',
        resume_url: resumeUrl,
        resume_data: resumeData,
        resume_filename: resumeFilenameHeader,
        voice_resume: useVoiceResume ? JSON.parse(localStorage.getItem('ability_voice_resume') || '{}') : null,
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
        setCoverLetter(''); setFile(null); setSuccess(false); setAlreadyApplied(false);
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
                      onFocus={() => isVoiceMode && speak('Pitch yourself field. Each character you type will be read aloud. Press Enter when done.')}
                      placeholder="What makes you a perfect fit?"
                      rows={4}
                      className="bg-secondary/30 border-primary/10 focus:border-primary/50 transition-all rounded-xl resize-none"
                    />
                  </div>
                  <div className="space-y-4">
                    {hasVoiceResume && (
                      <div className="flex p-1 bg-muted/50 rounded-lg border border-border/50">
                        <button
                          onClick={handleUploadLocal}
                          className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-md transition-all text-xs font-bold uppercase tracking-wider
                            ${!useVoiceResume ? 'bg-background shadow-sm text-primary' : 'text-muted-foreground hover:text-foreground'}`}
                        >
                          <Upload className="h-3 w-3" /> Upload New
                        </button>
                        <button
                          onClick={() => setUseVoiceResume(true)}
                          className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-md transition-all text-xs font-bold uppercase tracking-wider
                            ${useVoiceResume ? 'bg-background shadow-sm text-primary' : 'text-muted-foreground hover:text-foreground'}`}
                        >
                          <Sparkles className="h-3 w-3" /> Use Voice Resume
                        </button>
                      </div>
                    )}

                    {!useVoiceResume ? (
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
                            <span className="text-sm font-medium text-center">{file ? file.name : 'Click to Upload Resume'}</span>
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
                    ) : (
                      <div className="p-5 rounded-2xl bg-success/5 border border-success/20 flex flex-col items-center text-center gap-3 animate-in zoom-in-95 duration-300">
                        <div className="p-3 bg-success/20 rounded-full">
                          <CheckCircle className="h-8 w-8 text-success" />
                        </div>
                        <div>
                          <h4 className="text-sm font-bold text-foreground">Voice Resume Selected</h4>
                          <p className="text-xs text-muted-foreground mt-1">
                            Your saved voice resume from your profile will be used for this application.
                          </p>
                        </div>
                        <Button variant="ghost" size="sm" onClick={() => navigate('/profile')} className="text-[10px] uppercase font-bold text-primary hover:bg-primary/5">
                          Edit Profile Resume
                        </Button>
                      </div>
                    )}
                  </div>
                </div>

                <div className="pt-4">
                  {alreadyApplied ? (
                    <div className="w-full rounded-xl h-12 flex items-center justify-center gap-2 bg-muted/60 border border-border/50 text-muted-foreground text-sm font-semibold cursor-not-allowed">
                      <CheckCircle className="h-4 w-4 text-success" />
                      Already Applied
                    </div>
                  ) : (
                    <Button
                      ref={submitButtonRef}
                      onClick={handleSubmit}
                      className="w-full rounded-xl h-12 shadow-lg shadow-primary/20 bg-gradient-to-r from-primary to-accent hover:opacity-90 active:scale-95 transition-all"
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

      </DialogContent>
    </Dialog>
  );
};

export default ApplyDialog;
