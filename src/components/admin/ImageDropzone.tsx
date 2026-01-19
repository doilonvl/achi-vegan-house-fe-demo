"use client";

import * as React from "react";
import { UploadCloud, X } from "lucide-react";
import { cn } from "@/lib/utils";

type ImageDropzoneProps = {
  name: string;
  label: string;
  description?: string;
  multiple?: boolean;
  accept?: string;
};

type PreviewItem = {
  file: File;
  url: string;
};

export default function ImageDropzone({
  name,
  label,
  description,
  multiple = false,
  accept = "image/*",
}: ImageDropzoneProps) {
  const inputRef = React.useRef<HTMLInputElement | null>(null);
  const [files, setFiles] = React.useState<File[]>([]);
  const [isDragging, setIsDragging] = React.useState(false);

  const previews = React.useMemo<PreviewItem[]>(
    () =>
      files.map((file) => ({
        file,
        url: URL.createObjectURL(file),
      })),
    [files]
  );

  React.useEffect(() => {
    return () => {
      previews.forEach((preview) => URL.revokeObjectURL(preview.url));
    };
  }, [previews]);

  const setInputFiles = React.useCallback((nextFiles: File[]) => {
    const dataTransfer = new DataTransfer();
    nextFiles.forEach((file) => dataTransfer.items.add(file));
    if (inputRef.current) {
      inputRef.current.files = dataTransfer.files;
    }
  }, []);

  const applyFiles = React.useCallback(
    (incoming: FileList | File[]) => {
      const list = Array.from(incoming).filter((file) => file.size > 0);
      const filtered = accept.includes("image")
        ? list.filter((file) => file.type.startsWith("image/"))
        : list;
      const next = multiple ? filtered : filtered.slice(0, 1);
      setFiles(next);
      setInputFiles(next);
    },
    [accept, multiple, setInputFiles]
  );

  const handleChange = React.useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      if (!event.target.files) return;
      applyFiles(event.target.files);
    },
    [applyFiles]
  );

  const handleDrop = React.useCallback(
    (event: React.DragEvent<HTMLDivElement>) => {
      event.preventDefault();
      setIsDragging(false);
      if (event.dataTransfer.files?.length) {
        applyFiles(event.dataTransfer.files);
      }
    },
    [applyFiles]
  );

  const handleRemove = React.useCallback(
    (index: number) => {
      const next = files.filter((_, idx) => idx !== index);
      setFiles(next);
      setInputFiles(next);
    },
    [files, setInputFiles]
  );

  return (
    <div className="grid gap-2">
      <label className="text-sm font-medium">{label}</label>
      <div
        className={cn(
          "flex min-h-28 cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border border-dashed bg-muted/20 px-4 py-6 text-center text-sm text-muted-foreground transition",
          isDragging ? "border-primary bg-primary/10 text-primary" : ""
        )}
        onClick={() => inputRef.current?.click()}
        onDragOver={(event) => {
          event.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        role="button"
        tabIndex={0}
        onKeyDown={(event) => {
          if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            inputRef.current?.click();
          }
        }}
      >
        <UploadCloud className="size-5" />
        <div>
          <p className="font-medium text-foreground">
            Drag & drop or click to upload
          </p>
          <p className="text-xs text-muted-foreground">
            {multiple ? "You can select multiple files." : "Single image only."}
          </p>
        </div>
        <input
          ref={inputRef}
          type="file"
          name={name}
          accept={accept}
          multiple={multiple}
          onChange={handleChange}
          className="sr-only"
        />
      </div>
      {description ? (
        <p className="text-xs text-muted-foreground">{description}</p>
      ) : null}
      {previews.length ? (
        <div
          className={cn(
            "grid gap-3",
            multiple ? "sm:grid-cols-2" : ""
          )}
        >
          {previews.map((preview, index) => (
            <div
              key={`${preview.file.name}-${preview.file.size}-${index}`}
              className="relative overflow-hidden rounded-lg border bg-background"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={preview.url}
                alt={preview.file.name}
                className="h-40 w-full object-cover"
              />
              <button
                type="button"
                onClick={() => handleRemove(index)}
                className="absolute right-2 top-2 rounded-full bg-white/90 p-1 text-muted-foreground shadow hover:text-foreground"
                aria-label="Remove image"
              >
                <X className="size-4" />
              </button>
              <div className="truncate px-3 py-2 text-xs text-muted-foreground">
                {preview.file.name}
              </div>
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );
}
