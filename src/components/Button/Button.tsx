import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from "react";
// @ts-ignore CSS imports are resolved by the bundler, not TypeScript.
import "./Button.css";

export type ButtonVariant = "primary" | "secondary";
export type ButtonSize = "sm" | "md" | "lg";

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  /** Visual style of the button */
  variant?: ButtonVariant;
  /** Size of the button */
  size?: ButtonSize;
  /** Stretch the button to fill its container */
  fullWidth?: boolean;
  /** Button content */
  children: ReactNode;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = "primary",
      size = "md",
      fullWidth = false,
      className,
      type = "button",
      children,
      ...rest
    },
    ref,
  ) => {
    const classes = [
      "ie-button",
      `ie-button--${variant}`,
      `ie-button--${size}`,
      fullWidth && "ie-button--full-width",
      className,
    ]
      .filter(Boolean)
      .join(" ");

    return (
      <button ref={ref} type={type} className={classes} {...rest}>
        {children}
      </button>
    );
  },
);

Button.displayName = "Button";
