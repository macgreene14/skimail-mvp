"use client";
import { hotjar } from "react-hotjar";
import { useEffect } from "react";

export default function HotJar() {
  const siteId = 3640552;
  const hotjarVersion = 6;
  useEffect(() => {
    hotjar.initialize(siteId, hotjarVersion);
  }, []);
  return;
}
