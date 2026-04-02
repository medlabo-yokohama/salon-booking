// ============================================================
// admin_dashboard_with_notifications.jsx
// 管理者ダッシュボード 完全修正版
// ============================================================
import React, { useState, useEffect, useCallback } from 'react';

const GAS_URL = import.meta.env.VITE_GAS_URL || '';

const NAV_ITEMS = [
  { key: 'booking', label: '予約管理画面' },
  { key: 'staff',   label: '施術者管理画面' },
  { key: 'store',   label: '店舗管理画面' },
  { key: 'menu',    label: 'メニュー管理画面' },
  { key: 'message', label: 'メッセージ管理画面' },
  { key: 'users',   label: '利用者管理画面' },
  { key: 'inquiry', label: '問い合わせ' },
];

// ============================================================
// API
// ============================================================
async function apiGet(params) {
  const url = new URL(GAS_URL);
  Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));
  const res = await fetch(url.toString());
  return res.json();
}
async function apiPost(body) {
  const res = await fetch(GAS_URL, { method: 'POST', body: JSON.stringify(body) });
  return res.json();
}

// ============================================================
// ユーティリティ
// ============================================================

/** 日時を「YYYY-MM-DD HH:mm」形式に正規化する */
function fmtDatetime(raw) {
  if (!raw) return '—';
  if (/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}/.test(String(raw))) return String(raw).substring(0, 16);
  // "2026-03-09 9:30" → "2026-03-09 09:30"
  const m = String(raw).match(/^(\d{4}-\d{2}-\d{2})\s+(\d):(\d{2})/);
  if (m) return `${m[1]} 0${m[2]}:${m[3]}`;
  const d = new Date(raw);
  if (!isNaN(d)) {
    const p = n => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${p(d.getMonth()+1)}-${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}`;
  }
  return String(raw);
}

/** 登録日をYYYY-MM-DD形式に変換する */
function fmtDate(raw) {
  if (!raw) return '—';
  const d = new Date(raw);
  if (!isNaN(d)) {
    const p = n => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${p(d.getMonth()+1)}-${p(d.getDate())}`;
  }
  return String(raw).split('T')[0];
}

/** 電話番号の先頭0を保証する */
function fmtPhone(raw) {
  if (!raw) return '—';
  const s = String(raw);
  // 数値として解釈され先頭0が消えた場合に補完
  if (/^[1-9]\d{9}$/.test(s)) return '0' + s;
  return s;
}

// ============================================================
// スタイル
// ============================================================
const C = {
  primary: '#1a4f8a', primaryPale: '#dbeafe', accent: '#0ea5e9',
  danger: '#dc2626', warning: '#f59e0b', success: '#059669',
  bg: '#f0f4f8', surface: '#fff', border: '#cbd5e1',
  text: '#1e293b', muted: '#64748b',
};

