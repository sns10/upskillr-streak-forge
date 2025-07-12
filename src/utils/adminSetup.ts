
import { supabase } from '@/integrations/supabase/client';

export const createAdminAccount = async (email: string, password: string) => {
  try {
    // Create the user account
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/`,
        data: {
          full_name: 'Admin User'
        }
      }
    });

    if (authError) {
      console.error('Error creating admin user:', authError);
      return { success: false, error: authError.message };
    }

    if (!authData.user) {
      return { success: false, error: 'Failed to create user' };
    }

    // Wait a moment for the user to be fully created
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Update the user role to admin
    const { error: roleError } = await supabase
      .from('user_roles')
      .update({ role: 'admin' })
      .eq('user_id', authData.user.id);

    if (roleError) {
      console.error('Error setting admin role:', roleError);
      return { success: false, error: 'User created but failed to set admin role' };
    }

    console.log('Admin account created successfully:', email);
    return { success: true, userId: authData.user.id };

  } catch (error) {
    console.error('Unexpected error creating admin account:', error);
    return { success: false, error: 'Unexpected error occurred' };
  }
};
