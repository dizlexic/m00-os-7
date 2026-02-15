/**
 * Health check endpoint for deployment monitoring.
 * Used by Digital Ocean App Platform and Docker health checks.
 * 
 * @returns Health status response
 */
export default defineEventHandler(() => {
  return {
    status: 'ok',
    timestamp: new Date().toISOString(),
    service: 'm00-os-7'
  };
});
