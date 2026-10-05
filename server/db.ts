import crypto from 'crypto';
import type {
  User,
  Group,
  GroupMember,
  Test,
  TestGroup,
  Question,
  Answer,
  Attempt,
  AttemptAnswer,
  TabEvent,
  AuditLog,
  ClientQuestion,
  SubmissionRow,
  QuestionStat,
} from './types.js';
import { telegramService } from './telegram.js';

export class DatabaseService {
  public users: Map<string, User> = new Map();
  public groups: Map<string, Group> = new Map();
  public groupMembers: Map<string, GroupMember> = new Map();
  public tests: Map<string, Test> = new Map();
  public testGroups: Map<string, TestGroup> = new Map();
  public questions: Map<string, Question> = new Map();
  public answers: Map<string, Answer> = new Map();
  public attempts: Map<string, Attempt> = new Map();
  public attemptAnswers: Map<string, AttemptAnswer> = new Map();
  public tabEvents: Map<string, TabEvent> = new Map();
  public auditLogs: Map<string, AuditLog> = new Map();

  constructor() {
    this.seedInitialData();
  }

  // --- SEED INITIAL REALISTIC DATA ---
  private seedInitialData() {
    // 1. Teacher account
    const teacherId = '00000000-0000-0000-0000-000000000001';
    this.users.set(teacherId, {
      id: teacherId,
      first_name: 'Alisher',
      last_name: 'Navoiy',
      phone: '+998901234567',
      telegram_id: '12345678',
      role: 'teacher',
      created_at: new Date(Date.now() - 30 * 86400000).toISOString(),
    });

    // 2. Groups
    const group1Id = '11111111-1111-1111-1111-111111111111';
    const group2Id = '22222222-2222-2222-2222-222222222222';

    this.groups.set(group1Id, {
      id: group1Id,
      name: '101-Guruh: Dasturlash Asoslari',
      description: 'Axborot texnologiyalari va dasturiy ta’minot asoslari fani',
      created_at: new Date(Date.now() - 25 * 86400000).toISOString(),
      is_active: true,
    });

    this.groups.set(group2Id, {
      id: group2Id,
      name: '102-Guruh: Kiberxavfsizlik va Tarmoqlar',
      description: 'Axborot xavfsizligi va kompyuter tarmoqlari',
      created_at: new Date(Date.now() - 20 * 86400000).toISOString(),
      is_active: true,
    });

    // 3. Students
    const studentProfiles = [
      { id: 's1', fn: 'Jasur', ln: 'Toshmatov', phone: '+998911112233', gId: group1Id },
      { id: 's2', fn: 'Dilnoza', ln: 'Karimova', phone: '+998933334455', gId: group1Id },
      { id: 's3', fn: 'Bekzod', ln: 'Saidov', phone: '+998945556677', gId: group1Id },
      { id: 's4', fn: 'Malika', ln: 'Azimova', phone: '+998977778899', gId: group2Id },
      { id: 's5', fn: 'Sardor', ln: 'Rahimov', phone: '+998909990011', gId: group2Id },
    ];

    studentProfiles.forEach((s) => {
      const uId = crypto.randomUUID();
      this.users.set(uId, {
        id: uId,
        first_name: s.fn,
        last_name: s.ln,
        phone: s.phone,
        role: 'student',
        created_at: new Date(Date.now() - 15 * 86400000).toISOString(),
      });

      const gmId = crypto.randomUUID();
      this.groupMembers.set(gmId, {
        id: gmId,
        group_id: s.gId,
        user_id: uId,
        created_at: new Date().toISOString(),
      });
    });

    // 4. Create comprehensive sample test
    const test1Id = 't1-inf-2026';
    this.tests.set(test1Id, {
      id: test1Id,
      title: 'Informatika va Axborot Texnologiyalari (Oraliq Nazorat)',
      description: 'Kompyuter arxitekturasi, ma’lumotlar bazasi va dasturlash asoslari bo‘yicha 15 ta test savoli.',
      time_limit: 20, // 20 minutes
      attempts_limit: 2,
      passing_percentage: 60,
      open_at: new Date(Date.now() - 2 * 86400000).toISOString(),
      close_at: new Date(Date.now() + 10 * 86400000).toISOString(),
      shuffle_questions: true,
      shuffle_answers: true,
      show_correct_answers: true,
      status: 'active',
      created_by: teacherId,
      created_at: new Date(Date.now() - 3 * 86400000).toISOString(),
    });

    // Assign to groups
    this.testGroups.set(crypto.randomUUID(), { id: crypto.randomUUID(), test_id: test1Id, group_id: group1Id });
    this.testGroups.set(crypto.randomUUID(), { id: crypto.randomUUID(), test_id: test1Id, group_id: group2Id });

    // Questions for Test 1
    const rawQuestions = [
      {
        q: '1 GB (gigabayt) necha megabayt (MB) ga teng?',
        pts: 1,
        exp: 'Xalqaro standart bo‘yicha 1 GB = 1024 MB.',
        ans: [
          { t: '1000 MB', c: false },
          { t: '1024 MB', c: true },
          { t: '512 MB', c: false },
          { t: '2048 MB', c: false },
        ],
      },
      {
        q: 'Kompyuterning asosiy xotirasi (RAM) qanday turdagi xotiraga kiradi?',
        pts: 1,
        exp: 'RAM vaqtinchalik (uchuvchan) xotira hisoblanadi.',
        ans: [
          { t: 'Doimiy va o‘chmas xotira', c: false },
          { t: 'Vaqtinchalik (uchuvchan) tezkor xotira', c: true },
          { t: 'Faqat o‘qish uchun mo‘ljallangan xotira (ROM)', c: false },
          { t: 'Optik disk xotirasi', c: false },
        ],
      },
      {
        q: 'Relyatsion ma’lumotlar bazalarida jadvallar o‘rtasidagi bog‘liqlik qaysi kalit orqali ta’minlanadi?',
        pts: 2,
        exp: 'Tashqi kalit (Foreign Key) boshqa jadvalning Birlamchi kaliti (Primary Key) ga murojaat qiladi.',
        ans: [
          { t: 'Index Key', c: false },
          { t: 'Foreign Key (Tashqi kalit)', c: true },
          { t: 'Hash Key', c: false },
          { t: 'Composite Key', c: false },
        ],
      },
      {
        q: 'SQL tilida jadvaldan ma’lumotlarni saralab tanlab olish uchun qaysi operator ishlatiladi?',
        pts: 1,
        exp: 'SELECT ma’lumotlarni o‘qish operatoridir.',
        ans: [
          { t: 'INSERT', c: false },
          { t: 'UPDATE', c: false },
          { t: 'SELECT', c: true },
          { t: 'DELETE', c: false },
        ],
      },
      {
        q: 'Python dasturlash tilida ro‘yxat (list) elementlari o‘zgartirilishi mumkinmi (mutable)?',
        pts: 1,
        exp: 'Ha, Python-da list mutable, tuple esa immutable hisoblanadi.',
        ans: [
          { t: 'Ha, to‘g‘ri', c: true },
          { t: 'Yo‘q, noto‘g‘ri', c: false },
        ],
      },
      {
        q: 'Tarmoqning xavfsiz protokoliga qaysi biri kiradi?',
        pts: 1,
        exp: 'HTTPS (HyperText Transfer Protocol Secure) TLS/SSL orqali shifrlanadi.',
        ans: [
          { t: 'HTTP', c: false },
          { t: 'FTP', c: false },
          { t: 'HTTPS', c: true },
          { t: 'Telnet', c: false },
        ],
      },
      {
        q: 'HTML hujjatida havolalar (linklar) qaysi tegi orqali beriladi?',
        pts: 1,
        exp: '<a> tegi href atributi bilan havola yaratadi.',
        ans: [
          { t: '<link>', c: false },
          { t: '<a>', c: true },
          { t: '<href>', c: false },
          { t: '<url>', c: false },
        ],
      },
      {
        q: 'CSS-da elementning tashqi bo‘shlig‘i qaysi xususiyat orqali o‘rnatiladi?',
        pts: 1,
        exp: 'margin - tashqi oraliq, padding - ichki oraliq.',
        ans: [
          { t: 'padding', c: false },
          { t: 'margin', c: true },
          { t: 'border', c: false },
          { t: 'spacing', c: false },
        ],
      },
      {
        q: 'Algoritmning asosiy xossalariga qaysi biri kirmaydi?',
        pts: 2,
        exp: 'Cheksizlik xossasi yo‘q, aksincha algoritm cheklilik (diskretlik, tushunarlilik) xossasiga ega bo‘lishi lozim.',
        ans: [
          { t: 'Diskretlik', c: false },
          { t: 'Aniqlik (determinallik)', c: false },
          { t: 'Natijaviylik', c: false },
          { t: 'Cheksizlik', c: true },
        ],
      },
      {
        q: 'IP manzillarning IPv4 versiyasi necha bitdan iborat?',
        pts: 1,
        exp: 'IPv4 manzili 32 bit (4 bayt) dan iborat.',
        ans: [
          { t: '16 bit', c: false },
          { t: '32 bit', c: true },
          { t: '64 bit', c: false },
          { t: '128 bit', c: false },
        ],
      },
    ];

    rawQuestions.forEach((rq, qIdx) => {
      const qId = crypto.randomUUID();
      this.questions.set(qId, {
        id: qId,
        test_id: test1Id,
        type: rq.ans.length === 2 ? 'true_false' : 'single_choice',
        question_text: rq.q,
        explanation: rq.exp,
        points: rq.pts,
        order_index: qIdx + 1,
      });

      rq.ans.forEach((ans, aIdx) => {
        const aId = crypto.randomUUID();
        this.answers.set(aId, {
          id: aId,
          question_id: qId,
          answer_text: ans.t,
          is_correct: ans.c,
          order_index: aIdx + 1,
        });
      });
    });

    // Seed a second test
    const test2Id = 't2-web-2026';
    this.tests.set(test2Id, {
      id: test2Id,
      title: 'Web Dasturlash Asoslari: JavaScript va DOM',
      description: 'Zamonaviy veb ilovalar, hodisalar (events) va asinxron JavaScript.',
      time_limit: 15,
      attempts_limit: 1,
      passing_percentage: 70,
      open_at: new Date(Date.now() - 1 * 86400000).toISOString(),
      close_at: new Date(Date.now() + 5 * 86400000).toISOString(),
      shuffle_questions: false,
      shuffle_answers: true,
      show_correct_answers: true,
      status: 'active',
      created_by: teacherId,
      created_at: new Date().toISOString(),
    });
    this.testGroups.set(crypto.randomUUID(), { id: crypto.randomUUID(), test_id: test2Id, group_id: group1Id });

    // Seed 2 sample attempts so teacher dashboard and stats have initial numbers
    const sampleStudents = Array.from(this.users.values()).filter((u) => u.role === 'student');
    if (sampleStudents.length >= 2) {
      const st1 = sampleStudents[0];
      const attempt1Id = crypto.randomUUID();
      this.attempts.set(attempt1Id, {
        id: attempt1Id,
        test_id: test1Id,
        user_id: st1.id,
        started_at: new Date(Date.now() - 3600000).toISOString(),
        submitted_at: new Date(Date.now() - 2700000).toISOString(),
        score: 11,
        max_score: 12,
        percentage: 91.67,
        passed: true,
        time_spent: 900,
        tab_switch_count: 1,
        status: 'completed',
      });

      const st2 = sampleStudents[1];
      const attempt2Id = crypto.randomUUID();
      this.attempts.set(attempt2Id, {
        id: attempt2Id,
        test_id: test1Id,
        user_id: st2.id,
        started_at: new Date(Date.now() - 7200000).toISOString(),
        submitted_at: new Date(Date.now() - 6100000).toISOString(),
        score: 6,
        max_score: 12,
        percentage: 50.0,
        passed: false,
        time_spent: 1100,
        tab_switch_count: 3,
        status: 'completed',
      });
    }
  }

