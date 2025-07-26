import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";  
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, Play, Code, CheckCircle, XCircle, HelpCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { ActivityTracker } from "@/lib/activityTracker";
import { updateStreakOnActivity } from "@/lib/streakManager";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useResponsive } from "@/hooks/useResponsive";
import { MobileCodeEditor } from "./MobileCodeEditor";
import { MobileTestResults } from "./MobileTestResults";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { ProgressBar } from "@/components/ui/progress-bar";
import { ErrorBoundary } from "@/components/ui/error-boundary";
import { useRetry } from "@/hooks/useRetry";
import { useLocalStorage } from "@/hooks/useLocalStorage";
import { QuizPlayer } from "./QuizPlayer";

interface Lesson {
  id: string;
  title: string;
  lesson_type: 'video' | 'coding' | 'quiz';
  video_url?: string;
  course_id: string;
  xp_reward: number;
  bits_reward: number;
  order_num: number;
}

interface CodingAssignment {
  id: string;
  problem_statement: string;
  test_cases: any;
  test_inputs: any;
  test_outputs: any;
  lesson_id: string;
  title?: string; // Add title for display
}

interface Quiz {
  id: string;
  title: string;
  description: string;
  lesson_id: string;
  passing_score: number;
  max_attempts: number;
  time_limit_minutes: number;
}

interface TestResult {
  testCaseIndex: number;
  input: any;
  expected: any;
  actual: any;
  passed: boolean;
  error?: string;
  executionTime?: number;
}

interface UserProfile {
  id: string;
  xp: number;
  bits: number;
  streak: number;
  last_activity_date: string | null;
}

type LessonStage = 'main' | 'quiz' | 'completed';

