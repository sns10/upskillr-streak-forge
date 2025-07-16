import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { ArrowLeft, Trophy, CheckCircle, Play, Award, Volume2, Settings, SkipForward, Pause, PlayIcon, Maximize, Minimize, Brain, ChevronLeft, ChevronRight, VolumeX } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import QuizPlayer from '@/components/QuizPlayer';
import AdaptiveQuizPlayer from '@/components/AdaptiveQuizPlayer';
import AssignmentPlayer from '@/components/AssignmentPlayer';
import CourseNavigation from '@/components/CourseNavigation';
import BreadcrumbNavigation from '@/components/BreadcrumbNavigation';
import { useQuizManagement } from '@/hooks/useQuizManagement';
import { useAssignmentManagement } from '@/hooks/useAssignmentManagement';

interface Lesson {
  id: string;
  title: string;
  description: string;
  type: 'video' | 'quiz' | 'assignment';
  content_url: string;
  xp_reward: number;
  order_index: number;
  module: {
    id: string;
    title: string;
    order_index: number;
    course: {
      id: string;
      title: string;
      modules: Array<{
        id: string;
        title: string;
        order_index: number;
        lessons: Array<{
          id: string;
          title: string;
          order_index: number;
          type: string;
        }>;
      }>;
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
  const [hasReceivedXP, setHasReceivedXP] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(50);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [autoplayNext, setAutoplayNext] = useState(false);
  const [useAdaptiveQuiz, setUseAdaptiveQuiz] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const playerRef = useRef<any>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const controlsTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  // Quiz and Assignment hooks
  const { useQuizByLesson, useQuizResults, submitQuizMutation } = useQuizManagement();
  const { useAssignmentByLesson, useAssignmentSubmission, submitAssignmentMutation } = useAssignmentManagement();

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
          order_index,
          module:modules (
            id,
            title,
            order_index,
            course:courses (
              id,
              title,
              modules (
                id,
                title,
                order_index,
                lessons (
                  id,
                  title,
                  order_index,
                  type
                )
              )
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

  // Fetch user progress for the entire course
  const { data: courseProgress } = useQuery({
    queryKey: ['course-progress', lesson?.module.course.id, user?.id],
    queryFn: async () => {
      if (!user || !lesson?.module.course.id) return [];

      const { data, error } = await supabase
        .from('user_progress')
        .select('lesson_id, completed')
        .eq('user_id', user.id);

      if (error) throw error;
      return data || [];
    },
    enabled: !!user && !!lesson?.module.course.id
  });

  // Get course with progress for navigation
  const courseWithProgress = React.useMemo(() => {
    if (!lesson?.module.course || !courseProgress) return null;
    
    return {
      ...lesson.module.course,
      modules: lesson.module.course.modules.map(module => ({
        ...module,
        lessons: module.lessons.map(lessonItem => ({
          ...lessonItem,
          completed: courseProgress.some(p => p.lesson_id === lessonItem.id && p.completed)
        }))
      }))
    };
  }, [lesson, courseProgress]);

  // Fetch quiz and assignment data
  const { data: quiz } = useQuizByLesson(lessonId || '');
  const { data: quizResults } = useQuizResults(quiz?.id || '');
  const { data: assignment } = useAssignmentByLesson(lessonId || '');
  const { data: assignmentSubmission } = useAssignmentSubmission(assignment?.id || '');

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

  // Check if user has already received XP for this lesson
  const { data: xpRecord } = useQuery({
    queryKey: ['lesson-xp', lessonId, user?.id],
    queryFn: async () => {
      if (!user || !lessonId) return null;

      const { data, error } = await supabase
        .from('user_xp')
        .select('id')
        .eq('user_id', user.id)
        .eq('source', 'lesson_completion')
        .eq('source_id', lessonId)
        .maybeSingle();

      if (error) throw error;
      return data;
    },
    enabled: !!user && !!lessonId
  });

  // Get next/previous lessons for navigation
  const getNavigationLessons = () => {
    if (!courseWithProgress || !lessonId) return { nextLesson: null, previousLesson: null };
    
    let foundCurrent = false;
    let previousLesson = null;
    let nextLesson = null;
    
    for (const module of courseWithProgress.modules) {
      for (const lessonItem of module.lessons) {
        if (foundCurrent && !nextLesson) {
          nextLesson = lessonItem;
          break;
        }
        if (lessonItem.id === lessonId) {
          foundCurrent = true;
        } else if (!foundCurrent) {
          previousLesson = lessonItem;
        }
      }
      if (nextLesson) break;
    }
    
    return { nextLesson, previousLesson };
  };

  const { nextLesson, previousLesson } = getNavigationLessons();

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
        }, {
          onConflict: 'user_id,lesson_id'
        });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lesson-progress', lessonId, user?.id] });
      queryClient.invalidateQueries({ queryKey: ['course-progress'] });
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
      queryClient.invalidateQueries({ queryKey: ['lesson-xp', lessonId, user?.id] });
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
          controls: 0, // Disable default controls for custom implementation
          modestbranding: 1,
          rel: 0,
          iv_load_policy: 3
        },
        events: {
          onStateChange: onPlayerStateChange,
          onReady: onPlayerReady
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

  const onPlayerReady = (event: any) => {
    setDuration(event.target.getDuration());
    setVolume(event.target.getVolume());
  };

  const onPlayerStateChange = (event: any) => {
    const state = event.data;
    setIsPlaying(state === window.YT.PlayerState.PLAYING);
    
    if (state === window.YT.PlayerState.PLAYING) {
      startProgressTracking();
      hideControlsAfterDelay();
    } else if (state === window.YT.PlayerState.PAUSED) {
      stopProgressTracking();
      setShowControls(true);
      clearControlsTimeout();
    } else if (state === window.YT.PlayerState.ENDED) {
      stopProgressTracking();
      setShowControls(true);
      clearControlsTimeout();
      
      // Autoplay next lesson if enabled
      if (autoplayNext && nextLesson) {
        setTimeout(() => {
          navigate(`/lesson/${nextLesson.id}`);
        }, 3000);
      }
    }
  };

  // Build breadcrumb items
  const breadcrumbItems = lesson ? [
    { label: lesson.module.course.title, href: `/course/${lesson.module.course.id}` },
    { label: lesson.module.title },
    { label: lesson.title, isActive: true }
  ] : [];

  const startProgressTracking = () => {
    if (intervalRef.current) return;

    intervalRef.current = setInterval(() => {
      if (playerRef.current && playerRef.current.getCurrentTime && playerRef.current.getDuration) {
        const current = playerRef.current.getCurrentTime();
        const totalDuration = playerRef.current.getDuration();
        
        setCurrentTime(current);
        
        if (totalDuration > 0) {
          const percentage = Math.round((current / totalDuration) * 100);
          setWatchPercentage(percentage);

          // Mark as completed if watched >80% and not already completed
          if (percentage > 80 && !isCompleted && progress && !progress.completed && !hasReceivedXP) {
            setIsCompleted(true);
            updateProgressMutation.mutate({ watchPercentage: percentage, completed: true });
            
            // Only award XP if not already received
            if (!xpRecord && !hasReceivedXP) {
              console.log('Awarding XP for lesson completion:', lesson.xp_reward);
              setHasReceivedXP(true);
              awardXPMutation.mutate();
            } else {
              console.log('XP already awarded for this lesson');
            }
            
            updateStreakMutation.mutate();
            
            // Check for new badges
            if (user) {
              (async () => {
                try {
                  await supabase.rpc('check_and_award_badges', { user_uuid: user.id });
                  console.log('Badge check completed');
                } catch (error) {
                  console.warn('Badge check failed:', error);
                }
              })();
            }
          } else if (user && !isCompleted) {
            // Update progress every 10% milestone
            if (percentage % 10 === 0 && percentage !== watchPercentage) {
              updateProgressMutation.mutate({ watchPercentage: percentage, completed: false });
            }
          }
        }
      }
    }, 1000);
  };

  const stopProgressTracking = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  };

  const hideControlsAfterDelay = () => {
    clearControlsTimeout();
    controlsTimeoutRef.current = setTimeout(() => {
      setShowControls(false);
    }, 3000);
  };

  const clearControlsTimeout = () => {
    if (controlsTimeoutRef.current) {
      clearTimeout(controlsTimeoutRef.current);
      controlsTimeoutRef.current = null;
    }
  };

  const togglePlayPause = () => {
    if (playerRef.current) {
      if (isPlaying) {
        playerRef.current.pauseVideo();
      } else {
        playerRef.current.playVideo();
      }
    }
  };

  const handleVolumeChange = (value: number[]) => {
    const newVolume = value[0];
    setVolume(newVolume);
    if (playerRef.current) {
      playerRef.current.setVolume(newVolume);
    }
  };

  const handlePlaybackRateChange = (rate: string) => {
    const newRate = parseFloat(rate);
    setPlaybackRate(newRate);
    if (playerRef.current) {
      playerRef.current.setPlaybackRate(newRate);
    }
  };

  const handleSeek = (value: number[]) => {
    const seekTime = (value[0] / 100) * duration;
    if (playerRef.current) {
      playerRef.current.seekTo(seekTime);
    }
  };

  const skipForward = () => {
    if (playerRef.current) {
      const currentTime = playerRef.current.getCurrentTime();
      playerRef.current.seekTo(currentTime + 10);
    }
  };

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const toggleFullscreen = () => {
    const element = document.getElementById('video-container');
    if (!element) return;

    if (!isFullscreen) {
      if (element.requestFullscreen) {
        element.requestFullscreen();
        // Force landscape orientation on mobile devices
        if ('screen' in window && 'orientation' in screen) {
          try {
            (screen.orientation as any).lock('landscape').catch(() => {
              // Orientation lock failed, continue anyway
            });
          } catch (error) {
            // Orientation API not supported
          }
        }
      }
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
        // Unlock orientation when exiting fullscreen
        if ('screen' in window && 'orientation' in screen) {
          try {
            (screen.orientation as any).unlock();
          } catch (error) {
            // Orientation API not supported
          }
        }
      }
    }
  };

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  useEffect(() => {
    if (progress) {
      setWatchPercentage(progress.watch_percentage || 0);
      setIsCompleted(progress.completed || false);
    }
    
    // Set XP state based on existing record
    if (xpRecord) {
      setHasReceivedXP(true);
    }
  }, [progress, xpRecord]);

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
      {/* Course Navigation Sidebar */}
      {courseWithProgress && (
        <CourseNavigation
          course={courseWithProgress}
          currentLessonId={lessonId}
          isOpen={sidebarOpen}
          onToggle={toggleSidebar}
        />
      )}

