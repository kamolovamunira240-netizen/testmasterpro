import express, { Request, Response, NextFunction } from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import crypto from 'crypto';
import { db } from './server/db.js';
import { telegramService } from './server/telegram.js';
import { parseDocxBuffer, parseTextQuestions } from './server/wordParser.js';
import { exportSubmissionsToExcel } from './server/excelExport.js';
import { run500UserLoadTest, getLatestLoadTestResult } from './server/loadTest.js';
import type { User } from './server/types.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;
const TEACHER_PASSWORD = process.env.TEACHER_PASSWORD || 'admin_testmaster_2026';
const JWT_SECRET = process.env.JWT_SECRET || 'testmaster_jwt_secret_key_2026';

app.use(express.json({ limit: '25mb' }));

// In-memory 30-day session token store
interface SessionData {
  userId: string;
  role: 'student' | 'teacher';
  expiresAt: number;
}
const sessions = new Map<string, SessionData>();

function createSession(userId: string, role: 'student' | 'teacher'): string {
  const token = crypto.randomBytes(32).toString('hex');
  // 30 days session: 30 * 24 * 3600 * 1000
  const expiresAt = Date.now() + 30 * 24 * 60 * 60 * 1000;
  sessions.set(token, { userId, role, expiresAt });
  return token;
}

function getSession(token?: string): SessionData | null {
  if (!token) return null;
  const session = sessions.get(token);
  if (!session) return null;
  if (Date.now() > session.expiresAt) {
    sessions.delete(token);
    return null;
  }
  return session;
}

// Authentication Middleware
function authMiddleware(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  const token = authHeader?.replace('Bearer ', '');
  const session = getSession(token);

  if (!session) {
    res.status(401).json({ error: 'Avtorizatsiyadan o‘tilmagan yoki sessiya muddati tugagan.' });
    return;
  }

  (req as Request & { userSession: SessionData }).userSession = session;
  next();
}

function teacherOnlyMiddleware(req: Request, res: Response, next: NextFunction) {
  const session = (req as Request & { userSession?: SessionData }).userSession;
  if (!session || session.role !== 'teacher') {
    res.status(403).json({ error: 'Faqat o‘qituvchi uchun ruxsat berilgan.' });
    return;
  }
  next();
}

// ==========================================
// 1. AUTHENTICATION ROUTES
// ==========================================