export const LessonPlayer = () => {
  const { lessonId } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const responsive = useResponsive();
  const { retry, isRetrying } = useRetry();
  
  // Properly destructure responsive values
  const { isMobile, isTablet } = responsive;
  
  const [lesson, setLesson] = useState<Lesson | null>(null);
  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [codingAssignments, setCodingAssignments] = useState<CodingAssignment[]>([]);
  const [selectedAssignment, setSelectedAssignment] = useState<CodingAssignment | null>(null);
  const [loading, setLoading] = useState(true);
  const [assignmentLoading, setAssignmentLoading] = useState(false);
  const [currentStage, setCurrentStage] = useState<LessonStage>('main');
  const [mainContentCompleted, setMainContentCompleted] = useState(false);
  const [quizCompleted, setQuizCompleted] = useState(false);
  const [userCode, setUserCode] = useState("# Write your Python code here...\n# Example:\ndef solve(input_data):\n    # Your solution here\n    return input_data");
  const [testResults, setTestResults] = useState<TestResult[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [showSuccessDialog, setShowSuccessDialog] = useState(false);
  const [isFirstTime, setIsFirstTime] = useState(false);
  const [earnedXP, setEarnedXP] = useState(0);
  const [earnedBits, setEarnedBits] = useState(0);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  
  const [codeDraft, setCodeDraft] = useLocalStorage(`lesson-${lessonId}-code`, userCode);
  const [executionProgress, setExecutionProgress] = useState(0);

  // Auto-save code drafts
  useEffect(() => {
    const timer = setTimeout(() => {
      if (userCode !== codeDraft) {
        setCodeDraft(userCode);
      }
    }, 2000);

    return () => clearTimeout(timer);
  }, [userCode, codeDraft, setCodeDraft]);

  // Load saved code draft
  useEffect(() => {
    if (codeDraft && codeDraft !== userCode) {
      setUserCode(codeDraft);
    }
  }, [codeDraft]);

  useEffect(() => {
    if (lessonId) {
      loadLessonData();
      fetchUserProfile();
    }
  }, [lessonId]);

  useEffect(() => {
    if (lesson) {
      if (lesson.lesson_type === 'coding') {
        fetchCodingAssignments();
      }
      checkMainContentCompletion();
    }
  }, [lesson]);

  const fetchUserProfile = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from("user_profiles")
        .select("*")
        .eq("id", user.id)
        .single();

      if (error) throw error;
      setUserProfile(data);
    } catch (error: any) {
      console.error("Error fetching user profile:", error);
    }
  };

  const loadLessonData = async () => {
    try {
      setLoading(true);
      
      // First try to get lesson directly by ID
      let { data: lessonData, error: lessonError } = await supabase
        .from("lessons")
        .select("*")
        .eq("id", lessonId)
        .single();

      // If not found, check if lessonId is actually a coding assignment ID
      if (lessonError && lessonError.code === 'PGRST116') {
        console.log("Lesson not found by ID, checking if it's a coding assignment ID...");
        
        const { data: assignmentData, error: assignmentError } = await supabase
          .from("coding_assignments")
          .select("lesson_id")
          .eq("id", lessonId)
          .single();

        if (!assignmentError && assignmentData) {
          console.log("Found coding assignment, fetching actual lesson...");
          const { data: actualLessonData, error: actualLessonError } = await supabase
            .from("lessons")
            .select("*")
            .eq("id", assignmentData.lesson_id)
            .single();

          if (actualLessonError) throw actualLessonError;
          lessonData = actualLessonData;
          lessonError = null;
        }
      }

      if (lessonError) throw lessonError;
      
      console.log('Lesson loaded successfully:', lessonData);
      console.log('Lesson type detected:', lessonData?.lesson_type);
      setLesson(lessonData);

      // Check if this lesson has an associated quiz
      await checkForAssociatedQuiz(lessonData.id);
      
    } catch (error: any) {
      console.error("Error loading lesson data:", error);
      toast({
        title: "Error",
        description: "Failed to load lesson",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const checkForAssociatedQuiz = async (lessonId: string) => {
    try {
      const { data: quizData, error } = await supabase
        .from("quizzes")
        .select("*")
        .eq("lesson_id", lessonId)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error("Error checking for quiz:", error);
        return;
      }

      if (quizData) {
        console.log('Quiz found for lesson:', quizData);
        setQuiz(quizData);
      } else {
        console.log('No quiz found for lesson:', lessonId);
      }
    } catch (error: any) {
      console.error("Error checking for associated quiz:", error);
    }
  };

  const checkMainContentCompletion = async () => {
    if (!lesson || !userProfile) return;

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      if (lesson.lesson_type === 'video') {
        // Check if video lesson is completed
        const uniqueSubmissionId = `video_${lesson.id}`;
        const { data: submissions } = await supabase
          .from("submissions")
          .select("id")
          .eq("student_id", user.id)
          .eq("assignment_id", uniqueSubmissionId)
          .eq("is_correct", true);

        setMainContentCompleted(submissions && submissions.length > 0);
      } else if (lesson.lesson_type === 'coding') {
        // Check if coding assignment is completed
        const { data: assignments } = await supabase
          .from("coding_assignments")
          .select("id")
          .eq("lesson_id", lesson.id);

        if (assignments && assignments.length > 0) {
          const { data: submissions } = await supabase
            .from("submissions")
            .select("id")
            .eq("student_id", user.id)
            .eq("assignment_id", assignments[0].id)
            .eq("is_correct", true);

          setMainContentCompleted(submissions && submissions.length > 0);
        }
      }

      // Check quiz completion if quiz exists
      if (quiz) {
        const { data: quizAttempts } = await supabase
          .from("quiz_attempts")
          .select("id")
          .eq("user_id", user.id)
          .eq("quiz_id", quiz.id)
          .eq("status", "Mastered");

        setQuizCompleted(quizAttempts && quizAttempts.length > 0);
      }
    } catch (error) {
      console.error("Error checking completion status:", error);
    }
  };

  const fetchCodingAssignments = async () => {
    setAssignmentLoading(true);
    try {
      console.log("Fetching coding assignments for lesson:", lessonId);
      
      // First try to get assignment by ID (if lessonId is actually assignment ID)
      let { data: singleAssignment, error: singleError } = await supabase
        .from("coding_assignments")
        .select("*")
        .eq("id", lessonId)
        .single();

      if (!singleError && singleAssignment) {
        // lessonId is actually an assignment ID, set this as selected
        setCodingAssignments([singleAssignment]);
        setSelectedAssignment(singleAssignment);
        return;
      }

      // Fetch all assignments for this lesson
      const { data: assignments, error } = await supabase
        .from("coding_assignments")
        .select("*")
        .eq("lesson_id", lesson?.id || lessonId)
        .order("created_at", { ascending: true });

      if (error) {
        console.error("Error fetching coding assignments:", error);
        throw error;
      }

      console.log("Coding assignments data:", assignments);
      setCodingAssignments(assignments || []);
      
      // Don't auto-select any assignment - user should choose
      setSelectedAssignment(null);
      
    } catch (error: any) {
      console.error("Error fetching coding assignments:", error);
      toast({
        title: "Error",
        description: "Failed to load coding assignments",
        variant: "destructive",
      });
    } finally {
      setAssignmentLoading(false);
    }
  };

  const handleMainContentComplete = () => {
    setMainContentCompleted(true);
    
    if (quiz && !quizCompleted) {
      // Show option to continue to quiz
      setCurrentStage('quiz');
    } else {
      // No quiz or quiz already completed, show completion
      setCurrentStage('completed');
      setShowSuccessDialog(true);
    }
  };

  const handleQuizComplete = () => {
    setQuizCompleted(true);
    setCurrentStage('completed');
    setShowSuccessDialog(true);
  };

  const handleContinueToQuiz = () => {
    setCurrentStage('quiz');
  };

  const handleBackToMain = () => {
    setCurrentStage('main');
  };

  const checkExistingSubmission = async (assignmentId: string, userId: string) => {
    try {
      const { data, error } = await supabase
        .from("submissions")
        .select("*")
        .eq("assignment_id", assignmentId)
        .eq("student_id", userId)
        .eq("is_correct", true)
        .limit(1);

      if (error) throw error;
      return data && data.length > 0;
    } catch (error: any) {
      console.error("Error checking existing submission:", error);
      return false;
    }
  };

// Removed: moved to streakManager.ts

  const recordSuccessfulSubmission = async (assignmentId: string, userId: string, code: string) => {
    try {
      const { error } = await supabase
        .from("submissions")
        .insert({
          assignment_id: assignmentId,
          student_id: userId,
          submitted_code: code,
          is_correct: true,
          submitted_at: new Date().toISOString()
        });

      if (error) throw error;
    } catch (error: any) {
      console.error("Error recording submission:", error);
      throw error;
    }
  };

// Removed: moved to streakManager.ts

  const getNextLesson = async (currentLesson: Lesson) => {
    try {
      const { data, error } = await supabase
        .from("lessons")
        .select("id")
        .eq("course_id", currentLesson.course_id)
        .gt("order_num", currentLesson.order_num)
        .order("order_num", { ascending: true })
        .limit(1);

      if (error) throw error;
      return data && data.length > 0 ? data[0].id : null;
    } catch (error: any) {
      console.error("Error fetching next lesson:", error);
      return null;
    }
  };

  const handleGameification = async (allTestsPassed: boolean) => {
    if (!allTestsPassed || !lesson || !selectedAssignment || !userProfile) return;

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const hasExistingSubmission = await checkExistingSubmission(selectedAssignment.id, user.id);
      
      if (hasExistingSubmission) {
        toast({
          title: "Great work!",
          description: "You've already mastered this challenge.",
          variant: "default",
        });
        return;
      }

      setIsFirstTime(true);
      setEarnedXP(lesson.xp_reward);
      setEarnedBits(lesson.bits_reward);

      await recordSuccessfulSubmission(selectedAssignment.id, user.id, userCode);
      await updateStreakOnActivity(user.id, userProfile, lesson.xp_reward, lesson.bits_reward);
      await fetchUserProfile();
      
      // Track assignment submission activity
      await ActivityTracker.trackAssignmentSubmit(selectedAssignment.id, selectedAssignment.title || `Assignment ${selectedAssignment.id}`, true);
      
      handleMainContentComplete();

    } catch (error: any) {
      console.error("Error in gamification logic:", error);
      toast({
        title: "Error",
        description: "Failed to update your progress",
        variant: "destructive",
      });
    }
  };

  const handleMarkVideoComplete = async () => {
    if (!lesson || !userProfile) return;

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast({
          title: "Authentication Error",
          description: "Please sign in to complete this lesson.",
          variant: "destructive",
        });
        return;
      }

      const uniqueSubmissionId = `video_${lesson.id}`;
      
      const { data: existingSubmissions, error: queryError } = await supabase
        .from("submissions")
        .select("id")
        .eq("student_id", user.id)
        .eq("assignment_id", uniqueSubmissionId)
        .eq("is_correct", true);

      if (queryError) {
        console.error("Database query error:", queryError);
        toast({
          title: "Could not connect",
          description: "Please try again.",
          variant: "destructive",
        });
        return;
      }

      if (existingSubmissions && existingSubmissions.length > 0) {
        toast({
          title: "Already completed!",
          description: "You've already completed this video lesson.",
          variant: "default",
        });
        return;
      }

      setIsFirstTime(true);
      setEarnedXP(lesson.xp_reward);
      setEarnedBits(lesson.bits_reward);

      const { error: submissionError } = await supabase
        .from("submissions")
        .insert({
          assignment_id: uniqueSubmissionId,
          student_id: user.id,
          submitted_code: "VIDEO_LESSON_COMPLETED",
          is_correct: true,
          submitted_at: new Date().toISOString()
        });

      if (submissionError) {
        console.error("Error creating submission record:", submissionError);
        toast({
          title: "Could not connect",
          description: "Please try again.",
          variant: "destructive",
        });
        return;
      }

      await updateStreakOnActivity(user.id, userProfile, lesson.xp_reward, lesson.bits_reward);
      await fetchUserProfile();
      
      // Track lesson view activity
      await ActivityTracker.trackLessonView(lesson.id, lesson.title, lesson.course_id);
      
      handleMainContentComplete();

    } catch (error: any) {
      console.error("Unexpected error in video completion:", error);
      toast({
        title: "Could not connect",
        description: "Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleNextLesson = async () => {
    if (!lesson) return;

    const nextLessonId = await getNextLesson(lesson);
    if (nextLessonId) {
      navigate(`/lesson/${nextLessonId}`);
    } else {
      toast({
        title: "Course Complete!",
        description: "You've completed all lessons in this course!",
        variant: "default",
      });
      navigate(-1);
    }
    setShowSuccessDialog(false);
  };

  const runTests = async () => {
    if (!userCode.trim() || !selectedAssignment) {
      toast({
        title: "Error",
        description: "Please write some code before running tests",
        variant: "destructive",
      });
      return;
    }

    setIsRunning(true);
    setTestResults([]);
    setExecutionProgress(0);

    // Simulate progress updates
    const progressInterval = setInterval(() => {
      setExecutionProgress(prev => Math.min(prev + 10, 90));
    }, 200);

    try {
      console.log("Calling run-coding-assignment function...");
      
      const { data, error } = await supabase.functions.invoke('run-coding-assignment', {
        body: {
          userCode: userCode,
          assignmentId: selectedAssignment.id
        }
      });

      clearInterval(progressInterval);
      setExecutionProgress(100);

      if (error) {
        console.error("Edge function error:", error);
        throw new Error(error.message || "Failed to execute code");
      }

      if (data.error) {
        throw new Error(data.error);
      }

      console.log("Test execution results:", data);
      
      const transformedResults = data.results.map((result: any) => ({
        testCaseIndex: result.testCaseIndex,
        input: result.input,
        expected: result.expected,
        actual: result.actual,
        passed: result.passed,
        error: result.error,
        executionTime: result.executionTime
      }));

      setTestResults(transformedResults);

      const { passed, total } = data.summary;
      const allTestsPassed = passed === total;

      toast({
        title: `Tests Complete`,
        description: `${passed}/${total} tests passed`,
        variant: allTestsPassed ? "default" : "destructive",
      });

      await handleGameification(allTestsPassed);

    } catch (error: any) {
      clearInterval(progressInterval);
      setExecutionProgress(0);
      console.error("Error running tests:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to run tests",
        variant: "destructive",
      });
    } finally {
      setIsRunning(false);
      setTimeout(() => setExecutionProgress(0), 1000);
    }
  };

  const getYouTubeEmbedUrl = (url: string) => {
    if (!url) return null;
    
    const patterns = [
      /(?:youtube\.com\/watch\?v=)([^&\n?#]+)/,
      /(?:youtu\.be\/)([^&\n?#]+)/,
      /(?:youtube\.com\/embed\/)([^&\n?#]+)/
    ];
    
    for (const pattern of patterns) {
      const match = url.match(pattern);
      if (match) {
        return `https://www.youtube.com/embed/${match[1]}?rel=0&modestbranding=1`;
      }
    }
    
    if (url.includes('youtube.com/embed/')) {
      return url;
    }
    
    return url;
  };

  const getTestCases = () => {
    if (!selectedAssignment) return [];
    
    // Check for new format first (test_inputs and test_outputs)
    if (selectedAssignment.test_inputs && selectedAssignment.test_outputs && 
        Array.isArray(selectedAssignment.test_inputs) && Array.isArray(selectedAssignment.test_outputs)) {
      const inputs = selectedAssignment.test_inputs;
      const outputs = selectedAssignment.test_outputs;
      
      if (inputs.length === outputs.length) {
        return inputs.map((input: any, index: number) => ({
          input: input,
          expected: outputs[index]
        }));
      }
    }
    
    // Fall back to old format
    if (selectedAssignment.test_cases) {
      if (typeof selectedAssignment.test_cases === 'string') {
        try {
          return JSON.parse(selectedAssignment.test_cases);
        } catch {
          return [];
        }
      }
      
      return Array.isArray(selectedAssignment.test_cases) ? selectedAssignment.test_cases : [];
    }
    
    return [];
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <LoadingSpinner size="lg" text="Loading lesson content..." />
      </div>
    );
  }

  if (!lesson) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="text-gray-600">Lesson not found</div>
          <Button onClick={() => navigate(-1)} variant="outline">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Go Back
          </Button>
        </div>
      </div>
    );
  }

  const renderStageNavigation = () => {
    if (!quiz) return null;

    return (
      <div className="mb-6 flex items-center justify-between bg-blue-50 p-4 rounded-lg">
        <div className="flex items-center space-x-4">
          <div className={`flex items-center space-x-2 ${currentStage === 'main' ? 'text-blue-600 font-medium' : 'text-gray-500'}`}>
            <div className={`w-6 h-6 rounded-full flex items-center justify-center text-sm ${
              mainContentCompleted ? 'bg-green-500 text-white' : 
              currentStage === 'main' ? 'bg-blue-500 text-white' : 'bg-gray-300'
            }`}>
              {mainContentCompleted ? <CheckCircle className="h-4 w-4" /> : '1'}
            </div>
            <span>Main Content</span>
          </div>
          
          <div className="w-8 h-px bg-gray-300"></div>
          
          <div className={`flex items-center space-x-2 ${currentStage === 'quiz' ? 'text-blue-600 font-medium' : 'text-gray-500'}`}>
            <div className={`w-6 h-6 rounded-full flex items-center justify-center text-sm ${
              quizCompleted ? 'bg-green-500 text-white' : 
              currentStage === 'quiz' ? 'bg-blue-500 text-white' : 'bg-gray-300'
            }`}>
              {quizCompleted ? <CheckCircle className="h-4 w-4" /> : '2'}
            </div>
            <span>Quiz</span>
          </div>
        </div>
        
        {mainContentCompleted && currentStage === 'main' && !quizCompleted && (
          <Button onClick={handleContinueToQuiz} className="bg-blue-600 hover:bg-blue-700">
            Continue to Quiz
          </Button>
        )}
        
        {currentStage === 'quiz' && (
          <Button onClick={handleBackToMain} variant="outline">
            Back to Main Content
          </Button>
        )}
      </div>
    );
  };

  return (
    <ErrorBoundary>
      <div className="min-h-screen animate-fade-in bg-gray-50">
        <div className={`mx-auto ${isMobile ? 'p-3 max-w-full' : isTablet ? 'p-4 max-w-4xl' : 'p-6 max-w-6xl'}`}>
          <Button
            variant="ghost"
            onClick={() => navigate('/courses')}
            className={`mb-4 hover:bg-gray-100 transition-colors duration-200 ${isMobile ? 'text-sm p-2' : ''}`}
            size={isMobile ? "sm" : "default"}
          >
            <ArrowLeft className={`${isMobile ? 'h-3 w-3' : 'h-4 w-4'} mr-2 flex-shrink-0`} />
            <span>Back to Courses</span>
          </Button>

          {renderStageNavigation()}

          <Card className="bg-white shadow-sm">
            <CardHeader className={isMobile ? 'p-4' : ''}>
              <CardTitle className={`flex items-center gap-2 ${isMobile ? 'text-base' : 'text-lg'}`}>
                {currentStage === 'quiz' ? (
                  <HelpCircle className={`${isMobile ? 'h-4 w-4' : 'h-5 w-5'} flex-shrink-0`} />
                ) : lesson.lesson_type === 'video' ? (
                  <Play className={`${isMobile ? 'h-4 w-4' : 'h-5 w-5'} flex-shrink-0`} />
                ) : (
                  <Code className={`${isMobile ? 'h-4 w-4' : 'h-5 w-5'} flex-shrink-0`} />
                )}
                <span className="break-words">
                  {currentStage === 'quiz' ? quiz?.title || 'Quiz' : lesson.title}
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent className={isMobile ? 'p-4 pt-0' : ''}>
              {currentStage === 'quiz' ? (
                <div className="w-full">
                  <QuizPlayer
                    lessonId={lesson.id}
                    userId={userProfile?.id || ''}
                    onComplete={handleQuizComplete}
                  />
                </div>
              ) : lesson.lesson_type === 'video' ? (
                <div className="space-y-4">
                  {lesson.video_url ? (
                    <div className={`aspect-video w-full ${isMobile ? 'rounded-lg overflow-hidden' : 'animate-scale-in'}`}>
                      {getYouTubeEmbedUrl(lesson.video_url) ? (
                        <iframe
                          src={getYouTubeEmbedUrl(lesson.video_url)}
                          title={lesson.title}
                          className="w-full h-full rounded-lg border-0"
                          allowFullScreen
                          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                        />
                      ) : (
                        <video
                          src={lesson.video_url}
                          title={lesson.title}
                          className="w-full h-full rounded-lg"
                          controls
                        />
                      )}
                    </div>
                  ) : (
                    <div className="aspect-video bg-gray-100 rounded-lg flex items-center justify-center">
                      <div className="text-center">
                        <Play className={`${isMobile ? 'h-12 w-12' : 'h-16 w-16'} text-gray-400 mx-auto mb-2`} />
                        <p className="text-gray-600">No video URL provided</p>
                      </div>
                    </div>
                  )}
                  
                  <div className="flex justify-center">
                    <Button
                      onClick={handleMarkVideoComplete}
                      disabled={mainContentCompleted}
                      className={`${
                        mainContentCompleted 
                          ? 'bg-green-600 text-white cursor-not-allowed' 
                          : 'bg-green-600 hover:bg-green-700 text-white'
                      } transition-colors duration-200 ${isMobile ? 'px-4 py-2 text-sm' : 'px-6 py-2'}`}
                      size={isMobile ? "default" : "lg"}
                    >
                      {mainContentCompleted ? 'Completed' : 'Mark as Complete'}
                    </Button>
                  </div>
                </div>
              ) : (
                <div className={`space-y-6 ${isMobile ? 'space-y-4' : ''}`}>
                  {assignmentLoading ? (
                    <div className="text-center py-8">
                      <LoadingSpinner text="Loading coding assignments..." />
                    </div>
                  ) : codingAssignments.length === 0 ? (
                    <div className="text-center py-8 animate-fade-in">
                      <Code className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-gray-900 mb-2">No Coding Assignments</h3>
                      <p className="text-gray-500">
                        This coding lesson doesn't have any assignments yet.
                      </p>
                    </div>
                  ) : !selectedAssignment ? (
                    // Show assignment list when no assignment is selected
                    <div className="space-y-4 animate-fade-in">
                      <h3 className={`font-semibold mb-4 ${isMobile ? 'text-base' : 'text-lg'}`}>
                        Choose an Assignment to Solve
                      </h3>
                      <div className="grid gap-4">
                        {codingAssignments.map((assignment, index) => (
                          <Card key={assignment.id} className="bg-gray-50 border-l-4 border-primary">
                            <CardContent className="p-4">
                              <div className="flex justify-between items-start">
                                <div className="flex-1">
                                  <h4 className="font-medium text-gray-900 mb-2">
                                    {assignment.title || `Problem ${index + 1}`}
                                  </h4>
                                  <p className="text-sm text-gray-600 line-clamp-3">
                                    {assignment.problem_statement}
                                  </p>
                                </div>
                                <Button
                                  onClick={() => navigate(`/assignment/${assignment.id}`)}
                                  className="ml-4 bg-blue-600 hover:bg-blue-700"
                                >
                                  <Code className="h-4 w-4 mr-2" />
                                  Solve
                                </Button>
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    </div>
                  ) : null}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <AlertDialog open={showSuccessDialog} onOpenChange={setShowSuccessDialog}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle className="text-green-600">
                🎉 {currentStage === 'completed' && quizCompleted ? 'Lesson Complete!' : 'Content Complete!'}
              </AlertDialogTitle>
              <AlertDialogDescription>
                {currentStage === 'completed' && quizCompleted ? (
                  "Congratulations! You've successfully completed both the main content and quiz."
                ) : (
                  "Great job! You've completed the main content."
                )}
                {isFirstTime && (
                  <div className="mt-4 p-4 bg-green-50 rounded-lg">
                    <div className="text-sm font-medium text-green-800">Rewards Earned:</div>
                    <div className="text-sm text-green-700 mt-1">
                      • +{earnedXP} XP
                    </div>
                    <div className="text-sm text-green-700">
                      • +{earnedBits} Bits
                    </div>
                    <div className="text-sm text-green-700">
                      • Streak: {userProfile?.streak || 1} day{(userProfile?.streak || 1) > 1 ? 's' : ''}
                    </div>
                  </div>
                )}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={() => setShowSuccessDialog(false)}>
                Stay Here
              </AlertDialogCancel>
              <AlertDialogAction onClick={handleNextLesson}>
                Next Lesson
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </ErrorBoundary>
  );
};
