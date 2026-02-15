"use client";

import Link from "next/link";
import Image from "next/image";
import { CircleHelp, LogOut, Settings, UserCircle2 } from "lucide-react";
import { signIn, signOut, useSession } from "next-auth/react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function AuthButton() {
  const { data: session, status } = useSession();

  if (status === "loading") {
    return (
      <Button type="button" variant="outline" size="sm" disabled>
        Checking auth...
      </Button>
    );
  }

  if (status !== "authenticated") {
    return (
      <Button type="button" size="sm" onClick={() => void signIn("google")}>
        Sign in with Google
      </Button>
    );
  }

  const userName = session.user?.name || session.user?.email || "Signed in";
  const userEmail = session.user?.email ?? "";
  const avatarLetter = userName.charAt(0).toUpperCase();
  const avatarUrl = session.user?.image;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          className="rounded-full"
          aria-label="Open account menu"
        >
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-muted text-xs font-semibold text-foreground">
            {avatarUrl ? (
              <Image
                src={avatarUrl}
                alt={userName}
                width={32}
                height={32}
                className="h-8 w-8 rounded-full object-cover"
              />
            ) : (
              avatarLetter || <UserCircle2 className="size-4" />
            )}
          </span>
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel className="space-y-1 py-2">
          <p className="text-sm font-semibold text-muted-foreground">{userName}</p>
          {userEmail ? (
            <p className="truncate text-xs text-muted-foreground/90">{userEmail}</p>
          ) : null}
        </DropdownMenuLabel>

        <DropdownMenuSeparator />

        <DropdownMenuItem asChild>
          <Link href="/settings">
            <Settings className="size-4" />
            Settings
          </Link>
        </DropdownMenuItem>

        <DropdownMenuItem asChild>
          <Link href="/help">
            <CircleHelp className="size-4" />
            Help
          </Link>
        </DropdownMenuItem>

        <DropdownMenuSeparator />

        <DropdownMenuItem onSelect={() => void signOut()}>
          <LogOut className="size-4" />
          Sign out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
