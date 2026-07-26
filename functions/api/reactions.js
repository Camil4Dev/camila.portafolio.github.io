export async function onRequest(context) {
  const { request, env } = context;
  const headers = {
    apikey: env.SUPABASE_KEY,
    Authorization: `Bearer ${env.SUPABASE_KEY}`,
    'Content-Type': 'application/json'
  };

  try {
    if (request.method === 'POST') {
      const body = await request.json().catch(() => ({}));
      const emoji = typeof body.emoji === 'string' ? body.emoji : '';
      const res = await fetch(`${env.SUPABASE_URL}/rest/v1/rpc/add_reaction`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ p_emoji: emoji })
      });
      const count = await res.json();
      return Response.json({ count });
    }

    const res = await fetch(`${env.SUPABASE_URL}/rest/v1/reactions?select=emoji,count`, { headers });
    const rows = await res.json();
    return Response.json(rows);
  } catch (e) {
    return Response.json({ error: 'unavailable' }, { status: 502 });
  }
}
