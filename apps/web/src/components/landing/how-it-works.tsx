import { UserPlus, Search, Users, Bell } from "lucide-react";

const STEPS = [
  {
    number: 1,
    icon: UserPlus,
    title: "Sign Up Free",
    description: "Create your account in seconds.",
    metric: "< 30s",
  },
  {
    number: 2,
    icon: Search,
    title: "Explore Markets",
    description: "Filter thousands of markets by volume, price, category.",
    metric: "2,500+",
  },
  {
    number: 3,
    icon: Users,
    title: "Follow Whales",
    description: "Track top traders with verified performance metrics.",
    metric: "500+",
  },
  {
    number: 4,
    icon: Bell,
    title: "Set Alerts",
    description: "Get notified via email, push, Telegram, or Discord.",
    metric: "Real-time",
  },
];

export function HowItWorks() {
  return (
    <section className="relative py-20 overflow-hidden">
      {/* Subtle grid background */}
      <div className="absolute inset-0 -z-10 opacity-30">
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: `linear-gradient(rgba(16,185,129,0.03) 1px, transparent 1px),
                              linear-gradient(90deg, rgba(16,185,129,0.03) 1px, transparent 1px)`,
            backgroundSize: "60px 60px",
          }}
        />
      </div>

      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <p className="text-primary font-mono text-sm mb-2 tracking-wider">
            {"// WORKFLOW"}
          </p>
          <h2 className="text-3xl font-bold mb-4">How It Works</h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Get started in minutes. Professional-grade tools, zero complexity.
          </p>
        </div>

        <div className="max-w-5xl mx-auto">
          <div className="grid md:grid-cols-4 gap-6">
            {STEPS.map((step, index) => (
              <div key={step.number} className="relative group">
                {/* Connector line */}
                {index < STEPS.length - 1 && (
                  <div className="hidden md:block absolute top-8 left-1/2 w-full h-px bg-gradient-to-r from-primary/50 to-primary/10" />
                )}

                <div className="relative z-10 p-6 rounded-lg border border-border/50 bg-card/50 backdrop-blur-sm transition-all duration-200 hover:border-primary/30 hover:shadow-[0_0_20px_rgba(16,185,129,0.1)]">
                  {/* Step number badge */}
                  <div className="absolute -top-3 left-4 bg-primary text-primary-foreground text-xs font-mono font-bold px-2 py-1 rounded">
                    0{step.number}
                  </div>

                  {/* Icon */}
                  <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4 mt-2 group-hover:bg-primary/20 transition-colors">
                    <step.icon className="h-6 w-6 text-primary" />
                  </div>

                  <h3 className="font-semibold mb-2">{step.title}</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    {step.description}
                  </p>

                  {/* Metric */}
                  <div className="pt-3 border-t border-border/50">
                    <span className="font-mono text-lg font-bold text-primary">
                      {step.metric}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
