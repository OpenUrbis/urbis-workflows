import React from "react";
import {
  Button,
  Dialog,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@open-urbis/map-ui";
import { FaInfoCircle } from "react-icons/fa";

const InfoTooltip = ({
  content,
  children,
  icon: Icon = FaInfoCircle,
  size = "14px",
  showIcon = false,
}: {
  content: React.ReactNode;
  children: React.ReactNode;
  icon?: React.ElementType;
  size?: string;
  showIcon?: boolean;
}) => {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <div className="inline-flex items-center cursor-pointer">
          {children}
          {showIcon && <Icon className="ml-1" size={size} color="#9CA3AF" />}
        </div>
      </DialogTrigger>
      <DialogContent className="max-w-lg bg-background text-foreground border-border">
        <DialogHeader>
          <DialogTitle className="text-foreground">Informações</DialogTitle>
        </DialogHeader>
        <div className="max-h-[400px] overflow-y-auto pr-2 text-foreground">{content}</div>
        <DialogFooter>
          <DialogClose asChild>
            <Button type="button" variant="outline" size="sm">
              Fechar
            </Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default InfoTooltip;
