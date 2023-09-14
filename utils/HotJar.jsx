"use client";
import { hotjar } from "react-hotjar";
import { useEffect } from "react";

const siteId = process.env.NEXT_PUBLIC_HOTJAR_ID;

export default function HotJar() {
  const hotjarVersion = 6;
  useEffect(() => {
    hotjar.initialize(siteId, hotjarVersion);
  }, []);
  return;
}
