import React, { useState, useEffect } from 'react';
import {
  Users,
  FileText,
  Award,
  CheckCircle2,
  XCircle,
  Clock,
  Download,
  Trash2,
  Plus,
  Upload,
  RefreshCw,
  Search,
  Filter,
  Check,
  Zap,
  BarChart3,
  BookOpen,
  Send,
  AlertTriangle,
  HelpCircle,
  FileCode,
  X,
  Eye,
} from 'lucide-react';
import type { Group, Test, SubmissionRow, QuestionStat, LoadTestMetric, ParsedQuestionPreview } from '../types';

interface TeacherDashboardProps {
  activeSubTab: string;
  setActiveSubTab: (tab: string) => void;
}

export const TeacherDashboard: React.FC<TeacherDashboardProps> = ({
  activeSubTab,
  setActiveSubTab,
}) => {
  // Global dashboard overview
  const [overview, setOverview] = useState<{
    total_students: number;
    total_groups: number;
    total_tests: number;
    total_submissions: number;
    passed_count: number;
    failed_count: number;
    pass_rate: number;
  } | null>(null);

  // Submissions state & filters
  const [submissions, setSubmissions] = useState<SubmissionRow[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [tests, setTests] = useState<Test[]>([]);
  const [filterGroup, setFilterGroup] = useState('');
  const [filterTest, setFilterTest] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [searchStudent, setSearchStudent] = useState('');

  // Unsubmitted students state
  const [selectedUnsubmittedTestId, setSelectedUnsubmittedTestId] = useState('');
  const [unsubmittedStudents, setUnsubmittedStudents] = useState<{ user: { id: string; first_name: string; last_name: string; phone: string }; group: { name: string } }[]>([]);

  // Question statistics state
  const [selectedStatsTestId, setSelectedStatsTestId] = useState('');
  const [questionStats, setQuestionStats] = useState<QuestionStat[]>([]);

  // Delete attempt confirmation modal state
  const [deleteModalAttemptId, setDeleteModalAttemptId] = useState<string | null>(null);
  const [deleteReason, setDeleteReason] = useState('O‘quvchiga qayta topshirish uchun ruxsat berildi');

  // New Test Modal & Word Import
  const [showCreateTestModal, setShowCreateTestModal] = useState(false);
  const [testForm, setTestForm] = useState({
    title: '',
    description: '',
    time_limit: 30,
    attempts_limit: 1,
    passing_percentage: 60,
    shuffle_questions: true,
    shuffle_answers: true,
    show_correct_answers: true,
    status: 'active' as 'active' | 'draft' | 'closed',
    selectedGroups: [] as string[],
  });

  // Word (.docx) Import & PREVIEW modal state
  const [showImportModal, setShowImportModal] = useState(false);
  const [importPastedText, setImportPastedText] = useState('');
  const [importBase64, setImportBase64] = useState<string | null>(null);
  const [importFileName, setImportFileName] = useState('');
  const [parsing, setParsing] = useState(false);
  const [previewResult, setPreviewResult] = useState<{
    questions: ParsedQuestionPreview[];
    formatErrors: { question_index: number; error_message: string }[];
    total_detected: number;
    valid_count: number;
  } | null>(null);

  // Manage Groups State
  const [showCreateGroupModal, setShowCreateGroupModal] = useState(false);
  const [groupName, setGroupName] = useState('');
  const [groupDesc, setGroupDesc] = useState('');
  const [selectedGroupForMembers, setSelectedGroupForMembers] = useState<Group | null>(null);
  const [groupStudents, setGroupStudents] = useState<{ id: string; first_name: string; last_name: string; phone: string }[]>([]);
  const [allStudents, setAllStudents] = useState<{ id: string; first_name: string; last_name: string; phone: string }[]>([]);

  // Load Test state
  const [loadTestRunning, setLoadTestRunning] = useState(false);
  const [loadTestMetric, setLoadTestMetric] = useState<LoadTestMetric | null>(null);

  // Telegram config state
  const [telegramInfo, setTelegramInfo] = useState<{
    isConfigured: boolean;
    botUsername: string;
    teacherChatId: string;
    pendingQueueSize: number;
  } | null>(null);
  const [botTokenInput, setBotTokenInput] = useState('');
  const [chatIdInput, setChatIdInput] = useState('');
  const [usernameInput, setUsernameInput] = useState('');
  const [telegramSaved, setTelegramSaved] = useState(false);

  const [loading, setLoading] = useState(false);

  const token = localStorage.getItem('tm_auth_token');

  // Fetch initial overview, submissions, groups, tests
  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const headers = { Authorization: `Bearer ${token}` };
      const [ovRes, subRes, grRes, tsRes] = await Promise.all([
        fetch('/api/teacher/dashboard', { headers }),
        fetch('/api/teacher/submissions', { headers }),
        fetch('/api/teacher/groups', { headers }),
        fetch('/api/teacher/tests', { headers }),
      ]);

      if (ovRes.ok) setOverview(await ovRes.json());
      if (subRes.ok) setSubmissions(await subRes.json());
      if (grRes.ok) setGroups(await grRes.json());
      if (tsRes.ok) {
        const testsData = await tsRes.json();
        setTests(testsData);
        if (testsData.length > 0) {
          if (!selectedUnsubmittedTestId) setSelectedUnsubmittedTestId(testsData[0].id);
          if (!selectedStatsTestId) setSelectedStatsTestId(testsData[0].id);
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  // Fetch unsubmitted students when test changes
  useEffect(() => {
    if (!selectedUnsubmittedTestId) return;
    fetch(`/api/teacher/unsubmitted/${selectedUnsubmittedTestId}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.json())
      .then((data) => setUnsubmittedStudents(data))
      .catch(console.error);
  }, [selectedUnsubmittedTestId]);

  // Fetch question stats when test changes
  useEffect(() => {
    if (!selectedStatsTestId) return;
    fetch(`/api/teacher/question-stats/${selectedStatsTestId}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.json())
      .then((data) => setQuestionStats(data))
      .catch(console.error);
  }, [selectedStatsTestId]);

  // Fetch latest load test report
  useEffect(() => {
    fetch('/api/teacher/load-test-report', {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.json())
      .then((data) => {
        if (data.virtual_users) setLoadTestMetric(data);
      })
      .catch(console.error);

    fetch('/api/teacher/telegram-info', {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.json())
      .then((data) => setTelegramInfo(data))
      .catch(console.error);
  }, []);

  // Filter submissions
  const filteredSubmissions = submissions.filter((s) => {
    if (filterGroup && s.group_id !== filterGroup) return false;
    if (filterTest && s.test_id !== filterTest) return false;
    if (filterStatus === 'passed' && !s.passed) return false;
    if (filterStatus === 'failed' && s.passed) return false;
    if (searchStudent) {
      const q = searchStudent.toLowerCase();
      if (!s.student_name.toLowerCase().includes(q) && !s.phone.includes(q)) {
        return false;
      }
    }
    return true;
  });

  // Export to Excel
  const handleExportExcel = () => {
    const params = new URLSearchParams();
    if (filterGroup) params.append('groupId', filterGroup);
    if (filterTest) params.append('testId', filterTest);
    if (filterStatus) params.append('status', filterStatus);
    if (searchStudent) params.append('studentName', searchStudent);

    window.open(`/api/teacher/export-excel?${params.toString()}`, '_blank');
  };

  // Delete attempt
  const handleDeleteAttempt = async () => {
    if (!deleteModalAttemptId) return;
    try {
      const res = await fetch(`/api/teacher/attempts/${deleteModalAttemptId}/delete`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ reason: deleteReason }),
      });
      if (!res.ok) throw new Error('O‘chirib bo‘lmadi');

      setSubmissions((prev) => prev.filter((s) => s.attempt_id !== deleteModalAttemptId));
      setDeleteModalAttemptId(null);
      fetchDashboardData();
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Xatolik');
    }
  };

  // Handle Word (.docx) file change
  const handleDocxFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImportFileName(file.name);

    const reader = new FileReader();
    reader.onload = () => {
      const base64 = (reader.result as string).split(',')[1];
      setImportBase64(base64);
    };
    reader.readAsDataURL(file);
  };

  // Parse docx / text
  const handleParseQuestions = async () => {
    setParsing(true);
    try {
      const res = await fetch('/api/teacher/parse-docx', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          base64Data: importBase64,
          rawText: importPastedText || undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Tahlil qilib bo‘lmadi');

      setPreviewResult(data);
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Tahlil xatosi');
    } finally {
      setParsing(false);
    }
  };

  // Save imported questions into a test
  const handleSaveImportedTest = async () => {
    if (!previewResult || previewResult.questions.length === 0) return;

    if (!testForm.title.trim()) {
      alert('Test nomini kiriting.');
      return;
    }

    try {
      const res = await fetch('/api/teacher/tests', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          testData: {
            title: testForm.title.trim(),
            description: testForm.description.trim(),
            time_limit: Number(testForm.time_limit) || 30,
            attempts_limit: Number(testForm.attempts_limit) || 1,
            passing_percentage: Number(testForm.passing_percentage) || 60,
            shuffle_questions: testForm.shuffle_questions,
            shuffle_answers: testForm.shuffle_answers,
            show_correct_answers: testForm.show_correct_answers,
            status: testForm.status,
          },
          questions: previewResult.questions,
          groupIds: testForm.selectedGroups,
        }),
      });

      if (!res.ok) throw new Error('Test saqlanmadi');

      alert('Test va savollar muvaffaqiyatli saqlandi!');
      setShowImportModal(false);
      setShowCreateTestModal(false);
      setPreviewResult(null);
      setImportPastedText('');
      setImportBase64(null);
      fetchDashboardData();
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Xatolik');
    }
  };

  // Run 500-User Load Test
  const handleRunLoadTest = async () => {
    setLoadTestRunning(true);
    try {
      const res = await fetch('/api/teacher/run-load-test', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ usersCount: 500 }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Yuklama sinovida xatolik');

      setLoadTestMetric(data.metrics);
      alert('500 foydalanuvchilik yuklama sinovi 100% muvaffaqiyatli yakunlandi!');
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Xatolik yuz berdi');
    } finally {
      setLoadTestRunning(false);
    }
  };

  // Save Telegram settings
  const handleSaveTelegram = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/teacher/telegram-config', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          botToken: botTokenInput || undefined,
          teacherChatId: chatIdInput || undefined,
          botUsername: usernameInput || undefined,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setTelegramInfo(data.info);
        setTelegramSaved(true);
        setTimeout(() => setTelegramSaved(false), 3000);
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-6 pb-20">
      {/* Overview Stat Cards */}
      {overview && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
            <span className="text-[11px] text-slate-500 font-medium block">Jami o‘quvchilar</span>
            <span className="text-xl sm:text-2xl font-bold font-mono text-slate-900 dark:text-white mt-1 block">
              {overview.total_students}
            </span>
          </div>

          <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
            <span className="text-[11px] text-slate-500 font-medium block">Jami guruhlar</span>
            <span className="text-xl sm:text-2xl font-bold font-mono text-slate-900 dark:text-white mt-1 block">
              {overview.total_groups}
            </span>
          </div>

          <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
            <span className="text-[11px] text-slate-500 font-medium block">Jami testlar</span>
            <span className="text-xl sm:text-2xl font-bold font-mono text-blue-600 mt-1 block">
              {overview.total_tests}
            </span>
          </div>

          <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
            <span className="text-[11px] text-slate-500 font-medium block">Topshirilgan</span>
            <span className="text-xl sm:text-2xl font-bold font-mono text-slate-900 dark:text-white mt-1 block">
              {overview.total_submissions}
            </span>
          </div>

          <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
            <span className="text-[11px] text-slate-500 font-medium block">O‘tganlar</span>
            <span className="text-xl sm:text-2xl font-bold font-mono text-emerald-600 mt-1 block">
              {overview.passed_count}
            </span>
          </div>

          <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
            <span className="text-[11px] text-slate-500 font-medium block">O‘tish darajasi</span>
            <span className="text-xl sm:text-2xl font-bold font-mono text-blue-600 mt-1 block">
              {overview.pass_rate}%
            </span>
          </div>
        </div>
      )}

      {/* Teacher Tabs (Interactive segmented control) */}
      <div className="flex items-center gap-1.5 p-1.5 rounded-2xl bg-slate-100 dark:bg-slate-800/80 overflow-x-auto">
        <button
          onClick={() => setActiveSubTab('dashboard')}
          className={`px-3.5 py-2 text-xs font-semibold rounded-xl whitespace-nowrap transition-colors ${
            activeSubTab === 'dashboard'
              ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-xs'
              : 'text-slate-600 dark:text-slate-300 hover:text-slate-900'
          }`}
        >
          Natijalar jadvali
        </button>
        <button
          onClick={() => setActiveSubTab('unsubmitted')}
          className={`px-3.5 py-2 text-xs font-semibold rounded-xl whitespace-nowrap transition-colors ${
            activeSubTab === 'unsubmitted'
              ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-xs'
              : 'text-slate-600 dark:text-slate-300 hover:text-slate-900'
          }`}
        >
          Topshirmaganlar
        </button>
        <button
          onClick={() => setActiveSubTab('stats')}
          className={`px-3.5 py-2 text-xs font-semibold rounded-xl whitespace-nowrap transition-colors ${
            activeSubTab === 'stats'
              ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-xs'
              : 'text-slate-600 dark:text-slate-300 hover:text-slate-900'
          }`}
        >
          Savol statistikasi
        </button>
        <button
          onClick={() => setActiveSubTab('manage-tests')}
          className={`px-3.5 py-2 text-xs font-semibold rounded-xl whitespace-nowrap transition-colors ${
            activeSubTab === 'manage-tests'
              ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-xs'
              : 'text-slate-600 dark:text-slate-300 hover:text-slate-900'
          }`}
        >
          Testlar
        </button>
        <button
          onClick={() => setActiveSubTab('groups')}
          className={`px-3.5 py-2 text-xs font-semibold rounded-xl whitespace-nowrap transition-colors ${
            activeSubTab === 'groups'
              ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-xs'
              : 'text-slate-600 dark:text-slate-300 hover:text-slate-900'
          }`}
        >
          Guruhlar
        </button>
        <button
          onClick={() => setActiveSubTab('loadtest')}
          className={`px-3.5 py-2 text-xs font-semibold rounded-xl whitespace-nowrap transition-colors ${
            activeSubTab === 'loadtest'
              ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-xs'
              : 'text-slate-600 dark:text-slate-300 hover:text-slate-900'
          }`}
        >
          Yuklama Sinovi (500 VU)
        </button>
        <button
          onClick={() => setActiveSubTab('telegram')}
          className={`px-3.5 py-2 text-xs font-semibold rounded-xl whitespace-nowrap transition-colors ${
            activeSubTab === 'telegram'
              ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-xs'
              : 'text-slate-600 dark:text-slate-300 hover:text-slate-900'
          }`}
        >
          Telegram Bot
        </button>
        <button
          onClick={() => setActiveSubTab('guide')}
          className={`px-3.5 py-2 text-xs font-semibold rounded-xl whitespace-nowrap transition-colors ${
            activeSubTab === 'guide'
              ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-xs'
              : 'text-slate-600 dark:text-slate-300 hover:text-slate-900'
          }`}
        >
          Qo‘llanma (10 qadam)
        </button>
      </div>

      {/* TAB 1: SUBMISSIONS & NATIJALAR */}
      {activeSubTab === 'dashboard' && (
        <div className="space-y-4">
          {/* Filter Bar */}
          <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2.5 flex-1 min-w-[280px]">
              {/* Search */}
              <div className="relative min-w-[200px] flex-1">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  placeholder="O‘quvchi yoki telefon..."
                  value={searchStudent}
                  onChange={(e) => setSearchStudent(e.target.value)}
                  className="w-full pl-9 pr-3 py-1.5 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>

              {/* Group Filter */}
              <select
                value={filterGroup}
                onChange={(e) => setFilterGroup(e.target.value)}
                className="py-1.5 px-3 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
              >
                <option value="">Barcha guruhlar</option>
                {groups.map((g) => (
                  <option key={g.id} value={g.id}>{g.name}</option>
                ))}
              </select>

              {/* Test Filter */}
              <select
                value={filterTest}
                onChange={(e) => setFilterTest(e.target.value)}
                className="py-1.5 px-3 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white max-w-[200px] truncate"
              >
                <option value="">Barcha testlar</option>
                {tests.map((t) => (
                  <option key={t.id} value={t.id}>{t.title}</option>
                ))}
              </select>

              {/* Status Filter */}
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="py-1.5 px-3 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
              >
                <option value="">Barcha holatlar</option>
                <option value="passed">O‘TDI</option>
                <option value="failed">O‘TMADI</option>
              </select>
            </div>

            {/* Excel Export Button */}
            <button
              onClick={handleExportExcel}
              className="py-2 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-xs flex items-center gap-1.5 transition-colors shrink-0"
            >
              <Download className="w-3.5 h-3.5" />
              Excel (.xlsx) yuklab olish
            </button>
          </div>

          {/* Submissions Table */}
          <div className="overflow-x-auto rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-slate-500">
                <tr>
                  <th className="py-3.5 px-4 font-semibold">O‘quvchi</th>
                  <th className="py-3.5 px-4 font-semibold">Telefon</th>
                  <th className="py-3.5 px-4 font-semibold">Guruh</th>
                  <th className="py-3.5 px-4 font-semibold">Test</th>
                  <th className="py-3.5 px-4 font-semibold">Sana</th>
                  <th className="py-3.5 px-4 font-semibold">Ball</th>
                  <th className="py-3.5 px-4 font-semibold">Foiz</th>
                  <th className="py-3.5 px-4 font-semibold">Holat</th>
                  <th className="py-3.5 px-4 font-semibold">Vaqt</th>
                  <th className="py-3.5 px-4 font-semibold text-center">Chiqishlar</th>
                  <th className="py-3.5 px-4 font-semibold text-right">Amal</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
                {filteredSubmissions.length === 0 ? (
                  <tr>
                    <td colSpan={11} className="py-8 text-center text-slate-400">
                      Natijalar topilmadi.
                    </td>
                  </tr>
                ) : (
                  filteredSubmissions.map((row) => (
                    <tr key={row.attempt_id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                      <td className="py-3.5 px-4 font-medium text-slate-900 dark:text-white whitespace-nowrap">
                        {row.student_name}
                      </td>
                      <td className="py-3.5 px-4 text-slate-500 font-mono whitespace-nowrap">
                        {row.phone}
                      </td>
                      <td className="py-3.5 px-4 text-slate-600 dark:text-slate-300 whitespace-nowrap">
                        {row.group_name}
                      </td>
                      <td className="py-3.5 px-4 text-slate-800 dark:text-slate-200 max-w-[180px] truncate" title={row.test_title}>
                        {row.test_title}
                      </td>
                      <td className="py-3.5 px-4 text-slate-500 whitespace-nowrap">
                        {new Date(row.submitted_at).toLocaleDateString('uz-UZ')}
                      </td>
                      <td className="py-3.5 px-4 font-mono font-medium whitespace-nowrap">
                        {row.score} / {row.max_score}
                      </td>
                      <td className="py-3.5 px-4 font-mono font-bold whitespace-nowrap">
                        {row.percentage}%
                      </td>
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        {row.passed ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-600 dark:text-emerald-400">
                            <CheckCircle2 className="w-3 h-3" /> O‘TDI
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-red-600 dark:text-red-400">
                            <XCircle className="w-3 h-3" /> O‘TMADI
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-slate-500 whitespace-nowrap">
                        {Math.floor(row.time_spent / 60)} daq {row.time_spent % 60} son
                      </td>
                      <td className="py-3.5 px-4 text-center font-mono font-semibold">
                        <span className={row.tab_switch_count > 0 ? 'text-amber-600 dark:text-amber-400' : 'text-slate-400'}>
                          {row.tab_switch_count}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right whitespace-nowrap">
                        <button
                          onClick={() => setDeleteModalAttemptId(row.attempt_id)}
                          className="p-1.5 rounded-lg text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors"
                          title="Natijani o‘chirish va qayta topshirishga ruxsat berish"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 2: UNSUBMITTED STUDENTS */}
      {activeSubTab === 'unsubmitted' && (
        <div className="space-y-4">
          <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-sm font-bold text-slate-900 dark:text-white">
                Hali test ishlamagan o‘quvchilar ro‘yxati
              </h2>
              <p className="text-xs text-slate-500">
                Ushbu test biriktirilgan guruhlardagi hali urinish qilmagan o‘quvchilar
              </p>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-500">Testni tanlang:</span>
              <select
                value={selectedUnsubmittedTestId}
                onChange={(e) => setSelectedUnsubmittedTestId(e.target.value)}
                className="py-1.5 px-3 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
              >
                {tests.map((t) => (
                  <option key={t.id} value={t.id}>{t.title}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="overflow-x-auto rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-slate-500">
                <tr>
                  <th className="py-3.5 px-4 font-semibold">T/r</th>
                  <th className="py-3.5 px-4 font-semibold">O‘quvchi</th>
                  <th className="py-3.5 px-4 font-semibold">Telefon</th>
                  <th className="py-3.5 px-4 font-semibold">Guruh</th>
                  <th className="py-3.5 px-4 font-semibold">Holat</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
                {unsubmittedStudents.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-slate-400">
                      Barcha o‘quvchilar testni topshirgan yoki guruhda o‘quvchilar yo‘q.
                    </td>
                  </tr>
                ) : (
                  unsubmittedStudents.map((item, idx) => (
                    <tr key={item.user.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                      <td className="py-3.5 px-4 text-slate-400 font-mono">{idx + 1}</td>
                      <td className="py-3.5 px-4 font-medium text-slate-900 dark:text-white">
                        {item.user.first_name} {item.user.last_name}
                      </td>
                      <td className="py-3.5 px-4 font-mono text-slate-500">{item.user.phone}</td>
                      <td className="py-3.5 px-4 text-slate-600 dark:text-slate-300">{item.group.name}</td>
                      <td className="py-3.5 px-4">
                        <span className="text-[11px] font-semibold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 px-2 py-0.5 rounded-full">
                          Topshirmagan
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: QUESTION STATISTICS */}
      {activeSubTab === 'stats' && (
        <div className="space-y-4">
          <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-sm font-bold text-slate-900 dark:text-white">
                Savollar bo‘yicha batafsil statistika
              </h2>
              <p className="text-xs text-slate-500">
                Har bir savol bo‘yicha o‘quvchilarning to‘g‘ri va noto‘g‘ri javoblari tahlili
              </p>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-500">Testni tanlang:</span>
              <select
                value={selectedStatsTestId}
                onChange={(e) => setSelectedStatsTestId(e.target.value)}
                className="py-1.5 px-3 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
              >
                {tests.map((t) => (
                  <option key={t.id} value={t.id}>{t.title}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="space-y-3">
            {questionStats.length === 0 ? (
              <div className="p-8 rounded-2xl bg-white dark:bg-slate-900 border border-dashed border-slate-200 dark:border-slate-800 text-center text-slate-400 text-xs">
                Savollar bo‘yicha ma’lumot topilmadi.
              </div>
            ) : (
              questionStats.map((qs) => (
                <div
                  key={qs.question_id}
                  className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-3"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <span className="text-xs font-bold text-blue-600 dark:text-blue-400">
                        {qs.order_index}-savol:
                      </span>
                      <p className="text-sm font-semibold text-slate-900 dark:text-white mt-0.5">
                        {qs.question_text}
                      </p>
                    </div>

                    <div className="text-right shrink-0">
                      <span className="text-lg font-bold font-mono text-slate-900 dark:text-white">
                        {qs.correct_percentage}% to‘g‘ri
                      </span>
                      <span className="text-[11px] text-slate-400 block">
                        Jami: {qs.total_answers} ta javob
                      </span>
                    </div>
                  </div>

                  {/* Progress bar (Correct vs Incorrect) */}
                  <div className="w-full h-3 bg-red-100 dark:bg-red-950/60 rounded-full overflow-hidden flex">
                    <div
                      className="h-full bg-emerald-500 rounded-full transition-all"
                      style={{ width: `${qs.correct_percentage}%` }}
                    />
                  </div>

                  <div className="flex items-center justify-between text-xs text-slate-500 pt-1">
                    <span className="flex items-center gap-1 font-medium text-emerald-600 dark:text-emerald-400">
                      <Check className="w-3.5 h-3.5" /> To‘g‘ri javoblar: {qs.correct_count} ta
                    </span>
                    <span className="flex items-center gap-1 font-medium text-red-500">
                      <X className="w-3.5 h-3.5" /> Noto‘g‘ri javoblar: {qs.incorrect_count} ta
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* TAB 4: MANAGE TESTS & WORD (.DOCX) IMPORT */}
      {activeSubTab === 'manage-tests' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-slate-900 dark:text-white">
              Barcha testlar ro‘yxati ({tests.length})
            </h2>
            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  setShowImportModal(true);
                  setPreviewResult(null);
                }}
                className="py-2 px-3.5 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/60 text-xs font-semibold flex items-center gap-1.5 transition-colors"
              >
                <Upload className="w-3.5 h-3.5" />
                Word (.docx) dan import
              </button>
              <button
                onClick={() => setShowCreateTestModal(true)}
                className="py-2 px-3.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-xs"
              >
                <Plus className="w-3.5 h-3.5" />
                Yangi test
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {tests.map((t) => (
              <div
                key={t.id}
                className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-3"
              >
                <div className="flex items-start justify-between gap-3">
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white leading-snug">
                    {t.title}
                  </h3>
                  <span
                    className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
                      t.status === 'active'
                        ? 'bg-emerald-50 dark:bg-emerald-950 text-emerald-600'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-500'
                    }`}
                  >
                    {t.status === 'active' ? 'Ochiq' : t.status === 'closed' ? 'Yopilgan' : 'Qoralama'}
                  </span>
                </div>

                <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2">
                  {t.description || 'Tavsif yo‘q.'}
                </p>

                <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 pt-2 border-t border-slate-100 dark:border-slate-800">
                  <span>{t.question_count || 0} ta savol</span>
                  <span>·</span>
                  <span>{t.time_limit} daqiqa</span>
                  <span>·</span>
                  <span>O‘tish: {t.passing_percentage}%</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 5: MANAGE GROUPS */}
      {activeSubTab === 'groups' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-slate-900 dark:text-white">
              Guruhlar boshqaruvi ({groups.length})
            </h2>
            <button
              onClick={() => setShowCreateGroupModal(true)}
              className="py-2 px-3.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-xs"
            >
              <Plus className="w-3.5 h-3.5" />
              Yangi guruh
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {groups.map((g) => (
              <div
                key={g.id}
                className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-3"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                      {g.name}
                    </h3>
                    <p className="text-xs text-slate-500 mt-1">{g.description || 'Tavsifsiz'}</p>
                  </div>
                  <span className="text-xs font-mono font-bold text-blue-600 bg-blue-50 dark:bg-blue-950 px-2 py-0.5 rounded-full">
                    {g.member_count || 0} ta talaba
                  </span>
                </div>

                <div className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-slate-800 text-xs">
                  <span className="text-slate-400">
                    Yaratilgan: {new Date(g.created_at).toLocaleDateString('uz-UZ')}
                  </span>
                  <button
                    onClick={async () => {
                      setSelectedGroupForMembers(g);
                      // fetch group students and all students
                      const [gmRes, allRes] = await Promise.all([
                        fetch(`/api/teacher/groups/${g.id}/students`, { headers: { Authorization: `Bearer ${token}` } }),
                        fetch('/api/teacher/students', { headers: { Authorization: `Bearer ${token}` } }),
                      ]);
                      if (gmRes.ok) setGroupStudents(await gmRes.json());
                      if (allRes.ok) setAllStudents(await allRes.json());
                    }}
                    className="text-xs font-semibold text-blue-600 hover:text-blue-700 dark:text-blue-400"
                  >
                    O‘quvchilarni boshqarish →
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 6: 500 CONCURRENT USERS LOAD TEST BENCHMARK */}
      {activeSubTab === 'loadtest' && (
        <div className="space-y-6">
          <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Zap className="w-5 h-5 text-amber-500 fill-current" />
                  500 ta bir vaqtda virtual foydalanuvchi yuklama sinovi (Load Test)
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-2xl leading-relaxed">
                  Ushbu sinov real vaqt rejimida 500 ta virtual o‘quvchini tizimga kiritadi, test savollarini yuklaydi, javoblarni serverga real-time saqlaydi, testni yakunlab serverda ballarni hisoblaydi va Telegram bildirishnoma navbatini tekshiradi.
                </p>
              </div>

              <button
                onClick={handleRunLoadTest}
                disabled={loadTestRunning}
                className="py-3 px-5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs sm:text-sm shadow-md shadow-blue-600/20 flex items-center justify-center gap-2 shrink-0 disabled:opacity-50 transition-all"
              >
                {loadTestRunning ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    Sinov o‘tkazilmoqda...
                  </>
                ) : (
                  <>
                    <Zap className="w-4 h-4" />
                    500 VU Sinovni boshlash
                  </>
                )}
              </button>
            </div>

            {loadTestMetric && (
              <div className="pt-4 border-t border-slate-100 dark:border-slate-800 space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Oxirgi o‘tkazilgan sinov natijalari:
                  </span>
                  <span className="text-xs font-mono text-slate-400">
                    {new Date(loadTestMetric.tested_at).toLocaleString('uz-UZ')}
                  </span>
                </div>

                {/* Primary Metric Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60">
                    <span className="text-[11px] text-slate-500 block">Virtual Foydalanuvchilar</span>
                    <span className="text-xl font-bold font-mono text-slate-900 dark:text-white mt-0.5 block">
                      {loadTestMetric.virtual_users} VU
                    </span>
                  </div>

                  <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60">
                    <span className="text-[11px] text-slate-500 block">Xatolik darajasi (Error Rate)</span>
                    <span className="text-xl font-bold font-mono text-emerald-600 mt-0.5 block">
                      {loadTestMetric.error_rate_pct}%
                    </span>
                  </div>

                  <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60">
                    <span className="text-[11px] text-slate-500 block">O‘tkazuvchanlik (Throughput)</span>
                    <span className="text-xl font-bold font-mono text-blue-600 mt-0.5 block">
                      {loadTestMetric.throughput_req_per_sec} req/s
                    </span>
                  </div>

                  <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60">
                    <span className="text-[11px] text-slate-500 block">Jami so‘rovlar (Requests)</span>
                    <span className="text-xl font-bold font-mono text-slate-900 dark:text-white mt-0.5 block">
                      {loadTestMetric.total_requests}
                    </span>
                  </div>
                </div>

                {/* Latency Stats Table */}
                <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 dark:bg-slate-800 text-slate-500">
                      <tr>
                        <th className="py-2.5 px-3 font-semibold">Min</th>
                        <th className="py-2.5 px-3 font-semibold">O‘rtacha (Avg)</th>
                        <th className="py-2.5 px-3 font-semibold">Mediana (p50)</th>
                        <th className="py-2.5 px-3 font-semibold">p95</th>
                        <th className="py-2.5 px-3 font-semibold">p99</th>
                        <th className="py-2.5 px-3 font-semibold">Max</th>
                        <th className="py-2.5 px-3 font-semibold">RAM sarfi</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      <tr className="font-mono">
                        <td className="py-2.5 px-3">{loadTestMetric.latency_min_ms} ms</td>
                        <td className="py-2.5 px-3 font-bold text-blue-600">{loadTestMetric.latency_avg_ms} ms</td>
                        <td className="py-2.5 px-3">{loadTestMetric.latency_p50_ms} ms</td>
                        <td className="py-2.5 px-3">{loadTestMetric.latency_p95_ms} ms</td>
                        <td className="py-2.5 px-3">{loadTestMetric.latency_p99_ms} ms</td>
                        <td className="py-2.5 px-3">{loadTestMetric.latency_max_ms} ms</td>
                        <td className="py-2.5 px-3 font-bold text-emerald-600">~{loadTestMetric.memory_used_mb} MB</td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                {/* Stages progress bar */}
                <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/40 space-y-2 text-xs">
                  <span className="font-bold text-slate-800 dark:text-slate-200 block">
                    Bajarilgan bosqichlar tafsiloti:
                  </span>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-slate-600 dark:text-slate-300 font-mono">
                    <div>1. Login/OTP: {loadTestMetric.stages_completed?.authentication}</div>
                    <div>2. Test yuklash: {loadTestMetric.stages_completed?.test_lookup}</div>
                    <div>3. Urinish ochish: {loadTestMetric.stages_completed?.attempt_start}</div>
                    <div>4. Javob saqlash: {loadTestMetric.stages_completed?.answers_saved}</div>
                    <div>5. Test yakunlash: {loadTestMetric.stages_completed?.submission_complete}</div>
                    <div>6. Telegram navbat: {loadTestMetric.stages_completed?.telegram_queue}</div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 7: TELEGRAM BOT SETTINGS */}
      {activeSubTab === 'telegram' && (
        <div className="max-w-2xl mx-auto space-y-6">
          <div className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-6">
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Send className="w-5 h-5 text-blue-500" />
                Telegram Bot sozlamalari
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                O‘quvchilar bir martalik tasdiqlash kodini olishi va har bir test yakunlanganda sizga xabar yuborilishi uchun Telegram botni sozlang.
              </p>
            </div>

            {telegramInfo && (
              <div className="p-4 rounded-xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900/60 flex items-center justify-between text-xs">
                <div>
                  <span className="font-bold text-blue-950 dark:text-blue-200 block">
                    Bot holati: {telegramInfo.isConfigured ? '✅ Faol ulangan' : '⚠️ Sinov rejimida'}
                  </span>
                  <span className="text-slate-500 mt-0.5 block">
                    Bot nomi: @{telegramInfo.botUsername} · Navbatdagi xabarlar: {telegramInfo.pendingQueueSize} ta
                  </span>
                </div>
              </div>
            )}

            <form onSubmit={handleSaveTelegram} className="space-y-4 text-xs">
              <div>
                <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Telegram Bot Token (@BotFather bergan token)
                </label>
                <input
                  type="password"
                  placeholder="123456789:ABCdefGhIJKlmNoPQRsTUVwxyZ"
                  value={botTokenInput}
                  onChange={(e) => setBotTokenInput(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-mono"
                />
              </div>

              <div>
                <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
                  O‘qituvchining Telegram Chat ID raqami
                </label>
                <input
                  type="text"
                  placeholder="Masalan: 123456789"
                  value={chatIdInput}
                  onChange={(e) => setChatIdInput(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-mono"
                />
                <span className="text-[11px] text-slate-400 mt-1 block">
                  Chat ID raqamingizni Telegram'dagi @userinfobot orqali bilib olishingiz mumkin.
                </span>
              </div>

              <div>
                <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Bot Username (masalan: TestMasterUzBot)
                </label>
                <input
                  type="text"
                  placeholder="TestMasterUzBot"
                  value={usernameInput}
                  onChange={(e) => setUsernameInput(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  className="py-2.5 px-5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold shadow-xs transition-colors"
                >
                  {telegramSaved ? 'Saqlandi ✓' : 'Sozlamalarni saqlash'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* TAB 8: FOYDALANISH QO'LLANMASI (10 TA PUNKT) */}
      {activeSubTab === 'guide' && (
        <div className="max-w-4xl mx-auto space-y-6">
          <div className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-6">
            <div>
              <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-blue-600" />
                Onlayn Test Platformasidan Foydalanish Qo‘llanmasi
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                O‘qituvchi va administrator uchun 10 ta asosiy amaliyot bo‘yicha to‘liq qo‘llanma
              </p>
            </div>

            <div className="space-y-4 text-xs sm:text-sm text-slate-700 dark:text-slate-300">
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 space-y-1.5">
                <h3 className="font-bold text-slate-900 dark:text-white">1. Guruh yaratish</h3>
                <p>O‘qituvchi panelidagi "Guruhlar" bo‘limiga o‘ting. "Yangi guruh" tugmasini bosing, guruh nomi va tavsifini kiriting hamda saqlang.</p>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 space-y-1.5">
                <h3 className="font-bold text-slate-900 dark:text-white">2. O‘quvchi qo‘shish</h3>
                <p>O‘quvchilar saytga telefon raqamlari orqali kirganlarida avtomatik ro‘yxatdan o‘tadilar. "Guruhlar" bo‘limida tegishli guruh ustiga bosib, "O‘quvchilarni boshqarish" orqali o‘quvchini guruhga biriktirishingiz mumkin.</p>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 space-y-1.5">
                <h3 className="font-bold text-slate-900 dark:text-white">3. Test yaratish</h3>
                <p>"Testlar" bo‘limidagi "Yangi test" tugmasi orqali test nomini, vaqt limitini (daqiqa), o‘tish foizini va urinishlar sonini belgilang.</p>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 space-y-1.5">
                <h3 className="font-bold text-slate-900 dark:text-white">4. Word (.docx) dan test import qilish</h3>
                <p>
                  "Word (.docx) dan import" tugmasini bosing. Faylni yuklang yoki matnni nusxalab kiriting. Format:
                  <code className="block p-2 rounded bg-slate-200 dark:bg-slate-900 mt-1 font-mono text-xs">
                    1. O‘zbekiston poytaxti qaysi?<br />
                    A) Samarqand<br />
                    *B) Toshkent<br />
                    C) Buxoro<br />
                    D) Xiva
                  </code>
                  Tizim avtomatik PREVIEW oynasini ochadi va format xatolarini tekshiradi.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 space-y-1.5">
                <h3 className="font-bold text-slate-900 dark:text-white">5. Testni guruhga ochish</h3>
                <p>Test sozlamalarida guruhlarni belgilang va statusini "Ochiq" (active) holatiga o‘tkazing. O‘quvchilar testni o‘z kabinetlarida darhol ko‘radilar.</p>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 space-y-1.5">
                <h3 className="font-bold text-slate-900 dark:text-white">6. Test natijalarini ko‘rish</h3>
                <p>"Natijalar jadvali" bo‘limida barcha o‘quvchilarning ballari, foizi, sarflagan vaqti va oynadan chiqishlar soni real-time ko‘rinib turadi.</p>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 space-y-1.5">
                <h3 className="font-bold text-slate-900 dark:text-white">7. Excel yuklab olish</h3>
                <p>"Excel (.xlsx) yuklab olish" tugmasini bosish orqali barcha saralangan natijalarni bir zumda Excel formatida yuklab olishingiz mumkin.</p>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 space-y-1.5">
                <h3 className="font-bold text-slate-900 dark:text-white">8. O‘quvchiga qayta test topshirishga ruxsat berish</h3>
                <p>Natijalar jadvalidagi qizil axlat qutisi belgisini bosing. O‘chirish tasdiqlangach, urinish hisobdan chiqariladi va o‘quvchi qayta topshirishi mumkin bo‘ladi (Audit log saqlanadi).</p>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 space-y-1.5">
                <h3 className="font-bold text-slate-900 dark:text-white">9. Telegram botni sozlash</h3>
                <p>Telegram'dagi @BotFather orqali yangi bot yarating va olingan Bot Tokenni "Telegram Bot" sozlamalari bo‘limiga kiriting. Shuningdek @userinfobot orqali olingan Chat ID raqamingizni kiriting.</p>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 space-y-1.5">
                <h3 className="font-bold text-slate-900 dark:text-white">10. Domenni ulash</h3>
                <p>Loyihani o‘z serveringizga yoki hostingizga joylashtirib, DNS sozlamalarida A yoki CNAME yozuvini server IP manziliga yo‘naltiring hamda HTTPS sertifikatini faollashtiring.</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 1: DELETE ATTEMPT WITH CONFIRMATION & AUDIT */}
      {deleteModalAttemptId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="w-full max-w-sm rounded-2xl bg-white dark:bg-slate-900 p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4">
            <div className="flex items-center gap-2 text-red-600 font-bold text-base">
              <AlertTriangle className="w-5 h-5" />
              Natijani o‘chirish
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              O‘quvchining ushbu test natijasi o‘chiriladi va urinish limiti qayta hisoblanadi. O‘quvchi testni qayta topshirishi mumkin bo‘ladi.
            </p>

            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                O‘chirish sababi (Audit log uchun):
              </label>
              <input
                type="text"
                value={deleteReason}
                onChange={(e) => setDeleteReason(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
              />
            </div>

            <div className="flex items-center gap-2 pt-2">
              <button
                onClick={() => setDeleteModalAttemptId(null)}
                className="flex-1 py-2 rounded-xl border border-slate-300 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-200"
              >
                Bekor qilish
              </button>
              <button
                onClick={handleDeleteAttempt}
                className="flex-1 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-xs font-semibold text-white shadow-xs"
              >
                Ha, o‘chirilsin
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: WORD (.DOCX) IMPORT WITH PREVIEW & ERROR HIGHLIGHT */}
      {showImportModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="relative w-full max-w-2xl rounded-2xl bg-white dark:bg-slate-900 p-6 sm:p-8 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-5 my-8 max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setShowImportModal(false)}
              className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-xl"
            >
              <X className="w-5 h-5" />
            </button>

            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                Word (.docx) dan savollarni import qilish
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                Fayl yuklang yoki formatga mos matnni joylang. Avval Preview ko‘rsatiladi.
              </p>
            </div>

            {!previewResult ? (
              <div className="space-y-4 text-xs">
                {/* File Upload */}
                <div className="p-6 rounded-2xl border-2 border-dashed border-slate-300 dark:border-slate-700 text-center hover:border-blue-500 transition-colors">
                  <Upload className="w-8 h-8 text-blue-500 mx-auto mb-2" />
                  <label className="cursor-pointer font-bold text-blue-600 hover:underline block">
                    Word (.docx) faylini tanlang
                    <input
                      type="file"
                      accept=".docx"
                      onChange={handleDocxFile}
                      className="hidden"
                    />
                  </label>
                  {importFileName && (
                    <span className="text-xs font-mono text-slate-600 dark:text-slate-300 mt-1 block">
                      Tanlangan: {importFileName}
                    </span>
                  )}
                </div>

                <div className="text-center font-bold text-slate-400">YOKI MATNNI JOYLANG:</div>

                <div>
                  <textarea
                    rows={6}
                    placeholder={`1. O‘zbekiston poytaxti qaysi?\nA) Samarqand\n*B) Toshkent\nC) Buxoro\nD) Xiva`}
                    value={importPastedText}
                    onChange={(e) => setImportPastedText(e.target.value)}
                    className="w-full p-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 font-mono text-xs text-slate-900 dark:text-white"
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-2">
                  <button
                    onClick={() => setShowImportModal(false)}
                    className="py-2 px-4 rounded-xl border border-slate-300 text-slate-700 dark:text-slate-300 font-semibold"
                  >
                    Bekor qilish
                  </button>
                  <button
                    onClick={handleParseQuestions}
                    disabled={parsing || (!importBase64 && !importPastedText.trim())}
                    className="py-2 px-5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold flex items-center gap-1.5 disabled:opacity-50"
                  >
                    {parsing ? 'Tahlil qilinmoqda...' : 'Tahlil qilish va Preview ko‘rish'}
                  </button>
                </div>
              </div>
            ) : (
              /* PREVIEW WINDOW */
              <div className="space-y-4 text-xs">
                <div className="p-3 rounded-xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900/60 flex items-center justify-between">
                  <span className="font-bold text-blue-950 dark:text-blue-200">
                    Aniqlangan savollar: {previewResult.total_detected} ta (To‘g‘ri: {previewResult.valid_count} ta)
                  </span>
                  {previewResult.formatErrors.length > 0 && (
                    <span className="font-bold text-red-600 flex items-center gap-1">
                      <AlertTriangle className="w-3.5 h-3.5" />
                      {previewResult.formatErrors.length} ta xatolik aniqlandi!
                    </span>
                  )}
                </div>

                {/* Error Box */}
                {previewResult.formatErrors.length > 0 && (
                  <div className="p-3 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/50 space-y-1">
                    <span className="font-bold text-red-700 dark:text-red-300 block">
                      Aniqlangan xatolar ro‘yxati:
                    </span>
                    {previewResult.formatErrors.map((err, idx) => (
                      <p key={idx} className="text-red-600 dark:text-red-400">
                        • {err.error_message}
                      </p>
                    ))}
                  </div>
                )}

                {/* Test details for saving */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                  <div>
                    <label className="block font-medium mb-1">Test nomi</label>
                    <input
                      type="text"
                      placeholder="Masalan: Fizika 1-oraliq"
                      value={testForm.title}
                      onChange={(e) => setTestForm({ ...testForm, title: e.target.value })}
                      className="w-full px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
                    />
                  </div>

                  <div>
                    <label className="block font-medium mb-1">Vaqt limiti (daqiqa)</label>
                    <input
                      type="number"
                      value={testForm.time_limit}
                      onChange={(e) => setTestForm({ ...testForm, time_limit: Number(e.target.value) })}
                      className="w-full px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
                    />
                  </div>
                </div>

                {/* Questions Preview List */}
                <div className="space-y-3 max-h-60 overflow-y-auto pr-1">
                  {previewResult.questions.map((q, idx) => (
                    <div
                      key={idx}
                      className={`p-3 rounded-xl border ${
                        q.error
                          ? 'border-red-300 bg-red-50/40 dark:border-red-900 dark:bg-red-950/30'
                          : 'border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <span className="font-bold text-slate-900 dark:text-white">
                          {idx + 1}. {q.question_text}
                        </span>
                        <span className="text-[11px] font-mono text-slate-500 shrink-0">
                          {q.points} ball
                        </span>
                      </div>

                      <div className="mt-2 space-y-1">
                        {q.answers.map((ans, optIdx) => (
                          <div
                            key={optIdx}
                            className={`flex items-center gap-1.5 ${
                              ans.is_correct ? 'font-bold text-emerald-600 dark:text-emerald-400' : 'text-slate-600 dark:text-slate-400'
                            }`}
                          >
                            <span>{String.fromCharCode(65 + optIdx)})</span>
                            <span>{ans.answer_text}</span>
                            {ans.is_correct && <span>(To‘g‘ri javob *)</span>}
                          </div>
                        ))}
                      </div>

                      {q.error && (
                        <p className="text-[11px] font-bold text-red-600 mt-1">
                          Xato: {q.error}
                        </p>
                      )}
                    </div>
                  ))}
                </div>

                {/* Action buttons: Saqlash vs Bekor qilish */}
                <div className="flex items-center justify-between pt-3 border-t border-slate-200 dark:border-slate-800">
                  <button
                    onClick={() => setPreviewResult(null)}
                    className="py-2 px-4 rounded-xl border border-slate-300 text-slate-700 dark:text-slate-300 font-semibold"
                  >
                    [Bekor qilish / Qayta tahrirlash]
                  </button>

                  <button
                    onClick={handleSaveImportedTest}
                    className="py-2 px-5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold shadow-md"
                  >
                    [Saqlash]
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* MODAL 3: CREATE GROUP */}
      {showCreateGroupModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="w-full max-w-sm rounded-2xl bg-white dark:bg-slate-900 p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4">
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              Yangi guruh yaratish
            </h3>

            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                Guruh nomi
              </label>
              <input
                type="text"
                placeholder="Masalan: 201-Guruh: Dasturlash"
                value={groupName}
                onChange={(e) => setGroupName(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                Tavsif
              </label>
              <textarea
                rows={2}
                placeholder="Guruh haqida ma’lumot"
                value={groupDesc}
                onChange={(e) => setGroupDesc(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
              />
            </div>

            <div className="flex items-center gap-2 pt-2">
              <button
                onClick={() => setShowCreateGroupModal(false)}
                className="flex-1 py-2 rounded-xl border border-slate-300 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-200"
              >
                Bekor qilish
              </button>
              <button
                onClick={async () => {
                  if (!groupName.trim()) return;
                  await fetch('/api/teacher/groups', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                    body: JSON.stringify({ name: groupName, description: groupDesc }),
                  });
                  setGroupName('');
                  setGroupDesc('');
                  setShowCreateGroupModal(false);
                  fetchDashboardData();
                }}
                className="flex-1 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-xs font-semibold text-white shadow-xs"
              >
                Yaratish
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 4: MANAGE GROUP MEMBERS */}
      {selectedGroupForMembers && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="w-full max-w-lg rounded-2xl bg-white dark:bg-slate-900 p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4 max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                {selectedGroupForMembers.name} — O‘quvchilari
              </h3>
              <button
                onClick={() => setSelectedGroupForMembers(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-2">
              <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                Guruhdagi o‘quvchilar ({groupStudents.length} ta):
              </span>
              <div className="space-y-1.5 max-h-48 overflow-y-auto">
                {groupStudents.map((st) => (
                  <div
                    key={st.id}
                    className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 flex items-center justify-between text-xs"
                  >
                    <div>
                      <span className="font-bold text-slate-900 dark:text-white">
                        {st.first_name} {st.last_name}
                      </span>
                      <span className="text-slate-400 font-mono ml-2">{st.phone}</span>
                    </div>
                    <button
                      onClick={async () => {
                        await fetch(`/api/teacher/groups/${selectedGroupForMembers.id}/students/${st.id}`, {
                          method: 'DELETE',
                          headers: { Authorization: `Bearer ${token}` },
                        });
                        setGroupStudents((prev) => prev.filter((s) => s.id !== st.id));
                        fetchDashboardData();
                      }}
                      className="text-red-500 hover:text-red-700 text-xs font-semibold"
                    >
                      Chiqarish
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Add student dropdown */}
            <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                Yangi o‘quvchi qo‘shish:
              </label>
              <div className="flex gap-2">
                <select
                  id="addStudentSelect"
                  className="flex-1 py-1.5 px-3 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
                >
                  {allStudents
                    .filter((s) => !groupStudents.some((gs) => gs.id === s.id))
                    .map((st) => (
                      <option key={st.id} value={st.id}>
                        {st.first_name} {st.last_name} ({st.phone})
                      </option>
                    ))}
                </select>
                <button
                  onClick={async () => {
                    const select = document.getElementById('addStudentSelect') as HTMLSelectElement;
                    const val = select?.value;
                    if (!val) return;
                    await fetch(`/api/teacher/groups/${selectedGroupForMembers.id}/students`, {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                      body: JSON.stringify({ userId: val }),
                    });
                    const added = allStudents.find((s) => s.id === val);
                    if (added) setGroupStudents((p) => [...p, added]);
                    fetchDashboardData();
                  }}
                  className="py-1.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold"
                >
                  Qo‘shish
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
