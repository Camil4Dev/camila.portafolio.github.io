export async function onRequest(context) {
  const { request, env } = context;
  const headers = {
    apikey: env.SUPABASE_KEY,
    Authorization: `Bearer ${env.SUPABASE_KEY}`,
    'Content-Type': 'application/json'
  };

  try {
    let count;
    if (request.method === 'POST') {
      const res = await fetch(`${env.SUPABASE_URL}/rest/v1/rpc/increment_view`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ p_page: 'profile' })
      });
      count = await res.json();
    } else {
      const res = await fetch(`${env.SUPABASE_URL}/rest/v1/page_views?select=count&page=eq.profile`, { headers });
      const rows = await res.json();
      count = rows.length ? rows[0].count : 0;
    }
    return Response.json({ count });
  } catch (e) {
    return Response.json({ error: 'unavailable' }, { status: 502 });
  }
}
