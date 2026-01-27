import { Card } from "@/components/ui/card";
import { SlidersHorizontal } from "lucide-react";

export default function ScreenerPage() {
  return (
    <div className="container mx-auto px-4 py-20 relative">
      {/* Grid background */}
      <div className="absolute inset-0 -z-10 opacity-30 pointer-events-none">
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: `linear-gradient(rgba(16,185,129,0.03) 1px, transparent 1px),
                              linear-gradient(90deg, rgba(16,185,129,0.03) 1px, transparent 1px)`,
            backgroundSize: "60px 60px",
          }}
        />
      </div>

      <Card className="p-12 text-center max-w-lg mx-auto border-border/50 bg-card/50 backdrop-blur-sm hover:border-primary/30 hover:shadow-[0_0_20px_rgba(16,185,129,0.1)] transition-all duration-200">
        <p className="text-primary font-mono text-sm mb-6 tracking-wider">
          {"// MARKET_SCREENER"}
        </p>
        <SlidersHorizontal className="h-16 w-16 mx-auto mb-6 text-primary" />
        <h1 className="text-2xl font-bold mb-3">Coming Soon</h1>
        <p className="text-muted-foreground">
          Filter and discover prediction markets with powerful screening tools.
          Stay tuned!
        </p>
      </Card>
    </div>
  );
}
