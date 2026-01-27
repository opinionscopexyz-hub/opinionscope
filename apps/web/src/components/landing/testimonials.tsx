import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { TrendingUp, BadgeCheck } from "lucide-react";

const TESTIMONIALS = [
  {
    quote:
      "Finally, a tool that shows me what the smart money is doing. I've caught multiple 10x moves just by following the right whales.",
    author: "Alex T.",
    role: "Full-time Trader",
    metric: "+340%",
    metricLabel: "ROI this quarter",
    verified: true,
  },
  {
    quote:
      "The screener is incredible. What used to take me hours of research now takes seconds. Worth every penny of the Pro subscription.",
    author: "Sarah M.",
    role: "Crypto Analyst",
    metric: "4h → 10m",
    metricLabel: "Research time",
    verified: true,
  },
  {
    quote:
      "The 30-second early access has been a game changer. I'm consistently getting better entries than before.",
    author: "Michael R.",
    role: "Pro+ Member",
    metric: "30s",
    metricLabel: "Edge advantage",
    verified: true,
  },
];

export function Testimonials() {
  return (
    <section className="py-20">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <p className="text-primary font-mono text-sm mb-2 tracking-wider">
            // VERIFIED RESULTS
          </p>
          <h2 className="text-3xl font-bold mb-4">Trusted by Traders</h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Real results from traders using OpinionScope daily.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {TESTIMONIALS.map((testimonial, index) => (
            <Card
              key={index}
              className="border-border/50 bg-card/50 backdrop-blur-sm hover:border-primary/30 hover:shadow-[0_0_20px_rgba(16,185,129,0.1)] transition-all duration-200"
            >
              <CardContent className="pt-6">
                {/* Metric highlight */}
                <div className="flex items-center gap-2 mb-4 pb-4 border-b border-border/50">
                  <TrendingUp className="h-4 w-4 text-primary" />
                  <span className="font-mono text-2xl font-bold text-primary">
                    {testimonial.metric}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {testimonial.metricLabel}
                  </span>
                </div>

                <p className="text-muted-foreground mb-6 text-sm leading-relaxed">
                  &quot;{testimonial.quote}&quot;
                </p>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-10 w-10 border border-border">
                      <AvatarFallback className="bg-primary/10 text-primary font-mono text-sm">
                        {testimonial.author
                          .split(" ")
                          .map((n) => n[0])
                          .join("")}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="font-medium text-sm flex items-center gap-1">
                        {testimonial.author}
                        {testimonial.verified && (
                          <BadgeCheck className="h-3.5 w-3.5 text-primary" />
                        )}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {testimonial.role}
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