      <div className={`transition-all duration-300 ${sidebarOpen ? 'lg:ml-80' : 'ml-0'}`}>
        <div className="max-w-4xl mx-auto p-3 sm:p-6">
          {/* Header with Breadcrumbs */}
          <div className="mb-6">
            <BreadcrumbNavigation items={breadcrumbItems} className="mb-4" />
            
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-4">
              <Link to={`/course/${lesson.module.course.id}`}>
                <Button variant="ghost" size="sm">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  <span className="hidden sm:inline">Back to Course</span>
                  <span className="sm:hidden">Back</span>
                </Button>
              </Link>

              {/* Lesson Navigation */}
              <div className="flex items-center space-x-2">
                {previousLesson ? (
                  <Link to={`/lesson/${previousLesson.id}`}>
                    <Button variant="outline" size="sm">
                      <ChevronLeft className="w-4 h-4 sm:mr-1" />
                      <span className="hidden sm:inline">Previous</span>
                    </Button>
                  </Link>
                ) : (
                  <Button variant="outline" size="sm" disabled>
                    <ChevronLeft className="w-4 h-4 sm:mr-1" />
                    <span className="hidden sm:inline">Previous</span>
                  </Button>
                )}
                
                {nextLesson ? (
                  <Link to={`/lesson/${nextLesson.id}`}>
                    <Button size="sm">
                      <span className="hidden sm:inline">Next</span>
                      <ChevronRight className="w-4 h-4 sm:ml-1" />
                    </Button>
                  </Link>
                ) : (
                  <Button size="sm" disabled>
                    <span className="hidden sm:inline">Next</span>
                    <ChevronRight className="w-4 h-4 sm:ml-1" />
                  </Button>
                )}
              </div>
            </div>
          </div>

