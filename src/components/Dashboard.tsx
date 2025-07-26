
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { MainLayout } from "@/components/MainLayout";
import { ScheduleCard } from "@/components/dashboard/ScheduleCard";
import { StreakCard } from "@/components/dashboard/StreakCard";
import { BatchLeaderboardCard } from "@/components/dashboard/BatchLeaderboardCard";
import { AssignmentsCard } from "@/components/dashboard/AssignmentsCard";
import { ProgressTracker } from "@/components/dashboard/ProgressTracker";
import { AchievementSystem } from "@/components/dashboard/AchievementSystem";
import { CollaborationHub } from "@/components/CollaborationHub";
import { LearningAnalytics } from "@/components/dashboard/LearningAnalytics";
import { PerformanceOptimizer } from "@/components/PerformanceOptimizer";
import { AdvancedGamification } from "@/components/AdvancedGamification";

import { AdvancedAnalytics } from "@/components/AdvancedAnalytics";
import { useAuth } from "@/hooks/useAuth";
import { useResponsive } from "@/hooks/useResponsive";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { SkeletonList } from "@/components/ui/skeleton-card";
import { ErrorBoundary } from "@/components/ui/error-boundary";
import { useRetry } from "@/hooks/useRetry";
import { checkAndResetStreak } from "@/lib/streakManager";

interface DashboardProps {
  user: any;
}

export const Dashboard = ({ user }: DashboardProps) => {
  const { isAdmin } = useAuth();
  const { isMobile } = useResponsive();
  const [profile, setProfile] = useState<any>(null);
  const [analytics, setAnalytics] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { retry, isRetrying } = useRetry({
    maxAttempts: 3,
    delay: 1000,
  });

  const fetchProfile = async () => {
    try {
      // First, check and reset streak if necessary
      await checkAndResetStreak(user.id);
      
      // Then fetch the updated profile
      const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (error) throw error;
      setProfile(data);

      // Fetch analytics
      const { data: analyticsData, error: analyticsError } = await supabase
        .rpc('get_student_analytics', { student_uuid: user.id });

      if (analyticsError) throw analyticsError;
      if (analyticsData && analyticsData.length > 0) {
        setAnalytics(analyticsData[0]);
      }

      setError(null);
    } catch (error) {
      console.error('Error fetching profile:', error);
      setError('Failed to load profile data');
      throw error;
    }
  };

  useEffect(() => {
    const loadData = async () => {
      if (user) {
        setLoading(true);
        try {
          await retry(fetchProfile);
        } catch (error) {
          // Error already handled by retry hook
        } finally {
          setLoading(false);
        }
      }
    };

    loadData();
  }, [user, retry]);

  if (loading || isRetrying) {
    return (
      <MainLayout user={user}>
        <div className="space-y-6 animate-fade-in">
          <div className={isMobile ? 'text-center' : ''}>
            <div className="h-8 bg-muted rounded-lg animate-pulse mb-2" />
            <div className="h-4 bg-muted rounded-lg animate-pulse w-3/4" />
          </div>
          <SkeletonList count={isMobile ? 4 : 2} />
        </div>
      </MainLayout>
    );
  }

  if (error) {
    return (
      <MainLayout user={user}>
        <ErrorBoundary>
          <div className="min-h-[400px] flex items-center justify-center">
            <div className="text-center space-y-4">
              <p className="text-destructive">{error}</p>
              <button 
                onClick={() => window.location.reload()} 
                className="text-primary hover:underline"
              >
                Try refreshing the page
              </button>
            </div>
          </div>
        </ErrorBoundary>
      </MainLayout>
    );
  }

  return (
    <ErrorBoundary>
      <MainLayout user={user}>
        <div className="space-y-6 animate-fade-in">
          <div className={isMobile ? 'text-center' : ''}>
            <h1 className={`font-bold text-gray-900 transition-all duration-300 ${isMobile ? 'text-2xl' : 'text-3xl'}`}>
              Welcome back, {profile?.name}!
            </h1>
            <p className={`text-gray-600 transition-all duration-300 ${isMobile ? 'text-sm' : ''}`}>
              Ready to continue your learning journey?
            </p>
          </div>

          {/* Progress Tracker - Full Width */}
          <div className="animate-scale-in" style={{animationDelay: '0.1s'}}>
            <ProgressTracker userId={user.id} userProfile={profile} />
          </div>

          {/* Achievement System - Full Width */}
          <div className="animate-scale-in" style={{animationDelay: '0.15s'}}>
            <AchievementSystem userId={user.id} userProfile={profile} analytics={analytics} />
          </div>

          {/* Collaboration Hub - Full Width */}
          <div className="animate-scale-in" style={{animationDelay: '0.2s'}}>
            <CollaborationHub userId={user.id} userProfile={profile} />
          </div>

                  {/* Learning Analytics - Full Width */}
        <div className="animate-scale-in" style={{animationDelay: '0.25s'}}>
          <LearningAnalytics userId={user.id} userProfile={profile} />
        </div>

        {/* Performance Optimizer - Full Width */}
        <div className="animate-scale-in" style={{animationDelay: '0.3s'}}>
          <PerformanceOptimizer />
        </div>

        {/* Advanced Gamification - Full Width */}
        <div className="animate-scale-in" style={{animationDelay: '0.35s'}}>
          <AdvancedGamification userId={user.id} userProfile={profile} />
        </div>



        {/* Advanced Analytics - Full Width */}
        <div className="animate-scale-in" style={{animationDelay: '0.45s'}}>
          <AdvancedAnalytics userId={user.id} userProfile={profile} />
        </div>

          <div className={`grid gap-6 transition-all duration-300 ${
            isMobile 
              ? 'grid-cols-1' 
              : 'grid-cols-1 lg:grid-cols-3'
          }`}>
            {isMobile ? (
              <>
                <div className="animate-scale-in" style={{animationDelay: '0.3s'}}>
                  <StreakCard profile={profile} />
                </div>
                <div className="animate-scale-in" style={{animationDelay: '0.4s'}}>
                  <ScheduleCard userId={user.id} />
                </div>
                <div className="animate-scale-in" style={{animationDelay: '0.5s'}}>
                  <AssignmentsCard userId={user.id} />
                </div>
                <div className="animate-scale-in" style={{animationDelay: '0.6s'}}>
                  <BatchLeaderboardCard profile={profile} />
                </div>
              </>
            ) : (
              <>
                <div className="lg:col-span-2 space-y-6">
                  <div className="animate-scale-in" style={{animationDelay: '0.3s'}}>
                    <ScheduleCard userId={user.id} />
                  </div>
                  <div className="animate-scale-in" style={{animationDelay: '0.4s'}}>
                    <AssignmentsCard userId={user.id} />
                  </div>
                </div>
                
                <div className="space-y-6">
                  <div className="animate-scale-in" style={{animationDelay: '0.5s'}}>
                    <StreakCard profile={profile} />
                  </div>
                  <div className="animate-scale-in" style={{animationDelay: '0.6s'}}>
                    <BatchLeaderboardCard profile={profile} />
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </MainLayout>
    </ErrorBoundary>
  );
};
