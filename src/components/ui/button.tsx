import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import Link from "next/link";
import * as React from "react";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex shrink-0 items-center justify-center gap-2 rounded-[0.35rem] border border-transparent text-sm font-semibold tracking-tight whitespace-nowrap transition-all outline-none select-none focus-visible:ring-2 focus-visible:ring-gold/35 active:scale-[0.97] disabled:pointer-events-none disabled:opacity-55 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  {
    variants: {
      variant: {
        default:
          "bg-gradient-to-br from-coral to-[color-mix(in_oklab,var(--coral)_70%,var(--gold))] text-white shadow-[0_12px_28px_-16px_var(--lux-glow)] hover:brightness-105",
        solid:
          "bg-gradient-to-br from-coral to-[color-mix(in_oklab,var(--coral)_70%,var(--gold))] text-white shadow-[0_12px_28px_-16px_var(--lux-glow)] hover:brightness-105",
        outline:
          "border-border bg-surface text-ocean-deep hover:border-gold/45 hover:bg-foam",
        secondary:
          "bg-foam text-ocean-deep ring-1 ring-border hover:bg-sand/70",
        soft: "bg-foam text-ocean-deep ring-1 ring-border hover:bg-sand/70 hover:ring-gold/30",
        ghost:
          "border border-white/45 bg-white/10 text-white backdrop-blur-sm hover:bg-white/18 hover:border-gold/50",
        quiet: "bg-transparent text-ocean-deep hover:bg-foam/80",
        brand:
          "bg-brand-deep text-on-brand hover:brightness-110 shadow-[0_12px_28px_-16px_color-mix(in_oklab,var(--aqua)_35%,transparent)]",
        destructive:
          "bg-coral/15 text-coral hover:bg-coral/25",
        link: "text-ocean underline-offset-4 hover:underline",
      },
      size: {
        default: "h-10 px-4",
        md: "h-11 px-5",
        xs: "h-7 gap-1 px-2.5 text-xs",
        sm: "h-9 px-3.5 text-xs",
        lg: "h-12 px-6",
        icon: "size-10",
        "icon-sm": "size-8",
        "icon-lg": "size-11",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

type ButtonProps = React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean;
  };

function Button({
  className,
  variant = "default",
  size = "default",
  asChild = false,
  type = "button",
  ...props
}: ButtonProps) {
  const Comp = asChild ? Slot : "button";
  return (
    <Comp
      data-slot="button"
      type={asChild ? undefined : type}
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  );
}

export type ButtonVariant = NonNullable<VariantProps<typeof buttonVariants>["variant"]>;
export type ButtonSize = NonNullable<VariantProps<typeof buttonVariants>["size"]>;

function ButtonLink({
  variant = "solid",
  size = "md",
  className,
  ...props
}: React.ComponentProps<typeof Link> & VariantProps<typeof buttonVariants>) {
  return (
    <Link
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  );
}

export { Button, ButtonLink, buttonVariants };
