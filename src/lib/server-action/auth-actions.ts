"use server";

import { z } from "zod";
import { FormSchema } from "../types";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import React from "react";

export async function actionLoginUser({
  email,
  password,
}: z.infer<typeof FormSchema>) {
  const supabase = createRouteHandlerClient({
    cookies,
  });
  const response = await supabase.auth.signInWithPassword({ email, password });
  return response;
}

export async function actionSignupUser({
  email,
  password,
}: z.infer<typeof FormSchema>) {
  const supabase = createRouteHandlerClient({
    cookies,
  });
  console.log(`email: ${email} and password: ${password}`);
  let { data: users, error } = await supabase
    .from("users")
    .select("*")
    .eq("email", email);

  if (users?.length)
    return { error: { message: "User already exists", error } };
  console.log(`user exist: ${users} and error: ${error}`);

  const response = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}api/auth/callback`,
    },
  });

  return response;
}
