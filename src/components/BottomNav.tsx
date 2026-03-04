"use client";

import Link from "next/link";
import { Home, PlusSquare, Wallet } from "lucide-react";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

export default function BottomNav() {
  const pathname = usePathname();

  const navLinks = [
    { href: "/", icon: Home, label: "Home" },
    { href: "/mint", icon: PlusSquare, label: "Mint" },
  ];

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-background border-t z-50 transition-all duration-300">
      <div className="flex justify-around items-center h-16">
        {navLinks.map(({ href, icon: Icon, label }) => (
          <Link
            key={href}
            href={href}
            className={cn(
              "flex flex-col items-center justify-center w-full h-full text-sm font-medium transition-all duration-200 ease-in-out",
              pathname === href
                ? "text-primary scale-110"
                : "text-muted-foreground hover:text-primary hover:scale-105"
            )}
          >
            <Icon className="w-6 h-6 mb-1" />
            <span>{label}</span>
          </Link>
        ))}
      </div>
    </nav>
  );
}
