
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import Index from "./pages/Index";
import { Courses } from "./pages/Courses";
import { CourseDetail } from "./pages/CourseDetail";
import { Community } from "./pages/Community";
import { Schedule } from "./pages/Schedule";
import NotFound from "./pages/NotFound";
import { LessonPlayer } from "./components/LessonPlayer";
import { AssignmentPlayer } from "./components/AssignmentPlayer";
import { AdminDashboard } from "./pages/admin/AdminDashboard";
import { AdminStudents } from "./pages/admin/AdminStudents";
import { AdminStudentDetail } from "./pages/admin/AdminStudentDetail";
import { AdminCourses } from "./pages/admin/AdminCourses";
import { AdminLessons } from "./pages/admin/AdminLessons";
import { AdminBatches } from "./pages/admin/AdminBatches";
import { AdminAssignments } from "./pages/admin/AdminAssignments";
import { AdminQuizzes } from "./pages/admin/AdminQuizzes";
import { AdminQuizQuestions } from "./pages/admin/AdminQuizQuestions";
import { AccessibilityProvider } from "./components/AccessibilityProvider";
import { PerformanceOptimizer } from "./components/PerformanceOptimizer";

const queryClient = new QueryClient();

// Protected Route Component
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Set up auth state listener first
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });

    // Then check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setLoading(false);
    }).catch(() => {
      // If there's any error getting session, just set loading to false
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  return user ? <>{children}</> : <Navigate to="/" replace />;
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AccessibilityProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/courses" element={<ProtectedRoute><Courses /></ProtectedRoute>} />
            <Route path="/courses/:courseId" element={<ProtectedRoute><CourseDetail /></ProtectedRoute>} />
            <Route path="/community" element={<ProtectedRoute><Community /></ProtectedRoute>} />
            <Route path="/schedule" element={<ProtectedRoute><Schedule /></ProtectedRoute>} />
            <Route path="/lesson/:lessonId" element={<ProtectedRoute><LessonPlayer /></ProtectedRoute>} />
            <Route path="/assignment/:assignmentId" element={<ProtectedRoute><AssignmentPlayer /></ProtectedRoute>} />
            <Route path="/admin" element={<ProtectedRoute><AdminDashboard /></ProtectedRoute>} />
            <Route path="/admin/students" element={<ProtectedRoute><AdminStudents /></ProtectedRoute>} />
            <Route path="/admin/students/:id" element={<ProtectedRoute><AdminStudentDetail /></ProtectedRoute>} />
            <Route path="/admin/courses" element={<ProtectedRoute><AdminCourses /></ProtectedRoute>} />
            <Route path="/admin/lessons" element={<ProtectedRoute><AdminLessons /></ProtectedRoute>} />
            <Route path="/admin/batches" element={<ProtectedRoute><AdminBatches /></ProtectedRoute>} />
            <Route path="/admin/assignments" element={<ProtectedRoute><AdminAssignments /></ProtectedRoute>} />
            <Route path="/admin/quizzes" element={<ProtectedRoute><AdminQuizzes /></ProtectedRoute>} />
            <Route path="/admin/quiz/:quizId/questions" element={<ProtectedRoute><AdminQuizQuestions /></ProtectedRoute>} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AccessibilityProvider>
  </QueryClientProvider>
);

export default App;
