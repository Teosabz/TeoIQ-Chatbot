import { useCallback, useEffect, useState } from "react";
import { useDropzone, type FileRejection } from "react-dropzone";
import { ImageUp, Loader2, ScanLine, Trash2, X } from "lucide-react";
import { toast } from "sonner";
import { ModeSelector } from "@/components/ModeSelector";
import { inspectChart } from "@/lib/quality";
import type { TradingMode } from "@/lib/engine/modes";

const MAX_SIZE = 10 * 1024 * 1024;

interface UploadCardProps {
  onAnalyze: (file: File, mode: TradingMode) => void;
  loading: boolean;
}

export function UploadCard({ onAnalyze, loading }: UploadCardProps) {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  const [mode, setMode] = useState<TradingMode>("day");
  const [quality, setQuality] = useState<string | null>(null);
  const [checking, setChecking] = useState(false);

  useEffect(() => {
    if (!file) {
      setPreview(null);
      return;
    }
    const url = URL.createObjectURL(file);
    setPreview(url);
    setProgress(0);
    let p = 0;
    const id = setInterval(() => {
      p = Math.min(100, p + 12);
      setProgress(p);
      if (p >= 100) clearInterval(id);
    }, 40);
    return () => {
      clearInterval(id);
      URL.revokeObjectURL(url);
    };
  }, [file]);

  const onDrop = useCallback((accepted: File[], rejected: FileRejection[]) => {
    if (rejected.length) {
      const code = rejected[0].errors[0]?.code;
      toast.error(
        code === "file-too-large"
          ? "File too large — maximum size is 10MB."
          : "Invalid file type — upload a PNG, JPG or JPEG chart screenshot.",
      );
      return;
    }
    const picked = accepted[0];
    if (!picked) return;
    setFile(picked);
    setQuality(null);
    setChecking(true);
    // Reject blurry / cropped screenshots before spending an analysis on them.
    void inspectChart(picked).then((report) => {
      setChecking(false);
      if (!report.ok) {
        setQuality(report.reason);
        toast.error("Chart quality too low — upload a clearer screenshot.");
      }
    });
  }, []);

  const { getRootProps, getInputProps, isDragActive, open } = useDropzone({
    onDrop,
    accept: { "image/png": [".png"], "image/jpeg": [".jpg", ".jpeg"] },
    maxSize: MAX_SIZE,
    multiple: false,
    maxFiles: 1,
    noClick: true,
    disabled: loading,
  });

  return (
    <section className="panel flex flex-col gap-4 p-4 sm:gap-5 sm:p-6 lg:sticky lg:top-6">
      <div className="flex items-center justify-between">
        <h2 className="flex items-center gap-2 text-lg font-semibold">
          <ImageUp className="size-5 text-primary" aria-hidden />
          Upload Chart
        </h2>
        <span className="rounded-full border border-border bg-surface-2/70 px-2.5 py-1 font-mono text-[10px] tracking-wide text-muted-foreground uppercase">
          PNG · JPG · 10MB
        </span>
      </div>

      <div
        {...getRootProps()}
        onClick={loading ? undefined : open}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (!loading && (e.key === "Enter" || e.key === " ")) open();
        }}
        className={`relative flex min-h-56 cursor-pointer flex-col items-center justify-center gap-3 overflow-hidden rounded-2xl border-2 border-dashed p-4 text-center transition-all duration-300 sm:min-h-64 ${
          isDragActive
            ? "scale-[1.01] border-primary bg-primary/10"
            : "border-border bg-surface-2/40 hover:border-primary/60 hover:bg-primary/5"
        } ${loading ? "pointer-events-none" : ""}`}
      >
        <input {...getInputProps()} />
        {preview ? (
          <>
            <img
              src={preview}
              alt="Selected MetaTrader chart preview"
              className="max-h-64 w-full rounded-xl object-contain"
            />
            {loading && (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-background/70 backdrop-blur-sm">
                <Loader2 className="size-7 animate-spin text-primary" aria-hidden />
                <p className="text-sm font-medium">Analyzing chart…</p>
                <span className="h-0.5 w-40 overflow-hidden rounded-full bg-surface-2">
                  <span className="block h-full w-1/3 animate-[scan_1.4s_linear_infinite] rounded-full bg-primary" />
                </span>
              </div>
            )}
          </>
        ) : (
          <>
            <div className="flex size-14 items-center justify-center rounded-2xl bg-primary/15 text-primary ring-1 ring-primary/25">
              <ImageUp className="size-7" aria-hidden />
            </div>
            <p className="font-medium">Drag &amp; drop your MT4 / MT5 screenshot</p>
            <p className="text-sm text-muted-foreground">or click to browse your files</p>
          </>
        )}
      </div>

      <ModeSelector value={mode} onChange={setMode} disabled={loading} />

      {quality && (
        <p className="rounded-xl border border-warning/40 bg-warning/10 px-3 py-2 text-xs leading-snug text-warning">
          {quality}
        </p>
      )}

      {file && (
        <div className="glass flex flex-col gap-2 rounded-xl px-4 py-3">
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0">
              <p className="truncate text-sm font-medium">{file.name}</p>
              <p className="font-mono text-xs text-muted-foreground">
                {(file.size / 1024 / 1024).toFixed(2)} MB
              </p>
            </div>
            <button
              type="button"
              onClick={() => setFile(null)}
              disabled={loading}
              aria-label="Remove selected file"
              className="inline-flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-destructive disabled:opacity-50"
            >
              <Trash2 className="size-3.5" aria-hidden />
              Remove
            </button>
          </div>
          <span className="h-1 w-full overflow-hidden rounded-full bg-surface-2">
            <span
              className="block h-full rounded-full bg-accent transition-[width] duration-200"
              style={{ width: `${progress}%` }}
            />
          </span>
        </div>
      )}

      <button
        type="button"
        disabled={!file || loading || checking || !!quality}
        onClick={() => file && onAnalyze(file, mode)}
        className="inline-flex h-13 items-center justify-center gap-2 rounded-xl bg-primary px-6 py-4 text-base font-semibold text-primary-foreground shadow-[var(--shadow-glow)] transition-all hover:brightness-110 active:scale-[.99] disabled:cursor-not-allowed disabled:opacity-45 disabled:shadow-none"
      >
        {loading ? (
          <>
            <Loader2 className="size-5 animate-spin" aria-hidden />
            Analyzing chart…
          </>
        ) : (
          <>
            <ScanLine className="size-5" aria-hidden />
            Analyze Chart — FREE
          </>
        )}
      </button>

      <ul className="grid grid-cols-3 gap-2 text-center">
        {["ICT / SMC", "Wyckoff", "Liquidity"].map((t) => (
          <li
            key={t}
            className="rounded-lg border border-border bg-surface-2/50 px-2 py-1.5 text-[11px] font-medium text-muted-foreground"
          >
            {t}
          </li>
        ))}
      </ul>

      <p className="hidden text-xs text-muted-foreground sm:block">
        <X className="mr-1 inline size-3" aria-hidden />
        Images are analyzed in memory and never stored on the server.
      </p>
    </section>
  );
}
