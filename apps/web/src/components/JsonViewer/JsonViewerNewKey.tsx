import {
  Button,
  IconButton,
  Input,
  Popover,
  PopoverArrow,
  PopoverBody,
  PopoverContent,
  PopoverTrigger,
  Portal,
  useDisclosure,
} from "@chakra-ui/react";
import { useState } from "react";
import { FaPlus } from "react-icons/fa";

export const JsonViewerNewKey = (props: { newKey: (key: string) => void }) => {
  const { newKey = () => {} } = props;
  const { isOpen, onToggle, onClose } = useDisclosure();
  const [value, setValue] = useState<string>("");

  const createKey = () => {
    onToggle();

    newKey(value);
  };

  return (
    <Popover placement="auto" isOpen={isOpen} onClose={onClose}>
      <PopoverTrigger>
        <IconButton
          size={"xs"}
          aria-label="Copy item"
          onClick={() => onToggle()}
        >
          <FaPlus />
        </IconButton>
      </PopoverTrigger>
      <Portal>
        <PopoverContent className="px-4 py-2.5" width="auto" maxWidth="1500px">
          <PopoverArrow />
          <PopoverBody className="create-key">
            <Input
              placeholder="Chave do objeto"
              onChange={(event) => setValue(event.target.value)}
            />
            <Button className="ml-2" onClick={() => createKey()}>
              Criar
            </Button>
          </PopoverBody>
        </PopoverContent>
      </Portal>
    </Popover>
  );
};
