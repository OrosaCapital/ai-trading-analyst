interface ErrorStateProps {
  message: string;
}

export function ErrorState({ message }: ErrorStateProps) {
  return (
    <div className="flex items-center justify-center py-8 text-sm text-red-400">
      <div className="rounded-md bg-red-950/30 border border-red-800 px-4 py-3">
        {message}
      </div>
    </div>
  );
}
