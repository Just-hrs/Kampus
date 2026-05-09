import { createFileRoute } from "@tanstack/react-router";
import { lazy, Suspense } from "react";

const StudyPage = lazy(() => import("@/features/study234/StudyPage"));

export const Route = createFileRoute("/study")({
  component: StudyRoute,
});

function StudyRoute() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-background animate-pulse" />
      }
    >
      <StudyPage />
    </Suspense>
  );
}