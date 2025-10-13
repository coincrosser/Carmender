/*
  # Add Daily Goal Tracking

  1. New Tables
    - `daily_check_ins`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references auth.users)
      - `check_in_date` (date)
      - `goals_discussed` (boolean)
      - `progress_notes` (text)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Security
    - Enable RLS on `daily_check_ins` table
    - Add policies for users to manage their own check-ins

  3. Important Notes
    - Tracks whether goals were discussed each day
    - Allows AI to know when to prompt for daily goal review
    - Stores any progress notes from the conversation
*/

CREATE TABLE IF NOT EXISTS daily_check_ins (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  check_in_date date NOT NULL DEFAULT CURRENT_DATE,
  goals_discussed boolean DEFAULT false,
  progress_notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id, check_in_date)
);

ALTER TABLE daily_check_ins ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own check-ins"
  ON daily_check_ins
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own check-ins"
  ON daily_check_ins
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own check-ins"
  ON daily_check_ins
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own check-ins"
  ON daily_check_ins
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_daily_check_ins_user_date 
  ON daily_check_ins(user_id, check_in_date DESC);