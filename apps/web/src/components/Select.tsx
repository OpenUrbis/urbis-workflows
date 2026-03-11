import React, { useContext } from "react";
import { StyleContext } from "../reducers/style.reducer";

interface SelectProps
  extends Omit<React.SelectHTMLAttributes<HTMLSelectElement>, "size"> {
  disabled?: boolean;
  size?: "sm" | "md" | "lg" | string;
  [key: string]: any;
}

export const Select: React.FC<SelectProps> = ({ disabled, size, className, ...props }) => {
  const styleContext = useContext(StyleContext);

  return (
    <select
      {...props}
      disabled={disabled}
      className={`${className ?? ""} w-full rounded-md border px-3 ${
        size === "sm" ? "h-8 text-sm" : size === "md" ? "h-10" : "h-11"
      } ${disabled ? "cursor-not-allowed opacity-70" : ""}`}
      style={{
        backgroundColor:
          styleContext.state.buttonHoverColorWeight === "200"
            ? "#fafafa"
            : "#2D3748",
        color: styleContext.state.textColor,
        borderColor:
          styleContext.state.buttonHoverColorWeight === "200" ? "#e5e7eb" : "#4b5563",
        ...props.style,
      }}
    />
  );
};
