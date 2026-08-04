import { jwtDecode } from 'jwt-decode';
import { EUserRole } from '../../shared/store/user.types';

export const getUserIdFromToken = (token: string | null): number | undefined => {
  if (!token) return undefined;
  try {
    const decodedToken = jwtDecode<{ user_id?: number | string }>(token);
    const rawId = decodedToken.user_id;
    if (rawId === undefined || rawId === null) return undefined;
    const parsedId = Number(rawId);
    return Number.isNaN(parsedId) ? undefined : parsedId;
  } catch (error) {
    return undefined;
  }
};

export const getUserRoleFromToken = (token: string | null): EUserRole | undefined => {
  if (!token) return undefined;
  try {
    const decodedToken = jwtDecode<{ role?: EUserRole }>(token);
    return decodedToken.role;
  } catch (error) {
    return undefined;
  }
};

export const isUserAdmin = (token: string | null): boolean => {
  const role = getUserRoleFromToken(token);
  return role === EUserRole.ADMIN;
};

export const isUserSupplier = (token: string | null): boolean => {
  const role = getUserRoleFromToken(token);
  return role === EUserRole.SUPPLIER;
};

export const isUserAdminOrSupplier = (token: string | null): boolean => {
  const role = getUserRoleFromToken(token);
  return role === EUserRole.ADMIN || role === EUserRole.SUPPLIER;
};
