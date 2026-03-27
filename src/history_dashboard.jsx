import React, { useState, useEffect } from 'react';
import { ChevronDown, Download, Search, Calendar, TrendingUp } from 'lucide-react';

/**
 * 過去データ確認ダッシュボード
 * 機能:
 * - 年選択で過去データ表示
 * - 統計情報（月別、スタイリスト別など）
 * - CSVエクスポート
 */
export default function HistoryDashboard() {
  // ========== 状態管理 ==========
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [availableYears, setAvailableYears] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all'); // all, confirmed, cancelled
  const [message, setMessage] = useState('');

  const BACKEND_URL = 'https://script.google.com/macros/d/{DEPLOYMENT_ID}/usercallable';

  // ========== 初期化 ==========
  useEffect(() => {
    fetchAvailableYears();
  }, []);

  useEffect(() => {
    if (availableYears.length > 0) {
      fetchBookingsByYear(selectedYear);
    }
  }, [selectedYear, availableYears]);

  // ========== データ取得 ==========
  const fetchAvailableYears = async () => {
    try {
      const response = await fetch(
        `${BACKEND_URL}?action=getAvailableYears`
      );
      const data = await response.json();
      if (data.success) {
        setAvailableYears(data.years || []);
        if (data.years && data.years.length > 0) {
          setSelectedYear(data.years[0]); // 最新年を選択
        }
      }
    } catch (error) {
      console.error('年一覧取得エラー:', error);
      setMessage('年一覧の取得に失敗しました');
    }
  };

  const fetchBookingsByYear = async (year) => {
    setLoading(true);
    try {
      const response = await fetch(
        `${BACKEND_URL}?action=getAllBookingsByYear&year=${year}`
      );
      const data = await response.json();
      if (data.success) {
        setBookings(data.bookings || []);
      }
    } catch (error) {
      console.error('予約データ取得エラー:', error);
      setMessage('予約データの取得に失敗しました');
    } finally {
      setLoading(false);
    }
  };

  // ========== フィルター処理 ==========
  const filteredBookings = bookings.filter(booking => {
    const matchSearch = 
      booking.customerName.includes(searchTerm) ||
      booking.staff.includes(searchTerm) ||
      booking.customerPhone.includes(searchTerm);
    
    const matchStatus = 
      filterStatus === 'all' || 
      booking.status === filterStatus;
    
    return matchSearch && matchStatus;
  });

  // ========== 統計計算 ==========
  const calculateStats = () => {
    const stats = {
      totalBookings: filteredBookings.length,
      confirmedBookings: filteredBookings.filter(b => b.status === 'confirmed').length,
      cancelledBookings: filteredBookings.filter(b => b.status === 'cancelled').length,
      uniqueCustomers: new Set(filteredBookings.map(b => b.customerName)).size,
    };

    // スタイリスト別集計
    const staffStats = {};
    filteredBookings.forEach(booking => {
      if (!staffStats[booking.staff]) {
        staffStats[booking.staff] = 0;
      }
      staffStats[booking.staff]++;
    });

    // メニュー別集計
    const serviceStats = {};
    filteredBookings.forEach(booking => {
      if (!serviceStats[booking.service]) {
        serviceStats[booking.service] = 0;
      }
      serviceStats[booking.service]++;
    });

    // 月別集計
    const monthStats = {};
    filteredBookings.forEach(booking => {
      const month = booking.dateTime.toString().substring(0, 7); // YYYY-MM
      if (!monthStats[month]) {
        monthStats[month] = 0;
      }
      monthStats[month]++;
    });

    return { stats, staffStats, serviceStats, monthStats };
  };

  const { stats, staffStats, serviceStats, monthStats } = calculateStats();

  // ========== CSVエクスポート ==========
  const exportToCSV = () => {
    const headers = ['予約ID', '予約日時', '顧客名', '電話番号', 'メール', 'スタイリスト', 'メニュー', 'ステータス', 'ご要望'];
    
    const rows = filteredBookings.map(booking => [
      booking.bookingId,
      booking.dateTime,
      booking.customerName,
      booking.customerPhone,
      booking.customerEmail,
      booking.staff,
      booking.service,
      booking.status,
      booking.note || '',
    ]);

    const csv = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(',')),
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    link.setAttribute('href', url);
    link.setAttribute('download', `booking_${selectedYear}_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    setMessage('✓ CSVをダウンロードしました');
    setTimeout(() => setMessage(''), 3000);
  };

  // ========== UI ==========
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {/* ヘッダー */}
      <div className="bg-white shadow-lg sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <h1 className="text-3xl font-bold text-gray-900">📊 過去データ確認ダッシュボード</h1>
          <p className="text-gray-600 text-sm mt-1">過去の予約データを確認・分析できます</p>
        </div>
      </div>

      {/* メッセージ */}
      {message && (
        <div className={`max-w-7xl mx-auto mt-4 p-4 rounded-lg ${
          message.includes('✓') ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
        }`}>
          {message}
        </div>
      )}

      <div className="max-w-7xl mx-auto p-4 space-y-4">
        {/* 年選択と操作パネル */}
        <div className="bg-white rounded-2xl shadow-lg p-6">
          <div className="flex flex-col md:flex-row gap-4 items-end">
            {/* 年選択 */}
            <div className="flex-1">
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                📅 対象年を選択
              </label>
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-lg font-semibold"
              >
                {availableYears.map(year => (
                  <option key={year} value={year}>
                    {year}年
                  </option>
                ))}
              </select>
            </div>

            {/* ステータスフィルタ */}
            <div className="flex-1">
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                ステータス
              </label>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">全て</option>
                <option value="confirmed">確定</option>
                <option value="cancelled">キャンセル</option>
              </select>
            </div>

            {/* エクスポートボタン */}
            <button
              onClick={exportToCSV}
              disabled={filteredBookings.length === 0}
              className="px-6 py-3 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-lg font-semibold hover:shadow-lg disabled:opacity-50 flex items-center gap-2"
            >
              <Download size={18} /> CSV
            </button>
          </div>

          {/* 検索 */}
          <div className="mt-4">
            <input
              type="text"
              placeholder="顧客名・スタイリスト・電話番号で検索"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* 統計情報 */}
        {!loading && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* 総予約数 */}
            <div className="bg-white rounded-2xl shadow-lg p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-sm">総予約数</p>
                  <p className="text-3xl font-bold text-gray-900 mt-1">{stats.totalBookings}</p>
                </div>
                <Calendar className="text-blue-500" size={32} />
              </div>
            </div>

            {/* 確定予約 */}
            <div className="bg-white rounded-2xl shadow-lg p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-sm">確定予約</p>
                  <p className="text-3xl font-bold text-green-600 mt-1">{stats.confirmedBookings}</p>
                </div>
                <div className="text-2xl">✅</div>
              </div>
            </div>

            {/* キャンセル */}
            <div className="bg-white rounded-2xl shadow-lg p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-sm">キャンセル</p>
                  <p className="text-3xl font-bold text-red-600 mt-1">{stats.cancelledBookings}</p>
                </div>
                <div className="text-2xl">❌</div>
              </div>
            </div>

            {/* ユニーク顧客 */}
            <div className="bg-white rounded-2xl shadow-lg p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-sm">ユニーク顧客</p>
                  <p className="text-3xl font-bold text-purple-600 mt-1">{stats.uniqueCustomers}</p>
                </div>
                <div className="text-2xl">👥</div>
              </div>
            </div>
          </div>
        )}

        {/* スタイリスト別集計 */}
        {!loading && Object.keys(staffStats).length > 0 && (
          <div className="bg-white rounded-2xl shadow-lg p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
              <TrendingUp size={24} /> スタイリスト別集計
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {Object.entries(staffStats)
                .sort((a, b) => b[1] - a[1])
                .map(([staff, count]) => (
                  <div key={staff} className="p-4 border border-gray-300 rounded-lg">
                    <p className="font-semibold text-gray-900">{staff}</p>
                    <p className="text-2xl font-bold text-blue-600 mt-1">{count}件</p>
                  </div>
                ))}
            </div>
          </div>
        )}

        {/* メニュー別集計 */}
        {!loading && Object.keys(serviceStats).length > 0 && (
          <div className="bg-white rounded-2xl shadow-lg p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
              <TrendingUp size={24} /> メニュー別集計
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {Object.entries(serviceStats)
                .sort((a, b) => b[1] - a[1])
                .map(([service, count]) => (
                  <div key={service} className="p-4 border border-gray-300 rounded-lg">
                    <p className="font-semibold text-gray-900">{service}</p>
                    <p className="text-2xl font-bold text-green-600 mt-1">{count}件</p>
                  </div>
                ))}
            </div>
          </div>
        )}

        {/* 月別集計 */}
        {!loading && Object.keys(monthStats).length > 0 && (
          <div className="bg-white rounded-2xl shadow-lg p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">📈 月別推移</h2>
            <div className="space-y-2">
              {Object.entries(monthStats)
                .sort((a, b) => b[0].localeCompare(a[0]))
                .map(([month, count]) => (
                  <div key={month} className="flex items-center gap-4">
                    <span className="font-semibold text-gray-700 w-24">{month}</span>
                    <div className="flex-1 bg-gray-200 rounded-full h-8 flex items-center">
                      <div
                        className="bg-gradient-to-r from-blue-500 to-blue-600 h-8 rounded-full flex items-center justify-end pr-2"
                        style={{
                          width: `${(count / Math.max(...Object.values(monthStats))) * 100}%`,
                        }}
                      >
                        <span className="text-white font-bold text-sm">{count}</span>
                      </div>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        )}

        {/* 予約詳細表 */}
        <div className="bg-white rounded-2xl shadow-lg overflow-x-auto">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-xl font-bold text-gray-900">
              予約詳細 ({filteredBookings.length}件)
            </h2>
          </div>

          {filteredBookings.length === 0 ? (
            <div className="p-12 text-center text-gray-500">
              該当する予約データがありません
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-gradient-to-r from-blue-50 to-blue-100 border-b-2 border-blue-300">
                <tr>
                  <th className="px-6 py-4 text-left font-semibold text-gray-900">日時</th>
                  <th className="px-6 py-4 text-left font-semibold text-gray-900">顧客名</th>
                  <th className="px-6 py-4 text-left font-semibold text-gray-900">スタイリスト</th>
                  <th className="px-6 py-4 text-left font-semibold text-gray-900">メニュー</th>
                  <th className="px-6 py-4 text-left font-semibold text-gray-900">電話番号</th>
                  <th className="px-6 py-4 text-left font-semibold text-gray-900">ステータス</th>
                </tr>
              </thead>
              <tbody>
                {filteredBookings.map((booking, idx) => (
                  <tr
                    key={booking.bookingId}
                    className={`border-b ${idx % 2 === 0 ? 'bg-white' : 'bg-slate-50'} hover:bg-blue-50`}
                  >
                    <td className="px-6 py-4 font-semibold text-gray-900">
                      {booking.dateTime}
                    </td>
                    <td className="px-6 py-4 text-gray-700">{booking.customerName}</td>
                    <td className="px-6 py-4 text-gray-700">{booking.staff}</td>
                    <td className="px-6 py-4 text-gray-700">{booking.service}</td>
                    <td className="px-6 py-4 text-gray-700">{booking.customerPhone}</td>
                    <td className="px-6 py-4">
                      <span className={`inline-block px-3 py-1 rounded-full text-xs font-bold ${
                        booking.status === 'confirmed' 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {booking.status === 'confirmed' ? '確定' : 'キャンセル'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
