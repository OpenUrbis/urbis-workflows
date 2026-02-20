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
                bg ??
                (state.buttonHoverColorWeight === "200" ? "#e5e7eb" : "#374151"),
              color: state.buttonHoverColorWeight === "200" ? undefined : "#fff",
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
