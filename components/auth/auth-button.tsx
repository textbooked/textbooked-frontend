"use client";

import Image from "next/image";
import { LogOut, UserCircle2 } from "lucide-react";
import { signIn, signOut, useSession } from "next-auth/react";

import { Button } from "@/components/ui/button";

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
  const avatarLetter = userName.charAt(0).toUpperCase();
  const avatarUrl = session.user?.image;

  return (
    <div className="flex items-center gap-2">
      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted text-xs font-semibold text-foreground">
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
      </div>
      <Button type="button" variant="outline" size="sm" onClick={() => void signOut()}>
        <LogOut className="size-4" />
        Sign out
      </Button>
    </div>
  );
}
