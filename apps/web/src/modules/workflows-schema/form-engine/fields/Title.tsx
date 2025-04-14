import { IFormContext, TitleOptions } from "@open-urbis/types";

export type FieldTitleProps = {
  key: string;
  options: TitleOptions;
  general?: IFormContext;
};

export const Title: React.FC<FieldTitleProps> = ({ key, options }) => {
  return (
    <h1 key={key} className="text-xl font-black">
      {options.title}
    </h1>
  );
};
