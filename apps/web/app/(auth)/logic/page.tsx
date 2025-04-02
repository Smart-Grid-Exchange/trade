"use client";

import { useRouter } from "next/navigation";
import { signIn, useSession } from "next-auth/react";
import { useLayoutEffect, useState } from "react";

import Navbar from "@/components/navbar";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

export default function Login() {
  const session = useSession();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const router = useRouter();

  // a little shady
  useLayoutEffect(() => {
    if (session.status === "authenticated") router.push("/home");
  }, [router, session.status]);

  async function joinRoom() {
    try {
      const credentials = {
        email,
        password,
      };
      const resp = await signIn<"credentials">("credentials", {
        ...credentials,
        redirect: false,
      });

      if (resp && resp.ok) {
        router.push("/home");
      } else {
        toast("Sign in failed!!");
      }
    } catch (err) {
      console.log(err);
      toast("Error while Signing in",);
    }
  }

  return (
    <div>
      <Navbar />
      <div className="m-18 flex flex-col items-center">
        <h2 className="scroll-m-20 border-b pb-2 m-6 text-3xl font-semibold tracking-tight first:mt-0">
          Welcome Back !
        </h2>
        <Card className="w-[500px] divide-y space-y-2">
          <div className="w-full">
            <CardHeader>
              <CardTitle>Login</CardTitle>
              <CardDescription>
                Fill in the details to join your peers!{" "}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid w-full items-center gap-4">
                <div className="flex flex-col space-y-1.5">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    onChange={(e) => {
                      setEmail(e.target.value);
                    }}
                    value={email}
                    id="email"
                    placeholder="johndoe123@gmail.com"
                  />
                </div>
                <div className="flex flex-col space-y-1.5">
                  <Label htmlFor="password">Password</Label>
                  <Input
                    type="password"
                    onChange={(e) => {
                      setPassword(e.target.value);
                    }}
                    value={password}
                    id="password"
                    placeholder="your super secret password"
                  />
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex flex-col">
              <Button onClick={joinRoom} className="w-full mt-2">
                Log in
              </Button>
            </CardFooter>
          </div>
          
        </Card>
        <Button variant={"link"} onClick={() => router.push("/signup")}>
          Don&apos;t have an account ?
        </Button>
      </div>
    </div>
  );
}