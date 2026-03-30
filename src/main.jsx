import React from 'react'
import ReactDOM from 'react-dom/client'
import BookingCalendarUI from './booking_calendar_ui_with_notifications.jsx'
import AdminDashboard from './admin_dashboard_with_notifications.jsx'
import HistoryDashboard from './history_dashboard.jsx'
import LineLiffBooking from './line_liff_booking.jsx'

const params = new URLSearchParams(window.location.search)
const isAdmin = params.get('admin') === 'true'
const isHistory = params.get('history') === 'true'
const isLiff = params.get('liff') === 'true'

function App() {
  if (isLiff) return <LineLiffBooking />
  if (isHistory) return <HistoryDashboard />
  if (isAdmin) return <AdminDashboard />
  return <BookingCalendarUI />
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
)
