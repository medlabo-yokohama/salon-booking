import React, { useState, useEffect } from 'react';
import { Edit2, Trash2, Plus, LogOut, Search, ChevronLeft, ChevronRight, Settings, Save, X, Bell, AlertCircle } from 'lucide-react';

/**
 * リマインド・キャンセル機能対応版管理者ダッシュボード
 */
export default function AdminDashboardWithNotifications() {
  // ========== 状態管理 ==========
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [passwordInput, setPasswordInput] = useState('');
  const [activeTab, setActiveTab] = useState('bookings');
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [bookings, setBookings] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [message, setMessage] = useState('');

  // 設定状態
  const [staffList, setStaffList] = useState([]);
  const [businessHours, setBusinessHours] = useState({
    startTime: '09:00',
    endTime: '18:00',
    interval: 30,
  });
  const [staffOffDays, setStaffOffDays] = useState({});

  // キャンセル関連
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancellingBookingId, setCancellingBookingId] = useState(null);
  const [cancelReason, setCancelReason] = useState('');

  // フォーム状態
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
    notificationMethod: 'email',
  });

  const serviceList = ['カット', 'カラー', 'パーマ', 'トリートメント', 'セット'];
  const ADMIN_PASSWORD = 'salon2024';
  const BACKEND_URL = 'https://script.google.com/macros/d/{DEPLOYMENT_ID}/usercallable';

  // ========== 初期化 ==========
  useEffect(() => {
    const saved = localStorage.getItem('adminPassword');
    if (saved) setIsAuthenticated(true);
    
    const savedStaffList = localStorage.getItem('staffList');
    const savedBusinessHours = localStorage.getItem('businessHours');
    const savedOffDays = localStorage.getItem('staffOffDays');
    
    if (savedStaffList) setStaffList(JSON.parse(savedStaffList));
    else setStaffList(['田中スタイリスト', '鈴木スタイリスト', '佐藤スタイリスト']);
    
    if (savedBusinessHours) setBusinessHours(JSON.parse(savedBusinessHours));
    if (savedOffDays) setStaffOffDays(JSON.parse(savedOffDays));
    
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
    setActiveTab('bookings');
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

  // ========== キャンセル処理 ==========
  const handleCancelBooking = async () => {
    if (!cancelReason.trim()) {
      setMessage('キャンセル理由を入力してください');
      return;
    }

    setLoading(true);
    try {
      await fetch(BACKEND_URL, {
        method: 'POST',
        mode: 'no-cors',
        body: JSON.stringify({
          action: 'cancelBooking',
          data: {
            bookingId: cancellingBookingId,
            reason: cancelReason,
          },
        }),
      });

      setMessage('✓ 予約をキャンセルしました。通知を送信しました。');
      setShowCancelModal(false);
      setCancelReason('');
      setCancellingBookingId(null);
      fetchBookings(selectedDate);
      setTimeout(() => setMessage(''), 3000);
    } catch (error) {
      setMessage(`エラー: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  // ========== リマインド送信（手動） ==========
  const sendReminderManually = async (bookingId) => {
    setLoading(true);
    try {
      const response = await fetch(BACKEND_URL, {
        method: 'POST',
        body: JSON.stringify({
          action: 'sendReminderManually',
          data: { bookingId },
        }),
      });

      setMessage('✓ リマインドを送信しました');
      setTimeout(() => setMessage(''), 3000);
    } catch (error) {
      setMessage(`エラー: ${error.message}`);
    } finally {
      setLoading(false);
    }
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
            <h1 className="text-3xl font-bold text-gray-900 mb-2">管理者ログイン</h1>
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
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              autoFocus
            />
            <button
              onClick={handleLogin}
              className="w-full bg-gradient-to-r from-blue-600 to-blue-700 text-white font-bold py-3 rounded-lg hover:shadow-lg"
            >
              ログイン
            </button>
          </div>

          <p className="text-center text-xs text-gray-500 mt-6">
            デモ用パスワード: salon2024
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

          {/* タブ */}
          <div className="flex gap-4 border-b">
            <button
              onClick={() => setActiveTab('bookings')}
              className={`px-4 py-2 font-semibold border-b-2 transition ${
                activeTab === 'bookings'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              📅 予約管理
            </button>
            <button
              onClick={() => setActiveTab('settings')}
              className={`px-4 py-2 font-semibold border-b-2 transition flex items-center gap-2 ${
                activeTab === 'settings'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              <Settings size={18} /> 設定
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

      {/* ============ 予約管理タブ ============ */}
      {activeTab === 'bookings' && (
        <div className="max-w-7xl mx-auto p-4">
          {/* 日付ナビゲーション */}
          <div className="bg-white rounded-2xl shadow-lg p-4 mb-4">
            <div className="flex items-center justify-between gap-4 mb-4">
              <button onClick={() => addDays(-1)} className="p-2 hover:bg-gray-100 rounded-lg">
                <ChevronLeft size={20} />
              </button>

              <div className="text-center flex-1">
                <p className="text-lg font-bold text-gray-900">{formatDate(selectedDate)}</p>
              </div>

              <button onClick={() => addDays(1)} className="p-2 hover:bg-gray-100 rounded-lg">
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
                onClick={() => {
                  resetForm();
                  setEditingId(null);
                  setShowModal(true);
                }}
                className="flex items-center gap-2 px-6 py-2 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-lg hover:shadow-lg font-semibold"
              >
                <Plus size={18} /> 新規予約
              </button>
            </div>
          </div>

          {/* 予約一覧 */}
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
                    <th className="px-6 py-4 text-left font-semibold text-gray-900">通知方法</th>
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
                      <td className="px-6 py-4">
                        <span className="inline-block px-3 py-1 rounded-full text-xs font-bold bg-blue-100 text-blue-800">
                          {booking.notificationMethod === 'email' ? '📧 メール' : 
                           booking.notificationMethod === 'line' ? '💬 LINE' : 
                           '📧 + 💬'}
                        </span>
                      </td>
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
                        {booking.status === 'confirmed' && (
                          <>
                            <button
                              onClick={() => sendReminderManually(booking.bookingId)}
                              className="inline-flex items-center gap-1 px-3 py-2 bg-orange-100 text-orange-700 rounded hover:bg-orange-200 text-sm"
                              title="リマインド送信"
                            >
                              <Bell size={14} /> リマインド
                            </button>
                            <button
                              onClick={() => {
                                setCancellingBookingId(booking.bookingId);
                                setShowCancelModal(true);
                              }}
                              className="inline-flex items-center gap-1 px-3 py-2 bg-red-100 text-red-700 rounded hover:bg-red-200 text-sm"
                            >
                              <Trash2 size={14} /> キャンセル
                            </button>
                          </>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ============ 設定タブ ============ */}
      {activeTab === 'settings' && (
        <div className="max-w-7xl mx-auto p-4 space-y-4">
          {/* リマインド設定 */}
          <div className="bg-white rounded-2xl shadow-lg p-6">
            <h2 className="text-2xl font-bold mb-6 text-gray-900">🔔 リマインド自動送信設定</h2>

            <div className="space-y-6">
              {/* 送信時刻設定 */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">📅 自動送信時刻</h3>
                <p className="text-sm text-gray-600 mb-3">
                  予約前日に自動でリマインドを送信する時刻を設定してください（毎日その時刻に実行されます）
                </p>
                <div className="flex gap-4 items-end">
                  <div className="flex-1">
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      送信時刻
                    </label>
                    <input
                      type="time"
                      value={reminderSettings.reminderTime}
                      onChange={(e) => setReminderSettings({...reminderSettings, reminderTime: e.target.value})}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <button
                    onClick={saveReminderSettings}
                    disabled={loading}
                    className="px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg font-semibold hover:shadow-lg disabled:opacity-50"
                  >
                    <Save size={18} className="inline mr-2" /> 保存
                  </button>
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  現在の送信時刻: {reminderSettings.reminderTime} （UTC+9）
                </p>
              </div>

              {/* 有効/無効 */}
              <div className="pt-4 border-t">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">⚙️ 自動送信の有効/無効</h3>
                <div className="flex gap-3">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={reminderSettings.reminderEnabled}
                      onChange={(e) => setReminderSettings({...reminderSettings, reminderEnabled: e.target.checked})}
                      className="w-4 h-4"
                    />
                    <span className="text-gray-700 font-semibold">自動送信を有効にする</span>
                  </label>
                </div>
                <p className="text-sm text-gray-600 mt-2">
                  {reminderSettings.reminderEnabled 
                    ? '✅ 自動送信が有効です。毎日指定時刻にリマインドが送信されます。'
                    : '⚠️ 自動送信が無効です。手動リマインドのみ利用可能です。'}
                </p>
              </div>

              {/* トリガー設定手順 */}
              <div className="pt-4 border-t bg-orange-50 p-4 rounded-lg">
                <h3 className="font-semibold text-orange-900 mb-2">⚡ Google Apps Script トリガー設定が必要です</h3>
                <p className="text-sm text-orange-700 mb-3">
                  自動送信を機能させるには、Google Apps Script にトリガーを設定してください：
                </p>
                <ol className="list-decimal list-inside space-y-2 text-sm text-orange-700 ml-2">
                  <li>Google Apps Script エディターを開く</li>
                  <li>左のメニューから「トリガー」をクリック</li>
                  <li>「トリガーを作成」をクリック</li>
                  <li>以下のように設定:
                    <ul className="list-disc list-inside ml-4 mt-1 text-orange-600">
                      <li>関数: <code className="bg-white px-2 py-1 rounded">sendReminderNotifications</code></li>
                      <li>イベント: 日付ベースのタイマー</li>
                      <li>時刻: 毎日 00:00～01:00（深夜）推奨</li>
                    </ul>
                  </li>
                  <li>「作成」をクリック</li>
                </ol>
                <p className="text-xs text-orange-600 mt-3">
                  💡 トリガーは一度だけ設定すればOK。実行時刻は深夜（00:00～01:00）に設定し、上記で指定した送信時刻を使用します。
                </p>
              </div>
            </div>
          </div>

          {/* 通知方法説明 */}
          <div className="bg-white rounded-2xl shadow-lg p-6">
            <h2 className="text-2xl font-bold mb-6 text-gray-900">📮 通知方法の説明</h2>
            <div className="space-y-3">
              <div className="p-3 border border-gray-300 rounded-lg">
                <p className="font-semibold text-gray-900">📧 メール</p>
                <p className="text-sm text-gray-600">メールアドレスにリマインド・キャンセル通知が届きます</p>
              </div>
              <div className="p-3 border border-gray-300 rounded-lg">
                <p className="font-semibold text-gray-900">💬 LINE</p>
                <p className="text-sm text-gray-600">LINEでリマインド・キャンセル通知が届きます</p>
              </div>
              <div className="p-3 border border-gray-300 rounded-lg">
                <p className="font-semibold text-gray-900">📧 + 💬 両方</p>
                <p className="text-sm text-gray-600">メールとLINE両方で通知を受け取ります</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* キャンセルモーダル */}
      {showCancelModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full">
            <h2 className="text-2xl font-bold mb-4 text-gray-900">予約をキャンセル</h2>
            <p className="text-gray-600 mb-4">キャンセル理由を入力してください。顧客に通知が送信されます。</p>

            <div className="mb-6">
              <textarea
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                placeholder="例：顧客からのキャンセル依頼 / スタッフが急に休む など"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 h-24 resize-none"
              />
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowCancelModal(false);
                  setCancelReason('');
                  setCancellingBookingId(null);
                }}
                className="flex-1 px-4 py-3 bg-gray-200 text-gray-900 rounded-lg font-semibold hover:bg-gray-300"
              >
                戻る
              </button>
              <button
                onClick={handleCancelBooking}
                disabled={loading}
                className="flex-1 px-4 py-3 bg-gradient-to-r from-red-600 to-red-700 text-white rounded-lg font-semibold hover:shadow-lg disabled:opacity-50"
              >
                {loading ? 'キャンセル中...' : 'キャンセル'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  // ========== ヘルパー関数 ==========
  function resetForm() {
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
      notificationMethod: 'email',
    });
  }
}
