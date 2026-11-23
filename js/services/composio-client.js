/** Lazy MCP bridge adapter for Composio and connected toolkits. */
export function createComposioClient({ getHost }) {
  let bridge = null;
  async function getBridge() {
    if (bridge === null) {
      try {
        const host = getHost();
        bridge = host ? (await host.use("mcp")) || false : false;
      } catch {
        bridge = false;
      }
    }
    return bridge || null;
  }
  async function callTool(provider, tool, args) {
    const currentBridge = await getBridge();
    if (!currentBridge) throw { code: "unavailable" };
    return currentBridge.callTool(provider, tool, args);
  }
  async function callComposio(tool, args) {
    const result = await callTool("composio", tool, args);
    return result.payload || {};
  }
  async function connectionStatus(slug) {
    const result = await callComposio("COMPOSIO_MANAGE_CONNECTIONS", {
      toolkits: [{ name: slug, action: "list" }],
    });
    const toolkit = ((result.data || {}).results || {})[slug] || {};
    return (toolkit.accounts || []).some((account) =>
      /active/i.test(account.status || ""),
    )
      ? "connected"
      : "none";
  }
  async function addConnection(slug) {
    const result = await callComposio("COMPOSIO_MANAGE_CONNECTIONS", {
      toolkits: [{ name: slug, action: "add" }],
    });
    return (((result.data || {}).results || {})[slug] || {}).redirect_url || "";
  }
  return { getBridge, callTool, callComposio, connectionStatus, addConnection };
}
