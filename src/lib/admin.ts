export function isAdminToolsEnabled() {
  return process.env.ADMIN_TOOLS_ENABLED !== 'false'
}
