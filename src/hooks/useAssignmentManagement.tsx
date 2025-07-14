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
  max_file_size?: number;
  allowed_file_types?: string[];
  due_date?: string;
  xp_reward: number;
  created_at: string;
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
}

interface CreateAssignmentData {
  lesson_id: string;
  title: string;
  description: string;
  instructions: string;
  max_file_size?: number;
  allowed_file_types?: string[];
  due_date?: string;
  xp_reward: number;
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

  // Fetch assignment by lesson ID
  const useAssignmentByLesson = (lessonId: string) => {
    return useQuery({
      queryKey: ['assignment', lessonId],
      queryFn: async () => {
        const { data, error } = await supabase
          .from('assignments')
          .select('*')
          .eq('lesson_id', lessonId)
          .single();

        if (error && error.code !== 'PGRST116') throw error;
        return data as Assignment | null;
      },
      enabled: !!lessonId
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

      const { data: assignment, error } = await supabase
        .from('assignments')
        .insert(data)
        .select()
        .single();

      if (error) throw error;
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

        const { error: uploadError, data: uploadData } = await supabase.storage
          .from('assignment-files')
          .upload(filePath, data.file);

        if (uploadError) throw uploadError;

        const { data: urlData } = supabase.storage
          .from('assignment-files')
          .getPublicUrl(filePath);

        fileUrl = urlData.publicUrl;
        fileName = data.file.name;
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
        const { data: submission } = await supabase
          .from('assignment_submissions')
          .select(`
            assignment_id,
            user_id,
            assignments!inner(xp_reward, lesson_id)
          `)
          .eq('id', submissionId)
          .single();

        if (submission) {
          // Award XP
          await supabase
            .from('user_xp')
            .insert({
              user_id: submission.user_id,
              amount: submission.assignments.xp_reward,
              source: 'assignment',
              source_id: submission.assignment_id
            });

          // Mark lesson as complete
          await supabase
            .from('user_progress')
            .upsert({
              user_id: submission.user_id,
              lesson_id: submission.assignments.lesson_id,
              completed: true,
              completed_at: new Date().toISOString()
            });
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
    createAssignmentMutation,
    submitAssignmentMutation,
    gradeAssignmentMutation,
  };
};