import React, { useContext } from "react";
import {
  Select as ChakraSelect,
  SelectProps as ChakraSelectProps,
} from "@chakra-ui/react";
import { StyleContext } from "../reducers/style.reducer";

interface SelectProps extends ChakraSelectProps {
  disabled?: boolean;
}

export const Select: React.FC<SelectProps> = ({ disabled, ...props }) => {
  const styleContext = useContext(StyleContext);

  return (
    <ChakraSelect
      {...props}
      disabled={disabled}
      pointerEvents={disabled ? "inherit" : "auto"}
      style={{
        backgroundColor:
          styleContext.state.buttonHoverColorWeight === "200"
            ? "#fafafa"
            : "#2D3748",
        color: styleContext.state.textColor,
        borderColor:
          styleContext.state.buttonHoverColorWeight === "200"
            ? "gray.200"
            : "gray.600",
        ...props.style,
      }}
      _hover={{
        borderColor:
          styleContext.state.buttonHoverColorWeight === "200"
            ? "gray.300"
            : "gray.500",
      }}
      _focus={{
        borderColor:
          styleContext.state.buttonHoverColorWeight === "200"
            ? "blue.500"
            : "blue.300",
        boxShadow:
          styleContext.state.buttonHoverColorWeight === "200"
            ? "0 0 0 1px var(--chakra-colors-blue-500)"
            : "0 0 0 1px var(--chakra-colors-blue-300)",
      }}
    />
  );
};
