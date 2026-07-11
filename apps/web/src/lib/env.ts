/** Demo/fake payment methods — hidden in production builds. */
export function isDemoPaymentsEnabled(): boolean {
  return process.env.NODE_ENV !== 'production';
}
