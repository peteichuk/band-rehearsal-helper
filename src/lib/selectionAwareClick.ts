/**
 * Wraps a click handler so a click that's really the tail end of a
 * text-selection drag doesn't fire it — otherwise selecting lyrics/labels to
 * copy would also pop the note editor.
 */
export function selectionAwareClick(onClick: () => void) {
  return () => {
    if (window.getSelection()?.toString()) return;
    onClick();
  };
}