  // --- USER OPERATIONS ---
  public async getOrCreateStudent(firstName: string, lastName: string, phone: string, telegramId?: string): Promise<User> {
    const formattedPhone = phone.trim().startsWith('+') ? phone.trim() : `+${phone.trim()}`;
    let existing = Array.from(this.users.values()).find((u) => u.phone === formattedPhone);

    if (existing) {
      if (telegramId && !existing.telegram_id) {
        existing.telegram_id = telegramId;
      }
      return existing;
    }

    const newUser: User = {
      id: crypto.randomUUID(),
      first_name: firstName.trim(),
      last_name: lastName.trim(),
      phone: formattedPhone,
      telegram_id: telegramId,
      role: 'student',
      created_at: new Date().toISOString(),
    };

    this.users.set(newUser.id, newUser);

    // Auto-assign new student to active groups by default so they see open tests
    const activeGroups = Array.from(this.groups.values()).filter((g) => g.is_active);
    if (activeGroups.length > 0) {
      const gId = activeGroups[0].id;
      const gmId = crypto.randomUUID();
      this.groupMembers.set(gmId, {
        id: gmId,
        group_id: gId,
        user_id: newUser.id,
        created_at: new Date().toISOString(),
      });
    }

    return newUser;
  }

  public getUserById(id: string): User | undefined {
    return this.users.get(id);
  }

