
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Auth } from "@/components/Auth";
import { Dashboard } from "@/components/Dashboard";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { ErrorBoundary } from "@/components/ui/error-boundary";
import { useOffline } from "@/hooks/useOffline";

const Index = () => {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const { isOffline } = useOffline();

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <LoadingSpinner 
          size="lg" 
          text="Loading your learning platform..." 
        />
      </div>
    );
  }

  return (
    <ErrorBoundary>
      <div className="animate-fade-in">
        {isOffline && (
          <div className="bg-yellow-100 border-b border-yellow-200 p-2 text-center text-sm text-yellow-800">
            You're currently offline. Some features may be limited.
          </div>
        )}
        {user ? <Dashboard user={user} /> : <Auth />}
      </div>
    </ErrorBoundary>
  );
};

export default Index;
