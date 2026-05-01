// ============================================================
// line_liff_booking_v4.jsx
// LINE LIFF予約UI（月カレンダー形式・空き状況○△×表示）
// v4: 予約確認UI・キャンセル機能・コース選択UI改善
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
  primary: '#1a4f8a',
  primaryPale: '#dbeafe',
  success: '#059669',
  successPale: '#d1fae5',
  danger: '#dc2626',
  dangerPale: '#fee2e2',
  warning: '#f59e0b',
  border: '#cbd5e1',
  text: '#1e293b',
  muted: '#64748b',
  surface: '#fff',
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
  header: {
    background: C.primary,
    color: '#fff',
    padding: '14px 16px',
    display: 'flex',
    alignItems: 'center',
    gap: 10,
  },
  headerTitle: { fontSize: 16, fontWeight: 700, flex: 1 },
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
      primary: { background: C.primary, color: '#fff' },
      success: { background: C.success, color: '#fff' },
      danger:  { background: C.danger,  color: '#fff' },
      gray:    { background: '#e2e8f0', color: C.text },
      line:    { background: '#06C755', color: '#fff' },
      outline: { background: '#fff', color: C.primary, border: `1.5px solid ${C.primary}` },
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
// 予約ステータスのバッジ表示ヘルパー
// ============================================================
function StatusBadge({ status }) {
  const config = {
    '予約済み': { bg: C.primaryPale, color: C.primary, icon: '📅' },
    'キャンセル': { bg: C.dangerPale, color: C.danger, icon: '✕' },
    '完了': { bg: C.successPale, color: C.success, icon: '✓' },
  };
  const c = config[status] || { bg: '#f1f5f9', color: C.muted, icon: '?' };
  return (
    <span style={{
      display: 'inline-flex',
      alignItems: 'center',
      gap: 3,
      background: c.bg,
      color: c.color,
      borderRadius: 20,
      padding: '2px 10px',
      fontSize: 11,
      fontWeight: 700,
    }}>
      {c.icon} {status || '予約済み'}
    </span>
  );
}

// ============================================================
// キャンセル確認モーダル
// ============================================================
function CancelModal({ booking, onConfirm, onClose, loading }) {
  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      background: 'rgba(0,0,0,0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
      padding: '0 16px',
    }}>
      <div style={{
        background: '#fff',
        borderRadius: 12,
        padding: '24px 20px',
        maxWidth: 360,
        width: '100%',
        boxShadow: '0 8px 32px rgba(0,0,0,0.2)',
      }}>
        {/* アイコン */}
        <div style={{ textAlign: 'center', fontSize: 40, marginBottom: 12 }}>⚠️</div>
        <h3 style={{ textAlign: 'center', fontSize: 16, fontWeight: 700, color: C.text, marginBottom: 8 }}>
          予約をキャンセルしますか？
        </h3>
        <p style={{ textAlign: 'center', fontSize: 12, color: C.muted, marginBottom: 16 }}>
          この操作は元に戻せません
        </p>
        {/* キャンセル対象の予約情報 */}
        <div style={{
          background: '#f8fafc',
          border: `1px solid ${C.border}`,
          borderRadius: 8,
          padding: '12px 14px',
          marginBottom: 20,
          fontSize: 13,
        }}>
          <div style={{ display: 'grid', gridTemplateColumns: '70px 1fr', gap: '6px 0' }}>
            <span style={{ color: C.muted }}>日時</span>
            <span style={{ fontWeight: 600 }}>{booking.datetime}</span>
            <span style={{ color: C.muted }}>コース</span>
            <span style={{ fontWeight: 600 }}>{booking.menu || '—'}</span>
            <span style={{ color: C.muted }}>担当者</span>
            <span style={{ fontWeight: 600 }}>{booking.staff || '指名なし'}</span>
          </div>
        </div>
        {/* ボタン */}
        <button
          onClick={onConfirm}
          disabled={loading}
          style={{
            ...S.btn('danger'),
            marginBottom: 8,
            opacity: loading ? 0.7 : 1,
          }}>
          {loading ? 'キャンセル中...' : 'キャンセルする'}
        </button>
        <button
          onClick={onClose}
          disabled={loading}
          style={{ ...S.btn('gray'), marginBottom: 0 }}>
          戻る
        </button>
      </div>
    </div>
  );
}

