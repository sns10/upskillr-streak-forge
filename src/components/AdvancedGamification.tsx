import React, { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Progress } from './ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { 
  Trophy, 
  Crown, 
  Star, 
  Zap, 
  Target, 
  Flame, 
  Gem, 
  Medal,
  TrendingUp,
  Calendar,
  Clock,
  Users,
  Award,
  Gift,
  Sparkles,
  Rocket,
  Lightning,
  Shield,
  Sword,
  Heart
} from 'lucide-react';
import { useToast } from '../hooks/use-toast';

interface Challenge {
  id: string;
  title: string;
  description: string;
  type: 'daily' | 'weekly' | 'monthly' | 'special';
  difficulty: 'easy' | 'medium' | 'hard' | 'legendary';
  progress: number;
  target: number;
  reward: {
    xp: number;
    bits: number;
    badge?: string;
    title?: string;
  };
  deadline?: string;
  completed: boolean;
  streak?: number;
}

interface LeaderboardEntry {
  id: string;
  name: string;
  avatar: string;
  xp: number;
  level: number;
  rank: number;
  streak: number;
  achievements: number;
  isCurrentUser: boolean;
}

interface AdvancedGamificationProps {
  userId: string;
  userProfile: any;
}

export const AdvancedGamification: React.FC<AdvancedGamificationProps> = ({
  userId,
  userProfile
}) => {
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [userStats, setUserStats] = useState({
    totalXp: 0,
    level: 1,
    rank: 0,
    streak: 0,
    achievements: 0,
    challengesCompleted: 0,
    totalChallenges: 0
  });
  const [activeTab, setActiveTab] = useState('challenges');
  const { toast } = useToast();

  useEffect(() => {
    loadChallenges();
    loadLeaderboard();
    loadUserStats();
  }, [userId]);

  const loadChallenges = () => {
    // Generate dynamic challenges based on user progress
    const dynamicChallenges: Challenge[] = [
      // Daily Challenges
      {
        id: 'daily_1',
        title: 'Code Warrior',
        description: 'Complete 3 coding assignments today',
        type: 'daily',
        difficulty: 'easy',
        progress: Math.min(2, userProfile?.daily_assignments || 0),
        target: 3,
        reward: { xp: 50, bits: 25 },
        completed: (userProfile?.daily_assignments || 0) >= 3
      },
      {
        id: 'daily_2',
        title: 'Streak Master',
        description: 'Maintain your learning streak',
        type: 'daily',
        difficulty: 'medium',
        progress: userProfile?.streak || 0,
        target: 7,
        reward: { xp: 100, bits: 50, badge: 'streak_master' },
        completed: (userProfile?.streak || 0) >= 7
      },
      {
        id: 'daily_3',
        title: 'Speed Coder',
        description: 'Complete an assignment in under 5 minutes',
        type: 'daily',
        difficulty: 'hard',
        progress: 0,
        target: 1,
        reward: { xp: 200, bits: 100, title: 'Speed Demon' },
        completed: false
      },

      // Weekly Challenges
      {
        id: 'weekly_1',
        title: 'Course Conqueror',
        description: 'Complete 5 lessons this week',
        type: 'weekly',
        difficulty: 'medium',
        progress: Math.min(3, userProfile?.weekly_lessons || 0),
        target: 5,
        reward: { xp: 300, bits: 150, badge: 'course_conqueror' },
        completed: (userProfile?.weekly_lessons || 0) >= 5
      },
      {
        id: 'weekly_2',
        title: 'Perfect Score',
        description: 'Get 100% on 3 assignments',
        type: 'weekly',
        difficulty: 'hard',
        progress: 0,
        target: 3,
        reward: { xp: 500, bits: 250, title: 'Perfectionist' },
        completed: false
      },

      // Monthly Challenges
      {
        id: 'monthly_1',
        title: 'Learning Legend',
        description: 'Complete 50 lessons this month',
        type: 'monthly',
        difficulty: 'legendary',
        progress: Math.min(25, userProfile?.monthly_lessons || 0),
        target: 50,
        reward: { xp: 1000, bits: 500, badge: 'learning_legend', title: 'Legend' },
        completed: (userProfile?.monthly_lessons || 0) >= 50
      },

      // Special Challenges
      {
        id: 'special_1',
        title: 'Community Champion',
        description: 'Help 10 other learners',
        type: 'special',
        difficulty: 'medium',
        progress: 0,
        target: 10,
        reward: { xp: 400, bits: 200, badge: 'community_champion' },
        completed: false
      },
      {
        id: 'special_2',
        title: 'Innovation Master',
        description: 'Create 5 unique solutions',
        type: 'special',
        difficulty: 'hard',
        progress: 0,
        target: 5,
        reward: { xp: 600, bits: 300, title: 'Innovator' },
        completed: false
      }
    ];

    setChallenges(dynamicChallenges);
  };

  const loadLeaderboard = () => {
    // Mock leaderboard data
    const mockLeaderboard: LeaderboardEntry[] = [
      {
        id: '1',
        name: 'Alex Chen',
        avatar: '/placeholder.svg',
        xp: 15420,
        level: 25,
        rank: 1,
        streak: 45,
        achievements: 28,
        isCurrentUser: false
      },
      {
        id: '2',
        name: 'Sarah Johnson',
        avatar: '/placeholder.svg',
        xp: 12850,
        level: 22,
        rank: 2,
        streak: 32,
        achievements: 24,
        isCurrentUser: false
      },
      {
        id: userId,
        name: userProfile?.full_name || 'You',
        avatar: userProfile?.avatar_url || '/placeholder.svg',
        xp: userProfile?.total_xp || 0,
        level: userProfile?.level || 1,
        rank: 3,
        streak: userProfile?.streak || 0,
        achievements: userProfile?.achievements_count || 0,
        isCurrentUser: true
      },
      {
        id: '4',
        name: 'Mike Rodriguez',
        avatar: '/placeholder.svg',
        xp: 9850,
        level: 18,
        rank: 4,
        streak: 28,
        achievements: 20,
        isCurrentUser: false
      },
      {
        id: '5',
        name: 'Emma Wilson',
        avatar: '/placeholder.svg',
        xp: 8750,
        level: 16,
        rank: 5,
        streak: 25,
        achievements: 18,
        isCurrentUser: false
      }
    ];

    setLeaderboard(mockLeaderboard.sort((a, b) => b.xp - a.xp));
  };

  const loadUserStats = () => {
    setUserStats({
      totalXp: userProfile?.total_xp || 0,
      level: userProfile?.level || 1,
      rank: 3,
      streak: userProfile?.streak || 0,
      achievements: userProfile?.achievements_count || 0,
      challengesCompleted: challenges.filter(c => c.completed).length,
      totalChallenges: challenges.length
    });
  };

  const claimReward = (challenge: Challenge) => {
    if (challenge.completed && challenge.progress >= challenge.target) {
      // Simulate claiming reward
      toast({
        title: "Reward Claimed! 🎉",
        description: `You earned ${challenge.reward.xp} XP and ${challenge.reward.bits} Bits!`,
      });

      // Update challenge status
      setChallenges(prev => prev.map(c => 
        c.id === challenge.id ? { ...c, completed: false, progress: 0 } : c
      ));
    }
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'easy': return 'text-green-600 bg-green-100';
      case 'medium': return 'text-yellow-600 bg-yellow-100';
      case 'hard': return 'text-orange-600 bg-orange-100';
      case 'legendary': return 'text-purple-600 bg-purple-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getDifficultyIcon = (difficulty: string) => {
    switch (difficulty) {
      case 'easy': return <Star className="h-4 w-4" />;
      case 'medium': return <Target className="h-4 w-4" />;
      case 'hard': return <Flame className="h-4 w-4" />;
      case 'legendary': return <Crown className="h-4 w-4" />;
      default: return <Star className="h-4 w-4" />;
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'daily': return <Calendar className="h-4 w-4" />;
      case 'weekly': return <Clock className="h-4 w-4" />;
      case 'monthly': return <TrendingUp className="h-4 w-4" />;
      case 'special': return <Sparkles className="h-4 w-4" />;
      default: return <Target className="h-4 w-4" />;
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Trophy className="h-5 w-5" />
          Advanced Gamification
        </CardTitle>
      </CardHeader>

      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="challenges">Challenges</TabsTrigger>
            <TabsTrigger value="leaderboard">Leaderboard</TabsTrigger>
            <TabsTrigger value="stats">Stats</TabsTrigger>
          </TabsList>

          {/* Challenges Tab */}
          <TabsContent value="challenges" className="space-y-4">
            <div className="grid gap-4">
              {challenges.map((challenge) => (
                <Card key={challenge.id} className="relative overflow-hidden">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-2">
                        {getTypeIcon(challenge.type)}
                        <Badge className={getDifficultyColor(challenge.difficulty)}>
                          {getDifficultyIcon(challenge.difficulty)}
                          <span className="ml-1 capitalize">{challenge.difficulty}</span>
                        </Badge>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-medium">
                          {challenge.progress}/{challenge.target}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {Math.round((challenge.progress / challenge.target) * 100)}%
                        </div>
                      </div>
                    </div>

                    <h3 className="font-semibold mb-2">{challenge.title}</h3>
                    <p className="text-sm text-muted-foreground mb-3">
                      {challenge.description}
                    </p>

                    <Progress 
                      value={(challenge.progress / challenge.target) * 100} 
                      className="h-2 mb-3"
                    />

                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-sm">
                        <span className="text-green-600">+{challenge.reward.xp} XP</span>
                        <span className="text-blue-600">+{challenge.reward.bits} Bits</span>
                        {challenge.reward.badge && (
                          <Badge variant="outline" className="text-xs">
                            <Gem className="h-3 w-3 mr-1" />
                            Badge
                          </Badge>
                        )}
                      </div>

                      <Button
                        size="sm"
                        onClick={() => claimReward(challenge)}
                        disabled={!challenge.completed || challenge.progress < challenge.target}
                        className={challenge.completed ? 'bg-green-600 hover:bg-green-700' : ''}
                      >
                        {challenge.completed ? (
                          <>
                            <Gift className="h-4 w-4 mr-2" />
                            Claim Reward
                          </>
                        ) : (
                          <>
                            <Target className="h-4 w-4 mr-2" />
                            In Progress
                          </>
                        )}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Leaderboard Tab */}
          <TabsContent value="leaderboard" className="space-y-4">
            <div className="space-y-3">
              {leaderboard.map((entry, index) => (
                <div
                  key={entry.id}
                  className={`flex items-center gap-4 p-4 rounded-lg border ${
                    entry.isCurrentUser 
                      ? 'bg-blue-50 border-blue-200' 
                      : 'bg-white border-gray-200'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      {index < 3 && (
                        <div className="absolute -top-2 -right-2">
                          {index === 0 && <Crown className="h-5 w-5 text-yellow-500" />}
                          {index === 1 && <Medal className="h-5 w-5 text-gray-400" />}
                          {index === 2 && <Award className="h-5 w-5 text-orange-500" />}
                        </div>
                      )}
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={entry.avatar} />
                        <AvatarFallback>{entry.name.charAt(0)}</AvatarFallback>
                      </Avatar>
                    </div>
                    
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{entry.name}</span>
                        {entry.isCurrentUser && (
                          <Badge variant="outline" className="text-xs">
                            You
                          </Badge>
                        )}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        Level {entry.level} • {entry.achievements} achievements
                      </div>
                    </div>
                  </div>

                  <div className="ml-auto text-right">
                    <div className="font-semibold text-lg">{entry.xp.toLocaleString()} XP</div>
                    <div className="text-sm text-muted-foreground">
                      #{entry.rank} • {entry.streak} day streak
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </TabsContent>

          {/* Stats Tab */}
          <TabsContent value="stats" className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <Card>
                <CardContent className="p-4 text-center">
                  <div className="text-2xl font-bold text-blue-600 mb-2">
                    {userStats.totalXp.toLocaleString()}
                  </div>
                  <div className="text-sm text-muted-foreground">Total XP</div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4 text-center">
                  <div className="text-2xl font-bold text-green-600 mb-2">
                    {userStats.level}
                  </div>
                  <div className="text-sm text-muted-foreground">Level</div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4 text-center">
                  <div className="text-2xl font-bold text-orange-600 mb-2">
                    #{userStats.rank}
                  </div>
                  <div className="text-sm text-muted-foreground">Global Rank</div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4 text-center">
                  <div className="text-2xl font-bold text-purple-600 mb-2">
                    {userStats.streak}
                  </div>
                  <div className="text-sm text-muted-foreground">Day Streak</div>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardContent className="p-4">
                <h3 className="font-semibold mb-3">Challenge Progress</h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Challenges Completed</span>
                    <span className="font-medium">{userStats.challengesCompleted}/{userStats.totalChallenges}</span>
                  </div>
                  <Progress 
                    value={(userStats.challengesCompleted / userStats.totalChallenges) * 100} 
                    className="h-2"
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <h3 className="font-semibold mb-3">Recent Achievements</h3>
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm">
                    <Trophy className="h-4 w-4 text-yellow-500" />
                    <span>First Assignment Completed</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Flame className="h-4 w-4 text-orange-500" />
                    <span>7-Day Streak Achieved</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Star className="h-4 w-4 text-blue-500" />
                    <span>Perfect Score on Python Basics</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}; 