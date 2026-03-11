import React from "react";
import { HelpTooltipClickable } from "../../../../components";
import { MdSecurity } from "react-icons/md";
import { usePermissions } from "../../../../reducers/permission.context";
import { SensibilityLevelEnum } from "../../../../api/types/schema";

export const RenderFieldPrivacyInfo = ({
  sensibilityLevel,
  accessLevel,
  permissions,
}: {
  sensibilityLevel?: number;
  accessLevel?: number;
  permissions?: any;
}) => {
  const { userIam, hasSensibilityAccess } = usePermissions();

  // Skip rendering if no sensibility level or permission restrictions
  if (sensibilityLevel === undefined || sensibilityLevel === 0) {
    if (
      !permissions ||
      (!permissions.users?.length &&
        !permissions.roles?.length &&
        !permissions.groups?.length)
    ) {
      return null;
    }
  }

  // Check sensibility level access (user level must be >= field level)
  const hasSensibility = hasSensibilityAccess(sensibilityLevel);

  // Check if user has required permissions to access the field
  const checkUserPermissionAccess = () => {
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

    // If no specific permissions are set, allow access
    if (
      !permissions ||
      (!permissions.users?.length &&
        !permissions.roles?.length &&
        !permissions.groups?.length)
    ) {
      return true;
    }

    return false;
  };

  const hasPermissionAccess = checkUserPermissionAccess();
  const hasAccess = hasSensibility && hasPermissionAccess;

  // Get sensibility level description
  const getSensibilityDescription = () => {
    switch (sensibilityLevel) {
      case SensibilityLevelEnum.PERSONAL:
        return "Dados pessoais";
      case SensibilityLevelEnum.SENSITIVE:
        return "Dados sensíveis";
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
      content += `<div class="font-bold text-blue-600">Informação de Privacidade de Dados</div>`;
    } else if (permissions) {
      content += `<div class="font-bold text-blue-600">Permissões Específicas Requeridas</div>`;
    }

    // Add sensibility level information if applicable
    if (sensibilityLevel !== undefined && sensibilityLevel !== 0) {
      content += `
        <div>
          <span class="font-semibold">Classificação LGPD:</span> ${getSensibilityDescription()}
          <div class="mt-1 text-sm text-gray-600">
            ${
              sensibilityLevel === SensibilityLevelEnum.PERSONAL
                ? "Dados que possam identificar uma pessoa natural."
                : "Dados sobre origem racial/étnica, convicção religiosa, opinião política, dados referentes à saúde, vida sexual, dados genéticos ou biométricos."
            }
          </div>
          ${
            !hasSensibility
              ? '<div class="mt-1 text-sm text-red-500">Seu nível de sensibilidade não é suficiente para visualizar este campo.</div>'
              : '<div class="mt-1 text-sm text-green-600">Você possui o nível de sensibilidade necessário para visualizar este campo.</div>'
          }
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

  // Get icon color based on access and sensibility
  const getIconColor = () => {
    if (!hasAccess) {
      return "text-red-500";
    }

    return "text-blue-500";
  };

  const iconClass = getIconColor();

  return (
    <div className={`${iconClass}`}>
      <HelpTooltipClickable
        tooltip={generateTooltipContent()}
        icon={MdSecurity}
        size="16px"
      />
    </div>
  );
};
