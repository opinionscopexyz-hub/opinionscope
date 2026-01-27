import Link from "next/link";
import { Twitter, MessageCircle, Activity } from "lucide-react";

export function Footer() {
  return (
    <footer className="border-t border-border/50 py-12 bg-card/30">
      <div className="container mx-auto px-4">
        <div className="grid md:grid-cols-4 gap-8">
          {/* Brand */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                <Activity className="h-4 w-4 text-primary" />
              </div>
              <span className="font-bold text-lg">OpinionScope</span>
            </div>
            <p className="text-sm text-muted-foreground mb-4">
              Professional prediction market intelligence for serious traders.
            </p>
            {/* Live status */}
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
              <span className="font-mono">All systems operational</span>
            </div>
          </div>

          {/* Product */}
          <div>
            <h4 className="font-mono text-xs text-primary tracking-wider mb-4">
              PRODUCT
            </h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>
                <Link
                  href="/screener"
                  className="hover:text-primary transition-colors"
                >
                  Market Screener
                </Link>
              </li>
              <li>
                <Link
                  href="/whales"
                  className="hover:text-primary transition-colors"
                >
                  Whale Tracker
                </Link>
              </li>
              <li>
                <Link
                  href="/feed"
                  className="hover:text-primary transition-colors"
                >
                  Activity Feed
                </Link>
              </li>
              <li>
                <Link
                  href="/pricing"
                  className="hover:text-primary transition-colors"
                >
                  Pricing
                </Link>
              </li>
            </ul>
          </div>

          {/* Company */}
          <div>
            <h4 className="font-mono text-xs text-primary tracking-wider mb-4">
              COMPANY
            </h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>
                <a
                  href="/about"
                  className="hover:text-primary transition-colors"
                >
                  About
                </a>
              </li>
              <li>
                <a
                  href="/blog"
                  className="hover:text-primary transition-colors"
                >
                  Blog
                </a>
              </li>
              <li>
                <a
                  href="mailto:support@opinionscope.xyz"
                  className="hover:text-primary transition-colors"
                >
                  Contact
                </a>
              </li>
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h4 className="font-mono text-xs text-primary tracking-wider mb-4">
              LEGAL
            </h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>
                <Link
                  href="/privacy"
                  className="hover:text-primary transition-colors"
                >
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link
                  href="/terms"
                  className="hover:text-primary transition-colors"
                >
                  Terms of Service
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom */}
        <div className="flex flex-col md:flex-row items-center justify-between mt-12 pt-8 border-t border-border/50">
          <p className="text-sm text-muted-foreground font-mono">
            &copy; {new Date().getFullYear()} OpinionScope
          </p>

          <div className="flex items-center gap-4 mt-4 md:mt-0">
            <a
              href="https://x.com/OpinionScope"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Follow us on Twitter"
              className="w-9 h-9 rounded-lg bg-muted/50 flex items-center justify-center text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors cursor-pointer"
            >
              <Twitter className="h-4 w-4" />
            </a>
            <a
              href="https://discord.gg/uKZR5UsTq7"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Join our Discord"
              className="w-9 h-9 rounded-lg bg-muted/50 flex items-center justify-center text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors cursor-pointer"
            >
              <MessageCircle className="h-4 w-4" />
            </a>
            
          </div>
        </div>
      </div>
    </footer>
  );
}
