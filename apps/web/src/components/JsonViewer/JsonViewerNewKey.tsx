import { Button } from "@open-urbis/map-ui";
import { Input } from "../Input";
import { IconButton } from "../LegacyUi";
import { useState } from "react";
import { FaPlus } from "react-icons/fa";

export const JsonViewerNewKey = (props: { newKey: (key: string) => void }) => {
  const { newKey = () => {} } = props;
  const [isOpen, setIsOpen] = useState(false);
  const [value, setValue] = useState<string>("");

  const createKey = () => {
    setIsOpen(false);
    newKey(value);
  };

  return (
    <div className="relative inline-flex">
      <IconButton
        aria-label="Create key"
        onClick={() => setIsOpen((v) => !v)}
        className="h-6 w-6"
        icon={<FaPlus />}
      />
      {isOpen && (
        <div className="absolute z-[2000] right-0 mt-2 rounded-md border bg-popover p-4 text-popover-foreground shadow-md px-4 py-2.5 w-auto max-w-[1500px]">
          <div className="create-key">
            <Input
              placeholder="Chave do objeto"
              value={value}
              onChange={(event) => setValue(event.target.value)}
            />
            <Button className="ml-2" onClick={() => createKey()}>
              Criar
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};
