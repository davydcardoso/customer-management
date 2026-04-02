export const getValueByPath = (source: unknown, path: string) => {
  if (!source || !path) {
    return undefined
  }

  return path.split(".").reduce<unknown>((value, segment) => {
    if (value === null || value === undefined || typeof value !== "object") {
      return undefined
    }

    return (value as Record<string, unknown>)[segment]
  }, source)
}
