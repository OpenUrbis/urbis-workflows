import React, { useContext } from "react";
import { InputMask } from "@react-input/mask";
import {
  Input as ChakraInput,
  InputProps as ChakraInputProps,
} from "@chakra-ui/react";
import { StyleContext } from "../reducers/style.reducer";

interface MaskedInputProps extends Omit<ChakraInputProps, "mask"> {
  mask: string;
  readOnly?: boolean;
  disabled?: boolean;
  name?: string;
}

export const MaskedInput: React.FC<MaskedInputProps> = ({
  mask,
  name,
  onChange,
  value,
  ...props
}) => {
  const styleContext = useContext(StyleContext);

  // Convert mask pattern to @react-input/mask format
  const convertedMask = mask
    .replace(/9/g, "_") // numbers
    .replace(/a/g, "@") // letters
    .replace(/\*/g, "#"); // any character

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (onChange) {
      onChange(e);
    }
  };

  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === "Escape") {
      (event.target as HTMLInputElement).blur();
    }
  };

  // Create style object based on high contrast settings
  const customProps = {
    style: {
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
      cursor: props.readOnly || props.disabled ? "not-allowed" : "auto",
      ...props.style,
    },
    _hover: {
      borderColor:
        styleContext.state.buttonHoverColorWeight === "200"
          ? "gray.300"
          : "gray.500",
    },
    _focus: {
      borderColor:
        styleContext.state.buttonHoverColorWeight === "200"
          ? "blue.500"
          : "blue.300",
      boxShadow:
        styleContext.state.buttonHoverColorWeight === "200"
          ? "0 0 0 1px var(--chakra-colors-blue-500)"
          : "0 0 0 1px var(--chakra-colors-blue-300)",
    },
  };

  return (
    <InputMask
      component={ChakraInput}
      mask={convertedMask}
      replacement={{
        _: /\d/, // numbers only
        "@": /[a-zA-Z]/, // letters only
        "#": /./, // any character
      }}
      value={value ?? ""}
      onChange={handleChange}
      onKeyDown={props.readOnly ? undefined : handleKeyDown}
      {...props}
      {...customProps}
      name={name}
      readOnly={props.readOnly}
      disabled={props.disabled}
      separate
    />
  );
};
