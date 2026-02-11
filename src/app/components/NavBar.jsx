"use client";
import { Disclosure } from "@headlessui/react";
import { Bars3Icon, XMarkIcon } from "@heroicons/react/24/outline";
import Link from "next/link";
import "../globals.css";

const navigation = [
  { name: "Explore", href: "/" },
  { name: "About", href: "/about" },
  {
    name: "Feedback",
    href: "https://airtable.com/appa1Nkb8pG0dRNxk/shrJ1gvC7YwqziQwK",
    external: true,
  },
];

export function NavBar() {
  return (
    <Disclosure as="nav" className="sticky top-0 z-50 border-b border-white/10 bg-ski-950/95 backdrop-blur-md">
      {({ open }) => (
        <>
          <div className="mx-auto max-w-7xl px-3 sm:px-6 lg:px-8">
            <div className="relative flex h-12 items-center justify-center sm:h-14 sm:justify-between">
              {/* Mobile menu button — absolute left so logo stays centered */}
              <div className="absolute left-0 flex items-center sm:hidden">
                <Disclosure.Button
                  className="inline-flex items-center justify-center rounded-lg p-1.5 text-snow-200/70 transition-colors hover:bg-white/10 hover:text-white focus:outline-none focus:ring-2 focus:ring-white/20"
                  style={{ minHeight: "40px", minWidth: "40px" }}
                >
                  <span className="sr-only">Open main menu</span>
                  {open ? (
                    <XMarkIcon className="h-5 w-5" aria-hidden="true" />
                  ) : (
                    <Bars3Icon className="h-5 w-5" aria-hidden="true" />
                  )}
                </Disclosure.Button>
              </div>

              {/* Logo — centered on mobile, left-aligned on desktop */}
              <div className="flex items-center sm:flex-1">
                <Link href="/about" className="flex items-center gap-2">
                  <img
                    className="h-8 w-auto sm:h-9"
                    src="https://ik.imagekit.io/bamlnhgnz/logo_invert.png?updatedAt=1673031278735"
                    alt="Skimail"
                    width={36}
                    height={36}
                    loading="lazy"
                  />
                  <span className="hidden text-base font-semibold tracking-tight text-white sm:block">
                    Skimail
                  </span>
                </Link>

                <div className="hidden sm:ml-6 sm:flex sm:items-center sm:gap-1">
                  {navigation.map((item) => (
                    <Link
                      key={item.name}
                      href={item.href}
                      {...(item.external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
                      className="rounded-lg px-3 py-1.5 text-sm font-medium text-snow-200/70 transition-colors hover:bg-white/10 hover:text-white"
                    >
                      {item.name}
                    </Link>
                  ))}
                </div>
              </div>

              {/* Build version */}
              <div className="hidden items-center sm:flex">
                <span className="text-xs text-white/30">
                  {process.env.NEXT_PUBLIC_BUILD_VERSION}
                </span>
              </div>
            </div>
          </div>

          <Disclosure.Panel className="border-t border-white/10 sm:hidden">
            <div className="space-y-1 px-4 pb-4 pt-3">
              {navigation.map((item) => (
                <Disclosure.Button
                  key={item.name}
                  as="a"
                  href={item.href}
                  {...(item.external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
                  className="block rounded-lg px-3 py-3 text-base font-medium text-snow-200/70 transition-colors hover:bg-white/10 hover:text-white"
                  style={{ minHeight: "44px" }}
                >
                  {item.name}
                </Disclosure.Button>
              ))}
              <span className="block px-3 py-2 text-xs text-white/30">
                {process.env.NEXT_PUBLIC_BUILD_VERSION}
              </span>
            </div>
          </Disclosure.Panel>
        </>
      )}
    </Disclosure>
  );
}
