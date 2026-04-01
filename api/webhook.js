// ============================================================
// api/webhook.js
// LINE Webhook中継エンドポイント（Vercel Serverless Function）
// LINE → Vercel → Apps Script の順にリクエストを中継する
// ============================================================

const GAS_URL = process.env.VITE_GAS_URL || '';

export default async function handler(req, res) {
  // LINEのVerifyリクエスト（GET）に対応する
  if (req.method === 'GET') {
    return res.status(200).json({ status: 'ok' });
  }

  // POSTリクエスト以外は拒否する
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    // LINEから受け取ったbodyをApps Scriptに転送する
    const body = req.body;

    // Apps ScriptにPOSTリクエストを送信する
    const response = await fetch(GAS_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      redirect: 'follow', // 302リダイレクトを自動追従する
    });

    // Apps Scriptのレスポンスをそのまま返す
    const data = await response.json();
    return res.status(200).json(data);
  } catch (err) {
    console.error('Webhook中継エラー:', err);
    // LINEには必ず200を返す（エラーでも再送されてしまうため）
    return res.status(200).json({ status: 'ok' });
  }
}
