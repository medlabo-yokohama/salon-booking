// ============================================================
// line_liff_booking_v3.jsx
// LINE LIFF予約UI（利用者登録・自動入力対応）
// ============================================================
import React, { useState, useEffect } from 'react';

const GAS_URL = import.meta.env.VITE_GAS_URL || '';
const LIFF_ID = import.meta.env.VITE_LIFF_ID || '2009651620-UveMatZR';

// ============================================================
// API
// ============================================================
async function apiGet(params) {
  const url = new URL(GAS_URL);
  Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));
  return (await fetch(url.toString())).json();
}
async function apiPost(body) {
  return (await fetch(GAS_URL, { method: 'POST', body: JSON.stringify(body) })).json();
}

// ============================================================
// スタイル（顧客向けと共通のスマホUI）
// ============================================================
const C = { primary: '#1a4f8a', primaryPale: '#dbeafe', success: '#059669', danger: '#dc2626', warning: '#f59e0b', border: '#cbd5e1', text: '#1e293b', muted: '#64748b', surface: '#fff' };
const S = {
  wrap: { maxWidth: 480, margin: '0 auto', fontFamily: "'Noto Sans JP', sans-serif", fontSize: 13, background: C.surface, minHeight: '100vh', display: 'flex', flexDirection: 'column' },
  header: { background: C.primary, color: '#fff', padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 10 },
  headerTitle: { fontSize: 16, fontWeight: 700, flex: 1 },
  body: { flex: 1, padding: '16px' },
  formInput: { width: '100%', border: `1.5px solid ${C.border}`, borderRadius: 4, padding: '8px 10px', fontFamily: 'inherit', fontSize: 13, color: C.text, background: '#f8fafc', boxSizing: 'border-box', marginBottom: 12 },
  label: { display: 'block', fontSize: 12, fontWeight: 600, color: C.muted, marginBottom: 4 },
  btn: (v) => {
    const variants = { primary: { background: C.primary, color: '#fff' }, success: { background: C.success, color: '#fff' }, gray: { background: '#e2e8f0', color: C.text }, line: { background: '#06C755', color: '#fff' } };
    return { width: '100%', padding: '12px', border: 'none', borderRadius: 8, fontFamily: 'inherit', fontSize: 14, fontWeight: 700, cursor: 'pointer', marginBottom: 10, ...(variants[v] || variants.primary) };
  },
  card: { background: C.surface, border: `1px solid ${C.border}`, borderRadius: 8, padding: '14px 16px', marginBottom: 12, boxShadow: '0 2px 8px rgba(0,0,0,.08)' },
  note: { background: '#eff6ff', borderLeft: `4px solid ${C.primary}`, padding: '8px 12px', borderRadius: '0 4px 4px 0', fontSize: 11.5, marginBottom: 12, color: C.primary },
  required: { color: C.danger, fontSize: 11, marginLeft: 4 },
  autoFill: { color: C.muted, fontSize: 11.5, fontStyle: 'italic', marginBottom: 4 },
  step: (active) => ({ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 14px', borderRadius: 8, background: active ? C.primaryPale : '#f8fafc', border: `1.5px solid ${active ? C.primary : C.border}`, marginBottom: 8, cursor: 'pointer' }),
  stepNum: (active) => ({ width: 24, height: 24, borderRadius: '50%', background: active ? C.primary : C.border, color: active ? '#fff' : C.muted, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700, flexShrink: 0 }),
};

// ============================================================
// ステップ定義
// ============================================================
const STEPS = [
  { num: 1, label: 'コースを選ぶ' },
  { num: 2, label: '担当者を選ぶ' },
  { num: 3, label: '日時を選ぶ' },
  { num: 4, label: '情報を入力する' },
  { num: 5, label: '確認・送信' },
];

// ============================================================
// メインコンポーネント
// ============================================================
export default function LineLiffBooking() {
  const [liffReady, setLiffReady] = useState(false);
  const [lineProfile, setLineProfile] = useState(null);
  const [registeredUser, setRegisteredUser] = useState(null);
  const [step, setStep] = useState(1);
  const [menuList, setMenuList] = useState([]);
  const [staffList, setStaffList] = useState([]);
  const [availability, setAvail] = useState({});
  const [selection, setSelection] = useState({ menuId: '', staffId: '', date: '', slot: '' });
  const [form, setForm] = useState({ name: '', phone: '', email: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [completed, setCompleted] = useState(null);

  // LIFF初期化
  useEffect(() => {
    const initLiff = async () => {
      try {
        await liff.init({ liffId: LIFF_ID });
        setLiffReady(true);
        if (liff.isLoggedIn()) {
          const profile = await liff.getProfile();
          setLineProfile(profile);
          // LINE User IDで登録済みユーザーを検索して自動入力
          const res = await apiGet({ action: 'getUserProfile', lineUserId: profile.userId });
          if (res.success) {
            setRegisteredUser(res.data);
            setForm({ name: res.data.name, phone: res.data.phone || '', email: res.data.email || '' });
          }
        }
      } catch (err) {
        console.error('LIFF初期化エラー:', err);
        setLiffReady(true); // エラーでも続行
      }
    };
    initLiff();
    // マスターデータ取得
    Promise.all([
      apiGet({ action: 'getMenus' }).then(r => r.success && setMenuList(r.data.menus)),
      apiGet({ action: 'getStaff' }).then(r => r.success && setStaffList(r.data.staff)),
    ]);
  }, []);

  // 月の空き状況取得
  useEffect(() => {
    const today = new Date();
    apiGet({ action: 'getAvailability', year: today.getFullYear(), month: today.getMonth() + 1 })
      .then(r => r.success && setAvail(r.data.availability));
  }, []);

  const set = (key, val) => setSelection(prev => ({ ...prev, [key]: val }));
  const setF = (key, val) => setForm(prev => ({ ...prev, [key]: val }));

  // 予約送信
  const handleSubmit = async () => {
    if (!form.name) { setError('お名前は必須です'); return; }
    setLoading(true);
    const res = await apiPost({
      action: 'createBooking',
      datetime: `${selection.date} ${selection.slot}`,
      staffId: selection.staffId,
      menuId: selection.menuId,
      userName: form.name,
      userPhone: form.phone,
      userEmail: form.email,
      lineUserId: lineProfile?.userId || '',
    });
    if (res.success) {
      setCompleted(res.data.bookingId);
      // LINEに完了メッセージを送信（LIFF経由）
      if (liff.isLoggedIn() && liff.getOS() !== 'web') {
        try { await liff.sendMessages([{ type: 'text', text: `予約が完了しました！\n予約ID：${res.data.bookingId}\n日時：${selection.date} ${selection.slot}` }]); } catch (_) {}
      }
    } else {
      setError(res.error?.message || '予約に失敗しました');
    }
    setLoading(false);
  };

  // 選択済み情報の表示名
  const selectedMenu  = menuList.find(m => m.menuId === selection.menuId);
  const selectedStaff = staffList.find(s => s.staffId === selection.staffId);

  // 日付候補を生成（今日から30日分）
  const dateOptions = [];
  for (let i = 0; i < 30; i++) {
    const d = new Date();
    d.setDate(d.getDate() + i);
    const pad = n => String(n).padStart(2, '0');
    const dateStr = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
    const dayData = availability[dateStr];
    if (dayData !== null) dateOptions.push({ dateStr, d });
  }

  // 完了画面
  if (completed) {
    return (
      <div style={S.wrap}>
        <div style={S.header}><h3 style={S.headerTitle}>予約完了</h3></div>
        <div style={{ ...S.body, textAlign: 'center', paddingTop: 48 }}>
          <div style={{ fontSize: 56, marginBottom: 16 }}>✅</div>
          <h3 style={{ fontSize: 18, fontWeight: 700, color: C.primary, marginBottom: 12 }}>ご予約が完了しました</h3>
          <div style={{ background: C.primaryPale, color: C.primary, borderRadius: 8, padding: '12px 20px', fontWeight: 700, fontSize: 14, marginBottom: 16 }}>
            予約ID: {completed}
          </div>
          <div style={S.note}>LINEにも確認メッセージをお送りしました。</div>
          <button style={S.btn('primary')} onClick={() => { setCompleted(null); setStep(1); setSelection({ menuId: '', staffId: '', date: '', slot: '' }); }}>
            最初に戻る
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={S.wrap}>
      <div style={S.header}>
        <h3 style={S.headerTitle}>🏥 ご予約</h3>
        {lineProfile && <span style={{ fontSize: 11, opacity: 0.8 }}>{lineProfile.displayName} 様</span>}
      </div>

      <div style={S.body}>
        {/* ステップインジケーター */}
        <div style={{ display: 'flex', gap: 4, marginBottom: 20, justifyContent: 'center' }}>
          {STEPS.map(s => (
            <div key={s.num} style={{ width: 28, height: 5, borderRadius: 3, background: s.num <= step ? C.primary : C.border, transition: 'background .3s' }} />
          ))}
        </div>

        {/* Step 1: コース選択 */}
        {step === 1 && (
          <div>
            <h3 style={{ fontWeight: 700, color: C.primary, marginBottom: 12 }}>① コースを選んでください</h3>
            {menuList.map(m => (
              <div key={m.menuId} style={{ ...S.step(selection.menuId === m.menuId) }} onClick={() => { set('menuId', m.menuId); setStep(2); }}>
                <span style={S.stepNum(selection.menuId === m.menuId)}>●</span>
                <div>
                  <div style={{ fontWeight: 600 }}>{m.name}</div>
                  <div style={{ fontSize: 11.5, color: C.muted }}>{m.durationMin}分</div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Step 2: 担当者選択 */}
        {step === 2 && (
          <div>
            <h3 style={{ fontWeight: 700, color: C.primary, marginBottom: 12 }}>② 担当者を選んでください</h3>
            {/* 選択したコースに対応する施術者のみ表示 */}
            {[{ staffId: 'any', name: '指名なし（空き優先）' }, ...staffList.filter(s => !selection.menuId || (s.menus || '').includes(selection.menuId))].map(s => (
              <div key={s.staffId} style={{ ...S.step(selection.staffId === s.staffId) }} onClick={() => { set('staffId', s.staffId); setStep(3); }}>
                <span style={S.stepNum(selection.staffId === s.staffId)}>●</span>
                <div>
                  <div style={{ fontWeight: 600 }}>{s.name}</div>
                  {s.workDays && <div style={{ fontSize: 11.5, color: C.muted }}>勤務：{s.workDays}</div>}
                </div>
              </div>
            ))}
            <button style={S.btn('gray')} onClick={() => setStep(1)}>← 戻る</button>
          </div>
        )}

        {/* Step 3: 日時選択 */}
        {step === 3 && (
          <div>
            <h3 style={{ fontWeight: 700, color: C.primary, marginBottom: 12 }}>③ 日時を選んでください</h3>
            {dateOptions.length === 0 ? (
              <div style={S.note}>空き日程がありません</div>
            ) : dateOptions.slice(0, 14).map(({ dateStr, d }) => {
              const DAY = ['日', '月', '火', '水', '木', '金', '土'];
              const dayData = availability[dateStr];
              const staffKey = selection.staffId === 'any' ? Object.keys(dayData || {}) : [selection.staffId];
              const slots = staffKey.flatMap(sid => (dayData || {})[sid] || []);
              const uniqueSlots = [...new Set(slots)].sort();
              if (uniqueSlots.length === 0) return null;
              return (
                <div key={dateStr} style={{ marginBottom: 12 }}>
                  <div style={{ fontWeight: 700, marginBottom: 6 }}>
                    {d.getMonth() + 1}月{d.getDate()}日（{DAY[d.getDay()]}）
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                    {uniqueSlots.map(slot => (
                      <button key={slot} style={{ padding: '6px 14px', border: `1.5px solid ${selection.date === dateStr && selection.slot === slot ? C.primary : C.border}`, borderRadius: 20, background: selection.date === dateStr && selection.slot === slot ? C.primary : '#fff', color: selection.date === dateStr && selection.slot === slot ? '#fff' : C.text, fontSize: 12.5, cursor: 'pointer', fontFamily: 'inherit' }}
                        onClick={() => { set('date', dateStr); set('slot', slot); setStep(4); }}>
                        {slot}
                      </button>
                    ))}
                  </div>
                </div>
              );
            })}
            <button style={S.btn('gray')} onClick={() => setStep(2)}>← 戻る</button>
          </div>
        )}

        {/* Step 4: 情報入力 */}
        {step === 4 && (
          <div>
            <h3 style={{ fontWeight: 700, color: C.primary, marginBottom: 12 }}>④ ご情報を入力してください</h3>
            {registeredUser && <div style={S.note}>✅ 登録済み情報から自動入力しました</div>}
            <label style={S.label}>お名前<span style={S.required}>*</span></label>
            <input style={S.formInput} type="text" placeholder="山田太郎" value={form.name} onChange={e => setF('name', e.target.value)} />
            <label style={S.label}>電話番号</label>
            <input style={S.formInput} type="tel" placeholder="09012345678" value={form.phone} onChange={e => setF('phone', e.target.value)} />
            <label style={S.label}>E-Mail</label>
            <input style={S.formInput} type="email" placeholder="yamada@example.com" value={form.email} onChange={e => setF('email', e.target.value)} />
            {error && <p style={{ color: C.danger, fontSize: 12, marginBottom: 8 }}>{error}</p>}
            <button style={S.btn('primary')} onClick={() => { if (!form.name) { setError('お名前は必須です'); return; } setError(''); setStep(5); }}>次へ →</button>
            <button style={S.btn('gray')} onClick={() => setStep(3)}>← 戻る</button>
          </div>
        )}

        {/* Step 5: 確認・送信 */}
        {step === 5 && (
          <div>
            <h3 style={{ fontWeight: 700, color: C.primary, marginBottom: 12 }}>⑤ 予約内容を確認してください</h3>
            <div style={S.card}>
              <div style={{ display: 'grid', gridTemplateColumns: '100px 1fr', gap: '8px 0', fontSize: 13 }}>
                <span style={{ color: C.muted }}>コース</span><span style={{ fontWeight: 600 }}>{selectedMenu?.name}</span>
                <span style={{ color: C.muted }}>担当者</span><span style={{ fontWeight: 600 }}>{selection.staffId === 'any' ? '指名なし' : selectedStaff?.name}</span>
                <span style={{ color: C.muted }}>日時</span><span style={{ fontWeight: 600 }}>{selection.date} {selection.slot}</span>
                <span style={{ color: C.muted }}>お名前</span><span style={{ fontWeight: 600 }}>{form.name}</span>
                <span style={{ color: C.muted }}>電話番号</span><span>{form.phone || '—'}</span>
                <span style={{ color: C.muted }}>E-Mail</span><span>{form.email || '—'}</span>
              </div>
            </div>
            {error && <p style={{ color: C.danger, fontSize: 12, marginBottom: 8 }}>{error}</p>}
            <button style={S.btn('success')} onClick={handleSubmit}>{loading ? '送信中...' : '✅ 予約を確定する'}</button>
            <button style={S.btn('gray')} onClick={() => setStep(4)}>← 戻る</button>
          </div>
        )}
      </div>
    </div>
  );
}
