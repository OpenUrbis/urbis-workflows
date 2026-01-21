import EditableHeader from "../../../../components/EditableHeader";
import { FieldParagraphProps } from "./Paragraph";

export type FieldParagraphEditableProps = {
  key: string;
  onChange: (options: FieldParagraphProps) => void;
  props: FieldParagraphProps;
};

export const ParagraphEditable: React.FC<FieldParagraphEditableProps> = ({
  key,
  onChange,
  props,
}) => {
  return (
    <EditableHeader
      key={key}
      html={props.options.html}
      className="font-normal"
      onTextChange={(value) => {
        onChange({ key, options: { html: value } });
      }}
    ></EditableHeader>
  );
};
