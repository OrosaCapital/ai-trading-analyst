export function LoadingSpinner() {
  return (
    <div className="flex items-center justify-center py-8 text-sm text-gray-400">
      <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-gray-400 border-t-transparent" />
      Loading market data…
    </div>
  );
}
