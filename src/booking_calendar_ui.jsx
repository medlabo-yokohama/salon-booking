import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Check, X, Phone, Mail } from 'lucide-react';

/**
 * 顧客向け予約システム UI
 * 特徴：
 * - カレンダー形式（横軸：スタイリスト、縦軸：時間帯）
 * - スマホ完全対応
 * - LINE Loginでの認証対応
 */
export default function BookingCalendarUI() {
  // ========== 状態管理 ==========
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [bookings, setBookings] = useState([]);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [userInfo, setUserInfo] = useState(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [formData, setFormData] = useState({
    customerName: '',
    customerPhone: '',
    customerEmail: '',
    service: '',
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

  const BACKEND_URL = 'https://script.google.com/macros/d/{DEPLOYMENT_ID}/usercallable';

  // ========== 初期化 & LINE Login対応 ==========
  useEffect(() => {
    // LINE Loginからのコールバック処理
    const urlParams = new URLSearchParams(window.location.search);
    const accessToken = urlParams.get('access_token');

    if (accessToken) {
      // LINEユーザー情報を取得
      fetchLINEUserInfo(accessToken);
    }

    // 予約データ取得
    fetchBookings(selectedDate);
  }, [selectedDate]);

  // ========== LINE Login ==========
  const fetchLINEUserInfo = async (accessToken) => {
    try {
      const response = await fetch('https://api.line.me/v2/profile', {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      const data = await response.json();
      setUserInfo({
        name: data.displayName,
        userId: data.userId,
        pictureUrl: data.pictureUrl,
      });
      setFormData(prev => ({ ...prev, customerName: data.displayName }));
    } catch (error) {
      console.error('LINE認証エラー:', error);
    }
  };

  const initiateLineLogin = () => {
    const lineLoginUrl = `https://access.line.me/oauth2/v2.1/authorize?response_type=code&client_id={YOUR_LINE_CLIENT_ID}&redirect_uri=${encodeURIComponent(window.location.origin)}&state=12345&scope=profile`;
    window.location.href = lineLoginUrl;
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

  // ========== 時間帯判定 ==========
  const isBooked = (staff, time) => {
    return bookings.some(
      b => b.staff === staff && b.time === time && b.status !== 'cancelled'
    );
  };

  const getBookingInfo = (staff, time) => {
    return bookings.find(
      b => b.staff === staff && b.time === time && b.status !== 'cancelled'
    );
  };

  // ========== 予約確定 ==========
  const handleBooking = async () => {
    if (!selectedSlot || !formData.customerName || !formData.service) {
      setMessage('必須項目を入力してください');
      return;
    }

    setLoading(true);
    try {
      const dateStr = selectedDate.toISOString().split('T')[0];
      const response = await fetch(BACKEND_URL, {
        method: 'POST',
        mode: 'no-cors',
        body: JSON.stringify({
          action: 'addBooking',
          data: {
            date: dateStr,
            time: selectedSlot.time,
            staff: selectedSlot.staff,
            customerName: formData.customerName,
            customerPhone: formData.customerPhone,
            customerEmail: formData.customerEmail,
            service: formData.service,
            note: formData.note,
            lineUserId: userInfo?.userId,
          },
        }),
      });

      // 予約成功
      setMessage('✓ 予約が確定しました！');
      setShowModal(false);
      setTimeout(() => {
        setMessage('');
        setSelectedSlot(null);
        fetchBookings(selectedDate);
      }, 2000);
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
      month: 'short',
      day: 'numeric',
      weekday: 'short',
    });
  };

  // ========== UI: ログインバナー ==========
  if (!userInfo) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-50 via-white to-purple-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl shadow-2xl p-8 max-w-md w-full">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold bg-gradient-to-r from-pink-600 to-purple-600 bg-clip-text text-transparent mb-2">
              💇‍♀️ サロン予約
            </h1>
            <p className="text-gray-600 text-sm">LINE で簡単ログイン</p>
          </div>

          <button
            onClick={initiateLineLogin}
            className="w-full bg-[#00B900] hover:bg-[#009900] text-white font-bold py-4 rounded-xl transition-all flex items-center justify-center gap-2 mb-4"
          >
            <svg width="24" height="24" viewBox="0 0 48 48" fill="currentColor">
              <path d="M24 4C12.95 4 4 10.82 4 19c0 5 3.13 9.36 7.81 11.92.33 2.12 1.57 6.83 1.84 7.82.04.18.15.28.29.28.06 0 .13-.01.19-.04 1.15-.65 6.78-4.09 9.24-5.61 1.23.16 2.5.25 3.81.25 11.05 0 20-6.82 20-15.18C44 10.82 35.05 4 24 4zm-.5 22h-2v-7h2v7zm5-7h2v7h-2v-7zm5 3.5h-2v3.5h-2v-7h4v3.5z"/>
            </svg>
            LINE でログイン
          </button>

          <div className="relative mb-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white text-gray-500">または</span>
            </div>
          </div>

          <div className="space-y-3">
            <input
              type="text"
              placeholder="お名前"
              value={formData.customerName}
              onChange={(e) => setFormData({...formData, customerName: e.target.value})}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500"
            />
            <input
              type="email"
              placeholder="メールアドレス"
              value={formData.customerEmail}
              onChange={(e) => setFormData({...formData, customerEmail: e.target.value})}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500"
            />
            <button
              onClick={() => setFormData({...formData, customerName: formData.customerName || 'ゲスト'})}
              className="w-full bg-gradient-to-r from-pink-500 to-purple-500 text-white font-bold py-3 rounded-lg hover:shadow-lg transition-all"
            >
              ゲストで続行
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ========== UI: メイン予約画面 ==========
  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-white to-purple-50">
      {/* ヘッダー */}
      <div className="sticky top-0 z-30 bg-white shadow-md">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              {userInfo?.pictureUrl && (
                <img 
                  src={userInfo.pictureUrl} 
                  alt={userInfo.name}
                  className="w-10 h-10 rounded-full"
                />
              )}
              <div>
                <h1 className="text-2xl font-bold text-gray-900">💇 サロン予約</h1>
                <p className="text-xs text-gray-600">ログイン中: {userInfo.name}</p>
              </div>
            </div>
          </div>

          {/* 日付ナビゲーション */}
          <div className="flex items-center justify-between gap-4">
            <button
              onClick={() => addDays(-1)}
              className="p-2 hover:bg-pink-100 rounded-lg transition"
            >
              <ChevronLeft size={20} />
            </button>

            <div className="text-center flex-1">
              <p className="text-xl font-bold text-gray-900">
                {formatDate(selectedDate)}
              </p>
            </div>

            <button
              onClick={() => addDays(1)}
              className="p-2 hover:bg-pink-100 rounded-lg transition"
            >
              <ChevronRight size={20} />
            </button>
          </div>
        </div>
      </div>

      {/* メッセージ表示 */}
      {message && (
        <div className={`mx-4 mt-4 p-4 rounded-lg text-center ${
          message.includes('✓') ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
        }`}>
          {message}
        </div>
      )}

      {/* カレンダー表 */}
      <div className="max-w-7xl mx-auto p-4">
        <div className="bg-white rounded-2xl shadow-lg overflow-x-auto">
          <table className="w-full text-sm md:text-base">
            <thead>
              <tr className="bg-gradient-to-r from-pink-100 to-purple-100 border-b-2 border-pink-300">
                <th className="px-3 py-4 font-bold text-gray-900 text-left sticky left-0 bg-gradient-to-r from-pink-100 to-purple-100 w-20 md:w-24">
                  時間
                </th>
                {staffList.map(staff => (
                  <th
                    key={staff}
                    className="px-2 md:px-4 py-4 font-bold text-gray-900 text-center min-w-[120px] md:min-w-[150px]"
                  >
                    {staff}
                  </th>
                ))}
              </tr>
            </thead>

            <tbody>
              {timeSlots.map((time, idx) => (
                <tr
                  key={time}
                  className={`border-b ${idx % 2 === 0 ? 'bg-white' : 'bg-pink-50'}`}
                >
                  {/* 時間列 */}
                  <td className="px-3 py-4 font-semibold text-gray-700 sticky left-0 bg-inherit z-10">
                    {time}
                  </td>

                  {/* スタイリスト列 */}
                  {staffList.map(staff => {
                    const booked = isBooked(staff, time);
                    const bookingInfo = getBookingInfo(staff, time);

                    return (
                      <td
                        key={`${staff}-${time}`}
                        className="px-2 md:px-4 py-4 text-center"
                      >
                        <button
                          onClick={() => {
                            if (!booked) {
                              setSelectedSlot({ staff, time });
                              setShowModal(true);
                            }
                          }}
                          disabled={booked}
                          className={`w-full py-3 px-2 rounded-lg font-semibold transition-all text-xs md:text-sm ${
                            booked
                              ? 'bg-red-200 text-red-800 cursor-not-allowed opacity-60'
                              : 'bg-gradient-to-br from-pink-400 to-purple-400 text-white hover:shadow-lg hover:scale-105'
                          }`}
                        >
                          {booked ? (
                            <div className="flex items-center justify-center gap-1">
                              <X size={14} />
                              <span className="hidden md:inline">予約済</span>
                            </div>
                          ) : (
                            '予約可'
                          )}
                        </button>
                        {booked && bookingInfo && (
                          <p className="text-xs text-gray-500 mt-1 truncate">
                            {bookingInfo.customerName}
                          </p>
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* 予約モーダル */}
      {showModal && selectedSlot && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl shadow-2xl p-6 max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <h2 className="text-2xl font-bold mb-6 text-gray-900">
              予約確定
            </h2>

            <div className="space-y-4 mb-6">
              <div className="bg-pink-50 p-4 rounded-lg">
                <p className="text-sm text-gray-600">日時</p>
                <p className="text-lg font-bold text-gray-900">
                  {formatDate(selectedDate)} {selectedSlot.time}
                </p>
              </div>

              <div className="bg-purple-50 p-4 rounded-lg">
                <p className="text-sm text-gray-600">スタイリスト</p>
                <p className="text-lg font-bold text-gray-900">
                  {selectedSlot.staff}
                </p>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  メニュー <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.service}
                  onChange={(e) => setFormData({...formData, service: e.target.value})}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500"
                >
                  <option value="">選択してください</option>
                  {serviceList.map(service => (
                    <option key={service} value={service}>{service}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  電話番号
                </label>
                <input
                  type="tel"
                  value={formData.customerPhone}
                  onChange={(e) => setFormData({...formData, customerPhone: e.target.value})}
                  placeholder="09012345678"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  ご要望・備考
                </label>
                <textarea
                  value={formData.note}
                  onChange={(e) => setFormData({...formData, note: e.target.value})}
                  placeholder="特別なリクエストがあればお書きください"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 h-20 resize-none"
                />
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setShowModal(false)}
                className="flex-1 px-6 py-3 bg-gray-200 text-gray-900 rounded-lg font-semibold hover:bg-gray-300"
              >
                キャンセル
              </button>
              <button
                onClick={handleBooking}
                disabled={loading}
                className="flex-1 px-6 py-3 bg-gradient-to-r from-pink-500 to-purple-500 text-white rounded-lg font-semibold hover:shadow-lg disabled:opacity-50"
              >
                {loading ? '予約中...' : '予約を確定'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* フッター */}
      <div className="border-t mt-12 bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4 text-center text-gray-600 text-sm">
          <p className="mb-4">ご不明な点がございましたら、お気軽にお問い合わせください</p>
          <div className="flex justify-center gap-6">
            <a href="tel:09012345678" className="flex items-center gap-1 hover:text-pink-500">
              <Phone size={16} /> 090-1234-5678
            </a>
            <a href="mailto:salon@example.com" className="flex items-center gap-1 hover:text-pink-500">
              <Mail size={16} /> salon@example.com
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
