
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

interface CreateCourseData {
  title: string;
  description: string;
  thumbnail_url?: string;
}

interface UpdateCourseData {
  id: string;
  title?: string;
  description?: string;
  thumbnail_url?: string;
}

interface CreateModuleData {
  course_id: string;
  title: string;
  description?: string;
  order_index: number;
}

interface CreateLessonData {
  module_id: string;
  title: string;
  description?: string;
  type: 'video' | 'quiz' | 'assignment';
  content_url?: string;
  xp_reward: number;
  order_index: number;
}

export const useCourseManagement = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const createCourseMutation = useMutation({
    mutationFn: async (data: CreateCourseData) => {
      if (!user) throw new Error('User not authenticated');

      const { data: course, error } = await supabase
        .from('courses')
        .insert({
          ...data,
          created_by: user.id,
          status: 'draft'
        })
        .select()
        .single();

      if (error) throw error;
      return course;
    },
    onSuccess: () => {
      toast({
        title: "Course Created",
        description: "Your course has been created successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ['admin-courses'] });
      queryClient.invalidateQueries({ queryKey: ['admin-stats'] });
    },
    onError: (error) => {
      console.error('Course creation error:', error);
      toast({
        title: "Error",
        description: "Failed to create course: " + error.message,
        variant: "destructive",
      });
    }
  });

  const createModuleMutation = useMutation({
    mutationFn: async (data: CreateModuleData) => {
      const { data: module, error } = await supabase
        .from('modules')
        .insert(data)
        .select()
        .single();

      if (error) throw error;
      return module;
    },
    onSuccess: () => {
      toast({
        title: "Module Created",
        description: "Module has been added to the course.",
      });
      queryClient.invalidateQueries({ queryKey: ['admin-courses'] });
    },
    onError: (error) => {
      console.error('Module creation error:', error);
      toast({
        title: "Error",
        description: "Failed to create module: " + error.message,
        variant: "destructive",
      });
    }
  });

  const createLessonMutation = useMutation({
    mutationFn: async (data: CreateLessonData) => {
      const { data: lesson, error } = await supabase
        .from('lessons')
        .insert(data)
        .select()
        .single();

      if (error) throw error;
      return lesson;
    },
    onSuccess: () => {
      toast({
        title: "Lesson Created",
        description: "Lesson has been added successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ['admin-courses'] });
    },
    onError: (error) => {
      console.error('Lesson creation error:', error);
      toast({
        title: "Error",
        description: "Failed to create lesson: " + error.message,
        variant: "destructive",
      });
    }
  });

  const publishCourseMutation = useMutation({
    mutationFn: async (courseId: string) => {
      const { error } = await supabase
        .from('courses')
        .update({ status: 'published' })
        .eq('id', courseId);

      if (error) throw error;
    },
    onSuccess: () => {
      toast({
        title: "Course Published",
        description: "Course is now available to students.",
      });
      queryClient.invalidateQueries({ queryKey: ['admin-courses'] });
      queryClient.invalidateQueries({ queryKey: ['admin-stats'] });
    },
    onError: (error) => {
      console.error('Course publish error:', error);
      toast({
        title: "Error",
        description: "Failed to publish course: " + error.message,
        variant: "destructive",
      });
    }
  });

  const deleteCourseMutation = useMutation({
    mutationFn: async (courseId: string) => {
      const { error } = await supabase
        .from('courses')
        .delete()
        .eq('id', courseId);

      if (error) throw error;
    },
    onSuccess: () => {
      toast({
        title: "Course Deleted",
        description: "Course has been removed successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ['admin-courses'] });
      queryClient.invalidateQueries({ queryKey: ['admin-stats'] });
    },
    onError: (error) => {
      console.error('Course deletion error:', error);
      toast({
        title: "Error",
        description: "Failed to delete course: " + error.message,
        variant: "destructive",
      });
    }
  });

  const updateCourseMutation = useMutation({
    mutationFn: async ({ id, ...data }: UpdateCourseData) => {
      const { data: course, error } = await supabase
        .from('courses')
        .update(data)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return course;
    },
    onSuccess: () => {
      toast({
        title: "Course Updated",
        description: "Course has been updated successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ['admin-courses'] });
      queryClient.invalidateQueries({ queryKey: ['course-detail'] });
    },
    onError: (error) => {
      console.error('Course update error:', error);
      toast({
        title: "Error",
        description: "Failed to update course: " + error.message,
        variant: "destructive",
      });
    }
  });

  const deleteModuleMutation = useMutation({
    mutationFn: async (moduleId: string) => {
      const { error } = await supabase
        .from('modules')
        .delete()
        .eq('id', moduleId);

      if (error) throw error;
    },
    onSuccess: () => {
      toast({
        title: "Module Deleted",
        description: "Module has been removed successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ['admin-courses'] });
    },
    onError: (error) => {
      console.error('Module deletion error:', error);
      toast({
        title: "Error",
        description: "Failed to delete module: " + error.message,
        variant: "destructive",
      });
    }
  });

  const deleteLessonMutation = useMutation({
    mutationFn: async (lessonId: string) => {
      const { error } = await supabase
        .from('lessons')
        .delete()
        .eq('id', lessonId);

      if (error) throw error;
    },
    onSuccess: () => {
      toast({
        title: "Lesson Deleted",
        description: "Lesson has been removed successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ['admin-courses'] });
    },
    onError: (error) => {
      console.error('Lesson deletion error:', error);
      toast({
        title: "Error",
        description: "Failed to delete lesson: " + error.message,
        variant: "destructive",
      });
    }
  });

  return {
    createCourseMutation,
    createModuleMutation,
    createLessonMutation,
    publishCourseMutation,
    updateCourseMutation,
    deleteCourseMutation,
    deleteModuleMutation,
    deleteLessonMutation,
  };
};
