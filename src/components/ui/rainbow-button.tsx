import React, { useEffect, useState } from "react";
import { useTheme } from "next-themes";
import { cn } from "@/lib/utils";

interface RainbowButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  teal?: boolean;
}

export function RainbowButton({
  children,
  className,
  teal = false,
  ...props
}: RainbowButtonProps) {
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const baseClasses =
    "group relative inline-flex h-11 cursor-pointer items-center justify-center rounded-md border-0 px-8 py-2 font-medium transition-colors [background-clip:padding-box,border-box,border-box] [background-origin:border-box] [border:calc(0.08*1rem)_solid_transparent] focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50";

  const rainbowGlow =
    "before:absolute before:bottom-[-20%] before:left-1/2 before:z-0 before:h-1/5 before:w-3/5 before:-translate-x-1/2 before:animate-rainbow before:bg-[linear-gradient(90deg,hsl(var(--color-1)),hsl(var(--color-5)),hsl(var(--color-3)),hsl(var(--color-4)),hsl(var(--color-2)))] before:bg-[length:200%] before:[filter:blur(calc(0.8*1rem))] dark:before:hidden";

  if (!mounted) {
    // Render default (light) style to avoid hydration mismatch
    return (
      <button
        className={cn(
          baseClasses,
          teal
            ? "bg-primary text-primary-foreground"
            : "bg-[linear-gradient(#121213,#121213),linear-gradient(#121213_50%,rgba(18,18,19,0.6)_80%,rgba(18,18,19,0)),linear-gradient(90deg,hsl(var(--color-1)),hsl(var(--color-5)),hsl(var(--color-3)),hsl(var(--color-4)),hsl(var(--color-2)))] text-primary-foreground",
          className
        )}
        {...props}
      >
        {children}
      </button>
    );
  }

  return (
    <button
      className={cn(
        baseClasses,
        rainbowGlow,
        teal
          ?
            resolvedTheme === "dark"
              ? "bg-primary text-primary-foreground shadow-lg border border-border disabled:bg-primary disabled:text-primary-foreground"
              : "bg-primary text-primary-foreground"
          :
        resolvedTheme === "dark"
          ? "bg-white text-black shadow-lg border border-border disabled:bg-white disabled:text-black"
          : "bg-[linear-gradient(#121213,#121213),linear-gradient(#121213_50%,rgba(18,18,19,0.6)_80%,rgba(18,18,19,0)),linear-gradient(90deg,hsl(var(--color-1)),hsl(var(--color-5)),hsl(var(--color-3)),hsl(var(--color-4)),hsl(var(--color-2)))] text-primary-foreground",
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
}
