export type UserRole = 'student' | 'teacher' | 'admin';

export interface User {
  id: string;
  first_name: string;
  last_name: string;
  phone: string;
  telegram_id?: string;
  role: UserRole;
  created_at: string;
}

export interface Group {
  id: string;
  name: string;
  description: string;
  created_at: string;
  is_active: boolean;
  member_count?: number;
}

export interface GroupMember {
  id: string;
  group_id: string;
  user_id: string;
  created_at: string;
}

export type TestStatus = 'draft' | 'scheduled' | 'active' | 'closed';
export type QuestionType = 'single_choice' | 'true_false';

export interface Test {
  id: string;
  title: string;
  description: string;
  time_limit: number; // daqiqalarda
  attempts_limit: number;
  passing_percentage: number;
  open_at?: string;
  close_at?: string;
  shuffle_questions: boolean;
  shuffle_answers: boolean;
  show_correct_answers: boolean;
  status: TestStatus;
  created_by?: string;
  created_at: string;
  group_ids?: string[];
  question_count?: number;
  max_score?: number;
}

export interface TestGroup {
  id: string;
  test_id: string;
  group_id: string;
}

export interface Question {
  id: string;
  test_id: string;
  type: QuestionType;
  question_text: string;
  explanation?: string;
  points: number;
  order_index: number;
  answers?: Answer[];
}

export interface Answer {
  id: string;
  question_id: string;
  answer_text: string;
  is_correct: boolean;
  order_index: number;
}

// Client-safe version of question (scrubbed of is_correct during active test)
export interface ClientQuestion {
  id: string;
  test_id: string;
  type: QuestionType;
  question_text: string;
  points: number;
  order_index: number;
  explanation?: string; // only if test finished and show_correct_answers is true
  answers: {
    id: string;
    answer_text: string;
    order_index: number;
    is_correct?: boolean; // only in review mode if allowed
  }[];
}

export type AttemptStatus = 'in_progress' | 'completed' | 'abandoned' | 'deleted';

export interface Attempt {
  id: string;
  test_id: string;
  user_id: string;
  started_at: string;
  submitted_at?: string;
  score: number;
  max_score: number;
  percentage: number;
  passed: boolean;
  time_spent: number; // soniyalarda
  tab_switch_count: number;
  status: AttemptStatus;
}

export interface AttemptAnswer {
  id: string;
  attempt_id: string;
  question_id: string;
  selected_answer_id?: string;
  is_correct: boolean;
  points_awarded: number;
  answered_at: string;
}

export interface TabEvent {
  id: string;
  attempt_id: string;
  event_type: 'tab_switch' | 'window_blur' | 'fullscreen_exit';
  occurred_at: string;
}

export interface TelegramVerificationCode {
  id: string;
  user_id?: string;
  phone: string;
  telegram_id?: string;
  code_hash: string;
  expires_at: string;
  used_at?: string;
  created_at: string;
}

export interface AuditLog {
  id: string;
  user_id?: string;
  action: string;
  entity_type: string;
  entity_id?: string;
  details?: Record<string, unknown>;
  created_at: string;
}

export interface ParseDocxResult {
  questions: {
    question_text: string;
    type: QuestionType;
    points: number;
    explanation?: string;
    answers: {
      answer_text: string;
      is_correct: boolean;
    }[];
    error?: string;
  }[];
  formatErrors: {
    question_index: number;
    error_message: string;
  }[];
  total_detected: number;
  valid_count: number;
}

export interface SubmissionRow {
  attempt_id: string;
  user_id: string;
  student_name: string;
  phone: string;
  group_id: string;
  group_name: string;
  test_id: string;
  test_title: string;
  started_at: string;
  submitted_at: string;
  score: number;
  max_score: number;
  percentage: number;
  passed: boolean;
  time_spent: number;
  tab_switch_count: number;
  status: AttemptStatus;
}

export interface QuestionStat {
  question_id: string;
  order_index: number;
  question_text: string;
  points: number;
  total_answers: number;
  correct_count: number;
  incorrect_count: number;
  correct_percentage: number;
}

export interface LoadTestMetric {
  virtual_users: number;
  total_requests: number;
  successful_requests: number;
  failed_requests: number;
  error_rate_pct: number;
  total_duration_ms: number;
  throughput_req_per_sec: number;
  latency_min_ms: number;
  latency_avg_ms: number;
  latency_p50_ms: number;
  latency_p95_ms: number;
  latency_p99_ms: number;
  latency_max_ms: number;
  memory_used_mb: number;
  tested_at: string;
  stages_completed: {
    authentication: number;
    test_lookup: number;
    attempt_start: number;
    answers_saved: number;
    submission_complete: number;
    telegram_queue: number;
  };
}
