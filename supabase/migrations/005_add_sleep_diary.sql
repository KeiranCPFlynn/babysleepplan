-- Migration: Add Sleep Diary Feature
-- Creates tables for daily sleep logging and weekly AI reviews

-- =====================================================
-- TABLES
-- =====================================================

-- Sleep diary entries - daily logs from parents
CREATE TABLE sleep_diary_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_id UUID REFERENCES plans(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  date DATE NOT NULL,

  -- Core sleep data
  bedtime TIME,
  wake_time TIME,
  night_wakings INTEGER DEFAULT 0,
  night_waking_duration INTEGER, -- total minutes awake at night

  -- Naps (simple: just count and total duration for MVP)
  nap_count INTEGER DEFAULT 0,
  nap_total_minutes INTEGER DEFAULT 0,

  -- Qualitative
  mood TEXT CHECK (mood IN ('great', 'good', 'okay', 'rough', 'terrible')),
  notes TEXT,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(plan_id, date)
);

-- Weekly AI reviews
CREATE TABLE weekly_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_id UUID REFERENCES plans(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  week_start DATE NOT NULL,
  week_end DATE NOT NULL,
  review_content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(plan_id, week_start)
);

-- =====================================================
-- INDEXES
-- =====================================================

CREATE INDEX idx_diary_entries_plan_date ON sleep_diary_entries(plan_id, date);
CREATE INDEX idx_weekly_reviews_plan ON weekly_reviews(plan_id);

-- =====================================================
-- ROW LEVEL SECURITY
-- =====================================================

ALTER TABLE sleep_diary_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE weekly_reviews ENABLE ROW LEVEL SECURITY;

-- Sleep diary entries policies
CREATE POLICY "Users can view their own diary entries"
  ON sleep_diary_entries FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own diary entries"
  ON sleep_diary_entries FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own diary entries"
  ON sleep_diary_entries FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own diary entries"
  ON sleep_diary_entries FOR DELETE
  USING (auth.uid() = user_id);

-- Weekly reviews policies
CREATE POLICY "Users can view their own reviews"
  ON weekly_reviews FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own reviews"
  ON weekly_reviews FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own reviews"
  ON weekly_reviews FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own reviews"
  ON weekly_reviews FOR DELETE
  USING (auth.uid() = user_id);

-- =====================================================
-- TRIGGERS
-- =====================================================

CREATE TRIGGER update_sleep_diary_entries_updated_at
  BEFORE UPDATE ON sleep_diary_entries
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
