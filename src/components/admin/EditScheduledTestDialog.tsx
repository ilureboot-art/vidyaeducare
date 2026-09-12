"use client";

import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { type ScheduledTest } from "@/lib/test-schedule";
import { 
  validateScheduleEdit, 
  extractTimeString, 
  combineDateAndTime,
  formatDuration 
} from "@/lib/test-schedule-utils";
import { format } from "date-fns";
import { Calendar as CalendarIcon, AlertCircle, Loader2 } from "lucide-react";

interface EditScheduledTestDialogProps {
  isOpen: boolean;
  test: ScheduledTest | null;
  onClose: () => void;
  onSave: (changes: Pick<ScheduledTest, 'dateTime' | 'duration'>) => Promise<void>;
  isSaving?: boolean;
}

export function EditScheduledTestDialog({
  isOpen,
  test,
  onClose,
  onSave,
  isSaving = false,
}: EditScheduledTestDialogProps) {
  const [editDate, setEditDate] = useState<Date | undefined>(undefined);
  const [editTime, setEditTime] = useState('');
  const [editDuration, setEditDuration] = useState('');
  const [validationError, setValidationError] = useState<string | null>(null);
  const [isInternalSaving, setIsInternalSaving] = useState(false);

  // Initialize form when dialog opens
  useEffect(() => {
    if (isOpen && test) {
      const testDate = new Date(test.dateTime);
      setEditDate(testDate);
      setEditTime(extractTimeString(testDate));
      setEditDuration(String(test.duration));
      setValidationError(null);
    }
  }, [isOpen, test]);

  const handleSave = async () => {
    if (!editDate || !editTime || !test) {
      setValidationError("Please fill in all required fields.");
      return;
    }

    // Validate duration
    const durationNum = Number(editDuration);
    if (!Number.isInteger(durationNum)) {
      setValidationError("Duration must be a whole number of minutes.");
      return;
    }

    // Combine date and time
    const updatedDateTime = combineDateAndTime(editDate, editTime);
    if (!updatedDateTime) {
      setValidationError("Invalid date or time format.");
      return;
    }

    // Validate the schedule edit
    const validation = validateScheduleEdit(updatedDateTime, durationNum);
    if (!validation.valid) {
      setValidationError(validation.error || "Invalid schedule.");
      return;
    }

    setValidationError(null);
    setIsInternalSaving(true);

    try {
      const changes = {
        dateTime: updatedDateTime.toISOString(),
        duration: durationNum,
      };

      await onSave(changes);
      onClose();
    } catch (error) {
      setValidationError(
        error instanceof Error ? error.message : "Failed to save changes. Please try again."
      );
    } finally {
      setIsInternalSaving(false);
    }
  };

  if (!test) return null;

  const isSavingState = isSaving || isInternalSaving;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CalendarIcon className="w-5 h-5" />
            Edit Scheduled Test
          </DialogTitle>
          <DialogDescription>
            Update the date, time, and duration for this test session.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Test Set Info - Read Only */}
          <div className="bg-muted p-4 rounded-lg border border-muted-foreground/20">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
              Test Set Details
            </p>
            <p className="font-semibold text-base">{test.testSetName}</p>
            <div className="flex gap-3 mt-2 text-sm text-muted-foreground">
              <span className="px-2 py-1 bg-background rounded text-xs font-medium">
                {test.board}
              </span>
              <span className="px-2 py-1 bg-background rounded text-xs font-medium">
                {test.standard}
              </span>
              <span className="px-2 py-1 bg-background rounded text-xs font-medium">
                {test.subject}
              </span>
            </div>
          </div>

          {/* Current Status */}
          <div className="text-sm text-muted-foreground">
            <p className="text-xs font-semibold uppercase tracking-wide mb-1">Current Schedule</p>
            <p>{format(new Date(test.dateTime), "PPPP p")}</p>
            <p>Duration: {formatDuration(test.duration)}</p>
          </div>

          {/* Validation Error Alert */}
          {validationError && (
            <Alert variant="destructive" className="bg-destructive/10">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{validationError}</AlertDescription>
            </Alert>
          )}

          {/* Date Picker */}
          <div className="space-y-2">
            <Label htmlFor="edit-date" className="font-semibold">
              New Test Date <span className="text-destructive">*</span>
            </Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  id="edit-date"
                  variant="outline"
                  className="w-full justify-start text-left font-normal"
                  disabled={isSavingState}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {editDate ? format(editDate, "PPP") : "Pick a date"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar 
                  mode="single" 
                  selected={editDate} 
                  onSelect={setEditDate}
                  initialFocus
                  disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
                />
              </PopoverContent>
            </Popover>
          </div>

          {/* Time Input */}
          <div className="space-y-2">
            <Label htmlFor="edit-time" className="font-semibold">
              New Test Time <span className="text-destructive">*</span>
            </Label>
            <Input
              id="edit-time"
              type="time"
              value={editTime}
              onChange={(e) => setEditTime(e.target.value)}
              disabled={isSavingState}
              className="font-mono"
            />
          </div>

          {/* Duration Input */}
          <div className="space-y-2">
            <Label htmlFor="edit-duration" className="font-semibold">
              Duration (Minutes) <span className="text-destructive">*</span>
            </Label>
            <div className="flex items-center gap-2">
              <Input
                id="edit-duration"
                type="number"
                value={editDuration}
                onChange={(e) => setEditDuration(e.target.value)}
                disabled={isSavingState}
                min="1"
                max="300"
                className="font-mono"
              />
              <span className="text-sm text-muted-foreground whitespace-nowrap">
                {editDuration && Number.isInteger(Number(editDuration)) ? `(${formatDuration(Number(editDuration))})` : ''}
              </span>
            </div>
            <p className="text-xs text-muted-foreground">
              Between 1 and 300 minutes
            </p>
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button
            variant="outline"
            onClick={onClose}
            disabled={isSavingState}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={!editDate || !editTime || !editDuration || isSavingState}
            className="gap-2"
          >
            {isSavingState && <Loader2 className="w-4 h-4 animate-spin" />}
            {isSavingState ? 'Saving...' : 'Save Changes'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