const S = {
  app: { fontFamily: "'Noto Sans JP', sans-serif", background: C.bg, minHeight: '100vh', fontSize: 13 },
  layout: { display: 'flex', minHeight: '100vh' },
  sidenav: { width: 184, background: C.surface, borderRight: `1px solid ${C.border}`, flexShrink: 0, display: 'flex', flexDirection: 'column', padding: '16px 0', position: 'sticky', top: 0, height: '100vh' },
  navLink: (active) => ({ display: 'block', padding: '9px 18px', color: active ? '#fff' : C.text, background: active ? C.primary : 'transparent', textDecoration: 'none', fontSize: 12.5, cursor: 'pointer', fontWeight: active ? 700 : 400 }),
  navLogout: { display: 'block', padding: '9px 18px', color: C.danger, marginTop: 'auto', cursor: 'pointer', fontSize: 12.5 },
  main: { flex: 1, padding: '20px 24px', overflowX: 'auto' },
  pageHeader: { display: 'flex', alignItems: 'center', gap: 12, marginBottom: 18 },
  pageTitle: { fontSize: 16, fontWeight: 700, color: C.primary },
  refreshBar: { display: 'flex', alignItems: 'center', gap: 8, padding: '6px 12px', background: C.surface, borderBottom: `1px solid ${C.border}`, fontSize: 11.5, marginBottom: 12 },
  // ログイン
  loginWrap: { display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', background: 'linear-gradient(135deg,#1a4f8a,#0ea5e9)' },
  loginCard: { background: '#fff', borderRadius: 12, padding: '40px 48px', boxShadow: '0 20px 60px rgba(0,0,0,.2)', minWidth: 360 },
  loginInput: { width: '100%', border: `1.5px solid ${C.border}`, borderRadius: 6, padding: '9px 12px', fontFamily: 'inherit', fontSize: 13, boxSizing: 'border-box', marginBottom: 12 },
  // ボタン
  btn: (v) => {
    const vs = { primary: { background: C.primary, color: '#fff' }, danger: { background: C.danger, color: '#fff' }, success: { background: C.success, color: '#fff' }, accent: { background: C.accent, color: '#fff' }, gray: { background: '#e2e8f0', color: C.text }, outline: { background: '#fff', color: C.primary, border: `1.5px solid ${C.primary}` } };
    return { display: 'inline-flex', alignItems: 'center', gap: 4, padding: '6px 16px', border: 'none', borderRadius: 6, fontFamily: 'inherit', fontSize: 12.5, fontWeight: 500, cursor: 'pointer', ...(vs[v] || vs.primary) };
  },
  btnRow: { display: 'flex', gap: 8, marginTop: 16, flexWrap: 'wrap' },
  // テーブル
  gridTbl: { width: '100%', borderCollapse: 'collapse', background: C.surface, boxShadow: '0 2px 8px rgba(0,0,0,.10)', borderRadius: 6, overflow: 'hidden' },
  th: { background: C.primary, color: '#fff', padding: '8px 12px', fontSize: 12.5, fontWeight: 500, textAlign: 'center', border: `1px solid ${C.border}` },
  td: { border: `1px solid ${C.border}`, padding: '8px 12px', fontSize: 12.5 },
  formTbl: { width: '100%', borderCollapse: 'collapse', background: C.surface, borderRadius: 6, overflow: 'hidden', boxShadow: '0 2px 8px rgba(0,0,0,.10)' },
  formTh: { background: '#f1f5f9', fontWeight: 600, width: 180, color: C.text, border: `1px solid ${C.border}`, padding: '9px 12px', fontSize: 12.5, textAlign: 'left' },
  formTd: { color: C.muted, border: `1px solid ${C.border}`, padding: '9px 12px', fontSize: 12.5 },
  input: { width: '100%', border: `1.5px solid ${C.border}`, borderRadius: 4, padding: '5px 8px', fontFamily: 'inherit', fontSize: 12.5, color: C.text, background: '#f8fafc', boxSizing: 'border-box' },
  // カレンダー
  calTh: (t) => ({ background: t === 'sun' ? '#b91c1c' : t === 'sat' ? '#1d4ed8' : C.primary, color: '#fff', padding: '6px 4px', textAlign: 'center', fontSize: 12, fontWeight: 500 }),
  calTd: (t) => ({ border: `1px solid ${C.border}`, verticalAlign: 'top', height: 80, padding: 4, background: t === 'holiday' ? '#fef2f2' : t === 'sat' ? '#eff6ff' : C.surface, cursor: 'pointer' }),
  calEvent: { fontSize: 10.5, background: C.primaryPale, color: C.primary, borderRadius: 3, padding: '1px 4px', marginTop: 2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' },
  dayTd: (t) => {
    const base = { border: `1px solid ${C.border}`, padding: '4px 6px', height: 38, verticalAlign: 'top' };
    return { ...base, ...({ time: { background: '#f8fafc', fontSize: 11.5, color: C.muted, textAlign: 'center', fontFamily: 'monospace' }, break: { background: '#fef3c7' }, off: { background: '#f1f5f9' }, booked: { background: C.primaryPale, cursor: 'pointer' }, empty: { cursor: 'pointer' } }[t] || {}) };
  },
  // カード・バッジ・ノート
  card: { background: C.surface, borderRadius: 6, boxShadow: '0 2px 8px rgba(0,0,0,.10)', padding: '16px 20px', marginBottom: 16 },
  dashGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(150px,1fr))', gap: 12, marginBottom: 20 },
  dashCard: (color) => ({ background: C.surface, borderRadius: 6, boxShadow: '0 2px 8px rgba(0,0,0,.08)', padding: '14px 16px', borderTop: `3px solid ${color}` }),
  badge: (c) => ({ display: 'inline-block', padding: '2px 8px', borderRadius: 20, fontSize: 10.5, fontWeight: 700, ...({ blue: { background: C.primaryPale, color: C.primary }, green: { background: '#d1fae5', color: '#065f46' }, gray: { background: '#e2e8f0', color: '#475569' } }[c] || {}) }),
  note: (t) => ({ padding: '8px 12px', borderRadius: '0 4px 4px 0', fontSize: 11.5, marginTop: 10, ...({ warn: { background: '#fef9c3', borderLeft: `4px solid ${C.warning}`, color: '#78350f' }, info: { background: '#eff6ff', borderLeft: `4px solid ${C.primary}`, color: C.primary }, success: { background: '#f0fdf4', borderLeft: `4px solid ${C.success}`, color: '#065f46' } }[t] || {}) }),
  sectionTitle: { fontSize: 14, fontWeight: 700, color: C.primary, marginBottom: 12, paddingBottom: 6, borderBottom: `2px solid ${C.primaryPale}` },
  // モーダル
  overlay: { position: 'fixed', inset: 0, background: 'rgba(0,0,0,.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 },
  modalCard: { background: '#fff', borderRadius: 8, padding: 24, minWidth: 400, maxWidth: 560, width: '90%', boxShadow: '0 20px 60px rgba(0,0,0,.3)', maxHeight: '90vh', overflowY: 'auto' },
};

// ============================================================
// 共通コンポーネント
// ============================================================
function Modal({ title, onClose, children }) {
  return (
    <div style={S.overlay} onClick={onClose}>
      <div style={S.modalCard} onClick={e => e.stopPropagation()}>
        <div style={{ fontSize: 15, fontWeight: 700, color: C.primary, marginBottom: 16 }}>{title}</div>
        {children}
      </div>
    </div>
  );
}

function FormRow({ label, required, children }) {
  return (
    <tr>
      <th style={S.formTh}>{label}{required && <span style={{ color: C.danger, fontSize: 11, marginLeft: 4 }}>*</span>}</th>
      <td style={S.formTd}>{children}</td>
    </tr>
  );
}

function Btn({ v = 'primary', onClick, children, style }) {
  return <button style={{ ...S.btn(v), ...style }} onClick={onClick}>{children}</button>;
}

function SideNav({ current, onChange, onLogout }) {
  return (
    <nav style={S.sidenav}>
      {NAV_ITEMS.map(item => (
        <a key={item.key} style={S.navLink(current === item.key)} onClick={() => onChange(item.key)}>{item.label}</a>
      ))}
      <a style={S.navLogout} onClick={onLogout}>ログアウト</a>
    </nav>
  );
}

function RefreshBar({ countdown, onManualRefresh }) {
  return (
    <div style={S.refreshBar}>
      <span style={{ background: '#d1fae5', color: '#065f46', padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 700 }}>● 自動更新中</span>
      <span style={{ color: C.muted, fontSize: 11 }}>次の更新まで <b>{countdown}</b>秒</span>
      <button style={S.btn('gray')} onClick={onManualRefresh}>⟳ 手動更新</button>
    </div>
  );
}

// ============================================================
// ログイン画面
// ============================================================
function LoginScreen({ onLogin }) {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!password) { setError('パスワードを入力してください'); return; }
    setLoading(true);
    try {
      const res = await apiPost({ action: 'adminLogin', password });
      if (res.success) { onLogin(); }
      else { setError(res.error?.message || 'パスワードが違います'); }
    } catch { setError('通信エラーが発生しました'); }
    setLoading(false);
  };

  return (
    <div style={S.loginWrap}>
      <div style={S.loginCard}>
        <h2 style={{ fontSize: 20, color: C.primary, fontWeight: 700, marginBottom: 24, textAlign: 'center' }}>🏥 予約システム</h2>
        <label style={{ display: 'block', fontSize: 12, fontWeight: 600, marginBottom: 4, color: C.muted }}>ログインID（E-Mail）</label>
        <input style={S.loginInput} type="email" placeholder="〇〇〇@yokohama-isen.ac.jp" />
        <label style={{ display: 'block', fontSize: 12, fontWeight: 600, marginBottom: 4, color: C.muted }}>パスワード</label>
        <input style={S.loginInput} type="password" placeholder="パスワードを入力"
          value={password} onChange={e => setPassword(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleLogin()} />
        {error && <p style={{ color: C.danger, fontSize: 12, marginBottom: 8 }}>{error}</p>}
        <div style={{ display: 'flex', gap: 10, marginTop: 8 }}>
          <Btn v="gray" style={{ flex: 1 }} onClick={() => setPassword('')}>キャンセル</Btn>
          <Btn v="primary" style={{ flex: 1 }} onClick={handleLogin}>{loading ? '確認中...' : 'ログイン'}</Btn>
        </div>
      </div>
    </div>
  );
}

// ============================================================
// 月カレンダー
// ============================================================
function CalMonth({ bookings, menuList, currentDate, onChangeDate, onSelectDay }) {
  const year = currentDate.getFullYear(), month = currentDate.getMonth();
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const today = new Date();
  const p = n => String(n).padStart(2, '0');
  const DAY = ['日','月','火','水','木','金','土'];

  const bookingMap = {};
  bookings.forEach(b => {
    const d = b.datetime?.split(' ')[0];
    if (!bookingMap[d]) bookingMap[d] = [];
    bookingMap[d].push(b);
  });

  const weeks = [];
  let day = 1 - firstDay;
  while (day <= daysInMonth) {
    const week = [];
    for (let i = 0; i < 7; i++, day++) week.push(day > 0 && day <= daysInMonth ? day : null);
    weeks.push(week);
  }

  const isToday = d => d && year === today.getFullYear() && month === today.getMonth() && d === today.getDate();

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
        <Btn v="primary" onClick={() => onChangeDate(new Date())}>今月</Btn>
        <button style={{ background: 'none', border: `1.5px solid ${C.border}`, borderRadius: 4, padding: '3px 10px', cursor: 'pointer', fontSize: 14 }} onClick={() => onChangeDate(new Date(year, month - 1, 1))}>≪</button>
        <span style={{ fontSize: 15, fontWeight: 700, minWidth: 110, textAlign: 'center' }}>{year}年{month + 1}月</span>
        <button style={{ background: 'none', border: `1.5px solid ${C.border}`, borderRadius: 4, padding: '3px 10px', cursor: 'pointer', fontSize: 14 }} onClick={() => onChangeDate(new Date(year, month + 1, 1))}>≫</button>
      </div>
      <table style={{ width: '100%', borderCollapse: 'collapse', tableLayout: 'fixed' }}>
        <thead>
          <tr>{DAY.map((d, i) => <th key={d} style={S.calTh(i === 0 ? 'sun' : i === 6 ? 'sat' : 'weekday')}>{d}</th>)}</tr>
        </thead>
        <tbody>
          {weeks.map((week, wi) => (
            <tr key={wi}>
              {week.map((d, di) => {
                const dateStr = d ? `${year}-${p(month + 1)}-${p(d)}` : null;
                const dayBookings = dateStr ? (bookingMap[dateStr] || []) : [];
                return (
                  <td key={di} style={{ ...S.calTd(di === 0 ? 'holiday' : di === 6 ? 'sat' : 'normal'), outline: isToday(d) ? `2px solid ${C.primary}` : 'none' }}
                    onClick={() => d && onSelectDay(new Date(year, month, d))}>
                    {d && (
                      <>
                        <div style={{ fontSize: 12, fontWeight: 700, color: di === 0 ? '#b91c1c' : di === 6 ? '#1d4ed8' : C.muted }}>
                          {d}{isToday(d) && <span style={{ marginLeft: 4, fontSize: 9, background: C.primary, color: '#fff', borderRadius: 3, padding: '0 3px' }}>今日</span>}
                        </div>
                        {dayBookings.slice(0, 3).map((b, bi) => {
                          const mName = menuList.find(m => m.menuId === b.menuId)?.name || b.menuId;
                          const time = b.datetime?.split(' ')[1]?.substring(0, 5) || '';
                          return <div key={bi} style={S.calEvent}>{time} {b.userName}（{mName}）</div>;
                        })}
                        {dayBookings.length > 3 && <div style={{ fontSize: 10, color: C.muted }}>+{dayBookings.length - 3}件</div>}
                      </>
                    )}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
      <div style={S.note('info')}>💡 日毎のサマリーを表示。セルをクリックすると日単位ビューに移動。</div>
    </div>
  );
}

// ============================================================
// 日ビュー
// ============================================================
function CalDay({ bookings, staffList, menuList, currentDate, onChangeDate, onSelectBooking, onSelectEmpty }) {
  const DAY = ['日','月','火','水','木','金','土'];
  const p = n => String(n).padStart(2, '0');
  const dateStr = `${currentDate.getFullYear()}-${p(currentDate.getMonth()+1)}-${p(currentDate.getDate())}`;
  const slots = [];
  for (let h = 9; h < 18; h++) { slots.push(`${p(h)}:00`); slots.push(`${p(h)}:30`); }

  // 時刻を正規化してマッピング
  const bookingMap = {};
  bookings.forEach(b => {
    const rawTime = b.datetime?.split(' ')[1]?.substring(0, 5) || '';
    const time = rawTime.includes(':') && rawTime.indexOf(':') < 2 ? rawTime.padStart(5, '0') : rawTime;
    bookingMap[`${time}__${b.staffId}`] = b;
  });

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
        <Btn v="primary" onClick={() => onChangeDate(new Date())}>今日</Btn>
        <button style={{ background: 'none', border: `1.5px solid ${C.border}`, borderRadius: 4, padding: '3px 10px', cursor: 'pointer', fontSize: 14 }}
          onClick={() => { const d = new Date(currentDate); d.setDate(d.getDate()-1); onChangeDate(d); }}>≪</button>
        <span style={{ fontSize: 15, fontWeight: 700, minWidth: 150, textAlign: 'center' }}>
          {currentDate.getMonth()+1}月{currentDate.getDate()}日（{DAY[currentDate.getDay()]}）
        </span>
        <button style={{ background: 'none', border: `1.5px solid ${C.border}`, borderRadius: 4, padding: '3px 10px', cursor: 'pointer', fontSize: 14 }}
          onClick={() => { const d = new Date(currentDate); d.setDate(d.getDate()+1); onChangeDate(d); }}>≫</button>
      </div>
      <div style={S.note('info')}>💡 利用者名クリック→予約詳細。空欄クリック→新規予約。橙＝昼休憩。</div>
      <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: 10 }}>
        <thead>
          <tr>
            <th style={{ ...S.dayTd('time'), background: '#374151', color: '#fff', width: 72 }}>時間</th>
            {staffList.map(s => <th key={s.staffId} style={{ background: C.primary, color: '#fff', padding: '7px 10px', textAlign: 'center', fontSize: 12.5, border: `1px solid ${C.border}` }}>{s.name}</th>)}
          </tr>
        </thead>
        <tbody>
          {slots.map(slot => {
            const inBreak = slot >= '12:00' && slot < '13:00';
            return (
              <tr key={slot}>
                <td style={S.dayTd('time')}>{slot}</td>
                {staffList.map(s => {
                  const booking = bookingMap[`${slot}__${s.staffId}`];
                  if (inBreak) return <td key={s.staffId} style={S.dayTd('break')}>{slot === '12:00' && <span style={{ fontSize: 11, color: '#92400e' }}>🌙 昼休憩</span>}</td>;
                  if (booking) {
                    const mName = menuList.find(m => m.menuId === booking.menuId)?.name || booking.menuId;
                    return (
                      <td key={s.staffId} style={S.dayTd('booked')} onClick={() => onSelectBooking(booking)}>
                        <div style={{ fontSize: 10.5, color: C.primary, fontWeight: 500, lineHeight: 1.4 }}>{mName} / {booking.userName}</div>
                      </td>
                    );
                  }
                  return <td key={s.staffId} style={S.dayTd('empty')} onClick={() => onSelectEmpty(dateStr, slot, s.staffId)} />;
                })}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

// ============================================================
// 予約詳細モーダル
// ============================================================
function BookingDetailModal({ booking, staffList, menuList, onClose, onCancel, onUpdate }) {
  const [note, setNote] = useState(booking.note || '');
  const [loading, setLoading] = useState(false);
  const staffName = staffList.find(s => s.staffId === booking.staffId)?.name || booking.staffId;
  const menuName  = menuList.find(m => m.menuId === booking.menuId)?.name || booking.menuId;

  return (
    <Modal title="📋 予約詳細" onClose={onClose}>
      <table style={S.formTbl}>
        <tbody>
          <FormRow label="予約ID">{booking.bookingId}</FormRow>
          <FormRow label="日時">{fmtDatetime(booking.datetime)}</FormRow>
          <FormRow label="顧客名">{booking.userName}</FormRow>
          <FormRow label="担当施術者">{staffName}</FormRow>
          <FormRow label="コース">{menuName}</FormRow>
          <FormRow label="電話番号">{fmtPhone(booking.userPhone)}</FormRow>
          <FormRow label="E-Mail">{booking.userEmail || '—'}</FormRow>
          <FormRow label="ステータス"><span style={S.badge(booking.status === '確定' ? 'green' : 'gray')}>{booking.status}</span></FormRow>
          <FormRow label="要望・備考">
            <textarea style={{ ...S.input, height: 60 }} value={note} onChange={e => setNote(e.target.value)} />
          </FormRow>
        </tbody>
      </table>
      <div style={S.btnRow}>
        <Btn v="danger" onClick={async () => {
          if (!window.confirm('この予約をキャンセルしますか？')) return;
          setLoading(true);
          await onCancel(booking.bookingId);
          setLoading(false);
          onClose();
        }}>{loading ? '処理中...' : '予約取り消し'}</Btn>
        <Btn v="gray" onClick={onClose}>閉じる</Btn>
        <Btn v="primary" style={{ marginLeft: 'auto' }} onClick={async () => {
          setLoading(true);
          await onUpdate(booking.bookingId, { note });
          setLoading(false);
          onClose();
        }}>保存</Btn>
      </div>
    </Modal>
  );
}

// ============================================================
// 新規予約モーダル
// ============================================================
function NewBookingModal({ defaultDate, defaultSlot, defaultStaffId, staffList, menuList, onClose, onSave }) {
  const [form, setForm] = useState({
    datetime: defaultDate && defaultSlot ? `${defaultDate} ${defaultSlot}` : '',
    staffId: defaultStaffId || '',
    menuId: menuList[0]?.menuId || '',
    userName: '', userPhone: '', userEmail: '', note: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));

  return (
    <Modal title="📝 新規予約" onClose={onClose}>
      {error && <p style={{ color: C.danger, fontSize: 12, marginBottom: 8 }}>{error}</p>}
      <table style={S.formTbl}>
        <tbody>
          <FormRow label="日時" required>
            <input style={S.input} type="datetime-local" value={form.datetime.replace(' ', 'T')} onChange={e => set('datetime', e.target.value.replace('T', ' '))} />
          </FormRow>
          <FormRow label="担当施術者" required>
            <select style={S.input} value={form.staffId} onChange={e => set('staffId', e.target.value)}>
              <option value="">選択してください</option>
              {staffList.map(s => <option key={s.staffId} value={s.staffId}>{s.name}</option>)}
            </select>
          </FormRow>
          <FormRow label="コース" required>
            <select style={S.input} value={form.menuId} onChange={e => set('menuId', e.target.value)}>
              {menuList.map(m => <option key={m.menuId} value={m.menuId}>{m.name}（{m.durationMin}分）</option>)}
            </select>
          </FormRow>
          <FormRow label="顧客名" required><input style={S.input} type="text" placeholder="山田太郎" value={form.userName} onChange={e => set('userName', e.target.value)} /></FormRow>
          <FormRow label="電話番号"><input style={S.input} type="tel" placeholder="09012345678" value={form.userPhone} onChange={e => set('userPhone', e.target.value)} /></FormRow>
          <FormRow label="E-Mail"><input style={S.input} type="email" placeholder="yamada@example.com" value={form.userEmail} onChange={e => set('userEmail', e.target.value)} /></FormRow>
          <FormRow label="要望・備考"><textarea style={{ ...S.input, height: 60 }} value={form.note} onChange={e => set('note', e.target.value)} /></FormRow>
        </tbody>
      </table>
      <div style={S.btnRow}>
        <Btn v="gray" onClick={onClose}>キャンセル</Btn>
        <Btn v="primary" style={{ marginLeft: 'auto' }} onClick={async () => {
          if (!form.datetime || !form.staffId || !form.menuId || !form.userName) { setError('必須項目を入力してください'); return; }
          setLoading(true);
          const res = await apiPost({ action: 'createBooking', ...form });
          if (res.success) { onSave(); onClose(); }
          else setError(res.error?.message || '登録に失敗しました');
          setLoading(false);
        }}>{loading ? '登録中...' : '予約登録'}</Btn>
      </div>
    </Modal>
  );
}

// ============================================================
// 施術者管理画面
// ============================================================
function StaffScreen({ staffList, menuList, bookings, onRefreshStaff }) {
  const [editStaff, setEditStaff] = useState(null);
  const [showAdd, setShowAdd] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const initSchedule = () => {
    const s = {};
    ['日','月','火','水','木','金','土'].forEach(d => { s[d] = { type: 'off', start: '09:00', end: '18:00' }; });
    return s;
  };
  const [newStaff, setNewStaff] = useState({ name: '', menus: [], schedule: initSchedule() });
  const [saved, setSaved] = useState('');
  const [loading, setLoading] = useState(false);

  const now = new Date();
  const thisMonth = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}`;
  const countByStaff = {};
  bookings.forEach(b => {
    if (b.datetime?.startsWith(thisMonth)) {
      countByStaff[b.staffId] = (countByStaff[b.staffId] || 0) + 1;
    }
  });

  const colors = [C.primary, C.accent, C.success, C.warning];
  const DAY_NAMES = ['日','月','火','水','木','金','土'];

  const showMsg = (msg) => { setSaved(msg); setTimeout(() => setSaved(''), 4000); };

  const handleSaveStaff = async (schedule) => {
    if (!editStaff) return;
    setLoading(true);
    const res = await apiPost({
      action: 'updateStaff',
      staffId: editStaff.staffId,
      name: editStaff.name,
      workDays: editStaff.workDaysArr.join(','),
      menus: editStaff.menusArr.join(','),
      schedule: schedule ? JSON.stringify(schedule) : undefined,
    });
    if (res.success) { showMsg(`${editStaff.name}の設定を保存しました`); onRefreshStaff(); }
    else showMsg('保存に失敗しました: ' + (res.error?.message || ''));
    setLoading(false);
    setEditStaff(null);
  };

  const handleAddStaff = async () => {
    if (!newStaff.name) { alert('氏名を入力してください'); return; }
    setLoading(true);
    // scheduleから勤務曜日を自動抽出
    const workDays = Object.entries(newStaff.schedule)
      .filter(([, v]) => v.type !== 'off')
      .map(([k]) => k);
    const res = await apiPost({
      action: 'addStaff',
      name: newStaff.name,
      workDays: workDays.join(','),
      menus: newStaff.menus.join(','),
      schedule: JSON.stringify(newStaff.schedule),
    });
    if (res.success) { showMsg(`「${newStaff.name}」を追加しました`); onRefreshStaff(); setShowAdd(false); setNewStaff({ name: '', menus: [], schedule: initSchedule() }); }
    else showMsg('追加に失敗しました: ' + (res.error?.message || ''));
    setLoading(false);
  };

  const handleDeleteStaff = async () => {
    if (!deleteTarget) return;
    setLoading(true);
    const res = await apiPost({ action: 'deleteStaff', staffId: deleteTarget.staffId });
    if (res.success) { showMsg(`「${deleteTarget.name}」を削除しました`); onRefreshStaff(); }
    else showMsg('削除に失敗しました: ' + (res.error?.message || ''));
    setLoading(false);
    setDeleteTarget(null);
  };

  return (
    <div>
      <div style={S.pageHeader}>
        <h2 style={S.pageTitle}>施術者管理</h2>
        <span style={{ ...S.badge('blue'), marginLeft: 8 }}>2026年</span>
      </div>

      {/* 予約件数サマリー */}
      <div style={S.sectionTitle}>📊 今月の予約件数サマリー</div>
      <div style={S.dashGrid}>
        {staffList.map((s, i) => (
          <div key={s.staffId} style={S.dashCard(colors[i % colors.length])}>
            <div style={{ fontSize: 11.5, color: C.muted, marginBottom: 6 }}>{s.name}</div>
            <div style={{ fontSize: 28, fontWeight: 700, color: colors[i % colors.length], fontFamily: 'monospace' }}>{countByStaff[s.staffId] || 0}</div>
            <div style={{ fontSize: 10.5, color: C.muted }}>件 / 今月</div>
          </div>
        ))}
      </div>

      {/* 施術者一覧 */}
      <div style={S.sectionTitle}>施術者一覧</div>
      <table style={S.gridTbl}>
        <thead>
          <tr>
            <th style={S.th}>氏名</th>
            <th style={S.th}>勤務曜日</th>
            <th style={S.th}>担当コース</th>
            <th style={S.th}>操作</th>
          </tr>
        </thead>
        <tbody>
          {staffList.map(s => (
            <tr key={s.staffId}>
              <td style={S.td}><b>{s.name}</b><span style={{ color: C.muted, fontSize: 11, marginLeft: 6 }}>{s.staffId}</span></td>
              <td style={S.td}>{s.workDays || '—'}</td>
              <td style={S.td}>
                {(s.menus || '').split(',').filter(Boolean).map(mId => {
                  const m = menuList.find(x => x.menuId === mId.trim());
                  return m ? <span key={mId} style={{ ...S.badge('blue'), marginRight: 4 }}>{m.name}</span> : null;
                })}
              </td>
              <td style={S.td}>
                <div style={{ display: 'flex', gap: 6 }}>
                  <Btn v="outline" style={{ fontSize: 11, padding: '3px 10px' }}
                    onClick={() => setEditStaff({ ...s, workDaysArr: (s.workDays||'').split(',').map(d=>d.trim()).filter(Boolean), menusArr: (s.menus||'').split(',').map(m=>m.trim()).filter(Boolean) })}>
                    設定
                  </Btn>
                  <Btn v="danger" style={{ fontSize: 11, padding: '3px 10px' }}
                    onClick={() => setDeleteTarget(s)}>
                    削除
                  </Btn>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <div style={S.btnRow}>
        <Btn v="primary" onClick={() => setShowAdd(true)}>＋ 施術者を追加</Btn>
        <Btn v="accent" onClick={() => alert('翌月のシフトは現在の勤務設定を引き継ぎます。')}>翌月のシフトへ反映</Btn>
      </div>
      {saved && <div style={S.note('success')}>✅ {saved}</div>}

      {/* 施術者設定モーダル */}
      {editStaff && (
        <Modal title={`${editStaff.name}　勤務設定`} onClose={() => setEditStaff(null)}>
          {/* 氏名 */}
          <div style={S.card}>
            <div style={S.sectionTitle}>氏名</div>
            <input style={S.input} type="text" value={editStaff.name}
              onChange={e => setEditStaff(prev => ({ ...prev, name: e.target.value }))} />
          </div>

          {/* 曜日ごと勤務時間設定 */}
          <div style={S.card}>
            <div style={S.sectionTitle}>曜日ごと勤務設定</div>
            <div style={{ fontSize: 11, color: C.muted, marginBottom: 8 }}>
              🌙 休憩時間は店舗管理画面の設定が共通適用されます
            </div>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12.5 }}>
              <thead>
                <tr>
                  {['曜日','区分','開始','終了'].map(h => (
                    <th key={h} style={{ background: C.primary, color: '#fff', padding: '5px 8px', textAlign: 'center', border: `1px solid ${C.border}` }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {DAY_NAMES.map(day => {
                  const schedKey = `schedule_${day}`;
                  const sched = editStaff[schedKey] || { type: 'off', start: '09:00', end: '18:00' };
                  const updateSched = (updates) => setEditStaff(prev => ({
                    ...prev,
                    [schedKey]: { ...sched, ...updates },
                    workDaysArr: updates.type === 'off'
                      ? prev.workDaysArr.filter(d => d !== day)
                      : prev.workDaysArr.includes(day) ? prev.workDaysArr : [...prev.workDaysArr, day],
                  }));
                  return (
                    <tr key={day} style={{ background: sched.type === 'off' ? '#f8fafc' : C.primaryPale }}>
                      <td style={{ border: `1px solid ${C.border}`, padding: '4px 8px', textAlign: 'center', fontWeight: 600 }}>{day}</td>
                      <td style={{ border: `1px solid ${C.border}`, padding: '4px 6px' }}>
                        <select style={{ ...S.input, fontSize: 11.5 }} value={sched.type}
                          onChange={e => {
                            const t = e.target.value;
                            const presets = { off: { start:'09:00',end:'18:00' }, am: { start:'09:00',end:'12:00' }, pm: { start:'13:00',end:'18:00' }, full: { start:'09:00',end:'18:00' }, custom: { start:'09:00',end:'18:00' } };
                            updateSched({ type: t, ...presets[t] });
                          }}>
                          <option value="off">休み</option>
                          <option value="am">午前</option>
                          <option value="pm">午後</option>
                          <option value="full">終日</option>
                          <option value="custom">任意</option>
                        </select>
                      </td>
                      <td style={{ border: `1px solid ${C.border}`, padding: '4px 6px' }}>
                        {sched.type !== 'off' && (
                          <input style={{ ...S.input, fontSize: 11.5 }} type="time" value={sched.start}
                            disabled={sched.type !== 'custom' && sched.type !== 'am' && sched.type !== 'pm' && sched.type !== 'full'}
                            onChange={e => updateSched({ start: e.target.value })} />
                        )}
                      </td>
                      <td style={{ border: `1px solid ${C.border}`, padding: '4px 6px' }}>
                        {sched.type !== 'off' && (
                          <input style={{ ...S.input, fontSize: 11.5 }} type="time" value={sched.end}
                            disabled={sched.type !== 'custom' && sched.type !== 'am' && sched.type !== 'pm' && sched.type !== 'full'}
                            onChange={e => updateSched({ end: e.target.value })} />
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* 担当コース */}
          <div style={S.card}>
            <div style={S.sectionTitle}>担当コース</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12 }}>
              {menuList.map(m => (
                <label key={m.menuId} style={{ display: 'flex', alignItems: 'center', gap: 5, cursor: 'pointer', fontSize: 12.5 }}>
                  <input type="checkbox" checked={editStaff.menusArr.includes(m.menuId)}
                    onChange={e => {
                      const arr = e.target.checked ? [...editStaff.menusArr, m.menuId] : editStaff.menusArr.filter(x => x !== m.menuId);
                      setEditStaff(prev => ({ ...prev, menusArr: arr }));
                    }} /> {m.name}
                </label>
              ))}
            </div>
          </div>

          <div style={S.btnRow}>
            <Btn v="gray" onClick={() => setEditStaff(null)}>キャンセル</Btn>
            <Btn v="primary" style={{ marginLeft: 'auto' }} onClick={async () => {
              // 曜日ごとスケジュールをJSONに変換して保存
              const schedule = {};
              DAY_NAMES.forEach(day => {
                const s = editStaff[`schedule_${day}`];
                if (s) schedule[day] = s;
              });
              setEditStaff(prev => ({ ...prev, schedule: JSON.stringify(schedule) }));
              await handleSaveStaff(schedule);
            }}>
              {loading ? '保存中...' : '保存'}
            </Btn>
          </div>
        </Modal>
      )}

      {/* 施術者追加モーダル */}
      {showAdd && (() => {
        // 一括設定用ヘルパー
        const PRESETS = { off:{start:'09:00',end:'18:00'}, am:{start:'09:00',end:'12:00'}, pm:{start:'13:00',end:'18:00'}, full:{start:'09:00',end:'18:00'}, custom:{start:'09:00',end:'18:00'} };
        const setBulk = (type) => {
          const s = initSchedule();
          DAY_NAMES.forEach(d => { s[d] = { type, ...PRESETS[type] }; });
          setNewStaff(p => ({ ...p, schedule: s }));
        };
        const updateNewSched = (day, updates) => {
          setNewStaff(p => ({
            ...p,
            schedule: { ...p.schedule, [day]: { ...p.schedule[day], ...updates } }
          }));
        };
        return (
          <Modal title="施術者を追加" onClose={() => { setShowAdd(false); setNewStaff({ name: '', menus: [], schedule: initSchedule() }); }}>
            {/* 氏名 */}
            <div style={S.card}>
              <div style={S.sectionTitle}>氏名 <span style={{ color: C.danger, fontSize: 11 }}>*</span></div>
              <input style={S.input} type="text" placeholder="例：田中次郎"
                value={newStaff.name} onChange={e => setNewStaff(p=>({...p,name:e.target.value}))} />
            </div>

            {/* 担当コース */}
            <div style={S.card}>
              <div style={S.sectionTitle}>担当コース</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12 }}>
                {menuList.map(m => (
                  <label key={m.menuId} style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12.5, cursor: 'pointer' }}>
                    <input type="checkbox" checked={newStaff.menus.includes(m.menuId)}
                      onChange={e => {
                        const arr = e.target.checked ? [...newStaff.menus, m.menuId] : newStaff.menus.filter(x=>x!==m.menuId);
                        setNewStaff(p=>({...p,menus:arr}));
                      }} /> {m.name}
                  </label>
                ))}
              </div>
            </div>

            {/* 勤務時間設定 */}
            <div style={S.card}>
              <div style={S.sectionTitle}>曜日ごと勤務設定</div>
              {/* 一括設定ボタン */}
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 10 }}>
                <span style={{ fontSize: 11.5, color: C.muted, alignSelf: 'center' }}>一括設定：</span>
                {[{l:'全休み',t:'off'},{l:'全午前',t:'am'},{l:'全午後',t:'pm'},{l:'全終日',t:'full'}].map(o => (
                  <Btn key={o.t} v="gray" style={{ fontSize: 11, padding: '3px 10px' }} onClick={() => setBulk(o.t)}>{o.l}</Btn>
                ))}
              </div>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                <thead>
                  <tr>{['曜日','区分','開始','終了'].map(h => (
                    <th key={h} style={{ background: C.primary, color:'#fff', padding:'5px 8px', textAlign:'center', border:`1px solid ${C.border}` }}>{h}</th>
                  ))}</tr>
                </thead>
                <tbody>
                  {DAY_NAMES.map(day => {
                    const sched = newStaff.schedule[day] || { type:'off', start:'09:00', end:'18:00' };
                    return (
                      <tr key={day} style={{ background: sched.type === 'off' ? '#f8fafc' : C.primaryPale }}>
                        <td style={{ border:`1px solid ${C.border}`, padding:'4px 8px', textAlign:'center', fontWeight:600 }}>{day}</td>
                        <td style={{ border:`1px solid ${C.border}`, padding:'4px 6px' }}>
                          <select style={{ ...S.input, fontSize:11.5 }} value={sched.type}
                            onChange={e => {
                              const t = e.target.value;
                              updateNewSched(day, { type:t, ...PRESETS[t] });
                            }}>
                            <option value="off">休み</option>
                            <option value="am">午前</option>
                            <option value="pm">午後</option>
                            <option value="full">終日</option>
                            <option value="custom">任意</option>
                          </select>
                        </td>
                        <td style={{ border:`1px solid ${C.border}`, padding:'4px 6px' }}>
                          {sched.type !== 'off' && (
                            <input style={{ ...S.input, fontSize:11.5 }} type="time" value={sched.start}
                              readOnly={['am','pm','full'].includes(sched.type)}
                              onChange={e => sched.type === 'custom' && updateNewSched(day, { start:e.target.value })} />
                          )}
                        </td>
                        <td style={{ border:`1px solid ${C.border}`, padding:'4px 6px' }}>
                          {sched.type !== 'off' && (
                            <input style={{ ...S.input, fontSize:11.5 }} type="time" value={sched.end}
                              readOnly={['am','pm','full'].includes(sched.type)}
                              onChange={e => sched.type === 'custom' && updateNewSched(day, { end:e.target.value })} />
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              <div style={{ fontSize:11, color:C.muted, marginTop:6 }}>🌙 休憩時間は店舗管理画面の設定が共通適用されます</div>
            </div>

            <div style={S.btnRow}>
              <Btn v="gray" onClick={() => { setShowAdd(false); setNewStaff({ name:'', menus:[], schedule:initSchedule() }); }}>キャンセル</Btn>
              <Btn v="primary" style={{ marginLeft:'auto' }} onClick={handleAddStaff}>
                {loading ? '追加中...' : '追加する'}
              </Btn>
            </div>
          </Modal>
        );
      })()}

      {/* 削除確認モーダル */}
      {deleteTarget && (
        <Modal title="施術者を削除" onClose={() => setDeleteTarget(null)}>
          <p style={{ fontSize: 13, marginBottom: 16 }}>
            <b>「{deleteTarget.name}」</b>を削除しますか？<br />
            <span style={{ color: C.danger, fontSize: 12 }}>この操作は元に戻せません。</span>
          </p>
          <div style={S.btnRow}>
            <Btn v="gray" onClick={() => setDeleteTarget(null)}>キャンセル</Btn>
            <Btn v="danger" style={{ marginLeft: 'auto' }} onClick={handleDeleteStaff}>
              {loading ? '削除中...' : '削除する'}
            </Btn>
          </div>
        </Modal>
      )}
    </div>
  );
}

// ============================================================
// 店舗管理画面
// ============================================================
function StoreScreen({ settings, onSave }) {
  const DAY_NAMES = ['日','月','火','水','木','金','土'];

  // 休憩時間をJSONから配列に変換
  const parseBreaks = (raw) => {
    try { return JSON.parse(raw || '[]'); } catch { return [{ start: '12:00', end: '13:00' }]; }
  };

  const [form, setForm] = useState({
    storeName:   settings['店舗名'] || '',
    storeEmail:  settings['店舗メール'] || '',
    closedDays:  (settings['定休曜日'] || '日').split(',').map(d=>d.trim()).filter(Boolean),
    closedDates: settings['定休日（任意）'] || '',
    openStart:   settings['営業開始時刻'] || '09:00',
    openEnd:     settings['営業終了時刻'] || '18:00',
    breaks:      parseBreaks(settings['休憩時間']),
    unitMin:     String(settings['施術単位（分）'] || '30'),
    refreshSec:  String(settings['自動更新間隔（秒）'] || '30'),
  });
  const [saved, setSaved] = useState(false);

  const toggleDay = (day) => {
    const arr = form.closedDays.includes(day)
      ? form.closedDays.filter(d => d !== day)
      : [...form.closedDays, day];
    setForm(p => ({ ...p, closedDays: arr }));
  };

  const addBreak = () => setForm(p => ({ ...p, breaks: [...p.breaks, { start: '12:00', end: '13:00' }] }));
  const removeBreak = (i) => setForm(p => ({ ...p, breaks: p.breaks.filter((_, idx) => idx !== i) }));
  const updateBreak = (i, key, val) => setForm(p => ({
    ...p, breaks: p.breaks.map((b, idx) => idx === i ? { ...b, [key]: val } : b)
  }));

  const handleSave = async () => {
    await onSave({
      '店舗名': form.storeName,
      '店舗メール': form.storeEmail,
      '定休曜日': form.closedDays.join(','),
      '定休日（任意）': form.closedDates,
      '営業開始時刻': form.openStart,
      '営業終了時刻': form.openEnd,
      '休憩時間': JSON.stringify(form.breaks),
      '施術単位（分）': form.unitMin,
      '自動更新間隔（秒）': form.refreshSec,
    });
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <div>
      <div style={S.pageHeader}><h2 style={S.pageTitle}>店舗管理</h2></div>
      <table style={S.formTbl}>
        <tbody>
          <FormRow label="店舗名">
            <input style={S.input} type="text" value={form.storeName} onChange={e => setForm(p=>({...p,storeName:e.target.value}))} />
          </FormRow>
          <FormRow label="E-Mail">
            <input style={S.input} type="email" value={form.storeEmail} onChange={e => setForm(p=>({...p,storeEmail:e.target.value}))} />
          </FormRow>

          {/* 定休日（曜日） */}
          <FormRow label="定休日（曜日）">
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12 }}>
              {DAY_NAMES.map(d => (
                <label key={d} style={{ display: 'flex', alignItems: 'center', gap: 5, cursor: 'pointer', fontSize: 12.5 }}>
                  <input type="checkbox" checked={form.closedDays.includes(d)} onChange={() => toggleDay(d)} /> {d}
                </label>
              ))}
            </div>
          </FormRow>

          {/* 定休日（任意日付） */}
          <FormRow label="定休日（任意日付）">
            <input style={S.input} type="text" placeholder="例：2026-01-01,2026-01-02（カンマ区切り）"
              value={form.closedDates} onChange={e => setForm(p=>({...p,closedDates:e.target.value}))} />
            <div style={{ fontSize: 11, color: C.muted, marginTop: 4 }}>祝日・臨時休業日をYYYY-MM-DD形式で入力</div>
          </FormRow>

          {/* 営業時間 */}
          <FormRow label="営業時間">
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <input style={{ ...S.input, width: 90 }} type="time" value={form.openStart}
                onChange={e => setForm(p=>({...p,openStart:e.target.value}))} />
              <span style={{ fontSize: 13 }}>〜</span>
              <input style={{ ...S.input, width: 90 }} type="time" value={form.openEnd}
                onChange={e => setForm(p=>({...p,openEnd:e.target.value}))} />
            </div>
          </FormRow>

          {/* 休憩時間 */}
          <FormRow label="休憩時間">
            <div>
              {form.breaks.map((b, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                  <input style={{ ...S.input, width: 90 }} type="time" value={b.start}
                    onChange={e => updateBreak(i, 'start', e.target.value)} />
                  <span style={{ fontSize: 13 }}>〜</span>
                  <input style={{ ...S.input, width: 90 }} type="time" value={b.end}
                    onChange={e => updateBreak(i, 'end', e.target.value)} />
                  <button style={{ background: 'none', border: 'none', color: C.danger, cursor: 'pointer', fontSize: 16 }}
                    onClick={() => removeBreak(i)}>✕</button>
                </div>
              ))}
              <Btn v="outline" style={{ fontSize: 11, padding: '3px 10px', marginTop: 4 }} onClick={addBreak}>
                ＋ 休憩を追加
              </Btn>
              <div style={{ fontSize: 11, color: C.muted, marginTop: 4 }}>全施術者に共通適用されます</div>
            </div>
          </FormRow>

          {/* 施術単位 */}
          <FormRow label="施術単位">
            <div style={{ display: 'flex', gap: 16 }}>
              {['15','30','60'].map(v => (
                <label key={v} style={{ display: 'flex', alignItems: 'center', gap: 5, cursor: 'pointer', fontSize: 12.5 }}>
                  <input type="radio" name="unit" checked={form.unitMin === v} onChange={() => setForm(p=>({...p,unitMin:v}))} /> {v}分単位
                </label>
              ))}
            </div>
          </FormRow>

          {/* 自動更新間隔 */}
          <FormRow label="予約画面 自動更新間隔">
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16 }}>
              {[{l:'なし',v:'0'},{l:'15秒',v:'15'},{l:'30秒',v:'30'},{l:'1分',v:'60'},{l:'5分',v:'300'}].map(o => (
                <label key={o.v} style={{ display: 'flex', alignItems: 'center', gap: 5, cursor: 'pointer', fontSize: 12.5 }}>
                  <input type="radio" name="refresh" checked={form.refreshSec === o.v} onChange={() => setForm(p=>({...p,refreshSec:o.v}))} /> {o.l}
                </label>
              ))}
            </div>
            <div style={S.note('info')}>現在：<b>{form.refreshSec === '0' ? '自動更新なし' : `${form.refreshSec}秒ごとに自動更新`}</b></div>
          </FormRow>
        </tbody>
      </table>
      <div style={S.btnRow}>
        <Btn v="gray" onClick={() => setForm({
          storeName: settings['店舗名']||'', storeEmail: settings['店舗メール']||'',
          closedDays: (settings['定休曜日']||'日').split(',').map(d=>d.trim()).filter(Boolean),
          closedDates: settings['定休日（任意）']||'',
          openStart: settings['営業開始時刻']||'09:00', openEnd: settings['営業終了時刻']||'18:00',
          breaks: parseBreaks(settings['休憩時間']),
          unitMin: String(settings['施術単位（分）']||'30'), refreshSec: String(settings['自動更新間隔（秒）']||'30'),
        })}>キャンセル</Btn>
        <Btn v="primary" style={{ marginLeft: 'auto' }} onClick={handleSave}>確定</Btn>
      </div>
      {saved && <div style={S.note('success')}>✅ 設定を保存しました</div>}
    </div>
  );
}

// ============================================================
// メニュー管理画面
// ============================================================
function MenuScreen({ menuList, onRefresh }) {
  const [showAdd, setShowAdd] = useState(false);
  const [newMenu, setNewMenu] = useState({ name: '', durationMin: '30' });
  const [saved, setSaved] = useState('');

  return (
    <div>
      <div style={S.pageHeader}><h2 style={S.pageTitle}>メニュー管理</h2></div>
      <table style={{ ...S.gridTbl, maxWidth: 400 }}>
        <thead><tr><th style={S.th}>メニュー名</th><th style={S.th}>所要時間</th></tr></thead>
        <tbody>
          {menuList.map(m => <tr key={m.menuId}><td style={S.td}>{m.name}</td><td style={S.td}>{m.durationMin}分</td></tr>)}
        </tbody>
      </table>
      <div style={S.btnRow}>
        <Btn v="primary" onClick={() => setShowAdd(true)}>メニューを追加</Btn>
        <Btn v="danger" onClick={() => alert('メニューの削除はGoogle Sheetsの「メニュー」シートから直接削除してください。')}>メニューを削除</Btn>
      </div>
      {saved && <div style={S.note('success')}>✅ {saved}</div>}

      {showAdd && (
        <Modal title="メニューを追加" onClose={() => setShowAdd(false)}>
          <table style={S.formTbl}>
            <tbody>
              <FormRow label="メニュー名" required><input style={S.input} type="text" placeholder="例：深部組織マッサージ" value={newMenu.name} onChange={e => setNewMenu(p=>({...p,name:e.target.value}))} /></FormRow>
              <FormRow label="所要時間（分）" required><input style={S.input} type="number" min="15" step="15" value={newMenu.durationMin} onChange={e => setNewMenu(p=>({...p,durationMin:e.target.value}))} /></FormRow>
            </tbody>
          </table>
          <div style={S.note('info')}>追加後はGoogle Sheetsの「メニュー」シートにも反映されます。</div>
          <div style={S.btnRow}>
            <Btn v="gray" onClick={() => setShowAdd(false)}>キャンセル</Btn>
            <Btn v="primary" style={{ marginLeft: 'auto' }} onClick={() => {
              if (!newMenu.name) return alert('メニュー名を入力してください');
              setSaved(`「${newMenu.name}」を追加しました（Google Sheetsの「メニュー」シートにも追加してください）`);
              setShowAdd(false);
              setNewMenu({ name: '', durationMin: '30' });
            }}>追加する</Btn>
          </div>
        </Modal>
      )}
    </div>
  );
}

// ============================================================
// 利用者管理画面
// ============================================================
function UsersScreen() {
  const [users, setUsers] = useState([]);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(true);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    const res = await apiGet({ action: 'getUserList', query });
    if (res.success) setUsers(res.data.users);
    setLoading(false);
  }, [query]);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  return (
    <div>
      <div style={S.pageHeader}>
        <h2 style={S.pageTitle}>利用者管理</h2>
        <input style={{ ...S.input, width: 220 }} type="text" placeholder="氏名・メール・電話で検索" value={query} onChange={e => setQuery(e.target.value)} onKeyDown={e => e.key === 'Enter' && fetchUsers()} />
        <Btn v="primary" onClick={fetchUsers}>検索</Btn>
      </div>
      {loading ? <p>読み込み中...</p> : (
        <table style={S.gridTbl}>
          <thead>
            <tr>{['氏名','ふりがな','電話番号','E-Mail','LINE','登録日'].map(h => <th key={h} style={S.th}>{h}</th>)}</tr>
          </thead>
          <tbody>
            {users.length === 0 ? (
              <tr><td colSpan={6} style={{ ...S.td, textAlign: 'center', color: C.muted }}>利用者が見つかりません</td></tr>
            ) : users.map(u => (
              <tr key={u.userId}>
                <td style={S.td}>{u.name}</td>
                <td style={S.td}>{u.nameKana}</td>
                <td style={S.td}>{fmtPhone(u.phone)}</td>
                <td style={S.td}>{u.email}</td>
                <td style={S.td}>{u.lineUserId ? <span style={S.badge('green')}>連携済</span> : <span style={S.badge('gray')}>未連携</span>}</td>
                <td style={S.td}>{fmtDate(u.createdAt)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

// ============================================================
// メインコンポーネント
// ============================================================
export default function AdminDashboard() {
  const [isLoggedIn, setIsLoggedIn]   = useState(false);
  const [currentPage, setCurrentPage] = useState('booking');
  const [viewMode, setViewMode]       = useState('month');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [bookings, setBookings]       = useState([]);
  const [staffList, setStaffList]     = useState([]);
  const [menuList, setMenuList]       = useState([]);
  const [settings, setSettings]       = useState({});
  const [countdown, setCountdown]     = useState(30);
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [newBookingInfo, setNewBookingInfo]   = useState(null);
  const [loading, setLoading]         = useState(false);

  const fetchBookings = useCallback(async () => {
    setLoading(true);
    const year = currentDate.getFullYear(), month = currentDate.getMonth() + 1;
    const res = await apiGet({ action: 'getBookings', year, month });
    if (res.success) setBookings(res.data.bookings);
    setLoading(false);
  }, [currentDate]);

  useEffect(() => {
    if (!isLoggedIn) return;
    Promise.all([
      apiGet({ action: 'getStaff' }).then(r => r.success && setStaffList(r.data.staff)),
      apiGet({ action: 'getMenus' }).then(r => r.success && setMenuList(r.data.menus)),
      apiGet({ action: 'getSettings' }).then(r => r.success && setSettings(r.data.settings)),
    ]);
  }, [isLoggedIn]);

  useEffect(() => {
    if (!isLoggedIn) return;
    fetchBookings();
    const refreshSec = parseInt(settings['自動更新間隔（秒）'] || '30') || 30;
    let sec = refreshSec;
    setCountdown(sec);
    const timer = setInterval(() => {
      sec--;
      setCountdown(sec);
      if (sec <= 0) { fetchBookings(); sec = refreshSec; setCountdown(sec); }
    }, 1000);
    return () => clearInterval(timer);
  }, [isLoggedIn, currentDate, settings, fetchBookings]);

  const handleCancelBooking = async (bookingId) => {
    await apiPost({ action: 'cancelBooking', bookingId });
    fetchBookings();
  };
  const handleUpdateBooking = async (bookingId, updates) => {
    await apiPost({ action: 'updateBooking', bookingId, ...updates });
    fetchBookings();
  };
  const handleSaveSettings = async (updates) => {
    await apiPost({ action: 'updateSettings', settings: updates });
    setSettings(prev => ({ ...prev, ...updates }));
  };

  if (!isLoggedIn) return <LoginScreen onLogin={() => setIsLoggedIn(true)} />;

  const renderContent = () => {
    switch (currentPage) {
      case 'booking':
        return (
          <div>
            <RefreshBar countdown={countdown} onManualRefresh={fetchBookings} />
            <div style={S.pageHeader}>
              <h2 style={S.pageTitle}>予約管理</h2>
              <div style={{ marginLeft: 'auto', display: 'flex', gap: 6 }}>
                <Btn v={viewMode === 'day' ? 'primary' : 'outline'} onClick={() => setViewMode('day')} style={{ fontSize: 11, padding: '4px 10px' }}>日</Btn>
                <Btn v={viewMode === 'month' ? 'primary' : 'outline'} onClick={() => setViewMode('month')} style={{ fontSize: 11, padding: '4px 10px' }}>月</Btn>
              </div>
            </div>
            {loading ? <p>読み込み中...</p> : viewMode === 'month' ? (
              <CalMonth bookings={bookings} menuList={menuList} currentDate={currentDate}
                onChangeDate={setCurrentDate} onSelectDay={d => { setCurrentDate(d); setViewMode('day'); }} />
            ) : (
              <CalDay bookings={bookings} staffList={staffList} menuList={menuList} currentDate={currentDate}
                onChangeDate={setCurrentDate} onSelectBooking={setSelectedBooking}
                onSelectEmpty={(date, slot, staffId) => setNewBookingInfo({ date, slot, staffId })} />
            )}
            <div style={S.btnRow}><Btn v="primary" onClick={() => setNewBookingInfo({})}>新規予約</Btn></div>
          </div>
        );
      case 'staff':   return <StaffScreen staffList={staffList} menuList={menuList} bookings={bookings} onRefreshStaff={() => apiGet({ action: 'getStaff' }).then(r => r.success && setStaffList(r.data.staff))} />;
      case 'store':   return <StoreScreen settings={settings} onSave={handleSaveSettings} />;
      case 'menu':    return <MenuScreen menuList={menuList} onRefresh={() => apiGet({ action: 'getMenus' }).then(r => r.success && setMenuList(r.data.menus))} />;
      case 'message': return <div style={S.pageHeader}><h2 style={S.pageTitle}>メッセージ管理</h2></div>;
      case 'users':   return <UsersScreen />;
      case 'inquiry': return <div style={S.pageHeader}><h2 style={S.pageTitle}>問い合わせ</h2></div>;
      default: return null;
    }
  };

  return (
    <div style={S.app}>
      <div style={S.layout}>
        <SideNav current={currentPage} onChange={setCurrentPage} onLogout={() => setIsLoggedIn(false)} />
        <main style={S.main}>{renderContent()}</main>
      </div>

      {selectedBooking && (
        <BookingDetailModal booking={selectedBooking} staffList={staffList} menuList={menuList}
          onClose={() => setSelectedBooking(null)} onCancel={handleCancelBooking} onUpdate={handleUpdateBooking} />
      )}
      {newBookingInfo && (
        <NewBookingModal defaultDate={newBookingInfo.date} defaultSlot={newBookingInfo.slot}
          defaultStaffId={newBookingInfo.staffId} staffList={staffList} menuList={menuList}
          onClose={() => setNewBookingInfo(null)} onSave={fetchBookings} />
      )}
    </div>
  );
}
