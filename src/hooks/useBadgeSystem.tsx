import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { useState, useCallback } from 'react';

interface Badge {
  id: string;
  name: string;
  description: string | null;
  icon: string | null;
  condition_type: string;
  condition_value: number;
}

interface UserBadge {
  id: string;
  badge_id: string;
  earned_at: string;
  badge: Badge;
}

interface Achievement {
  id: string;
  type: 'badge' | 'xp' | 'streak' | 'completion';
  title: string;
  description: string;
  icon?: string;
  timestamp: Date;
}

export const useBadgeSystem = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [currentAchievement, setCurrentAchievement] = useState<Achievement | null>(null);

  // Get user's earned badges
  const { data: userBadges, isLoading: isLoadingUserBadges } = useQuery({
    queryKey: ['userBadges', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('user_badges')
        .select(`
          id,
          badge_id,
          earned_at,
          badge:badges(*)
        `)
        .eq('user_id', user?.id)
        .order('earned_at', { ascending: false });

      if (error) throw error;
      return data as UserBadge[];
    },
    enabled: !!user?.id
  });

  // Get all available badges
  const { data: allBadges, isLoading: isLoadingAllBadges } = useQuery({
    queryKey: ['badges'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('badges')
        .select('*')
        .order('condition_value', { ascending: true });

      if (error) throw error;
      return data as Badge[];
    }
  });

  // Get user's current stats for badge checking
  const { data: userStats } = useQuery({
    queryKey: ['userStats', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;

      // Get total XP
      const { data: xpData } = await supabase
        .from('user_xp')
        .select('amount')
        .eq('user_id', user.id);

      const totalXP = xpData?.reduce((sum, record) => sum + record.amount, 0) || 0;

      // Get current streak
      const { data: streakData } = await supabase
        .from('streaks')
        .select('current_streak')
        .eq('user_id', user.id)
        .single();

      // Get completed courses count
      const { data: progressData } = await supabase
        .from('user_progress')
        .select('lesson_id, completed')
        .eq('user_id', user.id)
        .eq('completed', true);

      // Get completed quizzes count
      const { data: quizData } = await supabase
        .from('quiz_results')
        .select('id')
        .eq('user_id', user.id);

      return {
        totalXP,
        currentStreak: streakData?.current_streak || 0,
        completedLessons: progressData?.length || 0,
        completedQuizzes: quizData?.length || 0
      };
    },
    enabled: !!user?.id
  });

  // Award badge mutation
  const awardBadgeMutation = useMutation({
    mutationFn: async (badgeId: string) => {
      const { data, error } = await supabase
        .from('user_badges')
        .insert({
          user_id: user?.id!,
          badge_id: badgeId
        })
        .select('*, badge:badges(*)')
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['userBadges'] });
      
      // Show achievement notification
      const achievement: Achievement = {
        id: data.id,
        type: 'badge',
        title: data.badge.name,
        description: data.badge.description || 'You earned a new badge!',
        timestamp: new Date()
      };
      
      setCurrentAchievement(achievement);
      
      toast({
        title: "🎉 Badge Earned!",
        description: `You've earned the "${data.badge.name}" badge!`,
      });
    }
  });

  // Check for new badges earned
  const checkForNewBadges = useCallback(async () => {
    if (!userStats || !allBadges || !user?.id) return;

    const earnedBadgeIds = userBadges?.map(ub => ub.badge_id) || [];
    
    for (const badge of allBadges) {
      if (earnedBadgeIds.includes(badge.id)) continue;

      let shouldAward = false;

      switch (badge.condition_type) {
        case 'xp':
          shouldAward = userStats.totalXP >= badge.condition_value;
          break;
        case 'streak':
          shouldAward = userStats.currentStreak >= badge.condition_value;
          break;
        case 'courses':
          shouldAward = userStats.completedLessons >= badge.condition_value;
          break;
        case 'quizzes':
          shouldAward = userStats.completedQuizzes >= badge.condition_value;
          break;
      }

      if (shouldAward) {
        awardBadgeMutation.mutate(badge.id);
        break; // Award one badge at a time to avoid spam
      }
    }
  }, [userStats, allBadges, userBadges, user?.id, awardBadgeMutation]);

  // Dismiss achievement notification
  const dismissAchievement = useCallback(() => {
    setCurrentAchievement(null);
  }, []);

  return {
    userBadges: userBadges || [],
    allBadges: allBadges || [],
    userStats,
    isLoading: isLoadingUserBadges || isLoadingAllBadges,
    checkForNewBadges,
    currentAchievement,
    dismissAchievement,
    earnedBadgeIds: userBadges?.map(ub => ub.badge_id) || []
  };
};