  public getUserByPhone(phone: string): User | undefined {
    const formatted = phone.trim().startsWith('+') ? phone.trim() : `+${phone.trim()}`;
    return Array.from(this.users.values()).find((u) => u.phone === formatted);
  }

  public getAllStudents(): User[] {
    return Array.from(this.users.values()).filter((u) => u.role === 'student');
  }

  // --- GROUP OPERATIONS ---
  public getGroups(): (Group & { member_count: number })[] {
    return Array.from(this.groups.values()).map((g) => {
      const memberCount = Array.from(this.groupMembers.values()).filter((gm) => gm.group_id === g.id).length;
      return { ...g, member_count: memberCount };
    });
  }

  public createGroup(name: string, description: string): Group {
    const group: Group = {
      id: crypto.randomUUID(),
      name: name.trim(),
      description: description.trim(),
      created_at: new Date().toISOString(),
      is_active: true,
    };
    this.groups.set(group.id, group);
    return group;
  }

  public updateGroup(id: string, data: { name?: string; description?: string; is_active?: boolean }): Group {
    const group = this.groups.get(id);
    if (!group) throw new Error('Guruh topilmadi.');
    if (data.name !== undefined) group.name = data.name.trim();
    if (data.description !== undefined) group.description = data.description.trim();
    if (data.is_active !== undefined) group.is_active = data.is_active;
    return group;
  }

