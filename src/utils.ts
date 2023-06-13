export const reducer =
  <T extends Record<string, unknown>>() =>
  (state: T, action: Partial<T>) => ({
    ...state,
    ...action,
  });

export const capitalize = (string: string): string => {
  if (!string) return "";
  return string.charAt(0).toUpperCase() + string.slice(1).toLowerCase();
};
