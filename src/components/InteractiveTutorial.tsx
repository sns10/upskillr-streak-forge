import React, { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Progress } from './ui/progress';
import { Badge } from './ui/badge';
import { Textarea } from './ui/textarea';
import { 
  BookOpen, 
  Play, 
  Pause, 
  SkipForward, 
  CheckCircle, 
  XCircle, 
  ArrowRight, 
  ArrowLeft,
  Target,
  Clock,
  Star,
  Lightbulb,
  Code,
  Eye,
  EyeOff
} from 'lucide-react';
import { useToast } from '../hooks/use-toast';

interface TutorialStep {
  id: string;
  title: string;
  description: string;
  content: string;
  codeExample?: string;
  exercise?: {
    question: string;
    expectedOutput: string;
    hints: string[];
  };
  completed: boolean;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  estimatedTime: number; // in minutes
}

interface InteractiveTutorialProps {
  topic: string;
  userId: string;
  onComplete?: (tutorialId: string) => void;
}

export const InteractiveTutorial: React.FC<InteractiveTutorialProps> = ({
  topic,
  userId,
  onComplete
}) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [steps, setSteps] = useState<TutorialStep[]>([]);
  const [isPlaying, setIsPlaying] = useState(false);
  const [showSolution, setShowSolution] = useState(false);
  const [userAnswer, setUserAnswer] = useState('');
  const [isChecking, setIsChecking] = useState(false);
  const [timeSpent, setTimeSpent] = useState(0);
  const { toast } = useToast();

  useEffect(() => {
    loadTutorialSteps();
  }, [topic]);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isPlaying) {
      interval = setInterval(() => {
        setTimeSpent(prev => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isPlaying]);

  const loadTutorialSteps = () => {
    // Generate tutorial steps based on topic
    const tutorialSteps: TutorialStep[] = [
      {
        id: 'intro',
        title: 'Introduction to Python Input',
        description: 'Learn how to get user input in Python',
        content: 'In Python, the `input()` function is used to get user input from the keyboard. It always returns a string, even if the user enters a number.',
        codeExample: `# Basic input
name = input("Enter your name: ")
print("Hello, " + name)

# Input with type conversion
age = int(input("Enter your age: "))
print(f"You are {age} years old")`,
        completed: false,
        difficulty: 'beginner',
        estimatedTime: 3
      },
      {
        id: 'practice',
        title: 'Practice: Getting User Input',
        description: 'Try getting input from the user',
        content: 'Now it\'s your turn to practice! Write a program that gets user input and processes it.',
        exercise: {
          question: 'Write a program that asks for the user\'s name and age, then prints a greeting with their age.',
          expectedOutput: 'Hello John, you are 25 years old',
          hints: [
            'Use input() to get the name and age',
            'Convert age to integer using int()',
            'Use print() to display the result'
          ]
        },
        completed: false,
        difficulty: 'beginner',
        estimatedTime: 5
      },
      {
        id: 'string_ops',
        title: 'String Operations',
        description: 'Learn about string concatenation and formatting',
        content: 'Python provides several ways to work with strings. You can concatenate them using the + operator, or use f-strings for better formatting.',
        codeExample: `# String concatenation
first = "Hello"
second = "World"
result = first + " " + second

# F-strings (recommended)
name = "Alice"
greeting = f"Hello, {name}!"

# String formatting
age = 25
message = "I am {} years old".format(age)`,
        completed: false,
        difficulty: 'beginner',
        estimatedTime: 4
      },
      {
        id: 'final_exercise',
        title: 'Final Exercise: Complete Program',
        description: 'Combine everything you\'ve learned',
        content: 'Time to put it all together! Create a complete program that demonstrates all the concepts you\'ve learned.',
        exercise: {
          question: 'Create a program that asks for two numbers, adds them together, and displays the result with a nice message.',
          expectedOutput: 'The sum of 5 and 3 is 8',
          hints: [
            'Get two numbers as input',
            'Convert them to integers',
            'Add them together',
            'Display the result with a formatted message'
          ]
        },
        completed: false,
        difficulty: 'beginner',
        estimatedTime: 7
      }
    ];

    setSteps(tutorialSteps);
  };

  const nextStep = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(prev => prev + 1);
      setUserAnswer('');
      setShowSolution(false);
    } else {
      completeTutorial();
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
      setUserAnswer('');
      setShowSolution(false);
    }
  };

  const togglePlay = () => {
    setIsPlaying(!isPlaying);
  };

  const checkAnswer = async () => {
    if (!steps[currentStep].exercise) return;

    setIsChecking(true);
    try {
      // Simulate answer checking
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Simple validation (in real app, this would be more sophisticated)
      const isCorrect = userAnswer.toLowerCase().includes('input') && 
                       userAnswer.toLowerCase().includes('print');

      if (isCorrect) {
        // Mark step as completed
        const updatedSteps = [...steps];
        updatedSteps[currentStep].completed = true;
        setSteps(updatedSteps);

        toast({
          title: "Correct! 🎉",
          description: "Great job! You've completed this step.",
        });

        // Auto-advance after a short delay
        setTimeout(() => {
          nextStep();
        }, 1500);
      } else {
        toast({
          title: "Try Again",
          description: "That's not quite right. Check the hints for guidance.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error checking answer:', error);
    } finally {
      setIsChecking(false);
    }
  };

  const completeTutorial = () => {
    const completedSteps = steps.filter(step => step.completed).length;
    const totalSteps = steps.length;
    const completionRate = (completedSteps / totalSteps) * 100;

    toast({
      title: "Tutorial Complete! 🎉",
      description: `You completed ${completedSteps}/${totalSteps} steps (${Math.round(completionRate)}%)`,
    });

    if (onComplete) {
      onComplete(topic);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const currentStepData = steps[currentStep];
  const progress = steps.length > 0 ? ((currentStep + 1) / steps.length) * 100 : 0;
  const completedSteps = steps.filter(step => step.completed).length;

  if (!currentStepData) {
    return (
      <Card className="w-full">
        <CardContent className="p-6">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p>Loading tutorial...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <BookOpen className="h-5 w-5" />
            Interactive Tutorial: {topic}
          </CardTitle>
          <div className="flex items-center gap-2">
            <Badge variant="outline">
              <Clock className="h-3 w-3 mr-1" />
              {formatTime(timeSpent)}
            </Badge>
            <Badge variant="secondary">
              {completedSteps}/{steps.length} completed
            </Badge>
          </div>
        </div>
        
        {/* Progress Bar */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm text-muted-foreground">
            <span>Step {currentStep + 1} of {steps.length}</span>
            <span>{Math.round(progress)}% complete</span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Step Navigation */}
        <div className="flex items-center justify-between">
          <Button
            variant="outline"
            onClick={prevStep}
            disabled={currentStep === 0}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Previous
          </Button>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={togglePlay}
              className="flex items-center gap-2"
            >
              {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
              {isPlaying ? 'Pause' : 'Play'}
            </Button>
            
            <Button
              variant="outline"
              size="sm"
              onClick={nextStep}
              disabled={currentStep === steps.length - 1}
              className="flex items-center gap-2"
            >
              Next
              <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Current Step Content */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">{currentStepData.title}</h3>
            <div className="flex items-center gap-2">
              <Badge variant={
                currentStepData.difficulty === 'beginner' ? 'default' :
                currentStepData.difficulty === 'intermediate' ? 'secondary' : 'destructive'
              }>
                {currentStepData.difficulty}
              </Badge>
              {currentStepData.completed && (
                <CheckCircle className="h-5 w-5 text-green-500" />
              )}
            </div>
          </div>

          <p className="text-muted-foreground">{currentStepData.description}</p>

          {/* Content */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <p className="text-sm">{currentStepData.content}</p>
          </div>

          {/* Code Example */}
          {currentStepData.codeExample && (
            <div className="space-y-2">
              <h4 className="font-medium flex items-center gap-2">
                <Code className="h-4 w-4" />
                Code Example
              </h4>
              <div className="bg-gray-900 text-green-400 p-4 rounded-lg font-mono text-sm overflow-x-auto">
                <pre>{currentStepData.codeExample}</pre>
              </div>
            </div>
          )}

          {/* Exercise */}
          {currentStepData.exercise && (
            <div className="space-y-4 border-t pt-4">
              <h4 className="font-medium flex items-center gap-2">
                <Target className="h-4 w-4" />
                Practice Exercise
              </h4>
              
              <div className="bg-blue-50 p-4 rounded-lg">
                <p className="text-sm font-medium mb-2">Question:</p>
                <p className="text-sm">{currentStepData.exercise.question}</p>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Your Answer:</label>
                <Textarea
                  value={userAnswer}
                  onChange={(e) => setUserAnswer(e.target.value)}
                  placeholder="Write your code here..."
                  className="font-mono text-sm"
                  rows={6}
                />
              </div>

              {/* Hints */}
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Lightbulb className="h-4 w-4 text-yellow-500" />
                  <span className="text-sm font-medium">Hints:</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowSolution(!showSolution)}
                    className="ml-auto"
                  >
                    {showSolution ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    {showSolution ? 'Hide' : 'Show'} Solution
                  </Button>
                </div>
                
                <div className="space-y-1">
                  {currentStepData.exercise.hints.map((hint, index) => (
                    <div key={index} className="text-sm text-muted-foreground flex items-start gap-2">
                      <span className="text-blue-500">•</span>
                      <span>{hint}</span>
                    </div>
                  ))}
                </div>

                {showSolution && (
                  <div className="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <p className="text-sm font-medium text-yellow-800 mb-2">Solution:</p>
                    <div className="bg-gray-900 text-green-400 p-3 rounded-lg font-mono text-sm">
                      <pre>{`name = input("Enter your name: ")
age = int(input("Enter your age: "))
print(f"Hello {name}, you are {age} years old")`}</pre>
                    </div>
                  </div>
                )}
              </div>

              <div className="flex gap-2">
                <Button
                  onClick={checkAnswer}
                  disabled={!userAnswer.trim() || isChecking}
                  className="flex items-center gap-2"
                >
                  {isChecking ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  ) : (
                    <CheckCircle className="h-4 w-4" />
                  )}
                  {isChecking ? 'Checking...' : 'Check Answer'}
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Step Indicators */}
        <div className="flex justify-center gap-2">
          {steps.map((step, index) => (
            <div
              key={step.id}
              className={`w-3 h-3 rounded-full cursor-pointer transition-colors ${
                index === currentStep
                  ? 'bg-primary'
                  : step.completed
                  ? 'bg-green-500'
                  : 'bg-gray-300'
              }`}
              onClick={() => setCurrentStep(index)}
            />
          ))}
        </div>
      </CardContent>
    </Card>
  );
}; 