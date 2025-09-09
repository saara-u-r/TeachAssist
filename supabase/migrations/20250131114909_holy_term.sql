/*
  # Add notification preferences

  1. Changes
    - Add notification_preferences column to users table
    - Set default notification preferences
*/

ALTER TABLE users ADD COLUMN IF NOT EXISTS notification_preferences JSONB DEFAULT jsonb_build_object(
  'event_reminder', 30,
  'notification_style', 'popup'
);