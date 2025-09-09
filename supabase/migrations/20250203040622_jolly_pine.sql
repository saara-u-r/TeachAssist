/*
  # Add Quiz Tables

  1. New Tables
    - `quizzes`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references users)
      - `topic` (text)
      - `questions` (jsonb)
      - `created_at` (timestamptz)
    
  2. Security
    - Enable RLS on `quizzes` table
    - Add policies for authenticated users
*/

-- Create quizzes table
CREATE TABLE IF NOT EXISTS quizzes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  topic TEXT NOT NULL,
  questions JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE quizzes ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can create their own quizzes"
  ON quizzes FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their own quizzes"
  ON quizzes FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own quizzes"
  ON quizzes FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own quizzes"
  ON quizzes FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);