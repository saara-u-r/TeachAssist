/*
  # Add trigger for automatic user profile creation

  1. Changes
    - Add function to handle new user registration
    - Create trigger to automatically create user profile
  
  2. Security
    - Function is owned by postgres to ensure it can always create profiles
*/

-- Create the function that will handle the profile creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.users (id)
  VALUES (new.id);
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create the trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();