// ============================================================
// line_liff_booking_v6.jsx
// LINE LIFF予約UI（月カレンダー形式・空き状況○△×表示）
// v6: 利用者登録画面追加（氏名・ふりがな・生年月日・電話・メール・PW）
// v6.1: 問い合わせ画面追加
// v6.2: ヘッダー2段化
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
  return (await fetch(GAS_URL, { method: 'POST', body: JSON.stringify(body), redirect: 'follow' })).json();
}

// ============================================================
// スタイル定義
// ============================================================
const C = {
  primary:     '#1a4f8a',
  primaryPale: '#dbeafe',
  success:     '#059669',
  successPale: '#d1fae5',
  danger:      '#dc2626',
  dangerPale:  '#fee2e2',
  warning:     '#f59e0b',
  border:      '#cbd5e1',
  text:        '#1e293b',
  muted:       '#64748b',
  surface:     '#fff',
};

const S = {
  wrap: {
    maxWidth: 480,
    margin: '0 auto',
    fontFamily: "'Noto Sans JP', sans-serif",
    fontSize: 13,
    background: C.surface,
    minHeight: '100vh',
    display: 'flex',
    flexDirection: 'column',
  },
  // 1段目ヘッダー（タイトル・ログイン名）
  headerRow1: {
    background: C.primary,
    color: '#fff',
    padding: '10px 16px',
    display: 'flex',
    alignItems: 'center',
    gap: 8,
  },
  // 2段目ヘッダー（電話番号・予約確認・問い合わせ）
  headerRow2: {
    background: '#15407a', // 1段目より少し暗い色で区別する
    color: '#fff',
    padding: '6px 16px',
    display: 'flex',
    alignItems: 'center',
    gap: 8,
  },
  // 他画面のヘッダーはそのまま使う
  header: {
    background: C.primary,
    color: '#fff',
    padding: '14px 16px',
    display: 'flex',
    alignItems: 'center',
    gap: 10,
  },
  headerTitle: { fontSize: 16, fontWeight: 700, flex: 1 },
  // ヘッダー内の小さいボタン共通スタイル
  headerBtn: {
    background: 'rgba(255,255,255,0.2)',
    border: '1.5px solid rgba(255,255,255,0.6)',
    borderRadius: 6,
    color: '#fff',
    fontSize: 11,
    fontWeight: 700,
    padding: '4px 10px',
    cursor: 'pointer',
    fontFamily: 'inherit',
    whiteSpace: 'nowrap',
  },
  body: { flex: 1, padding: '16px' },
  formInput: {
    width: '100%',
    border: `1.5px solid ${C.border}`,
    borderRadius: 4,
    padding: '8px 10px',
    fontFamily: 'inherit',
    fontSize: 13,
    color: C.text,
    background: '#f8fafc',
    boxSizing: 'border-box',
    marginBottom: 12,
  },
  label: { display: 'block', fontSize: 12, fontWeight: 600, color: C.muted, marginBottom: 4 },
  btn: (v) => {
    const variants = {
      primary: { background: C.primary,  color: '#fff' },
      success: { background: C.success,  color: '#fff' },
      danger:  { background: C.danger,   color: '#fff' },
      gray:    { background: '#e2e8f0',  color: C.text },
      line:    { background: '#06C755',  color: '#fff' },
      outline: { background: '#fff',     color: C.primary, border: `1.5px solid ${C.primary}` },
    };
    return {
      width: '100%',
      padding: '12px',
      border: 'none',
      borderRadius: 8,
      fontFamily: 'inherit',
      fontSize: 14,
      fontWeight: 700,
      cursor: 'pointer',
      marginBottom: 10,
      ...(variants[v] || variants.primary),
    };
  },
  card: {
    background: C.surface,
    border: `1px solid ${C.border}`,
    borderRadius: 8,
    padding: '14px 16px',
    marginBottom: 12,
    boxShadow: '0 2px 8px rgba(0,0,0,.08)',
  },
  note: {
    background: '#eff6ff',
    borderLeft: `4px solid ${C.primary}`,
    padding: '8px 12px',
    borderRadius: '0 4px 4px 0',
    fontSize: 11.5,
    marginBottom: 12,
    color: C.primary,
  },
  noteWarn: {
    background: '#fef9c3',
    borderLeft: `4px solid ${C.warning}`,
    padding: '8px 12px',
    borderRadius: '0 4px 4px 0',
    fontSize: 11.5,
    marginBottom: 12,
    color: '#78350f',
  },
  required: { color: C.danger, fontSize: 11, marginLeft: 4 },
  step: (active) => ({
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    padding: '10px 14px',
    borderRadius: 8,
    background: active ? C.primaryPale : '#f8fafc',
    border: `1.5px solid ${active ? C.primary : C.border}`,
    marginBottom: 8,
    cursor: 'pointer',
  }),
  stepNum: (active) => ({
    width: 24,
    height: 24,
    borderRadius: '50%',
    background: active ? C.primary : C.border,
    color: active ? '#fff' : C.muted,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: 12,
    fontWeight: 700,
    flexShrink: 0,
  }),
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
// 空き状況を○△×に変換するヘルパー
// ============================================================
function getAvailMark(slotCount, threshold = 2) {
  if (slotCount === 0) return { mark: '×', color: C.danger,  label: '満席' };
  if (slotCount <= threshold) return { mark: '△', color: C.warning, label: '残りわずか' };
  return { mark: '○', color: C.success, label: '空きあり' };
}

// ============================================================
// 予約ステータスバッジ
// ============================================================
function StatusBadge({ status }) {
  const config = {
    '予約済み': { bg: C.primaryPale, color: C.primary,  icon: '📅' },
    'キャンセル': { bg: C.dangerPale,  color: C.danger,   icon: '✕' },
    '完了':      { bg: C.successPale, color: C.success,  icon: '✓' },
  };
  const c = config[status] || { bg: '#f1f5f9', color: C.muted, icon: '?' };
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3, background: c.bg, color: c.color, borderRadius: 20, padding: '2px 10px', fontSize: 11, fontWeight: 700 }}>
      {c.icon} {status || '予約済み'}
    </span>
  );
}

// ============================================================
// キャンセル確認モーダル（個別 & 一括共用）
// ============================================================
function CancelModal({ bookings, onConfirm, onClose, loading }) {
  const targets = Array.isArray(bookings) ? bookings : [bookings];
  const isBulk  = targets.length > 1;
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '0 16px' }}>
      <div style={{ background: '#fff', borderRadius: 12, padding: '24px 20px', maxWidth: 360, width: '100%', boxShadow: '0 8px 32px rgba(0,0,0,0.2)', maxHeight: '80vh', overflowY: 'auto' }}>
        <div style={{ textAlign: 'center', fontSize: 40, marginBottom: 12 }}>⚠️</div>
        <h3 style={{ textAlign: 'center', fontSize: 16, fontWeight: 700, color: C.text, marginBottom: 8 }}>
          {isBulk ? `${targets.length}件の予約をキャンセルしますか？` : '予約をキャンセルしますか？'}
        </h3>
        <p style={{ textAlign: 'center', fontSize: 12, color: C.muted, marginBottom: 16 }}>この操作は元に戻せません</p>
        <div style={{ marginBottom: 20 }}>
          {targets.map(b => (
            <div key={b.bookingId} style={{ background: '#f8fafc', border: `1px solid ${C.border}`, borderRadius: 8, padding: '10px 14px', marginBottom: 8, fontSize: 13 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '70px 1fr', gap: '4px 0' }}>
                <span style={{ color: C.muted }}>日時</span><span style={{ fontWeight: 600 }}>{b.datetime}</span>
                <span style={{ color: C.muted }}>コース</span><span>{b.menu || '—'}</span>
                <span style={{ color: C.muted }}>担当者</span><span>{b.staff || '指名なし'}</span>
              </div>
            </div>
          ))}
        </div>
        <button onClick={onConfirm} disabled={loading} style={{ ...S.btn('danger'), marginBottom: 8, opacity: loading ? 0.7 : 1 }}>
          {loading ? 'キャンセル中...' : isBulk ? `${targets.length}件をキャンセルする` : 'キャンセルする'}
        </button>
        <button onClick={onClose} disabled={loading} style={{ ...S.btn('gray'), marginBottom: 0 }}>戻る</button>
      </div>
    </div>
  );
}

