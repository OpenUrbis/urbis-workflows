import React, { useContext, useState, useEffect } from "react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@open-urbis/map-ui";
import { StyleContext } from "../reducers/style.reducer";

interface ShortcutLabelProps {
  children: React.ReactNode;
  size?: string;
  bg?: string;
  alwaysShow?: boolean;
  className?: string;
}

const resolveBackground = (bg: string | undefined, fallback: string) => {
  if (!bg) return fallback;

  if (bg === "primary") return "hsl(var(--primary))";
  if (bg === "primary-foreground") return "hsl(var(--primary-foreground))";

  const tokenMap: Record<string, string> = {
    "gray.100": "#f3f4f6",
    "gray.200": "#e5e7eb",
    "gray.600": "#4b5563",
    "yellow.100": "#fef9c3",
    "yellow.600": "#ca8a04",
    "yellow.700": "#a16207",
    "yellow.800": "#854d0e",
    "yellow.900": "#713f12",
    "green.600": "#16a34a",
    "green.800": "#166534",
    "blue.600": "#2563eb",
    "blue.800": "#1e40af",
  };

  return tokenMap[bg] ?? bg;
};

export function SL({
  children,
  size,
  bg,
  alwaysShow = false,
  className,
}: ShortcutLabelProps): JSX.Element {
  const { state } = useContext(StyleContext);
  const [showShortcut, setShowShortcut] = useState(false);

  useEffect(() => {
    if (alwaysShow) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Alt") {
        setShowShortcut(true);
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.key === "Alt") {
        setShowShortcut(false);
      }
    };

    const handleBlur = () => {
      setShowShortcut(false);
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);
    window.addEventListener("blur", handleBlur);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
      window.removeEventListener("blur", handleBlur);
    };
  }, [alwaysShow]);

  if (!alwaysShow && !showShortcut) return <></>;

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <span
            className={`hidden lg:inline rounded-md px-2.5 py-1 font-black leading-none align-middle ${className ?? ""}`}
            style={{
              fontSize:
                size === "sm"
                  ? "0.875rem"
                  : size === "md"
                    ? "1rem"
                    : size === "lg"
                      ? "1.125rem"
                      : size,
              background:
                resolveBackground(
                  bg,
                  state.buttonHoverColorWeight === "200" ? "#e5e7eb" : "#374151"
                ),
              color:
                bg ? undefined : state.buttonHoverColorWeight === "200" ? undefined : "#fff",
            }}
          >
            {children}
          </span>
        </TooltipTrigger>
        <TooltipContent>{`Tecla de atalho: ${children}`}</TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

export default SL;
