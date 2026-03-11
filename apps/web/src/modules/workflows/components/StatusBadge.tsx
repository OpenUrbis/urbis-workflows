import React, { useContext } from "react";
import { Badge } from "@open-urbis/map-ui";
import {
  FaCheckCircle,
  FaTimesCircle,
  FaClock,
  FaExclamationTriangle,
  FaQuestion,
} from "react-icons/fa";
import { StyleContext } from "../../../reducers/style.reducer";

export type StatusType =
  | "success"
  | "warning"
  | "error"
  | "pending"
  | "info"
  | "unknown";

interface StatusBadgeProps {
  status: StatusType;
  label: string;
  icon?: boolean;
  size?: "sm" | "md" | "lg";
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({
  status,
  label,
  icon = true,
  size = "md",
}) => {
  const styleContext = useContext(StyleContext);
  const isDarkMode = styleContext.state.buttonHoverColorWeight !== "200";

  // Define status configurations
  const statusConfig = {
    success: {
      icon: <FaCheckCircle />,
      colorScheme: "green",
      lightBg: "#dcfce7", // green-100
      darkBg: "#166534", // green-800
      lightText: "#166534", // green-800
      darkText: "#dcfce7", // green-100
    },
    warning: {
      icon: <FaExclamationTriangle />,
      colorScheme: "yellow",
      lightBg: "#fef9c3", // yellow-100
      darkBg: "#854d0e", // yellow-800
      lightText: "#854d0e", // yellow-800
      darkText: "#fef9c3", // yellow-100
    },
    error: {
      icon: <FaTimesCircle />,
      colorScheme: "red",
      lightBg: "#fee2e2", // red-100
      darkBg: "#991b1b", // red-800
      lightText: "#991b1b", // red-800
      darkText: "#fee2e2", // red-100
    },
    pending: {
      icon: <FaClock />,
      colorScheme: "yellow",
      lightBg: "#fef9c3", // yellow-100
      darkBg: "#854d0e", // yellow-800
      lightText: "#854d0e", // yellow-800
      darkText: "#fef9c3", // yellow-100
    },
    info: {
      icon: <FaCheckCircle />,
      colorScheme: "blue",
      lightBg: "#dbeafe", // blue-100
      darkBg: "#1e40af", // blue-800
      lightText: "#1e40af", // blue-800
      darkText: "#dbeafe", // blue-100
    },
    unknown: {
      icon: <FaQuestion />,
      colorScheme: "gray",
      lightBg: "#f3f4f6", // gray-100
      darkBg: "#4b5563", // gray-600
      lightText: "#4b5563", // gray-600
      darkText: "#f3f4f6", // gray-100
    },
  };

  const config = statusConfig[status];

  // Size configurations
  const sizeConfig = {
    sm: {
      px: 1.5,
      py: 0.5,
      fontSize: "xs",
      iconSize: 10,
      iconMargin: 1,
    },
    md: {
      px: 2,
      py: 1,
      fontSize: "sm",
      iconSize: 12,
      iconMargin: 1.5,
    },
    lg: {
      px: 3,
      py: 1.5,
      fontSize: "md",
      iconSize: 14,
      iconMargin: 2,
    },
  };

  const sizeProps = sizeConfig[size];

  return (
    <Badge
      variant="outline"
      className="inline-flex items-center rounded-lg font-medium border-transparent"
      style={{
        paddingLeft: `${sizeProps.px * 0.25}rem`,
        paddingRight: `${sizeProps.px * 0.25}rem`,
        paddingTop: `${sizeProps.py * 0.25}rem`,
        paddingBottom: `${sizeProps.py * 0.25}rem`,
        fontSize: sizeProps.fontSize,
        backgroundColor: isDarkMode ? config.darkBg : config.lightBg,
        color: isDarkMode ? config.darkText : config.lightText,
      }}
    >
      {icon && (
        <span
          className={`px-${sizeProps.iconMargin}`}
          style={{
            display: "inline-flex",
            fontSize: sizeProps.iconSize,
          }}
        >
          {config.icon}
        </span>
      )}
      <span className="ml-2">{label}</span>
    </Badge>
  );
};
