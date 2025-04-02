import type { NextAuthOptions, SessionStrategy } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import {prisma} from "@repo/db";
import { JWT } from "next-auth/jwt";

export const auth_options:NextAuthOptions = {
    providers:[
        CredentialsProvider({
            id: "credentials",
            name: "play/Chess",
            type: "credentials",
            credentials:{
                username: {label: "Email",type:"username",placeholder:"johndoe123@domain.com"},
                password: {label: "Password", type: "password", placeholder: "Your super secret password"}
            },
            async authorize(credentials){
                if(!credentials){
                    throw new Error("Credentials unavailable");
                }

                const existing_user = await prisma.user.findUnique({
                    where:{
                        username: credentials.username,
                    },
                    select:{
                        id: true,
                        username: true,
                        password: true,
                    }
                });

                if(!existing_user){
                    throw new Error("User not found");
                }


                if(credentials.password !== existing_user.password)
                {
                    throw new Error("User not found");
                }

                return {
                    ...existing_user,
                    id: existing_user.id.toString(),
                }
            }
        }),
    ],
    secret: process.env.NEXTAUTH_SECRET || "sec4et",
    pages: {
        signIn: "/signin"
    },
    session: {
        strategy: "jwt" as SessionStrategy
    },
    callbacks: {
        async jwt({
            token,
            trigger,
            session,
            user,
            account
        }){
            if(trigger === "update"){
                return {
                    ...token,
                    username: session?.username ?? token.username,
                } as JWT;
            }

            if(!account){
                return {
                    ...token,
                } as JWT;
            }

            if(account.type === "credentials"){
                return {
                    ...token,
                    // @ts-expect-error gonna silence this soon
                    username: user.username,
                } as JWT;
            }

            return token;
        },
        async session({session,token,}){
            return {
                ...session,
                ...token
            }
        }
    }
}
