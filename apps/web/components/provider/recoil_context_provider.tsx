"use client";
import React from "react";
import { RecoilRoot } from "recoil";

export default function RecoilContextProvider({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return <RecoilRoot>{children}</RecoilRoot>;
}