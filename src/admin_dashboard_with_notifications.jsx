// ============================================================
// admin_dashboard_with_notifications.jsx
// 管理者ダッシュボード 完全修正版
// ============================================================
import React, { useState, useEffect, useCallback } from 'react';

const GAS_URL = import.meta.env.VITE_GAS_URL || '';

const NAV_ITEMS = [
  { key: 'booking',    label: '予約管理画面',    levels: ['super','admin','viewer'] },
  { key: 'staff',      label: '施術者管理画面',   levels: ['super','admin'] },
  { key: 'store',      label: '店舗管理画面',     levels: ['super','admin'] },
  { key: 'menu',       label: 'メニュー管理画面', levels: ['super','admin'] },
  { key: 'message',    label: 'メッセージ管理画面', levels: ['super','admin'] },
  { key: 'users',      label: '利用者管理画面',   levels: ['super','admin'] },
  { key: 'reminder',   label: 'リマインダー設定', levels: ['super','admin'] },
  { key: 'csv',        label: 'CSVエクスポート',  levels: ['super','admin'] },
  { key: 'shift',      label: 'シフト手動設定',   levels: ['super','admin'] },
  { key: 'admins',     label: '管理者管理',       levels: ['super'] },
  { key: 'inquiry',    label: '問い合わせ',       levels: ['super','admin','viewer'] },
];

