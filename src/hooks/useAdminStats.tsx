
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

export const useAdminStats = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['admin-stats'],
    queryFn: async () => {
      if (!user) throw new Error('User not authenticated');

      // Get total students
      const { count: totalStudents } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true });

      // Get active courses
      const { count: activeCourses } = await supabase
        .from('courses')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'published');

      // Get total completions
      const { count: totalCompletions } = await supabase
        .from('user_progress')
        .select('*', { count: 'exact', head: true })
        .eq('completed', true);

      // Get recent activities
      const { data: recentActivities } = await supabase
        .from('user_progress')
        .select(`
          *,
          profiles:user_id (full_name),
          lessons:lesson_id (title, type, xp_reward)
        `)
        .eq('completed', true)
        .order('completed_at', { ascending: false })
        .limit(5);

      // Get course performance
      const { data: coursePerformance } = await supabase
        .from('courses')
        .select(`
          *,
          modules (
            lessons (
              user_progress (completed)
            )
          )
        `)
        .eq('status', 'published')
        .limit(3);

      return {
        totalStudents: totalStudents || 0,
        activeCourses: activeCourses || 0,
        totalCompletions: totalCompletions || 0,
        avgEngagement: 78, // Calculate this based on actual data later
        recentActivities: recentActivities || [],
        coursePerformance: coursePerformance || []
      };
    },
    enabled: !!user
  });
};
