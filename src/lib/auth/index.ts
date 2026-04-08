import { AppRoleCode } from "@prisma/client";

export interface MockSessionUser {
  id: string;
  name: string;
  email: string;
  roles: AppRoleCode[];
}

/**
 * Retorna o usuário logado via "Mock" (para fins de MVP).
 * No futuro isso será substituído por NextAuth ou Supabase Auth real.
 */
export async function getCurrentUser(): Promise<MockSessionUser | null> {
  return {
    id: "uuid-mock-admin-1234",
    name: "Admin User",
    email: "admin@rankinghub.local",
    roles: [
      AppRoleCode.admin_platform,
      AppRoleCode.auditor_restricted,
      AppRoleCode.manager_operational,
      AppRoleCode.viewer_internal
    ],
  };
}

/**
 * Checa se o usuário atual tem a role requerida.
 */
export async function hasRole(requiredRole: AppRoleCode): Promise<boolean> {
  const user = await getCurrentUser();
  if (!user) return false;
  return user.roles.includes(requiredRole);
}

/**
 * Interrompe a requisição (joga throw) se o usuário não tiver permissão.
 * Pode ser usado em Server Actions ou Server Components.
 */
export async function requireAuth(roles?: AppRoleCode[]): Promise<MockSessionUser> {
  const user = await getCurrentUser();
  if (!user) {
    throw new Error("Unauthorized");
  }
  
  if (roles && roles.length > 0) {
    const hasAnyRole = roles.some((role) => user.roles.includes(role));
    if (!hasAnyRole) {
      throw new Error("Forbidden: Insufficient privileges");
    }
  }

  return user;
}
