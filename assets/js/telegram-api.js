async function tgApi(token, method, params, signal) {
    const url = `https://api.telegram.org/bot${token}/${method}`;
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params || {}),
      signal
    });

    const data = await res.json();
    if (!data.ok) {
        // for debugging only
        const err = new Error(data.description || `Telegram API error (${method})`);
        err.tgResponse = data;
        throw err;
    }
    return data.result;
}

async function checkToken(token) {
    try {
      const me = await tgApi(token, 'getMe');
      return { ok: true, me };
    } catch (e) {
      return { ok: false, error: e.message };
    }
}