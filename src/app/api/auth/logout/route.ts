import { NextResponse } from "next/server";

export async function POST() {
  const isProd = process.env.NODE_ENV === "production";
  const res = NextResponse.json({ ok: true });

  const clear = (name: string) =>
    res.cookies.set(name, "", {
      httpOnly: true,
      secure: isProd,
      sameSite: "strict",
      path: "/",
      maxAge: 0,
    });

  clear("access_token");
  clear("refresh_token");

  return res;
}
