import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors",
  {
    variants: {
      variant: {
        default: "border-transparent bg-teal/20 text-teal",
        secondary: "border-transparent bg-purple/20 text-purple",
        destructive: "border-transparent bg-destructive/20 text-destructive",
        outline: "text-foreground border-border",
        warning: "border-transparent bg-yellow-500/20 text-yellow-400",
        success: "border-transparent bg-emerald-500/20 text-emerald-400",
      },
    },
    defaultVariants: { variant: "default" },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

export function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />;
}
