'use client';

export function StepIndicator({ current = 1, total = 3, labels = [] }) {
  return (
    <div className="flex items-center gap-2">
      {Array.from({ length: total }, (_, i) => {
        const step = i + 1;
        const done = step < current;
        const active = step === current;

        return (
          <div key={step} className="flex items-center gap-2">
            <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-300
              ${done   ? 'bg-sky-500 text-white' :
                active ? 'bg-sky-500 text-white ring-4 ring-sky-100' :
                         'bg-slate-100 text-slate-400 border border-slate-200'}`}>
              {done ? '✓' : step}
            </div>
            {labels[i] && (
              <span className={`text-xs font-medium hidden sm:block
                ${active ? 'text-sky-600' : done ? 'text-slate-500' : 'text-slate-300'}`}>
                {labels[i]}
              </span>
            )}
            {step < total && (
              <div className={`flex-1 h-px w-6 transition-colors duration-300 ${done ? 'bg-sky-400' : 'bg-slate-200'}`} />
            )}
          </div>
        );
      })}
    </div>
  );
}
