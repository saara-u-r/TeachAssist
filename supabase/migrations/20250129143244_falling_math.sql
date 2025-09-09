/*
  # Add profile fields to users table

  1. Changes
    - Add new columns to users table if they don't exist:
      - `school_name` (text)
      - `subjects_taught` (text[])
      - `grade_levels` (text[])
      - `years_of_experience` (integer)
      - `teaching_style` (text)
      - `interests` (text[])
      - `onboarding_completed` (boolean)
  2. Security
    - Maintains existing RLS policies
*/

DO $$ 
BEGIN
  -- Add school_name column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'users' AND column_name = 'school_name'
  ) THEN
    ALTER TABLE users ADD COLUMN school_name text;
  END IF;

  -- Add subjects_taught column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'users' AND column_name = 'subjects_taught'
  ) THEN
    ALTER TABLE users ADD COLUMN subjects_taught text[] DEFAULT '{}';
  END IF;

  -- Add years_of_experience column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'users' AND column_name = 'years_of_experience'
  ) THEN
    ALTER TABLE users ADD COLUMN years_of_experience integer DEFAULT 0;
  END IF;

  -- Add teaching_style column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'users' AND column_name = 'teaching_style'
  ) THEN
    ALTER TABLE users ADD COLUMN teaching_style text;
  END IF;

  -- Add interests column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'users' AND column_name = 'interests'
  ) THEN
    ALTER TABLE users ADD COLUMN interests text[] DEFAULT '{}';
  END IF;

  -- Add onboarding_completed column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'users' AND column_name = 'onboarding_completed'
  ) THEN
    ALTER TABLE users ADD COLUMN onboarding_completed boolean DEFAULT false;
  END IF;
END $$;