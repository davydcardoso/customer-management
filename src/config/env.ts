const trimTrailingSlash = (value: string) => value.replace(/\/+$/, "")

export const env = {
  apiBaseUrl: trimTrailingSlash(
    import.meta.env.DEV
      ? "http://localhost:3300"
      : "https://customers-api.notaja.cloud"
  ),
}