// ============================================================
// 予約カード（チェックボックス付き）
// ============================================================
function BookingCard({ booking, onCancelClick, selectable, selected, onToggle }) {
  const isPast = () => !booking.datetime ? false : new Date(booking.datetime.replace(' ', 'T')) < new Date();
  const canCancel = booking.status !== 'キャンセル' && booking.status !== '完了' && !isPast();
  return (
    <div style={{ ...S.card, borderLeft: booking.status === 'キャンセル' ? `4px solid ${C.danger}` : booking.status === '完了' ? `4px solid ${C.success}` : `4px solid ${C.primary}`, background: selected ? '#f0f7ff' : C.surface, transition: 'background 0.15s' }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
        {selectable && canCancel && (
          <div onClick={() => onToggle(booking.bookingId)} style={{ width: 22, height: 22, borderRadius: 4, border: `2px solid ${selected ? C.primary : C.border}`, background: selected ? C.primary : '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, cursor: 'pointer', marginTop: 2, transition: 'all 0.15s' }}>
            {selected && <span style={{ color: '#fff', fontSize: 13, fontWeight: 700 }}>✓</span>}
          </div>
        )}
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
            <div>
              <div style={{ fontSize: 15, fontWeight: 700, color: C.primary }}>{booking.datetime}</div>
              <div style={{ fontSize: 11, color: C.muted, marginTop: 2 }}>予約ID: {booking.bookingId}</div>
            </div>
            <StatusBadge status={booking.status} />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '70px 1fr', gap: '4px 0', fontSize: 13, marginBottom: canCancel && !selectable ? 12 : 0 }}>
            <span style={{ color: C.muted }}>コース</span><span style={{ fontWeight: 600 }}>{booking.menu || '—'}</span>
            <span style={{ color: C.muted }}>担当者</span><span style={{ fontWeight: 600 }}>{booking.staff || '指名なし'}</span>
            {booking.notes && (<><span style={{ color: C.muted }}>備考</span><span>{booking.notes}</span></>)}
          </div>
          {canCancel && !selectable && (
            <button onClick={() => onCancelClick(booking)} style={{ width: '100%', padding: '8px', border: `1.5px solid ${C.danger}`, borderRadius: 6, background: '#fff', color: C.danger, fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>
              🗑 この予約をキャンセルする
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// ============================================================
// 利用者登録コンポーネント
// ============================================================
function RegisterPage({ lineProfile, onBack, onRegistered }) {
  const [regForm, setRegForm] = useState({ name: '', nameKana: '', birthdate: '', phone: '', email: '', password: '', passwordConfirm: '' });
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState('');
  const [showPw,  setShowPw]  = useState(false);
  const [showPwC, setShowPwC] = useState(false);
  const [regStep, setRegStep] = useState(1);
  const setR = (key, val) => setRegForm(prev => ({ ...prev, [key]: val }));

  const validate = () => {
    if (!regForm.name.trim())     return '氏名を入力してください';
    if (!regForm.nameKana.trim()) return 'ふりがなを入力してください';
    if (!/^[ぁ-んー　 ]+$/.test(regForm.nameKana.trim())) return 'ふりがなはひらがなで入力してください';
    if (!regForm.email.trim())    return 'メールアドレスを入力してください';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(regForm.email)) return 'メールアドレスの形式が正しくありません';
    if (!regForm.password)        return 'パスワードを入力してください';
    if (regForm.password.length < 8) return 'パスワードは8文字以上で入力してください';
    if (regForm.password !== regForm.passwordConfirm) return 'パスワードが一致しません';
    return null;
  };

  const handleToConfirm = () => { const err = validate(); if (err) { setError(err); return; } setError(''); setRegStep(2); };

  const handleRegister = async () => {
    setLoading(true); setError('');
    try {
      const res = await apiPost({ action: 'registerUser', name: regForm.name.trim(), nameKana: regForm.nameKana.trim(), birthdate: regForm.birthdate || '', phone: regForm.phone.trim(), email: regForm.email.trim(), password: regForm.password, lineUserId: lineProfile?.userId || '' });
      if (res.success) { setRegStep(3); }
      else { setError(res.error?.message || '登録に失敗しました'); setRegStep(1); }
    } catch (e) { setError('通信エラーが発生しました'); setRegStep(1); }
    setLoading(false);
  };

  const inputWrap = { position: 'relative', marginBottom: 12 };
  const eyeBtn = { position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', fontSize: 16, color: C.muted, padding: 0 };

  if (regStep === 3) return (
    <div style={S.wrap}>
      <div style={S.header}><h3 style={S.headerTitle}>利用者登録</h3></div>
      <div style={{ ...S.body, textAlign: 'center', paddingTop: 48 }}>
        <div style={{ fontSize: 56, marginBottom: 16 }}>🎉</div>
        <h3 style={{ fontSize: 18, fontWeight: 700, color: C.primary, marginBottom: 12 }}>登録が完了しました</h3>
        <div style={{ ...S.note, textAlign: 'left', marginBottom: 20 }}>{lineProfile ? 'LINEアカウントと紐付けが完了しました。次回からは情報が自動入力されます。' : '登録したメールアドレスとパスワードで予約確認が行えます。'}</div>
        <button style={S.btn('primary')} onClick={() => { if (onRegistered) onRegistered({ name: regForm.name, email: regForm.email, phone: regForm.phone }); onBack(); }}>予約画面へ進む</button>
      </div>
    </div>
  );

  if (regStep === 2) return (
    <div style={S.wrap}>
      <div style={S.header}>
        <button onClick={() => setRegStep(1)} style={{ background: 'none', border: 'none', color: '#fff', fontSize: 20, cursor: 'pointer', padding: '0 4px' }}>‹</button>
        <h3 style={S.headerTitle}>登録内容の確認</h3>
      </div>
      <div style={S.body}>
        <div style={{ ...S.note, marginBottom: 20 }}>以下の内容で登録します。ご確認ください。</div>
        <div style={S.card}>
          <div style={{ display: 'grid', gridTemplateColumns: '100px 1fr', gap: '10px 0', fontSize: 13 }}>
            <span style={{ color: C.muted }}>氏名</span><span style={{ fontWeight: 600 }}>{regForm.name}</span>
            <span style={{ color: C.muted }}>ふりがな</span><span>{regForm.nameKana}</span>
            <span style={{ color: C.muted }}>生年月日</span><span>{regForm.birthdate || '—'}</span>
            <span style={{ color: C.muted }}>電話番号</span><span>{regForm.phone || '—'}</span>
            <span style={{ color: C.muted }}>メール</span><span style={{ wordBreak: 'break-all' }}>{regForm.email}</span>
            <span style={{ color: C.muted }}>パスワード</span><span>{'●'.repeat(Math.min(regForm.password.length, 10))}</span>
            {lineProfile && (<><span style={{ color: C.muted }}>LINE連携</span><span style={{ color: C.success, fontWeight: 600 }}>✓ 紐付けあり</span></>)}
          </div>
        </div>
        {error && <div style={{ background: C.dangerPale, border: `1px solid ${C.danger}`, borderRadius: 8, padding: '10px 14px', fontSize: 13, color: C.danger, marginBottom: 12 }}>⚠️ {error}</div>}
        <button style={{ ...S.btn('success'), opacity: loading ? 0.7 : 1 }} onClick={handleRegister} disabled={loading}>{loading ? '登録中...' : '✅ この内容で登録する'}</button>
        <button style={S.btn('gray')} onClick={() => setRegStep(1)} disabled={loading}>← 修正する</button>
      </div>
    </div>
  );

  return (
    <div style={S.wrap}>
      <div style={S.header}>
        <button onClick={onBack} style={{ background: 'none', border: 'none', color: '#fff', fontSize: 20, cursor: 'pointer', padding: '0 4px' }}>‹</button>
        <h3 style={S.headerTitle}>利用者登録</h3>
      </div>
      <div style={S.body}>
        {lineProfile && <div style={{ background: '#f0fdf4', border: `1px solid ${C.success}`, borderRadius: 8, padding: '10px 14px', marginBottom: 16, fontSize: 12, color: C.success, display: 'flex', alignItems: 'center', gap: 8 }}><span style={{ fontSize: 18 }}>✓</span><span>LINEアカウント（{lineProfile.displayName}）と自動で紐付けされます</span></div>}
        {error && <div style={{ background: C.dangerPale, border: `1px solid ${C.danger}`, borderRadius: 8, padding: '10px 14px', fontSize: 13, color: C.danger, marginBottom: 16 }}>⚠️ {error}</div>}
        <label style={S.label}>氏名<span style={S.required}>*</span></label>
        <input style={S.formInput} type="text" placeholder="横浜　太郎" value={regForm.name} onChange={e => setR('name', e.target.value)} />
        <label style={S.label}>ふりがな<span style={S.required}>*</span></label>
        <input style={S.formInput} type="text" placeholder="よこはま　たろう" value={regForm.nameKana} onChange={e => setR('nameKana', e.target.value)} />
        <label style={S.label}>生年月日</label>
        <input style={S.formInput} type="date" value={regForm.birthdate} onChange={e => setR('birthdate', e.target.value)} max={new Date().toISOString().split('T')[0]} />
        <label style={S.label}>電話番号</label>
        <input style={S.formInput} type="tel" placeholder="09012345678" value={regForm.phone} onChange={e => setR('phone', e.target.value)} />
        <label style={S.label}>メールアドレス<span style={S.required}>*</span></label>
        <input style={S.formInput} type="email" placeholder="yamada@example.com" value={regForm.email} onChange={e => setR('email', e.target.value)} />
        <label style={S.label}>パスワード<span style={S.required}>*</span><span style={{ fontWeight: 400, marginLeft: 6 }}>（8文字以上）</span></label>
        <div style={inputWrap}>
          <input style={{ ...S.formInput, marginBottom: 0, paddingRight: 40 }} type={showPw ? 'text' : 'password'} placeholder="8文字以上で入力" value={regForm.password} onChange={e => setR('password', e.target.value)} />
          <button style={eyeBtn} onClick={() => setShowPw(v => !v)} type="button">{showPw ? '🙈' : '👁'}</button>
        </div>
        {regForm.password && (
          <div style={{ marginTop: 4, marginBottom: 12 }}>
            <div style={{ display: 'flex', gap: 4, marginBottom: 4 }}>
              {[1,2,3,4].map(level => {
                const strength = (regForm.password.length >= 8 ? 1 : 0) + (/[A-Z]/.test(regForm.password) ? 1 : 0) + (/[0-9]/.test(regForm.password) ? 1 : 0) + (/[^A-Za-z0-9]/.test(regForm.password) ? 1 : 0);
                return <div key={level} style={{ flex: 1, height: 4, borderRadius: 2, background: level <= strength ? ['#e2e8f0', C.danger, C.warning, C.warning, C.success][strength] : '#e2e8f0', transition: 'background 0.3s' }} />;
              })}
            </div>
            <div style={{ fontSize: 11, color: C.muted }}>
              {['', '弱い', '普通', '強い', 'とても強い'][(regForm.password.length >= 8 ? 1 : 0) + (/[A-Z]/.test(regForm.password) ? 1 : 0) + (/[0-9]/.test(regForm.password) ? 1 : 0) + (/[^A-Za-z0-9]/.test(regForm.password) ? 1 : 0)] || ''}
            </div>
          </div>
        )}
        <label style={S.label}>パスワード（確認）<span style={S.required}>*</span></label>
        <div style={inputWrap}>
          <input style={{ ...S.formInput, marginBottom: 0, paddingRight: 40, borderColor: regForm.passwordConfirm ? (regForm.password === regForm.passwordConfirm ? C.success : C.danger) : C.border }} type={showPwC ? 'text' : 'password'} placeholder="もう一度入力" value={regForm.passwordConfirm} onChange={e => setR('passwordConfirm', e.target.value)} />
          <button style={eyeBtn} onClick={() => setShowPwC(v => !v)} type="button">{showPwC ? '🙈' : '👁'}</button>
        </div>
        {regForm.passwordConfirm && <div style={{ fontSize: 11, color: regForm.password === regForm.passwordConfirm ? C.success : C.danger, marginTop: 4, marginBottom: 12 }}>{regForm.password === regForm.passwordConfirm ? '✓ 一致しています' : '✗ パスワードが一致しません'}</div>}
        <div style={{ marginTop: 8 }}>
          <button style={S.btn('primary')} onClick={handleToConfirm}>確認画面へ →</button>
          <button style={S.btn('gray')} onClick={onBack}>← 戻る</button>
        </div>
      </div>
    </div>
  );
}

// ============================================================
// ログインコンポーネント（ブラウザ版）
// ============================================================
function LoginPage({ onBack, onLoggedIn }) {
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw]     = useState(false);
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState('');

  const handleLogin = async () => {
    if (!email.trim() || !password) { setError('メールアドレスとパスワードを入力してください'); return; }
    setLoading(true); setError('');
    try {
      const res = await apiPost({ action: 'loginUser', email: email.trim(), password });
      if (res.success) { onLoggedIn(res.data.user || res.data); }
      else { setError(res.error?.message || 'メールアドレスまたはパスワードが正しくありません'); }
    } catch (e) { setError('通信エラーが発生しました'); }
    setLoading(false);
  };

  return (
    <div style={S.wrap}>
      <div style={S.header}>
        <button onClick={onBack} style={{ background: 'none', border: 'none', color: '#fff', fontSize: 20, cursor: 'pointer', padding: '0 4px' }}>‹</button>
        <h3 style={S.headerTitle}>ログイン</h3>
      </div>
      <div style={S.body}>
        <div style={{ ...S.note, marginBottom: 20 }}>利用者登録時のメールアドレスとパスワードでログインできます</div>
        {error && <div style={{ background: C.dangerPale, border: `1px solid ${C.danger}`, borderRadius: 8, padding: '10px 14px', fontSize: 13, color: C.danger, marginBottom: 16 }}>⚠️ {error}</div>}
        <label style={S.label}>メールアドレス<span style={S.required}>*</span></label>
        <input style={S.formInput} type="email" placeholder="yamada@example.com" value={email} onChange={e => setEmail(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleLogin()} />
        <label style={S.label}>パスワード<span style={S.required}>*</span></label>
        <div style={{ position: 'relative', marginBottom: 12 }}>
          <input style={{ ...S.formInput, marginBottom: 0, paddingRight: 40 }} type={showPw ? 'text' : 'password'} placeholder="パスワードを入力" value={password} onChange={e => setPassword(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleLogin()} />
          <button onClick={() => setShowPw(v => !v)} type="button" style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', fontSize: 16, color: C.muted, padding: 0 }}>{showPw ? '🙈' : '👁'}</button>
        </div>
        <button onClick={handleLogin} disabled={loading} style={{ ...S.btn('primary'), opacity: loading ? 0.7 : 1, marginTop: 8 }}>{loading ? 'ログイン中...' : '🔑 ログインする'}</button>
        <div style={{ textAlign: 'center', marginTop: 8, fontSize: 13, color: C.muted }}>
          アカウントをお持ちでない方は<span onClick={onBack} style={{ color: C.primary, fontWeight: 700, cursor: 'pointer', marginLeft: 4, textDecoration: 'underline' }}>新規登録</span>
        </div>
      </div>
    </div>
  );
}

// ============================================================
// ブラウザ用：予約検索画面
// ============================================================
function BookingSearch({ onFound, onBack }) {
  const [searchType, setSearchType] = useState('bookingId');
  const [inputVal, setInputVal]     = useState('');
  const [loading, setLoading]       = useState(false);
  const [error, setError]           = useState('');

  const handleSearch = async () => {
    if (!inputVal.trim()) { setError('入力してください'); return; }
    setLoading(true); setError('');
    try {
      const params = searchType === 'bookingId' ? { action: 'getUserBookings', bookingId: inputVal.trim() } : { action: 'getUserBookings', email: inputVal.trim() };
      const res = await apiGet(params);
      if (res.success && res.data.bookings?.length > 0) { onFound(res.data.bookings); }
      else if (res.success && res.data.bookings?.length === 0) { setError('該当する予約が見つかりませんでした'); }
      else { setError('予約の取得に失敗しました'); }
    } catch (e) { setError('通信エラーが発生しました'); }
    setLoading(false);
  };

  return (
    <div style={S.wrap}>
      <div style={S.header}>
        <button onClick={onBack} style={{ background: 'none', border: 'none', color: '#fff', fontSize: 20, cursor: 'pointer', padding: '0 4px' }}>‹</button>
        <h3 style={S.headerTitle}>予約確認・キャンセル</h3>
      </div>
      <div style={S.body}>
        <div style={{ ...S.note, marginBottom: 20 }}>予約IDまたはメールアドレスで予約を検索できます</div>
        <div style={{ display: 'flex', border: `1.5px solid ${C.primary}`, borderRadius: 8, overflow: 'hidden', marginBottom: 20 }}>
          {[{ key: 'bookingId', label: '🔖 予約IDで検索' }, { key: 'email', label: '✉️ メールで検索' }].map(tab => (
            <button key={tab.key} onClick={() => { setSearchType(tab.key); setInputVal(''); setError(''); }}
              style={{ flex: 1, padding: '10px 0', border: 'none', background: searchType === tab.key ? C.primary : '#fff', color: searchType === tab.key ? '#fff' : C.primary, fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.15s' }}>
              {tab.label}
            </button>
          ))}
        </div>
        {searchType === 'bookingId'
          ? (<><label style={S.label}>予約ID<span style={S.required}>*</span></label><input style={S.formInput} type="text" placeholder="例：BK20260501001" value={inputVal} onChange={e => setInputVal(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleSearch()} /></>)
          : (<><label style={S.label}>メールアドレス<span style={S.required}>*</span></label><input style={S.formInput} type="email" placeholder="例：yamada@example.com" value={inputVal} onChange={e => setInputVal(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleSearch()} /></>)
        }
        {error && <div style={{ background: C.dangerPale, border: `1px solid ${C.danger}`, borderRadius: 8, padding: '10px 14px', fontSize: 13, color: C.danger, marginBottom: 16 }}>⚠️ {error}</div>}
        <button onClick={handleSearch} disabled={loading} style={{ ...S.btn('primary'), opacity: loading ? 0.7 : 1 }}>{loading ? '検索中...' : '🔍 予約を検索する'}</button>
      </div>
    </div>
  );
}

// ============================================================
// マイページ（予約確認・キャンセル）
// ============================================================
function MyPage({ lineProfile, onBack, initialBookings = null }) {
  const [bookings, setBookings]           = useState(initialBookings || []);
  const [loading, setLoading]             = useState(!initialBookings);
  const [cancelTargets, setCancelTargets] = useState(null);
  const [cancelLoading, setCancelLoading] = useState(false);
  const [cancelDone, setCancelDone]       = useState(false);
  const [error, setError]                 = useState('');
  const [filter, setFilter]               = useState('upcoming');
  const [bulkMode, setBulkMode]           = useState(false);
  const [selectedIds, setSelectedIds]     = useState(new Set());

  const fetchBookings = async () => {
    if (!lineProfile?.userId) return;
    setLoading(true); setError('');
    try {
      const res = await apiGet({ action: 'getUserBookings', lineUserId: lineProfile.userId });
      if (res.success) { setBookings(res.data.bookings || []); } else { setError('予約の取得に失敗しました'); }
    } catch (e) { setError('通信エラーが発生しました'); }
    setLoading(false);
  };

  useEffect(() => { if (!initialBookings) fetchBookings(); }, [lineProfile]);

  const handleCancel = async () => {
    if (!cancelTargets?.length) return;
    setCancelLoading(true); setError('');
    try {
      for (const b of cancelTargets) await apiPost({ action: 'cancelBooking', bookingId: b.bookingId, lineUserId: lineProfile?.userId || '' });
      setCancelDone(true);
      if (lineProfile?.userId && !initialBookings) { await fetchBookings(); }
      else { const ids = new Set(cancelTargets.map(b => b.bookingId)); setBookings(prev => prev.map(b => ids.has(b.bookingId) ? { ...b, status: 'キャンセル' } : b)); }
      setSelectedIds(new Set()); setBulkMode(false);
      setTimeout(() => { setCancelTargets(null); setCancelDone(false); }, 1500);
    } catch (e) { setError('通信エラーが発生しました'); setCancelTargets(null); }
    setCancelLoading(false);
  };

  const toggleSelect = (bookingId) => { setSelectedIds(prev => { const next = new Set(prev); next.has(bookingId) ? next.delete(bookingId) : next.add(bookingId); return next; }); };
  const now = new Date();
  const filteredBookings = bookings.filter(b => { if (filter === 'all') return true; if (b.status === 'キャンセル' || b.status === '完了') return false; return new Date((b.datetime || '').replace(' ', 'T')) >= now; });
  const cancelableCount = filteredBookings.filter(b => b.status !== 'キャンセル' && b.status !== '完了' && new Date((b.datetime || '').replace(' ', 'T')) >= now).length;
  const toggleSelectAll = () => { const ids = filteredBookings.filter(b => b.status !== 'キャンセル' && b.status !== '完了' && new Date((b.datetime || '').replace(' ', 'T')) >= now).map(b => b.bookingId); if (selectedIds.size === ids.length) { setSelectedIds(new Set()); } else { setSelectedIds(new Set(ids)); } };

  return (
    <div style={S.wrap}>
      <div style={S.header}>
        <button onClick={onBack} style={{ background: 'none', border: 'none', color: '#fff', fontSize: 20, cursor: 'pointer', padding: '0 4px' }}>‹</button>
        <h3 style={S.headerTitle}>予約確認</h3>
        {lineProfile && <span style={{ fontSize: 11, opacity: 0.8 }}>{lineProfile.displayName} 様</span>}
      </div>
      <div style={S.body}>
        <div style={{ display: 'flex', border: `1.5px solid ${C.primary}`, borderRadius: 8, overflow: 'hidden', marginBottom: 16 }}>
          {[{ key: 'upcoming', label: '今後の予約' }, { key: 'all', label: 'すべて表示' }].map(tab => (
            <button key={tab.key} onClick={() => { setFilter(tab.key); setBulkMode(false); setSelectedIds(new Set()); }}
              style={{ flex: 1, padding: '10px 0', border: 'none', background: filter === tab.key ? C.primary : '#fff', color: filter === tab.key ? '#fff' : C.primary, fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.15s' }}>
              {tab.label}
            </button>
          ))}
        </div>
        {error && <div style={{ background: C.dangerPale, border: `1px solid ${C.danger}`, borderRadius: 8, padding: '10px 14px', fontSize: 13, color: C.danger, marginBottom: 12 }}>⚠️ {error}</div>}
        {loading ? (
          <div style={{ textAlign: 'center', padding: '48px 0', color: C.muted }}><div style={{ fontSize: 32, marginBottom: 12 }}>📅</div><div>予約を読み込み中...</div></div>
        ) : filteredBookings.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '48px 0', color: C.muted }}><div style={{ fontSize: 48, marginBottom: 12 }}>📭</div><div style={{ fontSize: 14, fontWeight: 600, marginBottom: 8 }}>{filter === 'upcoming' ? '今後の予約はありません' : '予約が見つかりません'}</div></div>
        ) : (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <div style={{ fontSize: 12, color: C.muted }}>{filteredBookings.length}件の予約{bulkMode && selectedIds.size > 0 && <span style={{ color: C.danger, marginLeft: 8, fontWeight: 700 }}>{selectedIds.size}件選択中</span>}</div>
              {cancelableCount > 0 && <button onClick={() => { setBulkMode(prev => !prev); setSelectedIds(new Set()); }} style={{ padding: '5px 12px', border: `1.5px solid ${bulkMode ? C.muted : C.danger}`, borderRadius: 6, background: '#fff', color: bulkMode ? C.muted : C.danger, fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>{bulkMode ? '選択を解除' : '☑ 一括キャンセル'}</button>}
            </div>
            {bulkMode && (
              <div style={{ display: 'flex', gap: 8, marginBottom: 12, padding: '10px 12px', background: '#f8fafc', border: `1px solid ${C.border}`, borderRadius: 8, alignItems: 'center' }}>
                <button onClick={toggleSelectAll} style={{ padding: '5px 12px', border: `1.5px solid ${C.primary}`, borderRadius: 6, background: selectedIds.size === cancelableCount && cancelableCount > 0 ? C.primary : '#fff', color: selectedIds.size === cancelableCount && cancelableCount > 0 ? '#fff' : C.primary, fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', flexShrink: 0 }}>{selectedIds.size === cancelableCount && cancelableCount > 0 ? '全解除' : '全選択'}</button>
                <span style={{ fontSize: 12, color: C.muted, flex: 1 }}>キャンセルしたい予約にチェックを入れてください</span>
                <button onClick={() => { if (selectedIds.size === 0) return; setCancelTargets(bookings.filter(b => selectedIds.has(b.bookingId))); }} disabled={selectedIds.size === 0} style={{ padding: '5px 12px', border: 'none', borderRadius: 6, background: selectedIds.size > 0 ? C.danger : '#e2e8f0', color: selectedIds.size > 0 ? '#fff' : C.muted, fontSize: 12, fontWeight: 700, cursor: selectedIds.size > 0 ? 'pointer' : 'default', fontFamily: 'inherit', flexShrink: 0 }}>キャンセル実行</button>
              </div>
            )}
            {filteredBookings.map(b => <BookingCard key={b.bookingId} booking={b} onCancelClick={b => setCancelTargets([b])} selectable={bulkMode} selected={selectedIds.has(b.bookingId)} onToggle={toggleSelect} />)}
          </div>
        )}
        <div style={{ marginTop: 16 }}><button style={S.btn('primary')} onClick={onBack}>＋ 新しく予約する</button></div>
      </div>
      {cancelTargets && !cancelDone && <CancelModal bookings={cancelTargets} onConfirm={handleCancel} onClose={() => setCancelTargets(null)} loading={cancelLoading} />}
      {cancelDone && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ background: '#fff', borderRadius: 12, padding: '32px 24px', textAlign: 'center', maxWidth: 300, width: '90%' }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>✅</div>
            <div style={{ fontSize: 16, fontWeight: 700, color: C.success }}>キャンセルしました</div>
          </div>
        </div>
      )}
    </div>
  );
}

// ============================================================
// 問い合わせ画面（LINE LIFF版）
// ============================================================
function InquiryPage({ lineProfile, registeredUser, storePhone, onBack }) {
  const CATEGORIES = [
    { value: 'booking',   label: '予約について' },
    { value: 'treatment', label: '施術について' },
    { value: 'other',     label: 'その他' },
  ];
  const [form, setForm] = useState({ senderName: registeredUser?.name || lineProfile?.displayName || '', senderEmail: registeredUser?.email || '', category: 'booking', subject: '', body: '' });
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState('');
  const [sent,    setSent]    = useState(false);
  const set = (key, val) => setForm(prev => ({ ...prev, [key]: val }));

  const handleSend = async () => {
    if (!form.subject.trim())     { setError('件名を入力してください'); return; }
    if (!form.body.trim())        { setError('お問い合わせ内容を入力してください'); return; }
    if (!form.senderEmail.trim()) { setError('返信先メールアドレスを入力してください'); return; }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.senderEmail)) { setError('メールアドレスの形式が正しくありません'); return; }
    setLoading(true); setError('');
    try {
      const res = await apiPost({ action: 'sendInquiry', target: 'store', senderEmail: form.senderEmail, category: form.category, subject: form.subject, body: form.body });
      if (res.success) { setSent(true); }
      else { setError(res.error?.message || '送信に失敗しました。しばらく経ってから再度お試しください。'); }
    } catch (e) { setError('通信エラーが発生しました。インターネット接続を確認してください。'); }
    setLoading(false);
  };

  if (sent) return (
    <div style={S.wrap}>
      <div style={S.header}><h3 style={S.headerTitle}>問い合わせ</h3></div>
      <div style={{ ...S.body, textAlign: 'center', paddingTop: 48 }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>📨</div>
        <h3 style={{ fontSize: 16, fontWeight: 700, color: C.primary, marginBottom: 8 }}>送信が完了しました</h3>
        <p style={{ color: C.muted, fontSize: 13, marginBottom: 20, lineHeight: 1.7 }}>お問い合わせありがとうございます。<br />担当者より折り返しご連絡いたします。</p>
        <button style={S.btn('primary')} onClick={onBack}>予約画面に戻る</button>
        <button style={S.btn('gray')} onClick={() => { setForm({ senderName: registeredUser?.name || lineProfile?.displayName || '', senderEmail: registeredUser?.email || '', category: 'booking', subject: '', body: '' }); setSent(false); }}>続けて問い合わせる</button>
      </div>
    </div>
  );

  return (
    <div style={S.wrap}>
      <div style={S.header}>
        <button onClick={onBack} style={{ background: 'none', border: 'none', color: '#fff', fontSize: 20, cursor: 'pointer', padding: '0 4px' }}>‹</button>
        <h3 style={S.headerTitle}>💬 問い合わせ</h3>
      </div>
      <div style={S.body}>
        {storePhone && <div style={S.card}><div style={{ fontSize: 12, fontWeight: 700, color: C.muted, marginBottom: 4 }}>📞 お電話でのお問い合わせ</div><a href={`tel:${storePhone}`} style={{ fontSize: 18, fontWeight: 700, color: C.primary, textDecoration: 'none' }}>{storePhone}</a></div>}
        <div style={{ fontSize: 12, fontWeight: 700, color: C.muted, marginBottom: 12 }}>✉️ メールでのお問い合わせ</div>
        {error && <div style={{ background: C.dangerPale, border: `1px solid ${C.danger}`, borderRadius: 8, padding: '10px 14px', fontSize: 13, color: C.danger, marginBottom: 16 }}>⚠️ {error}</div>}
        <label style={S.label}>お名前</label>
        <input style={S.formInput} type="text" placeholder="山田太郎" value={form.senderName} onChange={e => set('senderName', e.target.value)} />
        <label style={S.label}>返信先メールアドレス<span style={S.required}>*</span></label>
        <input style={S.formInput} type="email" placeholder="yamada@example.com" value={form.senderEmail} onChange={e => set('senderEmail', e.target.value)} />
        {registeredUser?.email && <div style={{ fontSize: 11, color: C.muted, marginTop: -8, marginBottom: 12 }}>登録メールアドレスから自動入力しました</div>}
        <label style={S.label}>種別</label>
        <select style={S.formInput} value={form.category} onChange={e => set('category', e.target.value)}>
          {CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
        </select>
        <label style={S.label}>件名<span style={S.required}>*</span></label>
        <input style={S.formInput} type="text" placeholder="お問い合わせ件名" value={form.subject} onChange={e => set('subject', e.target.value)} />
        <label style={S.label}>お問い合わせ内容<span style={S.required}>*</span></label>
        <textarea style={{ ...S.formInput, height: 140, resize: 'vertical' }} placeholder="内容をご記入ください" value={form.body} onChange={e => set('body', e.target.value)} />
        <div style={{ ...S.noteWarn, marginTop: 4 }}>ご入力いただいたメールアドレス宛に受付確認メールはお送りしていません。担当者より直接ご連絡いたします。</div>
        <button style={{ ...S.btn('primary'), marginTop: 8, opacity: loading ? 0.7 : 1 }} onClick={handleSend} disabled={loading}>{loading ? '送信中...' : '📨 送信する'}</button>
        <button style={S.btn('gray')} onClick={onBack}>← 戻る</button>
      </div>
    </div>
  );
}

// ============================================================
// 月カレンダーコンポーネント
// ============================================================
function BookingCalendar({ availability, selectedStaffId, onSelectDate, selectedDate, calDate, onChangeMonth }) {
  const DAY_LABELS = ['日', '月', '火', '水', '木', '金', '土'];
  const year = calDate.getFullYear(), month = calDate.getMonth();
  const today = new Date(); today.setHours(0,0,0,0);
  const pad = n => String(n).padStart(2, '0');
  const firstDay = new Date(year, month, 1).getDay(), daysInMonth = new Date(year, month + 1, 0).getDate();
  const weeks = []; let day = 1 - firstDay;
  while (day <= daysInMonth) { const week = []; for (let i = 0; i < 7; i++, day++) week.push(day > 0 && day <= daysInMonth ? day : null); weeks.push(week); }

  const countSlots = (dateStr) => {
    const dayData = availability[dateStr];
    if (!dayData) return 0;
    if (selectedStaffId && selectedStaffId !== 'any') {
      return (dayData[selectedStaffId] || []).length + (dayData['any'] || []).length;
    }
    // 全員: anyを含む全スロットのユニーク数
    return [...new Set(Object.values(dayData).flat())].length;
  };

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
        <button onClick={() => onChangeMonth(-1)} style={{ background: 'none', border: `1.5px solid ${C.border}`, borderRadius: 6, padding: '4px 12px', fontSize: 16, cursor: 'pointer' }}>‹</button>
        <span style={{ fontSize: 15, fontWeight: 700, color: C.primary }}>{year}年{month + 1}月</span>
        <button onClick={() => onChangeMonth(1)} style={{ background: 'none', border: `1.5px solid ${C.border}`, borderRadius: 6, padding: '4px 12px', fontSize: 16, cursor: 'pointer' }}>›</button>
      </div>
      <div style={{ display: 'flex', gap: 12, justifyContent: 'center', marginBottom: 10 }}>
        {[{ mark: '○', color: C.success, label: '空きあり' }, { mark: '△', color: C.warning, label: '残りわずか' }, { mark: '×', color: C.danger, label: '満席・休診' }].map(item => (
          <div key={item.mark} style={{ display: 'flex', alignItems: 'center', gap: 3, fontSize: 11 }}>
            <span style={{ color: item.color, fontWeight: 700, fontSize: 13 }}>{item.mark}</span>
            <span style={{ color: C.muted }}>{item.label}</span>
          </div>
        ))}
      </div>
      <table style={{ width: '100%', borderCollapse: 'collapse', tableLayout: 'fixed' }}>
        <thead><tr>{DAY_LABELS.map((d, i) => <th key={d} style={{ padding: '6px 0', textAlign: 'center', fontSize: 12, fontWeight: 600, color: i === 0 ? '#b91c1c' : i === 6 ? '#1d4ed8' : C.muted }}>{d}</th>)}</tr></thead>
        <tbody>
          {weeks.map((week, wi) => (
            <tr key={wi}>
              {week.map((d, di) => {
                if (!d) return <td key={di} />;
                const dateStr = `${year}-${pad(month+1)}-${pad(d)}`, dateObj = new Date(year, month, d);
                const isPast = dateObj < today, isSelected = selectedDate === dateStr;
                const slotCount = isPast ? 0 : countSlots(dateStr);
                const avail = isPast ? { mark: '—', color: C.border } : getAvailMark(slotCount);
                const isDisabled = isPast || slotCount === 0, isToday = dateObj.getTime() === today.getTime();
                return (
                  <td key={di} style={{ padding: 3 }}>
                    <div onClick={() => !isDisabled && onSelectDate(dateStr)} style={{ textAlign: 'center', borderRadius: 8, padding: '6px 2px', cursor: isDisabled ? 'default' : 'pointer', background: isSelected ? C.primary : isToday ? C.primaryPale : '#fff', border: isSelected ? `2px solid ${C.primary}` : isToday ? `2px solid ${C.primary}` : `1px solid ${C.border}`, opacity: isPast ? 0.35 : 1, transition: 'background 0.15s' }}>
                      <div style={{ fontSize: 13, fontWeight: isToday || isSelected ? 700 : 400, color: isSelected ? '#fff' : di === 0 ? '#b91c1c' : di === 6 ? '#1d4ed8' : C.text, lineHeight: 1.2 }}>
                        {d}{isToday && !isSelected && <span style={{ display: 'block', fontSize: 8, color: C.primary, fontWeight: 700, lineHeight: 1 }}>今日</span>}
                      </div>
                      <div style={{ fontSize: 14, fontWeight: 700, color: isSelected ? '#fff' : avail.color, lineHeight: 1.2, marginTop: 1 }}>{isPast ? '' : avail.mark}</div>
                    </div>
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ============================================================
// 時間スロット選択コンポーネント
// ============================================================
function SlotPicker({ availability, selectedDate, selectedStaffId, selectedSlot, onSelectSlot }) {
  if (!selectedDate) return null;
  const dayData = availability[selectedDate] || {};
  let slots;
  if (selectedStaffId && selectedStaffId !== 'any') {
    const staffSlots = dayData[selectedStaffId] || [];
    const anySlots   = dayData['any'] || [];
    slots = [...new Set([...staffSlots, ...anySlots])].sort();
  } else {
    slots = [...new Set(Object.values(dayData).flat())].sort();
  }
  if (slots.length === 0) return <div style={{ ...S.note, marginTop: 12 }}>この日は空き枠がありません</div>;
  return (
    <div style={{ marginTop: 16 }}>
      <div style={{ fontSize: 13, fontWeight: 700, color: C.primary, marginBottom: 8 }}>{selectedDate} の時間を選んでください</div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
        {slots.map(slot => {
          const isActive = slot === selectedSlot;
          return <button key={slot} onClick={() => onSelectSlot(slot)} style={{ padding: '8px 18px', border: `1.5px solid ${isActive ? C.primary : C.border}`, borderRadius: 20, background: isActive ? C.primary : '#fff', color: isActive ? '#fff' : C.text, fontSize: 13, fontWeight: isActive ? 700 : 400, cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.15s' }}>{slot}</button>;
        })}
      </div>
    </div>
  );
}

// ============================================================
// コース選択ラジオボタン（スマホ最適化）
// ============================================================
function MenuRadioItem({ menu, selected, onClick }) {
  const isSelected = selected === menu.menuId;
  return (
    <div onClick={onClick} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '14px 16px', borderRadius: 10, background: isSelected ? C.primaryPale : '#f8fafc', border: `2px solid ${isSelected ? C.primary : C.border}`, marginBottom: 10, cursor: 'pointer', transition: 'all 0.15s', WebkitTapHighlightColor: 'transparent' }}>
      <div style={{ width: 22, height: 22, borderRadius: '50%', border: `2.5px solid ${isSelected ? C.primary : C.border}`, background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
        {isSelected && <div style={{ width: 12, height: 12, borderRadius: '50%', background: C.primary }} />}
      </div>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 14, fontWeight: isSelected ? 700 : 600, color: isSelected ? C.primary : C.text, marginBottom: 2 }}>{menu.name}</div>
        <div style={{ fontSize: 12, color: C.muted }}>⏱ {menu.durationMin}分</div>
      </div>
      {isSelected && <div style={{ color: C.primary, fontSize: 18, fontWeight: 700, flexShrink: 0 }}>✓</div>}
    </div>
  );
}

// ============================================================
// メインコンポーネント
// ============================================================
export default function LineLiffBooking() {
  const [liffReady, setLiffReady]           = useState(false);
  const [lineProfile, setLineProfile]       = useState(null);
  const [isLineEnv, setIsLineEnv]           = useState(false);
  const [registeredUser, setRegisteredUser] = useState(null);
  const [step, setStep]                     = useState(1);
  const [menuList, setMenuList]             = useState([]);
  const [staffList, setStaffList]           = useState([]);
  const [availCache, setAvailCache]         = useState({});
  const [selection, setSelection]           = useState({ menuId: '', staffId: '', date: '', slot: '' });
  const [form, setForm]                     = useState({ name: '', phone: '', email: '' });
  const [error, setError]                   = useState('');
  const [loading, setLoading]               = useState(false);
  const [completed, setCompleted]           = useState(null);
  const [calDate, setCalDate]               = useState(new Date());
  const [availLoading, setAvailLoading]     = useState(false);
  // URLパラメータで初期画面を切り替え（リッチメニュー対応）
  const getInitialScreen = () => {
  try {
    const params = new URLSearchParams(window.location.search);
    const page = params.get('page');
    if (page === 'mypage') return 'mypage';
  } catch (_) {}
  return 'booking';
};
  const [screen, setScreen] = useState(getInitialScreen());
  const [searchedBookings, setSearchedBookings] = useState([]);
  const [storePhone, setStorePhone]         = useState('');

  const isNoStaff = !selection.staffId || selection.staffId === 'any';

  useEffect(() => {
    const initLiff = async () => {
      try {
        await liff.init({ liffId: LIFF_ID });
        setLiffReady(true);
        setIsLineEnv(liff.isInClient());
        if (liff.isLoggedIn()) {
          const profile = await liff.getProfile();
          setLineProfile(profile);
          const res = await apiGet({ action: 'getUserProfile', lineUserId: profile.userId });
          if (res.success) { setRegisteredUser(res.data); setForm({ name: res.data.name, phone: res.data.phone || '', email: res.data.email || '' }); }
        }
      } catch (err) { console.error('LIFF初期化エラー:', err); setLiffReady(true); }
    };
    initLiff();
    Promise.all([
      apiGet({ action: 'getMenus' }).then(r => r.success && setMenuList(r.data.menus)),
      apiGet({ action: 'getStaff' }).then(r => r.success && setStaffList(r.data.staff)),
      apiGet({ action: 'getSettings' }).then(r => r.success && setStorePhone(r.data?.settings?.['店舗電話番号'] || '')),
    ]);
  }, []);

  useEffect(() => {
    const year = calDate.getFullYear(), month = calDate.getMonth() + 1;
    const key = `${year}-${String(month).padStart(2, '0')}`;
    if (availCache[key]) return;
    setAvailLoading(true);
    apiGet({ action: 'getAvailability', year, month })
      .then(r => { if (r.success) setAvailCache(prev => ({ ...prev, [key]: r.data.availability })); })
      .finally(() => setAvailLoading(false));
  }, [calDate]);

  const currentCacheKey = `${calDate.getFullYear()}-${String(calDate.getMonth() + 1).padStart(2, '0')}`;
  const availability = availCache[currentCacheKey] || {};
  const set  = (key, val) => setSelection(prev => ({ ...prev, [key]: val }));
  const setF = (key, val) => setForm(prev => ({ ...prev, [key]: val }));

  const handleChangeMonth = (diff) => {
    setCalDate(prev => { const next = new Date(prev.getFullYear(), prev.getMonth() + diff, 1); const today = new Date(); if (next < new Date(today.getFullYear(), today.getMonth(), 1)) return prev; return next; });
    set('date', ''); set('slot', '');
  };

  const handleSubmit = async () => {
    if (!form.name) { setError('お名前は必須です'); return; }
    setLoading(true);
    const res = await apiPost({ action: 'createBooking', datetime: `${selection.date} ${selection.slot}`, staffId: isNoStaff ? '' : selection.staffId, menuId: selection.menuId, userName: form.name, userPhone: form.phone, userEmail: form.email, lineUserId: lineProfile?.userId || '' });
    if (res.success) {
      setCompleted(res.data.bookingId);
      if (liff.isLoggedIn && liff.isLoggedIn() && liff.getOS() !== 'web') {
        try { await liff.sendMessages([{ type: 'text', text: `予約が完了しました！\n予約ID：${res.data.bookingId}\n日時：${selection.date} ${selection.slot}` }]); } catch (_) {}
      }
    } else { setError(res.error?.message || '予約に失敗しました'); }
    setLoading(false);
  };

  const selectedMenu      = menuList.find(m => m.menuId === selection.menuId);
  const selectedStaff     = isNoStaff ? null : staffList.find(s => s.staffId === selection.staffId);
  const selectedStaffName = isNoStaff ? '指名なし' : (selectedStaff?.name || '—');

  // ─── 画面切り替え ───
  if (screen === 'login') return <LoginPage onBack={() => setScreen('booking')} onLoggedIn={(data) => { setForm({ name: data.name || '', phone: data.phone || '', email: data.email || '' }); setRegisteredUser({ name: data.name, phone: data.phone, email: data.email }); setScreen('booking'); }} />;
  if (screen === 'register') return <RegisterPage lineProfile={lineProfile} onBack={() => setScreen('booking')} onRegistered={(data) => { setForm({ name: data.name || '', phone: data.phone || '', email: data.email || '' }); setRegisteredUser({ name: data.name, phone: data.phone, email: data.email }); }} />;
  if (screen === 'mypage') return <MyPage lineProfile={lineProfile} onBack={() => setScreen('booking')} />;
  if (screen === 'search') return <BookingSearch onFound={(bookings) => { setSearchedBookings(bookings); setScreen('searchResult'); }} onBack={() => setScreen('booking')} />;
  if (screen === 'searchResult') return <MyPage lineProfile={null} initialBookings={searchedBookings} onBack={() => setScreen('search')} />;
  if (screen === 'inquiry') return <InquiryPage lineProfile={lineProfile} registeredUser={registeredUser} storePhone={storePhone} onBack={() => setScreen('booking')} />;

  // ─── 完了画面 ───
  if (completed) {
    return (
      <div style={S.wrap}>
        <div style={S.header}><h3 style={S.headerTitle}>予約完了</h3></div>
        <div style={{ ...S.body, textAlign: 'center', paddingTop: 48 }}>
          <div style={{ fontSize: 56, marginBottom: 16 }}>✅</div>
          <h3 style={{ fontSize: 18, fontWeight: 700, color: C.primary, marginBottom: 12 }}>ご予約が完了しました</h3>
          <div style={{ background: C.primaryPale, color: C.primary, borderRadius: 8, padding: '12px 20px', fontWeight: 700, fontSize: 14, marginBottom: 16 }}>予約ID: {completed}</div>
          {storePhone && <div style={S.note}>ご不明な点はお気軽にお問い合わせください。TEL: {storePhone}</div>}
          <button style={S.btn('primary')} onClick={() => { setCompleted(null); setStep(1); setSelection({ menuId: '', staffId: '', date: '', slot: '' }); setCalDate(new Date()); }}>最初に戻る</button>
          <button style={S.btn('outline')} onClick={() => { setCompleted(null); setScreen(lineProfile ? 'mypage' : 'search'); }}>📋 予約を確認する</button>
        </div>
      </div>
    );
  }

  // ─── メイン予約画面（2段ヘッダー） ───
  return (
    <div style={S.wrap}>

      {/* ── 1段目：タイトル・ログイン名・登録ボタン ── */}
      <div style={S.headerRow1}>
        <h3 style={S.headerTitle}>🏥 ご予約</h3>
        {/* LINE登録済みユーザー名 */}
        {lineProfile && <span style={{ fontSize: 11, opacity: 0.85, whiteSpace: 'nowrap' }}>{lineProfile.displayName} 様</span>}
        {/* ブラウザでログイン済みの場合 */}
        {registeredUser && !lineProfile && <span style={{ fontSize: 11, opacity: 0.85, whiteSpace: 'nowrap' }}>{registeredUser.name} 様</span>}
        {/* 未登録かつブラウザ経由：ログイン・新規登録ボタン */}
        {!registeredUser && !lineProfile && (
          <>
            <button onClick={() => setScreen('login')} style={S.headerBtn}>🔑 ログイン</button>
            <button onClick={() => setScreen('register')} style={{ ...S.headerBtn, marginLeft: 4 }}>📝 新規登録</button>
          </>
        )}
        {/* LINE未登録の場合：新規登録ボタン */}
        {!registeredUser && lineProfile && (
          <button onClick={() => setScreen('register')} style={S.headerBtn}>📝 新規登録</button>
        )}
      </div>

      {/* ── 2段目：電話番号・予約確認・問い合わせ ── */}
      <div style={S.headerRow2}>
        {/* 電話番号（タップで電話発信） */}
        {storePhone
          ? <a href={`tel:${storePhone}`} style={{ fontSize: 12, fontWeight: 700, color: '#fff', textDecoration: 'none', flex: 1, whiteSpace: 'nowrap' }}>📞 {storePhone}</a>
          : <span style={{ flex: 1 }} />
        }
        {/* 予約確認ボタン */}
        <button onClick={() => setScreen(lineProfile ? 'mypage' : 'search')} style={S.headerBtn}>📋 予約確認</button>
        {/* 問い合わせボタン */}
        <button onClick={() => setScreen('inquiry')} style={{ ...S.headerBtn, marginLeft: 4 }}>💬 問い合わせ</button>
      </div>

      {/* コンテンツ */}
      <div style={S.body}>
        {/* ステップインジケーター */}
        <div style={{ display: 'flex', gap: 4, marginBottom: 20, justifyContent: 'center' }}>
          {STEPS.map(s => <div key={s.num} style={{ width: 28, height: 5, borderRadius: 3, background: s.num <= step ? C.primary : C.border, transition: 'background .3s' }} />)}
        </div>

        {/* ─── Step 1: コース選択 ─── */}
        {step === 1 && (
          <div>
            <h3 style={{ fontWeight: 700, color: C.primary, marginBottom: 4 }}>① コースを選んでください</h3>
            <p style={{ fontSize: 12, color: C.muted, marginBottom: 16 }}>ご希望のコースをタップしてください</p>
            {menuList.map(m => <MenuRadioItem key={m.menuId} menu={m} selected={selection.menuId} onClick={() => { set('menuId', m.menuId); setStep(2); }} />)}
          </div>
        )}

        {/* ─── Step 2: 担当者選択 ─── */}
        {step === 2 && (
          <div>
            <h3 style={{ fontWeight: 700, color: C.primary, marginBottom: 12 }}>② 担当者を選んでください</h3>
            {[{ staffId: 'any', name: '指名なし（空き優先）' }, ...staffList.filter(s => !selection.menuId || (s.menus || '').includes(selection.menuId))].map(s => (
              <div key={s.staffId} style={S.step(selection.staffId === s.staffId)} onClick={() => { set('staffId', s.staffId); setStep(3); }}>
                <span style={S.stepNum(selection.staffId === s.staffId)}>●</span>
                <div><div style={{ fontWeight: 600 }}>{s.name}</div>{s.workDays && <div style={{ fontSize: 11.5, color: C.muted }}>勤務：{s.workDays}</div>}</div>
              </div>
            ))}
            <button style={S.btn('gray')} onClick={() => setStep(1)}>← 戻る</button>
          </div>
        )}

        {/* ─── Step 3: 日時選択 ─── */}
        {step === 3 && (
          <div>
            <h3 style={{ fontWeight: 700, color: C.primary, marginBottom: 12 }}>③ 日時を選んでください</h3>
            {availLoading ? (
              <div style={{ textAlign: 'center', padding: '24px 0', color: C.muted, fontSize: 13 }}>📅 空き状況を読み込み中...</div>
            ) : (
              <BookingCalendar availability={availability} selectedStaffId={selection.staffId} selectedDate={selection.date} calDate={calDate} onChangeMonth={handleChangeMonth} onSelectDate={(dateStr) => { set('date', dateStr); set('slot', ''); }} />
            )}
            <SlotPicker availability={availability} selectedDate={selection.date} selectedStaffId={selection.staffId} selectedSlot={selection.slot} onSelectSlot={(slot) => { set('slot', slot); setTimeout(() => setStep(4), 300); }} />
            {selection.date && selection.slot && <button style={{ ...S.btn('primary'), marginTop: 16 }} onClick={() => setStep(4)}>次へ →</button>}
            <button style={S.btn('gray')} onClick={() => setStep(2)}>← 戻る</button>
          </div>
        )}

        {/* ─── Step 4: 情報入力 ─── */}
        {step === 4 && (
          <div>
            <h3 style={{ fontWeight: 700, color: C.primary, marginBottom: 12 }}>④ ご情報を入力してください</h3>
            {registeredUser
              ? <div style={S.note}>✅ 登録済み情報から自動入力しました</div>
              : (
                <div style={S.noteWarn}>
                  <div style={{ marginBottom: 6 }}>利用者登録すると次回から自動入力されます</div>
                  {!lineProfile && <div style={{ display: 'flex', gap: 12 }}><span onClick={() => setScreen('login')} style={{ color: C.primary, fontWeight: 700, cursor: 'pointer', textDecoration: 'underline', fontSize: 12 }}>🔑 ログイン</span><span onClick={() => setScreen('register')} style={{ color: C.primary, fontWeight: 700, cursor: 'pointer', textDecoration: 'underline', fontSize: 12 }}>📝 新規登録</span></div>}
                  {lineProfile && <span onClick={() => setScreen('register')} style={{ color: C.primary, fontWeight: 700, cursor: 'pointer', textDecoration: 'underline', fontSize: 12 }}>登録する →</span>}
                </div>
              )
            }
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

        {/* ─── Step 5: 確認・送信 ─── */}
        {step === 5 && (
          <div>
            <h3 style={{ fontWeight: 700, color: C.primary, marginBottom: 12 }}>⑤ 予約内容を確認してください</h3>
            <div style={S.card}>
              <div style={{ display: 'grid', gridTemplateColumns: '100px 1fr', gap: '8px 0', fontSize: 13 }}>
                <span style={{ color: C.muted }}>コース</span><span style={{ fontWeight: 600 }}>{selectedMenu?.name}</span>
                <span style={{ color: C.muted }}>担当者</span><span style={{ fontWeight: 600 }}>{selectedStaffName}</span>
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