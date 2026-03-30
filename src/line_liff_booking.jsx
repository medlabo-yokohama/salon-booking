import React, { useState, useEffect } from 'react';

// ========== 設定 ==========
const LIFF_ID = '2009651620-UveMatZR';
const BACKEND_URL = 'https://script.google.com/macros/s/AKfycbwj9Q0wnJ05Tlf4V9gG20qhRMf1YSEmmzFXFC_osPSDFuSckGjIp3k8qiRF29JOHlnn-A/exec';
const SALON_NAME = '横浜医療専門学校附属鍼灸院・接骨院';

export default function LineLiffBooking() {
  // ステップ管理
  // loading→menu→calendar→time→customer→confirm→done
  // register（利用者登録）
  // my-bookings（予約確認）
  const [step, setStep] = useState('loading');
  const [lineUser, setLineUser] = useState(null);
  const [error, setError] = useState('');

  // 予約データ
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedTime, setSelectedTime] = useState('');
  const [selectedStaff, setSelectedStaff] = useState('');
  const [selectedService, setSelectedService] = useState('');
  const [note, setNote] = useState('');
  const [availableSlots, setAvailableSlots] = useState([]);
  const [loading, setLoading] = useState(false);
  const [myBookings, setMyBookings] = useState([]);

  // 顧客情報（予約時入力 or 登録済みから自動入力）
  const [customerInfo, setCustomerInfo] = useState({
    name: '',
    nameKana: '',
    phone: '',
    email: '',
  });
  const [isRegistered, setIsRegistered] = useState(false); // 登録済みかどうか

  // 利用者登録フォーム
  const [registerForm, setRegisterForm] = useState({ name: '', nameKana: '', phone: '', email: '' });
  const [registerMessage, setRegisterMessage] = useState('');
  const [registerSuccess, setRegisterSuccess] = useState(false);

  // マスタデータ
  const staffList = ['施術者A', '施術者B', '施術者C', '施術者D'];
  const serviceList = [
    { name: '柔整', duration: 30 },
    { name: '鍼灸', duration: 30 },
    { name: '美容鍼灸', duration: 60 },
  ];

  // ========== LIFF初期化 ==========
  useEffect(() => { initLiff(); }, []);

  const initLiff = async () => {
    try {
      if (typeof liff === 'undefined') {
        // 開発環境フォールバック
        setLineUser({ displayName: 'テストユーザー', userId: 'test_user_id', pictureUrl: '' });
        setStep('menu');
        return;
      }
      await liff.init({ liffId: LIFF_ID });
      if (!liff.isLoggedIn()) { liff.login(); return; }

      const profile = await liff.getProfile();
      setLineUser(profile);

      // URLパラメータでページ指定
      const urlParams = new URLSearchParams(window.location.search);
      const page = urlParams.get('page');

      // 登録済み情報を取得して自動入力
      await fetchUserProfile(profile.userId);

      if (page === 'register') {
        setStep('register');
      } else {
        setStep('menu');
      }
      fetchMyBookings(profile.userId);
    } catch (err) {
      setError('LIFFの初期化に失敗しました: ' + err.message);
      setStep('error');
    }
  };

  // ========== 登録済み利用者情報を取得 ==========
  const fetchUserProfile = async (userId) => {
    try {
      const res = await fetch(`${BACKEND_URL}?action=getUserProfile&lineUserId=${userId}`);
      const data = await res.json();
      if (data.success && data.user) {
        setCustomerInfo({
          name: data.user.name || '',
          nameKana: data.user.nameKana || '',
          phone: data.user.phone || '',
          email: data.user.email || '',
        });
        setIsRegistered(true);
      }
    } catch (e) {
      // 未登録の場合は何もしない
    }
  };

  // ========== 予約一覧取得 ==========
  const fetchMyBookings = async (userId) => {
    try {
      const res = await fetch(`${BACKEND_URL}?action=getBookingsByLineUser&lineUserId=${userId}`);
      const data = await res.json();
      if (data.success) setMyBookings(data.bookings || []);
    } catch (e) { console.error('予約取得エラー:', e); }
  };

  // ========== 空き時間取得 ==========
  const fetchAvailableSlots = async (date, staff) => {
    if (!date) return;
    setLoading(true);
    try {
      const res = await fetch(`${BACKEND_URL}?action=getAvailableSlots&date=${date}&staff=${encodeURIComponent(staff || '')}`);
      const data = await res.json();
      if (data.success) setAvailableSlots(data.available || []);
      else setAvailableSlots([]);
    } catch (e) { setAvailableSlots([]); }
    finally { setLoading(false); }
  };

  // ========== 予約確定 ==========
  const confirmBooking = async () => {
    if (!customerInfo.name || !customerInfo.phone) {
      setError('氏名と電話番号は必須です');
      return;
    }
    setLoading(true);
    try {
      await fetch(BACKEND_URL, {
        method: 'POST',
        mode: 'no-cors',
        body: JSON.stringify({
          action: 'addBooking',
          data: {
            date: selectedDate,
            time: selectedTime,
            staff: selectedStaff || '指名なし',
            customerName: customerInfo.name,
            customerPhone: customerInfo.phone,
            customerEmail: customerInfo.email,
            service: selectedService,
            note: note,
            lineUserId: lineUser?.userId || '',
            notificationMethod: 'line',
          },
        }),
      });
      setStep('done');
      if (typeof liff !== 'undefined' && liff.isInClient()) {
        await liff.sendMessages([{
          type: 'text',
          text: `✅ 予約が完了しました\n📅 ${selectedDate} ${selectedTime}\n👤 ${selectedStaff || '指名なし'}\n💆 ${selectedService}`,
        }]);
      }
    } catch (e) {
      setError('予約の送信に失敗しました');
    } finally { setLoading(false); }
  };

  // ========== 予約キャンセル ==========
  const cancelBooking = async (bookingId) => {
    if (!confirm('この予約をキャンセルしますか？')) return;
    setLoading(true);
    try {
      await fetch(BACKEND_URL, {
        method: 'POST',
        mode: 'no-cors',
        body: JSON.stringify({ action: 'cancelBooking', data: { bookingId, reason: '利用者によるキャンセル' } }),
      });
      fetchMyBookings(lineUser?.userId);
    } catch (e) { setError('キャンセルに失敗しました'); }
    finally { setLoading(false); }
  };

  // ========== 予約可能日 ==========
  const getAvailableDates = () => {
    const dates = [];
    const today = new Date();
    for (let i = 1; i <= 30; i++) {
      const d = new Date(today);
      d.setDate(today.getDate() + i);
      if (d.getDay() !== 0) dates.push(d.toISOString().split('T')[0]);
    }
    return dates;
  };

  // ========== スタイル ==========
  const S = {
    wrap: { fontFamily: "'Hiragino Sans', 'Noto Sans JP', sans-serif", background: '#f0f4f8', minHeight: '100vh', fontSize: 14 },
    header: { background: '#06C755', color: '#fff', padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 10, position: 'sticky', top: 0, zIndex: 10 },
    headerTitle: { fontSize: 16, fontWeight: 700, flex: 1 },
    avatar: { width: 32, height: 32, borderRadius: '50%', border: '2px solid rgba(255,255,255,.6)' },
    body: { padding: '16px' },
    card: { background: '#fff', borderRadius: 12, padding: '16px', marginBottom: 12, boxShadow: '0 2px 8px rgba(0,0,0,.08)' },
    sectionTitle: { fontSize: 13, fontWeight: 700, color: '#1a4f8a', marginBottom: 10, paddingBottom: 6, borderBottom: '2px solid #dbeafe' },
    menuBtn: { width: '100%', padding: '14px 16px', background: '#fff', border: '1.5px solid #e2e8f0', borderRadius: 10, display: 'flex', alignItems: 'center', gap: 12, marginBottom: 10, cursor: 'pointer', fontSize: 14, fontWeight: 600, color: '#1e293b' },
    primaryBtn: { width: '100%', padding: '14px', background: '#06C755', color: '#fff', border: 'none', borderRadius: 10, fontSize: 15, fontWeight: 700, cursor: 'pointer', marginTop: 8 },
    outlineBtn: { width: '100%', padding: '12px', background: '#fff', color: '#1a4f8a', border: '1.5px solid #1a4f8a', borderRadius: 10, fontSize: 14, fontWeight: 600, cursor: 'pointer', marginTop: 8 },
    dangerBtn: { width: '100%', padding: '12px', background: '#fff', color: '#dc2626', border: '1.5px solid #dc2626', borderRadius: 10, fontSize: 14, fontWeight: 600, cursor: 'pointer', marginTop: 8 },
    chip: (selected) => ({ padding: '8px 14px', borderRadius: 20, border: `1.5px solid ${selected ? '#06C755' : '#e2e8f0'}`, background: selected ? '#d1fae5' : '#fff', color: selected ? '#065f46' : '#475569', fontSize: 13, fontWeight: selected ? 700 : 400, cursor: 'pointer', whiteSpace: 'nowrap' }),
    timeChip: (selected) => ({ padding: '10px 8px', borderRadius: 8, border: `1.5px solid ${selected ? '#1a4f8a' : '#e2e8f0'}`, background: selected ? '#1a4f8a' : '#fff', color: selected ? '#fff' : '#475569', fontSize: 13, fontWeight: selected ? 700 : 400, cursor: 'pointer', textAlign: 'center' }),
    badge: (color) => ({ display: 'inline-block', padding: '2px 8px', borderRadius: 20, fontSize: 11, fontWeight: 700, background: color === 'green' ? '#d1fae5' : '#fee2e2', color: color === 'green' ? '#065f46' : '#991b1b' }),
    input: { width: '100%', padding: '10px 12px', border: '1.5px solid #e2e8f0', borderRadius: 8, fontSize: 14, fontFamily: 'inherit', boxSizing: 'border-box' },
    inputReadonly: { width: '100%', padding: '10px 12px', border: '1.5px solid #e2e8f0', borderRadius: 8, fontSize: 14, fontFamily: 'inherit', boxSizing: 'border-box', background: '#f8fafc', color: '#64748b' },
    textarea: { width: '100%', padding: '10px 12px', border: '1.5px solid #e2e8f0', borderRadius: 8, fontSize: 14, fontFamily: 'inherit', resize: 'vertical', minHeight: 80, boxSizing: 'border-box' },
    backBtn: { background: 'none', border: 'none', color: '#fff', fontSize: 22, cursor: 'pointer', padding: '0 4px' },
    errorBox: { background: '#fee2e2', color: '#991b1b', padding: '10px 14px', borderRadius: 8, marginBottom: 12, fontSize: 13 },
    infoBox: { background: '#eff6ff', color: '#1e40af', padding: '10px 14px', borderRadius: 8, marginBottom: 12, fontSize: 13 },
    successBox: { background: '#d1fae5', color: '#065f46', padding: '10px 14px', borderRadius: 8, marginBottom: 12, fontSize: 13 },
    label: { fontSize: 12, fontWeight: 700, color: '#475569', display: 'block', marginBottom: 4 },
    fieldWrap: { marginBottom: 14 },
    row: { display: 'flex', gap: 8, flexWrap: 'wrap' },
    grid3: { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 },
  };

  // ========== ローディング ==========
  if (step === 'loading') return (
    <div style={{ ...S.wrap, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>🏥</div>
        <p style={{ color: '#64748b', fontSize: 14 }}>読み込み中...</p>
      </div>
    </div>
  );

  // ========== エラー ==========
  if (step === 'error') return (
    <div style={S.wrap}>
      <div style={S.header}><span style={S.headerTitle}>{SALON_NAME}</span></div>
      <div style={S.body}>
        <div style={S.errorBox}>⚠️ {error}</div>
        <button style={S.primaryBtn} onClick={initLiff}>再読み込み</button>
      </div>
    </div>
  );

  // ========== メニュー ==========
  if (step === 'menu') return (
    <div style={S.wrap}>
      <div style={S.header}>
        <span style={{ fontSize: 22 }}>🏥</span>
        <span style={S.headerTitle}>{SALON_NAME}</span>
        {lineUser?.pictureUrl && <img src={lineUser.pictureUrl} alt="" style={S.avatar} />}
      </div>
      <div style={S.body}>
        {lineUser && (
          <div style={{ ...S.card, display: 'flex', alignItems: 'center', gap: 12 }}>
            {lineUser.pictureUrl
              ? <img src={lineUser.pictureUrl} alt="" style={{ width: 44, height: 44, borderRadius: '50%' }} />
              : <div style={{ width: 44, height: 44, borderRadius: '50%', background: '#dbeafe', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 }}>👤</div>
            }
            <div>
              <div style={{ fontWeight: 700, fontSize: 15 }}>{lineUser.displayName}</div>
              <div style={{ fontSize: 12, color: '#64748b' }}>
                {isRegistered ? '✅ 利用者登録済み' : 'LINEアカウントでログイン中'}
              </div>
            </div>
          </div>
        )}
        <div style={S.card}>
          <div style={S.sectionTitle}>メニュー</div>
          <button style={S.menuBtn} onClick={() => setStep('calendar')}>
            <span style={{ fontSize: 24 }}>📅</span>
            <div style={{ textAlign: 'left' }}><div>新規予約</div><div style={{ fontSize: 12, color: '#64748b', fontWeight: 400 }}>日時・施術者・コースを選択</div></div>
            <span style={{ marginLeft: 'auto', color: '#94a3b8' }}>›</span>
          </button>
          <button style={S.menuBtn} onClick={() => { fetchMyBookings(lineUser?.userId); setStep('my-bookings'); }}>
            <span style={{ fontSize: 24 }}>📋</span>
            <div style={{ textAlign: 'left' }}><div>予約確認・キャンセル</div><div style={{ fontSize: 12, color: '#64748b', fontWeight: 400 }}>現在の予約を確認</div></div>
            <span style={{ marginLeft: 'auto', color: '#94a3b8' }}>›</span>
          </button>
          <button style={S.menuBtn} onClick={() => { setRegisterMessage(''); setRegisterSuccess(false); setRegisterForm({ name: customerInfo.name, nameKana: customerInfo.nameKana, phone: customerInfo.phone, email: customerInfo.email }); setStep('register'); }}>
            <span style={{ fontSize: 24 }}>👤</span>
            <div style={{ textAlign: 'left' }}><div>利用者登録{isRegistered ? '・変更' : ''}</div><div style={{ fontSize: 12, color: '#64748b', fontWeight: 400 }}>{isRegistered ? '登録情報を確認・変更' : 'お名前・連絡先を登録'}</div></div>
            <span style={{ marginLeft: 'auto', color: '#94a3b8' }}>›</span>
          </button>
        </div>
        <div style={S.infoBox}>💡 予約の前日にLINEでリマインドが届きます</div>
      </div>
    </div>
  );

  // ========== カレンダー（日付選択）==========
  if (step === 'calendar') return (
    <div style={S.wrap}>
      <div style={S.header}>
        <button style={S.backBtn} onClick={() => setStep('menu')}>‹</button>
        <span style={S.headerTitle}>日付を選択</span>
      </div>
      <div style={S.body}>
        <div style={S.card}>
          <div style={S.sectionTitle}>施術者を選択（任意）</div>
          <div style={{ ...S.row, marginBottom: 12 }}>
            <div style={S.chip(!selectedStaff)} onClick={() => setSelectedStaff('')}>指名なし</div>
            {staffList.map(s => <div key={s} style={S.chip(selectedStaff === s)} onClick={() => setSelectedStaff(s)}>{s}</div>)}
          </div>
        </div>
        <div style={S.card}>
          <div style={S.sectionTitle}>日付を選択</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
            {getAvailableDates().slice(0, 21).map(date => {
              const d = new Date(date);
              const dayNames = ['日','月','火','水','木','金','土'];
              const isSat = d.getDay() === 6;
              return (
                <div key={date} style={{ padding: '10px 6px', borderRadius: 8, border: `1.5px solid ${selectedDate === date ? '#1a4f8a' : '#e2e8f0'}`, background: selectedDate === date ? '#1a4f8a' : '#fff', color: selectedDate === date ? '#fff' : isSat ? '#1d4ed8' : '#1e293b', textAlign: 'center', cursor: 'pointer', fontSize: 12 }}
                  onClick={() => { setSelectedDate(date); setSelectedTime(''); fetchAvailableSlots(date, selectedStaff); }}>
                  <div style={{ fontWeight: 700 }}>{d.getMonth()+1}/{d.getDate()}</div>
                  <div style={{ fontSize: 11 }}>{dayNames[d.getDay()]}</div>
                </div>
              );
            })}
          </div>
        </div>
        <button style={{ ...S.primaryBtn, opacity: selectedDate ? 1 : 0.5 }} disabled={!selectedDate} onClick={() => setStep('time')}>
          次へ：時間帯を選択
        </button>
      </div>
    </div>
  );

  // ========== 時間・コース選択 ==========
  if (step === 'time') return (
    <div style={S.wrap}>
      <div style={S.header}>
        <button style={S.backBtn} onClick={() => setStep('calendar')}>‹</button>
        <span style={S.headerTitle}>{selectedDate} の予約</span>
      </div>
      <div style={S.body}>
        {error && <div style={S.errorBox}>{error}</div>}
        <div style={S.card}>
          <div style={S.sectionTitle}>時間帯を選択</div>
          {loading ? <p style={{ color: '#64748b', fontSize: 13 }}>読み込み中...</p>
            : availableSlots.length === 0 ? <div style={S.errorBox}>この日の空き時間はありません</div>
            : <div style={S.grid3}>{availableSlots.map(time => <div key={time} style={S.timeChip(selectedTime === time)} onClick={() => setSelectedTime(time)}>{time}</div>)}</div>}
        </div>
        <div style={S.card}>
          <div style={S.sectionTitle}>コースを選択 *</div>
          <div style={S.row}>
            {serviceList.map(s => <div key={s.name} style={S.chip(selectedService === s.name)} onClick={() => setSelectedService(s.name)}>{s.name}（{s.duration}分）</div>)}
          </div>
        </div>
        <div style={S.card}>
          <div style={S.sectionTitle}>ご要望・備考（任意）</div>
          <textarea style={S.textarea} placeholder="特別なリクエストがあればご記入ください" value={note} onChange={e => setNote(e.target.value)} />
        </div>
        <button style={{ ...S.primaryBtn, opacity: selectedTime && selectedService ? 1 : 0.5 }} disabled={!selectedTime || !selectedService}
          onClick={() => { setError(''); setStep('customer'); }}>
          次へ：お客様情報の入力
        </button>
        <button style={S.outlineBtn} onClick={() => setStep('calendar')}>戻る</button>
      </div>
    </div>
  );

  // ========== 顧客情報入力 ==========
  if (step === 'customer') return (
    <div style={S.wrap}>
      <div style={S.header}>
        <button style={S.backBtn} onClick={() => setStep('time')}>‹</button>
        <span style={S.headerTitle}>お客様情報</span>
      </div>
      <div style={S.body}>
        {isRegistered && (
          <div style={S.successBox}>✅ 登録済みの情報を自動入力しました。変更する場合は直接編集できます。</div>
        )}
        {error && <div style={S.errorBox}>{error}</div>}
        <div style={S.card}>
          <div style={S.sectionTitle}>お客様情報を入力してください</div>
          <div style={S.fieldWrap}>
            <label style={S.label}>氏名 <span style={{ color: '#dc2626' }}>*</span></label>
            <input style={S.input} type="text" placeholder="山田 太郎" value={customerInfo.name}
              onChange={e => setCustomerInfo({ ...customerInfo, name: e.target.value })} />
          </div>
          <div style={S.fieldWrap}>
            <label style={S.label}>ふりがな</label>
            <input style={S.input} type="text" placeholder="やまだ たろう" value={customerInfo.nameKana}
              onChange={e => setCustomerInfo({ ...customerInfo, nameKana: e.target.value })} />
          </div>
          <div style={S.fieldWrap}>
            <label style={S.label}>電話番号 <span style={{ color: '#dc2626' }}>*</span></label>
            <input style={S.input} type="tel" placeholder="09012345678" value={customerInfo.phone}
              onChange={e => setCustomerInfo({ ...customerInfo, phone: e.target.value })} />
          </div>
          <div style={S.fieldWrap}>
            <label style={S.label}>E-Mail</label>
            <input style={S.input} type="email" placeholder="yamada@example.com" value={customerInfo.email}
              onChange={e => setCustomerInfo({ ...customerInfo, email: e.target.value })} />
          </div>
        </div>
        <button style={{ ...S.primaryBtn, opacity: customerInfo.name && customerInfo.phone ? 1 : 0.5 }}
          disabled={!customerInfo.name || !customerInfo.phone}
          onClick={() => { setError(''); setStep('confirm'); }}>
          次へ：予約内容を確認
        </button>
        <button style={S.outlineBtn} onClick={() => setStep('time')}>戻る</button>
      </div>
    </div>
  );

  // ========== 確認画面 ==========
  if (step === 'confirm') return (
    <div style={S.wrap}>
      <div style={S.header}>
        <button style={S.backBtn} onClick={() => setStep('customer')}>‹</button>
        <span style={S.headerTitle}>予約内容を確認</span>
      </div>
      <div style={S.body}>
        <div style={S.card}>
          <div style={S.sectionTitle}>予約内容</div>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            {[
              ['お名前', customerInfo.name],
              ['電話番号', customerInfo.phone],
              ['E-Mail', customerInfo.email || '未入力'],
              ['予約日', selectedDate],
              ['時間', selectedTime],
              ['施術者', selectedStaff || '指名なし'],
              ['コース', selectedService],
              ['ご要望', note || 'なし'],
            ].map(([k, v]) => (
              <tr key={k}>
                <th style={{ padding: '8px 10px', background: '#f1f5f9', border: '1px solid #e2e8f0', width: '35%', fontWeight: 600, textAlign: 'left', fontSize: 12 }}>{k}</th>
                <td style={{ padding: '8px 10px', border: '1px solid #e2e8f0' }}>{v}</td>
              </tr>
            ))}
          </table>
        </div>
        <div style={S.infoBox}>💬 予約確定後にLINEでリマインドが届きます（前日）</div>
        {error && <div style={S.errorBox}>{error}</div>}
        <button style={{ ...S.primaryBtn, opacity: loading ? 0.6 : 1 }} disabled={loading} onClick={confirmBooking}>
          {loading ? '送信中...' : '予約を確定する'}
        </button>
        <button style={S.outlineBtn} onClick={() => setStep('customer')}>戻る</button>
      </div>
    </div>
  );

  // ========== 完了画面 ==========
  if (step === 'done') return (
    <div style={S.wrap}>
      <div style={S.header}><span style={S.headerTitle}>{SALON_NAME}</span></div>
      <div style={S.body}>
        <div style={{ ...S.card, textAlign: 'center', padding: '32px 16px' }}>
          <div style={{ fontSize: 56, marginBottom: 12 }}>✅</div>
          <h2 style={{ fontSize: 18, fontWeight: 700, color: '#065f46', marginBottom: 8 }}>予約が完了しました</h2>
          <p style={{ fontSize: 13, color: '#64748b', marginBottom: 20 }}>
            {selectedDate} {selectedTime}<br />{selectedService}（{selectedStaff || '指名なし'}）
          </p>
          <div style={{ ...S.successBox, textAlign: 'left', marginBottom: 16 }}>
            📩 LINEにリマインドが届きます（前日）
          </div>
        </div>
        <button style={S.primaryBtn} onClick={() => { setStep('menu'); setSelectedDate(''); setSelectedTime(''); setSelectedStaff(''); setSelectedService(''); setNote(''); setError(''); }}>
          メニューに戻る
        </button>
        <button style={S.outlineBtn} onClick={() => { fetchMyBookings(lineUser?.userId); setStep('my-bookings'); }}>
          予約を確認する
        </button>
      </div>
    </div>
  );

  // ========== 予約確認・キャンセル ==========
  if (step === 'my-bookings') return (
    <div style={S.wrap}>
      <div style={S.header}>
        <button style={S.backBtn} onClick={() => setStep('menu')}>‹</button>
        <span style={S.headerTitle}>予約確認</span>
      </div>
      <div style={S.body}>
        {myBookings.length === 0 ? (
          <div style={S.card}>
            <p style={{ color: '#64748b', fontSize: 13, textAlign: 'center', padding: '20px 0' }}>現在予約はありません</p>
          </div>
        ) : (
          myBookings.map(b => (
            <div key={b.bookingId} style={S.card}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                <div style={{ fontWeight: 700, fontSize: 15 }}>{b.dateTime}</div>
                <span style={S.badge(b.status === 'confirmed' ? 'green' : 'red')}>
                  {b.status === 'confirmed' ? '確定' : 'キャンセル'}
                </span>
              </div>
              <div style={{ fontSize: 13, color: '#64748b', marginBottom: 4 }}>
                👤 {b.staff || '指名なし'} ／ 💆 {b.service}
              </div>
              {b.note && <div style={{ fontSize: 12, color: '#94a3b8' }}>📝 {b.note}</div>}
              {b.status === 'confirmed' && (
                <button style={{ ...S.dangerBtn, marginTop: 10 }} onClick={() => cancelBooking(b.bookingId)}>
                  キャンセルする
                </button>
              )}
            </div>
          ))
        )}
        <button style={S.outlineBtn} onClick={() => setStep('menu')}>メニューに戻る</button>
      </div>
    </div>
  );

  // ========== 利用者登録 ==========
  if (step === 'register') return (
    <div style={S.wrap}>
      <div style={S.header}>
        <button style={S.backBtn} onClick={() => setStep('menu')}>‹</button>
        <span style={S.headerTitle}>利用者登録{isRegistered ? '・変更' : ''}</span>
      </div>
      <div style={S.body}>
        {registerSuccess ? (
          <div style={{ ...S.card, textAlign: 'center', padding: '32px 16px' }}>
            <div style={{ fontSize: 56, marginBottom: 12 }}>✅</div>
            <h2 style={{ fontSize: 18, fontWeight: 700, color: '#065f46', marginBottom: 8 }}>登録が完了しました</h2>
            <p style={{ fontSize: 13, color: '#64748b', marginBottom: 20 }}>次回の予約から自動入力されます。</p>
            <button style={S.primaryBtn} onClick={() => setStep('menu')}>メニューに戻る</button>
          </div>
        ) : (
          <>
            {isRegistered && <div style={S.infoBox}>✅ 登録済みの情報です。変更する場合は編集して「登録する」を押してください。</div>}
            {registerMessage && <div style={S.errorBox}>{registerMessage}</div>}
            <div style={S.card}>
              <div style={S.sectionTitle}>お客様情報</div>
              <div style={S.fieldWrap}>
                <label style={S.label}>氏名 <span style={{ color: '#dc2626' }}>*</span></label>
                <input style={S.input} type="text" placeholder="山田 太郎" value={registerForm.name}
                  onChange={e => setRegisterForm({ ...registerForm, name: e.target.value })} />
              </div>
              <div style={S.fieldWrap}>
                <label style={S.label}>ふりがな <span style={{ color: '#dc2626' }}>*</span></label>
                <input style={S.input} type="text" placeholder="やまだ たろう" value={registerForm.nameKana}
                  onChange={e => setRegisterForm({ ...registerForm, nameKana: e.target.value })} />
              </div>
              <div style={S.fieldWrap}>
                <label style={S.label}>電話番号 <span style={{ color: '#dc2626' }}>*</span></label>
                <input style={S.input} type="tel" placeholder="09012345678" value={registerForm.phone}
                  onChange={e => setRegisterForm({ ...registerForm, phone: e.target.value })} />
              </div>
              <div style={S.fieldWrap}>
                <label style={S.label}>E-Mail</label>
                <input style={S.input} type="email" placeholder="yamada@example.com" value={registerForm.email}
                  onChange={e => setRegisterForm({ ...registerForm, email: e.target.value })} />
              </div>
            </div>
            <button
              style={{ ...S.primaryBtn, opacity: loading ? 0.6 : 1 }}
              disabled={loading}
              onClick={async () => {
                if (!registerForm.name || !registerForm.nameKana || !registerForm.phone) {
                  setRegisterMessage('氏名・ふりがな・電話番号は必須です');
                  return;
                }
                setLoading(true);
                try {
                  await fetch(BACKEND_URL, {
                    method: 'POST',
                    mode: 'no-cors',
                    body: JSON.stringify({
                      action: 'registerUser',
                      data: {
                        name: registerForm.name,
                        nameKana: registerForm.nameKana,
                        phone: registerForm.phone,
                        email: registerForm.email,
                        lineUserId: lineUser?.userId || '',
                        lineDisplayName: lineUser?.displayName || '',
                      },
                    }),
                  });
                  // 登録成功後に顧客情報を更新
                  setCustomerInfo({ name: registerForm.name, nameKana: registerForm.nameKana, phone: registerForm.phone, email: registerForm.email });
                  setIsRegistered(true);
                  setRegisterSuccess(true);
                } catch(e) {
                  setRegisterMessage('登録に失敗しました。もう一度お試しください。');
                } finally { setLoading(false); }
              }}
            >
              {loading ? '送信中...' : isRegistered ? '変更を保存する' : '登録する'}
            </button>
            <button style={S.outlineBtn} onClick={() => setStep('menu')}>キャンセル</button>
          </>
        )}
      </div>
    </div>
  );

  return null;
}