          {/* Lesson Content */}
          <Card className="bg-white/80 backdrop-blur-md border-white/20 mb-6">
            <CardHeader>
              <div className="flex flex-col sm:flex-row items-start justify-between gap-4">
                <div className="flex-1">
                  <CardTitle className="text-xl sm:text-2xl font-bold mb-2 flex items-center gap-3 flex-wrap">
                    {lesson.title}
                    {isCompleted && <CheckCircle className="w-5 h-5 sm:w-6 sm:h-6 text-green-500" />}
                  </CardTitle>
                  <CardDescription className="text-base sm:text-lg">{lesson.description}</CardDescription>
                </div>
                <div className="flex items-center space-x-2 flex-shrink-0">
                  <Badge className="flex items-center space-x-1 bg-gradient-to-r from-yellow-500 to-orange-500">
                    <Trophy className="w-3 h-3" />
                    <span>{lesson.xp_reward} XP</span>
                  </Badge>
                  <Badge variant="outline" className="capitalize">
                    {lesson.type}
                  </Badge>
                </div>
              </div>
            </CardHeader>
            <CardContent>
            {lesson.type === 'video' && (
              <div className="space-y-4">
                <div 
                  id="video-container"
                  className={`relative bg-black overflow-hidden group cursor-pointer transition-all duration-300 ${
                    isFullscreen 
                      ? 'fixed inset-0 z-50 rounded-none' 
                      : 'rounded-lg'
                  }`}
                  onMouseMove={() => {
                    setShowControls(true);
                    if (isPlaying) hideControlsAfterDelay();
                  }}
                  onMouseLeave={() => {
                    if (isPlaying) hideControlsAfterDelay();
                  }}
                  onClick={() => {
                    setShowControls(true);
                    if (isPlaying) hideControlsAfterDelay();
                  }}
                >
                  <div id="youtube-player" className="w-full aspect-video"></div>
                  
                  {/* Custom Video Controls Overlay */}
                  <div className={`absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/20 transition-opacity duration-300 ${showControls ? 'opacity-100' : 'opacity-0'}`}>
                    {/* Center Play/Pause Button */}
                    <div className="absolute inset-0 flex items-center justify-center">
                      <Button
                        variant="ghost"
                        size="lg"
                        onClick={togglePlayPause}
                        className="w-16 h-16 rounded-full bg-black/40 hover:bg-black/60 text-white border-2 border-white/30"
                      >
                        {isPlaying ? <Pause className="w-8 h-8" /> : <PlayIcon className="w-8 h-8" />}
                      </Button>
                    </div>

                    {/* Bottom Controls */}
                    <div className="absolute bottom-0 left-0 right-0 p-4 space-y-3">
                      {/* Progress Bar */}
                      <div className="space-y-2">
                        <Slider
                          value={[watchPercentage]}
                          onValueChange={handleSeek}
                          max={100}
                          step={0.1}
                          className="w-full"
                        />
                        <div className="flex justify-between text-xs text-white/80">
                          <span>{formatTime(currentTime)}</span>
                          <span>{formatTime(duration)}</span>
                        </div>
                      </div>

                       {/* Control Buttons */}
                       <div className="flex items-center justify-between">
                         <div className="flex items-center space-x-2 sm:space-x-3">
                           <Button
                             variant="ghost"
                             size="sm"
                             onClick={togglePlayPause}
                             className="text-white hover:bg-white/20"
                           >
                             {isPlaying ? <Pause className="w-4 h-4 sm:w-5 sm:h-5" /> : <PlayIcon className="w-4 h-4 sm:w-5 sm:h-5" />}
                           </Button>
                           
                           <Button
                             variant="ghost"
                             size="sm"
                             onClick={skipForward}
                             className="text-white hover:bg-white/20"
                           >
                             <SkipForward className="w-4 h-4 sm:w-5 sm:h-5" />
                           </Button>

                           <div className="hidden sm:flex items-center space-x-2">
                             <Volume2 className="w-4 h-4 text-white" />
                             <Slider
                               value={[volume]}
                               onValueChange={handleVolumeChange}
                               max={100}
                               step={1}
                               className="w-16 sm:w-20"
                             />
                             <div className="text-white text-sm">
                               {volume}%
                             </div>
                           </div>
                         </div>

                         <div className="flex items-center space-x-1 sm:space-x-3">
                           <Select value={playbackRate.toString()} onValueChange={handlePlaybackRateChange}>
                             <SelectTrigger className="w-16 sm:w-20 bg-black/40 border-white/30 text-white text-sm">
                               <SelectValue />
                             </SelectTrigger>
                             <SelectContent>
                               <SelectItem value="0.25">0.25x</SelectItem>
                               <SelectItem value="0.5">0.5x</SelectItem>
                               <SelectItem value="0.75">0.75x</SelectItem>
                               <SelectItem value="1">1x</SelectItem>
                               <SelectItem value="1.25">1.25x</SelectItem>
                               <SelectItem value="1.5">1.5x</SelectItem>
                               <SelectItem value="2">2x</SelectItem>
                             </SelectContent>
                           </Select>

                           <Button
                             variant="ghost"
                             size="sm"
                             onClick={toggleFullscreen}
                             className="text-white hover:bg-white/20"
                           >
                             {isFullscreen ? <Minimize className="w-4 h-4 sm:w-5 sm:h-5" /> : <Maximize className="w-4 h-4 sm:w-5 sm:h-5" />}
                           </Button>
                         </div>
                       </div>
                    </div>

                    {/* Settings Panel */}
                    <div className="absolute top-4 right-4">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-white hover:bg-white/20"
                      >
                        <Settings className="w-5 h-5" />
                      </Button>
                    </div>
                  </div>
                </div>

                {/* Video Options */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-4 bg-gray-50 rounded-lg">
                  <div className="flex flex-col sm:flex-row sm:items-center space-y-2 sm:space-y-0 sm:space-x-4">
                    <label className="flex items-center space-x-2 text-sm">
                      <input
                        type="checkbox"
                        checked={autoplayNext}
                        onChange={(e) => setAutoplayNext(e.target.checked)}
                        className="rounded"
                      />
                      <span>Autoplay next lesson</span>
                    </label>
                    {nextLesson && autoplayNext && (
                      <span className="text-sm text-gray-600 break-words">
                        Next: {nextLesson.title}
                      </span>
                    )}
                  </div>
                </div>
                
                {user && (
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm text-gray-600">
                      <span>Overall Progress</span>
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

            {/* Quiz Lesson */}
            {lesson.type === 'quiz' && quiz && (
              <div className="mb-6">
                {/* Quiz Mode Selector */}
                <div className="flex items-center justify-between mb-4 p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg border">
                  <div className="flex items-center gap-2">
                    <Brain className="w-5 h-5 text-blue-600" />
                    <span className="font-medium text-gray-700">Quiz Mode:</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant={useAdaptiveQuiz ? "default" : "outline"}
                      size="sm"
                      onClick={() => setUseAdaptiveQuiz(true)}
                      className="text-sm"
                    >
                      🧠 Adaptive
                    </Button>
                    <Button
                      variant={!useAdaptiveQuiz ? "default" : "outline"}
                      size="sm"
                      onClick={() => setUseAdaptiveQuiz(false)}
                      className="text-sm"
                    >
                      📝 Standard
                    </Button>
                  </div>
                </div>

                {quizResults && quizResults.score >= 70 ? (
                  <div className="text-center py-12 border-green-200 bg-green-50 rounded-lg border">
                    <CheckCircle className="w-16 h-16 text-green-600 mx-auto mb-4" />
                    <h3 className="text-xl font-semibold text-green-800 mb-2">Quiz Completed!</h3>
                    <p className="text-green-700 mb-4">
                      You scored {quizResults.score}% on {new Date(quizResults.completed_at).toLocaleDateString()}
                    </p>
                    <Button 
                      variant="outline" 
                      onClick={() => window.location.reload()}
                      className="border-green-300 text-green-700 hover:bg-green-100"
                    >
                      Retake Quiz
                    </Button>
                  </div>
                ) : useAdaptiveQuiz ? (
                  <AdaptiveQuizPlayer 
                    quiz={quiz} 
                    onComplete={(score, answers) => {
                      submitQuizMutation.mutate({
                        quiz_id: quiz.id,
                        score,
                        answers,
                        completed_at: new Date().toISOString()
                      });
                    }}
                  />
                ) : (
                  <QuizPlayer 
                    quiz={quiz} 
                    onComplete={(score, answers) => {
                      submitQuizMutation.mutate({
                        quiz_id: quiz.id,
                        score,
                        answers,
                        completed_at: new Date().toISOString()
                      });
                    }}
                  />
                )}
              </div>
            )}

            {lesson.type === 'quiz' && !quiz && (
              <div className="text-center py-12">
                <Play className="w-16 h-16 text-purple-500 mx-auto mb-4" />
                <h3 className="text-xl font-semibold mb-2">Quiz Not Available</h3>
                <p className="text-gray-600 mb-6">This quiz hasn't been created yet.</p>
              </div>
            )}

            {/* Assignment Lesson */}
            {lesson.type === 'assignment' && assignment && (
              <AssignmentPlayer 
                assignment={assignment}
                submission={assignmentSubmission || undefined}
                onSubmit={(textSubmission, file) => {
                  submitAssignmentMutation.mutate({
                    assignment_id: assignment.id,
                    text_submission: textSubmission,
                    file
                  });
                }}
                isSubmitting={submitAssignmentMutation.isPending}
              />
            )}

            {lesson.type === 'assignment' && !assignment && (
              <div className="text-center py-12">
                <Play className="w-16 h-16 text-orange-500 mx-auto mb-4" />
                <h3 className="text-xl font-semibold mb-2">Assignment Not Available</h3>
                <p className="text-gray-600 mb-6">This assignment hasn't been created yet.</p>
              </div>
            )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default LessonPlayer;
