import React, { useEffect, useState, useRef } from 'react';
import QuestionCard from './QuestionCard';
import { jsPDF } from 'jspdf';
import { useTheme } from './theme/ThemeProvider';
import ThemeToggle from './components/ThemeToggle';
import { ChevronLeft, ChevronRight, Download, RefreshCw } from 'lucide-react'; // Add lucide-react for icons: npm i lucide-react

const QUIZ_MINUTES = 60;
const QUESTIONS_PER_CATEGORY = 20;
const TOTAL_QUESTIONS = QUESTIONS_PER_CATEGORY * 3;

function pickRandom(items, n) {
  const clone = [...items];
  const res = [];
  while (res.length < n && clone.length) {
    const idx = Math.floor(Math.random() * clone.length);
    res.push(clone.splice(idx, 1)[0]);
  }
  return res;
}

export default function App() {
  const [pool, setPool] = useState([]);
  const [quiz, setQuiz] = useState([]);
  const [loading, setLoading] = useState(true);
  const { theme } = useTheme();
  const [timeLeft, setTimeLeft] = useState(QUIZ_MINUTES * 60);
  const timerRef = useRef(null);
  const [answers, setAnswers] = useState({});
  const [showResults, setShowResults] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);

  // Fetch pool (unchanged)
  useEffect(() => {
    fetch('http://localhost:5000/api/questions')
      .then(r => r.json())
      .then(data => {
        setPool(data);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  }, []);

  // Build quiz (unchanged)
  useEffect(() => {
    if (!pool.length) return;

    const counts = pool.reduce((acc, q) => {
      acc[q.category] = (acc[q.category] || 0) + 1;
      return acc;
    }, {});

    const categories = Object.keys(counts)
      .sort((a, b) => counts[b] - counts[a])
      .slice(0, 3);

    const selected = [];
    categories.forEach(cat => {
      const items = pool.filter(q => q.category === cat);
      const pickCount = Math.min(QUESTIONS_PER_CATEGORY, items.length);
      const samples = pickRandom(items, pickCount);
      selected.push(...samples);
    });

    if (selected.length < TOTAL_QUESTIONS) {
      const remaining = pool.filter(q => !selected.some(s => s.id === q.id));
      const more = pickRandom(remaining, TOTAL_QUESTIONS - selected.length);
      selected.push(...more);
    }

    const shuffle = selected.sort(() => Math.random() - 0.5);
    setQuiz(shuffle);
  }, [pool]);

  // Timer (unchanged)
  useEffect(() => {
    if (!quiz.length) return;

    setTimeLeft(QUIZ_MINUTES * 60);
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timerRef.current);
          handleFinish();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timerRef.current);
  }, [quiz]);

  function formatTime(s) {
    const mm = Math.floor(s / 60).toString().padStart(2, '0');
    const ss = (s % 60).toString().padStart(2, '0');
    return `${mm}:${ss}`;
  }

  function handleAnswer(qid, letter) {
    setAnswers(prev => ({ ...prev, [qid]: letter }));
  }

  function goto(index) {
    if (index < 0 || index >= quiz.length) return;
    setCurrentIndex(index);
  }

  function handleFinish() {
    if (timerRef.current) clearInterval(timerRef.current);
    setShowResults(true);
  }

  function computeResults() {
    let correct = 0;
    const detail = quiz.map(q => {
      const selected = answers[q.id] || null;
      const is_correct = selected === q.answer;
      if (is_correct) correct++;
      return {
        id: q.id,
        question: q.question,
        selected,
        correct: q.answer,
        is_correct
      };
    });
    return { total: quiz.length, correct, detail };
  }

  function downloadPDF() {
    const { total, correct, detail } = computeResults();
    const doc = new jsPDF({ unit: 'pt', format: 'letter' });
    const margin = 40;
    let y = 40;
    doc.setFontSize(14);
    doc.text('Quiz Report', margin, y);
    y += 22;
    doc.setFontSize(10);
    doc.text(`Date: ${new Date().toLocaleString()}`, margin, y);
    doc.text(`Score: ${correct} / ${total}`, margin + 300, y);
    y += 18;

    doc.setFontSize(9);
    detail.forEach((d, i) => {
      const status = d.is_correct ? 'Correct' : 'Wrong';
      const line = `${i + 1}. ${d.question} — Selected: ${d.selected || '-'} — Correct: ${d.correct} — ${status}`;
      const split = doc.splitTextToSize(line, 520);
      if (y + split.length * 12 > 750) {
        doc.addPage();
        y = 40;
      }
      doc.text(split, margin, y);
      y += split.length * 12 + 6;
    });

    doc.save('quiz-report.pdf');
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-900 text-slate-600 dark:text-slate-400">
        <div className="text-lg">Loading questions…</div>
      </div>
    );
  }

  if (!quiz.length) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-900 text-slate-600 dark:text-slate-400">
        <div className="text-lg">No questions available. Please try again later.</div>
      </div>
    );
  }

  if (showResults) {
    const { total, correct, detail } = computeResults();
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-900 p-6 md:p-10">
        <div className="max-w-4xl mx-auto">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-8 gap-4">
            <div>
              <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Quiz Results</h1>
              <p className="text-lg mt-2 text-emerald-600 dark:text-emerald-400">
                Score: {correct} / {total} ({Math.round((correct / total) * 100)}%)
              </p>
            </div>
            <div className="flex gap-3">
              <button onClick={downloadPDF} className="flex items-center gap-2 px-4 py-2 rounded-lg border bg-white dark:bg-slate-800 hover:shadow-md transition-all text-sm">
                <Download size={16} />
                Download PDF
              </button>
              <button onClick={() => window.location.reload()} className="flex items-center gap-2 px-4 py-2 rounded-lg border bg-white dark:bg-slate-800 hover:shadow-md transition-all text-sm">
                <RefreshCw size={16} />
                Restart
              </button>
            </div>
          </div>

          <div className="space-y-4">
            {detail.map((d, i) => (
              <div 
                key={d.id} 
                className={`p-6 rounded-xl border shadow-sm 
                  ${d.is_correct ? 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800' : 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800'}
                `}
              >
                <div className="text-base font-medium text-slate-900 dark:text-slate-100">{i + 1}. {d.question}</div>
                <div className="mt-2 text-sm flex items-center gap-4">
                  <span className={`px-3 py-1 rounded-md font-medium 
                    ${d.is_correct ? 'bg-emerald-200 text-emerald-800 dark:bg-emerald-700 dark:text-emerald-100' : 'bg-red-200 text-red-800 dark:bg-red-700 dark:text-red-100'}
                  `}>
                    {d.is_correct ? 'Correct' : 'Wrong'}
                  </span>
                  <span className="text-slate-600 dark:text-slate-400">Selected: {d.selected || '-'}</span>
                  <span className="text-slate-600 dark:text-slate-400">Correct: {d.correct}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  const current = quiz[currentIndex];
  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-100">
      <aside className="w-full md:w-72 border-b md:border-r border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 p-6 md:py-8 flex-shrink-0">
        <div className="mb-6">
          <div className="text-2xl font-extrabold text-emerald-600">SP-QuizMode</div>
          <div className="text-sm text-slate-500 dark:text-slate-400 mt-1">Timed Aptitude Quiz</div>
        </div>

        <div className="mt-6">
          <div className="text-xs text-slate-400 uppercase tracking-wider">Time Left</div>
          <div className="text-2xl font-semibold mt-1">{formatTime(timeLeft)}</div>
          <div className="w-full h-2 bg-slate-200 dark:bg-slate-800 rounded-full mt-3 overflow-hidden shadow-inner">
            <div
              className="h-2 bg-emerald-500 rounded-full transition-all duration-500"
              style={{ width: `${Math.max(0, (timeLeft / (QUIZ_MINUTES * 60)) * 100)}%` }}
            />
          </div>
        </div>

        <div className="mt-6">
          <div className="text-xs text-slate-400 uppercase tracking-wider">Progress</div>
          <div className="text-sm mt-1">{Object.keys(answers).length} / {quiz.length} answered</div>
        </div>

        <div className="mt-8">
          <ThemeToggle />
        </div>
      </aside>

      <main className="flex-1 p-6 md:p-10">
        <div className="max-w-4xl mx-auto">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 gap-4">
            <h1 className="text-xl font-semibold text-slate-900 dark:text-slate-100">Question {currentIndex + 1} of {quiz.length}</h1>
            <div className="flex items-center gap-4">
              <div className="text-sm text-slate-500 dark:text-slate-400 px-4 py-2 rounded-lg bg-white dark:bg-slate-800 shadow-sm border border-slate-200 dark:border-slate-700">{formatTime(timeLeft)}</div>
              <button 
                onClick={() => { if (confirm('Submit quiz now?')) handleFinish() }} 
                className="px-4 py-2 rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 transition-all shadow-md text-sm font-medium"
              >
                Submit Quiz
              </button>
            </div>
          </div>

          <QuestionCard
            q={current}
            selected={answers[current.id]}
            onAnswer={(letter) => handleAnswer(current.id, letter)}
          />

          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mt-8 gap-4">
            <div className="flex items-center gap-3">
              <button 
                onClick={() => goto(currentIndex - 1)} 
                disabled={currentIndex === 0} 
                className="flex items-center gap-2 px-4 py-2 rounded-lg border bg-white dark:bg-slate-800 disabled:opacity-50 hover:shadow-md transition-all text-sm"
              >
                <ChevronLeft size={16} />
                Previous
              </button>
              <button 
                onClick={() => goto(currentIndex + 1)} 
                disabled={currentIndex === quiz.length - 1} 
                className="flex items-center gap-2 px-4 py-2 rounded-lg border bg-white dark:bg-slate-800 disabled:opacity-50 hover:shadow-md transition-all text-sm"
              >
                Next
                <ChevronRight size={16} />
              </button>
            </div>

            <div className="flex items-center gap-3">
              <button 
                onClick={() => { setCurrentIndex(0) }} 
                className="px-3 py-2 rounded-lg border bg-white dark:bg-slate-800 hover:shadow-md transition-all text-sm"
              >
                First
              </button>
              <button 
                onClick={() => { setCurrentIndex(quiz.length - 1) }} 
                className="px-3 py-2 rounded-lg border bg-white dark:bg-slate-800 hover:shadow-md transition-all text-sm"
              >
                Last
              </button>
            </div>
          </div>

          <div className="mt-8">
            <h3 className="text-base font-semibold mb-3 text-slate-900 dark:text-slate-100">Jump to Question</h3>
            <div className="grid grid-cols-5 sm:grid-cols-10 gap-2">
              {quiz.map((q, i) => {
                const answered = !!answers[q.id];
                return (
                  <button
                    key={q.id}
                    onClick={() => goto(i)}
                    className={`p-2 rounded-lg shadow-sm transition-all duration-200 text-sm font-medium
                      ${i === currentIndex 
                        ? 'bg-emerald-600 text-white scale-105 shadow-md' 
                        : answered 
                          ? 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-800 dark:text-emerald-200 border-emerald-300 dark:border-emerald-700' 
                          : 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:shadow-md'}
                    `}
                  >
                    {i + 1}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </main>

      <aside className="hidden lg:block w-80 border-l border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 p-6 flex-shrink-0">
        <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100 mb-4">Quiz Info</h3>
        <div className="text-sm text-slate-600 dark:text-slate-400 space-y-3">
          <p>Duration: 60 minutes</p>
          <p>Total Questions: {quiz.length}</p>
          <p>Auto-submit on timer end</p>
          <p>Categories: {[...new Set(quiz.map(q => q.category))].join(', ')}</p>
        </div>
      </aside>
    </div>
  );
}