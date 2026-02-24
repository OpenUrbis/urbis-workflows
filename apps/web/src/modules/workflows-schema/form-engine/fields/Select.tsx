import { IField, IFormContext, SelectOptions } from "@open-urbis/types";
import { useContext } from "react";
import { FaCaretSquareDown } from "react-icons/fa";
import {
  Select as DSSelect,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@open-urbis/map-ui";
import { StyleContext } from "../../../../reducers/style.reducer";

export type FieldSelectProps = {
  field: IField;
  fieldKey: string;
  onChange: (value: string) => void;
  options: SelectOptions;
  value?: string | number;
  general: IFormContext;
};

export const Select: React.FC<FieldSelectProps> = ({
  field,
  fieldKey,
  onChange,
  options,
  value,
  general,
}) => {
  const styleContext = useContext(StyleContext);
  const isReadonly =
    options.readOnly === true ||
    (general?.$state === "edition" && options.enableEdition !== true);

  if (!options?.items?.length) {
    return (
      <div className="flex items-start space-x-4 py-4 text-gray-500">
        <FaCaretSquareDown size={24} className="mt-1 opacity-50" />
        <div>
          <p
            className="text-sm mb-1"
            style={{ color: styleContext.state.textColor }}
          >
            Nenhuma opção configurada
          </p>
          <p
            className="text-xs"
            style={{ color: styleContext.state.textColor }}
          >
            Configure as opções nas propriedades do campo
          </p>
        </div>
      </div>
    );
  }

  return (
    <DSSelect
      value={value !== undefined && value !== null ? value.toString() : undefined}
      onValueChange={(selectedValue) => {
        const originalTypeValue = options.items?.find(
          (item) => item.value.toString() === selectedValue
        )?.value;

        if (originalTypeValue !== undefined && originalTypeValue !== null) {
          onChange(originalTypeValue);
        } else {
          onChange(selectedValue);
        }
      }}
      disabled={isReadonly}
    >
      <SelectTrigger className={`w-full h-11 ${isReadonly ? "cursor-not-allowed" : ""}`}>
        <SelectValue placeholder={options?.placeholder ?? "Selecione"} />
      </SelectTrigger>
      <SelectContent className="z-[1601]">
        {options?.items?.map((item) => (
          <SelectItem key={fieldKey + "#" + item.label} value={item.value.toString()}>
            {item.label}
          </SelectItem>
        ))}
      </SelectContent>
    </DSSelect>
  );
};
