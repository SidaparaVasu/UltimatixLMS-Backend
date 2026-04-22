import { cn } from "@/utils/cn";

interface DifficultyBadgeProps {
  level: 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED' | undefined;
  className?: string;
}

export const DifficultyBadge = ({ level, className }: DifficultyBadgeProps) => {
  if (!level) return null;

  const getBadgeStyles = (level: string) => {
    switch (level) {
      case 'BEGINNER':
        return 'bg-slate-100 text-slate-800 border-slate-200';
      case 'INTERMEDIATE':
        return 'bg-emerald-50 text-emerald-800 border-emerald-200';
      case 'ADVANCED':
        return 'bg-fuchsia-50 text-fuchsia-800 border-fuchsia-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getDisplayText = (level: string) => {
    switch (level) {
      case 'BEGINNER':
        return 'Beginner';
      case 'INTERMEDIATE':
        return 'Intermediate';
      case 'ADVANCED':
        return 'Advanced';
      default:
        return level;
    }
  };

  return (
    <span
      className={cn(
        "inline-flex items-center px-2 py-1 rounded-sm text-xs font-medium",
        getBadgeStyles(level),
        className
      )}
    >
      {getDisplayText(level)}
    </span>
  );
};