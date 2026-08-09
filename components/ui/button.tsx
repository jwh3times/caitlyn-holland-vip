import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import Link from "next/link";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default: "bg-blue-600 text-white hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-400",
        destructive: "bg-red-600 text-white hover:bg-red-700",
        outline:
          "border border-gray-300 dark:border-gray-700 bg-transparent text-gray-900 dark:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-800",
        secondary:
          "bg-gray-100 text-gray-900 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-100 dark:hover:bg-gray-700",
        ghost: "text-gray-900 dark:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-800",
        link: "text-blue-600 dark:text-blue-400 underline-offset-4 hover:underline",
        // Primary call-to-action: blue gradient fill. ButtonProps and CtaLink
        // keep gradient variants paired with padding-based CTA sizes.
        gradient:
          "rounded-xl text-base font-semibold text-white shadow-lg transition-all bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 hover:scale-105 hover:shadow-2xl dark:from-blue-500 dark:to-blue-600 dark:hover:from-blue-600 dark:hover:to-blue-700",
        // Secondary call-to-action: blue outline that fills on hover.
        gradientOutline:
          "rounded-xl text-base font-semibold border-2 border-blue-600 text-blue-600 shadow-lg transition-all hover:bg-blue-600 hover:text-white hover:scale-105 dark:border-blue-500 dark:text-blue-400 dark:hover:bg-blue-500 dark:hover:text-white",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 rounded-md px-3",
        lg: "h-11 rounded-md px-8",
        icon: "h-10 w-10",
        // Padding-based CTA sizes (no fixed height) for the gradient variants.
        cta: "px-8 py-3",
        ctaLg: "px-10 py-4",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

type ButtonVariant = NonNullable<VariantProps<typeof buttonVariants>["variant"]>;
type ButtonSize = NonNullable<VariantProps<typeof buttonVariants>["size"]>;
type CtaVariant = Extract<ButtonVariant, "gradient" | "gradientOutline">;
type CtaSize = Extract<ButtonSize, "cta" | "ctaLg">;

type ButtonStyleProps =
  | { variant: CtaVariant; size: CtaSize }
  | {
      variant?: Exclude<ButtonVariant, CtaVariant>;
      size?: Exclude<ButtonSize, CtaSize>;
    };

export type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> &
  ButtonStyleProps & {
    ref?: React.Ref<HTMLButtonElement>;
  };

export type CtaLinkProps = Omit<React.ComponentProps<typeof Link>, "className"> & {
  tone?: "primary" | "secondary";
  size?: "md" | "lg";
  className?: string;
};

function Button({ className, variant, size, ref, ...props }: ButtonProps) {
  return (
    <button className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props} />
  );
}

function CtaLink({ className, tone = "primary", size = "md", ...props }: CtaLinkProps) {
  return (
    <Link
      className={cn(
        buttonVariants({
          variant: tone === "primary" ? "gradient" : "gradientOutline",
          size: size === "md" ? "cta" : "ctaLg",
          className,
        })
      )}
      {...props}
    />
  );
}

export { Button, CtaLink };
