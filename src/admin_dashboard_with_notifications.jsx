// ============================================================
// admin_dashboard_with_notifications.jsx
// 管理者ダッシュボード（予約管理・施術者・店舗・メニュー等）
// ============================================================
import React, { useState, useEffect, useCallback } from 'react';

// ============================================================
// 定数・設定
// ============================================================
const GAS_URL = import.meta.env.VITE_GAS_URL || '';

// サイドナビメニュー定義
const NAV_ITEMS = [
  { key: 'booking',   label: '予約管理画面' },
  { key: 'staff',     label: '施術者管理画面' },
  { key: 'store',     label: '店舗管理画面' },
  { key: 'menu',      label: 'メニュー管理画面' },
  { key: 'message',   label: 'メッセージ管理画面' },
  { key: 'users',     label: '利用者管理画面' },
  { key: 'inquiry',   label: '問い合わせ' },
];

// ============================================================
// APIクライアント
// ============================================================

/**
 * GASバックエンドにGETリクエストを送る
 */
async function apiGet(params) {
  const url = new URL(GAS_URL);
  Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));
  const res = await fetch(url.toString());
  return res.json();
}

/**
 * GASバックエンドにPOSTリクエストを送る
 */
async function apiPost(body) {
  const res = await fetch(GAS_URL, {
    method: 'POST',
    body: JSON.stringify(body),
  });
  return res.json();
}

// ============================================================
// スタイル定数（UIイメージv3に準拠）
// ============================================================
const COLORS = {
  primary: '#1a4f8a',
  primaryLight: '#2563b0',
  primaryPale: '#dbeafe',
  accent: '#0ea5e9',
  danger: '#dc2626',
  warning: '#f59e0b',
  success: '#059669',
  bg: '#f0f4f8',
  surface: '#ffffff',
  border: '#cbd5e1',
  text: '#1e293b',
  textMuted: '#64748b',
};

