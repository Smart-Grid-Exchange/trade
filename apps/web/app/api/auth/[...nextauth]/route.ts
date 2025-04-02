import NextAuth from "next-auth";

import { auth_options as NEXTAUTH_CONFIG } from "@/lib/auth";

const provider = NextAuth(NEXTAUTH_CONFIG);

export { provider as GET, provider as POST };