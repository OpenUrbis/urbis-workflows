import React, { useContext } from "react";
import {
  Input as ChakraInput,
  InputProps as ChakraInputProps,
} from "@chakra-ui/react";
import { StyleContext } from "../reducers/style.reducer";

interface InputProps extends ChakraInputProps {
  readOnly?: boolean;
  disabled?: boolean;
  autoFocus?: boolean;
}

export const Input: React.FC<InputProps> = (props) => {
  const styleContext = useContext(StyleContext);

  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === "Escape") {
      (event.target as HTMLInputElement).blur();
    }
  };

  return (
    <ChakraInput
      className={`${props.readOnly || props.disabled ? "cursor-not-allowed" : ""}`}
      {...props}
      readOnly={props.readOnly}
      disabled={props.disabled}
      onKeyDown={props.readOnly || props.disabled ? undefined : handleKeyDown}
      // Focus management using a delayed approach to prevent scroll jumping
      // and ensure the component is fully rendered before focusing.
      // The delay of 0ms still moves the focus call to the next event loop tick,
      // which is enough to avoid focus-related issues.
      style={{
        backgroundColor:
          styleContext.state.buttonHoverColorWeight === "200"
            ? "#fafafa"
            : "#2D3748",
        color:
          props.readOnly || props.disabled
            ? `${styleContext.state.textColor}89`
            : styleContext.state.textColor,
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
      ref={(input) => {
        if (input && props.autoFocus) {
          setTimeout(() => {
            input.focus();
          }, 0);
        }
      }}
    />
  );
};
