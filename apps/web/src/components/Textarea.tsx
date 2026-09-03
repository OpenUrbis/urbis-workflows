import React, { useContext } from "react";
import { Textarea as DSTextarea } from "@open-urbis/map-ui";
import { StyleContext } from "../reducers/style.reducer";

interface TextareaProps
  extends Omit<React.ComponentProps<typeof DSTextarea>, "size"> {
  readOnly?: boolean;
  disabled?: boolean;
  autoFocus?: boolean;
  size?: "sm" | "md" | "lg" | string;
  [key: string]: any;
}

export const Textarea: React.FC<TextareaProps> = (props) => {
  const { size, className, ...rest } = props;
  const styleContext = useContext(StyleContext);

  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === "Escape") {
      (event.target as HTMLTextAreaElement).blur();
    }
  };

  return (
    <DSTextarea
      {...rest}
      className={`${className ?? ""} ${
        size === "sm" ? "min-h-[90px]" : size === "md" ? "min-h-[110px]" : "min-h-[120px]"
      } ${props.readOnly || props.disabled ? "cursor-not-allowed" : ""}`}
      readOnly={props.readOnly}
      disabled={props.disabled}
      onKeyDown={props.readOnly ? undefined : handleKeyDown}
      style={{
        backgroundColor:
          styleContext.state.buttonHoverColorWeight === "200"
            ? "#fafafa"
            : "#2D3748",
        color: styleContext.state.textColor,
        ...props.style,
      }}
      ref={(textarea) => {
        if (textarea && props.autoFocus) {
          setTimeout(() => {
            textarea.focus();
          }, 0);
        }
      }}
    />
  );
};
