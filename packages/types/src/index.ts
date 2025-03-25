import { Transform } from "class-transformer";

export * from "./field.interface";
export * from "./options.interface";

export function ToBoolean() {
  return Transform(({ value }) => {
    if (typeof value === "boolean") return value;
    if (typeof value === "string") {
      return value.toLowerCase() === "true";
    }
    return undefined;
  });
}