  public deleteGroup(id: string): boolean {
    return this.groups.delete(id);
  }

  public getGroupStudents(groupId: string): User[] {
    const userIds = Array.from(this.groupMembers.values())
      .filter((gm) => gm.group_id === groupId)
      .map((gm) => gm.user_id);
    return userIds.map((uid) => this.users.get(uid)).filter(Boolean) as User[];
  }

  public addStudentToGroup(groupId: string, userId: string) {
    const exists = Array.from(this.groupMembers.values()).some((gm) => gm.group_id === groupId && gm.user_id === userId);
    if (!exists) {
      const id = crypto.randomUUID();
      this.groupMembers.set(id, { id, group_id: groupId, user_id: userId, created_at: new Date().toISOString() });
    }
  }

  public removeStudentFromGroup(groupId: string, userId: string) {
    for (const [key, gm] of this.groupMembers.entries()) {
      if (gm.group_id === groupId && gm.user_id === userId) {
        this.groupMembers.delete(key);
        break;
      }
    }
  }

  public getUserGroups(userId: string): Group[] {
    const groupIds = Array.from(this.groupMembers.values())
      .filter((gm) => gm.user_id === userId)
      .map((gm) => gm.group_id);
    return groupIds.map((gid) => this.groups.get(gid)).filter(Boolean) as Group[];
  }

  // --- TEST OPERATIONS ---
  public getTests(userId?: string, isTeacher: boolean = false): (Test & { attempts_count?: number; max_score?: number })[] {
    const now = Date.now();
    let all = Array.from(this.tests.values());

    if (!isTeacher) {
      if (!userId) return [];
      const userGroupIds = Array.from(this.groupMembers.values())
        .filter((gm) => gm.user_id === userId)
        .map((gm) => gm.group_id);

      // Student only sees active tests assigned to their groups
      all = all.filter((t) => {
        if (t.status !== 'active') return false;
        if (t.open_at && new Date(t.open_at).getTime() > now) return false;
        if (t.close_at && new Date(t.close_at).getTime() < now) return false;

        const assignedGroups = Array.from(this.testGroups.values())
          .filter((tg) => tg.test_id === t.id)
          .map((tg) => tg.group_id);

        return assignedGroups.some((gid) => userGroupIds.includes(gid));
      });
    }

    return all.map((t) => {
      const qList = Array.from(this.questions.values()).filter((q) => q.test_id === t.id);
      const maxScore = qList.reduce((acc, q) => acc + (q.points || 1), 0);
      const groupIds = Array.from(this.testGroups.values())
        .filter((tg) => tg.test_id === t.id)
        .map((tg) => tg.group_id);

      let attemptsCount = 0;
      if (userId) {
        attemptsCount = Array.from(this.attempts.values()).filter(
          (a) => a.test_id === t.id && a.user_id === userId && a.status === 'completed'
        ).length;
      }

      return {
        ...t,
        question_count: qList.length,
        max_score: maxScore,
        group_ids: groupIds,
        attempts_count: attemptsCount,
      };
    });
  }

  public getTestById(id: string): Test | undefined {
    return this.tests.get(id);
  }

  public createTest(
    testData: Omit<Test, 'id' | 'created_at'>,
    questionsData: {
      question_text: string;
      type: 'single_choice' | 'true_false';
      points: number;
      explanation?: string;
      answers: { answer_text: string; is_correct: boolean }[];
    }[],
    groupIds: string[]
  ): Test {
    const testId = crypto.randomUUID();
    const newTest: Test = {
      ...testData,
      id: testId,
      created_at: new Date().toISOString(),
    };
    this.tests.set(testId, newTest);

    // Assign groups
    groupIds.forEach((gId) => {
      const tgId = crypto.randomUUID();
      this.testGroups.set(tgId, { id: tgId, test_id: testId, group_id: gId });
    });

    // Create questions and answers
    questionsData.forEach((qData, qIdx) => {
      const qId = crypto.randomUUID();
      this.questions.set(qId, {
        id: qId,
        test_id: testId,
        type: qData.type,
        question_text: qData.question_text,
        explanation: qData.explanation,
        points: qData.points || 1,
        order_index: qIdx + 1,
      });

      qData.answers.forEach((ans, aIdx) => {
        const aId = crypto.randomUUID();
        this.answers.set(aId, {
          id: aId,
          question_id: qId,
          answer_text: ans.answer_text,
          is_correct: ans.is_correct,
          order_index: aIdx + 1,
        });
      });
    });

    return newTest;
  }

