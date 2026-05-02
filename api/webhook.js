// ============================================================
// api/webhook.js
// LINE Webhook中継エンドポイント（Vercel Serverless Function）
// ============================================================

const GAS_URL = 'https://script.google.com/macros/s/AKfycbwj9Q0wnJ05Tlf4V9gG20qhRMf1YSEmmzFXFC_osPSDFuSckGjIp3k8qiRF29JOHlnn-A/exec';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const body = req.body;

  // GASに転送してから200を返す
  try {
    const response = await fetch(GAS_URL, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'User-Agent': 'Mozilla/5.0'
      },
      body: JSON.stringify(body),
      redirect: 'follow',
    });
    console.log('GAS応答ステータス:', response.status);
  } catch (err) {
    console.error('Apps Script転送エラー:', err.message);
  }

  // 最後に200を返す
  return res.status(200).json({ status: 'ok' });
}