-- Create a new migration for the user trigger
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
    onboarding_completed,
    notification_preferences
  ) VALUES (
    NEW.id,
    NULL,
    ARRAY[]::text[],
    ARRAY[]::text[],
    0,
    NULL,
    ARRAY[]::text[],
    false,
    jsonb_build_object(
      'event_reminder', 30,
      'notification_style', 'popup'
    )
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Recreate the trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();