import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

interface Assignment {
  id: string;
  lesson_id: string;
  title: string;
  description: string;
  instructions: string;
  assignment_type: 'regular' | 'coding';
  programming_language?: string;
  starter_code?: string;
  template_code?: string;
  max_file_size?: number;
  allowed_file_types?: string[];
  due_date?: string;
  xp_reward: number;
  created_at: string;
}

interface TestCase {
  id: string;
  assignment_id: string;
  input_data: string;
  expected_output: string;
  is_hidden: boolean;
  points: number;
  description?: string;
}

interface AssignmentSubmission {
  id: string;
  assignment_id: string;
  user_id: string;
  text_submission?: string;
  file_url?: string;
  file_name?: string;
  submitted_at: string;
  grade?: number;
  feedback?: string;
  status: 'submitted' | 'graded' | 'returned';
  test_results?: any;
  passed_tests?: number;
  total_tests?: number;
  auto_grade?: number;
}

interface CreateAssignmentData {
  lesson_id: string;
  title: string;
  description: string;
  instructions: string;
  assignment_type?: 'regular' | 'coding';
  programming_language?: string;
  starter_code?: string;
  template_code?: string;
  max_file_size?: number;
  allowed_file_types?: string[];
  due_date?: string;
  xp_reward: number;
  test_cases?: Array<{
    input_data: string;
    expected_output: string;
    is_hidden: boolean;
    points: number;
    description?: string;
  }>;
}

interface SubmitAssignmentData {
  assignment_id: string;
  text_submission?: string;
  file?: File;
}