  public updateTest(
    id: string,
    updates: Partial<Test>,
    groupIds?: string[]
  ): Test {
    const test = this.tests.get(id);
    if (!test) throw new Error('Test topilmadi.');

    Object.assign(test, updates);

    if (groupIds) {
      // Remove old group mappings
      for (const [key, tg] of this.testGroups.entries()) {
        if (tg.test_id === id) {
          this.testGroups.delete(key);
        }
      }
      // Add new group mappings
      groupIds.forEach((gId) => {
        const tgId = crypto.randomUUID();
        this.testGroups.set(tgId, { id: tgId, test_id: id, group_id: gId });
      });
    }

    return test;
  }

  public deleteTest(id: string): boolean {
    return this.tests.delete(id);
  }

  // --- QUESTIONS & ANSWERS (SCRUBBED FOR CLIENT) ---
  public getQuestionsForAttempt(
    testId: string,
    isCompletedReview: boolean = false
  ): ClientQuestion[] {
    const test = this.tests.get(testId);
    if (!test) throw new Error('Test topilmadi.');

    let questions = Array.from(this.questions.values()).filter((q) => q.test_id === testId);

    // Shuffle questions if configured and active test taking
    if (test.shuffle_questions && !isCompletedReview) {
      questions = [...questions].sort(() => Math.random() - 0.5);
    } else {
      questions.sort((a, b) => a.order_index - b.order_index);
    }

    const showAnswers = isCompletedReview && test.show_correct_answers;

    return questions.map((q) => {
      let ansList = Array.from(this.answers.values()).filter((a) => a.question_id === q.id);
      if (test.shuffle_answers && !isCompletedReview) {
        ansList = [...ansList].sort(() => Math.random() - 0.5);
      } else {
        ansList.sort((a, b) => a.order_index - b.order_index);
      }

      return {
        id: q.id,
        test_id: q.test_id,
        type: q.type,
        question_text: q.question_text,
        points: q.points,
        order_index: q.order_index,
        explanation: showAnswers ? q.explanation : undefined,
        answers: ansList.map((a) => ({
          id: a.id,
          answer_text: a.answer_text,
          order_index: a.order_index,
          is_correct: showAnswers ? a.is_correct : undefined, // STRICT SECURITY: scrubbed during test taking!
        })),
      };
    });
  }

  // --- ATTEMPT WORKFLOW & REAL-TIME SYNC ---
  public startAttempt(testId: string, userId: string): { attempt: Attempt; questions: ClientQuestion[]; remainingSeconds: number } {
    const test = this.tests.get(testId);
    if (!test) throw new Error('Test topilmadi.');

    if (test.status !== 'active') {
      throw new Error('Ushbu test ayni paytda ochiq emas.');
    }

    const now = Date.now();
    if (test.open_at && new Date(test.open_at).getTime() > now) {
      throw new Error('Test hali boshlanmagan.');
    }
    if (test.close_at && new Date(test.close_at).getTime() < now) {
      throw new Error('Test yopilgan.');
    }

    // Check existing in-progress attempt (resume capability!)
    const activeAttempt = Array.from(this.attempts.values()).find(
      (a) => a.test_id === testId && a.user_id === userId && a.status === 'in_progress'
    );

    if (activeAttempt) {
      const elapsedSeconds = Math.floor((now - new Date(activeAttempt.started_at).getTime()) / 1000);
      const totalAllowedSeconds = test.time_limit * 60;
      const remaining = Math.max(0, totalAllowedSeconds - elapsedSeconds);

      // If time has expired on server, auto-complete
      if (remaining <= 0) {
        this.completeAttempt(activeAttempt.id, userId);
        throw new Error('Test vaqti tugagan.');
      }

      return {
        attempt: activeAttempt,
        questions: this.getQuestionsForAttempt(testId, false),
        remainingSeconds: remaining,
      };
    }

    // Check attempts limit
    const completedAttempts = Array.from(this.attempts.values()).filter(
      (a) => a.test_id === testId && a.user_id === userId && a.status === 'completed'
    );
    if (completedAttempts.length >= test.attempts_limit) {
      throw new Error(`Sizda ushbu test uchun urinishlar qolmadi (Maksimal: ${test.attempts_limit} ta).`);
    }

    // Create fresh attempt
    const qList = Array.from(this.questions.values()).filter((q) => q.test_id === testId);
    const maxScore = qList.reduce((acc, q) => acc + q.points, 0);

    const attempt: Attempt = {
      id: crypto.randomUUID(),
      test_id: testId,
      user_id: userId,
      started_at: new Date().toISOString(),
      score: 0,
      max_score: maxScore,
      percentage: 0,
      passed: false,
      time_spent: 0,
      tab_switch_count: 0,
      status: 'in_progress',
    };

    this.attempts.set(attempt.id, attempt);

    return {
      attempt,
      questions: this.getQuestionsForAttempt(testId, false),
      remainingSeconds: test.time_limit * 60,
    };
  }

