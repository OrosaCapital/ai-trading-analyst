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
