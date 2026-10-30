import { Suspense } from "react";

import { ReadingScreen } from "@/components/reading-screen";

export default function ReadingPage({ params }: { params: Promise<{ id: string }> }) {
  return (
    <Suspense fallback={<p className="text-muted-foreground px-6 py-8 text-sm">正在打开这则记录。</p>}>
      <ReadingGate params={params} />
    </Suspense>
  );
}

async function ReadingGate({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <ReadingScreen id={id} />;
}
