
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Menu, LogOut, User as UserIcon, LayoutDashboard, X } from 'lucide-react';
import { toast } from 'sonner';

export default function Navigation() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Only show navigation if user is authenticated
  if (!user) return null;

  const handleSignOut = async () => {
    try {
      await signOut();
      toast.success('Signed out successfully');
      navigate('/login');
    } catch (error) {
      console.error('Error signing out:', error);
      toast.error('Failed to sign out');
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 items-center justify-between px-4 sm:px-8">
        {/* Logo / Brand */}
        <div className="flex items-center gap-2 font-bold text-xl">
          <Link to="/" className="flex items-center gap-2">
            <span className="text-primary">Simulive</span>
          </Link>
        </div>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-6 text-sm font-medium">
          <Link
            to="/sessions"
            className="transition-colors hover:text-foreground/80 text-foreground/60"
          >
            Sessions
          </Link>
          
          {/* User Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                <Avatar className="h-8 w-8">
                  <AvatarImage src={user.photoURL || ''} alt={user.displayName || 'User'} />
                  <AvatarFallback>{getInitials(user.displayName || 'User')}</AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56" align="end" forceMount>
              <DropdownMenuLabel className="font-normal">
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium leading-none">{user.displayName}</p>
                  <p className="text-xs leading-none text-muted-foreground">
                    {user.email}
                  </p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => navigate('/sessions')}>
                <LayoutDashboard className="mr-2 h-4 w-4" />
                Sessions
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleSignOut} className="text-red-600 focus:text-red-600">
                <LogOut className="mr-2 h-4 w-4" />
                Log out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </nav>

        {/* Mobile Menu Toggle */}
        <div className="flex items-center md:hidden">
            <Button
                variant="ghost"
                size="icon"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                aria-label="Toggle menu"
            >
                {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden border-b bg-background p-4">
            <nav className="flex flex-col gap-4">
                <Link
                    to="/sessions"
                    className="text-sm font-medium transition-colors hover:underline"
                    onClick={() => setMobileMenuOpen(false)}
                >
                    Sessions
                </Link>
                <div className="border-t pt-4">
                     <div className="flex items-center gap-2 mb-2">
                        <Avatar className="h-8 w-8">
                            <AvatarImage src={user.photoURL || ''} alt={user.displayName || 'User'} />
                            <AvatarFallback>{getInitials(user.displayName || 'User')}</AvatarFallback>
                        </Avatar>
                        <div className="flex flex-col">
                            <span className="text-sm font-medium">{user.displayName}</span>
                            <span className="text-xs text-muted-foreground">{user.email}</span>
                        </div>
                     </div>
                     <Button variant="ghost" className="w-full justify-start text-red-600 p-0 h-auto hover:bg-transparent hover:text-red-700 hover:underline" onClick={handleSignOut}>
                        <LogOut className="mr-2 h-4 w-4" />
                        Log out
                     </Button>
                </div>
            </nav>
        </div>
      )}
    </header>
  );
}
