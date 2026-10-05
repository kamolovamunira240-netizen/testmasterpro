import mammoth from 'mammoth';
import type { ParseDocxResult, QuestionType } from './types.js';

interface RawParsedQuestion {
  question_text: string;
  type: QuestionType;
  points: number;
  explanation?: string;
  answers: {
    answer_text: string;
    is_correct: boolean;
  }[];
  error?: string;
}

export async function parseDocxBuffer(buffer: Buffer): Promise<ParseDocxResult> {
  const { value: rawText } = await mammoth.extractRawText({ buffer });
  return parseTextQuestions(rawText);
}

export function parseTextQuestions(rawText: string): ParseDocxResult {
  const lines = rawText
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l.length > 0);

  const parsedQuestions: RawParsedQuestion[] = [];
  const formatErrors: { question_index: number; error_message: string }[] = [];

  let currentQuestion: RawParsedQuestion | null = null;
  let qIndex = 0;

  // Regular expression to match question start: "1.", "1)", "1 -", "Savol 1:"
  const questionStartRegex = /^(?:(?:Savol\s*)?(\d+)[.)\-:\s]+)(.*)/i;
  // Option start regex: "A)", "*A)", "A.", "*A.", "(A)", "*(A)"
  const optionRegex = /^(\*)?\s*([A-Za-zА-Яа-я0-9])[.)\]\s]+(.*)$/;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const qMatch = line.match(questionStartRegex);

    if (qMatch) {
      // If we already have a question, finalize and validate it
      if (currentQuestion) {
        validateAndPushQuestion(currentQuestion, qIndex, parsedQuestions, formatErrors);
      }

      qIndex++;
      const text = qMatch[2].trim();
      currentQuestion = {
        question_text: text || 'Savol matni kiritilmagan',
        type: 'single_choice',
        points: 1,
        answers: [],
      };
      continue;
    }

    // Check if line is an option
    const optMatch = line.match(optionRegex);
    if (optMatch && currentQuestion) {
      let isCorrect = !!optMatch[1];
      let optText = optMatch[3].trim();

      // Check if asterisk is inside text, e.g., "A) *Toshkent"
      if (!isCorrect && optText.startsWith('*')) {
        isCorrect = true;
        optText = optText.replace(/^\*\s*/, '').trim();
      }

      currentQuestion.answers.push({
        answer_text: optText,
        is_correct: isCorrect,
      });
      continue;
    }

    // Check for explanation: "Izoh:", "Tushuntirish:"
    if (line.match(/^(?:Izoh|Tushuntirish|Explanation):\s*(.*)/i) && currentQuestion) {
      const expMatch = line.match(/^(?:Izoh|Tushuntirish|Explanation):\s*(.*)/i);
      currentQuestion.explanation = expMatch ? expMatch[1].trim() : '';
      continue;
    }

    // Check for Points: "Ball: 2"
    if (line.match(/^Ball:\s*(\d+(?:\.\d+)?)/i) && currentQuestion) {
      const pMatch = line.match(/^Ball:\s*(\d+(?:\.\d+)?)/i);
      if (pMatch) {
        currentQuestion.points = parseFloat(pMatch[1]) || 1;
      }
      continue;
    }

    // If current question has no answers yet, append to question_text (multi-line question)
    if (currentQuestion && currentQuestion.answers.length === 0) {
      currentQuestion.question_text += `\n${line}`;
    }
  }

  // Finalize last question
  if (currentQuestion) {
    validateAndPushQuestion(currentQuestion, qIndex, parsedQuestions, formatErrors);
  }

  const validCount = parsedQuestions.filter((q) => !q.error).length;

  return {
    questions: parsedQuestions,
    formatErrors,
    total_detected: parsedQuestions.length,
    valid_count: validCount,
  };
}

function validateAndPushQuestion(
  q: RawParsedQuestion,
  index: number,
  list: RawParsedQuestion[],
  errors: { question_index: number; error_message: string }[]
) {
  // Check question text
  if (!q.question_text || q.question_text === 'Savol matni kiritilmagan') {
    const err = `${index}-savol matni bo‘sh qolgan.`;
    q.error = err;
    errors.push({ question_index: index, error_message: err });
  }

  // Check options count
  if (q.answers.length < 2) {
    const err = `${index}-savolda kamida 2 ta variant bo‘lishi shart (topildi: ${q.answers.length}).`;
    q.error = err;
    errors.push({ question_index: index, error_message: err });
  }

  // Check correct answer
  const correctAnswers = q.answers.filter((a) => a.is_correct);
  if (correctAnswers.length === 0) {
    const err = `${index}-savolda to‘g‘ri javob (*) belgilanmagan.`;
    q.error = err;
    errors.push({ question_index: index, error_message: err });
  } else if (correctAnswers.length > 1) {
    const err = `${index}-savolda bittadan ortiq to‘g‘ri javob (*) belgilangan (${correctAnswers.length} ta).`;
    q.error = err;
    errors.push({ question_index: index, error_message: err });
  }

  // Detect True/False type
  if (
    q.answers.length === 2 &&
    q.answers.some((a) => a.answer_text.toLowerCase().includes('to‘g‘ri') || a.answer_text.toLowerCase().includes('togri')) &&
    q.answers.some((a) => a.answer_text.toLowerCase().includes('noto‘g‘ri') || a.answer_text.toLowerCase().includes('notogri'))
  ) {
    q.type = 'true_false';
  }

  list.push(q);
}
