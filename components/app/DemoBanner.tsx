import { DEMO_MODE } from "@/lib/demo/config";

/** A small, persistent banner so it's always clear this is demo data. */
export function DemoBanner() {
  if (!DEMO_MODE) return null;
  return (
    <div className="bg-flame-500 px-4 py-1.5 text-center text-xs font-medium text-canvas-50">
      Demo mode · sample data, no real backend · nothing here is stored
    </div>
  );
}
