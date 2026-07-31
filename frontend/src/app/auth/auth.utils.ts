import { jwtDecode } from 'jwt-decode';

export const getUserIdFromToken = (token: string | null): number | undefined => {
  if (!token) return undefined;
  try {
    const decodedToken = jwtDecode<{ id?: number | string }>(token);
    const rawId = decodedToken.id;
    if (rawId === undefined || rawId === null) return undefined;
    const parsedId = Number(rawId);
    return Number.isNaN(parsedId) ? undefined : parsedId;
  } catch (error) {
    return undefined;
  }
};
