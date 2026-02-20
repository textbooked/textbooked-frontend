"use client";

import Image from "next/image";
import Link from "next/link";
import { CircleHelp, LogOut, Moon, Settings, Sun, UserCircle2 } from "lucide-react";
import { signIn, signOut, useSession } from "next-auth/react";

import { useTheme } from "@/components/theme/theme-provider";
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
  const { theme, toggleTheme } = useTheme();

  const userName = session?.user?.name || session?.user?.email || "Signed in";
  const userEmail = session?.user?.email ?? "";
  const avatarLetter = userName.charAt(0).toUpperCase();
  const avatarUrl = session?.user?.image;

  if (status === "loading") {
    return (
      <Button type="button" variant="outline" size="sm" disabled>
        Checking auth...
      </Button>
    );
  }

  if (status !== "authenticated") {
    return (
      <Button type="button" size="sm" onClick={() => signIn("google")}>
        Sign in with Google
      </Button>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          className="relative z-[60] cursor-pointer rounded-full p-0 hover:translate-y-0 active:translate-y-0 focus-visible:border-transparent focus-visible:ring-0"
          aria-label="Open account menu"
        >
          <AccountAvatar
            userName={userName}
            avatarUrl={avatarUrl}
            avatarLetter={avatarLetter}
          />
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent
        align="end"
        side="bottom"
        className="w-64"
      >
        <DropdownMenuLabel className="py-1">
          <div className="flex min-h-8 min-w-0 items-center">
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold leading-4 text-muted-foreground">
                {userName}
              </p>
              {userEmail ? (
                <p className="truncate text-xs leading-4 text-muted-foreground/90">
                  {userEmail}
                </p>
              ) : null}
            </div>
          </div>
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

        <DropdownMenuItem onSelect={() => toggleTheme()}>
          {theme === "dark" ? <Moon className="size-4" /> : <Sun className="size-4" />}
          Theme: {theme === "dark" ? "Dark" : "Light"}
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

type AccountAvatarProps = {
  userName: string;
  avatarUrl?: string | null;
  avatarLetter: string;
};

function AccountAvatar({
  userName,
  avatarUrl,
  avatarLetter,
}: AccountAvatarProps) {
  const wrapperSizeClass = "h-8 w-8";
  const imageSize = 32;

  return (
    <span
      className={`relative flex ${wrapperSizeClass} items-center justify-center overflow-hidden rounded-full bg-muted text-xs font-semibold text-foreground ring-[3px] ring-foreground/25 dark:ring-white/55 shadow-[0_3px_12px_hsl(var(--foreground)/0.08)] dark:shadow-[0_0_14px_hsl(0_0%_100%/0.16)]`}
    >
      {avatarUrl ? (
        <Image
          src={avatarUrl}
          alt={userName}
          width={imageSize}
          height={imageSize}
          className={`${wrapperSizeClass} rounded-full object-cover`}
        />
      ) : (
        avatarLetter || <UserCircle2 className="size-4" />
      )}
    </span>
  );
}
