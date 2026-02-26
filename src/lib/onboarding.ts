import { supabase } from './supabase';
import { Database } from '../types/database.types';
import AsyncStorage from '@react-native-async-storage/async-storage';

type OnboardingStep =
  | 'gender-selection'
  | 'fitness-goal'
  | 'workout-frequency'
  | 'fitness-level'
  | 'equipment-access'
  | 'body-metrics'
  | 'weight'
  | 'height'
  | 'account'
  | 'personalize'
  | 'success';

export interface OnboardingData {
  gender?: string;
  fitness_goal?: string;
  workout_frequency?: number;
  fitness_level?: string;
  equipment_access?: string;
  weight?: number;
  weight_unit?: 'kg' | 'lb';
  goal_weight?: number;
  goal_weight_unit?: 'kg' | 'lb';
  height?: number;
  height_unit?: 'cm' | 'ft';
  theme?: string;
  theme_color?: string;
  full_name?: string;
}

/**
 * Updates the current onboarding step and saves the data
 */
export async function updateOnboardingStep(
  step: OnboardingStep,
  data: Partial<OnboardingData>
) {
  try {
    const user = await supabase.auth.getUser();
    const userId = user.data.user?.id;

    if (!userId) {
      // Store data in local storage if user is not created yet
      const existingDataStr = await AsyncStorage.getItem('onboarding_data');
      const existingData = existingDataStr ? JSON.parse(existingDataStr) : {};
      const updatedData = { ...existingData, ...data, onboarding_step: step };
      await AsyncStorage.setItem('onboarding_data', JSON.stringify(updatedData));
      return { success: true, data: updatedData };
    }

    // If user exists, update profile
    const { error } = await supabase
      .from('profiles')
      .update({
        ...data,
        onboarding_step: step,
        updated_at: new Date().toISOString(),
      })
      .eq('id', userId);

    if (error) throw error;

    return { success: true, data };
  } catch (error) {
    console.error('Error updating onboarding step:', error);
    return { success: false, error };
  }
}

/**
 * Marks the onboarding as complete
 */
export async function completeOnboarding() {
  try {
    const user = await supabase.auth.getUser();
    const userId = user.data.user?.id;

    if (!userId) {
      // If no user is logged in, store completion status in local storage
      const existingDataStr = await AsyncStorage.getItem('onboarding_data');
      const existingData = existingDataStr ? JSON.parse(existingDataStr) : {};
      const updatedData = {
        ...existingData,
        onboarding_completed: true,
        onboarding_step: 'success'
      };
      await AsyncStorage.setItem('onboarding_data', JSON.stringify(updatedData));
      return true;
    }

    // If user exists, update their profile
    const { error } = await supabase
      .from('profiles')
      .update({
        onboarding_completed: true,
        onboarding_step: 'success',
        updated_at: new Date().toISOString(),
      })
      .eq('id', userId);

    if (error) throw error;

    return true;
  } catch (error) {
    console.error('Error completing onboarding:', error);
    return false;
  }
}

/**
 * Creates a new user and initializes the profile with provided data
 */
export async function signUpUser(email: string, password: string, name: string) {
  try {
    // Get onboarding data from local storage if it exists
    const storedDataStr = await AsyncStorage.getItem('onboarding_data');
    const onboardingData = storedDataStr ? JSON.parse(storedDataStr) : {};

    // Get theme preferences from local storage
    const savedTheme = await AsyncStorage.getItem('theme_mode') || 'light';
    const savedColor = await AsyncStorage.getItem('theme_color') || '#4CAF50';

    const { data: authData, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: name,
        },
      },
    });

    if (signUpError) throw signUpError;
    if (!authData.user) throw new Error('No user data returned');

    // Store email for OTP verification
    await AsyncStorage.setItem('verification_email', email);

    // Initialize profile with name, onboarding data, and theme preferences
    const { error: profileError } = await supabase
      .from('profiles')
      .update({
        full_name: name,
        username: email.split('@')[0],
        theme: savedTheme,
        theme_color: savedColor,
        ...onboardingData, // Include all previously collected data
        updated_at: new Date().toISOString(),
      })
      .eq('id', authData.user.id);

    if (profileError) throw profileError;

    // Clear local storage data after successfully saving to database
    await AsyncStorage.removeItem('onboarding_data');

    return authData;
  } catch (error) {
    console.error('Error signing up:', error);
    throw error;
  }
} 