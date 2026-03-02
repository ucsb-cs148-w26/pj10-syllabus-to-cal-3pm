'use client';

import { useState, useRef, useEffect } from 'react';
import { Plus, X, Loader2 } from 'lucide-react';

interface CreateCalendarDialogProps {
  accessToken: string;
  onCalendarCreated?: (id: string, summary: string) => void;
}

export function CreateCalendarDialog({
  accessToken,
  onCalendarCreated,
}: CreateCalendarDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const dialogRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      inputRef.current?.focus();
    }
  }, [isOpen]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dialogRef.current && !dialogRef.current.contains(e.target as Node)) {
        handleClose();
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen]);

  function handleClose() {
    setIsOpen(false);
    setName('');
    setDescription('');
    setError(null);
  }

  async function handleCreate() {
    if (!name.trim()) {
      setError('Calendar name is required');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/calendar/calendars', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          summary: name.trim(),
          description: description.trim() || undefined,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error ?? 'Failed to create calendar');
      }

      onCalendarCreated?.(data.calendar.id, data.calendar.summary);
      handleClose();
    } catch (err) {
      console.error('[CreateCalendarDialog]', err);
      setError(err instanceof Error ? err.message : 'Failed to create calendar');
    } finally {
      setIsLoading(false);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      void handleCreate();
    }
  }

  return (
    <>
      {/* Create button */}
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs font-medium text-gray-700 transition-colors hover:bg-gray-50 hover:border-gray-300 hover:text-gray-900"
        title="Create a new Google Calendar"
      >
        <Plus className="h-4 w-4" />
        <span className="hidden sm:inline">New Calendar</span>
        <span className="sm:hidden">New</span>
      </button>

      {/* Modal backdrop and dialog */}
      {isOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 animate-[fadeIn_150ms_ease-out]"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              handleClose();
            }
          }}
        >
          <div
            ref={dialogRef}
            className="w-full max-w-sm rounded-2xl border border-gray-200 bg-white shadow-xl animate-[slideUp_200ms_ease-out]"
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
              <h2 className="text-lg font-semibold text-gray-900">Create Calendar</h2>
              <button
                type="button"
                onClick={handleClose}
                className="text-gray-400 transition-colors hover:text-gray-600"
                aria-label="Close dialog"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Content */}
            <div className="space-y-4 px-6 py-4">
              {/* Calendar name field */}
              <div>
                <label
                  htmlFor="calendar-name"
                  className="block text-sm font-medium text-gray-700 mb-1.5"
                >
                  Calendar Name <span className="text-red-500">*</span>
                </label>
                <input
                  ref={inputRef}
                  id="calendar-name"
                  type="text"
                  value={name}
                  onChange={(e) => {
                    setName(e.target.value);
                    if (error) setError(null);
                  }}
                  onKeyDown={handleKeyDown}
                  placeholder="e.g., [Course] Schedule"
                  disabled={isLoading}
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent disabled:bg-gray-50 disabled:text-gray-400"
                />
              </div>

              {/* Description field */}
              <div>
                <label
                  htmlFor="calendar-description"
                  className="block text-sm font-medium text-gray-700 mb-1.5"
                >
                  Description (Optional)
                </label>
                <textarea
                  id="calendar-description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="e.g., Syllabus events and assignments"
                  disabled={isLoading}
                  rows={3}
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent disabled:bg-gray-50 disabled:text-gray-400 resize-none"
                />
              </div>

              {/* Error message */}
              {error && (
                <div className="rounded-lg bg-rose-50 border border-rose-200 px-3 py-2.5">
                  <p className="text-xs text-rose-700">{error}</p>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="flex items-center justify-end gap-2 border-t border-gray-100 px-6 py-4">
              <button
                type="button"
                onClick={handleClose}
                disabled={isLoading}
                className="px-4 py-2 text-sm font-medium text-gray-700 border border-gray-200 rounded-lg transition-colors hover:bg-gray-50 disabled:text-gray-400 disabled:hover:bg-transparent"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => void handleCreate()}
                disabled={isLoading || !name.trim()}
                className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg transition-colors hover:bg-indigo-700 disabled:bg-indigo-400 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Creating…
                  </>
                ) : (
                  <>
                    <Plus className="h-4 w-4" />
                    Create
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
