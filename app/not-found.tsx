import Link from "next/link";
import { EmptyState } from "@/components/ui/EmptyState";
import { routes } from "@/lib/routes";
export default function NotFound() {
  return (
    <EmptyState
      title="Page not found"
      description="The page you requested does not exist."
      action={
        <Link
          className="font-semibold text-violet-600 underline"
          href={routes.home}
        >
          Return home
        </Link>
      }
    />
  );
}
