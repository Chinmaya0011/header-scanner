import Link from "next/link";
import { MdSearchOff } from "react-icons/md";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-bg flex items-center justify-center">
      <div className="text-center">
        <MdSearchOff className="text-6xl text-muted mx-auto mb-4" />
        <h1 className="text-2xl font-bold text-text mb-2">Scan not found</h1>
        <p className="text-text-dim text-sm mb-6">
          This scan may have been deleted or the ID is invalid.
        </p>
        <Link
          href="/history"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-accent text-bg font-semibold text-sm hover:bg-accent-dim transition-colors"
        >
          View History
        </Link>
      </div>
    </div>
  );
}
