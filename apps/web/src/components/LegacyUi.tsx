import React from "react";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  Tooltip as DSTooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@open-urbis/map-ui";

export const Spinner = ({
  size = "md",
}: {
  size?: "sm" | "md" | "lg" | "xl";
}) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={`animate-spin ${
      size === "xl"
        ? "h-10 w-10"
        : size === "lg"
          ? "h-7 w-7"
          : size === "sm"
            ? "h-4 w-4"
            : "h-5 w-5"
    }`}
    aria-hidden="true"
  >
    <path d="M21 12a9 9 0 1 1-6.219-8.56" />
  </svg>
);

export const FormControl = ({ children, className = "", ...props }: any) => (
  <div className={className} {...props}>
    {children}
  </div>
);

export const FormLabel = ({ children, className = "", ...props }: any) => (
  <label className={`mb-1 block text-sm font-medium ${className}`} {...props}>
    {children}
  </label>
);

export const FormHelperText = ({ children, className = "", ...props }: any) => (
  <p className={`mt-1 text-xs text-muted-foreground ${className}`} {...props}>
    {children}
  </p>
);

export const Button = ({
  children,
  onClick,
  variant,
  colorScheme,
  mr,
  className = "",
  ...props
}: any) => {
  const variantClass =
    variant === "ghost"
      ? "bg-transparent hover:bg-muted text-foreground"
      : colorScheme === "blue"
        ? "bg-blue-600 hover:bg-blue-700 text-white"
        : "bg-primary text-primary-foreground hover:bg-primary/90";

  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex items-center rounded-md px-4 py-2 text-sm font-medium ${variantClass} ${className}`}
      style={{ marginRight: mr ? `${mr * 0.25}rem` : undefined }}
      {...props}
    >
      {children}
    </button>
  );
};

export const IconButton = ({
  icon,
  onClick,
  className = "",
  style,
  "aria-label": ariaLabel,
  children,
  ...props
}: any) => (
  <button
    type="button"
    aria-label={ariaLabel}
    className={`inline-flex h-8 w-8 items-center justify-center rounded-md ${className}`}
    onClick={onClick}
    style={style}
    {...props}
  >
    {icon ?? children}
  </button>
);

export const Menu = ({ children }: any) => <DropdownMenu>{children}</DropdownMenu>;

export const MenuButton = ({ children, className = "", style }: any) => (
  <DropdownMenuTrigger asChild>
    <button type="button" className={className} style={style}>
      {children}
    </button>
  </DropdownMenuTrigger>
);

export const MenuList = ({ children, className = "" }: any) => (
  <DropdownMenuContent className={`max-h-[300px] overflow-y-auto ${className}`}>
    {children}
  </DropdownMenuContent>
);

export const MenuItem = ({ children, className = "", onClick }: any) => (
  <DropdownMenuItem className={className} onSelect={onClick}>
    {children}
  </DropdownMenuItem>
);

export const Tooltip = ({ children, label }: any) => (
  <TooltipProvider>
    <DSTooltip>
      <TooltipTrigger asChild>{children}</TooltipTrigger>
      <TooltipContent>{label}</TooltipContent>
    </DSTooltip>
  </TooltipProvider>
);

export const Modal = ({ isOpen, onClose, children }: any) => (
  <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
    {children}
  </Dialog>
);

export const ModalOverlay = () => null;

export const ModalContent = ({ children }: any) => (
  <DialogContent>{children}</DialogContent>
);

export const ModalHeader = ({ children }: any) => (
  <DialogHeader>
    <DialogTitle>{children}</DialogTitle>
  </DialogHeader>
);

export const ModalBody = ({ children }: any) => <div>{children}</div>;

export const ModalFooter = ({ children }: any) => (
  <DialogFooter className="gap-2">{children}</DialogFooter>
);