// Request 6-digit Telegram OTP code
app.post('/api/auth/request-otp', (req: Request, res: Response) => {
  try {
    const { phone, firstName, lastName } = req.body;
    if (!phone || typeof phone !== 'string') {
      res.status(400).json({ error: 'Telefon raqam kiritilishi shart.' });
      return;
    }

    const formatted = phone.trim().startsWith('+') ? phone.trim() : `+${phone.trim()}`;
    const { code, expiresAt, deepLink } = telegramService.createVerificationCode(formatted);

    res.json({
      success: true,
      message: 'Tasdiqlash kodi Telegram botingizga yuborildi.',
      expiresAt,
      deepLink,
      // debugCode provided so students/teachers can test effortlessly
      debugCode: code,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Xatolik yuz berdi';
    res.status(400).json({ error: msg });
  }
});

// Verify OTP & generate 30-day session
app.post('/api/auth/verify-otp', async (req: Request, res: Response) => {
  try {
    const { phone, code, firstName, lastName, telegramId } = req.body;
    if (!phone || !code) {
      res.status(400).json({ error: 'Telefon raqam va kod kiritilishi shart.' });
      return;
    }

    const formatted = phone.trim().startsWith('+') ? phone.trim() : `+${phone.trim()}`;
    telegramService.verifyCode(formatted, code, telegramId);

    const user = await db.getOrCreateStudent(
      firstName || 'O‘quvchi',
      lastName || '',
      formatted,
      telegramId
    );

    const token = createSession(user.id, 'student');

    res.json({
      success: true,
      token,
      user,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Tasdiqlash kodi noto‘g‘ri yoki muddati tugagan';
    res.status(400).json({ error: msg });
  }
});

// Teacher Login with secure password
app.post('/api/auth/teacher-login', (req: Request, res: Response) => {
  try {
    const { password } = req.body;
    if (!password || password !== TEACHER_PASSWORD) {
      res.status(401).json({ error: 'O‘qituvchi paroli noto‘g‘ri.' });
      return;
    }

    // Get or create teacher user
    let teacher = Array.from(db.users.values()).find((u) => u.role === 'teacher');
    if (!teacher) {
      teacher = {
        id: crypto.randomUUID(),
        first_name: 'Bosh',
        last_name: 'O‘qituvchi',
        phone: '+998900000000',
        role: 'teacher',
        created_at: new Date().toISOString(),
      };
      db.users.set(teacher.id, teacher);
    }

    const token = createSession(teacher.id, 'teacher');
    res.json({
      success: true,
      token,
      user: teacher,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Xatolik';
    res.status(500).json({ error: msg });
  }
});

// Get current session
app.get('/api/auth/session', (req: Request, res: Response) => {
  const authHeader = req.headers.authorization;
  const token = authHeader?.replace('Bearer ', '');
  const session = getSession(token);

  if (!session) {
    res.status(401).json({ authenticated: false });
    return;
  }

  const user = db.getUserById(session.userId);
  if (!user) {
    res.status(401).json({ authenticated: false });
    return;
  }

  res.json({
    authenticated: true,
    user,
    role: session.role,
  });
});

// ==========================================
// 2. STUDENT ROUTES
// ==========================================

app.get('/api/student/dashboard', authMiddleware, (req: Request, res: Response) => {
  try {
    const session = (req as Request & { userSession: SessionData }).userSession;
    const groups = db.getUserGroups(session.userId);
    const tests = db.getTests(session.userId, false);
    const profile = db.getStudentProfile(session.userId);

    res.json({
      groups,
      tests,
      recentAttempts: profile.history.slice(0, 5),
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Xatolik';
    res.status(500).json({ error: msg });
  }
});

app.get('/api/student/active-attempt', authMiddleware, (req: Request, res: Response) => {
  try {
    const session = (req as Request & { userSession: SessionData }).userSession;
    const active = db.getActiveAttemptForUser(session.userId);
    if (!active) {
      res.json({ hasActive: false });
      return;
    }

    const questions = db.getQuestionsForAttempt(active.test.id, false);
    const savedAnswers = db.getAttemptAnswers(active.attempt.id);

    res.json({
      hasActive: true,
      attempt: active.attempt,
      test: active.test,
      questions,
      savedAnswers,
      remainingSeconds: active.remainingSeconds,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Xatolik';
    res.status(500).json({ error: msg });
  }
});

app.post('/api/student/tests/:id/start', authMiddleware, (req: Request, res: Response) => {
  try {
    const session = (req as Request & { userSession: SessionData }).userSession;
    const testId = req.params.id;
    const test = db.getTestById(testId);
    if (!test) {
      res.status(404).json({ error: 'Test topilmadi.' });
      return;
    }

    const { attempt, questions, remainingSeconds } = db.startAttempt(testId, session.userId);
    const savedAnswers = db.getAttemptAnswers(attempt.id);

    res.json({
      success: true,
      attempt,
      test,
      questions,
      savedAnswers,
      remainingSeconds,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Testni boshlab bo‘lmadi';
    res.status(400).json({ error: msg });
  }
});

app.post('/api/student/attempts/:id/answer', authMiddleware, (req: Request, res: Response) => {
  try {
    const attemptId = req.params.id;
    const { questionId, selectedAnswerId } = req.body;
    db.saveAnswer(attemptId, questionId, selectedAnswerId);
    res.json({ success: true });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Javobni saqlab bo‘lmadi';
    res.status(400).json({ error: msg });
  }
});

app.post('/api/student/attempts/:id/tab-event', authMiddleware, (req: Request, res: Response) => {
  try {
    const attemptId = req.params.id;
    const { eventType } = req.body;
    const currentCount = db.recordTabEvent(attemptId, eventType || 'tab_switch');
    res.json({ success: true, tab_switch_count: currentCount });
  } catch (err: unknown) {
    res.status(400).json({ error: 'Hodisa yozilmadi' });
  }
});

app.post('/api/student/attempts/:id/complete', authMiddleware, (req: Request, res: Response) => {
  try {
    const session = (req as Request & { userSession: SessionData }).userSession;
    const attemptId = req.params.id;
    const result = db.completeAttempt(attemptId, session.userId);
    res.json({ success: true, result });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Testni yakunlab bo‘lmadi';
    res.status(400).json({ error: msg });
  }
});

app.get('/api/student/profile', authMiddleware, (req: Request, res: Response) => {
  try {
    const session = (req as Request & { userSession: SessionData }).userSession;
    const profile = db.getStudentProfile(session.userId);
    res.json(profile);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Profilni yuklab bo‘lmadi';
    res.status(400).json({ error: msg });
  }
});

// ==========================================
// 3. TEACHER DASHBOARD & ANALYTICS ROUTES
// ==========================================

app.get('/api/teacher/dashboard', authMiddleware, teacherOnlyMiddleware, (req: Request, res: Response) => {
  try {
    const overview = db.getDashboardOverview();
    res.json(overview);
  } catch (err: unknown) {
    res.status(500).json({ error: 'Dashboard ma’lumotlari yuklanmadi' });
  }
});

app.get('/api/teacher/submissions', authMiddleware, teacherOnlyMiddleware, (req: Request, res: Response) => {
  try {
    const { groupId, testId, studentName, status } = req.query as Record<string, string>;
    const submissions = db.getSubmissions({ groupId, testId, studentName, status });
    res.json(submissions);
  } catch (err: unknown) {
    res.status(500).json({ error: 'Natijalar yuklanmadi' });
  }
});

app.get('/api/teacher/unsubmitted/:testId', authMiddleware, teacherOnlyMiddleware, (req: Request, res: Response) => {
  try {
    const testId = req.params.testId;
    const unsubmitted = db.getUnsubmittedStudents(testId);
    res.json(unsubmitted);
  } catch (err: unknown) {
    res.status(500).json({ error: 'Ro‘yxat yuklanmadi' });
  }
});

app.get('/api/teacher/question-stats/:testId', authMiddleware, teacherOnlyMiddleware, (req: Request, res: Response) => {
  try {
    const testId = req.params.testId;
    const stats = db.getQuestionStatistics(testId);
    res.json(stats);
  } catch (err: unknown) {
    res.status(500).json({ error: 'Statistika yuklanmadi' });
  }
});

// Delete attempt & allow retake (with audit log!)
app.post('/api/teacher/attempts/:id/delete', authMiddleware, teacherOnlyMiddleware, (req: Request, res: Response) => {
  try {
    const session = (req as Request & { userSession: SessionData }).userSession;
    const attemptId = req.params.id;
    const { reason } = req.body;
    db.deleteAttempt(attemptId, session.userId, reason);
    res.json({ success: true, message: 'Natija o‘chirildi. O‘quvchi qayta topshirishi mumkin.' });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Natijani o‘chirib bo‘lmadi';
    res.status(400).json({ error: msg });
  }
});

// Export to Excel (.xlsx)
app.get('/api/teacher/export-excel', authMiddleware, teacherOnlyMiddleware, (req: Request, res: Response) => {
  try {
    const { groupId, testId, studentName, status } = req.query as Record<string, string>;
    const submissions = db.getSubmissions({ groupId, testId, studentName, status });

    let filterTitle = 'Barcha Natijalar';
    if (testId) {
      const test = db.getTestById(testId);
      if (test) filterTitle = test.title.slice(0, 25);
    }

    const buffer = exportSubmissionsToExcel(submissions, filterTitle);

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="TestMaster_Natijalar_${Date.now()}.xlsx"`);
    res.send(buffer);
  } catch (err: unknown) {
    res.status(500).json({ error: 'Excel fayl yaratilmadi' });
  }
});

// ==========================================
// 4. TEACHER GROUPS & TESTS MANAGEMENT
// ==========================================

app.get('/api/teacher/groups', authMiddleware, teacherOnlyMiddleware, (req: Request, res: Response) => {
  res.json(db.getGroups());
});

app.post('/api/teacher/groups', authMiddleware, teacherOnlyMiddleware, (req: Request, res: Response) => {
  try {
    const { name, description } = req.body;
    if (!name) {
      res.status(400).json({ error: 'Guruh nomi kiritilishi shart.' });
      return;
    }
    const group = db.createGroup(name, description || '');
    res.json(group);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Guruh yaratilmadi';
    res.status(400).json({ error: msg });
  }
});

app.put('/api/teacher/groups/:id', authMiddleware, teacherOnlyMiddleware, (req: Request, res: Response) => {
  try {
    const group = db.updateGroup(req.params.id, req.body);
    res.json(group);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Guruh yangilanmadi';
    res.status(400).json({ error: msg });
  }
});

app.delete('/api/teacher/groups/:id', authMiddleware, teacherOnlyMiddleware, (req: Request, res: Response) => {
  try {
    db.deleteGroup(req.params.id);
    res.json({ success: true });
  } catch (err: unknown) {
    res.status(400).json({ error: 'Guruh o‘chirilmadi' });
  }
});

app.get('/api/teacher/groups/:id/students', authMiddleware, teacherOnlyMiddleware, (req: Request, res: Response) => {
  res.json(db.getGroupStudents(req.params.id));
});

app.post('/api/teacher/groups/:id/students', authMiddleware, teacherOnlyMiddleware, (req: Request, res: Response) => {
  const { userId } = req.body;
  db.addStudentToGroup(req.params.id, userId);
  res.json({ success: true });
});

app.delete('/api/teacher/groups/:id/students/:userId', authMiddleware, teacherOnlyMiddleware, (req: Request, res: Response) => {
  db.removeStudentFromGroup(req.params.id, req.params.userId);
  res.json({ success: true });
});

app.get('/api/teacher/students', authMiddleware, teacherOnlyMiddleware, (req: Request, res: Response) => {
  res.json(db.getAllStudents());
});

app.get('/api/teacher/tests', authMiddleware, teacherOnlyMiddleware, (req: Request, res: Response) => {
  res.json(db.getTests(undefined, true));
});

app.post('/api/teacher/tests', authMiddleware, teacherOnlyMiddleware, (req: Request, res: Response) => {
  try {
    const session = (req as Request & { userSession: SessionData }).userSession;
    const { testData, questions, groupIds } = req.body;

    if (!testData || !testData.title) {
      res.status(400).json({ error: 'Test nomi kiritilishi shart.' });
      return;
    }
    if (!questions || questions.length === 0) {
      res.status(400).json({ error: 'Testda kamida 1 ta savol bo‘lishi shart.' });
      return;
    }

    const test = db.createTest(
      {
        ...testData,
        created_by: session.userId,
      },
      questions,
      groupIds || []
    );

    res.json(test);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Test yaratilmadi';
    res.status(400).json({ error: msg });
  }
});

app.put('/api/teacher/tests/:id', authMiddleware, teacherOnlyMiddleware, (req: Request, res: Response) => {
  try {
    const { testData, groupIds } = req.body;
    const updated = db.updateTest(req.params.id, testData, groupIds);
    res.json(updated);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Test yangilanmadi';
    res.status(400).json({ error: msg });
  }
});

app.delete('/api/teacher/tests/:id', authMiddleware, teacherOnlyMiddleware, (req: Request, res: Response) => {
  try {
    db.deleteTest(req.params.id);
    res.json({ success: true });
  } catch (err: unknown) {
    res.status(400).json({ error: 'Test o‘chirilmadi' });
  }
});

// ==========================================
// 5. WORD (.DOCX) / TEXT PARSER & PREVIEW
// ==========================================

app.post('/api/teacher/parse-docx', authMiddleware, teacherOnlyMiddleware, async (req: Request, res: Response) => {
  try {
    const { base64Data, rawText } = req.body;

    if (base64Data) {
      const buffer = Buffer.from(base64Data, 'base64');
      const result = await parseDocxBuffer(buffer);
      res.json(result);
      return;
    }

    if (rawText) {
      const result = parseTextQuestions(rawText);
      res.json(result);
      return;
    }

    res.status(400).json({ error: 'Fayl yoki matn yuborilmadi.' });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Word faylini tahlil qilib bo‘lmadi';
    res.status(400).json({ error: msg });
  }
});

// ==========================================
// 6. 500 CONCURRENT USERS LOAD TEST
// ==========================================

app.post('/api/teacher/run-load-test', authMiddleware, teacherOnlyMiddleware, async (req: Request, res: Response) => {
  try {
    const count = parseInt(req.body.usersCount) || 500;
    const metrics = await run500UserLoadTest(count);
    res.json({ success: true, metrics });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Load test xatolik bilan to‘xtadi';
    res.status(500).json({ error: msg });
  }
});

app.get('/api/teacher/load-test-report', authMiddleware, teacherOnlyMiddleware, (req: Request, res: Response) => {
  const result = getLatestLoadTestResult();
  res.json(result || { message: 'Hali yuklama sinovi o‘tkazilmagan.' });
});

// ==========================================
// 7. TELEGRAM SETTINGS & STATUS
// ==========================================

app.get('/api/teacher/telegram-info', authMiddleware, teacherOnlyMiddleware, (req: Request, res: Response) => {
  res.json(telegramService.getBotInfo());
});

app.post('/api/teacher/telegram-config', authMiddleware, teacherOnlyMiddleware, (req: Request, res: Response) => {
  const { botToken, teacherChatId, botUsername } = req.body;
  telegramService.updateConfig(botToken, teacherChatId, botUsername);
  res.json({ success: true, info: telegramService.getBotInfo() });
});

// ==========================================
// 8. VITE MIDDLEWARE / STATIC ASSETS
// ==========================================

async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (req: Request, res: Response) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, () => {
    console.log(`🚀 TestMaster Pro server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
