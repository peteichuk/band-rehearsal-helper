interface EmptyStateProps {
  title: string;
  message?: string;
}

export function EmptyState({ title, message }: EmptyStateProps) {
  return (
    <div className="text-center py-8">
      <p className="text-gray-500 dark:text-gray-400">{title}</p>
      {message && <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">{message}</p>}
    </div>
  );
}
