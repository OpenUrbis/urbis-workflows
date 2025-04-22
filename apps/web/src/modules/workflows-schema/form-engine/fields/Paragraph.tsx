import { SubtitleOptions } from "@open-urbis/types";

export type FieldParagraphProps = {
  key: string;
  options: SubtitleOptions;
};

export const Paragraph: React.FC<FieldParagraphProps> = ({ key, options }) => {
  return (
    <p
      key={key}
      className="font-normal"
      dangerouslySetInnerHTML={{ __html: options.html ?? "" }}
    ></p>
  );
};
