
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Play, Code, Zap, Trophy, CheckCircle } from "lucide-react";
import { CodingAssignment } from "./CodingAssignment";
import { AssignmentSelector } from "./AssignmentSelector";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";

interface LessonViewProps {
  courseId: string;
  lessons: any[];
  onBack: () => void;
  profile: any;
  onProfileUpdate: () => void;
}

export const LessonView = ({ courseId, lessons, onBack, profile, onProfileUpdate }: LessonViewProps) => {
  const [selectedLesson, setSelectedLesson] = useState<any>(null);
  const [codingAssignments, setCodingAssignments] = useState<any[]>([]);
  const [selectedAssignment, setSelectedAssignment] = useState<any>(null);
  const [completedAssignments, setCompletedAssignments] = useState<Set<string>>(new Set());
  const [completedLessons, setCompletedLessons] = useState<Set<string>>(new Set());
  const [course, setCourse] = useState<any>(null);
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    fetchCourse();
  }, [courseId]);

  useEffect(() => {
    if (selectedLesson && selectedLesson.lesson_type === 'coding') {
      fetchCodingAssignments(selectedLesson.id);
    }
  }, [selectedLesson]);

  useEffect(() => {
    if (profile?.id) {
      fetchCompletedAssignments();
      fetchCompletedLessons();
    }
  }, [profile]);

  const fetchCourse = async () => {
    try {
      const { data, error } = await supabase
        .from("courses")
        .select("*")
        .eq("id", courseId)
        .single();

      if (error) throw error;
      setCourse(data);
    } catch (error: any) {
      console.error("Error fetching course:", error);
    }
  };

  const fetchCodingAssignments = async (lessonId: string) => {
    try {
      const { data, error } = await supabase
        .from("coding_assignments")
        .select("*")
        .eq("lesson_id", lessonId)
        .order("created_at", { ascending: true });

      if (error) throw error;
      setCodingAssignments(data || []);
    } catch (error: any) {
      console.error("Error fetching coding assignments:", error);
    }
  };

  const fetchCompletedAssignments = async () => {
    try {
      const { data, error } = await supabase
        .from("submissions")
        .select("assignment_id")
        .eq("student_id", profile.id)
        .eq("is_correct", true);

      if (error) throw error;
      
      const completed = new Set(data?.map(sub => sub.assignment_id) || []);
      setCompletedAssignments(completed);
    } catch (error: any) {
      console.error("Error fetching completed assignments:", error);
    }
  };

  const fetchCompletedLessons = async () => {
    try {
      // Fetch all correct submissions for video lessons (video_<lesson_id>)
      const { data: videoSubmissions, error: videoError } = await supabase
        .from("submissions")
        .select("assignment_id")
        .eq("student_id", profile.id)
        .eq("is_correct", true)
        .like("assignment_id", "video_%");

      if (videoError) throw videoError;

      // Fetch quiz attempts that passed
      const { data: quizAttempts, error: quizError } = await supabase
        .from("quiz_attempts")
        .select(`
          quiz_id,
          score,
          quizzes!inner(
            lesson_id,
            passing_score
          )
        `)
        .eq("user_id", profile.id);

      if (quizError) throw quizError;

      const completed = new Set<string>();
      
      // Add completed video lessons
      videoSubmissions?.forEach(sub => {
        const lessonId = sub.assignment_id.replace("video_", "");
        completed.add(lessonId);
      });

      // Add passed quiz lessons
      quizAttempts?.forEach(attempt => {
        if (attempt.score >= attempt.quizzes.passing_score) {
          completed.add(attempt.quizzes.lesson_id);
        }
      });

      // Check for completed coding lessons (all assignments in lesson completed)
      for (const lesson of lessons) {
        if (lesson.lesson_type === 'coding') {
          const { data: assignments, error: assignmentError } = await supabase
            .from("coding_assignments")
            .select("id")
            .eq("lesson_id", lesson.id);

          if (assignmentError) continue;

          const allCompleted = assignments?.every(assignment => 
            completedAssignments.has(assignment.id)
          );

          if (allCompleted && assignments?.length > 0) {
            completed.add(lesson.id);
          }
        }
      }

      setCompletedLessons(completed);
    } catch (error: any) {
      console.error("Error fetching completed lessons:", error);
    }
  };

  const handleLessonComplete = async (lesson: any) => {
    try {
      // For coding lessons, check if all assignments are completed
      if (lesson.lesson_type === 'coding' && codingAssignments.length > 0) {
        const allCompleted = codingAssignments.every(assignment => 
          completedAssignments.has(assignment.id)
        );
        
        if (!allCompleted) {
          toast({
            title: "Lesson Not Complete",
            description: "Complete all assignments to finish this lesson",
            variant: "destructive",
          });
          return;
        }
      }

      // Update user XP and bits
      const { error } = await supabase
        .from("user_profiles")
        .update({
          xp: profile.xp + lesson.xp_reward,
          bits: profile.bits + lesson.bits_reward,
          last_activity_date: new Date().toISOString().split('T')[0]
        })
        .eq("id", profile.id);

      if (error) throw error;

      toast({
        title: "Lesson Complete! 🎉",
        description: `You earned ${lesson.xp_reward} XP and ${lesson.bits_reward} bits!`,
      });

      onProfileUpdate();
    } catch (error: any) {
      console.error("Error updating progress:", error);
      toast({
        title: "Error",
        description: "Failed to update progress",
        variant: "destructive",
      });
    }
  };

  const handleStartLesson = (lesson: any) => {
    setSelectedLesson(lesson);
    setSelectedAssignment(null);
  };

  const handleSelectAssignment = (assignment: any) => {
    setSelectedAssignment(assignment);
  };

  const handleAssignmentComplete = () => {
    // Refresh completed assignments
    fetchCompletedAssignments();
    
    // Check if all assignments in the lesson are now completed
    const updatedCompleted = new Set([...completedAssignments, selectedAssignment.id]);
    const allCompleted = codingAssignments.every(assignment => 
      updatedCompleted.has(assignment.id)
    );
    
    if (allCompleted) {
      toast({
        title: "All Assignments Complete! 🎉",
        description: "You've completed all assignments in this lesson!",
      });
      handleLessonComplete(selectedLesson);
    }
    
    // Go back to assignment selector
    setSelectedAssignment(null);
  };

  // If we have a selected assignment, show the coding assignment component
  if (selectedAssignment) {
    return (
      <div>
        <Button
          variant="ghost"
          onClick={() => setSelectedAssignment(null)}
          className="mb-4"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Assignments
        </Button>

        <CodingAssignment
          assignment={selectedAssignment}
          lesson={selectedLesson}
          onComplete={handleAssignmentComplete}
          profile={profile}
        />
      </div>
    );
  }

  // If we have a selected lesson, show appropriate content
  if (selectedLesson) {
    if (selectedLesson.lesson_type === 'video') {
      return (
        <div>
          <Button
            variant="ghost"
            onClick={() => setSelectedLesson(null)}
            className="mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Lessons
          </Button>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Play className="h-5 w-5" />
                {selectedLesson.title}
              </CardTitle>
              <CardDescription>Video Lesson</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="aspect-video bg-gray-100 rounded-lg flex items-center justify-center mb-4">
                <div className="text-center">
                  <Play className="h-16 w-16 text-gray-400 mx-auto mb-2" />
                  <p className="text-gray-600">Video Player Placeholder</p>
                  {selectedLesson.video_url && (
                    <p className="text-sm text-gray-500 mt-1">URL: {selectedLesson.video_url}</p>
                  )}
                </div>
              </div>
              
              <div className="flex justify-between items-center">
                <div className="flex gap-2">
                  <Badge variant="secondary">
                    <Zap className="h-3 w-3 mr-1" />
                    {selectedLesson.xp_reward} XP
                  </Badge>
                  <Badge variant="secondary">
                    <div className="w-3 h-3 bg-blue-500 rounded-full mr-1" />
                    {selectedLesson.bits_reward} Bits
                  </Badge>
                </div>
                
                <Button onClick={() => handleLessonComplete(selectedLesson)}>
                  <Trophy className="h-4 w-4 mr-2" />
                  Complete Lesson
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      );
    } else if (selectedLesson.lesson_type === 'coding' && codingAssignments.length > 0) {
      return (
        <AssignmentSelector
          assignments={codingAssignments}
          completedAssignments={completedAssignments}
          onSelectAssignment={handleSelectAssignment}
          onBack={() => setSelectedLesson(null)}
          lesson={selectedLesson}
        />
      );
    }
  }

  return (
    <div>
      <Button
        variant="ghost"
        onClick={onBack}
        className="mb-4"
      >
        <ArrowLeft className="h-4 w-4 mr-2" />
        Back to Courses
      </Button>

      <div className="mb-6">
        <h2 className="text-3xl font-bold text-gray-900 mb-2">
          {course?.title}
        </h2>
        <p className="text-gray-600">{course?.description}</p>
      </div>

      <div className="grid gap-4">
        {lessons.map((lesson, index) => (
          <Card
            key={lesson.id}
            className="hover:shadow-md transition-shadow cursor-pointer"
            onClick={() => handleStartLesson(lesson)}
          >
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="relative">
                    <div className="w-8 h-8 bg-gradient-to-r from-purple-600 to-blue-600 rounded-full flex items-center justify-center text-white font-semibold">
                      {index + 1}
                    </div>
                    {completedLessons.has(lesson.id) && (
                      <div className="absolute -top-1 -right-1 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                        <CheckCircle className="h-4 w-4 text-white" />
                      </div>
                    )}
                  </div>
                  
                  <div>
                    <h3 className="font-semibold text-lg">{lesson.title}</h3>
                    <div className="flex items-center gap-2 mt-1">
                      {lesson.lesson_type === 'video' ? (
                        <Badge variant="outline">
                          <Play className="h-3 w-3 mr-1" />
                          Video
                        </Badge>
                      ) : (
                        <Badge variant="outline">
                          <Code className="h-3 w-3 mr-1" />
                          Coding
                        </Badge>
                      )}
                      <Badge variant="secondary">
                        <Zap className="h-3 w-3 mr-1" />
                        {lesson.xp_reward} XP
                      </Badge>
                      <Badge variant="secondary">
                        <div className="w-3 h-3 bg-blue-500 rounded-full mr-1" />
                        {lesson.bits_reward} Bits
                      </Badge>
                    </div>
                  </div>
                </div>
                
                <Button variant="outline">
                  Start Lesson
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};
