/*
  # Update user creation trigger

  1. Changes
    - Update handle_new_user function to initialize all columns
    - Ensure default values are set for arrays and other fields
  
  2. Security
    - Function remains security definer to ensure it can create profiles
*/

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.users (
    id,
    school_name,
    subjects_taught,
    grade_levels,
    years_of_experience,
    teaching_style,
    interests,
    onboarding_completed
  ) VALUES (
    new.id,
    NULL,
    ARRAY[]::text[],
    ARRAY[]::text[],
    0,
    NULL,
    ARRAY[]::text[],
    false
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;