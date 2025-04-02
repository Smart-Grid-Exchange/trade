"use server";

import {prisma} from "@repo/db";

type UserSignupCreds = {
  password: string;
  username: string;
};

export async function create_user(credentials: UserSignupCreds) {
  try {
    const resp = await prisma.user.create({
      data: {
        password: credentials.password,
        username: credentials.username,
      },
      select: {
        password: true,
        username: true,
      },
    });

    return resp;
  } catch (err) {
    console.log(err);
  }
}