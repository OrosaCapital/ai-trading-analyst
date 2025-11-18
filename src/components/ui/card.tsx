import type { PropsWithChildren, ReactNode } from "react";

interface CardProps extends PropsWithChildren {
  title?: ReactNode;
  className?: string;
}

export function Card({ title, className = "", children }: CardProps) {
  return (
    <div className={`rounded-xl border border-gray-800 bg-gray-900/60 p-4 ${className}`}>
      {title && <div className="mb-2 text-sm font-semibold uppercase tracking-wide text-gray-400">{title}</div>}
      {children}
    </div>
  );
}

// Shadcn-compatible exports
export function CardHeader({ className = "", children }: PropsWithChildren<{ className?: string }>) {
  return <div className={`mb-4 ${className}`}>{children}</div>;
}

export function CardTitle({ className = "", children }: PropsWithChildren<{ className?: string }>) {
  return <h3 className={`text-lg font-semibold ${className}`}>{children}</h3>;
}

export function CardDescription({ className = "", children }: PropsWithChildren<{ className?: string }>) {
  return <p className={`text-sm text-gray-500 ${className}`}>{children}</p>;
}

export function CardContent({ className = "", children }: PropsWithChildren<{ className?: string }>) {
  return <div className={className}>{children}</div>;
}
