import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

interface QuizQuestion {
  id: string;
  question: string;
  options: string[];
  correct_answer: number;
  explanation?: string;
  difficulty?: string; // easy, medium, hard
}

interface CreateQuizData {
  lesson_id: string;
  title: string;
  questions: QuizQuestion[];
  xp_reward: number;
}

interface QuizResult {
  quiz_id: string;
  score: number;
  answers: number[];
  completed_at: string;
}

interface AdaptiveQuizSession {
  id: string;
  user_id: string;
  quiz_id: string;
  current_difficulty: string;
  questions_correct: number;
  questions_total: number;
  consecutive_correct: number;
  consecutive_incorrect: number;
  session_data: any;
  started_at: string;
  is_active: boolean;
}

export const useQuizManagement = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch quiz by lesson ID
  const useQuizByLesson = (lessonId: string) => {
    return useQuery({
      queryKey: ['quiz', lessonId],
      queryFn: async () => {
        const { data, error } = await supabase
          .from('quizzes')
          .select('*')
          .eq('lesson_id', lessonId)
          .single();

        if (error && error.code !== 'PGRST116') throw error;
        
        if (data) {
          return {
            ...data,
            questions: (data.questions as any) as QuizQuestion[]
          };
        }
        
        return null;
      },
      enabled: !!lessonId
    });
  };

  // Fetch quiz results for a user
  const useQuizResults = (quizId: string) => {
    return useQuery({
      queryKey: ['quiz-results', quizId, user?.id],
      queryFn: async () => {
        if (!user) return null;

        const { data, error } = await supabase
          .from('quiz_results')
          .select('*')
          .eq('quiz_id', quizId)
          .eq('user_id', user.id)
          .order('completed_at', { ascending: false })
          .limit(1)
          .single();

        if (error && error.code !== 'PGRST116') throw error;
        return data;
      },
      enabled: !!quizId && !!user
    });
  };

  // Get user's learning profile
  const useLearningProfile = () => {
    return useQuery({
      queryKey: ['learning-profile', user?.id],
      queryFn: async () => {
        if (!user) return null;

        const { data, error } = await supabase
          .from('learning_profiles')
          .select('*')
          .eq('user_id', user.id)
          .maybeSingle();

        if (error) throw error;
        return data;
      },
      enabled: !!user
    });
  };

  // Create adaptive quiz session
  const createAdaptiveSessionMutation = useMutation({
    mutationFn: async (quizId: string) => {
      if (!user) throw new Error('User not authenticated');

      // First check if there's an active session
      const { data: existingSession } = await supabase
        .from('adaptive_quiz_sessions')
        .select('*')
        .eq('user_id', user.id)
        .eq('quiz_id', quizId)
        .eq('is_active', true)
        .maybeSingle();

      if (existingSession) {
        return existingSession;
      }

      // Get user's preferred difficulty from learning profile
      const { data: profile } = await supabase
        .from('learning_profiles')
        .select('preferred_difficulty')
        .eq('user_id', user.id)
        .maybeSingle();

      const { data: session, error } = await supabase
        .from('adaptive_quiz_sessions')
        .insert({
          user_id: user.id,
          quiz_id: quizId,
          current_difficulty: profile?.preferred_difficulty || 'medium',
          questions_correct: 0,
          questions_total: 0,
          consecutive_correct: 0,
          consecutive_incorrect: 0,
          session_data: {}
        })
        .select()
        .single();

      if (error) throw error;
      return session;
    }
  });

  // Update adaptive session progress
  const updateAdaptiveSessionMutation = useMutation({
    mutationFn: async ({
      sessionId,
      isCorrect,
      responseTime,
      questionIndex
    }: {
      sessionId: string;
      isCorrect: boolean;
      responseTime: number;
      questionIndex: number;
    }) => {
      if (!user) throw new Error('User not authenticated');

      // Get current session
      const { data: session, error: sessionError } = await supabase
        .from('adaptive_quiz_sessions')
        .select('*')
        .eq('id', sessionId)
        .single();

      if (sessionError) throw sessionError;

      // Calculate new consecutive counts
      const newConsecutiveCorrect = isCorrect ? session.consecutive_correct + 1 : 0;
      const newConsecutiveIncorrect = !isCorrect ? session.consecutive_incorrect + 1 : 0;

      // Record question performance
      await supabase
        .from('user_question_performance')
        .insert({
          user_id: user.id,
          quiz_id: session.quiz_id,
          question_index: questionIndex,
          response_time: responseTime,
          is_correct: isCorrect,
          difficulty_at_time: session.current_difficulty
        });

      // Update session
      const { error: updateError } = await supabase
        .from('adaptive_quiz_sessions')
        .update({
          questions_correct: session.questions_correct + (isCorrect ? 1 : 0),
          questions_total: session.questions_total + 1,
          consecutive_correct: newConsecutiveCorrect,
          consecutive_incorrect: newConsecutiveIncorrect
        })
        .eq('id', sessionId);

      if (updateError) throw updateError;

      // Get adaptive difficulty for next question
      const { data: nextDifficulty } = await supabase
        .rpc('get_adaptive_difficulty', {
          user_uuid: user.id,
          quiz_session_id: sessionId
        });

      return { nextDifficulty };
    }
  });

  // Complete adaptive session
  const completeAdaptiveSessionMutation = useMutation({
    mutationFn: async (sessionId: string) => {
      if (!user) throw new Error('User not authenticated');

      // Mark session as completed
      const { error: sessionError } = await supabase
        .from('adaptive_quiz_sessions')
        .update({
          completed_at: new Date().toISOString(),
          is_active: false
        })
        .eq('id', sessionId);

      if (sessionError) throw sessionError;

      // Update learning profile based on performance
      await supabase.rpc('update_learning_profile', {
        user_uuid: user.id,
        quiz_session_id: sessionId
      });

      return true;
    }
  });

  // Get question analytics
  const useQuestionAnalytics = (quizId: string) => {
    return useQuery({
      queryKey: ['question-analytics', quizId],
      queryFn: async () => {
        const { data, error } = await supabase
          .from('question_analytics')
          .select('*')
          .eq('quiz_id', quizId)
          .order('question_index');

        if (error) throw error;
        return data;
      },
      enabled: !!quizId
    });
  };

  // Create quiz
  const createQuizMutation = useMutation({
    mutationFn: async (data: CreateQuizData) => {
      if (!user) throw new Error('User not authenticated');

      const { data: quiz, error } = await supabase
        .from('quizzes')
        .insert({
          lesson_id: data.lesson_id,
          title: data.title,
          questions: data.questions as any,
          xp_reward: data.xp_reward
        })
        .select()
        .single();

      if (error) throw error;
      return quiz;
    },
    onSuccess: () => {
      toast({
        title: "Quiz Created",
        description: "Quiz has been created successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ['quiz'] });
    },
    onError: (error) => {
      console.error('Quiz creation error:', error);
      toast({
        title: "Error",
        description: "Failed to create quiz: " + error.message,
        variant: "destructive",
      });
    }
  });

  // Submit quiz results
  const submitQuizMutation = useMutation({
    mutationFn: async (data: QuizResult) => {
      if (!user) throw new Error('User not authenticated');

      // First, save the quiz result
      const { data: result, error: resultError } = await supabase
        .from('quiz_results')
        .insert({
          quiz_id: data.quiz_id,
          user_id: user.id,
          score: data.score,
          answers: data.answers,
          completed_at: data.completed_at
        })
        .select()
        .single();

      if (resultError) throw resultError;

      // If score is passing (>= 70%), award XP and mark lesson as complete
      if (data.score >= 70) {
        // Get quiz details for XP reward
        const { data: quiz, error: quizError } = await supabase
          .from('quizzes')
          .select('xp_reward, lesson_id')
          .eq('id', data.quiz_id)
          .single();

        if (quizError) throw quizError;

        // Award XP
        const { error: xpError } = await supabase
          .from('user_xp')
          .insert({
            user_id: user.id,
            amount: quiz.xp_reward,
            source: 'quiz',
            source_id: data.quiz_id
          });

        if (xpError) throw xpError;

        // Mark lesson as complete
        const { error: progressError } = await supabase
          .from('user_progress')
          .upsert({
            user_id: user.id,
            lesson_id: quiz.lesson_id,
            completed: true,
            completed_at: new Date().toISOString()
          });

        if (progressError) throw progressError;

        // Update streak properly
        const today = new Date().toISOString().split('T')[0];
        
        const { data: currentStreak } = await supabase
          .from('streaks')
          .select('*')
          .eq('user_id', user.id)
          .single();

        if (currentStreak) {
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

          const { error: streakError } = await supabase
            .from('streaks')
            .update({
              current_streak: newStreakCount,
              longest_streak: Math.max(newStreakCount, currentStreak.longest_streak),
              last_activity_date: today,
              updated_at: new Date().toISOString()
            })
            .eq('user_id', user.id);

          if (streakError) console.warn('Streak update failed:', streakError);
        }

        // Check for new badges
        try {
          await supabase.rpc('check_and_award_badges', { user_uuid: user.id });
        } catch (badgeError) {
          console.warn('Badge check failed:', badgeError);
        }
      }

      return result;
    },
    onSuccess: (result, variables) => {
      if (variables.score >= 70) {
        toast({
          title: "Quiz Completed!",
          description: `Great job! You scored ${variables.score}% and earned XP.`,
        });
      } else {
        toast({
          title: "Quiz Completed",
          description: `You scored ${variables.score}%. You need 70% or higher to earn XP.`,
        });
      }
      queryClient.invalidateQueries({ queryKey: ['quiz-results'] });
      queryClient.invalidateQueries({ queryKey: ['user-progress'] });
      queryClient.invalidateQueries({ queryKey: ['user-xp'] });
    },
    onError: (error) => {
      console.error('Quiz submission error:', error);
      toast({
        title: "Error",
        description: "Failed to submit quiz results: " + error.message,
        variant: "destructive",
      });
    }
  });

  // Delete quiz
  const deleteQuizMutation = useMutation({
    mutationFn: async (quizId: string) => {
      const { error } = await supabase
        .from('quizzes')
        .delete()
        .eq('id', quizId);

      if (error) throw error;
    },
    onSuccess: () => {
      toast({
        title: "Quiz Deleted",
        description: "Quiz has been removed successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ['quiz'] });
    },
    onError: (error) => {
      console.error('Quiz deletion error:', error);
      toast({
        title: "Error",
        description: "Failed to delete quiz: " + error.message,
        variant: "destructive",
      });
    }
  });

  return {
    useQuizByLesson,
    useQuizResults,
    useLearningProfile,
    useQuestionAnalytics,
    createQuizMutation,
    submitQuizMutation,
    deleteQuizMutation,
    createAdaptiveSessionMutation,
    updateAdaptiveSessionMutation,
    completeAdaptiveSessionMutation,
  };
};