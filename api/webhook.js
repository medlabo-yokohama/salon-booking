// ============================================================
// api/webhook.js
// LINE Webhook中継エンドポイント（Vercel Serverless Function）
// ============================================================

export default async function handler(req, res) {
  // GETリクエスト（Verify）に即座に200を返す
  if (req.method === 'GET') {
    return res.status(200).json({ status: 'ok' });
  }

  // POST以外は拒否する
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const body = req.body;

  // LINEに即座に200を返す（5秒タイムアウト防止）
  res.status(200).json({ status: 'ok' });

  // Apps ScriptのURLを環境変数から取得する
  const GAS_URL = process.env.VITE_GAS_URL || '';
  if (!GAS_URL) {
    console.error('VITE_GAS_URL が設定されていません');
    return;
  }

  // Apps Scriptは302リダイレクトを返すため
  // manualでリダイレクトを受け取り、LocationヘッダーのURLに再リクエストする
  try {
    const firstRes = await fetch(GAS_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      redirect: 'manual',
    });

    // 302リダイレクトの場合はLocationヘッダーのURLに再リクエストする
    if (firstRes.status === 302 || firstRes.status === 301) {
      const redirectUrl = firstRes.headers.get('location');
      if (redirectUrl) {
        await fetch(redirectUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        });
        console.log('リダイレクト先に転送完了:', redirectUrl);
      }
    } else {
      console.log('Apps Script転送完了 ステータス:', firstRes.status);
    }
  } catch (err) {
    console.error('Apps Script転送エラー:', err.message);
  }
}