export const useAssignmentManagement = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch test cases for an assignment
  const useTestCases = (assignmentId: string) => {
    return useQuery({
      queryKey: ['test-cases', assignmentId],
      queryFn: async () => {
        const { data, error } = await supabase
          .from('test_cases')
          .select('*')
          .eq('assignment_id', assignmentId)
          .order('created_at');

        if (error) throw error;
        return data as TestCase[];
      },
      enabled: !!assignmentId
    });
  };

  // Fetch assignment by lesson ID
  const useAssignmentByLesson = (lessonId: string) => {
    return useQuery({
      queryKey: ['assignment', lessonId],
      queryFn: async () => {
        if (!lessonId || lessonId === 'temp') return null;
        
        const { data, error } = await supabase
          .from('assignments')
          .select('*')
          .eq('lesson_id', lessonId)
          .maybeSingle();

        if (error) throw error;
        return data as Assignment | null;
      },
      enabled: !!lessonId && lessonId !== 'temp'
    });
  };

  // Fetch assignment submission for user
  const useAssignmentSubmission = (assignmentId: string) => {
    return useQuery({
      queryKey: ['assignment-submission', assignmentId, user?.id],
      queryFn: async () => {
        if (!user) return null;

        const { data, error } = await supabase
          .from('assignment_submissions')
          .select('*')
          .eq('assignment_id', assignmentId)
          .eq('user_id', user.id)
          .single();

        if (error && error.code !== 'PGRST116') throw error;
        return data as AssignmentSubmission | null;
      },
      enabled: !!assignmentId && !!user
    });
  };

  // Fetch all submissions for an assignment (admin only)
  const useAssignmentSubmissions = (assignmentId: string) => {
    return useQuery({
      queryKey: ['assignment-submissions', assignmentId],
      queryFn: async () => {
        const { data, error } = await supabase
          .from('assignment_submissions')
          .select(`
            *,
            profiles!inner(full_name)
          `)
          .eq('assignment_id', assignmentId)
          .order('submitted_at', { ascending: false });

        if (error) throw error;
        return data;
      },
      enabled: !!assignmentId
    });
  };

  // Create assignment
  const createAssignmentMutation = useMutation({
    mutationFn: async (data: CreateAssignmentData) => {
      if (!user) throw new Error('User not authenticated');

      // Extract test cases from data
      const { test_cases, ...assignmentData } = data;

      const { data: assignment, error } = await supabase
        .from('assignments')
        .insert(assignmentData)
        .select()
        .single();

      if (error) throw error;

      // Insert test cases if provided
      if (test_cases && test_cases.length > 0) {
        const testCaseInserts = test_cases.map(tc => ({
          assignment_id: assignment.id,
          input_data: tc.input_data,
          expected_output: tc.expected_output,
          is_hidden: tc.is_hidden,
          points: tc.points,
          description: tc.description
        }));

        const { error: testCasesError } = await supabase
          .from('test_cases')
          .insert(testCaseInserts);

        if (testCasesError) {
          console.error('Test cases creation error:', testCasesError);
          // Don't fail the whole operation, just warn
        }
      }

      return assignment;
    },
    onSuccess: () => {
      toast({
        title: "Assignment Created",
        description: "Assignment has been created successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ['assignment'] });
    },
    onError: (error) => {
      console.error('Assignment creation error:', error);
      toast({
        title: "Error",
        description: "Failed to create assignment: " + error.message,
        variant: "destructive",
      });
    }
  });

  // Submit assignment
  const submitAssignmentMutation = useMutation({
    mutationFn: async (data: SubmitAssignmentData) => {
      if (!user) throw new Error('User not authenticated');

      let fileUrl: string | undefined;
      let fileName: string | undefined;

      // Upload file if provided
      if (data.file) {
        const fileExt = data.file.name.split('.').pop();
        const filePath = `${user.id}/${data.assignment_id}/${Date.now()}.${fileExt}`;

        try {
          const { error: uploadError } = await supabase.storage
            .from('assignment-files')
            .upload(filePath, data.file);

          if (uploadError) {
            console.error('File upload error:', uploadError);
            throw new Error(`File upload failed: ${uploadError.message}`);
          }

          // Get the public URL for the uploaded file
          const { data: urlData } = supabase.storage
            .from('assignment-files')
            .getPublicUrl(filePath);

          fileUrl = urlData.publicUrl;
          fileName = data.file.name;
        } catch (error) {
          console.error('Storage operation failed:', error);
          throw error;
        }
      }

      // Submit assignment
      const { data: submission, error } = await supabase
        .from('assignment_submissions')
        .insert({
          assignment_id: data.assignment_id,
          user_id: user.id,
          text_submission: data.text_submission,
          file_url: fileUrl,
          file_name: fileName,
          status: 'submitted'
        })
        .select()
        .single();

      if (error) throw error;

      // For coding assignments, run automated tests
      if (data.text_submission) {
        // Get assignment details to check if it's a coding assignment
        const { data: assignment } = await supabase
          .from('assignments')
          .select('assignment_type, programming_language')
          .eq('id', data.assignment_id)
          .single();

        if (assignment?.assignment_type === 'coding') {
          try {
            // Run automated tests
            await supabase.functions.invoke('run-code-tests', {
              body: {
                submissionId: submission.id,
                code: data.text_submission,
                assignmentId: data.assignment_id,
                language: assignment.programming_language
              }
            });
          } catch (testError) {
            console.warn('Automated testing failed:', testError);
            // Don't fail the submission if testing fails
          }
        }
      }

      return submission;
    },
    onSuccess: () => {
      toast({
        title: "Assignment Submitted",
        description: "Your assignment has been submitted successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ['assignment-submission'] });
    },
    onError: (error) => {
      console.error('Assignment submission error:', error);
      toast({
        title: "Error",
        description: "Failed to submit assignment: " + error.message,
        variant: "destructive",
      });
    }
  });

  // Grade assignment
  const gradeAssignmentMutation = useMutation({
    mutationFn: async ({ submissionId, grade, feedback }: { submissionId: string; grade: number; feedback?: string }) => {
      const { data, error } = await supabase
        .from('assignment_submissions')
        .update({
          grade,
          feedback,
          status: 'graded'
        })
        .eq('id', submissionId)
        .select()
        .single();

      if (error) throw error;

      // If assignment is passed (grade >= 70), award XP
      if (grade >= 70) {
        // Get assignment details for XP reward
        const { data: assignment } = await supabase
          .from('assignments')
          .select('xp_reward, lesson_id')
          .eq('id', data.assignment_id)
          .single();

        if (!assignment) return data;

        // Award XP
        await supabase
          .from('user_xp')
          .insert({
            user_id: data.user_id,
            amount: assignment.xp_reward,
            source: 'assignment',
            source_id: data.assignment_id
          });

        // Mark lesson as complete
        await supabase
          .from('user_progress')
          .upsert({
            user_id: data.user_id,
            lesson_id: assignment.lesson_id,
            completed: true,
            completed_at: new Date().toISOString()
          });

        // Check for new badges
        try {
          await supabase.rpc('check_and_award_badges', { user_uuid: data.user_id });
        } catch (badgeError) {
          console.warn('Badge check failed:', badgeError);
        }
      }

      return data;
    },
    onSuccess: () => {
      toast({
        title: "Assignment Graded",
        description: "Assignment has been graded successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ['assignment-submissions'] });
      queryClient.invalidateQueries({ queryKey: ['assignment-submission'] });
    },
    onError: (error) => {
      console.error('Assignment grading error:', error);
      toast({
        title: "Error",
        description: "Failed to grade assignment: " + error.message,
        variant: "destructive",
      });
    }
  });

  return {
    useAssignmentByLesson,
    useAssignmentSubmission,
    useAssignmentSubmissions,
    useTestCases,
    createAssignmentMutation,
    submitAssignmentMutation,
    gradeAssignmentMutation,
  };
};