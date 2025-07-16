import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, XCircle, Trophy, Timer, Brain, TrendingUp, TrendingDown, Zap, Target } from 'lucide-react';
import { useQuizManagement } from '@/hooks/useQuizManagement';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

interface QuizQuestion {
  id: string;
  question: string;
  options: string[];
  correct_answer: number;
  explanation?: string;
  difficulty?: string;
}

interface QuizData {
  id: string;
  title: string;
  questions: QuizQuestion[];
  xp_reward: number;
}

interface AdaptiveQuizPlayerProps {
  quiz: QuizData;
  onComplete: (score: number, answers: number[]) => void;
}

const AdaptiveQuizPlayer = ({ quiz, onComplete }: AdaptiveQuizPlayerProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const {
    createAdaptiveSessionMutation,
    updateAdaptiveSessionMutation,
    completeAdaptiveSessionMutation,
    useLearningProfile
  } = useQuizManagement();

  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<number[]>(new Array(quiz.questions.length).fill(-1));
  const [isCompleted, setIsCompleted] = useState(false);
  const [score, setScore] = useState(0);
  const [showResults, setShowResults] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [currentDifficulty, setCurrentDifficulty] = useState('medium');
  const [questionStartTime, setQuestionStartTime] = useState<Date>(new Date());
  const [timeRemaining, setTimeRemaining] = useState(60); // 60 seconds per question
  const [consecutiveCorrect, setConsecutiveCorrect] = useState(0);
  const [showHint, setShowHint] = useState(false);
  const [responseTime, setResponseTime] = useState(0);
  const [confidenceLevel, setConfidenceLevel] = useState(3);
  const [adaptiveFeedback, setAdaptiveFeedback] = useState<string>('');
  
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const { data: learningProfile } = useLearningProfile();

  // Initialize adaptive session
  useEffect(() => {
    if (quiz.id && !sessionId) {
      createAdaptiveSessionMutation.mutate(quiz.id, {
        onSuccess: (session) => {
          setSessionId(session.id);
          setCurrentDifficulty(session.current_difficulty);
        }
      });
    }
  }, [quiz.id, sessionId]);

  // Timer functionality
  useEffect(() => {
    if (!showResults && !isCompleted) {
      // Adjust timer based on learning profile and difficulty
      const baseTime = learningProfile?.response_time_avg || 30;
      const difficultyMultiplier = currentDifficulty === 'easy' ? 0.8 : currentDifficulty === 'hard' ? 1.5 : 1;
      const adjustedTime = Math.round(baseTime * difficultyMultiplier * (learningProfile?.learning_speed || 1));
      
      setTimeRemaining(Math.max(adjustedTime, 15)); // Minimum 15 seconds
      setQuestionStartTime(new Date());

      timerRef.current = setInterval(() => {
        setTimeRemaining((prev) => {
          if (prev <= 1) {
            handleTimeUp();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [currentQuestion, currentDifficulty, learningProfile]);

  const handleTimeUp = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    
    // Auto-submit with no answer (treated as incorrect)
    const timeTaken = Math.round((new Date().getTime() - questionStartTime.getTime()) / 1000);
    setResponseTime(timeTaken);
    
    if (sessionId) {
      updateAdaptiveSessionMutation.mutate({
        sessionId,
        isCorrect: false,
        responseTime: timeTaken,
        questionIndex: currentQuestion
      }, {
        onSuccess: (result) => {
          setCurrentDifficulty(result.nextDifficulty || currentDifficulty);
          setAdaptiveFeedback(getAdaptiveFeedback(false, timeTaken, result.nextDifficulty));
        }
      });
    }

    setConsecutiveCorrect(0);
    setShowHint(false);
    
    toast({
      title: "Time's up!",
      description: "Moving to the next question.",
      variant: "destructive"
    });

    setTimeout(() => {
      if (currentQuestion < quiz.questions.length - 1) {
        setCurrentQuestion(currentQuestion + 1);
      } else {
        completeQuiz();
      }
    }, 1000);
  };

  const handleAnswerSelect = (answerIndex: number) => {
    const newAnswers = [...answers];
    newAnswers[currentQuestion] = answerIndex;
    setAnswers(newAnswers);
  };

  const handleNext = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }

    const isCorrect = answers[currentQuestion] === quiz.questions[currentQuestion].correct_answer;
    const timeTaken = Math.round((new Date().getTime() - questionStartTime.getTime()) / 1000);
    setResponseTime(timeTaken);

    // Update adaptive session
    if (sessionId) {
      updateAdaptiveSessionMutation.mutate({
        sessionId,
        isCorrect,
        responseTime: timeTaken,
        questionIndex: currentQuestion
      }, {
        onSuccess: (result) => {
          setCurrentDifficulty(result.nextDifficulty || currentDifficulty);
          setAdaptiveFeedback(getAdaptiveFeedback(isCorrect, timeTaken, result.nextDifficulty));
        }
      });
    }

    // Update consecutive correct count
    if (isCorrect) {
      setConsecutiveCorrect(prev => prev + 1);
    } else {
      setConsecutiveCorrect(0);
    }

    setShowHint(false);

    if (currentQuestion < quiz.questions.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
    } else {
      completeQuiz();
    }
  };

  const getAdaptiveFeedback = (isCorrect: boolean, timeTaken: number, nextDifficulty?: string) => {
    const avgTime = learningProfile?.response_time_avg || 30;
    
    if (isCorrect && timeTaken < avgTime * 0.7) {
      return "Excellent! You're answering quickly and correctly. ";
    } else if (isCorrect && timeTaken > avgTime * 1.5) {
      return "Good job! Take your time to think through the answers. ";
    } else if (!isCorrect && timeTaken < avgTime * 0.5) {
      return "Slow down and read carefully. Quick answers aren't always correct. ";
    } else if (!isCorrect) {
      return "Don't worry! This helps us adjust to your learning style. ";
    }
    
    if (nextDifficulty !== currentDifficulty) {
      if (nextDifficulty === 'hard') {
        return "Great progress! We're increasing the difficulty. ";
      } else if (nextDifficulty === 'easy') {
        return "Let's try some easier questions to build confidence. ";
      }
    }
    
    return "Keep going! You're doing well. ";
  };

  const completeQuiz = () => {
    const correctAnswers = answers.filter((answer, index) => 
      answer === quiz.questions[index].correct_answer
    ).length;
    
    const finalScore = Math.round((correctAnswers / quiz.questions.length) * 100);
    setScore(finalScore);
    setIsCompleted(true);
    setShowResults(true);

    // Complete adaptive session
    if (sessionId) {
      completeAdaptiveSessionMutation.mutate(sessionId);
    }

    onComplete(finalScore, answers);
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'easy': return 'bg-green-500';
      case 'medium': return 'bg-yellow-500';
      case 'hard': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const getDifficultyIcon = (difficulty: string) => {
    switch (difficulty) {
      case 'easy': return <TrendingDown className="w-4 h-4" />;
      case 'medium': return <Target className="w-4 h-4" />;
      case 'hard': return <TrendingUp className="w-4 h-4" />;
      default: return <Brain className="w-4 h-4" />;
    }
  };

  const getTimeColor = () => {
    const percentage = (timeRemaining / 60) * 100;
    if (percentage > 50) return 'text-green-600';
    if (percentage > 20) return 'text-yellow-600';
    return 'text-red-600';
  };

  const progress = ((currentQuestion + 1) / quiz.questions.length) * 100;
  const question = quiz.questions[currentQuestion];

  if (showResults) {
    return (
      <Card className="w-full max-w-2xl mx-auto">
        <CardHeader className="text-center">
          <CardTitle className="flex items-center justify-center gap-2">
            <Trophy className="w-6 h-6 text-yellow-500" />
            Adaptive Quiz Complete!
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="text-center">
            <div className="text-4xl font-bold text-primary mb-2">{score}%</div>
            <p className="text-gray-600">
              You got {answers.filter((answer, index) => answer === quiz.questions[index].correct_answer).length} out of {quiz.questions.length} questions correct
            </p>
            {score >= 70 && (
              <div className="mt-4 p-4 bg-green-50 rounded-lg">
                <p className="text-green-800 font-medium">
                  Congratulations! You earned {quiz.xp_reward} XP
                </p>
              </div>
            )}
          </div>

          {/* Learning Analytics */}
          <div className="grid grid-cols-2 gap-4 p-4 bg-blue-50 rounded-lg">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{responseTime}s</div>
              <p className="text-sm text-blue-800">Avg Response Time</p>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{consecutiveCorrect}</div>
              <p className="text-sm text-blue-800">Best Streak</p>
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="font-semibold flex items-center gap-2">
              <Brain className="w-5 h-5" />
              Adaptive Review:
            </h3>
            {quiz.questions.map((q, index) => (
              <div key={q.id} className="p-4 border rounded-lg">
                <div className="flex items-start gap-2 mb-2">
                  {answers[index] === q.correct_answer ? (
                    <CheckCircle className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                  ) : (
                    <XCircle className="w-5 h-5 text-red-500 mt-0.5 flex-shrink-0" />
                  )}
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <p className="font-medium">{q.question}</p>
                      <Badge 
                        variant="secondary" 
                        className={`${getDifficultyColor(q.difficulty || 'medium')} text-white`}
                      >
                        {q.difficulty || 'medium'}
                      </Badge>
                    </div>
                    <div className="mt-2 space-y-1">
                      <p className="text-sm">
                        <span className="text-gray-600">Your answer:</span>{" "}
                        <span className={answers[index] === q.correct_answer ? "text-green-600" : "text-red-600"}>
                          {answers[index] >= 0 ? q.options[answers[index]] : "Not answered"}
                        </span>
                      </p>
                      {answers[index] !== q.correct_answer && (
                        <p className="text-sm">
                          <span className="text-gray-600">Correct answer:</span>{" "}
                          <span className="text-green-600">{q.options[q.correct_answer]}</span>
                        </p>
                      )}
                    </div>
                    {q.explanation && (
                      <p className="text-sm text-gray-600 mt-2 p-2 bg-gray-50 rounded">
                        {q.explanation}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle className="flex items-center gap-2">
            <Brain className="w-6 h-6" />
            {quiz.title}
          </CardTitle>
          <div className="flex items-center gap-2">
            <Badge 
              variant="secondary" 
              className={`${getDifficultyColor(currentDifficulty)} text-white flex items-center gap-1`}
            >
              {getDifficultyIcon(currentDifficulty)}
              {currentDifficulty}
            </Badge>
            <span className="text-sm text-gray-500">
              Question {currentQuestion + 1} of {quiz.questions.length}
            </span>
          </div>
        </div>
        <Progress value={progress} className="w-full" />
        
        {/* Timer and Stats */}
        <div className="flex items-center justify-between text-sm">
          <div className={`flex items-center gap-1 ${getTimeColor()}`}>
            <Timer className="w-4 h-4" />
            <span>{timeRemaining}s</span>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1 text-green-600">
              <Zap className="w-4 h-4" />
              <span>{consecutiveCorrect} streak</span>
            </div>
            {adaptiveFeedback && (
              <div className="text-blue-600 text-xs max-w-xs">
                {adaptiveFeedback}
              </div>
            )}
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-6">
        <div>
          <h3 className="text-lg font-medium mb-4">{question.question}</h3>
          
          <RadioGroup 
            value={answers[currentQuestion]?.toString() || ""} 
            onValueChange={(value) => handleAnswerSelect(parseInt(value))}
          >
            {question.options.map((option, index) => (
              <div key={index} className="flex items-center space-x-2">
                <RadioGroupItem value={index.toString()} id={`option-${index}`} />
                <Label htmlFor={`option-${index}`} className="flex-1 cursor-pointer">
                  {option}
                </Label>
              </div>
            ))}
          </RadioGroup>
        </div>

        {/* Adaptive Hints */}
        {currentDifficulty === 'hard' && timeRemaining < 20 && !showHint && (
          <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowHint(true)}
              className="text-yellow-700 border-yellow-300"
            >
              Need a hint? 💡
            </Button>
          </div>
        )}

        {showHint && question.explanation && (
          <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm text-blue-700">
              💡 Hint: {question.explanation.substring(0, 100)}...
            </p>
          </div>
        )}

        <div className="flex justify-between">
          <Button 
            variant="outline" 
            onClick={() => setCurrentQuestion(Math.max(0, currentQuestion - 1))}
            disabled={currentQuestion === 0}
          >
            Previous
          </Button>
          
          <Button 
            onClick={handleNext}
            disabled={answers[currentQuestion] === -1}
            className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
          >
            {currentQuestion === quiz.questions.length - 1 ? 'Complete Quiz' : 'Next'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default AdaptiveQuizPlayer;