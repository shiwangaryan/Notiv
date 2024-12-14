"use server";

import { z } from "zod";
import { FormSchema } from "../types";
import { createServerSupabaseClient } from "../supabase/create-client";

export async function actionLoginUser({
  email,
  password,
}: z.infer<typeof FormSchema>) {
  const supabase = await createServerSupabaseClient();
  const response = await supabase.auth.signInWithPassword({ email, password });
  return response;
}

export async function actionSignupUser({
  email,
  password,
}: z.infer<typeof FormSchema>) {
  const supabase = await createServerSupabaseClient();

  // let { data: users, error } = await supabase
  //   .from("users")
  //   .select()
  //   .eq("email", "shiwangaryan@gmail.com");
  // console.log(`email:${email}, type:${typeof email}`);

  // if (users?.length) return { error: { message: "User already exists", error } };
  // console.log(`user exist: ${users} and error: ${error}`);

  const response = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}api/auth/callback`,
    },
  });
  let { data: users, error } = await supabase
    .from("users")
    .select()
    .eq("email", email);
  console.log(`user exist: ${users} and error: ${error}`);
  console.log(`user mail: ${response.data.user?.email}`);

  return response;
}
