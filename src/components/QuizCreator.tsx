import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Plus, Trash2, Save } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface QuizQuestion {
  id: string;
  question: string;
  options: string[];
  correct_answer: number;
  explanation?: string;
}

interface QuizCreatorProps {
  lessonId: string;
  onSave: (title: string, questions: QuizQuestion[], xpReward: number) => void;
  onCancel: () => void;
  isLoading?: boolean;
}

const QuizCreator = ({ lessonId, onSave, onCancel, isLoading }: QuizCreatorProps) => {
  const [title, setTitle] = useState('');
  const [xpReward, setXpReward] = useState(75);
  const [questions, setQuestions] = useState<QuizQuestion[]>([
    {
      id: crypto.randomUUID(),
      question: '',
      options: ['', '', '', ''],
      correct_answer: 0,
      explanation: ''
    }
  ]);
  const { toast } = useToast();

  const addQuestion = () => {
    setQuestions([
      ...questions,
      {
        id: crypto.randomUUID(),
        question: '',
        options: ['', '', '', ''],
        correct_answer: 0,
        explanation: ''
      }
    ]);
  };

  const removeQuestion = (index: number) => {
    if (questions.length === 1) {
      toast({
        title: "Cannot remove",
        description: "A quiz must have at least one question",
        variant: "destructive",
      });
      return;
    }
    setQuestions(questions.filter((_, i) => i !== index));
  };

  const updateQuestion = (index: number, field: keyof QuizQuestion, value: any) => {
    const updated = [...questions];
    updated[index] = { ...updated[index], [field]: value };
    setQuestions(updated);
  };

  const updateOption = (questionIndex: number, optionIndex: number, value: string) => {
    const updated = [...questions];
    const newOptions = [...updated[questionIndex].options];
    newOptions[optionIndex] = value;
    updated[questionIndex] = { ...updated[questionIndex], options: newOptions };
    setQuestions(updated);
  };

  const addOption = (questionIndex: number) => {
    const updated = [...questions];
    updated[questionIndex].options.push('');
    setQuestions(updated);
  };

  const removeOption = (questionIndex: number, optionIndex: number) => {
    const updated = [...questions];
    if (updated[questionIndex].options.length <= 2) {
      toast({
        title: "Cannot remove",
        description: "A question must have at least 2 options",
        variant: "destructive",
      });
      return;
    }
    
    updated[questionIndex].options = updated[questionIndex].options.filter((_, i) => i !== optionIndex);
    
    // Adjust correct answer if necessary
    if (updated[questionIndex].correct_answer >= optionIndex) {
      updated[questionIndex].correct_answer = Math.max(0, updated[questionIndex].correct_answer - 1);
    }
    
    setQuestions(updated);
  };

  const validateQuiz = () => {
    if (!title.trim()) {
      throw new Error('Quiz title is required');
    }

    for (let i = 0; i < questions.length; i++) {
      const question = questions[i];
      
      if (!question.question.trim()) {
        throw new Error(`Question ${i + 1} text is required`);
      }

      const validOptions = question.options.filter(opt => opt.trim() !== '');
      if (validOptions.length < 2) {
        throw new Error(`Question ${i + 1} must have at least 2 options`);
      }

      if (question.correct_answer >= validOptions.length) {
        throw new Error(`Question ${i + 1} has an invalid correct answer selection`);
      }
    }
  };

  const handleSave = () => {
    try {
      validateQuiz();
      
      // Clean up questions - remove empty options
      const cleanedQuestions = questions.map(q => ({
        ...q,
        options: q.options.filter(opt => opt.trim() !== '')
      }));
      
      onSave(title, cleanedQuestions, xpReward);
    } catch (error) {
      toast({
        title: "Validation Error",
        description: error instanceof Error ? error.message : "Please check your quiz content",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Create Quiz</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="quiz-title">Quiz Title *</Label>
            <Input
              id="quiz-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter quiz title"
              required
            />
          </div>
          
          <div>
            <Label htmlFor="xp-reward">XP Reward</Label>
            <Input
              id="xp-reward"
              type="number"
              value={xpReward}
              onChange={(e) => setXpReward(parseInt(e.target.value) || 0)}
              min="0"
              max="1000"
            />
          </div>
        </CardContent>
      </Card>

      {questions.map((question, questionIndex) => (
        <Card key={question.id} className="border-l-4 border-l-purple-500">
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle className="text-lg">Question {questionIndex + 1}</CardTitle>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => removeQuestion(questionIndex)}
                disabled={questions.length === 1}
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Question Text *</Label>
              <Textarea
                value={question.question}
                onChange={(e) => updateQuestion(questionIndex, 'question', e.target.value)}
                placeholder="Enter your question"
                rows={3}
                required
              />
            </div>

            <div>
              <Label>Answer Options *</Label>
              <div className="space-y-3 mt-2">
                <RadioGroup
                  value={question.correct_answer.toString()}
                  onValueChange={(value) => updateQuestion(questionIndex, 'correct_answer', parseInt(value))}
                >
                  {question.options.map((option, optionIndex) => (
                    <div key={optionIndex} className="flex items-center space-x-2">
                      <RadioGroupItem 
                        value={optionIndex.toString()} 
                        id={`q${questionIndex}-option-${optionIndex}`}
                      />
                      <div className="flex-1 flex items-center space-x-2">
                        <Input
                          value={option}
                          onChange={(e) => updateOption(questionIndex, optionIndex, e.target.value)}
                          placeholder={`Option ${optionIndex + 1}`}
                        />
                        {question.options.length > 2 && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => removeOption(questionIndex, optionIndex)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </RadioGroup>
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => addOption(questionIndex)}
                  disabled={question.options.length >= 6}
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add Option
                </Button>
              </div>
              <p className="text-sm text-gray-500 mt-1">
                Select the correct answer by clicking the radio button next to it
              </p>
            </div>

            <div>
              <Label>Explanation (Optional)</Label>
              <Textarea
                value={question.explanation || ''}
                onChange={(e) => updateQuestion(questionIndex, 'explanation', e.target.value)}
                placeholder="Provide an explanation for the correct answer"
                rows={2}
              />
            </div>
          </CardContent>
        </Card>
      ))}

      <div className="flex justify-center">
        <Button onClick={addQuestion} variant="outline">
          <Plus className="w-4 h-4 mr-2" />
          Add Question
        </Button>
      </div>

      <div className="flex justify-end space-x-2 pt-4 border-t">
        <Button variant="outline" onClick={onCancel} disabled={isLoading}>
          Cancel
        </Button>
        <Button onClick={handleSave} disabled={isLoading}>
          <Save className="w-4 h-4 mr-2" />
          {isLoading ? 'Saving...' : 'Save Quiz'}
        </Button>
      </div>
    </div>
  );
};

export default QuizCreator;