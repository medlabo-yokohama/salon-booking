// ============================================================
// main.jsx
// URLパラメータで表示画面を振り分けるエントリーポイント
// ============================================================
import React from 'react';
import ReactDOM from 'react-dom/client';
import AdminDashboard from './admin_dashboard_with_notifications';
import BookingCalendar from './booking_calendar_ui_with_notifications';
import HistoryDashboard from './history_dashboard';
import LineLiffBooking from './line_liff_booking_v3';

/**
 * URLパラメータを解析して表示する画面を決定する
 * ?admin=true  → 管理者ダッシュボード
 * ?history=true → 過去データ分析
 * ?liff=true   → LINE LIFF予約
 * (なし)        → 顧客向け予約フォーム
 */
function App() {
  const params = new URLSearchParams(window.location.search);

  if (params.get('admin') === 'true') {
    return <AdminDashboard />;
  }
  if (params.get('history') === 'true') {
    return <HistoryDashboard />;
  }
  if (params.get('liff') === 'true') {
    return <LineLiffBooking />;
  }
  return <BookingCalendar />;
}

// アプリをルートDOMにマウントする
ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
