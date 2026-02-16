-- LunaCradle - Database Schema
-- Run this in Supabase SQL Editor when your project is ready

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- =====================================================
-- TABLES
-- =====================================================

-- Profiles table (extends auth.users)
CREATE TABLE profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email TEXT NOT NULL,
  full_name TEXT,
  subscription_status TEXT DEFAULT 'inactive' CHECK (subscription_status IN ('inactive', 'trialing', 'active', 'cancelled')),
  subscription_period_end TIMESTAMPTZ,
  stripe_customer_id TEXT,
  is_admin BOOLEAN DEFAULT false,
  has_used_trial BOOLEAN DEFAULT false,
  trial_days_override INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Babies table
CREATE TABLE babies (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  date_of_birth DATE NOT NULL,
  premature_weeks INTEGER DEFAULT 0,
  medical_conditions TEXT,
  temperament TEXT CHECK (temperament IN ('easy', 'moderate', 'spirited', 'sensitive', 'adaptable', 'slow_to_warm', 'persistent', 'not_sure', 'other')),
  temperament_notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Intake submissions table
CREATE TABLE intake_submissions (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  baby_id UUID REFERENCES babies(id) ON DELETE CASCADE NOT NULL,

  -- Step 2: Current Sleep Situation
  current_bedtime TIME,
  current_waketime TIME,
  falling_asleep_method TEXT,

  -- Step 3: Night Sleep
  night_wakings_count INTEGER,
  night_wakings_description TEXT,
  night_waking_duration TEXT,
  night_waking_pattern TEXT,

  -- Step 4: Naps
  nap_count INTEGER,
  nap_duration TEXT,
  nap_method TEXT,
  nap_location TEXT,

  -- Step 5: The Problem
  problems JSONB, -- Array of selected problems
  problem_description TEXT,

  -- Step 6: Parent Preferences
  crying_comfort_level INTEGER CHECK (crying_comfort_level BETWEEN 1 AND 5),
  parent_constraints TEXT,

  -- Step 7: Goals
  success_description TEXT,
  additional_notes TEXT,

  -- Additional data storage
  data JSONB NOT NULL DEFAULT '{}',

  -- Metadata
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'submitted', 'paid')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Plans table
CREATE TABLE plans (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  baby_id UUID REFERENCES babies(id) ON DELETE CASCADE NOT NULL,
  intake_submission_id UUID REFERENCES intake_submissions(id) ON DELETE CASCADE NOT NULL,
  plan_content TEXT NOT NULL, -- Markdown content
  status TEXT DEFAULT 'generating' CHECK (status IN ('generating', 'completed', 'failed')),
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Plan revisions table (living plan history)
CREATE TABLE plan_revisions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  plan_id UUID REFERENCES plans(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  revision_number INTEGER NOT NULL,
  plan_content TEXT NOT NULL,
  summary TEXT,
  source TEXT DEFAULT 'weekly-review' CHECK (source IN ('initial', 'weekly-review', 'manual')),
  week_start DATE,
  week_end DATE,
  created_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(plan_id, revision_number)
);

-- =====================================================
-- INDEXES
-- =====================================================

CREATE INDEX idx_babies_user_id ON babies(user_id);
CREATE INDEX idx_intake_submissions_user_id ON intake_submissions(user_id);
CREATE INDEX idx_intake_submissions_baby_id ON intake_submissions(baby_id);
CREATE INDEX idx_plans_user_id ON plans(user_id);
CREATE INDEX idx_plans_intake_submission_id ON plans(intake_submission_id);
CREATE INDEX idx_plan_revisions_plan_id ON plan_revisions(plan_id);
CREATE INDEX idx_plan_revisions_plan_week ON plan_revisions(plan_id, week_start);

-- =====================================================
-- ROW LEVEL SECURITY (RLS)
-- =====================================================

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE babies ENABLE ROW LEVEL SECURITY;
ALTER TABLE intake_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE plan_revisions ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can view own profile" ON profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Babies policies
CREATE POLICY "Users can view own babies" ON babies
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own babies" ON babies
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own babies" ON babies
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own babies" ON babies
  FOR DELETE USING (auth.uid() = user_id);

-- Intake submissions policies
CREATE POLICY "Users can view own submissions" ON intake_submissions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own submissions" ON intake_submissions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own submissions" ON intake_submissions
  FOR UPDATE USING (auth.uid() = user_id);

-- Plan revisions policies
CREATE POLICY "Users can view own plan revisions" ON plan_revisions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own plan revisions" ON plan_revisions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Plans policies
CREATE POLICY "Users can view own plans" ON plans
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own plans" ON plans
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own plans" ON plans
  FOR UPDATE USING (auth.uid() = user_id);

-- =====================================================
-- TRIGGERS
-- =====================================================

-- Trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql
SET search_path = public;

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_babies_updated_at BEFORE UPDATE ON babies
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_intake_submissions_updated_at BEFORE UPDATE ON intake_submissions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_plans_updated_at BEFORE UPDATE ON plans
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data->>'full_name'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- =====================================================
-- SLEEP DIARY TABLES
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

-- Indexes for sleep diary
CREATE INDEX idx_diary_entries_plan_date ON sleep_diary_entries(plan_id, date);
CREATE INDEX idx_weekly_reviews_plan ON weekly_reviews(plan_id);

-- RLS for sleep diary
ALTER TABLE sleep_diary_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE weekly_reviews ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own diary entries" ON sleep_diary_entries
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own diary entries" ON sleep_diary_entries
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own diary entries" ON sleep_diary_entries
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own diary entries" ON sleep_diary_entries
  FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Users can view their own reviews" ON weekly_reviews
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own reviews" ON weekly_reviews
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own reviews" ON weekly_reviews
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own reviews" ON weekly_reviews
  FOR DELETE USING (auth.uid() = user_id);

CREATE TRIGGER update_sleep_diary_entries_updated_at
  BEFORE UPDATE ON sleep_diary_entries
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- CONTACT MESSAGES
-- =====================================================

CREATE TABLE contact_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  topic TEXT NOT NULL,
  message TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE contact_messages ENABLE ROW LEVEL SECURITY;

-- Locked down for client roles; accessed by server-side service role only.
REVOKE ALL ON TABLE contact_messages FROM anon, authenticated;
GRANT SELECT, INSERT ON TABLE contact_messages TO service_role;
