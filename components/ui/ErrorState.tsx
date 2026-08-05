import { Button } from "./Button";

export function ErrorState({
  title = "Something went wrong",
  description = "Please try again.",
  onRetry,
}: {
  title?: string;
  description?: string;
  onRetry?: () => void;
}) {
  return (
    <div
      role="alert"
      className="rounded-xl border border-red-200 bg-red-50 p-6 text-red-950 dark:border-red-900 dark:bg-red-950 dark:text-red-50"
    >
      <h2 className="font-semibold">{title}</h2>
      <p className="mt-2">{description}</p>
      {onRetry && (
        <Button className="mt-4" onClick={onRetry}>
          Try again
        </Button>
      )}
    </div>
  );
}
