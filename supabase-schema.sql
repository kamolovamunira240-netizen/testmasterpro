-- ============================================================================
-- TESTMASTER PRO - SUPABASE POSTGRESQL MA'LUMOTLAR BAZASI STRUKTURASI
-- 500+ bir vaqtda foydalanuvchi quvvatiga ega, RLS xavfsizlik qoidalari bilan
-- ============================================================================

-- Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 1. FOYDALANUVCHILAR (users)
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    phone VARCHAR(20) UNIQUE NOT NULL,
    telegram_id VARCHAR(50),
    role VARCHAR(20) NOT NULL DEFAULT 'student' CHECK (role IN ('student', 'teacher', 'admin')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_users_phone ON users(phone);
CREATE INDEX IF NOT EXISTS idx_users_telegram_id ON users(telegram_id);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);

-- 2. GURUHLAR (groups)
CREATE TABLE IF NOT EXISTS groups (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(150) NOT NULL,
    description TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    is_active BOOLEAN NOT NULL DEFAULT TRUE
);

CREATE INDEX IF NOT EXISTS idx_groups_active ON groups(is_active);

-- 3. GURUH A'ZOLARI (group_members)
CREATE TABLE IF NOT EXISTS group_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    group_id UUID NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(group_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_group_members_group ON group_members(group_id);
CREATE INDEX IF NOT EXISTS idx_group_members_user ON group_members(user_id);

-- 4. TESTLAR (tests)
CREATE TABLE IF NOT EXISTS tests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(255) NOT NULL,
    description TEXT,
    time_limit INTEGER NOT NULL DEFAULT 30, -- daqiqalarda
    attempts_limit INTEGER NOT NULL DEFAULT 1,
    passing_percentage NUMERIC(5,2) NOT NULL DEFAULT 60.00,
    open_at TIMESTAMPTZ,
    close_at TIMESTAMPTZ,
    shuffle_questions BOOLEAN NOT NULL DEFAULT FALSE,
    shuffle_answers BOOLEAN NOT NULL DEFAULT FALSE,
    show_correct_answers BOOLEAN NOT NULL DEFAULT FALSE,
    status VARCHAR(30) NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'scheduled', 'active', 'closed')),
    created_by UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_tests_status ON tests(status);
CREATE INDEX IF NOT EXISTS idx_tests_dates ON tests(open_at, close_at);

-- 5. TEST-GURUH BOG'LANISHI (test_groups)
CREATE TABLE IF NOT EXISTS test_groups (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    test_id UUID NOT NULL REFERENCES tests(id) ON DELETE CASCADE,
    group_id UUID NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
    UNIQUE(test_id, group_id)
);

CREATE INDEX IF NOT EXISTS idx_test_groups_test ON test_groups(test_id);
CREATE INDEX IF NOT EXISTS idx_test_groups_group ON test_groups(group_id);

-- 6. SAVOLLAR (questions)
CREATE TABLE IF NOT EXISTS questions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    test_id UUID NOT NULL REFERENCES tests(id) ON DELETE CASCADE,
    type VARCHAR(30) NOT NULL DEFAULT 'single_choice' CHECK (type IN ('single_choice', 'true_false')),
    question_text TEXT NOT NULL,
    explanation TEXT,
    points NUMERIC(5,2) NOT NULL DEFAULT 1.00,
    order_index INTEGER NOT NULL DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_questions_test ON questions(test_id, order_index);

-- 7. JAVOBLAR / VARIANTLAR (answers)
CREATE TABLE IF NOT EXISTS answers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    question_id UUID NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
    answer_text TEXT NOT NULL,
    is_correct BOOLEAN NOT NULL DEFAULT FALSE,
    order_index INTEGER NOT NULL DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_answers_question ON answers(question_id, order_index);

-- 8. URINISHLAR (attempts)
CREATE TABLE IF NOT EXISTS attempts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    test_id UUID NOT NULL REFERENCES tests(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    submitted_at TIMESTAMPTZ,
    score NUMERIC(7,2) DEFAULT 0,
    max_score NUMERIC(7,2) DEFAULT 0,
    percentage NUMERIC(5,2) DEFAULT 0,
    passed BOOLEAN DEFAULT FALSE,
    time_spent INTEGER DEFAULT 0, -- soniyalarda
    tab_switch_count INTEGER NOT NULL DEFAULT 0,
    status VARCHAR(30) NOT NULL DEFAULT 'in_progress' CHECK (status IN ('in_progress', 'completed', 'abandoned', 'deleted'))
);

CREATE INDEX IF NOT EXISTS idx_attempts_test_user ON attempts(test_id, user_id);
CREATE INDEX IF NOT EXISTS idx_attempts_status ON attempts(status);
CREATE INDEX IF NOT EXISTS idx_attempts_submitted ON attempts(submitted_at);

