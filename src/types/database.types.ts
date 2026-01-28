export type SubscriptionStatus = 'inactive' | 'active' | 'cancelled'
export type Temperament = 'easy' | 'moderate' | 'spirited'
export type IntakeStatus = 'draft' | 'submitted' | 'paid'
export type PlanStatus = 'generating' | 'completed' | 'failed'

export interface Profile {
  id: string
  email: string
  full_name: string | null
  subscription_status: SubscriptionStatus
  stripe_customer_id: string | null
  created_at: string
  updated_at: string
}

export interface Baby {
  id: string
  user_id: string
  name: string
  date_of_birth: string
  premature_weeks: number
  medical_conditions: string | null
  temperament: Temperament | null
  created_at: string
  updated_at: string
}

export interface IntakeSubmission {
  id: string
  user_id: string
  baby_id: string

  // Step 2: Current Sleep Situation
  current_bedtime: string | null
  current_waketime: string | null
  falling_asleep_method: string | null

  // Step 3: Night Sleep
  night_wakings_count: number | null
  night_wakings_description: string | null
  night_waking_duration: string | null
  night_waking_pattern: string | null

  // Step 4: Naps
  nap_count: number | null
  nap_duration: string | null
  nap_method: string | null
  nap_location: string | null

  // Step 5: The Problem
  problems: string[] | null
  problem_description: string | null

  // Step 6: Parent Preferences
  crying_comfort_level: number | null
  parent_constraints: string | null

  // Step 7: Goals
  success_description: string | null
  additional_notes: string | null

  // Additional data storage
  data: Record<string, unknown>

  // Metadata
  status: IntakeStatus
  created_at: string
  updated_at: string
}

export interface Plan {
  id: string
  user_id: string
  baby_id: string
  intake_submission_id: string
  plan_content: string
  status: PlanStatus
  error_message: string | null
  created_at: string
  updated_at: string
}