  public getActiveAttemptForUser(userId: string): { attempt: Attempt; test: Test; remainingSeconds: number } | null {
    const activeAttempt = Array.from(this.attempts.values()).find(
      (a) => a.user_id === userId && a.status === 'in_progress'
    );
    if (!activeAttempt) return null;

    const test = this.tests.get(activeAttempt.test_id);
    if (!test) return null;

    const elapsedSeconds = Math.floor((Date.now() - new Date(activeAttempt.started_at).getTime()) / 1000);
    const totalAllowedSeconds = test.time_limit * 60;
    const remaining = Math.max(0, totalAllowedSeconds - elapsedSeconds);

    if (remaining <= 0) {
      this.completeAttempt(activeAttempt.id, userId);
      return null;
    }

    return { attempt: activeAttempt, test, remainingSeconds: remaining };
  }

  public saveAnswer(attemptId: string, questionId: string, selectedAnswerId: string): void {
    const attempt = this.attempts.get(attemptId);
    if (!attempt || attempt.status !== 'in_progress') {
      throw new Error('Aktiv test urinishi topilmadi.');
    }

    // Find existing answer record
    const existing = Array.from(this.attemptAnswers.values()).find(
      (aa) => aa.attempt_id === attemptId && aa.question_id === questionId
    );

    if (existing) {
      existing.selected_answer_id = selectedAnswerId;
      existing.answered_at = new Date().toISOString();
    } else {
      const aaId = crypto.randomUUID();
      this.attemptAnswers.set(aaId, {
        id: aaId,
        attempt_id: attemptId,
        question_id: questionId,
        selected_answer_id: selectedAnswerId,
        is_correct: false,
        points_awarded: 0,
        answered_at: new Date().toISOString(),
      });
    }
  }

  public getAttemptAnswers(attemptId: string): { question_id: string; selected_answer_id?: string }[] {
    return Array.from(this.attemptAnswers.values())
      .filter((aa) => aa.attempt_id === attemptId)
      .map((aa) => ({ question_id: aa.question_id, selected_answer_id: aa.selected_answer_id }));
  }

  public recordTabEvent(attemptId: string, eventType: 'tab_switch' | 'window_blur' | 'fullscreen_exit'): number {
    const attempt = this.attempts.get(attemptId);
    if (!attempt || attempt.status !== 'in_progress') return 0;

    attempt.tab_switch_count = (attempt.tab_switch_count || 0) + 1;

    const eventId = crypto.randomUUID();
    this.tabEvents.set(eventId, {
      id: eventId,
      attempt_id: attemptId,
      event_type: eventType,
      occurred_at: new Date().toISOString(),
    });

    return attempt.tab_switch_count;
  }

