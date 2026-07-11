import React from "react";

interface ButtonProps {
  variant?: "primary" | "secondary" | "tertiary";
  children: React.ReactNode;
  className?: string;
  onClick?: (e: React.MouseEvent<HTMLButtonElement>) => void;
  disabled?: boolean;
  type?: "button" | "submit" | "reset";
}

export function Button({ variant = "primary", children, className = "", ...props }: ButtonProps) {
  let baseStyles = "inline-flex items-center justify-center font-sans font-medium transition-all duration-300 rounded-full text-sm md:text-base outline-none focus:ring-2 focus:ring-[#A068FF]/50";
  
  let variantStyles = "";
  if (variant === "primary") {
    // Primary: dark background, white text, premium multi-layer shadow
    variantStyles = "bg-[#051A24] text-white btn-primary-shadow px-7 py-3 hover:bg-[#0D212C] active:scale-[0.98]";
  } else if (variant === "secondary") {
    // Secondary: white bg, dark text, subtle shadow
    variantStyles = "bg-white text-[#051A24] btn-secondary-shadow px-7 py-3 hover:bg-slate-50 active:scale-[0.98]";
  } else if (variant === "tertiary") {
    // Tertiary: white bg with custom combined shadow
    variantStyles = "bg-white text-[#051A24] btn-secondary-shadow px-6 py-2.5 hover:bg-slate-50 hover:shadow-md active:scale-[0.98]";
  }

  return (
    <button className={`${baseStyles} ${variantStyles} ${className}`} {...props}>
      {children}
    </button>
  );
}
