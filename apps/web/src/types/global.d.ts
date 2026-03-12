import { IField, User } from "@open-urbis/types";

export interface ProtocolIntegrations {
  sei?: {
    IdUnidade?: string;
    IdTipoProcedimento?: string;
    NivelAcesso?: 0 | 1 | 2;
    IdHipoteseLegal?: string | number;
    CoverLetterIdSerie?: number;
    DocumentIdSerie?: number;
    /** @deprecated Use DocumentIdSerie for document and plate */
    PlateIdSerie?: number;
    TaxDocumentIdSerie?: number;
    FormIdSerie?: number;
    SignatureIdSerie?: number;
    DespachoIdSerie?: number;
    UploadIdSerie?: number;
    coverLetter?: string;
    /** Template do resumo usado em agendarPublicacao ao encerrar o processo no SEI */
    publicationSummaryTemplate?: string;
    /** Id do veículo de publicação (SEI), usado em agendarPublicacao ao encerrar */
    IdVeiculoPublicacao?: string;
  };
  register?: {
    sei?: {
      IdProcedimento?: string;
      LinkAcesso?: string;
      ProcedimentoFormatado?: string;
    };
  };
}

export interface Protocol {
  createdBy: string;
  document: any;
  plate?: any;
  field: Field;
  id: string;
  protocol: any;
  tax: string;
  status: "WAITING_ACCEPTANCE" | "WAITING_TAX_PAYMENT" | "CONCLUDED";
  timestamp: Date;
  acceptance: { [key: string]: Field };
  acceptances: any[];
  environment: any[];
  function: any;
  integrations?: ProtocolIntegrations;
  // history
  diff: any;
  versions: any[];
  // special
  $user: User;
}

declare global {
  async function prompt<T = string>(
    title: string,
    defaultValue?: T extends object ? T : string,
    fields?: IField[],
    options?: {
      code?: boolean;
      tooltip?: string;
      validator?: (value: any) => boolean;
      errorMessage?: string;
      intellisenseObj?: {
        obj: any;
        docs?: any;
      };
      isIndexSelector?: boolean;
    }
  ): Promise<T | null>;

  async function confirmation(
    message: string,
    options?: {
      title?: string;
      type?: "warning" | "success" | "question";
      confirmText?: string;
      cancelText?: string;
    }
  ): Promise<boolean>;
}

export {};
