import React from 'react'
import ReactDOM from 'react-dom/client'
import BookingCalendarUI from './booking_calendar_ui.jsx'
import AdminDashboard from './admin_dashboard.jsx'

// URLに ?admin=true がついていたら管理画面を表示
const isAdmin = new URLSearchParams(window.location.search).get('admin') === 'true'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    {isAdmin ? <AdminDashboard /> : <BookingCalendarUI />}
  </React.StrictMode>
)
