import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { 
  Trophy, 
  Star, 
  Zap, 
  Target, 
  Award, 
  CheckCircle, 
  Clock, 
  TrendingUp,
  BookOpen,
  Code,
  HelpCircle,
  Flame,
  Crown,
  Gem,
  Medal,
  Shield,
  Rocket,
  Brain,
  Heart
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  category: 'streak' | 'progress' | 'performance' | 'social' | 'special';
  requirement: number;
  current: number;
  completed: boolean;
  xpReward: number;
  bitsReward: number;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  unlockedAt?: string;
}

interface AchievementSystemProps {
  userId: string;
  userProfile: any;
  analytics: any;
}

export const AchievementSystem = ({ userId, userProfile, analytics }: AchievementSystemProps) => {
  const { toast } = useToast();
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [loading, setLoading] = useState(true);
  const [showUnlocked, setShowUnlocked] = useState(false);
  const [newAchievement, setNewAchievement] = useState<Achievement | null>(null);
  const [awardedAchievements, setAwardedAchievements] = useState<string[]>([]);

  useEffect(() => {
    loadAchievements();
  }, [userId, userProfile, analytics]);

  useEffect(() => {
    loadAwardedAchievements();
  }, [userId]);

  const loadAwardedAchievements = async () => {
    try {
      // Use a more robust approach to prevent duplicate awards
      const stored = localStorage.getItem(`achievements_${userId}`);
      const sessionKey = `achievement_session_${userId}`;
      const sessionStored = sessionStorage.getItem(sessionKey);
      
      let awardedIds: string[] = [];
      
      if (stored) {
        awardedIds = JSON.parse(stored);
      }
      
      // If this is a new session, check if we've already awarded achievements today
      if (!sessionStored) {
        const today = new Date().toDateString();
        const lastAwardDate = localStorage.getItem(`last_award_date_${userId}`);
        
        if (lastAwardDate === today) {
          // We've already awarded achievements today, don't award again
          console.log('Achievements already awarded today, skipping...');
        }
        
        // Mark this session as processed
        sessionStorage.setItem(sessionKey, 'true');
      }
      
      setAwardedAchievements(awardedIds);
    } catch (error) {
      console.error('Error loading awarded achievements:', error);
    }
  };

  const loadAchievements = async () => {
    try {
      setLoading(true);
      
      // Define all possible achievements
      const allAchievements: Achievement[] = [
        // Streak Achievements
        {
          id: 'streak_7',
          title: 'Week Warrior',
          description: 'Maintain a 7-day learning streak',
          icon: 'flame',
          category: 'streak',
          requirement: 7,
          current: userProfile?.streak || 0,
          completed: (userProfile?.streak || 0) >= 7,
          xpReward: 100,
          bitsReward: 50,
          rarity: 'common'
        },
        {
          id: 'streak_30',
          title: 'Monthly Master',
          description: 'Maintain a 30-day learning streak',
          icon: 'crown',
          category: 'streak',
          requirement: 30,
          current: userProfile?.streak || 0,
          completed: (userProfile?.streak || 0) >= 30,
          xpReward: 500,
          bitsReward: 250,
          rarity: 'rare'
        },
        {
          id: 'streak_100',
          title: 'Century Scholar',
          description: 'Maintain a 100-day learning streak',
          icon: 'gem',
          category: 'streak',
          requirement: 100,
          current: userProfile?.streak || 0,
          completed: (userProfile?.streak || 0) >= 100,
          xpReward: 2000,
          bitsReward: 1000,
          rarity: 'legendary'
        },

        // Progress Achievements
        {
          id: 'lessons_10',
          title: 'Lesson Learner',
          description: 'Complete 10 lessons',
          icon: 'book-open',
          category: 'progress',
          requirement: 10,
          current: analytics?.completed_lessons || 0,
          completed: (analytics?.completed_lessons || 0) >= 10,
          xpReward: 150,
          bitsReward: 75,
          rarity: 'common'
        },
        {
          id: 'lessons_50',
          title: 'Knowledge Seeker',
          description: 'Complete 50 lessons',
          icon: 'target',
          category: 'progress',
          requirement: 50,
          current: analytics?.completed_lessons || 0,
          completed: (analytics?.completed_lessons || 0) >= 50,
          xpReward: 750,
          bitsReward: 375,
          rarity: 'rare'
        },
        {
          id: 'lessons_100',
          title: 'Learning Legend',
          description: 'Complete 100 lessons',
          icon: 'trophy',
          category: 'progress',
          requirement: 100,
          current: analytics?.completed_lessons || 0,
          completed: (analytics?.completed_lessons || 0) >= 100,
          xpReward: 1500,
          bitsReward: 750,
          rarity: 'epic'
        },

        // Performance Achievements
        {
          id: 'perfect_score',
          title: 'Perfect Score',
          description: 'Get 100% on a quiz',
          icon: 'star',
          category: 'performance',
          requirement: 1,
          current: analytics?.perfect_scores || 0,
          completed: (analytics?.perfect_scores || 0) >= 1,
          xpReward: 200,
          bitsReward: 100,
          rarity: 'rare'
        },
        {
          id: 'success_rate_90',
          title: 'High Achiever',
          description: 'Maintain 90% success rate',
          icon: 'trending-up',
          category: 'performance',
          requirement: 90,
          current: analytics?.success_rate || 0,
          completed: (analytics?.success_rate || 0) >= 90,
          xpReward: 300,
          bitsReward: 150,
          rarity: 'epic'
        },
        {
          id: 'first_assignment',
          title: 'First Steps',
          description: 'Complete your first coding assignment',
          icon: 'code',
          category: 'progress',
          requirement: 1,
          current: analytics?.correct_assignments || 0,
          completed: (analytics?.correct_assignments || 0) >= 1,
          xpReward: 50,
          bitsReward: 25,
          rarity: 'common'
        },

        // Special Achievements
        {
          id: 'early_bird',
          title: 'Early Bird',
          description: 'Complete a lesson before 9 AM',
          icon: 'clock',
          category: 'special',
          requirement: 1,
          current: 0, // This would need special tracking
          completed: false,
          xpReward: 100,
          bitsReward: 50,
          rarity: 'common'
        },
        {
          id: 'speed_demon',
          title: 'Speed Demon',
          description: 'Complete 5 assignments in one day',
          icon: 'lightning',
          category: 'special',
          requirement: 5,
          current: 0, // This would need special tracking
          completed: false,
          xpReward: 250,
          bitsReward: 125,
          rarity: 'rare'
        }
      ];

      // Check for newly unlocked achievements that haven't been awarded yet
      const newlyUnlocked = allAchievements.filter(achievement => 
        achievement.completed && !awardedAchievements.includes(achievement.id)
      );

      // Additional checks to prevent duplicate awards
      const today = new Date().toDateString();
      const lastAwardDate = localStorage.getItem(`last_award_date_${userId}`);
      const hasAwardedToday = lastAwardDate === today;
      const sessionKey = `achievement_session_${userId}`;
      const sessionProcessed = sessionStorage.getItem(sessionKey);

      // Only award if:
      // 1. There are newly unlocked achievements
      // 2. We haven't awarded anything today
      // 3. This session hasn't already processed achievements
      if (newlyUnlocked.length > 0 && !hasAwardedToday && !sessionProcessed) {
        const latest = newlyUnlocked[0];
        setNewAchievement(latest);
        setShowUnlocked(true);
        
        // Award XP and Bits
        await awardAchievement(latest);
        
        // Mark this session as processed
        sessionStorage.setItem(sessionKey, 'true');
      } else if (newlyUnlocked.length > 0 && (hasAwardedToday || sessionProcessed)) {
        console.log('Achievements already processed, skipping automatic award');
        console.log('Has awarded today:', hasAwardedToday);
        console.log('Session processed:', sessionProcessed);
      }

      setAchievements(allAchievements);
    } catch (error) {
      console.error('Error loading achievements:', error);
    } finally {
      setLoading(false);
    }
  };

  const awardAchievement = async (achievement: Achievement) => {
    try {
      // Check if achievement is already awarded
      if (awardedAchievements.includes(achievement.id)) {
        return;
      }

      // Update user profile with new XP and Bits
      const { error } = await supabase
        .from('user_profiles')
        .update({
          xp: (userProfile?.xp || 0) + achievement.xpReward,
          bits: (userProfile?.bits || 0) + achievement.bitsReward,
          updated_at: new Date().toISOString()
        })
        .eq('id', userId);

      if (error) throw error;

      // Record the achievement unlock
      await supabase
        .from('student_activities')
        .insert({
          student_id: userId,
          activity_type: 'achievement_unlocked',
          activity_data: {
            achievement_id: achievement.id,
            achievement_title: achievement.title,
            xp_awarded: achievement.xpReward,
            bits_awarded: achievement.bitsReward
          }
        });

      // Mark achievement as awarded locally
      const newAwarded = [...awardedAchievements, achievement.id];
      setAwardedAchievements(newAwarded);
      localStorage.setItem(`achievements_${userId}`, JSON.stringify(newAwarded));
      
      // Track the date when achievement was awarded
      const today = new Date().toDateString();
      localStorage.setItem(`last_award_date_${userId}`, today);

      // Show success toast
      toast({
        title: "Achievement Unlocked! 🎉",
        description: `You earned ${achievement.xpReward} XP and ${achievement.bitsReward} Bits for ${achievement.title}!`,
      });

    } catch (error) {
      console.error('Error awarding achievement:', error);
    }
  };

  const getIconComponent = (iconName: string) => {
    const iconMap: { [key: string]: any } = {
      trophy: Trophy,
      star: Star,
      zap: Zap,
      target: Target,
      award: Award,
      checkCircle: CheckCircle,
      clock: Clock,
      trendingUp: TrendingUp,
      bookOpen: BookOpen,
      code: Code,
      helpCircle: HelpCircle,
      flame: Flame,
      crown: Crown,
      gem: Gem,
      medal: Medal,
      shield: Shield,
             lightning: Zap,
      rocket: Rocket,
      brain: Brain,
      heart: Heart
    };
    
    const IconComponent = iconMap[iconName] || Trophy;
    return <IconComponent className="h-6 w-6" />;
  };

  const getRarityColor = (rarity: string) => {
    switch (rarity) {
      case 'common': return 'text-gray-600 bg-gray-100';
      case 'rare': return 'text-blue-600 bg-blue-100';
      case 'epic': return 'text-purple-600 bg-purple-100';
      case 'legendary': return 'text-yellow-600 bg-yellow-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getRarityBorder = (rarity: string) => {
    switch (rarity) {
      case 'common': return 'border-gray-200';
      case 'rare': return 'border-blue-200';
      case 'epic': return 'border-purple-200';
      case 'legendary': return 'border-yellow-200';
      default: return 'border-gray-200';
    }
  };

  const completedAchievements = achievements.filter(a => a.completed);
  const totalAchievements = achievements.length;
  const completionRate = totalAchievements > 0 ? (completedAchievements.length / totalAchievements) * 100 : 0;

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Trophy className="h-5 w-5" />
          Achievements & Badges
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              localStorage.removeItem(`achievements_${userId}`);
              localStorage.removeItem(`last_award_date_${userId}`);
              sessionStorage.removeItem(`achievement_session_${userId}`);
              setAwardedAchievements([]);
              toast({
                title: "Tracking Reset",
                description: "Achievement tracking has been cleared.",
              });
            }}
            className="ml-auto text-xs"
          >
            Reset Tracking
          </Button>
        </CardTitle>
        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          <span>{completedAchievements.length} of {totalAchievements} unlocked</span>
          <Progress value={completionRate} className="w-32 h-2" />
          <span>{Math.round(completionRate)}%</span>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading achievements...</p>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Achievement Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {achievements.map((achievement) => (
                <div
                  key={achievement.id}
                  className={`p-4 rounded-lg border transition-all ${
                    achievement.completed 
                      ? 'bg-gradient-to-br from-green-50 to-green-100 border-green-200 shadow-sm' 
                      : 'bg-gray-50 border-gray-200'
                  } ${getRarityBorder(achievement.rarity)}`}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className={`p-2 rounded-lg ${
                      achievement.completed 
                        ? 'bg-green-200 text-green-700' 
                        : 'bg-gray-200 text-gray-600'
                    }`}>
                      {getIconComponent(achievement.icon)}
                    </div>
                    <Badge className={getRarityColor(achievement.rarity)}>
                      {achievement.rarity}
                    </Badge>
                  </div>
                  
                  <h3 className={`font-semibold mb-1 ${
                    achievement.completed ? 'text-green-800' : 'text-gray-800'
                  }`}>
                    {achievement.title}
                  </h3>
                  
                  <p className="text-sm text-muted-foreground mb-3">
                    {achievement.description}
                  </p>
                  
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Progress</span>
                      <span className="font-medium">
                        {achievement.current}/{achievement.requirement}
                      </span>
                    </div>
                    <Progress 
                      value={(achievement.current / achievement.requirement) * 100} 
                      className="h-2"
                    />
                  </div>
                  
                  {achievement.completed && (
                    <div className="mt-3 pt-3 border-t border-green-200">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-green-700 font-medium">
                          {awardedAchievements.includes(achievement.id) ? 'Awarded' : 'Rewards:'}
                        </span>
                        <div className="flex items-center gap-2">
                          <span className="text-green-600">+{achievement.xpReward} XP</span>
                          <span className="text-blue-600">+{achievement.bitsReward} Bits</span>
                        </div>
                      </div>
                      {awardedAchievements.includes(achievement.id) && (
                        <div className="mt-2 text-xs text-green-600 flex items-center gap-1">
                          <CheckCircle className="h-3 w-3" />
                          Already claimed
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Achievement Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t">
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">
                  {completedAchievements.length}
                </div>
                <div className="text-sm text-muted-foreground">Unlocked</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">
                  {achievements.filter(a => a.rarity === 'rare' && a.completed).length}
                </div>
                <div className="text-sm text-muted-foreground">Rare</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600">
                  {achievements.filter(a => a.rarity === 'epic' && a.completed).length}
                </div>
                <div className="text-sm text-muted-foreground">Epic</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-yellow-600">
                  {achievements.filter(a => a.rarity === 'legendary' && a.completed).length}
                </div>
                <div className="text-sm text-muted-foreground">Legendary</div>
              </div>
            </div>
          </div>
        )}

        {/* Achievement Unlocked Modal */}
        {showUnlocked && newAchievement && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-md mx-4 text-center">
              <div className="text-6xl mb-4">🎉</div>
              <h3 className="text-xl font-bold mb-2">Achievement Unlocked!</h3>
              <div className="text-2xl mb-4">{newAchievement.title}</div>
              <p className="text-muted-foreground mb-4">{newAchievement.description}</p>
              <div className="flex items-center justify-center gap-4 mb-4">
                <Badge className="bg-green-100 text-green-700">
                  +{newAchievement.xpReward} XP
                </Badge>
                <Badge className="bg-blue-100 text-blue-700">
                  +{newAchievement.bitsReward} Bits
                </Badge>
              </div>
              <Button onClick={() => setShowUnlocked(false)}>
                Awesome!
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}; 