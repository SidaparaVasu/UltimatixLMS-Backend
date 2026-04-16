import React from 'react';
import { Drawer } from '@/components/ui/drawer';
import { cn } from '@/utils/cn';

interface FullScreenBuilderDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  headerContent?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}

/**
 * A specialized wrapper for the Course Builder that expands the 
 * standard Drawer into a distraction-free, 100vw/100vh workspace.
 * Replaces the default modal header with a custom 'BuilderHeader'.
 */
export const FullScreenBuilderDrawer: React.FC<FullScreenBuilderDrawerProps> = ({
  open,
  onOpenChange,
  headerContent,
  children,
  className,
}) => {
  return (
    <Drawer
      open={open}
      onOpenChange={onOpenChange}
      fullScreen={true}
      className={cn("builder-mode-drawer", className)}
    >
      <div className="flex flex-col h-full bg-[#f8fafc]">
        {/* Custom Builder Header injected here */}
        {headerContent}
        
        {/* The Main Builder Content Area */}
        <div className="flex flex-1 overflow-hidden">
          {children}
        </div>
      </div>
    </Drawer>
  );
};
