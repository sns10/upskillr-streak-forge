import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { CheckCircle, XCircle, Trophy } from 'lucide-react';

interface QuizQuestion {
  id: string;
  question: string;
  options: string[];
  correct_answer: number;
  explanation?: string;
}

interface QuizData {
  id: string;
  title: string;
  questions: QuizQuestion[];
  xp_reward: number;
}

interface QuizPlayerProps {
  quiz: QuizData;
  onComplete: (score: number, answers: number[]) => void;
}

const QuizPlayer = ({ quiz, onComplete }: QuizPlayerProps) => {
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<number[]>(new Array(quiz.questions.length).fill(-1));
  const [isCompleted, setIsCompleted] = useState(false);
  const [score, setScore] = useState(0);
  const [showResults, setShowResults] = useState(false);

  const handleAnswerSelect = (answerIndex: number) => {
    const newAnswers = [...answers];
    newAnswers[currentQuestion] = answerIndex;
    setAnswers(newAnswers);
  };

  const handleNext = () => {
    if (currentQuestion < quiz.questions.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
    } else {
      completeQuiz();
    }
  };

  const handlePrevious = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion(currentQuestion - 1);
    }
  };

  const completeQuiz = () => {
    const correctAnswers = answers.filter((answer, index) => 
      answer === quiz.questions[index].correct_answer
    ).length;
    
    const finalScore = Math.round((correctAnswers / quiz.questions.length) * 100);
    setScore(finalScore);
    setIsCompleted(true);
    setShowResults(true);
    onComplete(finalScore, answers);
  };

  const progress = ((currentQuestion + 1) / quiz.questions.length) * 100;
  const question = quiz.questions[currentQuestion];

  if (showResults) {
    return (
      <Card className="w-full max-w-2xl mx-auto">
        <CardHeader className="text-center">
          <CardTitle className="flex items-center justify-center gap-2">
            <Trophy className="w-6 h-6 text-yellow-500" />
            Quiz Complete!
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

          <div className="space-y-4">
            <h3 className="font-semibold">Review Your Answers:</h3>
            {quiz.questions.map((q, index) => (
              <div key={q.id} className="p-4 border rounded-lg">
                <div className="flex items-start gap-2 mb-2">
                  {answers[index] === q.correct_answer ? (
                    <CheckCircle className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                  ) : (
                    <XCircle className="w-5 h-5 text-red-500 mt-0.5 flex-shrink-0" />
                  )}
                  <div className="flex-1">
                    <p className="font-medium">{q.question}</p>
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
          <CardTitle>{quiz.title}</CardTitle>
          <span className="text-sm text-gray-500">
            Question {currentQuestion + 1} of {quiz.questions.length}
          </span>
        </div>
        <Progress value={progress} className="w-full" />
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

        <div className="flex justify-between">
          <Button 
            variant="outline" 
            onClick={handlePrevious}
            disabled={currentQuestion === 0}
          >
            Previous
          </Button>
          
          <Button 
            onClick={handleNext}
            disabled={answers[currentQuestion] === -1}
          >
            {currentQuestion === quiz.questions.length - 1 ? 'Complete Quiz' : 'Next'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default QuizPlayer;