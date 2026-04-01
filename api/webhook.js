// ============================================================
// api/webhook.js
// LINE Webhook中継エンドポイント（Vercel Serverless Function）
// LINEに即座に200を返し、Apps Scriptへの転送はバックグラウンドで行う
// ============================================================

const GAS_URL = process.env.VITE_GAS_URL || '';

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

  // レスポンス後にバックグラウンドでApps Scriptに転送する
  try {
    await fetch(GAS_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      redirect: 'follow',
    });
  } catch (err) {
    console.error('Apps Script転送エラー:', err);
  }
}
