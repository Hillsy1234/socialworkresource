export function discoveryConfiguration() {
  if (Netlify.env.get('DISCOVERY_ENABLED') !== 'true') return { ready: false, status: 'disabled', message: 'Web-search discovery is not enabled. Registered source checks continue separately.' };
  if (!Netlify.env.get('TAVILY_API_KEY')) return { ready: false, status: 'not-configured', message: 'Add the Tavily API key to production Functions and redeploy.' };
  return { ready: true, status: 'enabled', message: 'Tavily basic search enabled (96 planned searches; 288-attempt monthly limit). Findings require editorial review; search does not guarantee complete coverage.' };
}
