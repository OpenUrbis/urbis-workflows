import React, { useContext } from "react";
import { InputMask } from "@react-input/mask";
import { Input as DSInput } from "@open-urbis/map-ui";
import { StyleContext } from "../reducers/style.reducer";

interface MaskedInputProps
  extends Omit<
    React.ComponentProps<typeof DSInput>,
    "mask" | "size"
  > {
  mask: string;
  readOnly?: boolean;
  disabled?: boolean;
  name?: string;
  size?: "sm" | "md" | "lg" | string;
}

export const MaskedInput: React.FC<MaskedInputProps> = ({
  mask,
  name,
  onChange,
  value,
  size,
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
  };

  return (
    <InputMask
      component={DSInput}
      mask={convertedMask}
      replacement={{
        _: /\d/, // numbers only
        "@": /[a-zA-Z]/, // letters only
        "#": /./, // any character
      }}
      value={value ?? ""}
      onChange={handleChange}
      onKeyDown={props.readOnly ? undefined : handleKeyDown}
      className={`${props.className ?? ""} ${
        props.readOnly || props.disabled ? "cursor-not-allowed" : ""
      } ${size === "sm" ? "h-8" : size === "md" ? "h-10" : "h-11"}`}
      {...props}
      {...customProps}
      name={name}
      readOnly={props.readOnly}
      disabled={props.disabled}
      separate
    />
  );
};
