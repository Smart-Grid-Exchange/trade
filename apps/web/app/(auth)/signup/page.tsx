"use client";

import { valibotResolver } from "@hookform/resolvers/valibot";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import { useForm } from "react-hook-form";
import * as v from "valibot";

import { create_user } from "./actions";

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
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

const user_signup_form_schema = v.object({
    username: v.string(),
    password: v.string(),
})


type FormValue = v.InferOutput<typeof user_signup_form_schema>;

export default function Signup() {
  const router = useRouter();
  const form = useForm<FormValue>({
    resolver: valibotResolver(user_signup_form_schema),
    defaultValues: {
      username: "",
      password: "",
    },
  });

  const {
    control,
    handleSubmit,
    formState: { isSubmitting, isDirty, isLoading },
  } = form;

  async function onSubmit(values: FormValue) {
    try {
      const user = await create_user(values);

      if (user === undefined) {
        toast("Could not create user");

        return;
      }

      const creds = {
        username: user.username,
        password: user.password,
      };
      const resp = await signIn<"credentials">("credentials", {
        ...creds,
        redirect: false,
      });

      if (resp?.ok) {
        router.push("/home");
        window.localStorage.setItem("token", "valid");
      } else {
        form.setError("root", { message: "Could not create user" });
      }
    } catch (err) {
      console.log(err);
      toast("Signin failed!!");
    }
  }

  return (
    <div>
      <Navbar />
      <div className="flex flex-col items-center p-6 ">
        {/* register form */}
        <h2 className="scroll-m-20 border-b pb-2 m-6 text-3xl font-semibold tracking-tight first:mt-0 ">
          Welcome to chat.city !
        </h2>

        <Card className="px-6 divide-y divide-stone-800">
          <div className=" w-[500px] ">
            <CardHeader>
              <CardTitle>Sign Up to start chatting</CardTitle>
              <CardDescription>Your peers are waiting for you!</CardDescription>
            </CardHeader>
            <Form {...form}>
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-8 p-4">
                <CardContent>
                  <FormField
                    control={control}
                    name="username"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Username</FormLabel>
                        <FormControl>
                          <div className="flex border-[1.5px] rounded-md">
                            <p className="text-sm text-muted-foreground px-2 mt-3">
                              chat.city/
                            </p>
                            <Input
                              type="text"
                              placeholder="Username"
                              {...field}
                            />
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={control}
                    name="password"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Password</FormLabel>
                        <FormControl>
                          <Input
                            type="password"
                            placeholder="Password"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
                <CardFooter className="">
                  <Button
                    disabled={!isDirty || isLoading || isSubmitting}
                    type="submit"
                    className="w-full mx-4"
                  >
                    Sign up
                  </Button>
                </CardFooter>
              </form>
            </Form>
          </div>
        </Card>

        <Button variant={"link"} onClick={() => router.push("/login")}>
          Already have an account?
        </Button>
      </div>
    </div>
  );
}