  // --- SERVER-SIDE FINAL SCORING CALCULATION ---
  public completeAttempt(attemptId: string, userId: string): Attempt & { explanations?: Record<string, string>; correct_answers?: Record<string, string> } {
    const attempt = this.attempts.get(attemptId);
    if (!attempt) throw new Error('Urinish topilmadi.');
    if (attempt.user_id !== userId) throw new Error('Ruxsat berilmagan harakat.');

    if (attempt.status === 'completed') {
      return attempt;
    }

    const test = this.tests.get(attempt.test_id);
    if (!test) throw new Error('Test topilmadi.');

    const now = Date.now();
    const startedTime = new Date(attempt.started_at).getTime();
    const actualSecondsSpent = Math.max(1, Math.floor((now - startedTime) / 1000));
    attempt.time_spent = Math.min(actualSecondsSpent, test.time_limit * 60);
    attempt.submitted_at = new Date().toISOString();
    attempt.status = 'completed';

    // Calculate score accurately server-side
    const questions = Array.from(this.questions.values()).filter((q) => q.test_id === test.id);
    let totalScore = 0;
    let maxScore = 0;

    const explanations: Record<string, string> = {};
    const correctAnswers: Record<string, string> = {};

    questions.forEach((q) => {
      maxScore += q.points;

      const qAnswers = Array.from(this.answers.values()).filter((a) => a.question_id === q.id);
      const correctAnswer = qAnswers.find((a) => a.is_correct);

      if (correctAnswer && test.show_correct_answers) {
        correctAnswers[q.id] = correctAnswer.id;
        if (q.explanation) explanations[q.id] = q.explanation;
      }

      // Check student's answer
      const studentAns = Array.from(this.attemptAnswers.values()).find(
        (aa) => aa.attempt_id === attempt.id && aa.question_id === q.id
      );

      if (studentAns && studentAns.selected_answer_id) {
        const isRight = correctAnswer && studentAns.selected_answer_id === correctAnswer.id;
        studentAns.is_correct = !!isRight;
        studentAns.points_awarded = isRight ? q.points : 0;
        totalScore += studentAns.points_awarded;
      }
    });

    attempt.score = totalScore;
    attempt.max_score = maxScore;
    const percentage = maxScore > 0 ? (totalScore / maxScore) * 100 : 0;
    attempt.percentage = Math.round(percentage * 100) / 100;
    attempt.passed = attempt.percentage >= test.passing_percentage;

    // Send Telegram Notification to Teacher
    const student = this.users.get(userId);
    const studentName = student ? `${student.first_name} ${student.last_name}` : 'Noma’lum o‘quvchi';

    telegramService.notifyTestResult({
      studentName,
      testTitle: test.title,
      score: attempt.score,
      maxScore: attempt.max_score,
      percentage: attempt.percentage,
      passed: attempt.passed,
      timeSpentSeconds: attempt.time_spent,
      tabSwitchCount: attempt.tab_switch_count,
    });

    return {
      ...attempt,
      explanations: test.show_correct_answers ? explanations : undefined,
      correct_answers: test.show_correct_answers ? correctAnswers : undefined,
    };
  }

  // --- TEACHER ACTIONS: DELETE ATTEMPT & AUDIT LOG ---
  public deleteAttempt(attemptId: string, teacherUserId: string, reason?: string): boolean {
    const attempt = this.attempts.get(attemptId);
    if (!attempt) throw new Error('Urinish topilmadi.');

    // Save audit log
    const auditId = crypto.randomUUID();
    this.auditLogs.set(auditId, {
      id: auditId,
      user_id: teacherUserId,
      action: 'DELETE_ATTEMPT',
      entity_type: 'attempt',
      entity_id: attemptId,
      details: {
        test_id: attempt.test_id,
        user_id: attempt.user_id,
        score: attempt.score,
        percentage: attempt.percentage,
        reason: reason || 'O‘qituvchi tomonidan qayta topshirish uchun o‘chirildi',
      },
      created_at: new Date().toISOString(),
    });

    // Remove attempt answers
    for (const [key, aa] of this.attemptAnswers.entries()) {
      if (aa.attempt_id === attemptId) {
        this.attemptAnswers.delete(key);
      }
    }

    // Delete attempt
    this.attempts.delete(attemptId);
    return true;
  }

  // --- ANALYTICS, EXCEL & SUBMISSIONS ---
  public getSubmissions(filters?: {
    groupId?: string;
    testId?: string;
    studentName?: string;
    status?: string;
  }): SubmissionRow[] {
    const completedAttempts = Array.from(this.attempts.values()).filter(
      (a) => a.status === 'completed'
    );

    const rows: SubmissionRow[] = [];

    completedAttempts.forEach((att) => {
      const student = this.users.get(att.user_id);
      const test = this.tests.get(att.test_id);

      // Find student group
      const gm = Array.from(this.groupMembers.values()).find((m) => m.user_id === att.user_id);
      const group = gm ? this.groups.get(gm.group_id) : undefined;

      const studentName = student ? `${student.first_name} ${student.last_name}` : 'O‘quvchi';

      // Apply filters
      if (filters?.groupId && (!group || group.id !== filters.groupId)) return;
      if (filters?.testId && (!test || test.id !== filters.testId)) return;
      if (filters?.status) {
        if (filters.status === 'passed' && !att.passed) return;
        if (filters.status === 'failed' && att.passed) return;
      }
      if (filters?.studentName) {
        const query = filters.studentName.toLowerCase();
        if (!studentName.toLowerCase().includes(query) && !(student?.phone || '').includes(query)) {
          return;
        }
      }

      rows.push({
        attempt_id: att.id,
        user_id: att.user_id,
        student_name: studentName,
        phone: student?.phone || '',
        group_id: group?.id || '',
        group_name: group?.name || 'Guruhsiz',
        test_id: att.test_id,
        test_title: test?.title || 'Test',
        started_at: att.started_at,
        submitted_at: att.submitted_at || att.started_at,
        score: att.score,
        max_score: att.max_score,
        percentage: att.percentage,
        passed: att.passed,
        time_spent: att.time_spent,
        tab_switch_count: att.tab_switch_count,
        status: att.status,
      });
    });

    return rows.sort((a, b) => new Date(b.submitted_at).getTime() - new Date(a.submitted_at).getTime());
  }

