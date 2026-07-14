import { cn } from "@/lib/cn";

const sizes = {
  sm: "h-4 w-4 border-2",
  md: "h-6 w-6 border-2",
  lg: "h-10 w-10 border-[3px]",
} as const;

export type LoaderSize = keyof typeof sizes;

export interface LoaderProps {
  size?: LoaderSize;
  className?: string;
  label?: string;
}

export function Loader({ size = "md", className, label = "Loading" }: LoaderProps) {
  return (
    <div
      role="status"
      aria-label={label}
      className={cn(
        "animate-spin rounded-full border-muted border-t-primary",
        sizes[size],
        className,
      )}
    />
  );
}

export interface PageLoaderProps {
  label?: string;
}

export function PageLoader({ label = "Loading..." }: PageLoaderProps) {
  return (
    <div className="flex min-h-[200px] flex-1 items-center justify-center">
      <div className="flex flex-col items-center gap-3">
        <Loader size="lg" />
        <p className="text-sm text-muted">{label}</p>
      </div>
    </div>
  );
}
