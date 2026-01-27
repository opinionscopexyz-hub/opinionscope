"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PriceAlertForm } from "./price-alert-form";
import { WhaleAlertForm } from "./whale-alert-form";
import { Plus } from "lucide-react";

export function CreateAlertDialog() {
  const [open, setOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<"price" | "whale">("price");

  const handleSuccess = () => {
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <Button size="sm">
            <Plus className="h-4 w-4 mr-2" />
            New Alert
          </Button>
        }
      />
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Create Alert</DialogTitle>
        </DialogHeader>

        <Tabs
          value={activeTab}
          onValueChange={(v) => setActiveTab(v as "price" | "whale")}
        >
          <TabsList className="w-full">
            <TabsTrigger value="price" className="flex-1">
              Price Alert
            </TabsTrigger>
            <TabsTrigger value="whale" className="flex-1">
              Whale Alert
            </TabsTrigger>
          </TabsList>

          <TabsContent value="price" className="mt-4">
            <PriceAlertForm onSuccess={handleSuccess} />
          </TabsContent>

          <TabsContent value="whale" className="mt-4">
            <WhaleAlertForm onSuccess={handleSuccess} />
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
