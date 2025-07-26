import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { AdminLayout } from "@/components/AdminLayout";
import { Navigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Plus, Edit, Trash2, ArrowLeft, HelpCircle, CheckCircle, XCircle } from "lucide-react";

interface Question {
  id: string;
  question_text: string;
  question_type: string;
  points: number;
  order_num: number;
  remedial_lesson_id: string | null;
  answers: Answer[];
  remedial_lesson?: {
    title: string;
  };
}

interface Answer {
  id: string;
  answer_text: string;
  is_correct: boolean;
  order_num: number;
}

interface Quiz {
  id: string;
  title: string;
  lessons: {
    title: string;
    courses: {
      title: string;
    };
  };
}

interface Lesson {
  id: string;
  title: string;
  courses: {
    title: string;
  };
}

export const AdminQuizQuestions = () => {
  const { user, isAdmin, loading: authLoading } = useAuth();
  const { quizId } = useParams();
  const navigate = useNavigate();
  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState<Question | null>(null);
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    question_text: "",
    question_type: "multiple_choice",
    points: 1,
    remedial_lesson_id: "",
  });

  const [answers, setAnswers] = useState<{ text: string; isCorrect: boolean }[]>([
    { text: "", isCorrect: false },
    { text: "", isCorrect: false },
    { text: "", isCorrect: false },
    { text: "", isCorrect: false },
  ]);

  useEffect(() => {
    if (quizId) {
      fetchQuiz();
      fetchQuestions();
      fetchLessons();
    }
  }, [quizId]);

  const fetchQuiz = async () => {
    try {
      const { data, error } = await supabase
        .from('quizzes')
        .select(`
          id,
          title,
          lessons(title, courses(title))
        `)
        .eq('id', quizId)
        .single();

      if (error) throw error;
      setQuiz(data);
    } catch (error) {
      console.error('Error fetching quiz:', error);
      navigate('/admin/quizzes');
    }
  };

  const fetchQuestions = async () => {
    try {
      const { data, error } = await supabase
        .from('questions')
        .select(`
          *,
          answers(*),
          remedial_lesson:lessons(title)
        `)
        .eq('quiz_id', quizId)
        .order('order_num');

      if (error) throw error;
      setQuestions(data || []);
    } catch (error) {
      console.error('Error fetching questions:', error);
      toast({
        title: "Error",
        description: "Failed to fetch questions",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchLessons = async () => {
    try {
      const { data, error } = await supabase
        .from('lessons')
        .select('id, title, courses(title)')
        .order('title');

      if (error) throw error;
      setLessons(data || []);
    } catch (error) {
      console.error('Error fetching lessons:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate at least one correct answer
    const hasCorrectAnswer = answers.some(answer => answer.isCorrect && answer.text.trim());
    if (!hasCorrectAnswer) {
      toast({
        title: "Error",
        description: "Please mark at least one answer as correct",
        variant: "destructive",
      });
      return;
    }

    try {
      const questionData = {
        ...formData,
        quiz_id: quizId,
        order_num: editingQuestion ? editingQuestion.order_num : questions.length + 1,
        remedial_lesson_id: formData.remedial_lesson_id || null,
      };

      let questionId: string;

      if (editingQuestion) {
        const { error } = await supabase
          .from('questions')
          .update(questionData)
          .eq('id', editingQuestion.id);
        
        if (error) throw error;
        questionId = editingQuestion.id;

        // Delete existing answers
        await supabase
          .from('answers')
          .delete()
          .eq('question_id', questionId);
      } else {
        const { data, error } = await supabase
          .from('questions')
          .insert(questionData)
          .select()
          .single();
        
        if (error) throw error;
        questionId = data.id;
      }

      // Insert new answers
      const answersData = answers
        .filter(answer => answer.text.trim())
        .map((answer, index) => ({
          question_id: questionId,
          answer_text: answer.text.trim(),
          is_correct: answer.isCorrect,
          order_num: index + 1,
        }));

      if (answersData.length > 0) {
        const { error: answersError } = await supabase
          .from('answers')
          .insert(answersData);

        if (answersError) throw answersError;
      }
      
      toast({
        title: "Success",
        description: editingQuestion ? "Question updated successfully" : "Question created successfully",
      });
      
      setIsDialogOpen(false);
      setEditingQuestion(null);
      resetForm();
      fetchQuestions();
    } catch (error) {
      console.error('Error saving question:', error);
      toast({
        title: "Error",
        description: "Failed to save question",
        variant: "destructive",
      });
    }
  };

  const handleEdit = (question: Question) => {
    setEditingQuestion(question);
    setFormData({
      question_text: question.question_text,
      question_type: question.question_type,
      points: question.points,
      remedial_lesson_id: question.remedial_lesson_id || "",
    });
    
    // Fill answers array with existing answers
    const existingAnswers = question.answers.sort((a, b) => a.order_num - b.order_num);
    const newAnswers = [...existingAnswers.map(a => ({ text: a.answer_text, isCorrect: a.is_correct }))];
    
    // Ensure we have at least 4 answer slots
    while (newAnswers.length < 4) {
      newAnswers.push({ text: "", isCorrect: false });
    }
    
    setAnswers(newAnswers);
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this question? This will also delete all associated answers.')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('questions')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Question deleted successfully",
      });
      
      fetchQuestions();
    } catch (error) {
      console.error('Error deleting question:', error);
      toast({
        title: "Error",
        description: "Failed to delete question",
        variant: "destructive",
      });
    }
  };

  const resetForm = () => {
    setFormData({
      question_text: "",
      question_type: "multiple_choice",
      points: 1,
      remedial_lesson_id: "",
    });
    setAnswers([
      { text: "", isCorrect: false },
      { text: "", isCorrect: false },
      { text: "", isCorrect: false },
      { text: "", isCorrect: false },
    ]);
  };

  const openCreateDialog = () => {
    setEditingQuestion(null);
    resetForm();
    setIsDialogOpen(true);
  };

  const updateAnswer = (index: number, field: 'text' | 'isCorrect', value: string | boolean) => {
    const newAnswers = [...answers];
    newAnswers[index] = { ...newAnswers[index], [field]: value };
    setAnswers(newAnswers);
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  if (!user || !isAdmin) {
    return <Navigate to="/" replace />;
  }

  if (loading) {
    return (
      <AdminLayout user={user}>
        <div className="flex items-center justify-center py-12">
          <LoadingSpinner />
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout user={user}>
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="outline" onClick={() => navigate('/admin/quizzes')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Quizzes
          </Button>
          <div>
            <h1 className="text-3xl font-bold">Quiz Questions</h1>
            {quiz && (
              <p className="text-muted-foreground">
                {quiz.title} • {quiz.lessons?.title} • {quiz.lessons?.courses?.title}
              </p>
            )}
          </div>
        </div>

        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-xl font-semibold">Questions ({questions.length})</h2>
            <p className="text-muted-foreground">Manage questions and answers for this quiz</p>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={openCreateDialog}>
                <Plus className="h-4 w-4 mr-2" />
                Add Question
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>
                  {editingQuestion ? 'Edit Question' : 'Create New Question'}
                </DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="question_text">Question Text</Label>
                  <Textarea
                    id="question_text"
                    value={formData.question_text}
                    onChange={(e) => setFormData({ ...formData, question_text: e.target.value })}
                    rows={3}
                    required
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="question_type">Question Type</Label>
                    <Select value={formData.question_type} onValueChange={(value) => setFormData({ ...formData, question_type: value })}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="multiple_choice">Multiple Choice</SelectItem>
                        <SelectItem value="true_false">True/False</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <Label htmlFor="points">Points</Label>
                    <Input
                      id="points"
                      type="number"
                      value={formData.points}
                      onChange={(e) => setFormData({ ...formData, points: parseInt(e.target.value) })}
                      min="1"
                    />
                  </div>
                </div>
                
                <div>
                  <Label htmlFor="remedial_lesson">Remedial Lesson (Optional)</Label>
                  <Select value={formData.remedial_lesson_id || "none"} onValueChange={(value) => setFormData({ ...formData, remedial_lesson_id: value === "none" ? "" : value })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a remedial lesson" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">No remedial lesson</SelectItem>
                      {lessons.map((lesson) => (
                        <SelectItem key={lesson.id} value={lesson.id}>
                          {lesson.title} ({lesson.courses?.title})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label>Answer Options</Label>
                  <div className="space-y-3 mt-2">
                    {answers.map((answer, index) => (
                      <div key={index} className="flex items-center space-x-2">
                        <Input
                          placeholder={`Answer option ${index + 1}`}
                          value={answer.text}
                          onChange={(e) => updateAnswer(index, 'text', e.target.value)}
                        />
                        <Button
                          type="button"
                          variant={answer.isCorrect ? "default" : "outline"}
                          size="sm"
                          onClick={() => updateAnswer(index, 'isCorrect', !answer.isCorrect)}
                          className="px-3"
                        >
                          {answer.isCorrect ? (
                            <CheckCircle className="h-4 w-4" />
                          ) : (
                            <XCircle className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                    ))}
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">
                    Click the circle icon to mark correct answers
                  </p>
                </div>
                
                <div className="flex justify-end space-x-2">
                  <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit">
                    {editingQuestion ? 'Update' : 'Create'} Question
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <div className="grid gap-4">
          {questions.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <HelpCircle className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium mb-2">No questions found</h3>
                <p className="text-muted-foreground text-center mb-4">
                  Add your first question to get started
                </p>
                <Button onClick={openCreateDialog}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Question
                </Button>
              </CardContent>
            </Card>
          ) : (
            questions.map((question, index) => (
              <Card key={question.id}>
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <CardTitle className="flex items-center gap-2">
                        <span className="bg-primary text-primary-foreground rounded-full w-6 h-6 flex items-center justify-center text-sm">
                          {index + 1}
                        </span>
                        {question.question_text}
                      </CardTitle>
                      <CardDescription className="flex items-center gap-2 mt-2">
                        <Badge variant="outline">{question.question_type.replace('_', ' ')}</Badge>
                        <Badge variant="secondary">{question.points} points</Badge>
                        {question.remedial_lesson && (
                          <Badge variant="outline">
                            Remedial: {question.remedial_lesson.title}
                          </Badge>
                        )}
                      </CardDescription>
                    </div>
                    <div className="flex space-x-2">
                      <Button variant="outline" size="sm" onClick={() => handleEdit(question)}>
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => handleDelete(question.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {question.answers.sort((a, b) => a.order_num - b.order_num).map((answer) => (
                      <div key={answer.id} className={`flex items-center gap-2 p-2 rounded ${answer.is_correct ? 'bg-green-50 border border-green-200' : 'bg-gray-50'}`}>
                        {answer.is_correct ? (
                          <CheckCircle className="h-4 w-4 text-green-600" />
                        ) : (
                          <XCircle className="h-4 w-4 text-gray-400" />
                        )}
                        <span className={answer.is_correct ? 'font-medium text-green-800' : 'text-gray-700'}>
                          {answer.answer_text}
                        </span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
    </AdminLayout>
  );
};