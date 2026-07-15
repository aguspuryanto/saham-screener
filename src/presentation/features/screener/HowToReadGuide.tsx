import { useState, ReactNode } from 'react';
import { cn } from '../../../utils/cn';
import { ChevronDown, HelpCircle } from 'lucide-react';

export type GuideColor = 'blue' | 'emerald' | 'violet' | 'amber' | 'red';

const BOX_STYLES: Record<GuideColor, string> = {
  blue: 'bg-blue-50 border-blue-100',
  emerald: 'bg-emerald-50 border-emerald-100',
  violet: 'bg-violet-50 border-violet-100',
  amber: 'bg-amber-50 border-amber-100',
  red: 'bg-red-50 border-red-100',
};

const BADGE_STYLES: Record<GuideColor, string> = {
  blue: 'bg-blue-100 text-blue-700',
  emerald: 'bg-emerald-100 text-emerald-700',
  violet: 'bg-violet-100 text-violet-700',
  amber: 'bg-amber-100 text-amber-700',
  red: 'bg-red-100 text-red-700',
};

export function GuideBox({
  color,
  badge,
  title,
  children,
}: {
  color: GuideColor;
  badge: string;
  title: string;
  children: ReactNode;
}) {
  return (
    <div className={cn('rounded-xl border p-3.5', BOX_STYLES[color])}>
      <span className={cn('inline-block px-2 py-0.5 rounded-md text-xs font-bold mb-1.5', BADGE_STYLES[color])}>
        {badge}
      </span>
      <p className="text-sm font-semibold text-slate-800 mb-1">{title}</p>
      <div className="text-xs text-slate-600 space-y-1">{children}</div>
    </div>
  );
}

export function GuideTip({ children }: { children: ReactNode }) {
  return (
    <div className="flex items-start gap-2 text-xs text-slate-600 bg-slate-50 border border-slate-200 rounded-xl p-3">
      <span className="flex-shrink-0">💡</span>
      <p>{children}</p>
    </div>
  );
}

export function CollapsibleGuide({ label, children }: { label: string; children: ReactNode }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="bg-white rounded-xl border border-slate-200 mb-5 overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-4 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
      >
        <span className="flex items-center gap-2">
          <HelpCircle className="w-4 h-4 text-slate-400" />
          {label}
        </span>
        <ChevronDown className={cn('w-4 h-4 text-slate-400 transition-transform', open && 'rotate-180')} />
      </button>

      {open && <div className="px-4 pb-4 space-y-3 border-t border-slate-100 pt-3">{children}</div>}
    </div>
  );
}
