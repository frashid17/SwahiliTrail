"use client";

/**
 * Dynamic Button — adapted from dqnamo / JustifiedPixel Kitchen.
 * Width springs to the label; icon + text crossfade on state change.
 * https://www.dqnamo.com/experiments/dynamic-button
 */

import {
  AnimatePresence,
  type HTMLMotionProps,
  motion,
  useReducedMotion,
} from "motion/react";
import {
  forwardRef,
  type Key,
  type ReactNode,
  useCallback,
  useImperativeHandle,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import { cn } from "@/lib/utils";

type DynamicButtonVariant = "primary" | "secondary" | "coral" | "ghost";

export type DynamicButtonProps = Omit<
  HTMLMotionProps<"button">,
  "animate" | "children" | "initial" | "ref" | "transition"
> & {
  children: string;
  icon?: ReactNode;
  stateKey?: Key;
  variant?: DynamicButtonVariant;
  width?: "content" | "full";
  size?: "sm" | "md" | "lg";
};

const uiEaseOut = [0.23, 1, 0.32, 1] as const;

const variantClasses: Record<DynamicButtonVariant, string> = {
  primary:
    "border-brand-deep bg-brand-deep text-on-brand hover:bg-ocean-deep",
  secondary:
    "border-border bg-surface text-ocean-deep hover:border-ocean/30 hover:bg-foam",
  coral: "border-coral bg-coral text-white hover:brightness-110",
  ghost:
    "border-transparent bg-transparent text-ocean-deep hover:bg-foam",
};

const sizeClasses: Record<"sm" | "md" | "lg", string> = {
  sm: "h-8 gap-1.5 rounded-lg px-2.5 text-xs",
  md: "h-10 gap-2 rounded-xl px-3.5 text-sm",
  lg: "h-12 gap-2 rounded-xl px-5 text-sm font-semibold",
};

export const DynamicButton = forwardRef<HTMLButtonElement, DynamicButtonProps>(
  function DynamicButton(
    {
      children,
      className,
      icon,
      stateKey,
      type = "button",
      variant = "primary",
      width = "content",
      size = "md",
      disabled,
      ...props
    },
    forwardedRef,
  ) {
    const shouldReduceMotion = useReducedMotion();
    const buttonRef = useRef<HTMLButtonElement>(null);
    const measureRef = useRef<HTMLSpanElement>(null);
    const measurementSignatureRef = useRef("");
    const [measuredWidth, setMeasuredWidth] = useState<number | null>(null);
    const iconKey = stateKey ?? children;
    const measurementSignature = [
      children,
      className,
      icon ? "icon" : "no-icon",
      stateKey,
      variant,
      size,
    ].join("\0");

    const shouldMeasureWidth = width === "content";
    const widthTransition = shouldReduceMotion
      ? { duration: 0 }
      : { bounce: 0, duration: 0.26, type: "spring" as const };
    const contentTransition = {
      duration: shouldReduceMotion ? 0.16 : 0.18,
      ease: uiEaseOut,
    };
    const contentVisible = { opacity: 1, transform: "translateY(0px)" };
    const contentInitial = shouldReduceMotion
      ? { opacity: 0, transform: "translateY(0px)" }
      : { opacity: 0, transform: "translateY(8px)" };
    const contentExit = shouldReduceMotion
      ? { opacity: 0, transform: "translateY(0px)" }
      : { opacity: 0, transform: "translateY(-8px)" };

    useImperativeHandle(
      forwardedRef,
      () => buttonRef.current as HTMLButtonElement,
    );

    const syncWidth = useCallback(() => {
      const button = buttonRef.current;
      const measure = measureRef.current;
      if (!button || !measure || !shouldMeasureWidth) return;
      const styles = window.getComputedStyle(button);
      const horizontalPadding =
        Number.parseFloat(styles.paddingLeft) +
        Number.parseFloat(styles.paddingRight) +
        Number.parseFloat(styles.borderLeftWidth) +
        Number.parseFloat(styles.borderRightWidth);
      const nextWidth = Math.ceil(measure.scrollWidth + horizontalPadding);
      setMeasuredWidth((current) =>
        current === nextWidth ? current : nextWidth,
      );
    }, [shouldMeasureWidth]);

    useLayoutEffect(() => {
      const measure = measureRef.current;
      if (!measure || !shouldMeasureWidth) {
        setMeasuredWidth(null);
        return;
      }
      syncWidth();
      const observer = new ResizeObserver(syncWidth);
      observer.observe(measure);
      window.addEventListener("resize", syncWidth);
      return () => {
        observer.disconnect();
        window.removeEventListener("resize", syncWidth);
      };
    }, [shouldMeasureWidth, syncWidth]);

    useLayoutEffect(() => {
      if (measurementSignatureRef.current === measurementSignature) return;
      measurementSignatureRef.current = measurementSignature;
      syncWidth();
    }, [measurementSignature, syncWidth]);

    return (
      <motion.button
        {...props}
        animate={
          width === "content" ? { width: measuredWidth ?? "auto" } : undefined
        }
        className={cn(
          "relative inline-flex cursor-pointer items-center justify-center overflow-hidden whitespace-nowrap border font-medium",
          "transition-[color,background-color,border-color,box-shadow,transform] duration-150",
          "ease-[cubic-bezier(0.23,1,0.32,1)] active:scale-[0.97]",
          "disabled:pointer-events-none disabled:opacity-55",
          variantClasses[variant],
          sizeClasses[size],
          width === "full" && "w-full",
          className,
        )}
        disabled={disabled}
        initial={false}
        ref={buttonRef}
        transition={
          width === "content" ? { width: widthTransition } : undefined
        }
        type={type}
      >
        <span className="relative inline-flex items-center gap-[inherit]">
          {icon ? (
            <span className="relative inline-grid size-4 shrink-0 overflow-hidden">
              <AnimatePresence initial={false} mode="popLayout">
                <motion.span
                  animate={contentVisible}
                  className="col-start-1 row-start-1 flex size-4 items-center justify-center"
                  exit={contentExit}
                  initial={contentInitial}
                  key={iconKey}
                  transition={contentTransition}
                >
                  {icon}
                </motion.span>
              </AnimatePresence>
            </span>
          ) : null}
          <span className="relative inline-grid overflow-hidden">
            <AnimatePresence initial={false} mode="popLayout">
              <motion.span
                animate={contentVisible}
                className="col-start-1 row-start-1 block"
                exit={contentExit}
                initial={contentInitial}
                key={children}
                transition={contentTransition}
              >
                {children}
              </motion.span>
            </AnimatePresence>
          </span>
        </span>
        <span
          aria-hidden
          className="pointer-events-none absolute inline-flex items-center gap-[inherit] opacity-0"
          ref={measureRef}
        >
          {icon ? (
            <span className="flex size-4 shrink-0 items-center justify-center">
              {icon}
            </span>
          ) : null}
          <span>{children}</span>
        </span>
      </motion.button>
    );
  },
);
