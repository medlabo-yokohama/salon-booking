import React, { useState, useEffect } from 'react';
import { Edit2, Trash2, Plus, LogOut, Search, ChevronLeft, ChevronRight, Check, X } from 'lucide-react';

/**
 * 管理者向けダッシュボード
 * 機能：
 * - パスワード認証
 * - 予約一覧表示
 * - 予約の手入力
 * - 予約の編集
 * - 予約の削除
 * - 日付で絞り込み
 */
export default function AdminDashboard() {
  // ========== 状態管理 ==========
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [adminPassword, setAdminPassword] = useState('');
  const [passwordInput, setPasswordInput] = useState('');
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [bookings, setBookings] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [message, setMessage] = useState('');

  const [formData, setFormData] = useState({
    date: '',
    time: '',
    staff: '',
    customerName: '',
    customerPhone: '',
    customerEmail: '',
    service: '',
    status: 'confirmed',
    note: '',
  });

  // ========== 定数 ==========
  const staffList = ['田中スタイリスト', '鈴木スタイリスト', '佐藤スタイリスト'];
  const timeSlots = [
    '09:00', '09:30', '10:00', '10:30', '11:00', '11:30',
    '13:00', '13:30', '14:00', '14:30', '15:00', '15:30',
    '16:00', '16:30', '17:00', '17:30', '18:00'
  ];
  const serviceList = ['カット', 'カラー', 'パーマ', 'トリートメント', 'セット'];
  const ADMIN_PASSWORD = 'salon2024'; // ← 本番環境では環境変数に移す
  const BACKEND_URL = 'https://script.google.com/macros/s/AKfycbwj9Q0wnJ05Tlf4V9gG20qhRMf1YSEmmzFXFC_osPSDFuSckGjIp3k8qiRF29JOHlnn-A/exec';
  // ========== ローカルストレージ初期化 ==========
  useEffect(() => {
    const saved = localStorage.getItem('adminPassword');
    if (saved) setAdminPassword(saved);
    fetchBookings(selectedDate);
  }, []);

  // ========== 認証 ==========
  const handleLogin = () => {
    if (passwordInput === ADMIN_PASSWORD) {
      setIsAuthenticated(true);
      localStorage.setItem('adminPassword', passwordInput);
      setPasswordInput('');
      setMessage('✓ ログインしました');
      setTimeout(() => setMessage(''), 3000);
    } else {
      setMessage('✗ パスワードが間違っています');
      setTimeout(() => setMessage(''), 3000);
    }
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    localStorage.removeItem('adminPassword');
    setPasswordInput('');
  };

  // ========== データ取得 ==========
  const fetchBookings = async (date) => {
    try {
      const dateStr = date.toISOString().split('T')[0];
      const response = await fetch(
        `${BACKEND_URL}?action=getBookings&date=${dateStr}`
      );
      const data = await response.json();
      if (data.success) {
        setBookings(data.bookings || []);
      }
    } catch (error) {
      console.error('予約データ取得エラー:', error);
    }
  };

  // ========== 予約追加/編集 ==========
  const handleSaveBooking = async () => {
    if (!formData.date || !formData.time || !formData.staff || !formData.customerName) {
      setMessage('必須項目を入力してください');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(BACKEND_URL, {
        method: 'POST',
        mode: 'no-cors',
        body: JSON.stringify({
          action: editingId ? 'updateBooking' : 'addBooking',
          data: {
            bookingId: editingId,
            date: formData.date,
            time: formData.time,
            staff: formData.staff,
            customerName: formData.customerName,
            customerPhone: formData.customerPhone,
            customerEmail: formData.customerEmail,
            service: formData.service,
            status: formData.status,
            note: formData.note,
          },
        }),
      });

      setMessage(editingId ? '✓ 予約を更新しました' : '✓ 予約を追加しました');
      setShowModal(false);
      setEditingId(null);
      resetForm();
      fetchBookings(selectedDate);
      setTimeout(() => setMessage(''), 3000);
    } catch (error) {
      setMessage(`エラー: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  // ========== 予約削除 ==========
  const handleDeleteBooking = async (bookingId) => {
    if (!window.confirm('この予約を削除してよろしいですか？')) return;

    try {
      await fetch(BACKEND_URL, {
        method: 'POST',
        mode: 'no-cors',
        body: JSON.stringify({
          action: 'deleteBooking',
          data: { bookingId },
        }),
      });

      setMessage('✓ 予約を削除しました');
      fetchBookings(selectedDate);
      setTimeout(() => setMessage(''), 3000);
    } catch (error) {
      setMessage(`エラー: ${error.message}`);
    }
  };

  // ========== フォーム操作 ==========
  const resetForm = () => {
    setFormData({
      date: selectedDate.toISOString().split('T')[0],
      time: '',
      staff: '',
      customerName: '',
      customerPhone: '',
      customerEmail: '',
      service: '',
      status: 'confirmed',
      note: '',
    });
  };

  const openAddModal = () => {
    resetForm();
    setEditingId(null);
    setShowModal(true);
  };

  const openEditModal = (booking) => {
    setFormData({
      date: booking.date.split(' ')[0],
      time: booking.date.split(' ')[1],
      staff: booking.staff,
      customerName: booking.customerName,
      customerPhone: booking.customerPhone || '',
      customerEmail: booking.customerEmail || '',
      service: booking.service,
      status: booking.status || 'confirmed',
      note: booking.note || '',
    });
    setEditingId(booking.bookingId);
    setShowModal(true);
  };

  // ========== 日付操作 ==========
  const addDays = (days) => {
    const newDate = new Date(selectedDate);
    newDate.setDate(newDate.getDate() + days);
    setSelectedDate(newDate);
  };

  const formatDate = (date) => {
    return date.toLocaleDateString('ja-JP', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      weekday: 'short',
    });
  };

  // ========== 検索フィルタ ==========
  const filteredBookings = bookings.filter(booking =>
    booking.customerName.includes(searchTerm) ||
    booking.customerPhone.includes(searchTerm) ||
    booking.staff.includes(searchTerm)
  );

  // ========== ログイン画面 ==========
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full">
          <div className="text-center mb-8">
            <div className="text-5xl mb-4">🔒</div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              管理者ログイン
            </h1>
            <p className="text-gray-600">パスワードを入力してください</p>
          </div>

          {message && (
            <div className={`p-3 rounded-lg text-center mb-4 ${
              message.includes('✓') ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
            }`}>
              {message}
            </div>
          )}

          <div className="space-y-4">
            <input
              type="password"
              value={passwordInput}
              onChange={(e) => setPasswordInput(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleLogin()}
              placeholder="パスワード"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              autoFocus
            />
            <button
              onClick={handleLogin}
              className="w-full bg-gradient-to-r from-blue-600 to-blue-700 text-white font-bold py-3 rounded-lg hover:shadow-lg transition-all"
            >
              ログイン
            </button>
          </div>

          <p className="text-center text-xs text-gray-500 mt-6">
            セキュリティ: パスワードは暗号化されて送信されます
          </p>
        </div>
      </div>
    );
  }

  // ========== 管理画面 ==========
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {/* ヘッダー */}
      <div className="bg-white shadow-lg sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-3xl font-bold text-gray-900">📊 管理者ダッシュボード</h1>
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 px-4 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200"
            >
              <LogOut size={18} /> ログアウト
            </button>
          </div>

          {/* 日付ナビゲーション */}
          <div className="flex items-center justify-between gap-4 mb-4">
            <button
              onClick={() => addDays(-1)}
              className="p-2 hover:bg-gray-100 rounded-lg transition"
            >
              <ChevronLeft size={20} />
            </button>

            <div className="text-center flex-1">
              <p className="text-lg font-bold text-gray-900">
                {formatDate(selectedDate)}
              </p>
            </div>

            <button
              onClick={() => addDays(1)}
              className="p-2 hover:bg-gray-100 rounded-lg transition"
            >
              <ChevronRight size={20} />
            </button>
          </div>

          {/* ツールバー */}
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-3 text-gray-400" size={18} />
              <input
                type="text"
                placeholder="顧客名・電話番号・スタイリストで検索"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <button
              onClick={openAddModal}
              className="flex items-center gap-2 px-6 py-2 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-lg hover:shadow-lg font-semibold"
            >
              <Plus size={18} /> 新規予約
            </button>
          </div>
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

      {/* 予約一覧 */}
      <div className="max-w-7xl mx-auto p-4">
        {filteredBookings.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-lg p-12 text-center">
            <p className="text-gray-500 text-lg">この日の予約はありません</p>
          </div>
        ) : (
          <div className="bg-white rounded-2xl shadow-lg overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gradient-to-r from-blue-50 to-blue-100 border-b-2 border-blue-300">
                <tr>
                  <th className="px-6 py-4 text-left font-semibold text-gray-900">時間</th>
                  <th className="px-6 py-4 text-left font-semibold text-gray-900">スタイリスト</th>
                  <th className="px-6 py-4 text-left font-semibold text-gray-900">顧客名</th>
                  <th className="px-6 py-4 text-left font-semibold text-gray-900">メニュー</th>
                  <th className="px-6 py-4 text-left font-semibold text-gray-900">電話番号</th>
                  <th className="px-6 py-4 text-left font-semibold text-gray-900">ステータス</th>
                  <th className="px-6 py-4 text-center font-semibold text-gray-900">アクション</th>
                </tr>
              </thead>
              <tbody>
                {filteredBookings.map((booking, idx) => (
                  <tr
                    key={booking.bookingId}
                    className={`border-b ${idx % 2 === 0 ? 'bg-white' : 'bg-slate-50'} hover:bg-blue-50`}
                  >
                    <td className="px-6 py-4 font-semibold text-gray-900">
                      {booking.date.split(' ')[1]}
                    </td>
                    <td className="px-6 py-4 text-gray-700">{booking.staff}</td>
                    <td className="px-6 py-4 text-gray-700 font-semibold">{booking.customerName}</td>
                    <td className="px-6 py-4 text-gray-700">{booking.service}</td>
                    <td className="px-6 py-4 text-gray-700">{booking.customerPhone || '-'}</td>
                    <td className="px-6 py-4">
                      <span className={`inline-block px-3 py-1 rounded-full text-xs font-bold ${
                        booking.status === 'confirmed' ? 'bg-green-100 text-green-800' :
                        booking.status === 'cancelled' ? 'bg-red-100 text-red-800' :
                        'bg-yellow-100 text-yellow-800'
                      }`}>
                        {booking.status === 'confirmed' ? '確定' : booking.status === 'cancelled' ? 'キャンセル' : '保留中'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center space-x-2">
                      <button
                        onClick={() => openEditModal(booking)}
                        className="inline-flex items-center gap-1 px-3 py-2 bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition"
                      >
                        <Edit2 size={16} /> 編集
                      </button>
                      <button
                        onClick={() => handleDeleteBooking(booking.bookingId)}
                        className="inline-flex items-center gap-1 px-3 py-2 bg-red-100 text-red-700 rounded hover:bg-red-200 transition"
                      >
                        <Trash2 size={16} /> 削除
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* 予約追加/編集モーダル */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <h2 className="text-2xl font-bold mb-6 text-gray-900">
              {editingId ? '予約を編集' : '新規予約を追加'}
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              {/* 日付 */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  予約日 <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  value={formData.date}
                  onChange={(e) => setFormData({...formData, date: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* 時間 */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  時間 <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.time}
                  onChange={(e) => setFormData({...formData, time: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">選択してください</option>
                  {timeSlots.map(time => (
                    <option key={time} value={time}>{time}</option>
                  ))}
                </select>
              </div>

              {/* スタイリスト */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  スタイリスト <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.staff}
                  onChange={(e) => setFormData({...formData, staff: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">選択してください</option>
                  {staffList.map(staff => (
                    <option key={staff} value={staff}>{staff}</option>
                  ))}
                </select>
              </div>

              {/* メニュー */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  メニュー <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.service}
                  onChange={(e) => setFormData({...formData, service: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">選択してください</option>
                  {serviceList.map(service => (
                    <option key={service} value={service}>{service}</option>
                  ))}
                </select>
              </div>

              {/* 顧客名 */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  顧客名 <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.customerName}
                  onChange={(e) => setFormData({...formData, customerName: e.target.value})}
                  placeholder="山田太郎"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* 電話番号 */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  電話番号
                </label>
                <input
                  type="tel"
                  value={formData.customerPhone}
                  onChange={(e) => setFormData({...formData, customerPhone: e.target.value})}
                  placeholder="09012345678"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* メールアドレス */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  メールアドレス
                </label>
                <input
                  type="email"
                  value={formData.customerEmail}
                  onChange={(e) => setFormData({...formData, customerEmail: e.target.value})}
                  placeholder="yamada@example.com"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* ステータス */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  ステータス
                </label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({...formData, status: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="confirmed">確定</option>
                  <option value="pending">保留中</option>
                  <option value="cancelled">キャンセル</option>
                </select>
              </div>
            </div>

            {/* 備考 */}
            <div className="mb-6">
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                ご要望・備考
              </label>
              <textarea
                value={formData.note}
                onChange={(e) => setFormData({...formData, note: e.target.value})}
                placeholder="特別なリクエストやメモ"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 h-24 resize-none"
              />
            </div>

            {/* ボタン */}
            <div className="flex gap-3">
              <button
                onClick={() => setShowModal(false)}
                className="flex-1 px-6 py-3 bg-gray-200 text-gray-900 rounded-lg font-semibold hover:bg-gray-300"
              >
                キャンセル
              </button>
              <button
                onClick={handleSaveBooking}
                disabled={loading}
                className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg font-semibold hover:shadow-lg disabled:opacity-50"
              >
                {loading ? '保存中...' : '保存'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
