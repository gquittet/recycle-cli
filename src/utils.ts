export const reducer =
  <T extends Record<string, unknown>>() =>
  (state: T, action: Partial<T>) => ({
    ...state,
    ...action,
  });
