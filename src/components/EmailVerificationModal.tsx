import { useState } from 'react';
import { Loader2, CheckCircle, Mail } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

interface EmailVerificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onVerified: () => void;
}

interface UserData {
  name: string;
  avatar: string;
  courses: any[];
}

const EmailVerificationModal = ({ isOpen, onVerified }: EmailVerificationModalProps) => {
  const { loginWithCodekaro } = useAuth();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [userData, setUserData] = useState<UserData | null>(null);

  // If user is already authenticated (firebase user exists), show success state or just call onVerified
  // But usually this modal is only shown if !user. 
  // However, we want to show the "Continue" screen if we just verified.

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !email.includes('@')) {
      setError('Please enter a valid email address');
      return;
    }

    setLoading(true);
    setError('');

    try {
      // This will verify AND login anonymously
      // If successful, 'user' in context will update.
      const data = await loginWithCodekaro(email);
      
      if (data) {
        setUserData(data);
      } else {
        // Fallback if no data returned but no error (shouldn't happen with current logic)
        onVerified();
      }
      
    } catch (err) {
      setError('Email not found or verification failed. Please use the email you registered with.');
    } finally {
      setLoading(false);
    }
  };

  const handleContinue = () => {
    onVerified();
  };

  return (
    <Dialog open={isOpen} onOpenChange={() => {
      // Prevent closing by clicking outside or pressing escape
      // Only close if we specifically want to allow it (which we don't per requirements)
      // or if verified/cancelled (maybe add a cancel button later if needed)
    }}>
      <DialogContent className="sm:max-w-md bg-card border-border" onPointerDownOutside={(e) => e.preventDefault()} onEscapeKeyDown={(e) => e.preventDefault()}>
        <DialogHeader>
          <DialogTitle className="text-xl text-center">Join Session</DialogTitle>
          <DialogDescription className="text-center">
            Enter your registered email to join the live session.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-6 py-4">
          {!userData ? (
            // Verification Form
            <form onSubmit={handleVerify} className="flex flex-col gap-4">
              <div className="space-y-2">
                <div className="relative">
                  <Mail className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="name@example.com"
                    type="email"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      setError('');
                    }}
                    className="pl-9"
                    autoFocus
                    disabled={loading}
                    autoComplete="email"
                  />
                </div>
                {error && (
                  <p className="text-sm text-destructive font-medium animate-in fade-in-50">
                    {error}
                  </p>
                )}
              </div>

              <Button type="submit" disabled={loading || !email} className="w-full">
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Verifying...
                  </>
                ) : (
                  'Verify Email'
                )}
              </Button>
            </form>
          ) : (
            // Success State - User Found
            <div className="flex flex-col items-center gap-6 animate-in fade-in-50 zoom-in-95 duration-200">
              <div className="flex flex-col items-center gap-3">
                <div className="relative">
                  <Avatar className="h-20 w-20 border-2 border-primary/20">
                    <AvatarImage src={userData.avatar} alt={userData.name} />
                    <AvatarFallback className="text-lg bg-primary/10 text-primary">
                      {userData.name.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="absolute -bottom-1 -right-1 bg-primary text-primary-foreground rounded-full p-1 border-2 border-background">
                    <CheckCircle className="h-4 w-4" />
                  </div>
                </div>
                <div className="text-center">
                  <h3 className="text-lg font-semibold">{userData.name}</h3>
                  <p className="text-sm text-muted-foreground">{email}</p>
                </div>
              </div>

              <div className="w-full space-y-2">
                <Button onClick={handleContinue} className="w-full" size="lg">
                  Continue to Session
                </Button>
                <p className="text-xs text-center text-muted-foreground">
                  Logged in as {userData.name}
                </p>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default EmailVerificationModal;
