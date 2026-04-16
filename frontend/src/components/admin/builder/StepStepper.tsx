import React from 'react';
import { Settings, LayoutGrid, CheckCircle2, ChevronRight, BrainCircuit } from 'lucide-react';
import { cn } from '@/utils/cn';

export interface Step {
  id: string;
  label: string;
  icon: React.ElementType;
}

interface StepStepperProps {
  steps: Step[];
  currentStepIndex: number;
  onStepChange?: (index: number) => void;
  className?: string;
}

export const BUILDER_STEPS: Step[] = [
  { id: 'settings', label: 'Course Settings', icon: Settings },
  { id: 'curriculum', label: 'Curriculum Builder', icon: LayoutGrid },
  { id: 'skills', label: 'Competency Mapping', icon: BrainCircuit },
  { id: 'publish', label: 'Finalize & Publish', icon: CheckCircle2 },
];

/**
 * A specialized stepper for the Course Builder wizard.
 * Provides clear visual feedback on the progress of the course creation.
 */
export const StepStepper: React.FC<StepStepperProps> = ({
  steps,
  currentStepIndex,
  onStepChange,
  className,
}) => {
  return (
    <div className={cn("flex items-center gap-1", className)}>
      {steps.map((step, idx) => {
        const Icon = step.icon;
        const isActive = idx === currentStepIndex;
        const isCompleted = idx < currentStepIndex;

        return (
          <React.Fragment key={step.id}>
            <button
              onClick={() => onStepChange?.(idx)}
              className={cn(
                "group flex items-center gap-2 px-3 py-1.5 rounded-full transition-all duration-300",
                isActive 
                  ? "bg-[var(--color-accent-subtle)] text-[var(--color-accent)] ring-1 ring-inset ring-[var(--color-accent)]" 
                  : isCompleted 
                    ? "text-green-600 hover:bg-green-50" 
                    : "text-slate-400 hover:bg-slate-50"
              )}
            >
              <div className={cn(
                "p-1 rounded-full transition-colors",
                isActive ? "bg-white text-[var(--color-accent)]" : "bg-transparent"
              )}>
                <Icon size={14} />
              </div>
              <span className={cn(
                "text-[10px] font-bold uppercase tracking-wider",
                isActive ? "text-[var(--color-accent)]" : "text-inherit"
              )}>
                {step.label}
              </span>
            </button>
            {idx < steps.length - 1 && (
              <ChevronRight size={14} className="text-slate-200" />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
};
