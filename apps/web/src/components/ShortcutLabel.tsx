import React, { useContext, useState, useEffect } from "react";
import { Tooltip, Box } from "@chakra-ui/react";
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
    <Tooltip label={`Tecla de atalho: ${children}`}>
      <Box
        className={className}
        fontSize={size ?? "md"}
        bg={
          bg ??
          (state.buttonHoverColorWeight === "200" ? "gray.200" : "gray.700")
        }
        display={["none", "none", "inline"]}
        borderRadius="md"
        px={2.5}
        py={1}
        fontWeight="black"
        color={state.buttonHoverColorWeight === "200" ? "" : "white"}
        position="relative"
        lineHeight="1"
        verticalAlign="middle"
      >
        {children}
      </Box>
    </Tooltip>
  );
}

export default SL;
