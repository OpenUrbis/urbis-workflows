import { Checkbox as CheckboxBase } from "@chakra-ui/react";
import { useContext } from "react";
import { FaCheckSquare } from "react-icons/fa";
import { IField, IFormContext, CheckboxOptions } from "@open-urbis/types";
import { StyleContext } from "../../../../reducers/style.reducer";

export type FieldCheckboxProps = {
  field: IField;
  fieldKey: string;
  options: CheckboxOptions;
  value: { [value: string]: boolean } | undefined;
  general: IFormContext;
  onChange: (value: { [value: string]: boolean } | undefined) => void;
};

export const Checkbox: React.FC<FieldCheckboxProps> = ({
  field,
  fieldKey,
  onChange,
  options,
  value = {},
  general,
}) => {
  const styleContext = useContext(StyleContext);
  const isReadonly =
    options.readOnly === true ||
    (general?.$state === "edition" && options.enableEdition !== true);

  if (!options?.items?.length) {
    return (
      <div className="flex items-start space-x-4 py-4 text-gray-500">
        <FaCheckSquare size={24} className="mt-1 opacity-50" />
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
    <div>
      {options?.items?.map((item: { label: string; value: any }) => (
        <div key={item.label} className="mb-1">
          <CheckboxBase
            key={fieldKey + "#" + item.label}
            size="lg"
            isChecked={value[item.value] === true}
            colorScheme="yellow"
            className={isReadonly ? "cursor-not-allowed" : ""}
            borderRadius="md"
            sx={{
              "span.chakra-checkbox__control": {
                borderRadius: "0.375rem",
              },
            }}
            onChange={(e) => {
              if (e.target.checked) {
                value[item.value] = true;
              } else {
                delete value[item.value];
              }

              if (Object.keys(value).length === 0) {
                onChange(undefined);
              } else {
                onChange(value);
              }
            }}
            disabled={isReadonly}
          >
            {item.label}
          </CheckboxBase>
        </div>
      ))}
    </div>
  );
};
