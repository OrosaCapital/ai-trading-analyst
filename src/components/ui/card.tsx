import type { PropsWithChildren, ReactNode } from "react";

interface CardProps extends PropsWithChildren {
  title?: ReactNode;
  className?: string;
}

export function Card({ title, className = "", children }: CardProps) {
  return (
    <div className={`rounded-xl border border-border bg-card p-4 backdrop-blur-sm ${className}`}>
      {title && <div className="mb-2 text-sm font-semibold uppercase tracking-wide text-muted-foreground">{title}</div>}
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
  return <p className={`text-sm text-muted-foreground ${className}`}>{children}</p>;
}

export function CardContent({ className = "", children }: PropsWithChildren<{ className?: string }>) {
  return <div className={className}>{children}</div>;
}
