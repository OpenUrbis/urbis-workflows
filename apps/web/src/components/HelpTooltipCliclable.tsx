import React from "react";
import {
  Button,
  Dialog,
  DialogClose,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@open-urbis/map-ui";
import { FaQuestion } from "react-icons/fa";

export function HelpTooltipClickable({
  tooltip,
  icon: Icon = FaQuestion,
  size = "14px",
}: {
  tooltip: string;
  icon?: React.ElementType;
  size?: string;
}): JSX.Element {
  return (
    <div className="pt-1">
      <Dialog>
        <DialogTrigger asChild>
          <span>
            <Icon className="cursor-pointer" size={size} />
          </span>
        </DialogTrigger>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Ajuda</DialogTitle>
          </DialogHeader>
          <div className="pt-1 pb-2" dangerouslySetInnerHTML={{ __html: tooltip }} />
          <div className="flex justify-end">
            <DialogClose asChild>
              <Button type="button" variant="outline" size="sm">
                Fechar
              </Button>
            </DialogClose>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default HelpTooltipClickable;
