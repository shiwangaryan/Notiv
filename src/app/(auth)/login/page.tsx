"use client";
import { useRouter } from "next/navigation";
import React, { useState } from "react";
import { SubmitHandler, useForm } from "react-hook-form";
import * as z from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { FormSchema } from "@/lib/types";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormMessage,
} from "@/components/ui/form";
import Link from "next/link";
import Image from "next/image";
import NotivLogo from "../../../../public/notivlogo.svg";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import Loader from "@/components/global/loader";
import Loading from "../../../../public/loading.json";
import { twMerge } from "tailwind-merge";
import { actionLoginUser } from "@/lib/server-action/auth-actions";

const LoginPage = () => {
  const router = useRouter();
  const [submitError, setSubmiteError] = useState("");

  const form = useForm<z.infer<typeof FormSchema>>({
    mode: "onChange",
    resolver: zodResolver(FormSchema),
    defaultValues: { email: "", password: "" },
  });

  const isLoading = form.formState.isSubmitting;

  const onSubmit: SubmitHandler<z.infer<typeof FormSchema>> = async (
    formData
  ) => {
    const { error } = await actionLoginUser(formData);
    if (error) {
      form.reset();
      setSubmiteError(error.message);
    }
    router.replace("/dashboard");
  };
  return (
    <Form {...form}>
      <form
        onChange={() => {
          if (submitError) setSubmiteError("");
        }}
        onSubmit={form.handleSubmit(onSubmit)}
        className="w-full
    sm:justify-center
    sm:w-[400px]
    space-y-6
    flex
    flex-col"
      >
        <Link
          href="/"
          className="w-full
        flex
        justify-left
        items-center"
        >
          <Image src={NotivLogo} alt="Notiv Logo" width={50} height={50} />
          <span
            className="font-semibold
          dark:text-white
          text-4xl
          ml-2
          "
          >
            notiv.
          </span>
        </Link>
        <FormDescription className="text-foreground/60">
          An all-In-One Collaboration and Productivity Platform
        </FormDescription>
        <FormField
          disabled={isLoading}
          control={form.control}
          name="email"
          render={(field) => (
            <FormItem>
              <FormControl>
                <Input type="email" placeholder="Email" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        ></FormField>
        <FormField
          disabled={isLoading}
          control={form.control}
          name="password"
          render={(field) => (
            <FormItem>
              <FormControl>
                <Input type="password" placeholder="Password" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        ></FormField>
        {submitError && <FormMessage>{submitError}</FormMessage>}
        <div
          className="w-full
        hover:p-[2.5px]
        rounded-[8px]
        bg-gradient-to-r
        from-primary-blue-200
        to-primary-purple-600
        transition-all duration-300 ease-in-out"
        >
          <Button
            type="submit"
            className="w-full p-6 text-[17px] hover:bg-white"
            size="lg"
            disabled={isLoading}
          >
            {!isLoading ? "Login" : <Loader />}
          </Button>
        </div>
        <span className="self-center">
          Don't have an account?
          <Link href={"/signup"} className="text-primary-blue-300">
            {" "}
            Sign up
          </Link>
        </span>
      </form>
    </Form>
  );
};

export default LoginPage;