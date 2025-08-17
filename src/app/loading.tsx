import { LoadingContainer } from "@/components/ui/loading-container";

export default function Loading() {
  return (
    <div className="max-w-6xl mx-auto p-4 sm:p-6 lg:p-8">
      <h1 className="text-2xl sm:text-3xl font-bold mb-6">FinSight</h1>
      <LoadingContainer message="Loading dashboard..." />
    </div>
  );
}
