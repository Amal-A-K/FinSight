"use client";

import { Button } from "./button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "./dialog";
import { AlertTriangle, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface ConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  description: string;
  confirmText?: string;
  cancelText?: string;
  isDeleting?: boolean;
}

export function ConfirmationModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  confirmText = "Delete",
  cancelText = "Cancel",
  isDeleting = false,
}: ConfirmationModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent
        className={cn(
          "sm:max-w-[425px] bg-white dark:bg-violet-950/95 border-violet-200 dark:border-violet-800/80",
          "ring-1 ring-violet-100 dark:ring-violet-800/50"
        )}
      >
        <DialogHeader>
          <div
            className="mx-auto flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-violet-100 dark:bg-violet-900/40 sm:mx-0"
          >
            <AlertTriangle
              className="h-6 w-6 text-violet-600 dark:text-violet-300"
              aria-hidden="true"
            />
          </div>
          <DialogTitle
            className={cn(
              "mt-3 text-center sm:text-left text-lg font-semibold",
              "text-gray-900 dark:text-violet-50"
            )}
          >
            {title}
          </DialogTitle>
          <DialogDescription className="mt-2 text-center sm:text-left text-gray-600 dark:text-violet-200/90">
            {description}
          </DialogDescription>
        </DialogHeader>
        <div className="mt-5 sm:mt-4 sm:flex sm:flex-row-reverse">
          <Button
            type="button"
            className={cn(
              "inline-flex w-full justify-center rounded-md px-4 py-2 text-sm font-semibold text-white shadow-sm",
              "bg-violet-600 hover:bg-violet-700 dark:bg-violet-600 dark:hover:bg-violet-500",
              "sm:ml-3 sm:w-auto transition-colors duration-200",
              isDeleting && "opacity-70 cursor-not-allowed"
            )}
            onClick={onConfirm}
            disabled={isDeleting}
          >
            {isDeleting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                Deleting...
              </>
            ) : (
              confirmText
            )}
          </Button>
          <Button
            type="button"
            className={cn(
              "mt-3 inline-flex w-full justify-center rounded-md px-4 py-2 text-sm font-medium shadow-sm",
              "bg-white hover:bg-gray-50 dark:bg-violet-900/40 dark:hover:bg-violet-900/60",
              "text-gray-700 dark:text-violet-100 border border-gray-300 dark:border-violet-800/60",
              "sm:mt-0 sm:w-auto transition-colors duration-200",
              isDeleting && "opacity-70 cursor-not-allowed"
            )}
            onClick={onClose}
            disabled={isDeleting}
          >
            {cancelText}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
