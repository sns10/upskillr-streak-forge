import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Trophy, CheckCircle, Play, Award } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

interface Lesson {
  id: string;
  title: string;
  description: string;
  type: 'video' | 'quiz' | 'assignment';
  content_url: string;
  xp_reward: number;
  module: {
    id: string;
    title: string;
    course: {
      id: string;
      title: string;
    };
  };
}

const LessonPlayer = () => {
  const { lessonId } = useParams<{ lessonId: string }>();
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [watchPercentage, setWatchPercentage] = useState(0);
  const [isCompleted, setIsCompleted] = useState(false);
  const playerRef = useRef<any>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const { data: lesson, isLoading } = useQuery({
    queryKey: ['lesson', lessonId],
    queryFn: async () => {
      if (!lessonId) throw new Error('Lesson ID is required');

      const { data, error } = await supabase
        .from('lessons')
        .select(`
          id,
          title,
          description,
          type,
          content_url,
          xp_reward,
          module:modules (
            id,
            title,
            course:courses (
              id,
              title
            )
          )
        `)
        .eq('id', lessonId)
        .single();

      if (error) throw error;
      return data as Lesson;
    },
    enabled: !!lessonId
  });

  const { data: progress } = useQuery({
    queryKey: ['lesson-progress', lessonId, user?.id],
    queryFn: async () => {
      if (!user || !lessonId) return null;

      const { data, error } = await supabase
        .from('user_progress')
        .select('completed, watch_percentage')
        .eq('user_id', user.id)
        .eq('lesson_id', lessonId)
        .maybeSingle();

      if (error) throw error;
      return data;
    },
    enabled: !!user && !!lessonId
  });

  const updateProgressMutation = useMutation({
    mutationFn: async ({ watchPercentage, completed }: { watchPercentage: number; completed: boolean }) => {
      if (!user || !lessonId) throw new Error('User and lesson required');

      const { error } = await supabase
        .from('user_progress')
        .upsert({
          user_id: user.id,
          lesson_id: lessonId,
          watch_percentage: watchPercentage,
          completed,
          completed_at: completed ? new Date().toISOString() : null
        });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lesson-progress', lessonId, user?.id] });
      queryClient.invalidateQueries({ queryKey: ['user-xp', user?.id] });
      queryClient.invalidateQueries({ queryKey: ['course-detail'] });
    }
  });

  const awardXPMutation = useMutation({
    mutationFn: async () => {
      if (!user || !lessonId || !lesson) throw new Error('Missing required data');

      const { error } = await supabase
        .from('user_xp')
        .insert({
          user_id: user.id,
          amount: lesson.xp_reward,
          source: 'lesson_completion',
          source_id: lessonId
        });

      if (error) throw error;
    },
    onSuccess: () => {
      toast({
        title: "🎉 Lesson Completed!",
        description: `You earned ${lesson?.xp_reward} XP!`,
      });
      queryClient.invalidateQueries({ queryKey: ['user-xp', user?.id] });
    }
  });

  const updateStreakMutation = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error('User required');

      const today = new Date().toISOString().split('T')[0];
      
      const { data: currentStreak, error: fetchError } = await supabase
        .from('streaks')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (fetchError) throw fetchError;

      const lastActivityDate = currentStreak.last_activity_date;
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayStr = yesterday.toISOString().split('T')[0];

      let newStreakCount = currentStreak.current_streak;

      if (lastActivityDate === yesterdayStr) {
        // Continuing streak
        newStreakCount += 1;
      } else if (lastActivityDate !== today) {
        // Starting new streak or broken streak
        newStreakCount = 1;
      }

      const { error } = await supabase
        .from('streaks')
        .update({
          current_streak: newStreakCount,
          longest_streak: Math.max(newStreakCount, currentStreak.longest_streak),
          last_activity_date: today,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', user.id);

      if (error) throw error;
    }
  });

  const getYouTubeVideoId = (url: string) => {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    return match && match[2].length === 11 ? match[2] : null;
  };

  useEffect(() => {
    if (!lesson || lesson.type !== 'video') return;

    const loadYouTubeAPI = () => {
      if (window.YT && window.YT.Player) {
        initializePlayer();
        return;
      }

      const script = document.createElement('script');
      script.src = 'https://www.youtube.com/iframe_api';
      script.async = true;
      document.body.appendChild(script);

      window.onYouTubeIframeAPIReady = initializePlayer;
    };

    const initializePlayer = () => {
      const videoId = getYouTubeVideoId(lesson.content_url);
      if (!videoId) return;

      playerRef.current = new window.YT.Player('youtube-player', {
        height: '480',
        width: '100%',
        videoId: videoId,
        playerVars: {
          autoplay: 0,
          controls: 1,
          modestbranding: 1,
          rel: 0
        },
        events: {
          onStateChange: onPlayerStateChange
        }
      });
    };

    loadYouTubeAPI();

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [lesson]);

  const onPlayerStateChange = (event: any) => {
    if (event.data === window.YT.PlayerState.PLAYING) {
      startProgressTracking();
    } else if (event.data === window.YT.PlayerState.PAUSED || event.data === window.YT.PlayerState.ENDED) {
      stopProgressTracking();
    }
  };

  const startProgressTracking = () => {
    if (intervalRef.current) return;

    intervalRef.current = setInterval(() => {
      if (playerRef.current && playerRef.current.getCurrentTime && playerRef.current.getDuration) {
        const currentTime = playerRef.current.getCurrentTime();
        const duration = playerRef.current.getDuration();
        
        if (duration > 0) {
          const percentage = Math.round((currentTime / duration) * 100);
          setWatchPercentage(percentage);

          // Mark as completed if watched >80% and not already completed
          if (percentage > 80 && !isCompleted && progress && !progress.completed) {
            setIsCompleted(true);
            updateProgressMutation.mutate({ watchPercentage: percentage, completed: true });
            awardXPMutation.mutate();
            updateStreakMutation.mutate();
          } else if (user && !isCompleted) {
            // Update progress every 10% milestone
            if (percentage % 10 === 0 && percentage !== watchPercentage) {
              updateProgressMutation.mutate({ watchPercentage: percentage, completed: false });
            }
          }
        }
      }
    }, 2000);
  };

  const stopProgressTracking = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  };

  useEffect(() => {
    if (progress) {
      setWatchPercentage(progress.watch_percentage || 0);
      setIsCompleted(progress.completed || false);
    }
  }, [progress]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 p-6">
        <div className="max-w-4xl mx-auto">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-gray-200 rounded w-1/3"></div>
            <div className="h-96 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!lesson) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 p-6">
        <div className="max-w-4xl mx-auto text-center py-12">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Lesson Not Found</h1>
          <Link to="/">
            <Button>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Home
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      <div className="max-w-4xl mx-auto p-6">
        {/* Header */}
        <div className="mb-6">
          <Link to={`/course/${lesson.module.course.id}`}>
            <Button variant="ghost" className="mb-4">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to {lesson.module.course.title}
            </Button>
          </Link>

          <div className="flex items-center space-x-2 text-sm text-gray-600 mb-4">
            <span>{lesson.module.course.title}</span>
            <span>•</span>
            <span>{lesson.module.title}</span>
          </div>
        </div>

        {/* Lesson Content */}
        <Card className="bg-white/80 backdrop-blur-md border-white/20 mb-6">
          <CardHeader>
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <CardTitle className="text-2xl font-bold mb-2 flex items-center gap-3">
                  {lesson.title}
                  {isCompleted && <CheckCircle className="w-6 h-6 text-green-500" />}
                </CardTitle>
                <CardDescription className="text-lg">{lesson.description}</CardDescription>
              </div>
              <Badge className="flex items-center space-x-1 bg-gradient-to-r from-yellow-500 to-orange-500">
                <Trophy className="w-3 h-3" />
                <span>{lesson.xp_reward} XP</span>
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            {lesson.type === 'video' && (
              <div className="space-y-4">
                <div className="relative bg-black rounded-lg overflow-hidden">
                  <div id="youtube-player" className="w-full aspect-video"></div>
                </div>
                
                {user && (
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm text-gray-600">
                      <span>Progress</span>
                      <span>{watchPercentage}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-gradient-to-r from-blue-600 to-purple-600 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${watchPercentage}%` }}
                      />
                    </div>
                    {isCompleted && (
                      <div className="flex items-center space-x-2 text-green-600 font-medium">
                        <Award className="w-4 h-4" />
                        <span>Lesson Completed! +{lesson.xp_reward} XP earned</span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {lesson.type === 'quiz' && (
              <div className="text-center py-12">
                <Play className="w-16 h-16 text-purple-500 mx-auto mb-4" />
                <h3 className="text-xl font-semibold mb-2">Quiz Time!</h3>
                <p className="text-gray-600 mb-6">Test your knowledge with this interactive quiz.</p>
                <Button>Start Quiz</Button>
              </div>
            )}

            {lesson.type === 'assignment' && (
              <div className="text-center py-12">
                <Play className="w-16 h-16 text-orange-500 mx-auto mb-4" />
                <h3 className="text-xl font-semibold mb-2">Assignment</h3>
                <p className="text-gray-600 mb-6">Complete this assignment to earn XP.</p>
                <Button asChild>
                  <a href={lesson.content_url} target="_blank" rel="noopener noreferrer">
                    Open Assignment
                  </a>
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default LessonPlayer;
