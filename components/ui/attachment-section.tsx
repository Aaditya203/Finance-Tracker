"use client";

import React, { useRef, useState } from "react";
import { Attachment } from "@/types";
import {
  Paperclip,
  FileText,
  FileImage,
  ExternalLink,
  UploadCloud,
  Loader2,
  AlertCircle,
  CheckCircle2,
} from "lucide-react";

interface AttachmentSectionProps {
  attachments?: Attachment[];
  onUpload: (file: File) => Promise<void>;
  title?: string;
  disabled?: boolean;
}

const ALLOWED_TYPES = ["image/jpeg", "image/jpg", "image/png", "application/pdf"];
const ALLOWED_EXTENSIONS = [".jpg", ".jpeg", ".png", ".pdf"];

export function AttachmentSection({
  attachments = [],
  onUpload,
  title = "Attachments",
  disabled = false,
}: AttachmentSectionProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const validateAndUpload = async (file: File) => {
    setError(null);
    setSuccess(null);

    const ext = file.name.toLowerCase().substring(file.name.lastIndexOf("."));
    const isValid = ALLOWED_TYPES.includes(file.type) || ALLOWED_EXTENSIONS.includes(ext);

    if (!isValid) {
      setError("Invalid file format. Please upload JPG, PNG, or PDF.");
      return;
    }

    try {
      setIsUploading(true);
      await onUpload(file);
      setSuccess(`"${file.name}" uploaded successfully!`);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
      setTimeout(() => setSuccess(null), 4000);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to upload attachment.";
      setError(message);
    } finally {
      setIsUploading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      validateAndUpload(file);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (disabled || isUploading) return;
    const file = e.dataTransfer.files?.[0];
    if (file) {
      validateAndUpload(file);
    }
  };

  const isImage = (mime: string, name: string) =>
    mime.startsWith("image/") || /\.(jpg|jpeg|png)$/i.test(name);

  return (
    <div className="rounded-xl border border-[var(--color-parchment-shadow)] bg-[var(--color-surface)] p-4 space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Paperclip className="h-4 w-4 text-[var(--color-harvest-flame)]" />
          <h4 className="text-xs font-semibold uppercase tracking-wider text-[var(--color-ink-black)]">
            {title} ({attachments.length})
          </h4>
        </div>
      </div>

      {/* List of existing attachments */}
      {attachments.length > 0 ? (
        <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
          {attachments.map((att) => (
            <div
              key={att.id}
              className="flex items-center justify-between gap-3 rounded-xl border border-[var(--color-parchment-shadow)]/70 bg-[var(--color-cream-canvas)]/60 p-2.5 hover:bg-[var(--color-cream-canvas)] transition-colors"
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[var(--color-harvest-flame)]/10 text-[var(--color-harvest-flame)]">
                  {isImage(att.mimeType, att.fileName) ? (
                    <FileImage className="h-4 w-4" />
                  ) : (
                    <FileText className="h-4 w-4" />
                  )}
                </div>
                <div className="min-w-0">
                  <p className="truncate text-xs font-medium text-[var(--color-ink-black)]">
                    {att.fileName}
                  </p>
                  {att.createdAt && (
                    <p className="text-[10px] text-[var(--color-driftwood)]">
                      {new Date(att.createdAt).toLocaleDateString("en-GB", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                      })}
                    </p>
                  )}
                </div>
              </div>
              <a
                href={att.fileUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 shrink-0 text-xs font-semibold text-[var(--color-harvest-flame)] hover:underline cursor-pointer"
              >
                <span>View</span>
                <ExternalLink className="h-3 w-3" />
              </a>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-xs text-[var(--color-driftwood)]">No attachments uploaded yet.</p>
      )}

      {/* Upload zone */}
      {disabled ? (
        <div className="rounded-xl border border-[var(--color-parchment-shadow)]/80 bg-[var(--color-cream-canvas)]/50 p-3 text-center text-xs text-[var(--color-driftwood)] font-medium">
          🔒 Only the partner who paid/recorded this entry can upload attachments.
        </div>
      ) : (
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setIsDragging(true);
          }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={handleDrop}
          onClick={() => !isUploading && fileInputRef.current?.click()}
          className={`relative flex flex-col items-center justify-center rounded-xl border-2 border-dashed p-3.5 text-center transition-all ${
            isDragging
              ? "border-[var(--color-harvest-flame)] bg-[var(--color-cream-canvas)]"
              : "border-[var(--color-bone)]/60 bg-[var(--color-cream-canvas)]/30 hover:border-[var(--color-harvest-flame)]/60 hover:bg-[var(--color-cream-canvas)]"
          } ${isUploading ? "opacity-60 cursor-not-allowed" : "cursor-pointer"}`}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".jpg,.jpeg,.png,.pdf,image/jpeg,image/png,application/pdf"
            onChange={handleFileChange}
            disabled={isUploading}
            className="hidden"
          />

          {isUploading ? (
            <div className="flex items-center gap-2 text-xs font-semibold text-[var(--color-harvest-flame)]">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>Uploading to Google Drive...</span>
            </div>
          ) : (
            <div className="flex items-center gap-2 text-xs font-medium text-[var(--color-warm-stone)]">
              <UploadCloud className="h-4 w-4 text-[var(--color-harvest-flame)]" />
              <span>
                Click or drag receipt/file to upload{" "}
                <span className="text-[10px] text-[var(--color-driftwood)] block sm:inline">(JPG, PNG, PDF)</span>
              </span>
            </div>
          )}
        </div>
      )}

      {/* Status Messages */}
      {error && (
        <div className="flex items-center gap-2 text-xs font-semibold text-red-400 bg-red-950/40 p-2.5 rounded-lg border border-red-900">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}
      {success && (
        <div className="flex items-center gap-2 text-xs font-semibold text-[var(--color-success)] bg-emerald-950/40 p-2.5 rounded-lg border border-emerald-900">
          <CheckCircle2 className="h-4 w-4 shrink-0" />
          <span>{success}</span>
        </div>
      )}
    </div>
  );
}
