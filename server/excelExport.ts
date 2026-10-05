import * as XLSX from 'xlsx';
import type { SubmissionRow } from './types.js';

export function exportSubmissionsToExcel(rows: SubmissionRow[], filterTitle?: string): Buffer {
  // Map rows to display headers
  const data = rows.map((r, index) => {
    const mins = Math.floor(r.time_spent / 60);
    const secs = r.time_spent % 60;
    const timeStr = `${mins} daq ${secs} son`;

    const [firstName = '', ...lastParts] = (r.student_name || '').split(' ');
    const lastName = lastParts.join(' ');

    return {
      'T/r': index + 1,
      'Ism': firstName,
      'Familiya': lastName || firstName,
      'Telefon': r.phone || '',
      'Guruh': r.group_name || 'Guruhsiz',
      'Test': r.test_title || '',
      'Sana': r.submitted_at ? new Date(r.submitted_at).toLocaleString('uz-UZ') : '',
      'Ball': r.score,
      'Maksimal ball': r.max_score,
      'Foiz': `${r.percentage}%`,
      'Holat': r.passed ? 'O‘TDI' : 'O‘TMADI',
      'Sarflangan vaqt': timeStr,
      'Oynadan chiqishlar soni': r.tab_switch_count,
    };
  });

  const worksheet = XLSX.utils.json_to_sheet(data);

  // Set column widths
  worksheet['!cols'] = [
    { wch: 6 },  // T/r
    { wch: 16 }, // Ism
    { wch: 18 }, // Familiya
    { wch: 16 }, // Telefon
    { wch: 22 }, // Guruh
    { wch: 32 }, // Test
    { wch: 20 }, // Sana
    { wch: 8 },  // Ball
    { wch: 14 }, // Maksimal ball
    { wch: 10 }, // Foiz
    { wch: 12 }, // Holat
    { wch: 18 }, // Sarflangan vaqt
    { wch: 24 }, // Chiqishlar
  ];

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, filterTitle ? filterTitle.slice(0, 30) : 'Test Natijalari');

  const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
  return buffer;
}
