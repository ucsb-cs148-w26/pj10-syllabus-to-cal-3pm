import { Suspense } from "react";
import ProtectedGate from "./protected-gate";

export default function ProtectedPage() {
  return (
    <Suspense fallback={<div className="p-6">Loading...</div>}>
      <ProtectedGate />
    </Suspense>
  );
}