// ============================================================
// 予約カードコンポーネント（マイページ用）
// ============================================================
function BookingCard({ booking, onCancelClick }) {
  // 予約日時が過去かどうかを判定してキャンセルボタンの表示を制御
  const isPast = () => {
    if (!booking.datetime) return false;
    const bookingDate = new Date(booking.datetime.replace(' ', 'T'));
    return bookingDate < new Date();
  };

  const canCancel = booking.status !== 'キャンセル' && booking.status !== '完了' && !isPast();

  return (
    <div style={{
      ...S.card,
      borderLeft: booking.status === 'キャンセル'
        ? `4px solid ${C.danger}`
        : booking.status === '完了'
          ? `4px solid ${C.success}`
          : `4px solid ${C.primary}`,
    }}>
      {/* ヘッダー行：日時とステータス */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
        <div>
          <div style={{ fontSize: 15, fontWeight: 700, color: C.primary }}>
            {booking.datetime}
          </div>
          <div style={{ fontSize: 11, color: C.muted, marginTop: 2 }}>
            予約ID: {booking.bookingId}
          </div>
        </div>
        <StatusBadge status={booking.status} />
      </div>

      {/* 予約内容 */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '70px 1fr',
        gap: '5px 0',
        fontSize: 13,
        marginBottom: canCancel ? 12 : 0,
      }}>
        <span style={{ color: C.muted }}>コース</span>
        <span style={{ fontWeight: 600 }}>{booking.menu || '—'}</span>
        <span style={{ color: C.muted }}>担当者</span>
        <span style={{ fontWeight: 600 }}>{booking.staff || '指名なし'}</span>
        {booking.notes && (
          <>
            <span style={{ color: C.muted }}>備考</span>
            <span>{booking.notes}</span>
          </>
        )}
      </div>

      {/* キャンセルボタン */}
      {canCancel && (
        <button
          onClick={() => onCancelClick(booking)}
          style={{
            width: '100%',
            padding: '8px',
            border: `1.5px solid ${C.danger}`,
            borderRadius: 6,
            background: '#fff',
            color: C.danger,
            fontSize: 13,
            fontWeight: 700,
            cursor: 'pointer',
            fontFamily: 'inherit',
          }}>
          🗑 この予約をキャンセルする
        </button>
      )}
    </div>
  );
}

