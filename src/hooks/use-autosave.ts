import { useEffect, useRef, useCallback } from "react";
import { UseFormReturn } from "react-hook-form";

interface UseAutosaveOptions {
  form: UseFormReturn<any>;
  onSave: (data: any) => Promise<void>;
  enabled?: boolean;
  debounceMs?: number;
}

export function useAutosave({
  form,
  onSave,
  enabled = true,
  debounceMs = 2000,
}: UseAutosaveOptions) {
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isSavingRef = useRef(false);
  const lastSavedDataRef = useRef<string>("");

  const saveData = useCallback(async (data: any) => {
    if (isSavingRef.current) return;

    const dataString = JSON.stringify(data);
    if (dataString === lastSavedDataRef.current) return;

    try {
      isSavingRef.current = true;
      await onSave(data);
      lastSavedDataRef.current = dataString;
    } catch (error) {
      console.error("Autosave failed:", error);
    } finally {
      isSavingRef.current = false;
    }
  }, [onSave]);

  useEffect(() => {
    if (!enabled) return;

    const subscription = form.watch((data) => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      timeoutRef.current = setTimeout(() => {
        saveData(data);
      }, debounceMs);
    });

    return () => {
      subscription.unsubscribe();
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [form, saveData, enabled, debounceMs]);

  return {
    save: () => saveData(form.getValues()),
  };
}