  public getUnsubmittedStudents(testId: string): { user: User; group: Group }[] {
    const test = this.tests.get(testId);
    if (!test) return [];

    // Find groups assigned to this test
    const groupIds = Array.from(this.testGroups.values())
      .filter((tg) => tg.test_id === testId)
      .map((tg) => tg.group_id);

    // Find all students in these groups
    const studentMemberships = Array.from(this.groupMembers.values()).filter((gm) =>
      groupIds.includes(gm.group_id)
    );

    // Completed student IDs for this test
    const completedUserIds = new Set(
      Array.from(this.attempts.values())
        .filter((a) => a.test_id === testId && a.status === 'completed')
        .map((a) => a.user_id)
    );

    const unsubmitted: { user: User; group: Group }[] = [];

    studentMemberships.forEach((sm) => {
      if (!completedUserIds.has(sm.user_id)) {
        const user = this.users.get(sm.user_id);
        const group = this.groups.get(sm.group_id);
        if (user && group && !unsubmitted.some((item) => item.user.id === user.id)) {
          unsubmitted.push({ user, group });
        }
      }
    });

    return unsubmitted;
  }

  public getQuestionStatistics(testId: string): QuestionStat[] {
    const questions = Array.from(this.questions.values())
      .filter((q) => q.test_id === testId)
      .sort((a, b) => a.order_index - b.order_index);

    const testAttemptIds = new Set(
      Array.from(this.attempts.values())
        .filter((a) => a.test_id === testId && a.status === 'completed')
        .map((a) => a.id)
    );

    return questions.map((q) => {
      const answersForQuestion = Array.from(this.attemptAnswers.values()).filter(
        (aa) => aa.question_id === q.id && testAttemptIds.has(aa.attempt_id)
      );

      const totalAnswers = answersForQuestion.length;
      const correctCount = answersForQuestion.filter((aa) => aa.is_correct).length;
      const incorrectCount = totalAnswers - correctCount;
      const correctPct = totalAnswers > 0 ? Math.round((correctCount / totalAnswers) * 100) : 0;

      return {
        question_id: q.id,
        order_index: q.order_index,
        question_text: q.question_text,
        points: q.points,
        total_answers: totalAnswers,
        correct_count: correctCount,
        incorrect_count: incorrectCount,
        correct_percentage: correctPct,
      };
    });
  }

  public getStudentProfile(userId: string) {
    const user = this.users.get(userId);
    if (!user) throw new Error('Foydalanuvchi topilmadi.');

    const groups = this.getUserGroups(userId);
    const completedAttempts = Array.from(this.attempts.values())
      .filter((a) => a.user_id === userId && a.status === 'completed')
      .sort((a, b) => new Date(a.submitted_at || a.started_at).getTime() - new Date(b.submitted_at || b.started_at).getTime());

    const history = completedAttempts.map((att) => {
      const test = this.tests.get(att.test_id);
      return {
        attempt_id: att.id,
        test_id: att.test_id,
        test_title: test?.title || 'Test',
        score: att.score,
        max_score: att.max_score,
        percentage: att.percentage,
        passed: att.passed,
        time_spent: att.time_spent,
        tab_switch_count: att.tab_switch_count,
        submitted_at: att.submitted_at || att.started_at,
      };
    });

    const totalTests = history.length;
    const passedTests = history.filter((h) => h.passed).length;
    const avgScore = totalTests > 0 ? Math.round(history.reduce((a, b) => a + b.percentage, 0) / totalTests) : 0;

    return {
      user,
      groups,
      stats: {
        total_tests: totalTests,
        passed_tests: passedTests,
        failed_tests: totalTests - passedTests,
        avg_percentage: avgScore,
      },
      history,
    };
  }

  public getDashboardOverview() {
    const totalStudents = Array.from(this.users.values()).filter((u) => u.role === 'student').length;
    const totalGroups = Array.from(this.groups.values()).filter((g) => g.is_active).length;
    const totalTests = this.tests.size;

    const completed = Array.from(this.attempts.values()).filter((a) => a.status === 'completed');
    const totalSubmissions = completed.length;
    const passedCount = completed.filter((c) => c.passed).length;
    const failedCount = totalSubmissions - passedCount;

    return {
      total_students: totalStudents,
      total_groups: totalGroups,
      total_tests: totalTests,
      total_submissions: totalSubmissions,
      passed_count: passedCount,
      failed_count: failedCount,
      pass_rate: totalSubmissions > 0 ? Math.round((passedCount / totalSubmissions) * 100) : 0,
    };
  }
}

export const db = new DatabaseService();
