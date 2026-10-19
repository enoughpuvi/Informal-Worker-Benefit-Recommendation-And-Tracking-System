import React from 'react';
import { TimelineStep } from '../types';
import { CheckCircle2, Clock, AlertCircle, Circle } from 'lucide-react';

interface TimelineProps {
  steps?: TimelineStep[];
  currentStatus: string;
}

export const Timeline: React.FC<TimelineProps> = ({ steps = [] }) => {
  if (!steps || steps.length === 0) {
    return (
      <div className="p-4 text-center text-slate-500 text-sm">
        No tracking timeline steps recorded yet.
      </div>
    );
  }

  return (
    <div className="py-4">
      <div className="relative pl-6 space-y-8 before:absolute before:left-[17px] before:top-3 before:bottom-3 before:w-0.5 before:bg-slate-200">
        {steps.map((step, index) => {
          const isCompleted = step.state === 'COMPLETED';
          const isCurrent = step.state === 'CURRENT';
          const isRejected = step.state === 'REJECTED';
          const isPending = step.state === 'PENDING';

          return (
            <div key={index} className="relative flex items-start group">
              
              {/* Status Icon */}
              <div
                className={`absolute -left-6 flex items-center justify-center w-7 h-7 rounded-full ring-4 ring-white ${
                  isCompleted
                    ? 'bg-emerald-600 text-white'
                    : isCurrent
                    ? 'bg-blue-600 text-white ring-blue-100 animate-pulse'
                    : isRejected
                    ? 'bg-rose-600 text-white ring-rose-100'
                    : 'bg-slate-100 text-slate-400 border border-slate-300'
                }`}
              >
                {isCompleted && <CheckCircle2 className="w-4 h-4" />}
                {isCurrent && <Clock className="w-4 h-4" />}
                {isRejected && <AlertCircle className="w-4 h-4" />}
                {isPending && <Circle className="w-3 h-3 text-slate-300" />}
              </div>

              {/* Step Content */}
              <div className="ml-4 flex-1">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                  <h4
                    className={`text-sm font-bold ${
                      isCurrent
                        ? 'text-blue-700'
                        : isRejected
                        ? 'text-rose-700'
                        : isCompleted
                        ? 'text-slate-900'
                        : 'text-slate-600'
                    }`}
                  >
                    {step.title}
                  </h4>

                  {step.timestamp && (
                    <time className="text-xs text-slate-600 font-medium">
                      {new Date(step.timestamp).toLocaleDateString('en-IN', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </time>
                  )}
                </div>

                <p className="text-xs text-slate-600 mt-0.5">{step.description}</p>

                {step.admin_remarks && (
                  <div className="mt-2 p-2.5 rounded-lg bg-slate-50 border border-slate-200 text-xs text-slate-700">
                    <span className="font-semibold text-slate-900">Official Remark: </span>
                    {step.admin_remarks}
                  </div>
                )}
              </div>

            </div>
          );
        })}
      </div>
    </div>
  );
};
