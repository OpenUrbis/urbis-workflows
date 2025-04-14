import React, { useContext } from "react";
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
  PopoverArrow,
  PopoverCloseButton,
  PopoverBody,
  Portal,
} from "@chakra-ui/react";
import { FaInfoCircle, FaTimes } from "react-icons/fa";
import { StyleContext } from "../reducers";

const InfoTooltip = ({
  content,
  children,
  icon: Icon = FaInfoCircle,
  size = "14px",
  placement = "auto",
  showIcon = false,
}: {
  content: React.ReactNode;
  children: React.ReactNode;
  icon?: React.ElementType;
  size?: string;
  placement?: string;
  showIcon?: boolean;
}) => {
  const styleContext = useContext(StyleContext);

  return (
    <Popover placement={placement as any} trigger="click">
      <PopoverTrigger>
        <div className="inline-flex items-center cursor-pointer">
          {children}
          {showIcon && <Icon className="ml-1" size={size} color="#9CA3AF" />}
        </div>
      </PopoverTrigger>
      <Portal>
        <PopoverContent
          bg={styleContext.state.backgroundColor}
          className="px-4 py-2.5"
          width="auto"
          maxWidth="400px"
          borderColor={
            styleContext.state.buttonHoverColorWeight === "200"
              ? "#E5E7EB"
              : "#374151"
          }
        >
          <PopoverArrow bg={styleContext.state.backgroundColor} />
          <div className="absolute right-2 top-2">
            <PopoverCloseButton
              className="hover:bg-opacity-10 rounded p-1.5 transition-colors duration-150"
              style={{
                color:
                  styleContext.state.buttonHoverColorWeight === "200"
                    ? "#6B7280"
                    : "#9CA3AF",
                backgroundColor:
                  styleContext.state.buttonHoverColorWeight === "200"
                    ? "rgba(107, 114, 128, 0.1)"
                    : "rgba(156, 163, 175, 0.1)",
              }}
            >
              <FaTimes size="12px" />
            </PopoverCloseButton>
          </div>
          <PopoverBody>
            <div className="pt-4 pr-5 pb-2 max-h-[300px] overflow-y-auto">
              {content}
            </div>
          </PopoverBody>
        </PopoverContent>
      </Portal>
    </Popover>
  );
};

export default InfoTooltip;
