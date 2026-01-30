"use client";

import { SignInButton, SignOutButton, useUser } from "@clerk/nextjs";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useCurrentUser } from "@/hooks/use-current-user";
import { LogOut, User } from "lucide-react";
import Image from "next/image";

export function UserButton() {
  const { isSignedIn, user } = useUser();
  const { isLoading } = useCurrentUser();

  if (!isSignedIn) {
    return (
      <SignInButton mode="modal">
        <Button variant="outline" size="sm">
          Sign In
        </Button>
      </SignInButton>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <button
            className="relative h-8 w-8 rounded-full p-0 bg-transparent border-none cursor-pointer hover:bg-accent disabled:opacity-50"
            disabled={isLoading}
            aria-label="Open user menu"
          >
            {user?.imageUrl ? (
              <Image
                src={user.imageUrl}
                alt={user.fullName ?? "User"}
                width={32}
                height={32}
                className="h-8 w-8 rounded-full object-cover"
              />
            ) : (
              <User className="h-4 w-4" />
            )}
            {/* {tierBadge && (
              <span className="absolute -bottom-1 -right-1 rounded-full bg-primary px-1 text-[10px] font-bold text-primary-foreground">
                {tierBadge}
              </span>
            )} */}
          </button>
        }
      />
      <DropdownMenuContent className="w-56" align="end">

        {/* <DropdownMenuItem
          render={<a href="#" />}
        >
          <Settings className="mr-2 h-4 w-4" />
          Settings
        </DropdownMenuItem>
        <DropdownMenuItem
          render={<a href="#" />}
        >
          <CreditCard className="mr-2 h-4 w-4" />
          Billing
        </DropdownMenuItem>
        <DropdownMenuSeparator /> */}
        <SignOutButton>
          <DropdownMenuItem className="cursor-pointer">
            <LogOut className="mr-2 h-4 w-4" />
            Sign out
          </DropdownMenuItem>
        </SignOutButton>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
