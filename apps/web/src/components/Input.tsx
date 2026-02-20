import React, { useContext } from "react";
import { Input as DSInput } from "@open-urbis/map-ui";
import { StyleContext } from "../reducers/style.reducer";

interface InputProps extends React.ComponentProps<typeof DSInput> {
  readOnly?: boolean;
  disabled?: boolean;
  autoFocus?: boolean;
  size?: "sm" | "md" | "lg" | string;
  [key: string]: any;
}

export const Input: React.FC<InputProps> = (props) => {
  const { size, className, ...rest } = props;
  const styleContext = useContext(StyleContext);

  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === "Escape") {
      (event.target as HTMLInputElement).blur();
    }
  };

  return (
    <DSInput
      {...rest}
      className={`${className ?? ""} ${props.readOnly || props.disabled ? "cursor-not-allowed" : ""} ${
        size === "sm" ? "h-8" : size === "md" ? "h-10" : "h-11"
      }`}
      readOnly={props.readOnly}
      disabled={props.disabled}
      onKeyDown={props.readOnly || props.disabled ? undefined : handleKeyDown}
      style={{
        backgroundColor:
          styleContext.state.buttonHoverColorWeight === "200"
            ? "#fafafa"
            : "#2D3748",
        color:
          props.readOnly || props.disabled
            ? `${styleContext.state.textColor}89`
            : styleContext.state.textColor,
        ...props.style,
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
