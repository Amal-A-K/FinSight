import { LoadingContainer } from "@/components/ui/loading-container";

export default function Loading() {
  return (
    <div className="max-w-4xl mx-auto mt-8">
      <h1 className="text-2xl font-bold mb-4">All Transactions</h1>
      <LoadingContainer message="Loading transactions..." />
    </div>
  );
}
