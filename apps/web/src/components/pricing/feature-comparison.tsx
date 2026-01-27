"use client";

import { Check, X } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Fragment } from "react";

const FEATURES = [
  {
    category: "Market Screener",
    features: [
      { name: "Basic filters", free: true, pro: true, proPlus: true },
      { name: "Custom expressions", free: false, pro: true, proPlus: true },
      { name: "Saved presets", free: "1", pro: "10", proPlus: "Unlimited" },
      {
        name: "CSV export",
        free: "10 rows",
        pro: "100/day",
        proPlus: "Unlimited",
      },
    ],
  },
  {
    category: "Whale Tracker",
    features: [
      {
        name: "Leaderboard access",
        free: "Top 10",
        pro: "Top 50",
        proPlus: "All",
      },
      { name: "Recent trades visible", free: "3", pro: "10", proPlus: "50" },
      { name: "Follow whales", free: "3", pro: "20", proPlus: "Unlimited" },
      { name: "Performance charts", free: false, pro: false, proPlus: true },
    ],
  },
  {
    category: "Activity Feed",
    features: [
      { name: "Feed access", free: true, pro: true, proPlus: true },
      {
        name: "Feed delay",
        free: "15 min",
        pro: "Real-time",
        proPlus: "Real-time",
      },
      { name: "Early access", free: false, pro: false, proPlus: "+30 seconds" },
      { name: "Filter by amount", free: false, pro: true, proPlus: true },
    ],
  },
  {
    category: "Alerts",
    features: [
      { name: "Total alerts", free: "3", pro: "50", proPlus: "Unlimited" },
      { name: "Email notifications", free: true, pro: true, proPlus: true },
      { name: "Push notifications", free: false, pro: true, proPlus: true },
      { name: "Telegram/Discord", free: false, pro: true, proPlus: true },
    ],
  },
];

export function FeatureComparison() {
  const renderValue = (value: boolean | string) => {
    if (value === true) {
      return <Check className="h-4 w-4 text-green-600 mx-auto" />;
    }
    if (value === false) {
      return <X className="h-4 w-4 text-muted-foreground mx-auto" />;
    }
    return <span className="text-sm">{value}</span>;
  };

  return (
    <div className="mt-16">
      <h2 className="text-2xl font-bold text-center mb-8">Feature Comparison</h2>

      <div className="max-w-4xl mx-auto overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[40%]">Feature</TableHead>
              <TableHead className="text-center">Free</TableHead>
              <TableHead className="text-center">Pro</TableHead>
              <TableHead className="text-center">Pro+</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {FEATURES.map((category) => (
              <Fragment key={category.category}>
                <TableRow>
                  <TableCell colSpan={4} className="bg-muted font-medium">
                    {category.category}
                  </TableCell>
                </TableRow>
                {category.features.map((feature) => (
                  <TableRow key={feature.name}>
                    <TableCell>{feature.name}</TableCell>
                    <TableCell className="text-center">
                      {renderValue(feature.free)}
                    </TableCell>
                    <TableCell className="text-center">
                      {renderValue(feature.pro)}
                    </TableCell>
                    <TableCell className="text-center">
                      {renderValue(feature.proPlus)}
                    </TableCell>
                  </TableRow>
                ))}
              </Fragment>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
