import { onMounted, onUnmounted } from "vue";
import { useHistoryStore } from "@/store/history";

export function useUndoRedoShortcuts() {
  const historyStore = useHistoryStore();

  const handleKeydown = (event) => {
    // Only handle shortcuts if we're not in an input/textarea/contenteditable
    const activeElement = document.activeElement;
    const isInInput = activeElement && (
      activeElement.tagName === "INPUT" ||
      activeElement.tagName === "TEXTAREA" ||
      activeElement.contentEditable === "true"
    );

    if (isInInput) {
      return;
    }

    // Check for Ctrl key (Windows/Linux) or Cmd key (Mac)
    const isCtrlOrCmd = event.ctrlKey || event.metaKey;

    if (isCtrlOrCmd && event.key === "z") {
      event.preventDefault();
      
      if (event.shiftKey) {
        // Ctrl+Shift+Z = Redo
        historyStore.redo();
      } else {
        // Ctrl+Z = Undo
        historyStore.undo();
      }
    }

    // Alternative redo shortcut: Ctrl+Y
    if (isCtrlOrCmd && event.key === "y") {
      event.preventDefault();
      historyStore.redo();
    }
  };

  onMounted(() => {
    document.addEventListener("keydown", handleKeydown);
  });

  onUnmounted(() => {
    document.removeEventListener("keydown", handleKeydown);
  });

  return {
    undo: () => historyStore.undo(),
    redo: () => historyStore.redo(),
    canUndo: () => historyStore.canUndo,
    canRedo: () => historyStore.canRedo,
  };
}
