import EditableHeader from "../../../../components/EditableHeader";
import { FieldTitleProps } from "./Title";

export type FieldTitleEditableProps = {
  key: string;
  onChange: (options: FieldTitleProps) => void;
  props: FieldTitleProps;
};

export const TitleEditable: React.FC<FieldTitleEditableProps> = ({
  key,
  onChange,
  props,
}) => {
  return (
    <EditableHeader
      key={key}
      value={props.options.title}
      className="text-lg font-semibold"
      onTextChange={(value) => {
        onChange({
          key,
          options: { title: value },
        });
      }}
    ></EditableHeader>
  );
};
