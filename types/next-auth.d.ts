import { type DefaultSession } from "next-auth";
import "next-auth";
import "next-auth/jwt";

declare module "next-auth" {
  /**
   * Returned by `useSession`, `getSession` and received as a prop on the `SessionProvider` React Context
   */
  interface Session {
    apiToken?: string;
    user: DefaultSession["user"] & {
      /** Optional placeholder field kept for compatibility. */
      address?: string;
    };
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    apiToken?: string;
    apiTokenExp?: number;
    givenName?: string;
    familyName?: string;
    locale?: string;
    emailVerified?: boolean;
  }
}
