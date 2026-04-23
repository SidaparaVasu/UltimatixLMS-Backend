/**
 * Attaches DRM-style restrictions to a container element:
 *   1. Disable right-click context menu
 *   2. Disable text selection (CSS + JS)
 *   3. Block keyboard shortcuts: Ctrl/Cmd + C, P, S, U, A, PrintScreen
 *   4. Block print via beforeprint event
 *   5. Disable drag-start
 *
 * Usage:
 *   const containerRef = useDocumentProtection<HTMLDivElement>();
 *   return <div ref={containerRef}>...</div>
 *
 * Print blocking is also enforced via a global CSS rule injected once.
 */

import { useEffect, useRef, useCallback } from 'react';

const BLOCKED_KEYS = new Set(['c', 'p', 's', 'u', 'a']);

// Inject a global <style> once to block @media print
let printStyleInjected = false;
function injectPrintBlockStyle() {
  if (printStyleInjected || typeof document === 'undefined') return;
  const style = document.createElement('style');
  style.id = 'doc-protection-print-block';
  style.textContent = `
    @media print {
      body * { visibility: hidden !important; display: none !important; }
    }
  `;
  document.head.appendChild(style);
  printStyleInjected = true;
}

export function useDocumentProtection<T extends HTMLElement = HTMLDivElement>() {
  const containerRef = useRef<T>(null);

  // Block keyboard shortcuts
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    const isModifier = e.ctrlKey || e.metaKey;
    const key = e.key.toLowerCase();

    // Block Ctrl/Cmd + C/P/S/U/A
    if (isModifier && BLOCKED_KEYS.has(key)) {
      e.preventDefault();
      e.stopPropagation();
      return;
    }

    // Block PrintScreen
    if (e.key === 'PrintScreen') {
      e.preventDefault();
      e.stopPropagation();
    }
  }, []);

  // Block print dialog
  const handleBeforePrint = useCallback((e: Event) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // 1. Inject global print-block CSS
    injectPrintBlockStyle();

    // 2. Disable right-click
    const handleContextMenu = (e: MouseEvent) => e.preventDefault();
    container.addEventListener('contextmenu', handleContextMenu);

    // 3. Disable drag
    const handleDragStart = (e: DragEvent) => e.preventDefault();
    container.addEventListener('dragstart', handleDragStart);

    // 4. Keyboard shortcuts — attach to document (not container)
    //    so it catches events even when focus is inside an iframe
    document.addEventListener('keydown', handleKeyDown, true);

    // 5. Block print
    window.addEventListener('beforeprint', handleBeforePrint);

    return () => {
      container.removeEventListener('contextmenu', handleContextMenu);
      container.removeEventListener('dragstart', handleDragStart);
      document.removeEventListener('keydown', handleKeyDown, true);
      window.removeEventListener('beforeprint', handleBeforePrint);
    };
  }, [handleKeyDown, handleBeforePrint]);

  return containerRef;
}