-- 9. O'QUVCHI JAVOBLARI (attempt_answers)
CREATE TABLE IF NOT EXISTS attempt_answers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    attempt_id UUID NOT NULL REFERENCES attempts(id) ON DELETE CASCADE,
    question_id UUID NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
    selected_answer_id UUID REFERENCES answers(id) ON DELETE SET NULL,
    is_correct BOOLEAN NOT NULL DEFAULT FALSE,
    points_awarded NUMERIC(5,2) NOT NULL DEFAULT 0.00,
    answered_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(attempt_id, question_id)
);

CREATE INDEX IF NOT EXISTS idx_attempt_answers_attempt ON attempt_answers(attempt_id);
CREATE INDEX IF NOT EXISTS idx_attempt_answers_question ON attempt_answers(question_id);

-- 10. OYNADAN CHIQISH HODISALARI (tab_events)
CREATE TABLE IF NOT EXISTS tab_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    attempt_id UUID NOT NULL REFERENCES attempts(id) ON DELETE CASCADE,
    event_type VARCHAR(50) NOT NULL, -- 'tab_switch', 'window_blur', 'fullscreen_exit'
    occurred_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_tab_events_attempt ON tab_events(attempt_id);

-- 11. TELEGRAM BIR MARTALIK TASDIQLASH KODLARI (telegram_verification_codes)
CREATE TABLE IF NOT EXISTS telegram_verification_codes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    phone VARCHAR(20) NOT NULL,
    telegram_id VARCHAR(50),
    code_hash VARCHAR(255) NOT NULL,
    expires_at TIMESTAMPTZ NOT NULL,
    used_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_tvc_phone ON telegram_verification_codes(phone, expires_at);

-- 12. AUDIT LOGLARI (audit_logs)
CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    action VARCHAR(100) NOT NULL,
    entity_type VARCHAR(50) NOT NULL,
    entity_id VARCHAR(100),
    details JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_audit_logs_user ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created ON audit_logs(created_at);

-- ============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================================

ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE group_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE tests ENABLE ROW LEVEL SECURITY;
ALTER TABLE test_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE answers ENABLE ROW LEVEL SECURITY;
ALTER TABLE attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE attempt_answers ENABLE ROW LEVEL SECURITY;
ALTER TABLE tab_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE telegram_verification_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Service Role (backend API) to'liq ruxsatga ega
CREATE POLICY "Service Role Full Access" ON users FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Service Role Full Access Groups" ON groups FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Service Role Full Access GM" ON group_members FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Service Role Full Access Tests" ON tests FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Service Role Full Access TG" ON test_groups FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Service Role Full Access Questions" ON questions FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Service Role Full Access Answers" ON answers FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Service Role Full Access Attempts" ON attempts FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Service Role Full Access AttemptAnswers" ON attempt_answers FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Service Role Full Access TabEvents" ON tab_events FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Service Role Full Access TVC" ON telegram_verification_codes FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Service Role Full Access Audit" ON audit_logs FOR ALL USING (auth.role() = 'service_role');

-- O'quvchi xavfsizlik qoidalari
-- O'quvchi faqat o'z profilini ko'ra oladi
CREATE POLICY "Users read own profile" ON users FOR SELECT USING (auth.uid() = id);

-- O'quvchi o'ziga biriktirilgan guruhlarni ko'ra oladi
CREATE POLICY "Users read their groups" ON groups FOR SELECT USING (
    id IN (SELECT group_id FROM group_members WHERE user_id = auth.uid())
);

-- O'quvchi faqat o'z guruhlaridagi ochiq testlarni ko'ra oladi
CREATE POLICY "Users read available tests" ON tests FOR SELECT USING (
    status = 'active' AND
    id IN (SELECT test_id FROM test_groups WHERE group_id IN (SELECT group_id FROM group_members WHERE user_id = auth.uid()))
);

-- O'quvchi faqat o'z urinishlarini ko'radi
CREATE POLICY "Users read own attempts" ON attempts FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Users insert own attempts" ON attempts FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users update own active attempts" ON attempts FOR UPDATE USING (user_id = auth.uid() AND status = 'in_progress');

-- O'quvchi faqat o'z urinishidagi javoblarni ko'radi va kiritadi
CREATE POLICY "Users own attempt answers" ON attempt_answers FOR ALL USING (
    attempt_id IN (SELECT id FROM attempts WHERE user_id = auth.uid())
);

-- O'quvchi faqat o'z urinishidagi tab eventlarini yozadi
CREATE POLICY "Users insert tab events" ON tab_events FOR INSERT WITH CHECK (
    attempt_id IN (SELECT id FROM attempts WHERE user_id = auth.uid())
);
