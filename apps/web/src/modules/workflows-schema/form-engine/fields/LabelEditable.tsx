import { FieldLabelProps } from "./Label";
import EditableHeader from "../../../../components/EditableHeader";

export type FieldLabelEditableProps = {
  fieldKey: string;
  onChange: (options: FieldLabelProps) => void;
  props: FieldLabelProps;
};

export const LabelEditable: React.FC<FieldLabelEditableProps> = ({
  fieldKey,
  onChange,
  props,
}) => {
  return (
    <div className="flex space-x-2">
      <EditableHeader
        key={fieldKey}
        value={props.options.label}
        className="mb-3.5"
        onTextChange={(value) => {
          onChange({
            ...props,
            options: { ...props.options, label: value },
          });
        }}
      ></EditableHeader>
      <div className="text-red-500">
        {props.options.required === true && "*"}
      </div>
    </div>
  );
};
