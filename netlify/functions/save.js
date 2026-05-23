const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_KEY;

exports.handler = async function handler(event) {
  const headers = {
    'Content-Type': 'application/json',
    apikey: SUPABASE_KEY,
    Authorization: `Bearer ${SUPABASE_KEY}`,
    Prefer: 'return=representation',
  };

  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 204,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
      },
      body: '',
    };
  }

  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, headers: { 'Access-Control-Allow-Origin': '*' }, body: JSON.stringify({ error: 'Method not allowed' }) };
  }

  let payload = {};
  try {
    payload = JSON.parse(event.body || '{}');
  } catch (e) {
    return { statusCode: 400, headers: { 'Access-Control-Allow-Origin': '*' }, body: JSON.stringify({ error: 'Invalid JSON' }) };
  }

  const secret = (payload.secret || '').trim();
  const trip = payload.trip || null;
  if (!secret || !trip) {
    return { statusCode: 400, headers: { 'Access-Control-Allow-Origin': '*' }, body: JSON.stringify({ error: 'Secret and trip are required' }) };
  }

  if (!SUPABASE_URL || !SUPABASE_KEY) {
    return { statusCode: 500, headers: { 'Access-Control-Allow-Origin': '*' }, body: JSON.stringify({ error: 'Server not configured' }) };
  }

  try {
    // First try to update an existing row
    const patchRes = await fetch(
      `${SUPABASE_URL}/rest/v1/journeys?secret=eq.${encodeURIComponent(secret)}`,
      { method: 'PATCH', headers, body: JSON.stringify({ trip, updated_at: new Date().toISOString() }) }
    );

    if (patchRes.ok) {
      // If patched or returned representation, respond success
      return { statusCode: 200, headers: { 'Access-Control-Allow-Origin': '*' }, body: JSON.stringify({ success: true }) };
    }

    // If patch didn't succeed (for example no row), insert
    const postRes = await fetch(
      `${SUPABASE_URL}/rest/v1/journeys`,
      { method: 'POST', headers, body: JSON.stringify({ secret, trip, updated_at: new Date().toISOString() }) }
    );

    if (!postRes.ok) throw new Error(`Supabase returned ${postRes.status}`);
    return { statusCode: 200, headers: { 'Access-Control-Allow-Origin': '*' }, body: JSON.stringify({ success: true }) };
  } catch (error) {
    return { statusCode: 500, headers: { 'Access-Control-Allow-Origin': '*' }, body: JSON.stringify({ error: error.message || 'Save failed' }) };
  }
};
