import { SubtitleOptions } from "@open-urbis/types";
import { memo } from "react";

export type FieldParagraphProps = {
  key: string;
  options: SubtitleOptions;
};

export const Paragraph: React.FC<FieldParagraphProps> = memo(({ options }) => {
  return (
    <p
      className="text-sm font-normal"
      dangerouslySetInnerHTML={{ __html: options.html ?? "" }}
    ></p>
  );
});
