import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import BadgeDisplay from './BadgeDisplay';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Award, Lock, Trophy } from 'lucide-react';

interface BadgeWithEarned {
  id: string;
  name: string;
  description: string | null;
  icon: string | null;
  condition_type: string;
  condition_value: number;
  earned_at?: string;
  earned: boolean;
}

const BadgeShowcase = () => {
  const { user } = useAuth();

  const { data: badgesData, isLoading } = useQuery({
    queryKey: ['badges-showcase', user?.id],
    queryFn: async () => {
      // Get all badges
      const { data: allBadges, error: badgesError } = await supabase
        .from('badges')
        .select('*')
        .order('condition_value', { ascending: true });

      if (badgesError) throw badgesError;

      // Get user's earned badges
      const { data: userBadges, error: userBadgesError } = await supabase
        .from('user_badges')
        .select('badge_id, earned_at')
        .eq('user_id', user?.id);

      if (userBadgesError) throw userBadgesError;

      // Combine data
      const badgesWithEarned: BadgeWithEarned[] = allBadges.map(badge => {
        const earnedBadge = userBadges?.find(ub => ub.badge_id === badge.id);
        return {
          ...badge,
          earned: !!earnedBadge,
          earned_at: earnedBadge?.earned_at
        };
      });

      return {
        badges: badgesWithEarned,
        earnedCount: userBadges?.length || 0,
        totalCount: allBadges.length
      };
    },
    enabled: !!user?.id
  });

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="h-32 bg-muted rounded-lg animate-pulse" />
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="h-40 bg-muted rounded-lg animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  const earnedBadges = badgesData?.badges.filter(b => b.earned) || [];
  const unEarnedBadges = badgesData?.badges.filter(b => !b.earned) || [];
  const progressPercentage = badgesData ? (badgesData.earnedCount / badgesData.totalCount) * 100 : 0;

  return (
    <div className="space-y-6">
      {/* Progress Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Award className="w-5 h-5 text-primary" />
            Badge Collection Progress
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">
                {badgesData?.earnedCount} of {badgesData?.totalCount} badges earned
              </span>
              <span className="text-sm font-medium">
                {Math.round(progressPercentage)}%
              </span>
            </div>
            <Progress value={progressPercentage} className="h-2" />
          </div>
        </CardContent>
      </Card>

      {/* Badge Tabs */}
      <Tabs defaultValue="earned" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="earned" className="flex items-center gap-2">
            <Award className="w-4 h-4" />
            Earned ({earnedBadges.length})
          </TabsTrigger>
          <TabsTrigger value="available" className="flex items-center gap-2">
            <Lock className="w-4 h-4" />
            Available ({unEarnedBadges.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="earned" className="mt-6">
          {earnedBadges.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {earnedBadges.map((badge) => (
                <BadgeDisplay
                  key={badge.id}
                  badge={badge}
                  earned={true}
                  size="md"
                  showDescription={true}
                />
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="py-12 text-center">
                <Award className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-muted-foreground mb-2">
                  No badges earned yet
                </h3>
                <p className="text-muted-foreground">
                  Start learning to earn your first badge!
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="available" className="mt-6">
          {unEarnedBadges.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {unEarnedBadges.map((badge) => (
                <BadgeDisplay
                  key={badge.id}
                  badge={badge}
                  earned={false}
                  size="md"
                  showDescription={true}
                />
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="py-12 text-center">
                <Trophy className="w-16 h-16 text-primary mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">
                  All badges earned!
                </h3>
                <p className="text-muted-foreground">
                  Congratulations! You've earned every available badge.
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default BadgeShowcase;