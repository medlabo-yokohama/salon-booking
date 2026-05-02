// ============================================================
// booking_calendar_ui_with_notifications.jsx
// 顧客向け予約フォーム（コース選択→月カレンダー→日ビュー→予約確認）
// ============================================================
import React, { useState, useEffect, useCallback } from 'react';

const GAS_URL = import.meta.env.VITE_GAS_URL || '';

// ============================================================
// APIクライアント
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
// スタイル定数
// ============================================================
const C = {
  primary: '#1a4f8a', primaryPale: '#dbeafe', accent: '#0ea5e9',
  danger: '#dc2626', success: '#059669', warning: '#f59e0b',
  bg: '#f0f4f8', surface: '#ffffff', border: '#cbd5e1',
  text: '#1e293b', muted: '#64748b',
};

const S = {
  wrap: { width: '100%', maxWidth: 480, margin: '0 auto', background: C.surface, minHeight: '100vh', display: 'flex', flexDirection: 'column', fontFamily: "'Noto Sans JP', sans-serif", fontSize: 13 },
  header: { background: C.primary, color: '#fff', padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 10, position: 'sticky', top: 0, zIndex: 10 },
  headerTitle: { fontSize: 15, fontWeight: 700, flex: 1 },
  backBtn: { background: 'none', border: 'none', color: '#fff', fontSize: 18, cursor: 'pointer' },
  body: { flex: 1, padding: '14px 16px', overflowY: 'auto' },
  nav: { display: 'flex', background: C.surface, borderTop: `1px solid ${C.border}`, position: 'sticky', bottom: 0, zIndex: 10 },
  navLink: (active) => ({ flex: 1, textAlign: 'center', padding: '8px 4px', fontSize: 10, color: active ? C.primary : C.muted, textDecoration: 'none', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2, cursor: 'pointer', fontWeight: active ? 700 : 400 }),
  navIcon: { fontSize: 18 },
  loginWrap: { display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', flex: 1, padding: '32px 16px', background: 'linear-gradient(160deg, #1a4f8a 0%, #0ea5e9 100%)' },
  loginCard: { background: '#fff', borderRadius: 16, padding: '28px 24px', width: '100%', maxWidth: 360, boxShadow: '0 20px 60px rgba(0,0,0,.2)' },
  lineBtn: { width: '100%', background: '#06C755', color: '#fff', border: 'none', borderRadius: 8, padding: 12, fontFamily: 'inherit', fontSize: 14, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, marginBottom: 12 },
  emailBtn: { width: '100%', background: C.primary, color: '#fff', border: 'none', borderRadius: 8, padding: 12, fontFamily: 'inherit', fontSize: 14, fontWeight: 700, cursor: 'pointer', marginBottom: 10 },
  textBtn: { width: '100%', background: 'none', border: `1.5px solid ${C.border}`, borderRadius: 8, padding: 11, fontFamily: 'inherit', fontSize: 13, color: C.muted, cursor: 'pointer' },
  formTbl: { width: '100%', borderCollapse: 'collapse', background: C.surface, borderRadius: 6, overflow: 'hidden', boxShadow: '0 2px 8px rgba(0,0,0,.10)' },
  formTh: { background: '#f1f5f9', fontWeight: 600, width: 120, color: C.text, border: `1px solid ${C.border}`, padding: '9px 12px', fontSize: 12.5, textAlign: 'left' },
  formTd: { color: C.muted, border: `1px solid ${C.border}`, padding: '9px 12px', fontSize: 12.5 },
  formInput: { width: '100%', border: `1.5px solid ${C.border}`, borderRadius: 4, padding: '5px 8px', fontFamily: 'inherit', fontSize: 12.5, color: C.text, background: '#f8fafc', boxSizing: 'border-box' },
  btn: (variant) => {
    const v = { primary: { background: C.primary, color: '#fff' }, danger: { background: C.danger, color: '#fff' }, gray: { background: '#e2e8f0', color: C.text }, success: { background: C.success, color: '#fff' } };
    return { display: 'inline-flex', alignItems: 'center', gap: 4, padding: '6px 16px', border: 'none', borderRadius: 6, fontFamily: 'inherit', fontSize: 12.5, fontWeight: 500, cursor: 'pointer', ...(v[variant] || v.primary) };
  },
  btnRow: { display: 'flex', gap: 8, marginTop: 16, flexWrap: 'wrap' },
  card: { background: C.surface, borderRadius: 6, boxShadow: '0 2px 8px rgba(0,0,0,.10)', padding: '14px 16px', marginBottom: 12 },
  calTable: { width: '100%', borderCollapse: 'collapse' },
  availCircle: (type) => {
    const base = { display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 32, height: 32, borderRadius: '50%', fontSize: 13, fontWeight: 700, cursor: 'pointer' };
    const t = { o: { background: '#d1fae5', color: '#065f46', border: '1.5px solid #059669' }, x: { background: '#fee2e2', color: '#991b1b', border: '1.5px solid #dc2626' }, dash: { background: '#f1f5f9', color: '#94a3b8', border: '1.5px solid #cbd5e1' } };
    return { ...base, ...(t[type] || t.dash) };
  },
  note: { background: '#fef9c3', borderLeft: `4px solid ${C.warning}`, padding: '8px 12px', borderRadius: '0 4px 4px 0', fontSize: 11.5, marginTop: 10, color: '#78350f' },
  noteInfo: { background: '#eff6ff', borderLeft: `4px solid ${C.primary}`, padding: '8px 12px', borderRadius: '0 4px 4px 0', fontSize: 11.5, marginTop: 10, color: C.primary },
  noteSuccess: { background: '#f0fdf4', borderLeft: `4px solid ${C.success}`, padding: '8px 12px', borderRadius: '0 4px 4px 0', fontSize: 11.5, marginTop: 10, color: '#065f46' },
};

// ============================================================
// ページ定数
// ============================================================
const NAV = [
  { key: 'cal',      label: '予約',     icon: '📅' },
  { key: 'confirm',  label: '予約確認',  icon: '📋' },
  { key: 'register', label: '登録',     icon: '👤' },
  { key: 'inquiry',  label: '問い合わせ', icon: '💬' },
  { key: 'logout',   label: 'ログアウト', icon: '🚪' },
];

// ============================================================
// ログイン画面
// ============================================================
function LoginScreen({ onLineLogin, onEmailLogin, onGuestBook, onGoRegister }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleEmailLogin = async () => {
    if (!email || !password) { setError('メールアドレスとパスワードを入力してください'); return; }
    setLoading(true);
    const res = await apiPost({ action: 'loginUser', email, password });
    if (res.success) {
      onEmailLogin(res.data);
    } else {
      setError(res.error?.message || 'メールアドレスまたはパスワードが正しくありません');
    }
    setLoading(false);
  };

  return (
    <div style={{ ...S.wrap, background: 'linear-gradient(160deg, #1a4f8a 0%, #0ea5e9 100%)' }}>
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '32px 16px' }}>
        <div style={S.loginCard}>
          <h2 style={{ fontSize: 18, color: C.primary, fontWeight: 700, marginBottom: 20, textAlign: 'center' }}>
            🏥 ご予約
          </h2>
          <button style={S.lineBtn} onClick={onLineLogin}>
            <span style={{ fontSize: 20 }}>💬</span> LINEでログイン
          </button>
          <div style={{ textAlign: 'center', color: C.muted, fontSize: 12, margin: '10px 0', position: 'relative' }}>
            <span style={{ background: '#fff', padding: '0 8px', position: 'relative', zIndex: 1 }}>または</span>
            <div style={{ position: 'absolute', top: '50%', left: 0, right: 0, height: 1, background: C.border }} />
          </div>
          <input style={{ ...S.formInput, marginBottom: 8 }} type="email" placeholder="メールアドレス"
            value={email} onChange={e => setEmail(e.target.value)} />
          <input style={{ ...S.formInput, marginBottom: 8 }} type="password" placeholder="パスワード"
            value={password} onChange={e => setPassword(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleEmailLogin()} />
          {error && <p style={{ color: C.danger, fontSize: 12, marginBottom: 8 }}>{error}</p>}
          <button style={S.emailBtn} onClick={handleEmailLogin}>
            {loading ? 'ログイン中...' : 'メールアドレスでログイン'}
          </button>
          <div style={{ textAlign: 'center', marginBottom: 10 }}>
            <span style={{ fontSize: 12, color: C.muted }}>アカウントをお持ちでない方は </span>
            <button style={{ background: 'none', border: 'none', color: C.primary, fontSize: 12, fontWeight: 700, cursor: 'pointer', textDecoration: 'underline', padding: 0 }}
              onClick={onGoRegister}>新規登録</button>
          </div>
          <button style={S.textBtn} onClick={onGuestBook}>ログインせずに予約する</button>
        </div>
      </div>
    </div>
  );
}

// ============================================================
// コース選択画面
// ============================================================
function CourseSelectScreen({ menuList, selectedMenuId, onSelectMenu }) {
  return (
    <div>
      <h3 style={{ fontWeight: 700, color: C.primary, marginBottom: 4 }}>① コースを選んでください</h3>
      <p style={{ fontSize: 12, color: C.muted, marginBottom: 16 }}>ご希望のコースをタップしてください</p>
      {menuList.length === 0 && (
        <div style={S.noteInfo}>コースを読み込み中...</div>
      )}
      {menuList.map(m => (
        <div key={m.menuId}
          onClick={() => onSelectMenu(m.menuId)}
          style={{
            display: 'flex', alignItems: 'center', gap: 14,
            padding: '14px 16px', borderRadius: 10, marginBottom: 10, cursor: 'pointer',
            background: selectedMenuId === m.menuId ? C.primaryPale : '#f8fafc',
            border: `2px solid ${selectedMenuId === m.menuId ? C.primary : C.border}`,
            transition: 'all 0.15s',
          }}>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 14, fontWeight: 600, color: selectedMenuId === m.menuId ? C.primary : C.text }}>{m.name}</div>
            <div style={{ fontSize: 12, color: C.muted }}>⏱ {m.durationMin}分</div>
          </div>
          {selectedMenuId === m.menuId
            ? <div style={{ color: C.primary, fontSize: 18, fontWeight: 700 }}>✓</div>
            : <div style={{ color: C.muted, fontSize: 18 }}>›</div>
          }
        </div>
      ))}
    </div>
  );
}

