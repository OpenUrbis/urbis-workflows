import { ActivityTypeEnum } from "../../../api/types/schema";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

export const getActivityTypeLabel = (type: ActivityTypeEnum) => {
  switch (type) {
    case ActivityTypeEnum.FORM:
      return "Formulário";
    case ActivityTypeEnum.SIGNATURE:
      return "Assinatura";
    case ActivityTypeEnum.DOCUMENT:
      return "Documento";
    case ActivityTypeEnum.TAX:
      return "Taxa";
    default:
      return "Desconhecido";
  }
};

export const truncateText = (text: string, maxLength: number = 60) => {
  if (!text) return "";
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength) + "...";
};

export const formatDate = (date: string | Date | number) => {
  const dateObj =
    typeof date === "string" || typeof date === "number"
      ? new Date(date)
      : date;

  return format(dateObj, "dd 'de' MMMM 'de' yyyy 'às' HH:mm", {
    locale: ptBR,
  });
};

export const formatId = (id: string) => {
  return id.split("-").pop() || id;
};
