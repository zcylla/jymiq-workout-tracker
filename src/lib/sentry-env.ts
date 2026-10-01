export function sentryEnvironment(
  applicationId: string | null | undefined,
): 'development' | 'production' {
  return applicationId?.endsWith('.dev') ? 'development' : 'production';
}