// ============================================================
// マイページ（予約確認）コンポーネント
// ============================================================
function MyPage({ lineProfile, onBack }) {
  const [bookings, setBookings]           = useState([]);
  const [loading, setLoading]             = useState(true);
  const [cancelTarget, setCancelTarget]   = useState(null);  // キャンセル対象の予約
  const [cancelLoading, setCancelLoading] = useState(false);
  const [cancelDone, setCancelDone]       = useState(false);
  const [error, setError]                 = useState('');
  const [filter, setFilter]               = useState('upcoming'); // 'upcoming' | 'all'

  // 予約一覧を取得
  const fetchBookings = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await apiGet({
        action: 'getUserBookings',
        lineUserId: lineProfile?.userId || '',
      });
      if (res.success) {
        setBookings(res.data.bookings || []);
      } else {
        setError('予約の取得に失敗しました');
      }
    } catch (e) {
      setError('通信エラーが発生しました');
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchBookings();
  }, []);

  // キャンセル実行
  const handleCancel = async () => {
    if (!cancelTarget) return;
    setCancelLoading(true);
    setError('');
    try {
      const res = await apiPost({
        action: 'cancelBooking',
        bookingId: cancelTarget.bookingId,
        lineUserId: lineProfile?.userId || '',
      });
      if (res.success) {
        setCancelDone(true);
        // 一覧を再取得して最新状態に更新
        await fetchBookings();
        // モーダルを閉じる
        setTimeout(() => {
          setCancelTarget(null);
          setCancelDone(false);
        }, 1500);
      } else {
        setError(res.error?.message || 'キャンセルに失敗しました');
        setCancelTarget(null);
      }
    } catch (e) {
      setError('通信エラーが発生しました');
      setCancelTarget(null);
    }
    setCancelLoading(false);
  };

  // フィルタリング：今後の予約のみ or 全件
  const now = new Date();
  const filteredBookings = bookings.filter(b => {
    if (filter === 'all') return true;
    // 'upcoming'：キャンセル・完了を除いた未来の予約
    if (b.status === 'キャンセル' || b.status === '完了') return false;
    const d = new Date((b.datetime || '').replace(' ', 'T'));
    return d >= now;
  });

  return (
    <div style={S.wrap}>
      {/* ヘッダー */}
      <div style={S.header}>
        <button
          onClick={onBack}
          style={{ background: 'none', border: 'none', color: '#fff', fontSize: 20, cursor: 'pointer', padding: '0 4px' }}>
          ‹
        </button>
        <h3 style={S.headerTitle}>予約確認</h3>
        {lineProfile && (
          <span style={{ fontSize: 11, opacity: 0.8 }}>{lineProfile.displayName} 様</span>
        )}
      </div>

      <div style={S.body}>
        {/* フィルタータブ */}
        <div style={{
          display: 'flex',
          gap: 0,
          marginBottom: 16,
          border: `1.5px solid ${C.primary}`,
          borderRadius: 8,
          overflow: 'hidden',
        }}>
          {[
            { key: 'upcoming', label: '今後の予約' },
            { key: 'all',      label: 'すべて表示' },
          ].map(tab => (
            <button
              key={tab.key}
              onClick={() => setFilter(tab.key)}
              style={{
                flex: 1,
                padding: '10px 0',
                border: 'none',
                background: filter === tab.key ? C.primary : '#fff',
                color: filter === tab.key ? '#fff' : C.primary,
                fontSize: 13,
                fontWeight: 700,
                cursor: 'pointer',
                fontFamily: 'inherit',
                transition: 'all 0.15s',
              }}>
              {tab.label}
            </button>
          ))}
        </div>

        {/* エラー表示 */}
        {error && (
          <div style={{
            background: C.dangerPale,
            border: `1px solid ${C.danger}`,
            borderRadius: 8,
            padding: '10px 14px',
            fontSize: 13,
            color: C.danger,
            marginBottom: 12,
          }}>
            ⚠️ {error}
          </div>
        )}

        {/* 読み込み中 */}
        {loading ? (
          <div style={{ textAlign: 'center', padding: '48px 0', color: C.muted }}>
            <div style={{ fontSize: 32, marginBottom: 12 }}>📅</div>
            <div>予約を読み込み中...</div>
          </div>
        ) : filteredBookings.length === 0 ? (
          /* 予約なし */
          <div style={{ textAlign: 'center', padding: '48px 0', color: C.muted }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>📭</div>
            <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 8 }}>
              {filter === 'upcoming' ? '今後の予約はありません' : '予約履歴がありません'}
            </div>
            {filter === 'upcoming' && bookings.length > 0 && (
              <div style={{ fontSize: 12, marginTop: 8 }}>
                <span
                  onClick={() => setFilter('all')}
                  style={{ color: C.primary, textDecoration: 'underline', cursor: 'pointer' }}>
                  過去の予約を確認する
                </span>
              </div>
            )}
          </div>
        ) : (
          /* 予約一覧 */
          <div>
            <div style={{ fontSize: 12, color: C.muted, marginBottom: 12 }}>
              {filteredBookings.length}件の予約
            </div>
            {filteredBookings.map(b => (
              <BookingCard
                key={b.bookingId}
                booking={b}
                onCancelClick={setCancelTarget}
              />
            ))}
          </div>
        )}

        {/* 新規予約ボタン */}
        <div style={{ marginTop: 16 }}>
          <button style={S.btn('primary')} onClick={onBack}>
            ＋ 新しく予約する
          </button>
        </div>
      </div>

      {/* キャンセル確認モーダル */}
      {cancelTarget && !cancelDone && (
        <CancelModal
          booking={cancelTarget}
          onConfirm={handleCancel}
          onClose={() => setCancelTarget(null)}
          loading={cancelLoading}
        />
      )}

      {/* キャンセル完了モーダル */}
      {cancelDone && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
        }}>
          <div style={{
            background: '#fff',
            borderRadius: 12,
            padding: '32px 24px',
            textAlign: 'center',
            maxWidth: 300,
            width: '90%',
          }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>✅</div>
            <div style={{ fontSize: 16, fontWeight: 700, color: C.success }}>
              キャンセルしました
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ============================================================
// 月カレンダーコンポーネント
// ============================================================
function BookingCalendar({ availability, selectedStaffId, onSelectDate, selectedDate, calDate, onChangeMonth }) {
  const DAY_LABELS = ['日', '月', '火', '水', '木', '金', '土'];
  const year  = calDate.getFullYear();
  const month = calDate.getMonth();
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const pad = n => String(n).padStart(2, '0');

  // 月の週配列を生成
  const firstDay    = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const weeks = [];
  let day = 1 - firstDay;
  while (day <= daysInMonth) {
    const week = [];
    for (let i = 0; i < 7; i++, day++) {
      week.push(day > 0 && day <= daysInMonth ? day : null);
    }
    weeks.push(week);
  }

  // 指定日の空きスロット数を計算
  const countSlots = (dateStr) => {
    const dayData = availability[dateStr];
    if (!dayData) return 0;
    if (selectedStaffId && selectedStaffId !== 'any') {
      return (dayData[selectedStaffId] || []).length;
    }
    // 指名なしの場合は全施術者の空きをユニークで合算
    const allSlots = Object.values(dayData).flat();
    return [...new Set(allSlots)].length;
  };

  return (
    <div>
      {/* 月ナビゲーション */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
        <button
          onClick={() => onChangeMonth(-1)}
          style={{ background: 'none', border: `1.5px solid ${C.border}`, borderRadius: 6, padding: '4px 12px', fontSize: 16, cursor: 'pointer' }}>
          ‹
        </button>
        <span style={{ fontSize: 15, fontWeight: 700, color: C.primary }}>
          {year}年{month + 1}月
        </span>
        <button
          onClick={() => onChangeMonth(1)}
          style={{ background: 'none', border: `1.5px solid ${C.border}`, borderRadius: 6, padding: '4px 12px', fontSize: 16, cursor: 'pointer' }}>
          ›
        </button>
      </div>

      {/* 凡例 */}
      <div style={{ display: 'flex', gap: 12, justifyContent: 'center', marginBottom: 10 }}>
        {[
          { mark: '○', color: C.success,  label: '空きあり' },
          { mark: '△', color: C.warning,  label: '残りわずか' },
          { mark: '×', color: C.danger,   label: '満席・休診' },
        ].map(item => (
          <div key={item.mark} style={{ display: 'flex', alignItems: 'center', gap: 3, fontSize: 11 }}>
            <span style={{ color: item.color, fontWeight: 700, fontSize: 13 }}>{item.mark}</span>
            <span style={{ color: C.muted }}>{item.label}</span>
          </div>
        ))}
      </div>

      {/* カレンダー本体 */}
      <table style={{ width: '100%', borderCollapse: 'collapse', tableLayout: 'fixed' }}>
        <thead>
          <tr>
            {DAY_LABELS.map((d, i) => (
              <th key={d} style={{
                padding: '6px 0',
                textAlign: 'center',
                fontSize: 12,
                fontWeight: 600,
                color: i === 0 ? '#b91c1c' : i === 6 ? '#1d4ed8' : C.muted,
              }}>
                {d}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {weeks.map((week, wi) => (
            <tr key={wi}>
              {week.map((d, di) => {
                if (!d) return <td key={di} />;

                const dateStr = `${year}-${pad(month + 1)}-${pad(d)}`;
                const dateObj = new Date(year, month, d);
                const isPast     = dateObj < today;
                const isSelected = selectedDate === dateStr;
                const slotCount  = isPast ? 0 : countSlots(dateStr);
                const avail      = isPast ? { mark: '—', color: C.border, label: '過去' } : getAvailMark(slotCount);
                const isDisabled = isPast || slotCount === 0;
                const isToday    = dateObj.getTime() === today.getTime();

                return (
                  <td key={di} style={{ padding: 3 }}>
                    <div
                      onClick={() => !isDisabled && onSelectDate(dateStr)}
                      style={{
                        textAlign: 'center',
                        borderRadius: 8,
                        padding: '6px 2px',
                        cursor: isDisabled ? 'default' : 'pointer',
                        background: isSelected
                          ? C.primary
                          : isToday
                            ? C.primaryPale
                            : '#fff',
                        border: isSelected
                          ? `2px solid ${C.primary}`
                          : isToday
                            ? `2px solid ${C.primary}`
                            : `1px solid ${C.border}`,
                        opacity: isPast ? 0.35 : 1,
                        transition: 'background 0.15s',
                      }}>
                      {/* 日付数字 */}
                      <div style={{
                        fontSize: 13,
                        fontWeight: isToday || isSelected ? 700 : 400,
                        color: isSelected
                          ? '#fff'
                          : di === 0 ? '#b91c1c'
                          : di === 6 ? '#1d4ed8'
                          : C.text,
                        lineHeight: 1.2,
                      }}>
                        {d}
                        {isToday && !isSelected && (
                          <span style={{ display: 'block', fontSize: 8, color: C.primary, fontWeight: 700, lineHeight: 1 }}>今日</span>
                        )}
                      </div>
                      {/* 空き状況マーク */}
                      <div style={{
                        fontSize: 14,
                        fontWeight: 700,
                        color: isSelected ? '#fff' : avail.color,
                        lineHeight: 1.2,
                        marginTop: 1,
                      }}>
                        {isPast ? '' : avail.mark}
                      </div>
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
  // 指定施術者または全員の空きスロットを収集
  let slots = [];
  if (selectedStaffId && selectedStaffId !== 'any') {
    slots = dayData[selectedStaffId] || [];
  } else {
    const all = Object.values(dayData).flat();
    slots = [...new Set(all)].sort();
  }

  if (slots.length === 0) {
    return <div style={{ ...S.note, marginTop: 12 }}>この日は空き枠がありません</div>;
  }

  return (
    <div style={{ marginTop: 16 }}>
      <div style={{ fontSize: 13, fontWeight: 700, color: C.primary, marginBottom: 8 }}>
        {selectedDate} の時間を選んでください
      </div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
        {slots.map(slot => {
          const isActive = slot === selectedSlot;
          return (
            <button
              key={slot}
              onClick={() => onSelectSlot(slot)}
              style={{
                padding: '8px 18px',
                border: `1.5px solid ${isActive ? C.primary : C.border}`,
                borderRadius: 20,
                background: isActive ? C.primary : '#fff',
                color: isActive ? '#fff' : C.text,
                fontSize: 13,
                fontWeight: isActive ? 700 : 400,
                cursor: 'pointer',
                fontFamily: 'inherit',
                transition: 'all 0.15s',
              }}>
              {slot}
            </button>
          );
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
    <div
      onClick={onClick}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 14,
        padding: '14px 16px',
        borderRadius: 10,
        background: isSelected ? C.primaryPale : '#f8fafc',
        border: `2px solid ${isSelected ? C.primary : C.border}`,
        marginBottom: 10,
        cursor: 'pointer',
        transition: 'all 0.15s',
        WebkitTapHighlightColor: 'transparent', // スマホのタップ時のハイライト除去
      }}>
      {/* カスタムラジオボタン */}
      <div style={{
        width: 22,
        height: 22,
        borderRadius: '50%',
        border: `2.5px solid ${isSelected ? C.primary : C.border}`,
        background: '#fff',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
        transition: 'all 0.15s',
      }}>
        {/* 選択時は内側に塗りつぶした円（●）を表示 */}
        {isSelected && (
          <div style={{
            width: 12,
            height: 12,
            borderRadius: '50%',
            background: C.primary,
          }} />
        )}
      </div>

      {/* コース情報 */}
      <div style={{ flex: 1 }}>
        <div style={{
          fontSize: 14,
          fontWeight: isSelected ? 700 : 600,
          color: isSelected ? C.primary : C.text,
          marginBottom: 2,
        }}>
          {menu.name}
        </div>
        <div style={{ fontSize: 12, color: C.muted }}>
          ⏱ {menu.durationMin}分
        </div>
      </div>

      {/* 選択済みチェックマーク */}
      {isSelected && (
        <div style={{
          color: C.primary,
          fontSize: 18,
          fontWeight: 700,
          flexShrink: 0,
        }}>
          ✓
        </div>
      )}
    </div>
  );
}

// ============================================================
// メインコンポーネント
// ============================================================
export default function LineLiffBooking() {
  const [liffReady, setLiffReady]           = useState(false);
  const [lineProfile, setLineProfile]       = useState(null);
  const [registeredUser, setRegisteredUser] = useState(null);
  const [step, setStep]                     = useState(1);
  const [menuList, setMenuList]             = useState([]);
  const [staffList, setStaffList]           = useState([]);
  // 月ごとの空き状況キャッシュ { 'YYYY-MM': { 'YYYY-MM-DD': { staffId: [slots] } } }
  const [availCache, setAvailCache]         = useState({});
  const [selection, setSelection]           = useState({ menuId: '', staffId: '', date: '', slot: '' });
  const [form, setForm]                     = useState({ name: '', phone: '', email: '' });
  const [error, setError]                   = useState('');
  const [loading, setLoading]               = useState(false);
  const [completed, setCompleted]           = useState(null);
  // カレンダーの表示月
  const [calDate, setCalDate]               = useState(new Date());
  // 空き状況の読み込み中フラグ
  const [availLoading, setAvailLoading]     = useState(false);
  // マイページ（予約確認）表示フラグ
  const [showMyPage, setShowMyPage]         = useState(false);

  // 指名なし判定（'any' または 未選択）
  const isNoStaff = !selection.staffId || selection.staffId === 'any';

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

  // 表示月が変わったら空き状況を取得（キャッシュ優先）
  useEffect(() => {
    const year  = calDate.getFullYear();
    const month = calDate.getMonth() + 1;
    const key   = `${year}-${String(month).padStart(2, '0')}`;
    if (availCache[key]) return; // キャッシュがあればスキップ

    setAvailLoading(true);
    apiGet({ action: 'getAvailability', year, month })
      .then(r => {
        if (r.success) {
          setAvailCache(prev => ({ ...prev, [key]: r.data.availability }));
        }
      })
      .finally(() => setAvailLoading(false));
  }, [calDate]);

  // 現在表示月のキャッシュキー
  const currentCacheKey = `${calDate.getFullYear()}-${String(calDate.getMonth() + 1).padStart(2, '0')}`;
  const availability    = availCache[currentCacheKey] || {};

  const set  = (key, val) => setSelection(prev => ({ ...prev, [key]: val }));
  const setF = (key, val) => setForm(prev => ({ ...prev, [key]: val }));

  // 月を移動（-1: 前月 / +1: 翌月）。過去月には戻らない
  const handleChangeMonth = (diff) => {
    setCalDate(prev => {
      const next = new Date(prev.getFullYear(), prev.getMonth() + diff, 1);
      const today = new Date();
      const minDate = new Date(today.getFullYear(), today.getMonth(), 1);
      if (next < minDate) return prev;
      return next;
    });
    // 月が変わったら日付・スロットをリセット
    set('date', '');
    set('slot', '');
  };

  // 予約送信
  const handleSubmit = async () => {
    if (!form.name) { setError('お名前は必須です'); return; }
    setLoading(true);
    // 指名なし（'any'）の場合は空文字を送信してGAS側でnullとして扱う
    const staffIdToSend = isNoStaff ? '' : selection.staffId;
    const res = await apiPost({
      action: 'createBooking',
      datetime: `${selection.date} ${selection.slot}`,
      staffId: staffIdToSend,
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
        try {
          await liff.sendMessages([{
            type: 'text',
            text: `予約が完了しました！\n予約ID：${res.data.bookingId}\n日時：${selection.date} ${selection.slot}`,
          }]);
        } catch (_) {}
      }
    } else {
      setError(res.error?.message || '予約に失敗しました');
    }
    setLoading(false);
  };

  // 選択済み情報の表示名
  const selectedMenu      = menuList.find(m => m.menuId === selection.menuId);
  const selectedStaff     = isNoStaff ? null : staffList.find(s => s.staffId === selection.staffId);
  const selectedStaffName = isNoStaff ? '指名なし' : (selectedStaff?.name || '—');

  // ─── マイページ表示 ───
  if (showMyPage) {
    return (
      <MyPage
        lineProfile={lineProfile}
        onBack={() => setShowMyPage(false)}
      />
    );
  }

  // ─── 完了画面 ───
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
          <button style={S.btn('primary')} onClick={() => {
            setCompleted(null);
            setStep(1);
            setSelection({ menuId: '', staffId: '', date: '', slot: '' });
            setCalDate(new Date());
          }}>
            最初に戻る
          </button>
          {/* 完了後に予約確認画面へのリンク */}
          <button style={S.btn('outline')} onClick={() => {
            setCompleted(null);
            setShowMyPage(true);
          }}>
            📋 予約を確認する
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
        {/* マイページボタン */}
        <button
          onClick={() => setShowMyPage(true)}
          style={{
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
          }}>
          📋 予約確認
        </button>
      </div>

      <div style={S.body}>
        {/* ステップインジケーター */}
        <div style={{ display: 'flex', gap: 4, marginBottom: 20, justifyContent: 'center' }}>
          {STEPS.map(s => (
            <div key={s.num} style={{
              width: 28,
              height: 5,
              borderRadius: 3,
              background: s.num <= step ? C.primary : C.border,
              transition: 'background .3s',
            }} />
          ))}
        </div>

        {/* ─── Step 1: コース選択（ラジオボタンUI改善） ─── */}
        {step === 1 && (
          <div>
            <h3 style={{ fontWeight: 700, color: C.primary, marginBottom: 4 }}>① コースを選んでください</h3>
            <p style={{ fontSize: 12, color: C.muted, marginBottom: 16 }}>
              ご希望のコースをタップしてください
            </p>
            {menuList.map(m => (
              <MenuRadioItem
                key={m.menuId}
                menu={m}
                selected={selection.menuId}
                onClick={() => { set('menuId', m.menuId); setStep(2); }}
              />
            ))}
          </div>
        )}

        {/* ─── Step 2: 担当者選択 ─── */}
        {step === 2 && (
          <div>
            <h3 style={{ fontWeight: 700, color: C.primary, marginBottom: 12 }}>② 担当者を選んでください</h3>
            {[
              { staffId: 'any', name: '指名なし（空き優先）' },
              ...staffList.filter(s => !selection.menuId || (s.menus || '').includes(selection.menuId)),
            ].map(s => (
              <div key={s.staffId} style={S.step(selection.staffId === s.staffId)}
                onClick={() => { set('staffId', s.staffId); setStep(3); }}>
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

        {/* ─── Step 3: 日時選択（月カレンダー） ─── */}
        {step === 3 && (
          <div>
            <h3 style={{ fontWeight: 700, color: C.primary, marginBottom: 12 }}>③ 日時を選んでください</h3>

            {/* 月カレンダー */}
            {availLoading ? (
              <div style={{ textAlign: 'center', padding: '24px 0', color: C.muted, fontSize: 13 }}>
                📅 空き状況を読み込み中...
              </div>
            ) : (
              <BookingCalendar
                availability={availability}
                selectedStaffId={selection.staffId}
                selectedDate={selection.date}
                calDate={calDate}
                onChangeMonth={handleChangeMonth}
                onSelectDate={(dateStr) => {
                  set('date', dateStr);
                  set('slot', '');
                }}
              />
            )}

            {/* 時間スロット選択 */}
            <SlotPicker
              availability={availability}
              selectedDate={selection.date}
              selectedStaffId={selection.staffId}
              selectedSlot={selection.slot}
              onSelectSlot={(slot) => {
                set('slot', slot);
                // スロット選択後に自動で次のステップへ
                setTimeout(() => setStep(4), 300);
              }}
            />

            {/* 次へボタン */}
            {selection.date && selection.slot && (
              <button style={{ ...S.btn('primary'), marginTop: 16 }} onClick={() => setStep(4)}>
                次へ →
              </button>
            )}
            <button style={S.btn('gray')} onClick={() => setStep(2)}>← 戻る</button>
          </div>
        )}

        {/* ─── Step 4: 情報入力 ─── */}
        {step === 4 && (
          <div>
            <h3 style={{ fontWeight: 700, color: C.primary, marginBottom: 12 }}>④ ご情報を入力してください</h3>
            {registeredUser && <div style={S.note}>✅ 登録済み情報から自動入力しました</div>}
            <label style={S.label}>お名前<span style={S.required}>*</span></label>
            <input style={S.formInput} type="text" placeholder="山田太郎"
              value={form.name} onChange={e => setF('name', e.target.value)} />
            <label style={S.label}>電話番号</label>
            <input style={S.formInput} type="tel" placeholder="09012345678"
              value={form.phone} onChange={e => setF('phone', e.target.value)} />
            <label style={S.label}>E-Mail</label>
            <input style={S.formInput} type="email" placeholder="yamada@example.com"
              value={form.email} onChange={e => setF('email', e.target.value)} />
            {error && <p style={{ color: C.danger, fontSize: 12, marginBottom: 8 }}>{error}</p>}
            <button style={S.btn('primary')} onClick={() => {
              if (!form.name) { setError('お名前は必須です'); return; }
              setError('');
              setStep(5);
            }}>次へ →</button>
            <button style={S.btn('gray')} onClick={() => setStep(3)}>← 戻る</button>
          </div>
        )}

        {/* ─── Step 5: 確認・送信 ─── */}
        {step === 5 && (
          <div>
            <h3 style={{ fontWeight: 700, color: C.primary, marginBottom: 12 }}>⑤ 予約内容を確認してください</h3>
            <div style={S.card}>
              <div style={{ display: 'grid', gridTemplateColumns: '100px 1fr', gap: '8px 0', fontSize: 13 }}>
                <span style={{ color: C.muted }}>コース</span>
                <span style={{ fontWeight: 600 }}>{selectedMenu?.name}</span>
                <span style={{ color: C.muted }}>担当者</span>
                <span style={{ fontWeight: 600 }}>{selectedStaffName}</span>
                <span style={{ color: C.muted }}>日時</span>
                <span style={{ fontWeight: 600 }}>{selection.date} {selection.slot}</span>
                <span style={{ color: C.muted }}>お名前</span>
                <span style={{ fontWeight: 600 }}>{form.name}</span>
                <span style={{ color: C.muted }}>電話番号</span>
                <span>{form.phone || '—'}</span>
                <span style={{ color: C.muted }}>E-Mail</span>
                <span>{form.email || '—'}</span>
              </div>
            </div>
            {error && <p style={{ color: C.danger, fontSize: 12, marginBottom: 8 }}>{error}</p>}
            <button style={S.btn('success')} onClick={handleSubmit}>
              {loading ? '送信中...' : '✅ 予約を確定する'}
            </button>
            <button style={S.btn('gray')} onClick={() => setStep(4)}>← 戻る</button>
          </div>
        )}
      </div>
    </div>
  );
}