// ============================================================
// API
// ============================================================
async function apiGet(params) {
  const url = new URL(GAS_URL);
  Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));
  const res = await fetch(url.toString(), { redirect: 'follow' });
  return res.json();
}
async function apiPost(body) {
  const res = await fetch(GAS_URL, { method: 'POST', body: JSON.stringify(body), redirect: 'follow' });
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

function SideNav({ current, onChange, onLogout, adminInfo }) {
  return (
    <nav style={S.sidenav}>
      {/* ログイン中の管理者情報 */}
      <div style={{ padding: '8px 14px 12px', borderBottom: `1px solid ${C.border}`, marginBottom: 4 }}>
        <div style={{ fontSize: 10, color: C.muted }}>ログイン中</div>
        <div style={{ fontSize: 11.5, fontWeight: 700, color: C.primary, wordBreak: 'break-all' }}>{adminInfo?.email}</div>
        <div style={{ marginTop: 3 }}>
          <span style={{ ...S.badge(adminInfo?.level === 'super' ? 'green' : adminInfo?.level === 'admin' ? 'blue' : 'gray'), fontSize: 10 }}>
            {{ super: 'スーパー管理者', admin: '管理者', viewer: '閲覧者' }[adminInfo?.level] || adminInfo?.level}
          </span>
        </div>
      </div>
      {NAV_ITEMS.filter(item => item.levels.includes(adminInfo?.level)).map(item => (
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
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [error, setError]       = useState('');
  const [loading, setLoading]   = useState(false);

  const handleLogin = async () => {
    if (!email || !password) { setError('メールアドレスとパスワードを入力してください'); return; }
    setLoading(true);
    try {
      console.log('送信データ:', { action: 'adminLogin', email, password });
      const res = await apiPost({ action: 'adminLogin', email, password });
      console.log('レスポンス:', res);
      if (res.success) {
        onLogin({ adminId: res.data.adminId, email: res.data.email, level: res.data.level });
      } else {
        setError(res.error?.message || 'ログインに失敗しました');
      }
    } catch { setError('通信エラーが発生しました'); }
    setLoading(false);
  };

  return (
    <div style={S.loginWrap}>
      <div style={S.loginCard}>
        <h2 style={{ fontSize: 20, color: C.primary, fontWeight: 700, marginBottom: 24, textAlign: 'center' }}>🏥 予約システム</h2>
        <label style={{ display: 'block', fontSize: 12, fontWeight: 600, marginBottom: 4, color: C.muted }}>メールアドレス</label>
        <input style={S.loginInput} type="email" placeholder="〇〇〇@yokohama-isen.ac.jp"
          value={email} onChange={e => setEmail(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleLogin()} />
        <label style={{ display: 'block', fontSize: 12, fontWeight: 600, marginBottom: 4, color: C.muted }}>パスワード</label>
        <input style={S.loginInput} type="password" placeholder="パスワードを入力"
          value={password} onChange={e => setPassword(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleLogin()} />
        {error && <p style={{ color: C.danger, fontSize: 12, marginBottom: 8 }}>{error}</p>}
        <div style={{ display: 'flex', gap: 10, marginTop: 8 }}>
          <Btn v="gray" style={{ flex: 1 }} onClick={() => { setEmail(''); setPassword(''); }}>クリア</Btn>
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
function CalDay({ bookings, staffList, menuList, settings, currentDate, onChangeDate, onSelectBooking, onSelectEmpty }) {
  const DAY = ['日','月','火','水','木','金','土'];
  const p = n => String(n).padStart(2, '0');
  const dateStr = `${currentDate.getFullYear()}-${p(currentDate.getMonth()+1)}-${p(currentDate.getDate())}`;
  const dayName = DAY[currentDate.getDay()];
  const [shiftMap, setShiftMap] = useState({}); // { staffId: { type, start, end } }
  // ② 表示間隔（分）のステート。デフォルトは施術単位に合わせる
  const [displayInterval, setDisplayInterval] = useState(null);

  // 当日のシフトをGoogle Sheetsから読み込む
  useEffect(() => {
    const yearMonth = `${currentDate.getFullYear()}-${p(currentDate.getMonth()+1)}`;
    const newMap = {};
    // 全施術者のシフトを並列取得
    Promise.all(staffList.map(s =>
      apiGet({ action: 'getShifts', staffId: s.staffId, yearMonth })
        .then(r => {
          if (r.success && r.data.shifts[dateStr]) {
            newMap[s.staffId] = r.data.shifts[dateStr];
          } else {
            // シフトデータがなければ勤務曜日で判定
            let sched = {};
            try { sched = JSON.parse(s.schedule || '{}'); } catch(e) {}
            if (sched[dayName] && sched[dayName].type !== 'off') {
              newMap[s.staffId] = sched[dayName];
            } else if (!s.schedule && (s.workDays||'').split(',').map(d=>d.trim()).includes(dayName)) {
              newMap[s.staffId] = { type: 'full' };
            }
          }
        })
        .catch(() => {
          // フォールバック：勤務曜日で判定
          if ((s.workDays||'').split(',').map(d=>d.trim()).includes(dayName)) {
            newMap[s.staffId] = { type: 'full' };
          }
        })
    )).then(() => setShiftMap({...newMap}));
  }, [dateStr, staffList.length]);

  // 設定から営業時間を取得
  const openStart = settings?.['午前営業'] !== 'false' ? (settings?.['午前開始'] || '09:00') : (settings?.['午後開始'] || '09:00');
  const openEnd   = settings?.['午後営業'] !== 'false' ? (settings?.['午後終了'] || '18:00') : (settings?.['午前終了'] || '18:00');
  const unitMin   = parseInt(settings?.['施術単位（分）'] || '30');
  // ② 表示間隔：ユーザーが選択した値 or 施術単位のデフォルト
  const slotMin   = displayInterval ?? unitMin;
  const breaks    = (() => { try { return JSON.parse(settings?.['休憩時間'] || '[]'); } catch { return []; } })();
  const hasBreak  = settings?.['休憩あり'] === 'true';
  const amEnabled = settings?.['午前営業'] !== 'false';
  const amStart   = settings?.['午前開始'] || '09:00';
  const amEnd     = settings?.['午前終了'] || '12:00';
  const pmEnabled = settings?.['午後営業'] !== 'false';
  const pmStart   = settings?.['午後開始'] || '13:00';
  const pmEnd     = settings?.['午後終了'] || '18:00';

  const generateRange = (startStr, endStr) => {
    const [sh, sm] = (startStr||'09:00').split(':').map(Number);
    const [eh, em] = (endStr||'18:00').split(':').map(Number);
    const result = [];
    let cur = sh * 60 + sm;
    const end = eh * 60 + em;
    while (cur < end) {
      const h = Math.floor(cur / 60), m = cur % 60;
      result.push(`${p(h)}:${p(m)}`);
      cur += slotMin; // ② slotMin（表示間隔）を使用
    }
    return result;
  };

  const slots = [
    ...(amEnabled ? generateRange(amStart, amEnd) : []),
    ...(pmEnabled ? generateRange(pmStart, pmEnd) : []),
    ...(!amEnabled && !pmEnabled ? generateRange(openStart, openEnd) : []),
  ];

  const isBreakSlot = (slot) => {
    if (!hasBreak) return false;
    return breaks.some(b => {
      const [bsh, bsm] = (b.start||'12:00').split(':').map(Number);
      const [beh, bem] = (b.end||'13:00').split(':').map(Number);
      const [sh, sm] = slot.split(':').map(Number);
      const t = sh * 60 + sm;
      return t >= bsh * 60 + bsm && t < beh * 60 + bem;
    });
  };

  // 施術者がそのスロットに勤務中か判定
  const isWorking = (staffId, slot) => {
    const shift = shiftMap[staffId];
    if (!shift || shift.type === 'off') return false;
    if (shift.type === 'am') {
      const [sh, sm] = (amStart||'09:00').split(':').map(Number);
      const [eh, em] = (amEnd||'12:00').split(':').map(Number);
      const [h, m] = slot.split(':').map(Number);
      const t = h*60+m;
      return t >= sh*60+sm && t < eh*60+em;
    }
    if (shift.type === 'pm') {
      const [sh, sm] = (pmStart||'13:00').split(':').map(Number);
      const [eh, em] = (pmEnd||'18:00').split(':').map(Number);
      const [h, m] = slot.split(':').map(Number);
      const t = h*60+m;
      return t >= sh*60+sm && t < eh*60+em;
    }
    if (shift.type === 'custom') {
      // ③ 任意設定の場合はshift.start / shift.end を参照する
      const [sh, sm] = (shift.start || '09:00').split(':').map(Number);
      const [eh, em] = (shift.end   || '18:00').split(':').map(Number);
      const [h, m] = slot.split(':').map(Number);
      const t = h*60+m;
      return t >= sh*60+sm && t < eh*60+em;
    }
    return true; // full は全スロット勤務
  };

  // 予約マップ（当日分のみ）
const bookingMap = {};
bookings
  .filter(b => b.datetime?.startsWith(dateStr))
  .forEach(b => {
    const rawTime = b.datetime?.split(' ')[1]?.substring(0, 5) || '';
    const time = rawTime.includes(':') && rawTime.indexOf(':') < 2 ? rawTime.padStart(5, '0') : rawTime;
    const key = `${time}__${b.staffId}`;
    if (!bookingMap[key]) bookingMap[key] = [];
    bookingMap[key].push(b);
  });

  // 凡例
  const legend = [
    { bg: '#fff', border: `2px solid ${C.success}`, label: '予約可能' },
    { bg: '#f1f5f9', border: `1px solid ${C.border}`, label: '休み', icon: '—' },
    { bg: C.primaryPale, border: `1px solid ${C.primary}`, label: '予約あり' },
    { bg: '#fef3c7', border: `1px solid #f59e0b`, label: '休憩時間' },
  ];

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10, flexWrap: 'wrap' }}>
        <Btn v="primary" onClick={() => onChangeDate(new Date())}>今日</Btn>
        <button style={{ background: 'none', border: `1.5px solid ${C.border}`, borderRadius: 4, padding: '3px 10px', cursor: 'pointer', fontSize: 14 }}
          onClick={() => { const d = new Date(currentDate); d.setDate(d.getDate()-1); onChangeDate(d); }}>≪</button>
        <span style={{ fontSize: 15, fontWeight: 700, minWidth: 150, textAlign: 'center' }}>
          {currentDate.getMonth()+1}月{currentDate.getDate()}日（{DAY[currentDate.getDay()]}）
        </span>
        <button style={{ background: 'none', border: `1.5px solid ${C.border}`, borderRadius: 4, padding: '3px 10px', cursor: 'pointer', fontSize: 14 }}
          onClick={() => { const d = new Date(currentDate); d.setDate(d.getDate()+1); onChangeDate(d); }}>≫</button>
        {/* ② 表示間隔切り替えボタン */}
        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 4 }}>
          <span style={{ fontSize: 11, color: C.muted, marginRight: 2 }}>表示間隔：</span>
          {[15, 30, 60, 90].map(min => (
            <button key={min}
              style={{
                padding: '3px 8px', fontSize: 11, cursor: 'pointer', borderRadius: 4,
                border: `1.5px solid ${slotMin === min ? C.primary : C.border}`,
                background: slotMin === min ? C.primary : '#fff',
                color: slotMin === min ? '#fff' : C.text,
                fontWeight: slotMin === min ? 700 : 400,
              }}
              onClick={() => setDisplayInterval(min)}
            >{min}分</button>
          ))}
        </div>
      </div>

      {/* 凡例 */}
      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 8 }}>
        {legend.map(l => (
          <div key={l.label} style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11 }}>
            <div style={{ width: 16, height: 16, borderRadius: 3, background: l.bg, border: l.border }} />
            {l.label}
          </div>
        ))}
        <span style={{ fontSize: 11, color: C.muted, marginLeft: 4 }}>💡 予約可能セルをクリックで新規予約</span>
      </div>

      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: 4, minWidth: 500 }}>
          <thead>
            <tr>
              <th style={{ background: '#374151', color: '#fff', width: 68, padding: '6px 4px', textAlign: 'center', fontSize: 12, border: `1px solid ${C.border}` }}>時間</th>
              {staffList.map(s => {
                const shift = shiftMap[s.staffId];
                const isOff = !shift || shift.type === 'off';
                const shiftLabel = shift ? ({ am:'午前', pm:'午後', full:'終日', custom:'任意', off:'休み' }[shift.type] || '') : '未設定';
                return (
                  <th key={s.staffId} style={{ background: isOff ? '#64748b' : C.primary, color: '#fff', padding: '6px 8px', textAlign: 'center', fontSize: 12, border: `1px solid ${C.border}`, minWidth: 100 }}>
                    <div style={{ fontWeight: 700 }}>{s.name}</div>
                    <div style={{ fontSize: 10, marginTop: 2, opacity: 0.85, background: isOff ? 'rgba(0,0,0,.2)' : 'rgba(255,255,255,.2)', borderRadius: 3, padding: '1px 4px', display: 'inline-block' }}>
                      {isOff ? '🔴 休み' : `🟢 ${shiftLabel}`}
                    </div>
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {slots.map(slot => {
              const inBreak = isBreakSlot(slot);
              return (
                <tr key={slot}>
                  <td style={{ background: '#f8fafc', fontSize: 11.5, color: C.muted, textAlign: 'center', fontFamily: 'monospace', border: `1px solid ${C.border}`, padding: '3px 4px', height: 40, verticalAlign: 'middle' }}>{slot}</td>
                  {staffList.map(s => {
                    const working = isWorking(s.staffId, slot);
                    const base = { border: `1px solid ${C.border}`, height: 40, padding: '3px 6px', verticalAlign: 'top', fontSize: 11, transition: 'background .1s' };

                    // 休憩スロット
                    if (inBreak) return (
                      <td key={s.staffId} style={{ ...base, background: '#fef3c7' }}>
                        {working && <span style={{ fontSize: 10, color: '#92400e' }}>🌙 休憩</span>}
                      </td>
                    );

                    // 予約あり（複数対応）
                    const bookingList = bookingMap[`${slot}__${s.staffId}`];
                    if (bookingList && bookingList.length > 0) {
                      return (
                        <td key={s.staffId} style={{ ...base, background: '#dbeafe', border: `1.5px solid ${C.primary}`, verticalAlign: 'top', padding: '2px 4px' }}>
                          {bookingList.map((booking, idx) => {
                             const mName = menuList.find(m => m.menuId === booking.menuId)?.name || booking.menuId;
                             const staffName = staffList.find(st => st.staffId === booking.staffId)?.name || '';
                             return (
                              <div key={idx} onClick={() => onSelectBooking(booking)}
                                style={{ cursor: 'pointer', borderBottom: idx < bookingList.length - 1 ? `1px solid ${C.border}` : 'none', paddingBottom: idx < bookingList.length - 1 ? 2 : 0, marginBottom: idx < bookingList.length - 1 ? 2 : 0 }}>
                                <div style={{ fontWeight: 700, color: C.primary, fontSize: 11 }}>{booking.userName}</div>
                                 <div style={{ color: '#1e40af', fontSize: 10 }}>{mName}</div>
                                <div style={{ color: C.muted, fontSize: 10 }}>
                                   {booking.staffId ? `指名：${staffName}` : '指名なし'}
                                </div>
                               </div>
                             );
                           })}
                         </td>
                        );
                     }

                    // 休み（シフトなし）
                    if (!working) return (
                      <td key={s.staffId} style={{ ...base, background: '#f1f5f9' }}>
                        <span style={{ fontSize: 12, color: '#94a3b8' }}>—</span>
                      </td>
                    );

                    // 予約可能（勤務中・空き）
                    return (
                      <td key={s.staffId}
                        style={{ ...base, background: '#fff', border: `1.5px solid ${C.success}`, cursor: 'pointer' }}
                        onClick={() => onSelectEmpty(dateStr, slot, s.staffId)}
                        onMouseEnter={e => e.currentTarget.style.background = '#f0fdf4'}
                        onMouseLeave={e => e.currentTarget.style.background = '#fff'}>
                        <span style={{ fontSize: 10, color: C.success }}>＋</span>
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
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
              <option value="">指名なし（空き優先）</option>
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
          if (!form.datetime || !form.menuId || !form.userName) { setError('必須項目を入力してください'); return; }
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
function StaffScreen({ staffList, menuList, bookings, settings, onRefreshStaff, onShiftPage }) {
  const [editStaff, setEditStaff] = useState(null);
  const [showAdd, setShowAdd] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);

  // ① 店舗営業時間をsettingsから取得（午前/午後のプリセットに使用）
  const amStart = settings?.['午前開始'] || '09:00';
  const amEnd   = settings?.['午前終了'] || '12:00';
  const pmStart = settings?.['午後開始'] || '13:00';
  const pmEnd   = settings?.['午後終了'] || '18:00';

  // 施術者の区分選択時のプリセット（午前/午後は営業時間に連動）
  const PRESETS = {
    off:    { start: amStart, end: amEnd },
    am:     { start: amStart, end: amEnd },    // ① 午前 → 店舗の午前時間
    pm:     { start: pmStart, end: pmEnd },    // ① 午後 → 店舗の午後時間
    full:   { start: amStart, end: pmEnd },    // 終日 → 午前開始〜午後終了
    custom: { start: amStart, end: pmEnd },    // 任意 → デフォルトは終日と同じ
  };

  const initSchedule = () => {
    const s = {};
    ['日','月','火','水','木','金','土'].forEach(d => { s[d] = { type: 'off', start: amStart, end: pmEnd }; });
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
                    onClick={() => {
                      // 既存の勤務スケジュールをJSONから復元する
                      const baseSchedule = initSchedule();
                      try {
                        const parsedSched = JSON.parse(s.schedule || '{}');
                        Object.keys(parsedSched).forEach(day => { baseSchedule[day] = parsedSched[day]; });
                      } catch(e) {
                        // scheduleがない場合はworkDaysを終日でデフォルト設定
                        const days = (s.workDays||'').split(',').map(d=>d.trim()).filter(Boolean);
                        days.forEach(d => { baseSchedule[d] = { type: 'full', start: '09:00', end: '18:00' }; });
                      }
                      const schedFields = {};
                      Object.entries(baseSchedule).forEach(([day, val]) => { schedFields['schedule_' + day] = val; });
                      setEditStaff({
                        ...s,
                        workDaysArr: (s.workDays||'').split(',').map(d=>d.trim()).filter(Boolean),
                        menusArr: (s.menus||'').split(',').map(m=>m.trim()).filter(Boolean),
                        ...schedFields,
                      });
                    }}>
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
        <Btn v="accent" onClick={() => onShiftPage && onShiftPage('current')}>今月のシフトへ反映</Btn>
        <Btn v="accent" onClick={() => onShiftPage && onShiftPage('next')}>翌月のシフトへ反映</Btn>
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
                            updateSched({ type: t, ...PRESETS[t] });
                          }}>
                          <option value="off">休み</option>
                          <option value="am">午前（{amStart}〜{amEnd}）</option>
                          <option value="pm">午後（{pmStart}〜{pmEnd}）</option>
                          <option value="full">終日（{amStart}〜{pmEnd}）</option>
                          <option value="custom">任意</option>
                        </select>
                      </td>
                      <td style={{ border: `1px solid ${C.border}`, padding: '4px 6px' }}>
                        {sched.type !== 'off' && (
                          <input style={{ ...S.input, fontSize: 11.5, background: sched.type !== 'custom' ? '#f1f5f9' : '#fff' }}
                            type="time" value={sched.start}
                            disabled={sched.type !== 'custom'}
                            onChange={e => updateSched({ start: e.target.value })} />
                        )}
                      </td>
                      <td style={{ border: `1px solid ${C.border}`, padding: '4px 6px' }}>
                        {sched.type !== 'off' && (
                          <input style={{ ...S.input, fontSize: 11.5, background: sched.type !== 'custom' ? '#f1f5f9' : '#fff' }}
                            type="time" value={sched.end}
                            disabled={sched.type !== 'custom'}
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
        // ① PRESTSは共通変数（StaffScreen上部で定義済み）を使用
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
                            <option value="am">午前（{amStart}〜{amEnd}）</option>
                            <option value="pm">午後（{pmStart}〜{pmEnd}）</option>
                            <option value="full">終日（{amStart}〜{pmEnd}）</option>
                            <option value="custom">任意</option>
                          </select>
                        </td>
                        <td style={{ border:`1px solid ${C.border}`, padding:'4px 6px' }}>
                          {sched.type !== 'off' && (
                            <input style={{ ...S.input, fontSize:11.5, background: sched.type !== 'custom' ? '#f1f5f9' : '#fff' }}
                              type="time" value={sched.start}
                              disabled={sched.type !== 'custom'}
                              onChange={e => updateNewSched(day, { start:e.target.value })} />
                          )}
                        </td>
                        <td style={{ border:`1px solid ${C.border}`, padding:'4px 6px' }}>
                          {sched.type !== 'off' && (
                            <input style={{ ...S.input, fontSize:11.5, background: sched.type !== 'custom' ? '#f1f5f9' : '#fff' }}
                              type="time" value={sched.end}
                              disabled={sched.type !== 'custom'}
                              onChange={e => updateNewSched(day, { end:e.target.value })} />
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
// 定休日カレンダーコンポーネント
// ============================================================
function ClosedDateCalendar({ closedDatesSet, calDate, onChangeCalDate, onToggleDate }) {
  const year = calDate.getFullYear();
  const month = calDate.getMonth();
  const today = new Date();
  const p = n => String(n).padStart(2, '0');
  const DAY = ['日','月','火','水','木','金','土'];

  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const weeks = [];
  let day = 1 - firstDay;
  while (day <= daysInMonth) {
    const week = [];
    for (let i = 0; i < 7; i++, day++) week.push(day > 0 && day <= daysInMonth ? day : null);
    weeks.push(week);
  }

  return (
    <div>
      {/* 年月ナビゲーション */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
        <button style={{ border: `1px solid ${C.border}`, background: '#fff', borderRadius: 4, padding: '2px 8px', cursor: 'pointer' }}
          onClick={() => onChangeCalDate(new Date(year, month - 1, 1))}>≪</button>
        {/* 年選択 */}
        <select value={year} style={{ ...S.input, width: 80, fontSize: 12 }}
          onChange={e => onChangeCalDate(new Date(parseInt(e.target.value), month, 1))}>
          {[2025,2026,2027,2028].map(y => <option key={y} value={y}>{y}年</option>)}
        </select>
        {/* 月選択 */}
        <select value={month} style={{ ...S.input, width: 70, fontSize: 12 }}
          onChange={e => onChangeCalDate(new Date(year, parseInt(e.target.value), 1))}>
          {[...Array(12)].map((_, i) => <option key={i} value={i}>{i+1}月</option>)}
        </select>
        <button style={{ border: `1px solid ${C.border}`, background: '#fff', borderRadius: 4, padding: '2px 8px', cursor: 'pointer' }}
          onClick={() => onChangeCalDate(new Date(year, month + 1, 1))}>≫</button>
        <Btn v="gray" style={{ fontSize: 10, padding: '2px 8px' }}
          onClick={() => onChangeCalDate(new Date())}>今月</Btn>
      </div>

      {/* カレンダー */}
      <table style={{ borderCollapse: 'collapse', width: '100%', maxWidth: 320 }}>
        <thead>
          <tr>{DAY.map((d, i) => (
            <th key={d} style={{ fontSize: 11, padding: '3px 2px', textAlign: 'center',
              color: i === 0 ? '#b91c1c' : i === 6 ? '#1d4ed8' : C.muted }}>
              {d}
            </th>
          ))}</tr>
        </thead>
        <tbody>
          {weeks.map((week, wi) => (
            <tr key={wi}>
              {week.map((d, di) => {
                if (!d) return <td key={di} style={{ padding: 2 }} />;
                const dateStr = `${year}-${p(month+1)}-${p(d)}`;
                const isClosed = closedDatesSet.has(dateStr);
                const isToday = year === today.getFullYear() && month === today.getMonth() && d === today.getDate();
                return (
                  <td key={di} style={{ padding: 2, textAlign: 'center' }}>
                    <div
                      onClick={() => onToggleDate(dateStr)}
                      style={{
                        width: 32, height: 32, lineHeight: '32px', borderRadius: '50%',
                        fontSize: 12, cursor: 'pointer', margin: 'auto',
                        background: isClosed ? C.danger : isToday ? C.primaryPale : 'transparent',
                        color: isClosed ? '#fff' : di === 0 ? '#b91c1c' : di === 6 ? '#1d4ed8' : C.text,
                        fontWeight: isClosed || isToday ? 700 : 400,
                        border: isToday && !isClosed ? `2px solid ${C.primary}` : 'none',
                        userSelect: 'none',
                      }}>
                      {d}
                    </div>
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
      <div style={{ fontSize: 11, color: C.muted, marginTop: 6 }}>
        🔴 日付をクリックして定休日を設定・解除できます
      </div>
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

  // 定休日（任意）をSet形式で管理
  const parseClosedDates = (raw) => {
    if (!raw) return new Set();
    return new Set(raw.split(',').map(d => d.trim()).filter(Boolean));
  };

  const buildForm = (s) => ({
    storeName:      s['店舗名'] || '',
    storeEmail:     s['店舗メール'] || '',
    closedDays:     (s['定休曜日'] || '日').split(',').map(d=>d.trim()).filter(Boolean),
    closedDatesSet: parseClosedDates(s['定休日（任意）'] || ''),
    // 午前・午後の営業時間
    amEnabled:      s['午前営業'] !== 'false',
    amStart:        s['午前開始'] || '09:00',
    amEnd:          s['午前終了'] || '12:00',
    pmEnabled:      s['午後営業'] !== 'false',
    pmStart:        s['午後開始'] || '13:00',
    pmEnd:          s['午後終了'] || '18:00',
    // 互換性のため従来フィールドも保持
    openStart:      s['午前開始'] || s['営業開始時刻'] || '09:00',
    openEnd:        s['午後終了'] || s['営業終了時刻'] || '18:00',
    // 休憩
    hasBreak:       s['休憩あり'] !== 'false' && (s['休憩時間'] ? true : false),
    breaks:         parseBreaks(s['休憩時間']),
    unitMin:        String(s['施術単位（分）'] || '30'),
    slotCapacity:   String(s['同時施術人数'] || '1'), // ② 同時施術人数
    slotCapacityCustom: String(s['同時施術人数カスタム'] || '1'), // ② 任意人数
    refreshSec:     String(s['自動更新間隔（秒）'] || '30'),
  });

  const [form, setForm] = useState(() => buildForm(settings));
  const [saved, setSaved] = useState(false);
  const [calDate, setCalDate] = useState(new Date());

  // settingsがロード・更新されたらformに反映する
  useEffect(() => {
    if (settings && Object.keys(settings).length > 0) {
      setForm(buildForm(settings));
    }
  }, [settings]);

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
      '店舗名':           form.storeName,
      '店舗メール':       form.storeEmail,
      '定休曜日':         form.closedDays.join(','),
      '定休日（任意）':   [...form.closedDatesSet].sort().join(','),
      '午前営業':         String(form.amEnabled),
      '午前開始':         form.amStart,
      '午前終了':         form.amEnd,
      '午後営業':         String(form.pmEnabled),
      '午後開始':         form.pmStart,
      '午後終了':         form.pmEnd,
      // 予約スロット生成用の互換フィールド
      '営業開始時刻':     form.amEnabled ? form.amStart : form.pmStart,
      '営業終了時刻':     form.pmEnabled ? form.pmEnd : form.amEnd,
      '休憩あり':         String(form.hasBreak),
      '休憩時間':         form.hasBreak ? JSON.stringify(form.breaks) : '[]',
      '施術単位（分）':   form.unitMin,
      '同時施術人数':     form.slotCapacity === 'custom' ? form.slotCapacityCustom : form.slotCapacity, // ②
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

          {/* 定休日（カレンダー選択） */}
          <FormRow label="定休日（任意日付）">
            <ClosedDateCalendar
              closedDatesSet={form.closedDatesSet}
              calDate={calDate}
              onChangeCalDate={setCalDate}
              onToggleDate={(dateStr) => {
                const next = new Set(form.closedDatesSet);
                next.has(dateStr) ? next.delete(dateStr) : next.add(dateStr);
                setForm(p => ({ ...p, closedDatesSet: next }));
              }}
            />
            {form.closedDatesSet.size > 0 && (
              <div style={{ marginTop: 8, fontSize: 11.5, color: C.muted }}>
                選択中：{[...form.closedDatesSet].sort().join('、')}
              </div>
            )}
          </FormRow>

          {/* 営業時間 */}
          <FormRow label="営業時間">
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {/* 午前営業 */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: 5, cursor: 'pointer', fontSize: 12.5, minWidth: 60 }}>
                  <input type="checkbox" checked={form.amEnabled}
                    onChange={e => setForm(p=>({...p, amEnabled: e.target.checked}))} />
                  午前
                </label>
                <input style={{ ...S.input, width: 90 }} type="time"
                  value={form.amStart} disabled={!form.amEnabled}
                  onChange={e => setForm(p=>({...p,amStart:e.target.value}))} />
                <span style={{ fontSize: 13 }}>〜</span>
                <input style={{ ...S.input, width: 90 }} type="time"
                  value={form.amEnd} disabled={!form.amEnabled}
                  onChange={e => setForm(p=>({...p,amEnd:e.target.value}))} />
              </div>
              {/* 午後営業 */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: 5, cursor: 'pointer', fontSize: 12.5, minWidth: 60 }}>
                  <input type="checkbox" checked={form.pmEnabled}
                    onChange={e => setForm(p=>({...p, pmEnabled: e.target.checked}))} />
                  午後
                </label>
                <input style={{ ...S.input, width: 90 }} type="time"
                  value={form.pmStart} disabled={!form.pmEnabled}
                  onChange={e => setForm(p=>({...p,pmStart:e.target.value}))} />
                <span style={{ fontSize: 13 }}>〜</span>
                <input style={{ ...S.input, width: 90 }} type="time"
                  value={form.pmEnd} disabled={!form.pmEnabled}
                  onChange={e => setForm(p=>({...p,pmEnd:e.target.value}))} />
              </div>
              <div style={{ fontSize: 11, color: C.muted }}>
                ※ 予約枠：{
                  form.amEnabled && form.pmEnabled ? `${form.amStart}〜${form.amEnd}、${form.pmStart}〜${form.pmEnd}` :
                  form.amEnabled ? `${form.amStart}〜${form.amEnd}` :
                  form.pmEnabled ? `${form.pmStart}〜${form.pmEnd}` : '未設定'
                }
              </div>
            </div>
          </FormRow>

          {/* 休憩時間 */}
          <FormRow label="休憩時間">
            <div>
              <label style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', fontSize: 12.5, marginBottom: 10 }}>
                <input type="checkbox" checked={form.hasBreak}
                  onChange={e => setForm(p=>({...p, hasBreak: e.target.checked}))} />
                休憩あり
              </label>
              {form.hasBreak && (
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
                </div>
              )}
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

          {/* ② 同時施術人数（1枠あたり何人受け付けるか） */}
          <FormRow label="同時施術人数">
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16, alignItems: 'center' }}>
              {[{l:'1人',v:'1'},{l:'2人',v:'2'},{l:'3人',v:'3'},{l:'任意',v:'custom'}].map(o => (
                <label key={o.v} style={{ display: 'flex', alignItems: 'center', gap: 5, cursor: 'pointer', fontSize: 12.5 }}>
                  <input type="radio" name="capacity" checked={form.slotCapacity === o.v}
                    onChange={() => setForm(p=>({...p, slotCapacity: o.v}))} /> {o.l}
                </label>
              ))}
              {form.slotCapacity === 'custom' && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <input type="number" min="1" max="99" style={{ ...S.input, width: 70 }}
                    value={form.slotCapacityCustom}
                    onChange={e => setForm(p=>({...p, slotCapacityCustom: e.target.value}))} />
                  <span style={{ fontSize: 12.5 }}>人</span>
                </div>
              )}
            </div>
            <div style={S.note('info')}>
              現在：<b>1枠あたり {form.slotCapacity === 'custom' ? form.slotCapacityCustom : form.slotCapacity} 人まで予約可能</b>
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
          closedDatesSet: parseClosedDates(settings['定休日（任意）']||''),
          openStart: settings['営業開始時刻']||'09:00', openEnd: settings['営業終了時刻']||'18:00',
          breaks: parseBreaks(settings['休憩時間']),
          unitMin: String(settings['施術単位（分）']||'30'),
          slotCapacity: String(settings['同時施術人数']||'1'),
          slotCapacityCustom: String(settings['同時施術人数カスタム']||'1'),
          refreshSec: String(settings['自動更新間隔（秒）']||'30'),
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
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [newMenu, setNewMenu] = useState({ name: '', durationMin: '30' });
  const [saved, setSaved] = useState('');
  const [loading, setLoading] = useState(false);

  const handleAdd = async () => {
    if (!newMenu.name) { alert('メニュー名を入力してください'); return; }
    setLoading(true);
    const res = await apiPost({ action: 'addMenu', name: newMenu.name, durationMin: newMenu.durationMin });
    if (res.success) {
      setSaved(`「${newMenu.name}」を追加しました`);
      setTimeout(() => setSaved(''), 3000);
      onRefresh();
      setShowAdd(false);
      setNewMenu({ name: '', durationMin: '30' });
    } else {
      alert('追加に失敗しました: ' + (res.error?.message || ''));
    }
    setLoading(false);
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setLoading(true);
    const res = await apiPost({ action: 'deleteMenu', menuId: deleteTarget.menuId });
    if (res.success) {
      setSaved(`「${deleteTarget.name}」を削除しました`);
      setTimeout(() => setSaved(''), 3000);
      onRefresh();
    } else {
      alert('削除に失敗しました: ' + (res.error?.message || ''));
    }
    setLoading(false);
    setDeleteTarget(null);
  };

  return (
    <div>
      <div style={S.pageHeader}><h2 style={S.pageTitle}>メニュー管理</h2></div>
      <table style={{ ...S.gridTbl, maxWidth: 500 }}>
        <thead><tr><th style={S.th}>メニュー名</th><th style={S.th}>所要時間</th><th style={S.th}>操作</th></tr></thead>
        <tbody>
          {menuList.map(m => (
            <tr key={m.menuId}>
              <td style={S.td}>{m.name}</td>
              <td style={S.td}>{m.durationMin}分</td>
              <td style={S.td}>
                <Btn v="danger" style={{ fontSize: 11, padding: '3px 10px' }} onClick={() => setDeleteTarget(m)}>削除</Btn>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <div style={S.btnRow}>
        <Btn v="primary" onClick={() => setShowAdd(true)}>＋ メニューを追加</Btn>
      </div>
      {saved && <div style={S.note('success')}>✅ {saved}</div>}

      {showAdd && (
        <Modal title="メニューを追加" onClose={() => setShowAdd(false)}>
          <table style={S.formTbl}>
            <tbody>
              <FormRow label="メニュー名" required>
                <input style={S.input} type="text" placeholder="例：柔整" value={newMenu.name} onChange={e => setNewMenu(p=>({...p,name:e.target.value}))} />
              </FormRow>
              <FormRow label="メニューID">
                <input style={S.input} type="text" placeholder="自動採番（空白でOK）" value={newMenu.menuId||''} onChange={e => setNewMenu(p=>({...p,menuId:e.target.value}))} />
              </FormRow>
              <FormRow label="所要時間（分）" required>
                <input style={S.input} type="number" min="15" step="15" value={newMenu.durationMin} onChange={e => setNewMenu(p=>({...p,durationMin:e.target.value}))} />
              </FormRow>
            </tbody>
          </table>
          <div style={S.btnRow}>
            <Btn v="gray" onClick={() => setShowAdd(false)}>キャンセル</Btn>
            <Btn v="primary" style={{ marginLeft: 'auto' }} onClick={handleAdd}>{loading ? '追加中...' : '追加する'}</Btn>
          </div>
        </Modal>
      )}

      {deleteTarget && (
        <Modal title="メニューを削除" onClose={() => setDeleteTarget(null)}>
          <p style={{ fontSize: 13, marginBottom: 16 }}>
            <b>「{deleteTarget.name}」</b>を削除しますか？<br />
            <span style={{ color: C.danger, fontSize: 12 }}>この操作は元に戻せません。</span>
          </p>
          <div style={S.btnRow}>
            <Btn v="gray" onClick={() => setDeleteTarget(null)}>キャンセル</Btn>
            <Btn v="danger" style={{ marginLeft: 'auto' }} onClick={handleDelete}>{loading ? '削除中...' : '削除する'}</Btn>
          </div>
        </Modal>
      )}
    </div>
  );
}

// ============================================================
// 利用者管理画面
// ============================================================
// ============================================================
// リマインダー通知設定画面
// ============================================================
function ReminderScreen({ settings, onSave }) {
  const parseReminder = (raw) => { try { return JSON.parse(raw || '{}'); } catch { return {}; } };
  const buildForm = (s) => {
    const r = parseReminder(s['リマインダー設定'] || '{}');
    return {
      onConfirm:    r.onConfirm    !== false,
      prevDay:      r.prevDay      !== false,
      prevDayTime:  r.prevDayTime  || '18:00',
      sameDay:      r.sameDay      || false,
      sameDayTime:  r.sameDayTime  || '08:00',
      onCancel:     r.onCancel     || false,
      useLine:      r.useLine      !== false,
      useEmail:     r.useEmail     !== false,
    };
  };
  const [form, setForm] = useState(() => buildForm(settings));
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (settings && Object.keys(settings).length > 0) setForm(buildForm(settings));
  }, [settings]);

  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));
  const TIMES = [];
  for (let h = 0; h < 24; h++) { TIMES.push(`${String(h).padStart(2,'0')}:00`); }

  const items = [
    { key: 'onConfirm', label: '予約確定時に即座に通知', desc: '予約が確定されると同時にLINE / E-Mailで通知を送信します。', hasTime: false },
    { key: 'prevDay',   label: '前日リマインダー', desc: '予約日の前日、指定時刻に自動送信します。', hasTime: true, timeKey: 'prevDayTime' },
    { key: 'sameDay',   label: '当日リマインダー', desc: '予約当日の朝、指定時刻に自動送信します。', hasTime: true, timeKey: 'sameDayTime' },
    { key: 'onCancel',  label: 'キャンセル通知', desc: '予約取り消し時に利用者へ通知します。', hasTime: false },
  ];

  return (
    <div>
      <div style={S.pageHeader}>
        <h2 style={S.pageTitle}>🔔 リマインダー通知設定</h2>
        <span style={S.badge('green')}>NEW</span>
      </div>
      <div style={S.note('info')}>
        💡 予約確定後に自動でリマインダーを送信します。LINE / E-Mail の両方に対応。送信先は予約の利用者IDに紐づく連絡先が使われます。
      </div>

      {/* 送信タイミング */}
      <div style={{ ...S.card, marginTop: 16 }}>
        <div style={S.sectionTitle}>リマインダー送信タイミング</div>
        {items.map(item => (
          <div key={item.key} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 0', borderBottom: `1px solid ${C.border}` }}>
            {/* トグルスイッチ */}
            <div onClick={() => set(item.key, !form[item.key])}
              style={{ width: 44, height: 24, borderRadius: 12, background: form[item.key] ? C.success : '#cbd5e1', cursor: 'pointer', position: 'relative', flexShrink: 0, transition: 'background 0.2s' }}>
              <div style={{ position: 'absolute', top: 2, left: form[item.key] ? 22 : 2, width: 20, height: 20, borderRadius: '50%', background: '#fff', transition: 'left 0.2s' }} />
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 13, fontWeight: 600 }}>{item.label}</div>
              <div style={{ fontSize: 11.5, color: C.muted }}>{item.desc}</div>
            </div>
            {item.hasTime && (
              <select style={{ ...S.input, width: 90 }} value={form[item.timeKey]} disabled={!form[item.key]}
                onChange={e => set(item.timeKey, e.target.value)}>
                {TIMES.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            )}
            <span style={{ ...S.badge(form[item.key] ? 'green' : 'gray'), minWidth: 30, textAlign: 'center' }}>
              {form[item.key] ? '有効' : '無効'}
            </span>
          </div>
        ))}
      </div>

      {/* 通知送信方法 */}
      <div style={S.card}>
        <div style={S.sectionTitle}>通知送信方法</div>
        <div style={{ display: 'flex', gap: 24 }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', fontSize: 12.5 }}>
            <input type="checkbox" checked={form.useLine} onChange={e => set('useLine', e.target.checked)} /> LINE
          </label>
          <label style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', fontSize: 12.5 }}>
            <input type="checkbox" checked={form.useEmail} onChange={e => set('useEmail', e.target.checked)} /> E-Mail
          </label>
        </div>
        <div style={S.note('warn')}>💡 LINEまたはE-Mailが未登録の利用者には該当手段をスキップします。</div>
      </div>

      <div style={S.btnRow}>
        <Btn v="gray" onClick={() => setForm(buildForm(settings))}>キャンセル</Btn>
        <Btn v="primary" style={{ marginLeft: 'auto' }} onClick={async () => {
          await onSave({ 'リマインダー設定': JSON.stringify(form) });
          setSaved(true); setTimeout(() => setSaved(false), 3000);
        }}>保存</Btn>
      </div>
      {saved && <div style={S.note('success')}>✅ リマインダー設定を保存しました</div>}
    </div>
  );
}

// ============================================================
// CSVエクスポート画面
// ============================================================
function CsvExportScreen({ bookings, staffList, menuList }) {
  const today = new Date();
  const p = n => String(n).padStart(2,'0');
  const fmt = d => `${d.getFullYear()}-${p(d.getMonth()+1)}-${p(d.getDate())}`;
  const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);

  const [filters, setFilters] = useState({
    startDate: fmt(firstDay), endDate: fmt(today),
    staffId: '', menuId: '', status: '',
  });
  const [cols, setCols] = useState({
    datetime: true, userId: true, userName: true, menuName: true,
    staffName: true, lineUserId: false, email: false, status: true, note: false,
  });

  const setF = (k, v) => setFilters(p => ({ ...p, [k]: v }));
  const toggleCol = (k) => setCols(p => ({ ...p, [k]: !p[k] }));

  // フィルタ適用
  const filtered = bookings.filter(b => {
    const d = b.datetime?.split(' ')[0] || '';
    if (filters.startDate && d < filters.startDate) return false;
    if (filters.endDate   && d > filters.endDate)   return false;
    if (filters.staffId   && b.staffId !== filters.staffId) return false;
    if (filters.menuId    && b.menuId  !== filters.menuId)  return false;
    if (filters.status    && b.status  !== filters.status)  return false;
    return true;
  });

  const COL_DEFS = [
    { key: 'datetime',  label: '予約日時',   get: b => b.datetime || '' },
    { key: 'userId',    label: '利用者ID',   get: b => b.lineUserId || '' },
    { key: 'userName',  label: '利用者氏名', get: b => b.userName || '' },
    { key: 'menuName',  label: 'コース名',   get: b => menuList.find(m => m.menuId === b.menuId)?.name || b.menuId },
    { key: 'staffName', label: '担当施術者', get: b => staffList.find(s => s.staffId === b.staffId)?.name || b.staffId },
    { key: 'lineUserId',label: 'LINE ID',   get: b => b.lineUserId || '' },
    { key: 'email',     label: 'E-Mail',    get: b => b.userEmail || '' },
    { key: 'status',    label: 'ステータス', get: b => b.status || '' },
    { key: 'note',      label: '要望/備考', get: b => b.note || '' },
  ];

  const activeCols = COL_DEFS.filter(c => cols[c.key]);

  const downloadCsv = (encoding) => {
    const header = activeCols.map(c => c.label).join(',');
    const rows = filtered.map(b => activeCols.map(c => `"${c.get(b).toString().replace(/"/g,'""')}"`).join(','));
    const csv = [header, ...rows].join('\n');
    const bom = encoding === 'sjis' ? '\uFEFF' : '';
    const blob = new Blob([bom + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `予約データ_${filters.startDate}_${filters.endDate}.csv`;
    a.click(); URL.revokeObjectURL(url);
  };

  return (
    <div>
      <div style={S.pageHeader}><h2 style={S.pageTitle}>📊 CSVエクスポート</h2></div>

      {/* フィルタ */}
      <div style={S.card}>
        <div style={S.sectionTitle}>絞り込み条件</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(180px,1fr))', gap: 12 }}>
          <div>
            <div style={{ fontSize: 11.5, color: C.muted, marginBottom: 4 }}>開始日</div>
            <input style={S.input} type="date" value={filters.startDate} onChange={e => setF('startDate', e.target.value)} />
          </div>
          <div>
            <div style={{ fontSize: 11.5, color: C.muted, marginBottom: 4 }}>終了日</div>
            <input style={S.input} type="date" value={filters.endDate} onChange={e => setF('endDate', e.target.value)} />
          </div>
          <div>
            <div style={{ fontSize: 11.5, color: C.muted, marginBottom: 4 }}>施術者</div>
            <select style={S.input} value={filters.staffId} onChange={e => setF('staffId', e.target.value)}>
              <option value="">全員</option>
              {staffList.map(s => <option key={s.staffId} value={s.staffId}>{s.name}</option>)}
            </select>
          </div>
          <div>
            <div style={{ fontSize: 11.5, color: C.muted, marginBottom: 4 }}>コース</div>
            <select style={S.input} value={filters.menuId} onChange={e => setF('menuId', e.target.value)}>
              <option value="">全て</option>
              {menuList.map(m => <option key={m.menuId} value={m.menuId}>{m.name}</option>)}
            </select>
          </div>
          <div>
            <div style={{ fontSize: 11.5, color: C.muted, marginBottom: 4 }}>ステータス</div>
            <select style={S.input} value={filters.status} onChange={e => setF('status', e.target.value)}>
              <option value="">全て</option>
              <option value="確定">確定</option>
              <option value="キャンセル">キャンセル</option>
              <option value="保留">保留</option>
            </select>
          </div>
        </div>
      </div>

      {/* 出力項目選択 */}
      <div style={S.card}>
        <div style={S.sectionTitle}>出力項目の選択</div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12 }}>
          {COL_DEFS.map(c => (
            <label key={c.key} style={{ display: 'flex', alignItems: 'center', gap: 5, cursor: 'pointer', fontSize: 12.5 }}>
              <input type="checkbox" checked={cols[c.key]} onChange={() => toggleCol(c.key)} /> {c.label}
            </label>
          ))}
        </div>
      </div>

      {/* プレビュー */}
      <div style={S.card}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
          <div style={S.sectionTitle}>プレビュー（上位5件）</div>
          <span style={S.badge('blue')}>合計：{filtered.length}件</span>
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table style={S.gridTbl}>
            <thead><tr>{activeCols.map(c => <th key={c.key} style={S.th}>{c.label}</th>)}</tr></thead>
            <tbody>
              {filtered.slice(0, 5).map((b, i) => (
                <tr key={i}>{activeCols.map(c => (
                  <td key={c.key} style={S.td}>
                    {c.key === 'status' ? (
                      <span style={S.badge(b.status === '確定' ? 'green' : b.status === 'キャンセル' ? 'gray' : 'blue')}>{b.status}</span>
                    ) : c.get(b)}
                  </td>
                ))}</tr>
              ))}
              {filtered.length === 0 && <tr><td colSpan={activeCols.length} style={{ ...S.td, textAlign: 'center', color: C.muted }}>データがありません</td></tr>}
            </tbody>
          </table>
        </div>
      </div>

      <div style={S.btnRow}>
        <Btn v="gray" onClick={() => downloadCsv('utf8')}>UTF-8でダウンロード</Btn>
        <Btn v="primary" style={{ marginLeft: 'auto' }} onClick={() => downloadCsv('sjis')}>
          📥 CSVダウンロード（Shift-JIS / Excel対応）
        </Btn>
      </div>
      <div style={S.note('info')}>💡 文字コードはShift-JIS（Excel対応）でエクスポートします。UTF-8に切り替えも可能です。</div>
    </div>
  );
}

// ============================================================
// シフト手動設定画面
// ============================================================
function ShiftScreen({ staffList, settings, initialMode, onBack }) {
  const now = new Date();
  // initialModeに応じて初期表示月を設定
  const initDate = initialMode === 'next'
    ? new Date(now.getFullYear(), now.getMonth() + 1, 1)
    : new Date(now.getFullYear(), now.getMonth(), 1);

  const [calDate, setCalDate] = useState(initDate);
  const [selectedStaff, setSelectedStaff] = useState(staffList[0]?.staffId || '');
  const [shifts, setShifts] = useState({});
  const [saved, setSaved] = useState('');
  const [loading, setLoading] = useState(false);
  // ④ 任意時間入力用：選択中の日付と時間モーダル表示フラグ
  const [customTarget, setCustomTarget] = useState(null); // { dateStr, start, end }

  const DAY = ['日','月','火','水','木','金','土'];
  const pn = n => String(n).padStart(2,'0');
  const year = calDate.getFullYear(), month = calDate.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDay = new Date(year, month, 1).getDay();
  const today = new Date();

  // ④ 営業時間のデフォルト値（任意時間入力の初期値として使用）
  const settingsAmStart = settings?.['午前開始'] || '09:00';
  const settingsPmEnd   = settings?.['午後終了'] || '18:00';

  const TYPES = { off: '休み', am: '午前', pm: '午後', full: '終日', custom: '任意' };
  const TYPE_COLORS = { off: '#f8fafc', am: '#eff6ff', pm: '#ecfdf5', full: C.primaryPale, custom: '#fef9c3' };
  const TYPE_LABELS = { off: '', am: '午前', pm: '午後', full: '終日', custom: '任意' };

  // 施術者・月が変わったらシフトを読み込む（専用シート優先 → 勤務スケジュールをフォールバック）
  useEffect(() => {
    const staff = staffList.find(s => s.staffId === selectedStaff);
    if (!staff) return;

    // 勤務スケジュールから初期シフトを生成する関数
    const buildFromSchedule = () => {
      let savedSched = {};
      try { savedSched = JSON.parse(staff.schedule || '{}'); } catch(e) {}
      const newShifts = {};
      for (let d = 1; d <= daysInMonth; d++) {
        const dateObj = new Date(year, month, d);
        const dayName = DAY[dateObj.getDay()];
        const dateStr = `${year}-${pn(month+1)}-${pn(d)}`;
        const sched = savedSched[dayName];
        if (sched && sched.type !== 'off') newShifts[dateStr] = sched;
      }
      return newShifts;
    };

    // シフト専用シートから保存済みシフトを読み込む
    const yearMonth = `${year}-${pn(month+1)}`;
    setLoading(true);
    apiGet({ action: 'getShifts', staffId: selectedStaff, yearMonth }).then(r => {
      if (r.success && Object.keys(r.data.shifts || {}).length > 0) {
        // 保存済みシフトがあればそれを使用
        setShifts(r.data.shifts);
      } else {
        // 保存済みがなければ勤務スケジュールから生成
        setShifts(buildFromSchedule());
      }
      setLoading(false);
    }).catch(() => {
      setShifts(buildFromSchedule());
      setLoading(false);
    });
  }, [selectedStaff, calDate]);

  // 週を生成
  const weeks = [];
  let day = 1 - firstDay;
  while (day <= daysInMonth) {
    const week = [];
    for (let i = 0; i < 7; i++, day++) week.push(day > 0 && day <= daysInMonth ? day : null);
    weeks.push(week);
  }

  const toggleShift = (dateStr) => {
    const cur = shifts[dateStr]?.type || 'off';
    // 「休み→午前→午後→終日→休み」の順で循環（任意は循環に含めない）
    const order = ['off', 'am', 'pm', 'full'];
    const next = order[(order.indexOf(cur) + 1) % order.length];
    const presetStart = next === 'pm' ? (settings?.['午後開始'] || '13:00') : (settings?.['午前開始'] || '09:00');
    const presetEnd   = next === 'am' ? (settings?.['午前終了'] || '12:00') : (settings?.['午後終了'] || '18:00');
    setShifts(p => ({ ...p, [dateStr]: { type: next, start: presetStart, end: presetEnd } }));
  };

  // 「任意」ボタン押下時：モーダルを開く（循環とは独立）
  const openCustomEdit = (e, dateStr) => {
    e.stopPropagation();
    const curStart = shifts[dateStr]?.start || settingsAmStart;
    const curEnd   = shifts[dateStr]?.end   || settingsPmEnd;
    setCustomTarget({ dateStr, start: curStart, end: curEnd, prevShift: shifts[dateStr] || null });
  };

  const handleSave = async () => {
    setLoading(true);
    const staff = staffList.find(s => s.staffId === selectedStaff);
    const staffName = staff?.name || selectedStaff;
    const yearMonth = `${year}-${pn(month+1)}`;

    const res = await apiPost({
      action: 'saveShifts',
      staffId: selectedStaff,
      staffName,
      yearMonth,
      shifts,
    });
    if (res.success) {
      setSaved(`${staffName}の${year}年${month+1}月シフトを保存しました（${res.data?.saved || 0}件）`);
      setTimeout(() => setSaved(''), 4000);
      // 保存後にGASから再読み込みして反映確認
      const r = await apiGet({ action: 'getShifts', staffId: selectedStaff, yearMonth });
      if (r.success) setShifts(r.data.shifts || {});
    } else {
      alert('保存に失敗しました: ' + (res.error?.message || JSON.stringify(res)));
    }
    setLoading(false);
  };

  const isCurrentMonth = year === now.getFullYear() && month === now.getMonth();
  const isNextMonth = year === now.getFullYear() && month === now.getMonth() + 1;

  return (
    <div>
      <div style={S.pageHeader}>
        <h2 style={S.pageTitle}>📅 シフト手動設定</h2>
        {onBack && <Btn v="gray" style={{ fontSize: 12 }} onClick={onBack}>← 施術者管理へ戻る</Btn>}
      </div>
      <div style={S.note('info')}>
        💡 施術者の勤務設定をもとに自動でシフトを生成します。日付をクリックして変更できます。
      </div>

      {/* 今月/翌月切替タブ */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 12, marginTop: 8 }}>
        <Btn v={isCurrentMonth ? 'primary' : 'outline'} style={{ fontSize: 12 }}
          onClick={() => setCalDate(new Date(now.getFullYear(), now.getMonth(), 1))}>
          今月（{now.getMonth()+1}月）
        </Btn>
        <Btn v={isNextMonth ? 'primary' : 'outline'} style={{ fontSize: 12 }}
          onClick={() => setCalDate(new Date(now.getFullYear(), now.getMonth() + 1, 1))}>
          翌月（{now.getMonth()+2}月）
        </Btn>
        <button style={{ border: `1px solid ${C.border}`, background: '#fff', borderRadius: 4, padding: '3px 10px', cursor: 'pointer', marginLeft: 8 }}
          onClick={() => setCalDate(new Date(year, month - 1, 1))}>≪</button>
        <span style={{ fontSize: 15, fontWeight: 700, alignSelf: 'center', minWidth: 80 }}>{year}年{month+1}月</span>
        <button style={{ border: `1px solid ${C.border}`, background: '#fff', borderRadius: 4, padding: '3px 10px', cursor: 'pointer' }}
          onClick={() => setCalDate(new Date(year, month + 1, 1))}>≫</button>
      </div>

      {/* 施術者選択タブ */}
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center', marginBottom: 12 }}>
        <span style={{ fontSize: 13, fontWeight: 600, marginRight: 4 }}>施術者：</span>
        {staffList.map(s => (
          <Btn key={s.staffId} v={selectedStaff === s.staffId ? 'primary' : 'outline'}
            style={{ fontSize: 12 }} onClick={() => setSelectedStaff(s.staffId)}>
            {s.name}
          </Btn>
        ))}
      </div>

      {/* 凡例 */}
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 10 }}>
        {Object.entries(TYPES).map(([t, l]) => (
          <span key={t} style={{ fontSize: 11, padding: '2px 8px', borderRadius: 4, background: TYPE_COLORS[t], border: `1px solid ${C.border}` }}>
            {l}
          </span>
        ))}
        <span style={{ fontSize: 11, color: C.muted }}>※ 日付をクリックで「休み→午前→午後→終日→休み」を切り替え。「任意設定」ボタンで自由な時間を設定できます。</span>
      </div>

      {/* 読み込み中 */}
      {loading && <div style={{ textAlign: 'center', padding: 20, color: C.muted, fontSize: 13 }}>📅 シフトを読み込んでいます...</div>}

      {/* カレンダー */}
      {!loading && <table style={{ width: '100%', borderCollapse: 'collapse', background: '#fff', borderRadius: 6, overflow: 'hidden', boxShadow: '0 2px 8px rgba(0,0,0,.1)' }}>
        <thead>
          <tr>{DAY.map((d, i) => (
            <th key={d} style={{ background: i===0?'#b91c1c':i===6?'#1d4ed8':C.primary, color:'#fff', padding:'6px 4px', textAlign:'center', fontSize:12 }}>{d}</th>
          ))}</tr>
        </thead>
        <tbody>
          {weeks.map((week, wi) => (
            <tr key={wi}>
              {week.map((d, di) => {
                if (!d) return <td key={di} style={{ border: `1px solid ${C.border}`, height: 70 }} />;
                const dateStr = `${year}-${pn(month+1)}-${pn(d)}`;
                const shift = shifts[dateStr];
                const t = shift?.type || 'off';
                const isToday = year===today.getFullYear() && month===today.getMonth() && d===today.getDate();
                const staffName = staffList.find(s=>s.staffId===selectedStaff)?.name || '';
                return (
                  <td key={di} onClick={() => toggleShift(dateStr)}
                    style={{ border:`1px solid ${C.border}`, height:70, verticalAlign:'top', padding:'3px 4px', cursor:'pointer',
                      background: TYPE_COLORS[t], outline: isToday?`2px solid ${C.primary}`:'none', position:'relative' }}>
                    <div style={{ fontSize:12, fontWeight:700, color: di===0?'#b91c1c':di===6?'#1d4ed8':C.muted }}>{d}</div>
                    {t !== 'off' && (
                      <div style={{ fontSize:10, marginTop:1, color: C.primary, fontWeight:600, lineHeight: 1.3 }}>
                        {t === 'custom'
                          ? <><span style={{ fontSize:9 }}>任意</span><br/>{shift?.start||''}〜{shift?.end||''}</>
                          : TYPE_LABELS[t]
                        }
                      </div>
                    )}
                    {/* 任意設定ボタン：鉛筆アイコンをセル右下に配置 */}
                    {t !== 'off' && (
                      <button
                        onClick={e => openCustomEdit(e, dateStr)}
                        style={{ position:'absolute', bottom:3, right:3, fontSize:9, lineHeight:1,
                          background: t === 'custom' ? C.primary : 'rgba(255,255,255,0.9)',
                          border:`1px solid ${t === 'custom' ? C.primary : C.border}`,
                          borderRadius:3, cursor:'pointer', padding:'1px 3px',
                          color: t === 'custom' ? '#fff' : C.muted }}
                        title="任意の時間を設定">✎</button>
                    )}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>}

      <div style={S.btnRow}>
        <Btn v="gray" onClick={() => {
          // 勤務スケジュールから初期値に戻す
          const staff = staffList.find(s => s.staffId === selectedStaff);
          let savedSched = {};
          try { savedSched = JSON.parse(staff?.schedule || '{}'); } catch(e) {}
          const reset = {};
          for (let d = 1; d <= daysInMonth; d++) {
            const dateObj = new Date(year, month, d);
            const dayName = DAY[dateObj.getDay()];
            const dateStr = `${year}-${pn(month+1)}-${pn(d)}`;
            const sched = savedSched[dayName];
            if (sched && sched.type !== 'off') reset[dateStr] = sched;
          }
          setShifts(reset);
        }}>勤務設定に戻す</Btn>
        {onBack && <Btn v="gray" onClick={onBack}>キャンセル</Btn>}
        <Btn v="primary" style={{ marginLeft: 'auto' }} onClick={handleSave}>
          {loading ? '保存中...' : '確定'}
        </Btn>
      </div>
      {saved && <div style={S.note('success')}>✅ {saved}</div>}

      {/* ④ 任意時間入力モーダル */}
      {customTarget && (() => {
        // キャンセル時：モーダルを開く前のシフト状態に戻す
        const handleCancel = () => {
          if (customTarget.prevShift) {
            // 元のシフト（fullなど）に戻す
            setShifts(p => ({ ...p, [customTarget.dateStr]: customTarget.prevShift }));
          } else {
            // 元が「なし（off）」だった場合は削除
            setShifts(p => { const n = { ...p }; delete n[customTarget.dateStr]; return n; });
          }
          setCustomTarget(null);
        };
        return (
          <Modal title={`⏰ 任意勤務時間の設定（${customTarget.dateStr}）`} onClose={handleCancel}>
            <div style={{ padding: '8px 0' }}>
              <p style={{ fontSize: 13, color: C.muted, marginBottom: 16 }}>
                この日の勤務開始・終了時間を自由に設定できます。
              </p>
              <table style={S.formTbl}>
                <tbody>
                  <FormRow label="開始時刻">
                    <input style={{ ...S.input, width: 120 }} type="time"
                      value={customTarget.start}
                      onChange={e => setCustomTarget(p => ({ ...p, start: e.target.value }))} />
                  </FormRow>
                  <FormRow label="終了時刻">
                    <input style={{ ...S.input, width: 120 }} type="time"
                      value={customTarget.end}
                      onChange={e => setCustomTarget(p => ({ ...p, end: e.target.value }))} />
                  </FormRow>
                </tbody>
              </table>
            </div>
            <div style={S.btnRow}>
              <Btn v="gray" onClick={handleCancel}>キャンセル</Btn>
              <Btn v="primary" style={{ marginLeft: 'auto' }} onClick={() => {
                // 入力値をシフトに反映してモーダルを閉じる
                setShifts(p => ({
                  ...p,
                  [customTarget.dateStr]: { type: 'custom', start: customTarget.start, end: customTarget.end }
                }));
                setCustomTarget(null);
              }}>設定する</Btn>
            </div>
          </Modal>
        );
      })()}
    </div>
  );
}

// ============================================================
// メッセージ管理画面
// ============================================================
function MessageScreen({ userList }) {
  const [sendMethod, setSendMethod] = useState('LINE');
  const [targetType, setTargetType] = useState('individual');
  const [selectedUsers, setSelectedUsers] = useState(new Set()); // 複数選択対応
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [users, setUsers] = useState([]);
  const [sent, setSent] = useState('');
  const [query, setQuery] = useState('');

  useEffect(() => {
    apiGet({ action: 'getUserList', query: '' }).then(r => {
      if (r.success) setUsers(r.data.users || []);
    });
  }, []);

  // 送信方法に応じて表示する利用者をフィルタ
  const filteredUsers = users.filter(u => {
    const hasLine = !!u.lineUserId;
    const hasEmail = !!u.email;
    if (sendMethod === 'LINE') return hasLine;
    if (sendMethod === 'E-mail') return hasEmail;
    if (sendMethod === '両方') return hasLine || hasEmail;
    return true;
  }).filter(u => !query || u.name.includes(query) || (u.email||'').includes(query));

  const toggleUser = (userId) => {
    const next = new Set(selectedUsers);
    next.has(userId) ? next.delete(userId) : next.add(userId);
    setSelectedUsers(next);
  };

  const toggleAll = () => {
    if (selectedUsers.size === filteredUsers.length) {
      setSelectedUsers(new Set());
    } else {
      setSelectedUsers(new Set(filteredUsers.map(u => u.userId)));
    }
  };

  const handleSend = async () => {
    if (!message.trim()) { alert('メッセージを入力してください'); return; }
    const targets = targetType === 'all' ? filteredUsers : filteredUsers.filter(u => selectedUsers.has(u.userId));
    if (targets.length === 0) { alert('送信先を選択してください'); return; }
    if (!window.confirm(`${targets.length}名にメッセージを送信しますか？`)) return;
    setLoading(true);
    let successCount = 0;
    for (const u of targets) {
      if ((sendMethod === 'LINE' || sendMethod === '両方') && u.lineUserId) {
        await apiPost({ action: 'sendLineMessage', lineUserId: u.lineUserId, message });
        successCount++;
      }
      if ((sendMethod === 'E-mail' || sendMethod === '両方') && u.email) {
        await apiPost({ action: 'sendEmailMessage', email: u.email, name: u.name, message });
        successCount++;
      }
    }
    setSent(`${successCount}件送信しました`);
    setTimeout(() => setSent(''), 4000);
    setMessage('');
    setSelectedUsers(new Set());
    setLoading(false);
  };

  // バッジ表示ヘルパー
  const contactBadge = (u) => (
    <span style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
      {u.lineUserId && <span style={S.badge('green')}>LINE</span>}
      {u.email && <span style={S.badge('blue')}>Email</span>}
      {!u.lineUserId && !u.email && <span style={S.badge('gray')}>未登録</span>}
    </span>
  );

  return (
    <div>
      <div style={S.pageHeader}><h2 style={S.pageTitle}>メッセージ管理</h2></div>
      <table style={S.formTbl}>
        <tbody>
          {/* 送信方法 */}
          <FormRow label="メッセージ送信方法">
            <div style={{ display: 'flex', gap: 20 }}>
              {['LINE','E-mail','両方'].map(v => (
                <label key={v} style={{ display: 'flex', alignItems: 'center', gap: 5, cursor: 'pointer', fontSize: 12.5 }}>
                  <input type="radio" name="sendMethod" checked={sendMethod === v}
                    onChange={() => { setSendMethod(v); setSelectedUsers(new Set()); }} /> {v}
                </label>
              ))}
            </div>
            <div style={S.note('warn')}>💡 ラジオボタン（排他選択）。いずれか一つを選択してください。</div>
          </FormRow>

          {/* 送信先 */}
          <FormRow label="メッセージ送信先">
            <div style={{ display: 'flex', gap: 20, marginBottom: 10 }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: 5, cursor: 'pointer', fontSize: 12.5 }}>
                <input type="radio" name="targetType" checked={targetType === 'all'}
                  onChange={() => { setTargetType('all'); setSelectedUsers(new Set()); }} /> 利用者全員
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: 5, cursor: 'pointer', fontSize: 12.5 }}>
                <input type="radio" name="targetType" checked={targetType === 'individual'}
                  onChange={() => setTargetType('individual')} /> 個別選択
              </label>
            </div>

            {/* 利用者一覧テーブル（個別選択時） */}
            {targetType === 'individual' && (
              <div style={{ border: `1px solid ${C.border}`, borderRadius: 6, overflow: 'hidden' }}>
                {/* 検索・全選択バー */}
                <div style={{ display: 'flex', gap: 8, padding: 8, background: '#f8fafc', borderBottom: `1px solid ${C.border}` }}>
                  <input style={{ ...S.input, flex: 1, fontSize: 12 }} type="text" placeholder="氏名・メールで絞り込み"
                    value={query} onChange={e => setQuery(e.target.value)} />
                  <Btn v="gray" style={{ fontSize: 11, padding: '3px 10px', whiteSpace: 'nowrap' }} onClick={toggleAll}>
                    {selectedUsers.size === filteredUsers.length && filteredUsers.length > 0 ? '全解除' : '全選択'}
                  </Btn>
                  <span style={{ fontSize: 11.5, color: C.muted, alignSelf: 'center', whiteSpace: 'nowrap' }}>
                    {selectedUsers.size}名選択中
                  </span>
                </div>

                {/* 送信方法の説明 */}
                <div style={{ padding: '4px 10px', background: '#eff6ff', fontSize: 11, color: C.primary, borderBottom: `1px solid ${C.border}` }}>
                  {sendMethod === 'LINE' && '✅ LINE登録済みの利用者のみ表示'}
                  {sendMethod === 'E-mail' && '✅ メール登録済みの利用者のみ表示'}
                  {sendMethod === '両方' && '✅ LINE・メール・両方いずれかが登録済みの利用者を表示'}
                </div>

                {/* 利用者リスト */}
                <div style={{ maxHeight: 280, overflowY: 'auto' }}>
                  {filteredUsers.length === 0 ? (
                    <div style={{ padding: 16, textAlign: 'center', color: C.muted, fontSize: 12.5 }}>
                      該当する利用者がいません
                    </div>
                  ) : filteredUsers.map(u => (
                    <div key={u.userId}
                      onClick={() => toggleUser(u.userId)}
                      style={{
                        display: 'flex', alignItems: 'center', gap: 10, padding: '8px 12px',
                        borderBottom: `1px solid ${C.border}`, cursor: 'pointer',
                        background: selectedUsers.has(u.userId) ? C.primaryPale : '#fff',
                        transition: 'background 0.1s',
                      }}>
                      <input type="checkbox" checked={selectedUsers.has(u.userId)}
                        onChange={() => toggleUser(u.userId)}
                        onClick={e => e.stopPropagation()} style={{ cursor: 'pointer' }} />
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 13, fontWeight: selectedUsers.has(u.userId) ? 700 : 400 }}>{u.name}</div>
                        <div style={{ fontSize: 11, color: C.muted }}>{u.nameKana}</div>
                      </div>
                      <div style={{ fontSize: 11, color: C.muted, textAlign: 'right', minWidth: 140 }}>
                        {u.email && <div>{u.email}</div>}
                      </div>
                      {contactBadge(u)}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 全員選択時の対象人数表示 */}
            {targetType === 'all' && (
              <div style={{ ...S.note('info'), marginTop: 6 }}>
                対象：{filteredUsers.length}名（{sendMethod}登録済みの全利用者）
              </div>
            )}
          </FormRow>

          {/* メッセージ内容 */}
          <FormRow label="メッセージ内容">
            <textarea style={{ ...S.input, height: 120, resize: 'vertical' }}
              placeholder="メッセージを入力してください"
              value={message} onChange={e => setMessage(e.target.value)} />
          </FormRow>
        </tbody>
      </table>

      <div style={S.note('warn')}>💡 送信後、登録されている管理者のE-Mailアドレスにもコピーが送信されます。</div>

      <div style={S.btnRow}>
        <Btn v="gray" onClick={() => { setMessage(''); setSelectedUsers(new Set()); }}>リセット</Btn>
        <Btn v="gray" onClick={() => setMessage('')}>キャンセル</Btn>
        <Btn v="primary" style={{ marginLeft: 'auto' }} onClick={handleSend}>
          {loading ? '送信中...' : '送信'}
        </Btn>
      </div>
      {sent && <div style={S.note('success')}>✅ {sent}</div>}
    </div>
  );
}

// ============================================================
// 管理者管理画面
// ============================================================
function AdminManageScreen({ currentAdminInfo }) {
  const [admins, setAdmins]         = useState([]);
  const [loading, setLoading]       = useState(true);
  const [showAdd, setShowAdd]       = useState(false);
  const [changeTarget, setChangeTarget] = useState(null); // パスワード変更対象
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [newAdmin, setNewAdmin]     = useState({ email: '', password: '', level: 'admin' });
  const [newPassword, setNewPassword] = useState('');
  const [saved, setSaved]           = useState('');
  const [addLoading, setAddLoading] = useState(false);

  const fetchAdmins = async () => {
    setLoading(true);
    const res = await apiPost({ action: 'getAdminList' });
    if (res.success) setAdmins(res.data.admins);
    setLoading(false);
  };

  useEffect(() => { fetchAdmins(); }, []);

  const showMsg = (msg) => { setSaved(msg); setTimeout(() => setSaved(''), 4000); };

  const handleAdd = async () => {
    if (!newAdmin.email || !newAdmin.password) { alert('メールアドレスとパスワードは必須です'); return; }
    setAddLoading(true);
    const res = await apiPost({ action: 'addAdmin', ...newAdmin });
    if (res.success) {
      showMsg('管理者を追加しました');
      fetchAdmins();
      setShowAdd(false);
      setNewAdmin({ email: '', password: '', level: 'admin' });
    } else {
      alert('追加に失敗しました: ' + (res.error?.message || ''));
    }
    setAddLoading(false);
  };

  const handleChangePassword = async () => {
    if (!newPassword) { alert('新しいパスワードを入力してください'); return; }
    const res = await apiPost({ action: 'changeAdminPassword', adminId: changeTarget.adminId, newPassword });
    if (res.success) {
      showMsg(`${changeTarget.email} のパスワードを変更しました`);
      setChangeTarget(null);
      setNewPassword('');
    } else {
      alert('変更に失敗しました: ' + (res.error?.message || ''));
    }
  };

  const handleDelete = async () => {
    const res = await apiPost({ action: 'deleteAdmin', adminId: deleteTarget.adminId });
    if (res.success) {
      showMsg(`${deleteTarget.email} を削除しました`);
      fetchAdmins();
      setDeleteTarget(null);
    } else {
      alert('削除に失敗しました: ' + (res.error?.message || ''));
    }
  };

  const levelLabel = { super: 'スーパー管理者', admin: '管理者', viewer: '閲覧者' };
  const levelBadge = { super: 'green', admin: 'blue', viewer: 'gray' };

  return (
    <div>
      <div style={S.pageHeader}>
        <h2 style={S.pageTitle}>👤 管理者管理</h2>
      </div>
      <div style={S.note('warn')}>
        💡 スーパー管理者のみがこの画面を操作できます。スーパー管理者は最低1名必要です。
      </div>

      {saved && <div style={{ ...S.note('success'), marginTop: 8 }}>✅ {saved}</div>}

      {loading ? <p>読み込み中...</p> : (
        <table style={{ ...S.gridTbl, marginTop: 16 }}>
          <thead>
            <tr>
              {['メールアドレス','権限','登録日時','操作'].map(h => <th key={h} style={S.th}>{h}</th>)}
            </tr>
          </thead>
          <tbody>
            {admins.map(a => (
              <tr key={a.adminId} style={{ background: a.email === currentAdminInfo?.email ? '#eff6ff' : '#fff' }}>
                <td style={S.td}>
                  {a.email}
                  {a.email === currentAdminInfo?.email && <span style={{ ...S.badge('blue'), marginLeft: 6, fontSize: 10 }}>自分</span>}
                </td>
                <td style={S.td}><span style={S.badge(levelBadge[a.level] || 'gray')}>{levelLabel[a.level] || a.level}</span></td>
                <td style={S.td}>{a.createdAt}</td>
                <td style={S.td}>
                  <div style={{ display: 'flex', gap: 6 }}>
                    <Btn v="outline" style={{ fontSize: 11, padding: '3px 10px' }}
                      onClick={() => { setChangeTarget(a); setNewPassword(''); }}>
                      PW変更
                    </Btn>
                    {a.email !== currentAdminInfo?.email && (
                      <Btn v="danger" style={{ fontSize: 11, padding: '3px 10px' }}
                        onClick={() => setDeleteTarget(a)}>
                        削除
                      </Btn>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      <div style={S.btnRow}>
        <Btn v="primary" onClick={() => setShowAdd(true)}>＋ 管理者を追加</Btn>
      </div>

      {/* 管理者追加モーダル */}
      {showAdd && (
        <Modal title="管理者を追加" onClose={() => setShowAdd(false)}>
          <table style={S.formTbl}>
            <tbody>
              <FormRow label="メールアドレス" required>
                <input style={S.input} type="email" placeholder="admin@example.com"
                  value={newAdmin.email} onChange={e => setNewAdmin(p => ({ ...p, email: e.target.value }))} />
              </FormRow>
              <FormRow label="パスワード" required>
                <input style={S.input} type="password" placeholder="8文字以上推奨"
                  value={newAdmin.password} onChange={e => setNewAdmin(p => ({ ...p, password: e.target.value }))} />
              </FormRow>
              <FormRow label="権限レベル" required>
                <div style={{ display: 'flex', gap: 20 }}>
                  {[{v:'super',l:'スーパー管理者'},{v:'admin',l:'管理者'},{v:'viewer',l:'閲覧者'}].map(o => (
                    <label key={o.v} style={{ display: 'flex', alignItems: 'center', gap: 5, cursor: 'pointer', fontSize: 12.5 }}>
                      <input type="radio" checked={newAdmin.level === o.v}
                        onChange={() => setNewAdmin(p => ({ ...p, level: o.v }))} /> {o.l}
                    </label>
                  ))}
                </div>
              </FormRow>
            </tbody>
          </table>
          <div style={S.btnRow}>
            <Btn v="gray" onClick={() => setShowAdd(false)}>キャンセル</Btn>
            <Btn v="primary" style={{ marginLeft: 'auto' }} onClick={handleAdd}>
              {addLoading ? '追加中...' : '追加する'}
            </Btn>
          </div>
        </Modal>
      )}

      {/* パスワード変更モーダル */}
      {changeTarget && (
        <Modal title={`🔑 パスワード変更：${changeTarget.email}`} onClose={() => setChangeTarget(null)}>
          <table style={S.formTbl}>
            <tbody>
              <FormRow label="新しいパスワード" required>
                <input style={S.input} type="password" placeholder="新しいパスワードを入力"
                  value={newPassword} onChange={e => setNewPassword(e.target.value)} />
              </FormRow>
            </tbody>
          </table>
          <div style={S.btnRow}>
            <Btn v="gray" onClick={() => setChangeTarget(null)}>キャンセル</Btn>
            <Btn v="primary" style={{ marginLeft: 'auto' }} onClick={handleChangePassword}>変更する</Btn>
          </div>
        </Modal>
      )}

      {/* 削除確認モーダル */}
      {deleteTarget && (
        <Modal title="管理者を削除" onClose={() => setDeleteTarget(null)}>
          <p style={{ fontSize: 13, marginBottom: 16 }}>
            <b>「{deleteTarget.email}」</b>を削除しますか？<br />
            <span style={{ color: C.danger, fontSize: 12 }}>この操作は元に戻せません。</span>
          </p>
          <div style={S.btnRow}>
            <Btn v="gray" onClick={() => setDeleteTarget(null)}>キャンセル</Btn>
            <Btn v="danger" style={{ marginLeft: 'auto' }} onClick={handleDelete}>削除する</Btn>
          </div>
        </Modal>
      )}
    </div>
  );
}

function UsersScreen() {
  const [users, setUsers] = useState([]);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [newUser, setNewUser] = useState({ userId: '', name: '', nameKana: '', lineUserId: '', email: '' });
  const [saved, setSaved] = useState('');
  const [addLoading, setAddLoading] = useState(false);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    const res = await apiGet({ action: 'getUserList', query });
    if (res.success) setUsers(res.data.users);
    setLoading(false);
  }, [query]);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  const handleAddUser = async () => {
    if (!newUser.name || !newUser.nameKana) { alert('氏名とふりがなは必須です'); return; }
    setAddLoading(true);
    const res = await apiPost({
      action: 'addUserByAdmin',
      userId: newUser.userId || undefined,
      name: newUser.name,
      nameKana: newUser.nameKana,
      lineUserId: newUser.lineUserId || '',
      email: newUser.email || '',
    });
    if (res.success) {
      setSaved(`「${newUser.name}」を登録しました`);
      setTimeout(() => setSaved(''), 3000);
      fetchUsers();
      setShowAdd(false);
      setNewUser({ userId: '', name: '', nameKana: '', lineUserId: '', email: '' });
    } else {
      alert('登録に失敗しました: ' + (res.error?.message || ''));
    }
    setAddLoading(false);
  };

  return (
    <div>
      <div style={S.pageHeader}>
        <h2 style={S.pageTitle}>利用者管理</h2>
        <input style={{ ...S.input, width: 220 }} type="text" placeholder="氏名・メール・電話で検索"
          value={query} onChange={e => setQuery(e.target.value)} onKeyDown={e => e.key === 'Enter' && fetchUsers()} />
        <Btn v="primary" onClick={fetchUsers}>検索</Btn>
        <Btn v="success" style={{ marginLeft: 'auto' }} onClick={() => setShowAdd(true)}>＋ 利用者を追加</Btn>
      </div>
      {saved && <div style={S.note('success')}>✅ {saved}</div>}
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

      {showAdd && (
        <Modal title="利用者を追加" onClose={() => setShowAdd(false)}>
          <table style={S.formTbl}>
            <tbody>
              <FormRow label="利用者ID">
                <input style={S.input} type="text" placeholder="自動採番（空白でOK）"
                  value={newUser.userId} onChange={e => setNewUser(p=>({...p,userId:e.target.value}))} />
              </FormRow>
              <FormRow label="氏名" required>
                <input style={S.input} type="text" placeholder="横浜　太郎"
                  value={newUser.name} onChange={e => setNewUser(p=>({...p,name:e.target.value}))} />
              </FormRow>
              <FormRow label="氏名（ふりがな）" required>
                <input style={S.input} type="text" placeholder="よこはま　たろう"
                  value={newUser.nameKana} onChange={e => setNewUser(p=>({...p,nameKana:e.target.value}))} />
              </FormRow>
              <FormRow label="LINE ID">
                <input style={S.input} type="text" placeholder="LINE連携時に自動入力（任意）"
                  value={newUser.lineUserId} onChange={e => setNewUser(p=>({...p,lineUserId:e.target.value}))} />
              </FormRow>
              <FormRow label="E-Mail">
                <input style={S.input} type="email" placeholder="手入力（任意）"
                  value={newUser.email} onChange={e => setNewUser(p=>({...p,email:e.target.value}))} />
              </FormRow>
            </tbody>
          </table>
          <div style={S.btnRow}>
            <Btn v="gray" onClick={() => setShowAdd(false)}>キャンセル</Btn>
            <Btn v="primary" style={{ marginLeft: 'auto' }} onClick={handleAddUser}>
              {addLoading ? '登録中...' : '確定（当月に反映）'}
            </Btn>
          </div>
        </Modal>
      )}
    </div>
  );
}

// ============================================================
// メインコンポーネント
// ============================================================
export default function AdminDashboard() {
  const [adminInfo, setAdminInfo] = useState(null);
  const isLoggedIn = !!adminInfo;
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
  const [shiftMode, setShiftMode]     = useState('current'); // 'current' or 'next'

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
    const res = await apiPost({ action: 'updateSettings', settings: updates });
    if (res.success) {
      // 保存後にGoogle Sheetsから最新設定を再取得して確実に同期する
      const fresh = await apiGet({ action: 'getSettings' });
      if (fresh.success) {
        setSettings(fresh.data.settings);
      } else {
        setSettings(prev => ({ ...prev, ...updates }));
      }
    } else {
      alert('設定の保存に失敗しました: ' + (res.error?.message || ''));
    }
  };

  if (!isLoggedIn) return <LoginScreen onLogin={(info) => setAdminInfo(info)} />;

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
              <CalDay bookings={bookings} staffList={staffList} menuList={menuList} settings={settings} currentDate={currentDate}
                onChangeDate={setCurrentDate} onSelectBooking={setSelectedBooking}
                onSelectEmpty={(date, slot, staffId) => setNewBookingInfo({ date, slot, staffId })} />
            )}
            <div style={S.btnRow}><Btn v="primary" onClick={() => setNewBookingInfo({})}>新規予約</Btn></div>
          </div>
        );
      case 'staff':   return <StaffScreen staffList={staffList} menuList={menuList} bookings={bookings} settings={settings} onRefreshStaff={() => apiGet({ action: 'getStaff' }).then(r => r.success && setStaffList(r.data.staff))} onShiftPage={(m) => { setShiftMode(m); setCurrentPage('shift'); }} />;
      case 'store':   return <StoreScreen settings={settings} onSave={handleSaveSettings} />;
      case 'menu':    return <MenuScreen menuList={menuList} onRefresh={() => apiGet({ action: 'getMenus' }).then(r => r.success && setMenuList(r.data.menus))} />;
      case 'message': return <MessageScreen users={[]} />;
      case 'users':   return <UsersScreen />;
      case 'reminder':  return <ReminderScreen settings={settings} onSave={handleSaveSettings} />;
      case 'csv':       return <CsvExportScreen bookings={bookings} staffList={staffList} menuList={menuList} />;
      case 'shift':     return <ShiftScreen staffList={staffList} settings={settings} initialMode={shiftMode} onBack={() => setCurrentPage('staff')} />;
      case 'admins': return <AdminManageScreen currentAdminInfo={adminInfo} />;
      case 'inquiry':   return <div style={S.pageHeader}><h2 style={S.pageTitle}>問い合わせ</h2></div>;
      default: return null;
    }
  };

  return (
    <div style={S.app}>
      <div style={S.layout}>
        <SideNav current={currentPage} onChange={setCurrentPage} onLogout={() => setAdminInfo(null)} adminInfo={adminInfo} />
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