// ============================================================
// 月カレンダー画面（空き確認）
// ============================================================
function CalMonthScreen({ availability, currentDate, onChangeDate, onSelectDay, staffList }) {
  const year  = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const pad = n => String(n).padStart(2, '0');
  const [selectedStaffId, setSelectedStaffId] = useState('all');
  const DAY_NAMES = ['日', '月', '火', '水', '木', '金', '土'];
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  // 日付の空き状況を判定する
  const getDayStatus = (d) => {
    if (!d) return null;
    const dateStr = `${year}-${pad(month + 1)}-${pad(d)}`;
    const dayData = availability[dateStr];
    if (dayData === null) return 'closed';
    if (!dayData) return 'unknown';
    const staffKeys = selectedStaffId === 'all'
      ? Object.keys(dayData).filter(k => k !== 'any')
      : [selectedStaffId];
    const totalSlots = staffKeys.reduce((sum, sid) => sum + (dayData[sid]?.length || 0), 0);
    return totalSlots > 0 ? 'available' : 'full';
  };

  const weeks = [];
  let day = 1 - firstDay;
  while (day <= daysInMonth) {
    const week = [];
    for (let i = 0; i < 7; i++, day++) {
      week.push(day > 0 && day <= daysInMonth ? day : null);
    }
    weeks.push(week);
  }

  return (
    <div>
      {/* 施術者フィルタ */}
      <div style={{ display: 'flex', gap: 6, overflowX: 'auto', padding: '8px 0', marginBottom: 10 }}>
        <button style={{ padding: '5px 12px', borderRadius: 20, border: `1.5px solid ${selectedStaffId === 'all' ? C.primary : C.border}`, fontSize: 11.5, cursor: 'pointer', whiteSpace: 'nowrap', background: selectedStaffId === 'all' ? C.primary : C.surface, color: selectedStaffId === 'all' ? '#fff' : C.text }}
          onClick={() => setSelectedStaffId('all')}>全員</button>
        {staffList.map(s => (
          <button key={s.staffId} style={{ padding: '5px 12px', borderRadius: 20, border: `1.5px solid ${selectedStaffId === s.staffId ? C.primary : C.border}`, fontSize: 11.5, cursor: 'pointer', whiteSpace: 'nowrap', background: selectedStaffId === s.staffId ? C.primary : C.surface, color: selectedStaffId === s.staffId ? '#fff' : C.text }}
            onClick={() => setSelectedStaffId(s.staffId)}>{s.name}</button>
        ))}
      </div>

      {/* 月ナビ */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
        <button style={{ background: 'none', border: `1.5px solid ${C.border}`, borderRadius: 4, padding: '3px 10px', cursor: 'pointer' }}
          onClick={() => onChangeDate(new Date(year, month - 1, 1))}>≪</button>
        <span style={{ fontWeight: 700, flex: 1, textAlign: 'center' }}>{year}年{month + 1}月</span>
        <button style={{ background: 'none', border: `1.5px solid ${C.border}`, borderRadius: 4, padding: '3px 10px', cursor: 'pointer' }}
          onClick={() => onChangeDate(new Date(year, month + 1, 1))}>≫</button>
      </div>

      {/* カレンダー */}
      <table style={S.calTable}>
        <thead>
          <tr>
            {DAY_NAMES.map((d, i) => (
              <th key={d} style={{ background: i === 0 ? '#b91c1c' : i === 6 ? '#1d4ed8' : C.primary, color: '#fff', padding: '6px 2px', textAlign: 'center', fontSize: 11, fontWeight: 500, border: `1px solid ${C.border}` }}>{d}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {weeks.map((week, wi) => (
            <tr key={wi}>
              {week.map((d, di) => {
                const status = getDayStatus(d);
                const isHoliday = di === 0;
                return (
                  <td key={di} style={{ border: `1px solid ${C.border}`, padding: '4px 2px', textAlign: 'center', verticalAlign: 'middle', background: isHoliday ? '#fef2f2' : di === 6 ? '#eff6ff' : C.surface }}>
                    {d && (
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
                        <span style={{ fontSize: 11, color: isHoliday ? '#b91c1c' : di === 6 ? '#1d4ed8' : C.muted, fontWeight: 700 }}>{d}</span>
                        {status === 'available' && (
                          <span style={S.availCircle('o')} onClick={() => onSelectDay(new Date(year, month, d), selectedStaffId)}>○</span>
                        )}
                        {status === 'full' && <span style={S.availCircle('x')}>×</span>}
                        {status === 'closed' && <span style={S.availCircle('dash')}>—</span>}
                        {status === 'unknown' && <span style={{ fontSize: 9, color: C.muted }}>—</span>}
                      </div>
                    )}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
      <div style={S.noteInfo}>○ = 空きあり　× = 満員　— = 定休日</div>
    </div>
  );
}

// ============================================================
// 日ビュー画面（時間帯選択）
// ============================================================
function CalDayScreen({ availability, currentDate, staffList, menuList, onSelectSlot, onBack, selectedStaffId: preSelectedStaffId }) {
  const pad = n => String(n).padStart(2, '0');
  const dateStr = `${currentDate.getFullYear()}-${pad(currentDate.getMonth() + 1)}-${pad(currentDate.getDate())}`;
  const DAY_NAMES = ['日', '月', '火', '水', '木', '金', '土'];
  const dayData = availability[dateStr] || {};

  // 施術者フィルタ適用（指名なし含む）
  const allSlots = {};

  // 指名なし枠
  if (!preSelectedStaffId || preSelectedStaffId === 'all') {
    (dayData['any'] || []).forEach(slot => {
      if (!allSlots[slot]) allSlots[slot] = [];
      allSlots[slot].push({ staffId: '', name: '指名なし' });
    });
  }

  const filteredStaff = (preSelectedStaffId && preSelectedStaffId !== 'all')
    ? staffList.filter(s => s.staffId === preSelectedStaffId)
    : staffList;

  filteredStaff.forEach(s => {
    (dayData[s.staffId] || []).forEach(slot => {
      if (!allSlots[slot]) allSlots[slot] = [];
      allSlots[slot].push(s);
    });
  });

  const sortedSlots = Object.keys(allSlots).sort();

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
        <button style={{ background: 'none', border: `1.5px solid ${C.border}`, borderRadius: 4, padding: '3px 10px', cursor: 'pointer' }} onClick={onBack}>≪ 戻る</button>
        <span style={{ fontWeight: 700 }}>
          {currentDate.getMonth() + 1}月{currentDate.getDate()}日（{DAY_NAMES[currentDate.getDay()]}）の空き時間
        </span>
      </div>

      {sortedSlots.length === 0 ? (
        <div style={S.noteInfo}>この日は空きがありません</div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {sortedSlots.map(slot => (
            <div key={slot} style={S.card}>
              <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 8 }}>{slot}</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {allSlots[slot].map((s, idx) => (
                  <button key={s.staffId || idx} style={{ ...S.btn('primary'), gap: 6 }}
                    onClick={() => onSelectSlot(dateStr, slot, s.staffId)}>
                    {s.name}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ============================================================
// 予約入力フォーム
// ============================================================
function BookingFormScreen({ date, slot, staffId, staffList, menuList, user, onBack, onComplete, defaultMenuId }) {
  const staff = staffList.find(s => s.staffId === staffId);
  const [form, setForm] = useState({
    menuId: defaultMenuId || menuList[0]?.menuId || '',
    userName: user?.name || '',
    userPhone: user?.phone || '',
    userEmail: user?.email || '',
    note: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const set = (key, val) => setForm(prev => ({ ...prev, [key]: val }));

  const handleSubmit = async () => {
    if (!form.menuId || !form.userName) { setError('コースとお名前は必須です'); return; }
    setLoading(true);
    const res = await apiPost({
      action: 'createBooking',
      datetime: `${date} ${slot}`,
      staffId: staffId || '',
      menuId: form.menuId,
      userName: form.userName,
      userPhone: form.userPhone,
      userEmail: form.userEmail,
      lineUserId: user?.lineUserId || '',
      note: form.note,
    });
    if (res.success) {
      onComplete(res.data.bookingId);
    } else {
      setError(res.error?.message || '予約の登録に失敗しました');
    }
    setLoading(false);
  };

  // 指名なしの場合は全メニュー、施術者指定の場合は担当メニューのみ
  const staffMenuIds = (staff?.menus || '').split(',').map(m => m.trim()).filter(Boolean);
  const availMenus = (!staffId || staffId === 'any' || staffId === '' || staffMenuIds.length === 0)
    ? menuList
    : menuList.filter(m => staffMenuIds.includes(m.menuId));

  const staffLabel = (!staffId || staffId === 'any' || staffId === '') ? '指名なし' : (staff?.name || '—');

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
        <button style={{ background: 'none', border: `1.5px solid ${C.border}`, borderRadius: 4, padding: '3px 10px', cursor: 'pointer' }} onClick={onBack}>≪ 戻る</button>
        <span style={{ fontWeight: 700 }}>予約内容の入力</span>
      </div>
      <div style={{ ...S.noteInfo, marginBottom: 12 }}>
        📅 {date} {slot} ／ 担当：{staffLabel}
      </div>
      {error && <p style={{ color: C.danger, fontSize: 12, marginBottom: 8 }}>{error}</p>}
      <table style={S.formTbl}>
        <tbody>
          <tr>
            <th style={S.formTh}>コース<span style={{ color: C.danger, fontSize: 11 }}>*</span></th>
            <td style={S.formTd}>
              <select style={S.formInput} value={form.menuId} onChange={e => set('menuId', e.target.value)}>
                {(availMenus.length > 0 ? availMenus : menuList).map(m => (
                  <option key={m.menuId} value={m.menuId}>{m.name}（{m.durationMin}分）</option>
                ))}
              </select>
            </td>
          </tr>
          <tr>
            <th style={S.formTh}>お名前<span style={{ color: C.danger, fontSize: 11 }}>*</span></th>
            <td style={S.formTd}>
              <input style={S.formInput} type="text" placeholder="山田太郎" value={form.userName} onChange={e => set('userName', e.target.value)} />
              {user && <span style={{ color: C.muted, fontSize: 11.5, fontStyle: 'italic', display: 'block', marginTop: 3 }}>登録情報から自動入力</span>}
            </td>
          </tr>
          <tr>
            <th style={S.formTh}>電話番号</th>
            <td style={S.formTd}><input style={S.formInput} type="tel" placeholder="09012345678" value={form.userPhone} onChange={e => set('userPhone', e.target.value)} /></td>
          </tr>
          <tr>
            <th style={S.formTh}>E-Mail</th>
            <td style={S.formTd}><input style={S.formInput} type="email" placeholder="yamada@example.com" value={form.userEmail} onChange={e => set('userEmail', e.target.value)} /></td>
          </tr>
          <tr>
            <th style={S.formTh}>要望・備考</th>
            <td style={S.formTd}><textarea style={{ ...S.formInput, height: 60 }} placeholder="気になる症状など" value={form.note} onChange={e => set('note', e.target.value)} /></td>
          </tr>
        </tbody>
      </table>
      <div style={S.btnRow}>
        <button style={S.btn('gray')} onClick={onBack}>キャンセル</button>
        <button style={{ ...S.btn('primary'), marginLeft: 'auto' }} onClick={handleSubmit}>
          {loading ? '送信中...' : '予約を確定する'}
        </button>
      </div>
    </div>
  );
}

// ============================================================
// 予約完了画面
// ============================================================
function BookingCompleteScreen({ bookingId, onBack, storePhone }) {
  return (
    <div style={{ textAlign: 'center', padding: '32px 16px' }}>
      <div style={{ fontSize: 48, marginBottom: 16 }}>✅</div>
      <h3 style={{ fontSize: 18, fontWeight: 700, color: C.primary, marginBottom: 12 }}>ご予約が完了しました</h3>
      <p style={{ color: C.muted, fontSize: 13, marginBottom: 8 }}>予約IDをお控えください</p>
      <div style={{ background: C.primaryPale, color: C.primary, borderRadius: 8, padding: '12px 20px', fontWeight: 700, fontSize: 14, marginBottom: 20 }}>
        {bookingId}
      </div>
      {storePhone && <div style={S.noteInfo}>📞 ご不明な点は {storePhone} までお問い合わせください。</div>}
      <div style={S.btnRow}>
        <button style={{ ...S.btn('primary'), margin: '12px auto 0' }} onClick={onBack}>予約カレンダーに戻る</button>
      </div>
    </div>
  );
}

// ============================================================
// 日時フォーマットヘルパー
// ============================================================
function formatDatetime(raw) {
  if (!raw) return '—';
  if (/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}/.test(String(raw))) return String(raw).substring(0, 16);
  const d = new Date(raw);
  if (isNaN(d.getTime())) return String(raw);
  const pad = n => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

// ============================================================
// 予約確認画面（一括キャンセル対応）
// ============================================================
function BookingConfirmScreen({ user, onCancel, staffList, menuList }) {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [bulkMode, setBulkMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [cancelLoading, setCancelLoading] = useState(false);

  const fetchBookings = async () => {
    if (!user?.userId) { setLoading(false); return; }
    const res = await apiGet({ action: 'getUserBookings', userId: user.userId });
    if (res.success) setBookings(res.data.bookings || []);
    setLoading(false);
  };

  useEffect(() => { fetchBookings(); }, [user]);

  const getStaffName = (staffId) => {
    if (!staffId || staffId === 'any' || staffId === '') return '指名なし';
    const s = (staffList || []).find(s => s.staffId === staffId);
    return s ? s.name : '指名なし';
  };

  const getMenuName = (menuId) => {
    const m = (menuList || []).find(m => m.menuId === menuId);
    return m ? m.name : menuId;
  };

  const toggleSelect = (bookingId) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      next.has(bookingId) ? next.delete(bookingId) : next.add(bookingId);
      return next;
    });
  };

  const cancelableBookings = bookings.filter(b =>
    b.status !== 'キャンセル' && b.status !== '完了' &&
    new Date((b.datetime || '').replace(' ', 'T')) >= new Date()
  );

  const handleBulkCancel = async () => {
    if (selectedIds.size === 0) return;
    if (!window.confirm(`${selectedIds.size}件の予約をキャンセルしますか？`)) return;
    setCancelLoading(true);
    for (const bookingId of selectedIds) {
      await apiPost({ action: 'cancelBooking', bookingId, lineUserId: user?.lineUserId || '' });
    }
    setBookings(prev => prev.map(b =>
      selectedIds.has(b.bookingId) ? { ...b, status: 'キャンセル' } : b
    ));
    setSelectedIds(new Set());
    setBulkMode(false);
    setCancelLoading(false);
  };

  if (loading) return <p>読み込み中...</p>;
  if (!user) return <div style={S.noteInfo}>ログインしてご自身の予約を確認できます。</div>;

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
        <h3 style={{ fontWeight: 700, color: C.primary }}>📋 ご予約一覧</h3>
        {cancelableBookings.length > 0 && (
          <button
            onClick={() => { setBulkMode(p => !p); setSelectedIds(new Set()); }}
            style={{ ...S.btn(bulkMode ? 'gray' : 'danger'), fontSize: 11, padding: '4px 10px' }}>
            {bulkMode ? '選択解除' : '☑ 一括キャンセル'}
          </button>
        )}
      </div>

      {bulkMode && (
        <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 12, padding: '8px 12px', background: '#fef2f2', borderRadius: 8, border: `1px solid ${C.danger}` }}>
          <span style={{ fontSize: 12, flex: 1, color: C.danger }}>
            {selectedIds.size > 0 ? `${selectedIds.size}件選択中` : 'キャンセルする予約を選択してください'}
          </span>
          <button
            onClick={handleBulkCancel}
            disabled={selectedIds.size === 0 || cancelLoading}
            style={{ ...S.btn('danger'), fontSize: 11, padding: '4px 12px', opacity: selectedIds.size === 0 ? 0.5 : 1 }}>
            {cancelLoading ? 'キャンセル中...' : 'キャンセル実行'}
          </button>
        </div>
      )}

      {bookings.length === 0 ? (
        <div style={S.noteInfo}>現在ご予約はありません</div>
      ) : bookings.map(b => {
        const isPast = new Date((b.datetime || '').replace(' ', 'T')) < new Date();
        const canCancel = b.status !== 'キャンセル' && b.status !== '完了' && !isPast;
        return (
          <div key={b.bookingId}
            style={{
              ...S.card, cursor: 'pointer',
              opacity: b.status === 'キャンセル' ? 0.6 : 1,
              borderLeft: b.status === 'キャンセル' ? `4px solid ${C.danger}` : `4px solid ${C.primary}`,
              background: selectedIds.has(b.bookingId) ? '#fef2f2' : C.surface,
            }}
            onClick={() => bulkMode && canCancel ? toggleSelect(b.bookingId) : setSelectedBooking(b)}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
              {bulkMode && canCancel && (
                <div style={{
                  width: 20, height: 20, borderRadius: 4, flexShrink: 0, marginTop: 2,
                  border: `2px solid ${selectedIds.has(b.bookingId) ? C.danger : C.border}`,
                  background: selectedIds.has(b.bookingId) ? C.danger : '#fff',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  {selectedIds.has(b.bookingId) && <span style={{ color: '#fff', fontSize: 12 }}>✓</span>}
                </div>
              )}
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 700, marginBottom: 4 }}>{formatDatetime(b.datetime)}</div>
                <div style={{ color: C.muted, fontSize: 12 }}>{getMenuName(b.menuId)} ／ {getStaffName(b.staffId)}</div>
                <div style={{ marginTop: 4 }}>
                  <span style={{
                    display: 'inline-block', padding: '2px 8px', borderRadius: 20, fontSize: 10.5, fontWeight: 700,
                    background: b.status === 'キャンセル' ? '#fee2e2' : '#d1fae5',
                    color: b.status === 'キャンセル' ? C.danger : '#065f46',
                  }}>
                    {b.status}
                  </span>
                </div>
              </div>
            </div>
          </div>
        );
      })}

      {/* 予約詳細モーダル */}
      {selectedBooking && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.4)', display: 'flex', alignItems: 'flex-end', zIndex: 1000 }}>
          <div style={{ background: '#fff', borderRadius: '16px 16px 0 0', padding: '20px 16px', width: '100%', maxWidth: 480, margin: '0 auto' }}>
            <h3 style={{ fontWeight: 700, color: C.primary, marginBottom: 12 }}>予約詳細</h3>
            <table style={S.formTbl}>
              <tbody>
                <tr><th style={S.formTh}>日時</th><td style={S.formTd}>{formatDatetime(selectedBooking.datetime)}</td></tr>
                <tr><th style={S.formTh}>担当</th><td style={S.formTd}>{getStaffName(selectedBooking.staffId)}</td></tr>
                <tr><th style={S.formTh}>コース</th><td style={S.formTd}>{getMenuName(selectedBooking.menuId)}</td></tr>
                <tr><th style={S.formTh}>要望・備考</th><td style={S.formTd}>{selectedBooking.note || '—'}</td></tr>
              </tbody>
            </table>
            <div style={S.btnRow}>
              {selectedBooking.status !== 'キャンセル' && new Date((selectedBooking.datetime || '').replace(' ', 'T')) >= new Date() && (
                <button style={S.btn('danger')} onClick={async () => {
                  if (!window.confirm('この予約をキャンセルしますか？')) return;
                  await onCancel(selectedBooking.bookingId);
                  setSelectedBooking(null);
                  setBookings(prev => prev.map(b =>
                    b.bookingId === selectedBooking.bookingId ? { ...b, status: 'キャンセル' } : b
                  ));
                }}>予約取り消し</button>
              )}
              <button style={{ ...S.btn('gray'), marginLeft: 'auto' }} onClick={() => setSelectedBooking(null)}>閉じる</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ============================================================
// 利用者登録画面
// ============================================================
function RegisterScreen({ onRegister, onBackToLogin }) {
  const [form, setForm] = useState({ name: '', nameKana: '', birthdate: '', phone: '', email: '', password: '', passwordConfirm: '', lineUserId: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const set = (key, val) => setForm(prev => ({ ...prev, [key]: val }));

  const handleRegister = async () => {
    if (!form.name || !form.nameKana || !form.email || !form.password) {
      setError('必須項目（氏名・ふりがな・メール・パスワード）を入力してください');
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      setError('メールアドレスの形式が正しくありません');
      return;
    }
    if (form.password.length < 8) {
      setError('パスワードは8文字以上で入力してください');
      return;
    }
    if (form.password !== form.passwordConfirm) {
      setError('パスワードが一致しません');
      return;
    }
    setLoading(true);
    setError('');
    const res = await apiPost({ action: 'registerUser', ...form });
    if (res.success) {
      setDone(true);
      setTimeout(() => onRegister(res.data), 1500);
    } else {
      setError(res.error?.message || '登録に失敗しました');
    }
    setLoading(false);
  };

  const R = <span style={{ color: C.danger, fontSize: 11 }}>*</span>;

  if (done) {
    return (
      <div style={{ textAlign: 'center', padding: '40px 16px' }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>🎉</div>
        <h3 style={{ fontSize: 16, fontWeight: 700, color: C.primary, marginBottom: 8 }}>登録が完了しました！</h3>
        <p style={{ color: C.muted, fontSize: 13 }}>そのまま予約画面へ移動します...</p>
      </div>
    );
  }

  return (
    <div>
      {onBackToLogin && (
        <div style={{ marginBottom: 12 }}>
          <button style={{ background: 'none', border: 'none', color: C.primary, fontSize: 12, cursor: 'pointer', padding: 0, textDecoration: 'underline' }}
            onClick={onBackToLogin}>← ログイン画面に戻る</button>
        </div>
      )}
      <h3 style={{ fontWeight: 700, color: C.primary, marginBottom: 4 }}>利用者登録</h3>
      <p style={{ fontSize: 11.5, color: C.muted, marginBottom: 12 }}>登録後はメールアドレスとパスワードでログインできます</p>
      {error && (
        <div style={{ background: '#fef2f2', border: `1px solid ${C.danger}`, borderRadius: 6, padding: '8px 12px', fontSize: 12, color: C.danger, marginBottom: 12 }}>
          {error}
        </div>
      )}
      <table style={S.formTbl}>
        <tbody>
          <tr><th style={S.formTh}>氏名{R}</th><td style={S.formTd}><input style={S.formInput} type="text" placeholder="山田太郎" value={form.name} onChange={e => set('name', e.target.value)} /></td></tr>
          <tr><th style={S.formTh}>ふりがな{R}</th><td style={S.formTd}><input style={S.formInput} type="text" placeholder="やまだたろう" value={form.nameKana} onChange={e => set('nameKana', e.target.value)} /></td></tr>
          <tr><th style={S.formTh}>生年月日</th><td style={S.formTd}><input style={S.formInput} type="date" value={form.birthdate} onChange={e => set('birthdate', e.target.value)} /></td></tr>
          <tr><th style={S.formTh}>電話番号</th><td style={S.formTd}><input style={S.formInput} type="tel" placeholder="09012345678" value={form.phone} onChange={e => set('phone', e.target.value)} /></td></tr>
          <tr><th style={S.formTh}>E-Mail{R}</th><td style={S.formTd}><input style={S.formInput} type="email" placeholder="yamada@example.com" value={form.email} onChange={e => set('email', e.target.value)} /></td></tr>
          <tr><th style={S.formTh}>パスワード{R}</th><td style={S.formTd}><input style={S.formInput} type="password" placeholder="8文字以上" value={form.password} onChange={e => set('password', e.target.value)} /></td></tr>
          <tr><th style={S.formTh}>確認用{R}</th><td style={S.formTd}><input style={S.formInput} type="password" placeholder="もう一度入力" value={form.passwordConfirm} onChange={e => set('passwordConfirm', e.target.value)} /></td></tr>
          <tr><th style={S.formTh}>LINE ID</th><td style={S.formTd}>
            <input style={S.formInput} type="text" placeholder="任意（LINE連携する場合）" value={form.lineUserId} onChange={e => set('lineUserId', e.target.value)} />
            <span style={{ color: C.muted, fontSize: 11, display: 'block', marginTop: 3 }}>LINEでログインの場合は自動入力</span>
          </td></tr>
        </tbody>
      </table>
      <div style={S.btnRow}>
        <button style={{ ...S.btn('primary'), width: '100%', justifyContent: 'center', padding: '10px 0', fontSize: 14 }}
          onClick={handleRegister}>
          {loading ? '登録中...' : '登録する'}
        </button>
      </div>
    </div>
  );
}

// ============================================================
// 問い合わせ画面
// ============================================================
function InquiryScreen({ storePhone }) {
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [sent, setSent] = useState(false);

  if (sent) {
    return (
      <div style={{ textAlign: 'center', padding: '32px 0' }}>
        <div style={{ fontSize: 40, marginBottom: 12 }}>📨</div>
        <p style={{ fontWeight: 700, color: C.primary }}>送信しました</p>
        <p style={{ color: C.muted, fontSize: 12 }}>担当者よりご連絡いたします</p>
      </div>
    );
  }

  return (
    <div>
      <h3 style={{ fontWeight: 700, color: C.primary, marginBottom: 12 }}>問い合わせ</h3>
      <div style={S.card}>
        <div style={{ fontSize: 13, fontWeight: 700, color: C.primary, marginBottom: 6 }}>📞 お電話</div>
        <p style={{ fontSize: 15, fontWeight: 700, color: C.primary }}>{storePhone || '—'}</p>
      </div>
      <table style={S.formTbl}>
        <tbody>
          <tr><th style={S.formTh}>件名</th><td style={S.formTd}><input style={S.formInput} type="text" placeholder="お問い合わせ件名" value={subject} onChange={e => setSubject(e.target.value)} /></td></tr>
          <tr><th style={S.formTh}>内容</th><td style={S.formTd}><textarea style={{ ...S.formInput, height: 100 }} placeholder="内容を入力してください" value={body} onChange={e => setBody(e.target.value)} /></td></tr>
        </tbody>
      </table>
      <div style={S.note}>送信先：店舗アカウントのE-Mailへ送信されます</div>
      <div style={S.btnRow}>
        <button style={S.btn('gray')}>キャンセル</button>
        <button style={{ ...S.btn('primary'), marginLeft: 'auto' }} onClick={() => setSent(true)}>送信</button>
      </div>
    </div>
  );
}

// ============================================================
// メインコンポーネント
// ============================================================
export default function BookingCalendar() {
  const [page, setPage]           = useState('login');
  const [user, setUser]           = useState(null);
  const [availability, setAvail]  = useState({});
  const [staffList, setStaffList] = useState([]);
  const [menuList, setMenuList]   = useState([]);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [selectedStaffId, setSelectedStaffId] = useState(null);
  const [selectedMenuId, setSelectedMenuId] = useState('');
  const [completedBookingId, setCompletedBookingId] = useState(null);
  const [navPage, setNavPage] = useState('cal');
  const [storePhone, setStorePhone] = useState('');

  useEffect(() => {
    apiGet({ action: 'getSettings' }).then(res => {
      if (res.success) setStorePhone(res.data?.settings?.['店舗電話番号'] || '');
    });
  }, []);

  // 初期データ取得
  useEffect(() => {
    Promise.all([
      apiGet({ action: 'getStaff' }).then(r => r.success && setStaffList(r.data.staff)),
      apiGet({ action: 'getMenus' }).then(r => r.success && setMenuList(r.data.menus)),
    ]);
  }, []);

  // 空き状況取得
  const fetchAvailability = useCallback(async (date) => {
    const d = date || currentDate;
    const res = await apiGet({ action: 'getAvailability', year: d.getFullYear(), month: d.getMonth() + 1 });
    if (res.success) setAvail(res.data.availability);
  }, [currentDate]);

  useEffect(() => { fetchAvailability(); }, [fetchAvailability]);

  // ログイン・登録処理
  const handleLogin      = (userData) => { setUser(userData); setPage('course'); setNavPage('cal'); };
  const handleGuestBook  = () => { setPage('course'); setNavPage('cal'); };
  const handleLogout     = () => { setUser(null); setPage('login'); };
  const handleGoRegister = () => { setPage('register-pre'); };

  // ナビゲーション
  const handleNav = (key) => {
    if (key === 'logout') { handleLogout(); return; }
    setNavPage(key);
    if (key === 'cal')           setPage('course');
    else if (key === 'confirm')  setPage('confirm');
    else if (key === 'register') setPage('register');
    else if (key === 'inquiry')  setPage('inquiry');
  };

  // ページタイトル取得
  const getTitle = () => {
    const titles = {
      course: 'コース選択', cal: '予約', calDay: '日程選択',
      form: '予約入力', complete: '予約完了',
      confirm: '予約確認', register: '利用者登録',
      'register-pre': '新規登録', inquiry: '問い合わせ',
    };
    return titles[page] || '予約システム';
  };

  // ログイン画面（ナビなし）
  if (page === 'login') {
    return <LoginScreen onLineLogin={() => {}} onEmailLogin={handleLogin} onGuestBook={handleGuestBook} onGoRegister={handleGoRegister} />;
  }

  // ログイン前の新規登録画面（ナビなし）
  if (page === 'register-pre') {
    return (
      <div style={S.wrap}>
        <div style={S.header}>
          <button style={S.backBtn} onClick={() => setPage('login')}>‹</button>
          <h3 style={S.headerTitle}>新規登録</h3>
        </div>
        <div style={S.body}>
          <RegisterScreen
            onRegister={userData => { setUser(userData); setPage('course'); setNavPage('cal'); }}
            onBackToLogin={() => setPage('login')}
          />
        </div>
      </div>
    );
  }

  return (
    <div style={S.wrap}>
      {/* ヘッダー */}
      <div style={S.header}>
        {(page === 'cal' || page === 'calDay' || page === 'form') && (
          <button style={S.backBtn} onClick={() => {
            if (page === 'form') setPage('calDay');
            else if (page === 'calDay') setPage('cal');
            else if (page === 'cal') setPage('course');
          }}>‹</button>
        )}
        <h3 style={S.headerTitle}>{getTitle()}</h3>
        {user && <span style={{ fontSize: 11, opacity: 0.8 }}>{user.name} 様</span>}
        {storePhone && <span style={{ fontSize: 10, opacity: 0.8 }}>📞 {storePhone}</span>}
      </div>

      {/* コンテンツ */}
      <div style={S.body}>
        {/* コース選択 */}
        {page === 'course' && (
          <CourseSelectScreen
            menuList={menuList}
            selectedMenuId={selectedMenuId}
            onSelectMenu={(menuId) => { setSelectedMenuId(menuId); setPage('cal'); }}
          />
        )}

        {/* 月カレンダー */}
        {page === 'cal' && (
          <CalMonthScreen
            availability={availability}
            currentDate={currentDate}
            staffList={staffList}
            onChangeDate={d => { setCurrentDate(d); fetchAvailability(d); }}
            onSelectDay={(d, staffId) => {
              setSelectedDate(d);
              setSelectedStaffId(staffId === 'all' ? null : staffId);
              setPage('calDay');
            }}
          />
        )}

        {/* 日ビュー */}
        {page === 'calDay' && selectedDate && (
          <CalDayScreen
            availability={availability}
            currentDate={selectedDate}
            staffList={staffList}
            menuList={menuList}
            selectedStaffId={selectedStaffId}
            onSelectSlot={(date, slot, staffId) => {
              setSelectedSlot(slot);
              setSelectedStaffId(staffId);
              setPage('form');
            }}
            onBack={() => setPage('cal')}
          />
        )}

        {/* 予約入力フォーム */}
        {page === 'form' && (
          <BookingFormScreen
            date={selectedDate ? `${selectedDate.getFullYear()}-${String(selectedDate.getMonth() + 1).padStart(2, '0')}-${String(selectedDate.getDate()).padStart(2, '0')}` : ''}
            slot={selectedSlot}
            staffId={selectedStaffId}
            staffList={staffList}
            menuList={menuList}
            defaultMenuId={selectedMenuId}
            user={user}
            onBack={() => setPage('calDay')}
            onComplete={id => { setCompletedBookingId(id); setPage('complete'); }}
          />
        )}

        {/* 予約完了 */}
        {page === 'complete' && (
          <BookingCompleteScreen bookingId={completedBookingId} onBack={() => { setPage('course'); setNavPage('cal'); }} storePhone={storePhone} />
        )}

        {/* 予約確認 */}
        {page === 'confirm' && (
          <BookingConfirmScreen
            user={user}
            staffList={staffList}
            menuList={menuList}
            onCancel={async (id) => {
              await apiPost({ action: 'cancelBooking', bookingId: id });
            }}
          />
        )}

        {/* 利用者登録 */}
        {page === 'register' && (
          <RegisterScreen
            onRegister={userData => { setUser(userData); setPage('course'); setNavPage('cal'); }}
            onBackToLogin={null}
          />
        )}

        {/* 問い合わせ */}
        {page === 'inquiry' && <InquiryScreen storePhone={storePhone} />}
      </div>

      {/* ボトムナビ */}
      <nav style={S.nav}>
        {NAV.map(item => (
          <a key={item.key} style={S.navLink(navPage === item.key)} onClick={() => handleNav(item.key)}>
            <span style={S.navIcon}>{item.icon}</span>
            {item.label}
          </a>
        ))}
      </nav>
    </div>
  );
}