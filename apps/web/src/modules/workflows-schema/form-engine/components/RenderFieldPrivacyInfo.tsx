import React from "react";
import { HelpTooltipClickable } from "../../../../components";
import { MdSecurity } from "react-icons/md";
import { usePermissions } from "../../../../reducers/permission.context";
import {
  PrivacyLevelEnum,
  SensibilityLevelEnum,
} from "../../../../api/types/schema";

export const RenderFieldPrivacyInfo = ({
  sensibilityLevel,
  accessLevel,
  permissions,
}: {
  sensibilityLevel?: number;
  accessLevel?: number;
  permissions?: any;
}) => {
  const { userIam } = usePermissions();

  // Skip rendering if no sensibility level or access restrictions
  // NOT_APPLICABLE is 0
  if (sensibilityLevel === undefined || sensibilityLevel === 0) {
    if (accessLevel === undefined || accessLevel === 0) {
      // PUBLIC is 0
      if (
        !permissions ||
        (!permissions.users?.length &&
          !permissions.roles?.length &&
          !permissions.groups?.length)
      ) {
        return null;
      }
    }
  }

  // Check if user has required permissions to access the field
  const checkUserAccess = () => {
    // If dont have user logged in and have access restrictions, return false
    if (
      !userIam &&
      accessLevel !== undefined &&
      accessLevel !== 0 &&
      (permissions.users?.length ||
        permissions.roles?.length ||
        permissions.groups?.length)
    ) {
      return false;
    }

    if (
      accessLevel !== undefined &&
      userIam &&
      userIam?.accessLevel >= accessLevel
    ) {
      return true;
    }

    // Check if user has specific permissions
    if (permissions) {
      // Check user direct permissions
      const hasUserPermission = permissions.users?.some(
        (user: any) => user.id === userIam?.id
      );
      if (hasUserPermission) return true;

      // Check role permissions
      const hasRolePermission = permissions.roles?.some((role: any) =>
        userIam?.directRoles?.some((userRole) => userRole.id === role.id)
      );
      if (hasRolePermission) return true;

      // Check group permissions
      const hasGroupPermission = permissions.groups?.some((group: any) =>
        userIam?.groups?.some((userGroup) => userGroup.id === group.id)
      );
      if (hasGroupPermission) return true;
    }

    if (accessLevel === undefined) {
      return true;
    }

    return false;
  };

  const hasAccess = checkUserAccess();

  // Get sensibility level description
  const getSensibilityDescription = () => {
    switch (sensibilityLevel) {
      case SensibilityLevelEnum.PERSONAL: // PERSONAL is 1
        return "Dados pessoais";
      case SensibilityLevelEnum.SENSITIVE: // SENSITIVE is 2
        return "Dados sensíveis";
      case SensibilityLevelEnum.ANONYMIZED: // ANONYMIZED is 3
        return "Dados anonimizados";
      default:
        return "";
    }
  };

  // Get access level description
  const getAccessLevelDescription = () => {
    switch (accessLevel) {
      case PrivacyLevelEnum.REGISTERED: // REGISTERED is 1
        return "Somente usuários autenticados";
      case PrivacyLevelEnum.RESTRICTED: // RESTRICTED is 2
        return "Acesso restrito";
      case PrivacyLevelEnum.CONFIDENTIAL: // CONFIDENTIAL is 3
        return "Acesso confidencial";
      case PrivacyLevelEnum.ANONYMIZED: // ANONYMIZED is 4
        return "Dados anonimizados";
      default:
        return "";
    }
  };

  // Generate tooltip content
  const generateTooltipContent = () => {
    let content = `<div class="space-y-3">`;

    // Add title based on access
    if (!hasAccess) {
      content += `<div class="font-bold text-blue-600">Acesso Restrito</div>`;
    } else if (sensibilityLevel !== undefined && sensibilityLevel !== 0) {
      // NOT_APPLICABLE is 0
      content += `<div class="font-bold text-blue-600">Informação de Privacidade de Dados</div>`;
    } else if (accessLevel !== undefined && accessLevel !== 0) {
      // PUBLIC is 0
      content += `<div class="font-bold text-blue-600">Nível de Acesso Requerido</div>`;
    } else if (permissions) {
      content += `<div class="font-bold text-blue-600">Permissões Específicas Requeridas</div>`;
    }

    // Add sensibility level information if applicable
    if (sensibilityLevel !== undefined && sensibilityLevel !== 0) {
      // NOT_APPLICABLE is 0
      content += `
        <div>
          <span class="font-semibold">Classificação LGPD:</span> ${getSensibilityDescription()}
          <div class="mt-1 text-sm text-gray-600">
            ${
              sensibilityLevel === 1 // PERSONAL is 1
                ? "Dados que possam identificar uma pessoa natural."
                : sensibilityLevel === 2 // SENSITIVE is 2
                  ? "Dados sobre origem racial/étnica, convicção religiosa, opinião política, dados referentes à saúde, vida sexual, dados genéticos ou biométricos."
                  : "Dados que não possibilitam a identificação de uma pessoa."
            }
          </div>
        </div>
      `;
    }

    // Add access level information if applicable
    if (accessLevel !== undefined && accessLevel !== 0) {
      // PUBLIC is 0
      content += `
        <div>
          <span class="font-semibold">Nível de Acesso:</span> ${getAccessLevelDescription()}
          <div class="mt-1 text-sm text-gray-600">
            ${
              !hasAccess
                ? "Você não possui as permissões necessárias para visualizar este campo."
                : "Você possui o nível de acesso necessário para visualizar este campo."
            }
          </div>
        </div>
      `;
    }

    // Add permissions information if applicable
    if (
      permissions &&
      (permissions.users?.length ||
        permissions.roles?.length ||
        permissions.groups?.length)
    ) {
      content += `
        <div>
          <span class="font-semibold">Permissões específicas:</span>
          <div class="mt-1 text-sm text-gray-600">
            ${
              !hasAccess
                ? "Você não possui as permissões específicas necessárias para visualizar este campo."
                : "Você possui as permissões específicas necessárias para visualizar este campo."
            }
          </div>
        </div>
      `;
    }

    // Add explanation about redacted data if user doesn't have access
    if (!hasAccess) {
      content += `
        <div class="mt-2 pt-2 border-t border-gray-200">
          <div class="font-semibold text-red-500">Conteúdo Protegido</div>
          <div class="text-sm">
            O valor deste campo será apresentado como [REDACTED] devido às restrições de acesso.
          </div>
        </div>
      `;
    }

    content += `</div>`;
    return content;
  };

  // Determine which icon to use
  const getIcon = () => {
    return MdSecurity;
  };

  // Get icon color based on access and sensibility
  const getIconColor = () => {
    if (!hasAccess) {
      return "text-red-500";
    }

    return "text-blue-500";
  };

  const Icon = getIcon();
  const iconClass = getIconColor();

  return (
    <div className={`${iconClass}`}>
      <HelpTooltipClickable
        tooltip={generateTooltipContent()}
        icon={Icon}
        size="16px"
      />
    </div>
  );
};
