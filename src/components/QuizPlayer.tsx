
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { CheckCircle, XCircle, HelpCircle, Trophy, Target } from "lucide-react";
import { ActivityTracker } from "@/lib/activityTracker";

interface Question {
  id: string;
  question_text: string;
  order_num: number;
  answers: Answer[];
}

interface Answer {
  id: string;
  answer_text: string;
  order_num: number;
}

interface Quiz {
  id: string;
  title: string;
  description: string;
  time_limit_minutes: number;
  passing_score: number;
  max_attempts: number;
}

interface QuizAttempt {
  id: string;
  status: string;
  score: number;
  correct_answers: number;
  total_questions: number;
}

interface UserAnswer {
  question_id: string;
  is_correct: boolean;
  selected_answer_id: string;
}

interface QuizPlayerProps {
  lessonId: string;
  userId: string;
  onComplete: () => void;
}

export const QuizPlayer = ({ lessonId, userId, onComplete }: QuizPlayerProps) => {
  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentAttempt, setCurrentAttempt] = useState<QuizAttempt | null>(null);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [isMastered, setIsMastered] = useState(false);
  const [rewardsAwarded, setRewardsAwarded] = useState<any>(null);
  const { toast } = useToast();

  useEffect(() => {
    loadQuizData();
  }, [lessonId, userId]);

  const loadQuizData = async () => {
    try {
      setLoading(true);
      
      // Get quiz for this lesson
      const { data: quizData, error: quizError } = await supabase
        .from('quizzes')
        .select('*')
        .eq('lesson_id', lessonId)
        .single();

      if (quizError) {
        console.error('Error fetching quiz:', quizError);
        if (quizError.code === 'PGRST116') {
          // No quiz found for this lesson
          console.log('No quiz found for lesson:', lessonId);
          return;
        }
        toast({
          title: "Error",
          description: "Failed to load quiz",
          variant: "destructive",
        });
        return;
      }

      setQuiz(quizData);
      console.log('Quiz loaded:', quizData);

      // Check for existing attempt
      const { data: attemptData, error: attemptError } = await supabase
        .from('quiz_attempts')
        .select('*')
        .eq('user_id', userId)
        .eq('quiz_id', quizData.id)
        .eq('status', 'In Progress')
        .maybeSingle();

      if (attemptError) {
        console.error('Error checking attempts:', attemptError);
      }

      // Check if already mastered
      const { data: masteredAttempt, error: masteredError } = await supabase
        .from('quiz_attempts')
        .select('*')
        .eq('user_id', userId)
        .eq('quiz_id', quizData.id)
        .eq('status', 'Mastered')
        .maybeSingle();

      if (masteredError) {
        console.error('Error checking mastered status:', masteredError);
      }

      if (masteredAttempt) {
        setIsMastered(true);
        setCurrentAttempt(masteredAttempt);
        setLoading(false);
        return;
      }

      setCurrentAttempt(attemptData);

      // Get questions that need to be answered
      let questionsToShow: Question[] = [];

      if (attemptData) {
        // Get user's correct answers for this attempt
        const { data: userAnswers, error: userAnswersError } = await supabase
          .from('user_answers')
          .select('question_id, is_correct')
          .eq('quiz_attempt_id', attemptData.id);

        if (userAnswersError) {
          console.error('Error fetching user answers:', userAnswersError);
        }

        const correctQuestionIds = userAnswers
          ?.filter(ua => ua.is_correct)
          .map(ua => ua.question_id) || [];

        // Get questions that haven't been answered correctly
        const { data: allQuestions, error: questionsError } = await supabase
          .from('questions')
          .select(`
            id,
            question_text,
            order_num,
            answers(id, answer_text, order_num)
          `)
          .eq('quiz_id', quizData.id)
          .not('id', 'in', `(${correctQuestionIds.join(',') || 'null'})`)
          .order('order_num');

        if (questionsError) {
          console.error('Error fetching questions:', questionsError);
          toast({
            title: "Error",
            description: "Failed to load questions",
            variant: "destructive",
          });
          return;
        }

        questionsToShow = allQuestions || [];
      } else {
        // No attempt yet, show all questions
        const { data: allQuestions, error: questionsError } = await supabase
          .from('questions')
          .select(`
            id,
            question_text,
            order_num,
            answers(id, answer_text, order_num)
          `)
          .eq('quiz_id', quizData.id)
          .order('order_num');

        if (questionsError) {
          console.error('Error fetching questions:', questionsError);
          toast({
            title: "Error",
            description: "Failed to load questions",
            variant: "destructive",
          });
          return;
        }

        questionsToShow = allQuestions || [];
      }

      // Sort answers within each question
      questionsToShow.forEach(question => {
        if (question.answers) {
          question.answers.sort((a, b) => a.order_num - b.order_num);
        }
      });

      setQuestions(questionsToShow);

      // Check if quiz is complete (no more questions to answer)
      if (questionsToShow.length === 0 && attemptData) {
        setIsMastered(true);
      }

    } catch (error) {
      console.error('Error loading quiz data:', error);
      toast({
        title: "Error",
        description: "Failed to load quiz",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAnswerSelect = (questionId: string, answerId: string) => {
    setSelectedAnswers(prev => ({
      ...prev,
      [questionId]: answerId
    }));
  };

  const handleSubmitAnswers = async () => {
    const answersToSubmit = Object.entries(selectedAnswers).map(([questionId, selectedAnswerId]) => ({
      questionId,
      selectedAnswerId
    }));

    if (answersToSubmit.length === 0) {
      toast({
        title: "No answers selected",
        description: "Please select answers before submitting",
        variant: "destructive",
      });
      return;
    }

    try {
      setSubmitting(true);

      const { data, error } = await supabase.functions.invoke('grade-quiz-answers', {
        body: {
          quizId: quiz!.id,
          answers: answersToSubmit
        }
      });

      if (error) {
        console.error('Error grading answers:', error);
        throw error;
      }

      console.log('Grading results:', data);

      const { 
        isMastered: newMastered, 
        isFirstTimeMastery,
        score, 
        correctCount, 
        totalQuestions,
        rewardsAwarded: rewards 
      } = data;

      if (newMastered) {
        setIsMastered(true);
        setRewardsAwarded(rewards);
        
        // Track quiz completion activity
        await ActivityTracker.trackQuizAttempt(quiz!.id, quiz!.title, score);
        
        toast({
          title: "🎉 Quiz Mastered!",
          description: isFirstTimeMastery 
            ? `Congratulations! You've mastered this topic! +${rewards?.xp || 0} XP, +${rewards?.bits || 0} Bits`
            : "Congratulations! You've mastered this topic!",
        });

        // Call onComplete to handle the lesson completion flow
        onComplete();
      } else {
        toast({
          title: "Great effort!",
          description: `${correctCount}/${totalQuestions} questions correct. Let's try the remaining questions.`,
          variant: "default",
        });

        // Reload quiz to show remaining questions
        setSelectedAnswers({});
        await loadQuizData();
      }

    } catch (error) {
      console.error('Error submitting answers:', error);
      toast({
        title: "Error",
        description: "Failed to submit answers. Please try again.",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <LoadingSpinner />
      </div>
    );
  }

  if (!quiz) {
    return (
      <Card className="max-w-2xl mx-auto">
        <CardContent className="text-center py-12">
          <HelpCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600">No quiz found for this lesson.</p>
        </CardContent>
      </Card>
    );
  }

  if (isMastered) {
    return (
      <Card className="max-w-2xl mx-auto">
        <CardHeader className="text-center">
          <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
            <Trophy className="h-8 w-8 text-green-600" />
          </div>
          <CardTitle className="text-2xl text-green-800">Quiz Mastered!</CardTitle>
        </CardHeader>
        <CardContent className="text-center space-y-4">
          <p className="text-lg text-gray-600">
            Congratulations! You have successfully mastered this quiz.
          </p>
          {currentAttempt && (
            <div className="bg-green-50 rounded-lg p-4">
              <div className="flex items-center justify-center gap-4 text-sm">
                <div className="flex items-center gap-1">
                  <Target className="h-4 w-4 text-green-600" />
                  <span>Score: {currentAttempt.score}%</span>
                </div>
                <div className="flex items-center gap-1">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <span>Correct: {currentAttempt.correct_answers}/{currentAttempt.total_questions}</span>
                </div>
              </div>
            </div>
          )}
          {rewardsAwarded && (
            <div className="bg-blue-50 rounded-lg p-4">
              <h4 className="font-semibold text-blue-800 mb-2">Rewards Earned!</h4>
              <div className="space-y-1 text-sm text-blue-700">
                <div>🌟 +{rewardsAwarded.xp} XP</div>
                <div>💰 +{rewardsAwarded.bits} Bits</div>
                <div>🔥 Streak: {rewardsAwarded.streak} day{rewardsAwarded.streak > 1 ? 's' : ''}</div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    );
  }

  if (questions.length === 0) {
    return (
      <Card className="max-w-2xl mx-auto">
        <CardContent className="text-center py-12">
          <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
          <p className="text-lg font-medium text-gray-900 mb-2">All questions answered correctly!</p>
          <p className="text-gray-600">Processing your results...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Quiz Header */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <HelpCircle className="h-5 w-5 text-purple-600" />
            {quiz.title}
          </CardTitle>
          {quiz.description && (
            <p className="text-gray-600">{quiz.description}</p>
          )}
          <div className="flex items-center gap-4 text-sm text-gray-500">
            <span>Questions remaining: {questions.length}</span>
            {quiz.time_limit_minutes && (
              <span>Time limit: {quiz.time_limit_minutes} minutes</span>
            )}
            <span>Passing score: {quiz.passing_score}%</span>
          </div>
        </CardHeader>
      </Card>

      {/* Questions */}
      {questions.map((question, questionIndex) => (
        <Card key={question.id}>
          <CardHeader>
            <CardTitle className="text-lg">
              {questionIndex + 1}. {question.question_text}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {question.answers?.map((answer) => (
                <div key={answer.id} className="flex items-center space-x-3">
                  <input
                    type="radio"
                    id={`${question.id}-${answer.id}`}
                    name={question.id}
                    value={answer.id}
                    checked={selectedAnswers[question.id] === answer.id}
                    onChange={() => handleAnswerSelect(question.id, answer.id)}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                  />
                  <label
                    htmlFor={`${question.id}-${answer.id}`}
                    className="flex-1 text-gray-700 cursor-pointer hover:text-gray-900"
                  >
                    {answer.answer_text}
                  </label>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      ))}

      {/* Submit Button */}
      <div className="flex justify-center">
        <Button
          onClick={handleSubmitAnswers}
          disabled={submitting || Object.keys(selectedAnswers).length === 0}
          size="lg"
          className="px-8"
        >
          {submitting ? (
            <>
              <LoadingSpinner className="mr-2 h-4 w-4" />
              Submitting...
            </>
          ) : (
            "Submit Answers"
          )}
        </Button>
      </div>
    </div>
  );
};
