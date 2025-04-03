import { IsDate, IsObject, IsString } from "class-validator";
import { PrivacyLevelEnum } from "./options.interface";

export class User {
  @IsString()
  id: string;

  @IsString()
  email: string;

  @IsString()
  document: string;

  @IsString()
  name: string;

  @IsObject()
  custom: any;

  @IsObject()
  authorization: {
    accessLevel: PrivacyLevelEnum;
    permissions: string[];
  };

  @IsDate()
  timestamp: Date;

  @IsDate()
  updatedAt: Date;
}
