'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Menu,
  Search,
  Bell,
  ChevronDown,
  Building2,
  Check,
  LogOut,
  User,
  Settings,
  AlertTriangle,
  Info,
  XCircle,
  CheckCircle2,
  Plus,
} from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ThemeToggle } from '@/components/theme-toggle';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { DOSSIERS, NOTIFICATIONS } from '@/lib/mock-data';
import { cn } from '@/lib/utils';
import { fetchWithAuth } from '@/lib/api';
import { ProfileEditModal } from '@/components/profile-edit-modal';

import { useEntite } from '@/lib/entite-context';

export function AppHeader({ onMenuClick }: { onMenuClick: () => void }) {
  const router = useRouter();
  const { entites, activeEntite, setActiveEntite, isLoading } = useEntite();
  const [notifs, setNotifs] = useState(NOTIFICATIONS);
  const unreadCount = notifs.filter((n) => !n.lu).length;

  const [currentUserData, setCurrentUserData] = useState<any>(null);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);

  const fetchUser = async () => {
    try {
      const user = await fetchWithAuth('/users/me/');
      setCurrentUserData(user);
    } catch (e) {
      console.error("Failed to fetch user profile", e);
    }
  };

  useEffect(() => {
    fetchUser();
  }, []);

  const markAllRead = () => setNotifs(notifs.map((n) => ({ ...n, lu: true })));

  const notifIcon = (type: string) => {
    switch (type) {
      case 'warning': return <AlertTriangle className="h-4 w-4 text-warning" />;
      case 'info': return <Info className="h-4 w-4 text-primary" />;
      case 'error': return <XCircle className="h-4 w-4 text-destructive" />;
      case 'success': return <CheckCircle2 className="h-4 w-4 text-success" />;
      default: return <Info className="h-4 w-4" />;
    }
  };

  const getAvatarUrl = (user: any) => {
    if (user?.photo_profil) {
      return user.photo_profil.startsWith('http') 
        ? user.photo_profil 
        : `${process.env.NEXT_PUBLIC_BACKEND_URL || 'http://127.0.0.1:8000'}${user.photo_profil.startsWith('/') ? '' : '/'}${user.photo_profil}`;
    }
    return user?.avatar || '';
  };

  return (
    <header className="sticky top-0 z-30 h-16 bg-white dark:bg-background/80 dark:backdrop-blur-md border-b border-border flex items-center px-4 lg:px-6 gap-3">
      <Button variant="ghost" size="icon" onClick={onMenuClick} className="lg:hidden">
        <Menu className="h-5 w-5" />
      </Button>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" title="Dossiers / Sites">
            <Building2 className="h-5 w-5 text-primary" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-80">
          <DropdownMenuLabel>Dossiers / Sites</DropdownMenuLabel>
          <DropdownMenuSeparator />
          {entites.length === 0 && (
            <div className="py-4 text-center text-sm text-muted-foreground">
              Aucune entité configurée
            </div>
          )}
          {entites.map((d) => (
            <DropdownMenuItem
              key={d.id}
              onClick={() => setActiveEntite(d)}
              className="flex items-start gap-3 py-3"
            >
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary shrink-0">
                <Building2 className="h-4 w-4" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{d.raisonSociale}</p>
                <p className="text-xs text-muted-foreground">Exercice {d.exerciceEnCours} - {d.devise}</p>
              </div>
              {activeEntite && activeEntite.id === d.id && <Check className="h-4 w-4 text-primary shrink-0" />}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>

      <Button variant="ghost" size="icon" title="Nouvelle entité" asChild>
        <Link href="/onboarding">
          <Plus className="h-5 w-5 text-primary" />
        </Link>
      </Button>

      <div className="flex-1" />

      <div className="ml-auto flex items-center gap-1 sm:gap-2">
        <Button variant="ghost" size="icon">
          <Search className="h-5 w-5" />
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="relative">
              <Bell className="h-5 w-5" />
              {unreadCount > 0 && (
                <span className="absolute top-1 right-1 h-4 min-w-4 px-1 rounded-full bg-destructive text-destructive-foreground text-[10px] font-bold flex items-center justify-center">
                  {unreadCount}
                </span>
              )}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-80 lg:w-96">
            <div className="flex items-center justify-between px-3 py-2">
              <span className="text-sm font-semibold">Notifications</span>
              <button
                onClick={markAllRead}
                className="text-xs text-primary hover:underline"
              >
                Tout marquer comme lu
              </button>
            </div>
            <DropdownMenuSeparator />
            <div className="max-h-80 overflow-y-auto scrollbar-thin">
              {notifs.map((n) => (
                <div
                  key={n.id}
                  className={cn(
                    'flex items-start gap-3 px-3 py-3 border-b border-border last:border-0 hover:bg-muted/50 cursor-pointer transition-colors',
                    !n.lu && 'bg-primary/5'
                  )}
                >
                  <div className="mt-0.5 shrink-0">{notifIcon(n.type)}</div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium">{n.titre}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{n.message}</p>
                    <p className="text-xs text-muted-foreground/70 mt-1">{n.time}</p>
                  </div>
                  {!n.lu && <span className="h-2 w-2 rounded-full bg-primary shrink-0 mt-1.5" />}
                </div>
              ))}
            </div>
          </DropdownMenuContent>
        </DropdownMenu>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="flex items-center gap-2 rounded-lg p-1 pr-2 hover:bg-muted transition-colors">
              <Avatar className="h-8 w-8">
                <AvatarImage src={getAvatarUrl(currentUserData)} alt={currentUserData?.nom} />
                <AvatarFallback>{currentUserData?.nom ? currentUserData.nom.substring(0,2).toUpperCase() : 'U'}</AvatarFallback>
              </Avatar>
              <div className="hidden sm:block text-left">
                <p className="text-sm font-medium leading-none">{currentUserData?.nom}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{currentUserData?.role}</p>
              </div>
              <ChevronDown className="h-4 w-4 text-muted-foreground hidden sm:block" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>
              <div>
                <p className="text-sm font-medium">{currentUserData?.nom}</p>
                <p className="text-xs text-muted-foreground font-normal">{currentUserData?.email}</p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => setIsProfileModalOpen(true)}>
              <User className="h-4 w-4 mr-2" /> Mon profil
            </DropdownMenuItem>
            <DropdownMenuItem>
              <Settings className="h-4 w-4 mr-2" /> Parametres
            </DropdownMenuItem>
            <div className="px-2 py-1.5 flex justify-between items-center">
              <span className="text-sm font-medium">Thème</span>
              <ThemeToggle className="h-8 w-8" />
            </div>
            <DropdownMenuSeparator />
            <DropdownMenuItem 
              className="text-destructive cursor-pointer" 
              onSelect={() => {
                localStorage.removeItem('accessToken');
                localStorage.removeItem('refreshToken');
                window.location.href = '/login';
              }}
            >
              <LogOut className="h-4 w-4 mr-2" /> Deconnexion
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <ProfileEditModal 
        isOpen={isProfileModalOpen} 
        onClose={() => setIsProfileModalOpen(false)} 
        currentUser={currentUserData} 
        onProfileUpdated={fetchUser} 
      />
    </header>
  );
}