const styles = {
  app: { fontFamily: "'Noto Sans JP', sans-serif", background: COLORS.bg, minHeight: '100vh', fontSize: 13 },
  // --- ログイン画面 ---
  loginWrap: { display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', background: 'linear-gradient(135deg, #1a4f8a 0%, #0ea5e9 100%)' },
  loginCard: { background: '#fff', borderRadius: 12, padding: '40px 48px', boxShadow: '0 20px 60px rgba(0,0,0,.2)', minWidth: 360 },
  loginTitle: { fontSize: 20, color: COLORS.primary, fontWeight: 700, marginBottom: 24, textAlign: 'center' },
  loginField: { marginBottom: 14 },
  loginLabel: { display: 'block', fontSize: 12, fontWeight: 600, marginBottom: 4, color: COLORS.textMuted },
  loginInput: { width: '100%', border: `1.5px solid ${COLORS.border}`, borderRadius: 6, padding: '9px 12px', fontFamily: 'inherit', fontSize: 13, boxSizing: 'border-box' },
  // --- レイアウト ---
  layout: { display: 'flex', minHeight: '100vh' },
  sidenav: { width: 184, background: COLORS.surface, borderRight: `1px solid ${COLORS.border}`, flexShrink: 0, display: 'flex', flexDirection: 'column', padding: '16px 0', position: 'sticky', top: 0, height: '100vh' },
  navLink: (active) => ({ display: 'block', padding: '9px 18px', color: active ? '#fff' : COLORS.text, background: active ? COLORS.primary : 'transparent', textDecoration: 'none', fontSize: 12.5, cursor: 'pointer', transition: 'background .15s', fontWeight: active ? 700 : 400 }),
  navLogout: { display: 'block', padding: '9px 18px', color: COLORS.danger, marginTop: 'auto', cursor: 'pointer', fontSize: 12.5 },
  main: { flex: 1, padding: '20px 24px', overflowX: 'auto', background: COLORS.bg },
  pageHeader: { display: 'flex', alignItems: 'center', gap: 12, marginBottom: 18 },
  pageTitle: { fontSize: 16, fontWeight: 700, color: COLORS.primary },
  // --- リフレッシュバー ---
  refreshBar: { display: 'flex', alignItems: 'center', gap: 8, padding: '6px 12px', background: COLORS.surface, borderBottom: `1px solid ${COLORS.border}`, fontSize: 11.5, marginBottom: 12 },
  // --- ボタン ---
  btn: (variant) => {
    const base = { display: 'inline-flex', alignItems: 'center', gap: 4, padding: '6px 16px', border: 'none', borderRadius: 6, fontFamily: 'inherit', fontSize: 12.5, fontWeight: 500, cursor: 'pointer' };
    const variants = {
      primary: { background: COLORS.primary, color: '#fff' },
      accent:  { background: COLORS.accent, color: '#fff' },
      success: { background: COLORS.success, color: '#fff' },
      outline: { background: '#fff', color: COLORS.primary, border: `1.5px solid ${COLORS.primary}` },
      danger:  { background: COLORS.danger, color: '#fff' },
      gray:    { background: '#e2e8f0', color: COLORS.text },
    };
    return { ...base, ...(variants[variant] || variants.primary) };
  },
  btnRow: { display: 'flex', gap: 8, marginTop: 16, flexWrap: 'wrap' },
  // --- テーブル ---
  gridTbl: { width: '100%', borderCollapse: 'collapse', background: COLORS.surface, boxShadow: '0 2px 8px rgba(0,0,0,.10)', borderRadius: 6, overflow: 'hidden' },
  gridTh: { background: COLORS.primary, color: '#fff', padding: '8px 12px', fontSize: 12.5, fontWeight: 500, textAlign: 'center', border: `1px solid ${COLORS.border}` },
  gridTd: { border: `1px solid ${COLORS.border}`, padding: '8px 12px', fontSize: 12.5 },
  formTbl: { width: '100%', borderCollapse: 'collapse', background: COLORS.surface, borderRadius: 6, overflow: 'hidden', boxShadow: '0 2px 8px rgba(0,0,0,.10)' },
  formTh: { background: '#f1f5f9', fontWeight: 600, width: 180, color: COLORS.text, border: `1px solid ${COLORS.border}`, padding: '9px 12px', fontSize: 12.5, textAlign: 'left' },
  formTd: { color: COLORS.textMuted, border: `1px solid ${COLORS.border}`, padding: '9px 12px', fontSize: 12.5 },
  formInput: { width: '100%', border: `1.5px solid ${COLORS.border}`, borderRadius: 4, padding: '5px 8px', fontFamily: 'inherit', fontSize: 12.5, color: COLORS.text, background: '#f8fafc', boxSizing: 'border-box' },
  // --- カレンダー ---
  calTable: { width: '100%', borderCollapse: 'collapse', tableLayout: 'fixed' },
  calTh: (type) => ({ background: type === 'sun' ? '#b91c1c' : type === 'sat' ? '#1d4ed8' : COLORS.primary, color: '#fff', padding: '6px 4px', textAlign: 'center', fontSize: 12, fontWeight: 500 }),
  calTd: (type) => ({ border: `1px solid ${COLORS.border}`, verticalAlign: 'top', height: 80, padding: 4, background: type === 'holiday' ? '#fef2f2' : type === 'sat' ? '#eff6ff' : COLORS.surface, cursor: 'pointer' }),
  calEvent: { fontSize: 10.5, background: COLORS.primaryPale, color: COLORS.primary, borderRadius: 3, padding: '1px 4px', marginTop: 2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' },
  // --- 日ビュー ---
  dayTh: (isTime) => ({ background: isTime ? '#374151' : COLORS.primary, color: '#fff', padding: '7px 10px', textAlign: 'center', fontSize: 12.5, fontWeight: 500, border: `1px solid ${COLORS.border}`, width: isTime ? 72 : 'auto' }),
  dayTd: (type) => {
    const base = { border: `1px solid ${COLORS.border}`, padding: '4px 6px', height: 38, verticalAlign: 'top' };
    const types = {
      time:   { ...base, background: '#f8fafc', fontSize: 11.5, color: COLORS.textMuted, textAlign: 'center', fontFamily: 'monospace' },
      break:  { ...base, background: '#fef3c7' },
      off:    { ...base, background: '#f1f5f9' },
      booked: { ...base, background: COLORS.primaryPale, cursor: 'pointer' },
      empty:  { ...base, cursor: 'pointer' },
    };
    return types[type] || base;
  },
  // --- カード ---
  card: { background: COLORS.surface, borderRadius: 6, boxShadow: '0 2px 8px rgba(0,0,0,.10)', padding: '16px 20px', marginBottom: 16 },
  sectionTitle: { fontSize: 14, fontWeight: 700, color: COLORS.primary, marginBottom: 12, paddingBottom: 6, borderBottom: `2px solid ${COLORS.primaryPale}` },
  // --- バッジ ---
  badge: (color) => {
    const badges = {
      blue:   { background: COLORS.primaryPale, color: COLORS.primary },
      green:  { background: '#d1fae5', color: '#065f46' },
      orange: { background: '#fef3c7', color: '#92400e' },
      gray:   { background: '#e2e8f0', color: '#475569' },
    };
    return { display: 'inline-block', padding: '2px 8px', borderRadius: 20, fontSize: 10.5, fontWeight: 700, ...(badges[color] || badges.gray) };
  },
  // --- モーダル ---
  modalOverlay: { position: 'fixed', inset: 0, background: 'rgba(0,0,0,.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 },
  modalCard: { background: '#fff', borderRadius: 8, padding: 24, minWidth: 400, maxWidth: 560, width: '90%', boxShadow: '0 20px 60px rgba(0,0,0,.3)' },
  modalTitle: { fontSize: 15, fontWeight: 700, color: COLORS.primary, marginBottom: 16 },
  // --- ノート ---
  note: (type) => {
    const notes = {
      warn:    { background: '#fef9c3', borderLeft: `4px solid ${COLORS.warning}`, color: '#78350f' },
      info:    { background: '#eff6ff', borderLeft: `4px solid ${COLORS.primary}`, color: COLORS.primary },
      success: { background: '#f0fdf4', borderLeft: `4px solid ${COLORS.success}`, color: '#065f46' },
    };
    return { padding: '8px 12px', borderRadius: '0 4px 4px 0', fontSize: 11.5, marginTop: 10, ...(notes[type] || notes.info) };
  },
  // --- ダッシュカード ---
  dashGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 12, marginBottom: 20 },
  dashCard: (color) => ({ background: COLORS.surface, borderRadius: 6, boxShadow: '0 2px 8px rgba(0,0,0,.10)', padding: '14px 16px', borderTop: `3px solid ${color || COLORS.primary}` }),
};

// ============================================================
// 共通コンポーネント
// ============================================================

/** サイドナビゲーション */
function SideNav({ current, onChange, onLogout }) {
  return (
    <nav style={styles.sidenav}>
      {NAV_ITEMS.map(item => (
        <a key={item.key} style={styles.navLink(current === item.key)} onClick={() => onChange(item.key)}>
          {item.label}
        </a>
      ))}
      <a style={styles.navLogout} onClick={onLogout}>ログアウト</a>
    </nav>
  );
}

/** 自動更新バー */
function RefreshBar({ countdown, interval, onManualRefresh }) {
  return (
    <div style={styles.refreshBar}>
      <span style={{ background: '#d1fae5', color: '#065f46', padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 700 }}>
        ● 自動更新中
      </span>
      <span style={{ color: COLORS.textMuted, fontSize: 11 }}>
        次の更新まで <b>{countdown}</b>秒
      </span>
      <button style={styles.btn('gray')} onClick={onManualRefresh}>⟳ 手動更新</button>
    </div>
  );
}

/** 汎用ボタン */
function Btn({ variant = 'primary', onClick, children, style }) {
  return <button style={{ ...styles.btn(variant), ...style }} onClick={onClick}>{children}</button>;
}

/** モーダル */
function Modal({ title, children, onClose }) {
  return (
    <div style={styles.modalOverlay} onClick={onClose}>
      <div style={styles.modalCard} onClick={e => e.stopPropagation()}>
        <div style={styles.modalTitle}>{title}</div>
        {children}
      </div>
    </div>
  );
}

/** フォーム入力行 */
function FormRow({ label, required, children }) {
  return (
    <tr>
      <th style={styles.formTh}>
        {label}{required && <span style={{ color: COLORS.danger, fontSize: 11, marginLeft: 4 }}>*</span>}
      </th>
      <td style={styles.formTd}>{children}</td>
    </tr>
  );
}

// ============================================================
// 管理者ログイン画面
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
      if (res.success) {
        onLogin();
      } else {
        setError(res.error?.message || 'ログインに失敗しました');
      }
    } catch {
      setError('通信エラーが発生しました');
    }
    setLoading(false);
  };

  return (
    <div style={styles.loginWrap}>
      <div style={styles.loginCard}>
        <h2 style={styles.loginTitle}>🏥 予約システム</h2>
        <div style={styles.loginField}>
          <label style={styles.loginLabel}>ログインID（E-Mail）</label>
          <input style={styles.loginInput} type="email" placeholder="〇〇〇@yokohama-isen.ac.jp" />
        </div>
        <div style={styles.loginField}>
          <label style={styles.loginLabel}>パスワード</label>
          <input style={styles.loginInput} type="password" placeholder="パスワードを入力"
            value={password} onChange={e => setPassword(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleLogin()} />
        </div>
        {error && <p style={{ color: COLORS.danger, fontSize: 12, marginTop: 8 }}>{error}</p>}
        <div style={{ marginTop: 20, display: 'flex', gap: 10 }}>
          <Btn variant="gray" style={{ flex: 1 }} onClick={() => setPassword('')}>キャンセル</Btn>
          <Btn variant="primary" style={{ flex: 1 }} onClick={handleLogin}>{loading ? '確認中...' : 'ログイン'}</Btn>
        </div>
      </div>
    </div>
  );
}

// ============================================================
// 予約管理：月カレンダー
// ============================================================
function BookingCalendarMonth({ bookings, menuList, currentDate, onChangeDate, onSelectDay }) {
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const DAY_NAMES = ['日', '月', '火', '水', '木', '金', '土'];
  const today = new Date();

  // 日付ごとに予約をグループ化
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
    for (let i = 0; i < 7; i++, day++) {
      week.push(day > 0 && day <= daysInMonth ? day : null);
    }
    weeks.push(week);
  }

  const pad = n => String(n).padStart(2, '0');
  const isToday = d => d && year === today.getFullYear() && month === today.getMonth() && d === today.getDate();

  return (
    <div>
      {/* カレンダーナビ */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
        <button style={styles.btn('primary')} onClick={() => onChangeDate(new Date())}>今月</button>
        <button style={{ background: 'none', border: `1.5px solid ${COLORS.border}`, borderRadius: 4, padding: '3px 10px', cursor: 'pointer', fontSize: 14 }}
          onClick={() => onChangeDate(new Date(year, month - 1, 1))}>≪</button>
        <span style={{ fontSize: 15, fontWeight: 700, minWidth: 110, textAlign: 'center' }}>
          {year}年{month + 1}月
        </span>
        <button style={{ background: 'none', border: `1.5px solid ${COLORS.border}`, borderRadius: 4, padding: '3px 10px', cursor: 'pointer', fontSize: 14 }}
          onClick={() => onChangeDate(new Date(year, month + 1, 1))}>≫</button>
      </div>

      {/* カレンダー本体 */}
      <table style={styles.calTable}>
        <thead>
          <tr>
            {DAY_NAMES.map((d, i) => (
              <th key={d} style={styles.calTh(i === 0 ? 'sun' : i === 6 ? 'sat' : 'weekday')}>{d}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {weeks.map((week, wi) => (
            <tr key={wi}>
              {week.map((d, di) => {
                const dateStr = d ? `${year}-${pad(month + 1)}-${pad(d)}` : null;
                const dayBookings = dateStr ? (bookingMap[dateStr] || []) : [];
                const isHoliday = di === 0;
                const isSat = di === 6;
                return (
                  <td key={di}
                    style={{ ...styles.calTd(isHoliday ? 'holiday' : isSat ? 'sat' : 'normal'), outline: isToday(d) ? `2px solid ${COLORS.primary}` : 'none' }}
                    onClick={() => d && onSelectDay(new Date(year, month, d))}>
                    {d && (
                      <>
                        <div style={{ fontSize: 12, fontWeight: 700, color: isHoliday ? '#b91c1c' : isSat ? '#1d4ed8' : COLORS.textMuted }}>
                          {d}
                          {isToday(d) && <span style={{ marginLeft: 4, fontSize: 9, background: COLORS.primary, color: '#fff', borderRadius: 3, padding: '0 3px' }}>今日</span>}
                        </div>
                        {dayBookings.slice(0, 3).map((b, bi) => {
                          const mName = menuList.find(m => m.menuId === b.menuId)?.name || b.menuId;
                          return (
                            <div key={bi} style={styles.calEvent}>
                              {b.datetime?.split(' ')[1]?.substring(0, 5)} {b.userName}（{mName}）
                            </div>
                          );
                        })}
                        {dayBookings.length > 3 && (
                          <div style={{ fontSize: 10, color: COLORS.textMuted }}>+{dayBookings.length - 3}件</div>
                        )}
                      </>
                    )}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
      <div style={styles.note('info')}>💡 日毎のサマリーを表示。セルをクリックすると日単位ビューに移動。</div>
    </div>
  );
}

// ============================================================
// 予約管理：日ビュー
// ============================================================
function BookingCalendarDay({ bookings, staffList, menuList, currentDate, onChangeDate, onSelectBooking, onSelectEmpty }) {
  const DAY_NAMES = ['日', '月', '火', '水', '木', '金', '土'];
  const dayName = DAY_NAMES[currentDate.getDay()];
  const pad = n => String(n).padStart(2, '0');
  const dateStr = `${currentDate.getFullYear()}-${pad(currentDate.getMonth() + 1)}-${pad(currentDate.getDate())}`;

  // 時間スロット生成（9:00〜18:00、30分単位）
  const slots = [];
  for (let h = 9; h < 18; h++) {
    slots.push(`${pad(h)}:00`);
    slots.push(`${pad(h)}:30`);
  }

  // 予約データを日時・施術者でマッピング（時刻を必ず HH:mm 形式に正規化）
  const bookingMap = {};
  bookings.forEach(b => {
    const rawTime = b.datetime?.split(' ')[1]?.substring(0, 5) || '';
    // "9:30" → "09:30" に正規化
    const time = rawTime.includes(':') && rawTime.indexOf(':') < 2
      ? rawTime.padStart(5, '0')
      : rawTime;
    const key = `${time}__${b.staffId}`;
    bookingMap[key] = b;
  });

  const isBreak = (slot) => slot >= '12:00' && slot < '13:00';

  return (
    <div>
      {/* 日ビューナビ */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
        <button style={styles.btn('primary')} onClick={() => onChangeDate(new Date())}>今日</button>
        <button style={{ background: 'none', border: `1.5px solid ${COLORS.border}`, borderRadius: 4, padding: '3px 10px', cursor: 'pointer', fontSize: 14 }}
          onClick={() => { const d = new Date(currentDate); d.setDate(d.getDate() - 1); onChangeDate(d); }}>≪</button>
        <span style={{ fontSize: 15, fontWeight: 700, minWidth: 150, textAlign: 'center' }}>
          {currentDate.getMonth() + 1}月{currentDate.getDate()}日（{dayName}）
        </span>
        <button style={{ background: 'none', border: `1.5px solid ${COLORS.border}`, borderRadius: 4, padding: '3px 10px', cursor: 'pointer', fontSize: 14 }}
          onClick={() => { const d = new Date(currentDate); d.setDate(d.getDate() + 1); onChangeDate(d); }}>≫</button>
      </div>

      <div style={styles.note('info')}>💡 利用者名クリック→予約詳細。空欄クリック→新規予約。橙＝昼休憩。</div>

      <table style={{ ...styles.calTable, marginTop: 10 }}>
        <thead>
          <tr>
            <th style={styles.dayTh(true)}>時間</th>
            {staffList.map(s => (
              <th key={s.staffId} style={styles.dayTh(false)}>{s.name}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {slots.map(slot => {
            const inBreak = isBreak(slot);
            return (
              <tr key={slot}>
                <td style={styles.dayTd('time')}>{slot}</td>
                {staffList.map(s => {
                  const key = `${slot}__${s.staffId}`;
                  const booking = bookingMap[key];
                  if (inBreak) {
                    return <td key={s.staffId} style={styles.dayTd('break')}>
                      {slot === '12:00' && <span style={{ fontSize: 11, color: '#92400e' }}>🌙 昼休憩</span>}
                    </td>;
                  }
                  if (booking) {
                    // menuIdからメニュー名、staffIdから施術者名を取得して表示
                    const menuName  = menuList.find(m => m.menuId === booking.menuId)?.name || booking.menuId;
                    return (
                      <td key={s.staffId} style={styles.dayTd('booked')} onClick={() => onSelectBooking(booking)}>
                        <div style={{ fontSize: 10.5, color: COLORS.primary, fontWeight: 500, lineHeight: 1.4 }}>
                          {menuName} / {booking.userName}
                        </div>
                      </td>
                    );
                  }
                  return (
                    <td key={s.staffId} style={styles.dayTd('empty')}
                      onClick={() => onSelectEmpty(dateStr, slot, s.staffId)} />
                  );
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
function BookingDetailModal({ booking, menuList, staffList, onClose, onCancel, onUpdate }) {
  const [note, setNote] = useState(booking.note || '');
  const [loading, setLoading] = useState(false);

  const staffName = staffList.find(s => s.staffId === booking.staffId)?.name || booking.staffId;
  const menuName  = menuList.find(m => m.menuId === booking.menuId)?.name || booking.menuId;

  const handleCancel = async () => {
    if (!window.confirm('この予約をキャンセルしますか？')) return;
    setLoading(true);
    await onCancel(booking.bookingId);
    setLoading(false);
    onClose();
  };

  const handleUpdate = async () => {
    setLoading(true);
    await onUpdate(booking.bookingId, { note });
    setLoading(false);
    onClose();
  };

  return (
    <Modal title="📋 予約詳細" onClose={onClose}>
      <table style={styles.formTbl}>
        <tbody>
          <FormRow label="予約ID">{booking.bookingId}</FormRow>
          <FormRow label="日時">{booking.datetime}</FormRow>
          <FormRow label="顧客名">{booking.userName}</FormRow>
          <FormRow label="担当施術者">{staffName}</FormRow>
          <FormRow label="コース">{menuName}</FormRow>
          <FormRow label="電話番号">{booking.userPhone || '—'}</FormRow>
          <FormRow label="E-Mail">{booking.userEmail || '—'}</FormRow>
          <FormRow label="ステータス">
            <span style={styles.badge(booking.status === '確定' ? 'green' : 'gray')}>{booking.status}</span>
          </FormRow>
          <FormRow label="要望・備考">
            <textarea style={{ ...styles.formInput, height: 60 }} value={note} onChange={e => setNote(e.target.value)} />
          </FormRow>
        </tbody>
      </table>
      <div style={styles.btnRow}>
        <Btn variant="danger" onClick={handleCancel}>{loading ? '処理中...' : '予約取り消し'}</Btn>
        <Btn variant="gray" onClick={onClose}>閉じる</Btn>
        <Btn variant="primary" style={{ marginLeft: 'auto' }} onClick={handleUpdate}>保存</Btn>
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
    userName: '',
    userPhone: '',
    userEmail: '',
    note: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSave = async () => {
    if (!form.datetime || !form.staffId || !form.menuId || !form.userName) {
      setError('日時・施術者・コース・顧客名は必須です');
      return;
    }
    setLoading(true);
    const res = await apiPost({ action: 'createBooking', ...form });
    if (res.success) {
      onSave();
      onClose();
    } else {
      setError(res.error?.message || '予約登録に失敗しました');
    }
    setLoading(false);
  };

  const set = (key, val) => setForm(prev => ({ ...prev, [key]: val }));

  return (
    <Modal title="📝 新規予約" onClose={onClose}>
      {error && <p style={{ color: COLORS.danger, fontSize: 12, marginBottom: 8 }}>{error}</p>}
      <table style={styles.formTbl}>
        <tbody>
          <FormRow label="日時" required>
            <input style={styles.formInput} type="datetime-local" value={form.datetime.replace(' ', 'T')}
              onChange={e => set('datetime', e.target.value.replace('T', ' '))} />
          </FormRow>
          <FormRow label="担当施術者" required>
            <select style={styles.formInput} value={form.staffId} onChange={e => set('staffId', e.target.value)}>
              <option value="">選択してください</option>
              {staffList.map(s => <option key={s.staffId} value={s.staffId}>{s.name}</option>)}
            </select>
          </FormRow>
          <FormRow label="コース" required>
            <select style={styles.formInput} value={form.menuId} onChange={e => set('menuId', e.target.value)}>
              {menuList.map(m => <option key={m.menuId} value={m.menuId}>{m.name}（{m.durationMin}分）</option>)}
            </select>
          </FormRow>
          <FormRow label="顧客名" required>
            <input style={styles.formInput} type="text" placeholder="山田太郎" value={form.userName} onChange={e => set('userName', e.target.value)} />
          </FormRow>
          <FormRow label="電話番号">
            <input style={styles.formInput} type="tel" placeholder="09012345678" value={form.userPhone} onChange={e => set('userPhone', e.target.value)} />
          </FormRow>
          <FormRow label="E-Mail">
            <input style={styles.formInput} type="email" placeholder="yamada@example.com" value={form.userEmail} onChange={e => set('userEmail', e.target.value)} />
          </FormRow>
          <FormRow label="要望・備考">
            <textarea style={{ ...styles.formInput, height: 60 }} value={form.note} onChange={e => set('note', e.target.value)} />
          </FormRow>
        </tbody>
      </table>
      <div style={styles.btnRow}>
        <Btn variant="gray" onClick={onClose}>キャンセル</Btn>
        <Btn variant="primary" style={{ marginLeft: 'auto' }} onClick={handleSave}>{loading ? '登録中...' : '予約登録'}</Btn>
      </div>
    </Modal>
  );
}

// ============================================================
// 施術者管理画面
// ============================================================
function StaffScreen({ staffList, menuList, onRefresh }) {
  const [selectedStaff, setSelectedStaff] = useState(null);

  return (
    <div>
      <div style={styles.pageHeader}>
        <h2 style={styles.pageTitle}>施術者管理</h2>
        <span style={styles.badge('blue')}>2026年</span>
      </div>

      {/* 予約件数ダッシュボード */}
      <div style={styles.sectionTitle}>📊 今月の予約件数サマリー</div>
      <div style={styles.dashGrid}>
        {staffList.map((s, i) => {
          const colors = [COLORS.primary, COLORS.accent, COLORS.success, COLORS.warning];
          return (
            <div key={s.staffId} style={styles.dashCard(colors[i % colors.length])}>
              <div style={{ fontSize: 11.5, color: COLORS.textMuted, marginBottom: 6 }}>{s.name}</div>
              <div style={{ fontSize: 28, fontWeight: 700, color: colors[i % colors.length], fontFamily: 'monospace' }}>—</div>
              <div style={{ fontSize: 10.5, color: COLORS.textMuted, marginTop: 2 }}>件 / 今月</div>
            </div>
          );
        })}
      </div>

      {/* 施術者一覧テーブル */}
      <div style={styles.sectionTitle}>施術者一覧</div>
      <table style={styles.gridTbl}>
        <thead>
          <tr>
            <th style={styles.gridTh}></th>
            {staffList.map(s => <th key={s.staffId} style={styles.gridTh}>{s.name}</th>)}
          </tr>
        </thead>
        <tbody>
          <tr>
            <td style={{ ...styles.gridTd, fontWeight: 600 }}>勤務曜日</td>
            {staffList.map(s => <td key={s.staffId} style={styles.gridTd}>{s.workDays || '—'}</td>)}
          </tr>
          <tr>
            <td style={{ ...styles.gridTd, fontWeight: 600 }}>担当コース</td>
            {staffList.map(s => (
              <td key={s.staffId} style={styles.gridTd}>
                {(s.menus || '').split(',').filter(Boolean).map(mId => {
                  const m = menuList.find(x => x.menuId === mId.trim());
                  return m ? <span key={mId} style={{ ...styles.badge('blue'), marginRight: 4 }}>{m.name}</span> : null;
                })}
              </td>
            ))}
          </tr>
          <tr>
            <td style={styles.gridTd}></td>
            {staffList.map(s => (
              <td key={s.staffId} style={styles.gridTd}>
                <button style={{ color: COLORS.primary, textDecoration: 'underline', cursor: 'pointer', background: 'none', border: 'none', fontFamily: 'inherit', fontSize: 12.5 }}
                  onClick={() => setSelectedStaff(s)}>設定画面へ</button>
              </td>
            ))}
          </tr>
        </tbody>
      </table>
      <div style={styles.btnRow}>
        <Btn variant="primary">施術者を追加</Btn>
        <Btn variant="danger">施術者を削除</Btn>
        <Btn variant="accent">翌月のシフトへ反映</Btn>
      </div>
      <div style={styles.note('warn')}>💡「翌月のシフトへ反映」は毎月確認が必要です。</div>
    </div>
  );
}

// ============================================================
// 店舗管理画面
// ============================================================
function StoreScreen({ settings, onSave }) {
  const [form, setForm] = useState({
    storeName: settings['店舗名'] || '',
    storeEmail: settings['店舗メール'] || '',
    closedDays: settings['定休曜日'] || '日',
    unitMin: settings['施術単位（分）'] || '30',
    refreshSec: settings['自動更新間隔（秒）'] || '30',
  });
  const [saved, setSaved] = useState(false);

  const handleSave = async () => {
    await onSave({
      '店舗名': form.storeName,
      '店舗メール': form.storeEmail,
      '定休曜日': form.closedDays,
      '施術単位（分）': form.unitMin,
      '自動更新間隔（秒）': form.refreshSec,
    });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const DAY_NAMES = ['日', '月', '火', '水', '木', '金', '土'];
  const closedArr = form.closedDays.split(',').map(d => d.trim());

  const toggleDay = (day) => {
    const arr = closedArr.includes(day) ? closedArr.filter(d => d !== day) : [...closedArr, day];
    setForm(prev => ({ ...prev, closedDays: arr.join(',') }));
  };

  return (
    <div>
      <div style={styles.pageHeader}><h2 style={styles.pageTitle}>店舗管理</h2></div>
      <table style={styles.formTbl}>
        <tbody>
          <FormRow label="店舗名">
            <input style={styles.formInput} type="text" value={form.storeName} onChange={e => setForm(p => ({ ...p, storeName: e.target.value }))} />
          </FormRow>
          <FormRow label="E-Mail">
            <input style={styles.formInput} type="email" value={form.storeEmail} onChange={e => setForm(p => ({ ...p, storeEmail: e.target.value }))} />
          </FormRow>
          <FormRow label="定休日">
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12 }}>
              {DAY_NAMES.map(d => (
                <label key={d} style={{ display: 'flex', alignItems: 'center', gap: 5, cursor: 'pointer', fontSize: 12.5 }}>
                  <input type="checkbox" checked={closedArr.includes(d)} onChange={() => toggleDay(d)} /> {d}
                </label>
              ))}
            </div>
          </FormRow>
          <FormRow label="施術単位">
            <div style={{ display: 'flex', gap: 16 }}>
              {['15', '30', '60'].map(v => (
                <label key={v} style={{ display: 'flex', alignItems: 'center', gap: 5, cursor: 'pointer', fontSize: 12.5 }}>
                  <input type="radio" name="unit" checked={form.unitMin === v} onChange={() => setForm(p => ({ ...p, unitMin: v }))} /> {v}分単位
                </label>
              ))}
            </div>
          </FormRow>
          <FormRow label="予約画面 自動更新間隔">
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16 }}>
              {[{ label: '自動更新なし', val: '0' }, { label: '15秒', val: '15' }, { label: '30秒', val: '30' }, { label: '1分', val: '60' }, { label: '5分', val: '300' }].map(o => (
                <label key={o.val} style={{ display: 'flex', alignItems: 'center', gap: 5, cursor: 'pointer', fontSize: 12.5 }}>
                  <input type="radio" name="refresh" checked={form.refreshSec === o.val} onChange={() => setForm(p => ({ ...p, refreshSec: o.val }))} /> {o.label}
                </label>
              ))}
            </div>
            <div style={styles.note('info')}>現在の設定：<b>{form.refreshSec === '0' ? '自動更新なし' : `${form.refreshSec}秒ごとに自動更新`}</b></div>
          </FormRow>
        </tbody>
      </table>
      <div style={styles.btnRow}>
        <Btn variant="gray">キャンセル</Btn>
        <Btn variant="primary" style={{ marginLeft: 'auto' }} onClick={handleSave}>確定</Btn>
      </div>
      {saved && <div style={styles.note('success')}>✅ 設定を保存しました</div>}
    </div>
  );
}

// ============================================================
// メニュー管理画面
// ============================================================
function MenuScreen({ menuList, onRefresh }) {
  const [showAdd, setShowAdd] = useState(false);
  const [newMenu, setNewMenu] = useState({ name: '', durationMin: '30' });

  const handleAdd = async () => {
    if (!newMenu.name) return;
    // メニュー追加はGASのupdateSettings経由でシートに追記する想定
    setShowAdd(false);
    setNewMenu({ name: '', durationMin: '30' });
    onRefresh();
  };

  return (
    <div>
      <div style={styles.pageHeader}><h2 style={styles.pageTitle}>メニュー管理</h2></div>
      <table style={{ ...styles.gridTbl, maxWidth: 400 }}>
        <thead>
          <tr><th style={styles.gridTh}>メニュー名</th><th style={styles.gridTh}>所要時間</th></tr>
        </thead>
        <tbody>
          {menuList.map(m => (
            <tr key={m.menuId}>
              <td style={styles.gridTd}>{m.name}</td>
              <td style={styles.gridTd}>{m.durationMin}分</td>
            </tr>
          ))}
        </tbody>
      </table>
      <div style={styles.btnRow}>
        <Btn variant="primary" onClick={() => setShowAdd(true)}>メニューを追加</Btn>
        <Btn variant="danger">メニューを削除</Btn>
      </div>
      {showAdd && (
        <Modal title="メニューを追加" onClose={() => setShowAdd(false)}>
          <table style={styles.formTbl}>
            <tbody>
              <FormRow label="メニュー名" required>
                <input style={styles.formInput} type="text" placeholder="例：深部組織マッサージ" value={newMenu.name} onChange={e => setNewMenu(p => ({ ...p, name: e.target.value }))} />
              </FormRow>
              <FormRow label="所要時間（分）" required>
                <input style={styles.formInput} type="number" min="15" step="15" value={newMenu.durationMin} onChange={e => setNewMenu(p => ({ ...p, durationMin: e.target.value }))} />
              </FormRow>
            </tbody>
          </table>
          <div style={styles.btnRow}>
            <Btn variant="gray" onClick={() => setShowAdd(false)}>キャンセル</Btn>
            <Btn variant="primary" style={{ marginLeft: 'auto' }} onClick={handleAdd}>追加する</Btn>
          </div>
        </Modal>
      )}
    </div>
  );
}

// ============================================================
// リマインダー設定画面
// ============================================================
function ReminderScreen({ settings, onSave }) {
  const [enabled, setEnabled] = useState(settings['リマインド有効'] !== 'false');
  const [time, setTime] = useState(settings['リマインド送信時刻'] || '09:00');
  const [saved, setSaved] = useState(false);

  const handleSave = async () => {
    await onSave({ 'リマインド有効': String(enabled), 'リマインド送信時刻': time });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div>
      <div style={styles.pageHeader}><h2 style={styles.pageTitle}>🔔 リマインダー設定</h2></div>
      <div style={styles.card}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 0', borderBottom: `1px solid ${COLORS.border}` }}>
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 600, fontSize: 13 }}>前日リマインド（メール・LINE）</div>
            <div style={{ color: COLORS.textMuted, fontSize: 11.5 }}>予約前日に確認通知を自動送信します</div>
          </div>
          <label style={{ position: 'relative', width: 42, height: 22, flexShrink: 0 }}>
            <input type="checkbox" style={{ opacity: 0, width: 0, height: 0 }} checked={enabled} onChange={e => setEnabled(e.target.checked)} />
            <span style={{ position: 'absolute', inset: 0, background: enabled ? COLORS.success : '#cbd5e1', borderRadius: 22, cursor: 'pointer', transition: '.3s' }}>
              <span style={{ position: 'absolute', width: 16, height: 16, left: enabled ? 23 : 3, bottom: 3, background: '#fff', borderRadius: '50%', transition: '.3s' }} />
            </span>
          </label>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 0' }}>
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 600, fontSize: 13 }}>送信時刻</div>
            <div style={{ color: COLORS.textMuted, fontSize: 11.5 }}>Apps Scriptのトリガーと合わせて設定してください</div>
          </div>
          <input style={{ ...styles.formInput, width: 100 }} type="time" value={time} onChange={e => setTime(e.target.value)} />
        </div>
      </div>
      <div style={styles.note('info')}>
        自動送信にはApps Scriptの時間ベーストリガーで <b>sendDailyReminders</b> 関数を毎日実行するよう設定してください。
      </div>
      <div style={styles.btnRow}>
        <Btn variant="primary" style={{ marginLeft: 'auto' }} onClick={handleSave}>設定を保存</Btn>
      </div>
      {saved && <div style={styles.note('success')}>✅ 設定を保存しました</div>}
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
      <div style={styles.pageHeader}>
        <h2 style={styles.pageTitle}>利用者管理</h2>
        <input style={{ ...styles.formInput, width: 200 }} type="text" placeholder="氏名・メール・電話で検索"
          value={query} onChange={e => setQuery(e.target.value)} />
        <Btn variant="primary" onClick={fetchUsers}>検索</Btn>
      </div>
      {loading ? <p>読み込み中...</p> : (
        <table style={styles.gridTbl}>
          <thead>
            <tr>
              {['氏名', 'ふりがな', '電話番号', 'E-Mail', 'LINE', '登録日'].map(h => (
                <th key={h} style={styles.gridTh}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {users.length === 0 ? (
              <tr><td colSpan={6} style={{ ...styles.gridTd, textAlign: 'center', color: COLORS.textMuted }}>利用者が見つかりません</td></tr>
            ) : users.map(u => (
              <tr key={u.userId}>
                <td style={styles.gridTd}>{u.name}</td>
                <td style={styles.gridTd}>{u.nameKana}</td>
                <td style={styles.gridTd}>{u.phone || '—'}</td>
                <td style={styles.gridTd}>{u.email}</td>
                <td style={styles.gridTd}>
                  {u.lineUserId ? <span style={styles.badge('green')}>連携済</span> : <span style={styles.badge('gray')}>未連携</span>}
                </td>
                <td style={styles.gridTd}>{u.createdAt?.split(' ')[0]}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

// ============================================================
// CSVエクスポート画面
// ============================================================
function CsvExportScreen() {
  const [from, setFrom] = useState('');
  const [to, setTo]   = useState('');
  const [staffId, setStaffId] = useState('');

  const handleExport = async () => {
    const res = await apiGet({ action: 'getBookings' });
    if (!res.success) return;
    let data = res.data.bookings;
    if (from) data = data.filter(b => b.datetime >= from);
    if (to)   data = data.filter(b => b.datetime <= to + ' 23:59');

    // CSVに変換してダウンロード
    const headers = ['予約ID', '日時', '顧客名', '施術者ID', 'メニューID', '電話番号', 'メール', 'ステータス'];
    const rows = data.map(b => [b.bookingId, b.datetime, b.userName, b.staffId, b.menuId, b.userPhone, b.userEmail, b.status]);
    const csv = [headers, ...rows].map(r => r.map(v => `"${(v || '').toString().replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `予約データ_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div>
      <div style={styles.pageHeader}><h2 style={styles.pageTitle}>📥 CSVエクスポート</h2></div>
      <div style={{ ...styles.card, display: 'flex', flexWrap: 'wrap', gap: 12, alignItems: 'flex-end' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <label style={{ fontSize: 11.5, fontWeight: 600, color: COLORS.textMuted }}>開始日</label>
          <input style={styles.formInput} type="date" value={from} onChange={e => setFrom(e.target.value)} />
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <label style={{ fontSize: 11.5, fontWeight: 600, color: COLORS.textMuted }}>終了日</label>
          <input style={styles.formInput} type="date" value={to} onChange={e => setTo(e.target.value)} />
        </div>
        <Btn variant="success" onClick={handleExport}>📥 CSVダウンロード</Btn>
      </div>
      <div style={styles.note('info')}>期間を未指定の場合は全件エクスポートされます。</div>
    </div>
  );
}

// ============================================================
// メインコンポーネント
// ============================================================
export default function AdminDashboard() {
  const [isLoggedIn, setIsLoggedIn]   = useState(false);
  const [currentPage, setCurrentPage] = useState('booking');
  const [viewMode, setViewMode]       = useState('month'); // 'month' | 'day'
  const [currentDate, setCurrentDate] = useState(new Date());
  const [bookings, setBookings]       = useState([]);
  const [staffList, setStaffList]     = useState([]);
  const [menuList, setMenuList]       = useState([]);
  const [settings, setSettings]       = useState({});
  const [countdown, setCountdown]     = useState(30);
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [newBookingInfo, setNewBookingInfo]   = useState(null);
  const [loading, setLoading]         = useState(false);

  // 予約データ取得
  const fetchBookings = useCallback(async () => {
    setLoading(true);
    const year  = currentDate.getFullYear();
    const month = currentDate.getMonth() + 1;
    const res = await apiGet({ action: 'getBookings', year, month });
    if (res.success) setBookings(res.data.bookings);
    setLoading(false);
  }, [currentDate]);

  // 初期データ取得
  useEffect(() => {
    if (!isLoggedIn) return;
    Promise.all([
      apiGet({ action: 'getStaff' }).then(r => r.success && setStaffList(r.data.staff)),
      apiGet({ action: 'getMenus' }).then(r => r.success && setMenuList(r.data.menus)),
      apiGet({ action: 'getSettings' }).then(r => r.success && setSettings(r.data.settings)),
    ]);
  }, [isLoggedIn]);

  // 予約データの自動更新
  useEffect(() => {
    if (!isLoggedIn) return;
    fetchBookings();
    const refreshSec = parseInt(settings['自動更新間隔（秒）'] || '30') || 30;
    let sec = refreshSec;
    setCountdown(sec);
    const timer = setInterval(() => {
      sec--;
      setCountdown(sec);
      if (sec <= 0) {
        fetchBookings();
        sec = refreshSec;
        setCountdown(sec);
      }
    }, 1000);
    return () => clearInterval(timer);
  }, [isLoggedIn, currentDate, settings, fetchBookings]);

  // 予約キャンセル
  const handleCancelBooking = async (bookingId) => {
    await apiPost({ action: 'cancelBooking', bookingId });
    fetchBookings();
  };

  // 予約更新
  const handleUpdateBooking = async (bookingId, updates) => {
    await apiPost({ action: 'updateBooking', bookingId, ...updates });
    fetchBookings();
  };

  // 設定保存
  const handleSaveSettings = async (updates) => {
    await apiPost({ action: 'updateSettings', settings: updates });
    setSettings(prev => ({ ...prev, ...updates }));
  };

  if (!isLoggedIn) {
    return <LoginScreen onLogin={() => setIsLoggedIn(true)} />;
  }

  // ページコンテンツの切り替え
  const renderContent = () => {
    switch (currentPage) {
      case 'booking':
        return (
          <div>
            <RefreshBar countdown={countdown} onManualRefresh={fetchBookings} />
            <div style={styles.pageHeader}>
              <h2 style={styles.pageTitle}>予約管理</h2>
              <div style={{ marginLeft: 'auto', display: 'flex', gap: 6 }}>
                <Btn variant={viewMode === 'day' ? 'outline' : 'primary'} onClick={() => setViewMode('day')} style={{ fontSize: 11, padding: '4px 10px' }}>日</Btn>
                <Btn variant={viewMode === 'month' ? 'primary' : 'outline'} onClick={() => setViewMode('month')} style={{ fontSize: 11, padding: '4px 10px' }}>月</Btn>
              </div>
            </div>
            {loading ? <p>読み込み中...</p> : viewMode === 'month' ? (
              <BookingCalendarMonth
                bookings={bookings}
                menuList={menuList}
                currentDate={currentDate}
                onChangeDate={setCurrentDate}
                onSelectDay={d => { setCurrentDate(d); setViewMode('day'); }}
              />
            ) : (
              <BookingCalendarDay
                bookings={bookings}
                staffList={staffList}
                menuList={menuList}
                currentDate={currentDate}
                onChangeDate={setCurrentDate}
                onSelectBooking={setSelectedBooking}
                onSelectEmpty={(date, slot, staffId) => setNewBookingInfo({ date, slot, staffId })}
              />
            )}
            <div style={styles.btnRow}>
              <Btn variant="primary" onClick={() => setNewBookingInfo({})}>新規予約</Btn>
            </div>
          </div>
        );
      case 'staff':   return <StaffScreen staffList={staffList} menuList={menuList} onRefresh={fetchBookings} />;
      case 'store':   return <StoreScreen settings={settings} onSave={handleSaveSettings} />;
      case 'menu':    return <MenuScreen menuList={menuList} onRefresh={() => apiGet({ action: 'getMenus' }).then(r => r.success && setMenuList(r.data.menus))} />;
      case 'message': return <div style={styles.pageHeader}><h2 style={styles.pageTitle}>メッセージ管理</h2></div>;
      case 'users':   return <UsersScreen />;
      case 'inquiry': return <div style={styles.pageHeader}><h2 style={styles.pageTitle}>問い合わせ</h2></div>;
      case 'reminder': return <ReminderScreen settings={settings} onSave={handleSaveSettings} />;
      case 'csv':     return <CsvExportScreen />;
      default:        return null;
    }
  };

  return (
    <div style={styles.app}>
      <div style={styles.layout}>
        <SideNav current={currentPage} onChange={setCurrentPage} onLogout={() => setIsLoggedIn(false)} />
        <main style={styles.main}>
          {renderContent()}
        </main>
      </div>

      {/* 予約詳細モーダル */}
      {selectedBooking && (
        <BookingDetailModal
          booking={selectedBooking}
          staffList={staffList}
          menuList={menuList}
          onClose={() => setSelectedBooking(null)}
          onCancel={handleCancelBooking}
          onUpdate={handleUpdateBooking}
        />
      )}

      {/* 新規予約モーダル */}
      {newBookingInfo && (
        <NewBookingModal
          defaultDate={newBookingInfo.date}
          defaultSlot={newBookingInfo.slot}
          defaultStaffId={newBookingInfo.staffId}
          staffList={staffList}
          menuList={menuList}
          onClose={() => setNewBookingInfo(null)}
          onSave={fetchBookings}
        />
      )}
    </div>
  );
}
