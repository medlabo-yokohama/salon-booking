// ============================================================
// history_dashboard.jsx
// 過去データ分析・施術者別集計・CSVエクスポート
// ============================================================
import React, { useState, useEffect } from 'react';

const GAS_URL = import.meta.env.VITE_GAS_URL || '';

async function apiGet(params) {
  const url = new URL(GAS_URL);
  Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));
  return (await fetch(url.toString())).json();
}

const C = { primary: '#1a4f8a', primaryPale: '#dbeafe', accent: '#0ea5e9', success: '#059669', warning: '#f59e0b', danger: '#dc2626', border: '#cbd5e1', text: '#1e293b', muted: '#64748b', surface: '#fff', bg: '#f0f4f8' };

const S = {
  app: { fontFamily: "'Noto Sans JP', sans-serif", background: C.bg, minHeight: '100vh', fontSize: 13 },
  header: { background: C.primary, color: '#fff', padding: '14px 24px', display: 'flex', alignItems: 'center', gap: 12 },
  body: { padding: '20px 24px' },
  card: { background: C.surface, borderRadius: 6, boxShadow: '0 2px 8px rgba(0,0,0,.10)', padding: '16px 20px', marginBottom: 16 },
  gridTbl: { width: '100%', borderCollapse: 'collapse', background: C.surface },
  th: { background: C.primary, color: '#fff', padding: '8px 12px', fontSize: 12.5, fontWeight: 500, textAlign: 'center', border: `1px solid ${C.border}` },
  td: { border: `1px solid ${C.border}`, padding: '8px 12px', fontSize: 12.5 },
  btn: (v) => {
    const variants = { primary: { background: C.primary, color: '#fff' }, success: { background: C.success, color: '#fff' }, gray: { background: '#e2e8f0', color: C.text } };
    return { display: 'inline-flex', alignItems: 'center', gap: 4, padding: '6px 16px', border: 'none', borderRadius: 6, fontFamily: 'inherit', fontSize: 12.5, fontWeight: 500, cursor: 'pointer', ...(variants[v] || variants.primary) };
  },
  filterRow: { display: 'flex', flexWrap: 'wrap', gap: 12, alignItems: 'flex-end', marginBottom: 14 },
  filterLabel: { display: 'block', fontSize: 11.5, fontWeight: 600, color: C.muted, marginBottom: 4 },
  filterInput: { border: `1.5px solid ${C.border}`, borderRadius: 4, padding: '5px 8px', fontFamily: 'inherit', fontSize: 12.5, background: '#f8fafc' },
  dashGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 12, marginBottom: 20 },
  dashCard: (color) => ({ background: C.surface, borderRadius: 6, padding: '14px 16px', borderTop: `3px solid ${color}`, boxShadow: '0 2px 8px rgba(0,0,0,.08)' }),
  sectionTitle: { fontSize: 14, fontWeight: 700, color: C.primary, marginBottom: 12, paddingBottom: 6, borderBottom: `2px solid ${C.primaryPale}` },
};

