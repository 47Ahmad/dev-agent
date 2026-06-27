import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { trpc } from '@/lib/trpc';

interface User {
  id: number;
  openId: string;
  name?: string | null;
  email?: string | null;
  role: 'user' | 'admin';
  plan: 'free' | 'pro' | 'team';
  createdAt: Date;
  lastSignedIn: Date;
}

interface SessionContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  logout: () => Promise<void>;
  refetch: () => void;
}

const SessionContext = createContext<SessionContextType | undefined>(undefined);

export function SessionProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Get current user
  const { data: currentUser, isLoading: userLoading, refetch } = trpc.auth.me.useQuery();

  // Logout mutation
  const logoutMutation = trpc.auth.logout.useMutation();

  useEffect(() => {
    if (!userLoading) {
      setUser(currentUser || null);
      setIsLoading(false);
    }
  }, [currentUser, userLoading]);

  const handleLogout = async () => {
    try {
      await logoutMutation.mutateAsync();
      setUser(null);
      // Redirect to home page
      window.location.href = '/';
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  const value: SessionContextType = {
    user,
    isLoading,
    isAuthenticated: !!user,
    logout: handleLogout,
    refetch,
  };

  return (
    <SessionContext.Provider value={value}>
      {children}
    </SessionContext.Provider>
  );
}

export function useSession() {
  const context = useContext(SessionContext);
  if (!context) {
    throw new Error('useSession must be used within SessionProvider');
  }
  return context;
}
