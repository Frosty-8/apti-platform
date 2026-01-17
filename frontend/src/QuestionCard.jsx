import React from "react";
import { useTheme } from './theme/ThemeProvider'; // Already there

export default function QuestionCard({ q, selected, onAnswer }) {
  const { theme } = useTheme(); // For data-theme if needed

  const options = [
    { key: "A", text: q.option_a },
    { key: "B", text: q.option_b },
    { key: "C", text: q.option_c },
    { key: "D", text: q.option_d },
  ];

  return (
    <div 
      className="bg-white dark:bg-slate-950 p-8 rounded-xl shadow-md border border-slate-200 dark:border-slate-800" 
      data-theme={theme}
    >
      <p className="text-lg font-semibold mb-6 text-slate-900 dark:text-slate-100">
        <span className="mr-2 text-emerald-600">{q.id}.</span>
        {q.question}
      </p>

      <div className="grid gap-4">
        {options.map((o) => {
          const active = selected === o.key;

          return (
            <button
              key={o.key}
              onClick={() => onAnswer(o.key)}
              className={`flex items-center gap-4 p-4 rounded-lg border 
                transition-all duration-200 text-left shadow-sm
                ${active 
                  ? "bg-emerald-50 dark:bg-emerald-900/30 border-emerald-500 shadow-emerald-200/50 dark:shadow-emerald-900/20" 
                  : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 hover:shadow-md hover:scale-[1.02]"}
              `}
            >
              <div
                className={`w-10 h-10 flex items-center justify-center rounded-full font-medium text-lg
                  ${active 
                    ? "bg-emerald-600 text-white" 
                    : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400"}
                `}
              >
                {o.key}
              </div>
              <span className="text-base flex-1">{o.text}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}