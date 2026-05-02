const GAS_URL = 'https://script.google.com/macros/s/AKfycbwj9Q0wnJ05Tlf4V9gG20qhRMf1YSEmmzFXFC_osPSDFuSckGjIp3k8qiRF29JOHlnn-A/exec';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // LINEに即座に200を返す（5秒タイムアウト対策）
  res.status(200).json({ status: 'ok' });

  // バックグラウンドでGASに転送
  try {
    await fetch(GAS_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(req.body),
    });
  } catch (err) {
    console.error('GAS転送エラー:', err);
  }
}
