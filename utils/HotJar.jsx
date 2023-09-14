"use client";
import Hotjar from "@hotjar/browser";
import { useEffect } from "react";

const siteId = process.env.NEXT_PUBLIC_HOTJAR_ID;
const hotjarVersion = 6;

export default function HotJar() {
  useEffect(() => {
    Hotjar.init(siteId, hotjarVersion);
  }, []);
  return;
}
