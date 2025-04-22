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
import { StyleContext } from "../reducers";
import { FaQuestion, FaTimes } from "react-icons/fa";

export function HelpTooltipClickable({
  tooltip,
  icon: Icon = FaQuestion,
  size = "14px",
}: {
  tooltip: string;
  icon?: React.ElementType;
  size?: string;
}): JSX.Element {
  const { state } = useContext(StyleContext);

  return (
    <div className="pt-1">
      <Popover placement="auto">
        <PopoverTrigger>
          <span>
            <Icon className="cursor-pointer" size={size} />{" "}
          </span>
        </PopoverTrigger>
        <Portal>
          <PopoverContent
            bg={state.backgroundColor}
            className="px-4 py-2.5"
            width="auto"
            maxWidth="1500px"
            borderColor={state.buttonHoverColorWeight === "200" ? "#E5E7EB" : "#374151"}
          >
            <PopoverArrow bg={state.backgroundColor} />
            <div className="absolute right-2 top-2">
              <PopoverCloseButton
                className="hover:bg-opacity-10 rounded p-1.5 transition-colors duration-150"
                style={{
                  color: state.buttonHoverColorWeight === "200" ? "#6B7280" : "#9CA3AF",
                  backgroundColor: state.buttonHoverColorWeight === "200" 
                    ? "rgba(107, 114, 128, 0.1)" 
                    : "rgba(156, 163, 175, 0.1)",
                }}
              >
                <FaTimes size="12px" />
              </PopoverCloseButton>
            </div>
            <PopoverBody>
              <div className="pt-4 pr-5 pb-2" dangerouslySetInnerHTML={{ __html: tooltip }} />
            </PopoverBody>
          </PopoverContent>
        </Portal>
      </Popover>
    </div>
  );
}

export default HelpTooltipClickable;