export default function HistoryDashboard() {
  const [bookings, setBookings] = useState([]);
  const [staffList, setStaffList] = useState([]);
  const [menuList, setMenuList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate]   = useState('');
  const [filterStaff, setFilterStaff] = useState('');

  useEffect(() => {
    Promise.all([
      apiGet({ action: 'getBookings' }).then(r => r.success && setBookings(r.data.bookings)),
      apiGet({ action: 'getStaff'    }).then(r => r.success && setStaffList(r.data.staff)),
      apiGet({ action: 'getMenus'    }).then(r => r.success && setMenuList(r.data.menus)),
    ]).then(() => setLoading(false));
  }, []);

  // フィルタ適用
  const filtered = bookings.filter(b => {
    if (fromDate && b.datetime < fromDate) return false;
    if (toDate   && b.datetime > toDate + ' 23:59') return false;
    if (filterStaff && b.staffId !== filterStaff) return false;
    return true;
  });

  // 施術者別集計
  const staffSummary = staffList.map(s => {
    const staffBookings = filtered.filter(b => b.staffId === s.staffId && b.status !== 'キャンセル');
    return { ...s, count: staffBookings.length };
  });

  // メニュー別集計
  const menuSummary = menuList.map(m => {
    const count = filtered.filter(b => b.menuId === m.menuId && b.status !== 'キャンセル').length;
    return { ...m, count };
  });

  // 月別集計
  const monthlySummary = {};
  filtered.filter(b => b.status !== 'キャンセル').forEach(b => {
    const ym = b.datetime?.substring(0, 7);
    if (ym) monthlySummary[ym] = (monthlySummary[ym] || 0) + 1;
  });

  const totalCount = filtered.filter(b => b.status !== 'キャンセル').length;
  const cancelCount = filtered.filter(b => b.status === 'キャンセル').length;

  // CSVエクスポート
  const handleExport = () => {
    const headers = ['予約ID', '日時', '顧客名', '施術者ID', 'メニューID', '電話番号', 'メール', 'ステータス'];
    const rows = filtered.map(b => [b.bookingId, b.datetime, b.userName, b.staffId, b.menuId, b.userPhone, b.userEmail, b.status]);
    const csv = [headers, ...rows].map(r => r.map(v => `"${(v || '').toString().replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `予約データ分析_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (loading) return <div style={{ padding: 40, textAlign: 'center' }}>読み込み中...</div>;

  return (
    <div style={S.app}>
      <div style={S.header}>
        <h2 style={{ fontSize: 18, fontWeight: 700 }}>📊 過去データ分析</h2>
        <a href="/" style={{ marginLeft: 'auto', color: 'rgba(255,255,255,.7)', fontSize: 12, textDecoration: 'none' }}>← 管理画面へ戻る</a>
      </div>
      <div style={S.body}>
        {/* フィルタパネル */}
        <div style={S.card}>
          <div style={S.filterRow}>
            <div>
              <label style={S.filterLabel}>開始日</label>
              <input style={S.filterInput} type="date" value={fromDate} onChange={e => setFromDate(e.target.value)} />
            </div>
            <div>
              <label style={S.filterLabel}>終了日</label>
              <input style={S.filterInput} type="date" value={toDate} onChange={e => setToDate(e.target.value)} />
            </div>
            <div>
              <label style={S.filterLabel}>担当者</label>
              <select style={S.filterInput} value={filterStaff} onChange={e => setFilterStaff(e.target.value)}>
                <option value="">全員</option>
                {staffList.map(s => <option key={s.staffId} value={s.staffId}>{s.name}</option>)}
              </select>
            </div>
            <button style={S.btn('gray')} onClick={() => { setFromDate(''); setToDate(''); setFilterStaff(''); }}>リセット</button>
            <button style={{ ...S.btn('success'), marginLeft: 'auto' }} onClick={handleExport}>📥 CSVエクスポート</button>
          </div>
        </div>

        {/* サマリーカード */}
        <div style={S.dashGrid}>
          <div style={S.dashCard(C.primary)}>
            <div style={{ fontSize: 11.5, color: C.muted, marginBottom: 6 }}>総予約件数</div>
            <div style={{ fontSize: 32, fontWeight: 700, color: C.primary, fontFamily: 'monospace' }}>{totalCount}</div>
            <div style={{ fontSize: 10.5, color: C.muted }}>件（キャンセル除く）</div>
          </div>
          <div style={S.dashCard(C.danger)}>
            <div style={{ fontSize: 11.5, color: C.muted, marginBottom: 6 }}>キャンセル件数</div>
            <div style={{ fontSize: 32, fontWeight: 700, color: C.danger, fontFamily: 'monospace' }}>{cancelCount}</div>
            <div style={{ fontSize: 10.5, color: C.muted }}>件</div>
          </div>
          <div style={S.dashCard(C.success)}>
            <div style={{ fontSize: 11.5, color: C.muted, marginBottom: 6 }}>キャンセル率</div>
            <div style={{ fontSize: 32, fontWeight: 700, color: C.success, fontFamily: 'monospace' }}>
              {filtered.length > 0 ? Math.round(cancelCount / filtered.length * 100) : 0}%
            </div>
          </div>
        </div>

        {/* 施術者別集計 */}
        <div style={S.card}>
          <div style={S.sectionTitle}>👨‍⚕️ 施術者別集計</div>
          <table style={S.gridTbl}>
            <thead>
              <tr><th style={S.th}>施術者</th><th style={S.th}>予約件数</th><th style={S.th}>割合</th></tr>
            </thead>
            <tbody>
              {staffSummary.sort((a, b) => b.count - a.count).map(s => (
                <tr key={s.staffId}>
                  <td style={S.td}>{s.name}</td>
                  <td style={{ ...S.td, textAlign: 'center', fontWeight: 600 }}>{s.count}</td>
                  <td style={S.td}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <div style={{ flex: 1, background: '#e2e8f0', borderRadius: 4, height: 6, overflow: 'hidden' }}>
                        <div style={{ background: C.primary, height: '100%', borderRadius: 4, width: totalCount > 0 ? `${s.count / totalCount * 100}%` : '0%', transition: 'width .4s' }} />
                      </div>
                      <span style={{ fontSize: 11.5, color: C.muted, minWidth: 36 }}>
                        {totalCount > 0 ? Math.round(s.count / totalCount * 100) : 0}%
                      </span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* メニュー別集計 */}
        <div style={S.card}>
          <div style={S.sectionTitle}>📋 コース別集計</div>
          <table style={S.gridTbl}>
            <thead>
              <tr><th style={S.th}>コース</th><th style={S.th}>予約件数</th></tr>
            </thead>
            <tbody>
              {menuSummary.sort((a, b) => b.count - a.count).map(m => (
                <tr key={m.menuId}>
                  <td style={S.td}>{m.name}</td>
                  <td style={{ ...S.td, textAlign: 'center', fontWeight: 600 }}>{m.count}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* 月別集計 */}
        <div style={S.card}>
          <div style={S.sectionTitle}>📅 月別集計</div>
          <table style={S.gridTbl}>
            <thead>
              <tr><th style={S.th}>年月</th><th style={S.th}>予約件数</th></tr>
            </thead>
            <tbody>
              {Object.entries(monthlySummary).sort((a, b) => b[0].localeCompare(a[0])).map(([ym, count]) => (
                <tr key={ym}>
                  <td style={S.td}>{ym}</td>
                  <td style={{ ...S.td, textAlign: 'center', fontWeight: 600 }}>{count}</td>
                </tr>
              ))}
              {Object.keys(monthlySummary).length === 0 && (
                <tr><td colSpan={2} style={{ ...S.td, textAlign: 'center', color: C.muted }}>データがありません</td></tr>
              )}
            </tbody>
          </table>
        </div>

        {/* 予約一覧テーブル */}
        <div style={S.card}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
            <div style={S.sectionTitle}>予約一覧（{filtered.length}件）</div>
          </div>
          <div style={{ overflowX: 'auto' }}>
            <table style={S.gridTbl}>
              <thead>
                <tr>
                  {['予約ID', '日時', '顧客名', '担当者', 'コース', 'ステータス'].map(h => <th key={h} style={S.th}>{h}</th>)}
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr><td colSpan={6} style={{ ...S.td, textAlign: 'center', color: C.muted }}>データがありません</td></tr>
                ) : filtered.slice(0, 100).map(b => (
                  <tr key={b.bookingId} style={{ background: b.status === 'キャンセル' ? '#fef2f2' : undefined }}>
                    <td style={{ ...S.td, fontFamily: 'monospace', fontSize: 11 }}>{b.bookingId}</td>
                    <td style={S.td}>{b.datetime}</td>
                    <td style={S.td}>{b.userName}</td>
                    <td style={S.td}>{b.staffId}</td>
                    <td style={S.td}>{b.menuId}</td>
                    <td style={S.td}>
                      <span style={{ padding: '2px 8px', borderRadius: 20, fontSize: 10.5, fontWeight: 700, background: b.status === '確定' ? '#d1fae5' : '#e2e8f0', color: b.status === '確定' ? '#065f46' : '#475569' }}>{b.status}</span>
                    </td>
                  </tr>
                ))}
                {filtered.length > 100 && (
                  <tr><td colSpan={6} style={{ ...S.td, textAlign: 'center', color: C.muted }}>100件以上は表示を省略しています。CSVエクスポートで全件取得できます。</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
