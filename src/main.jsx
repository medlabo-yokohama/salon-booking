import React from 'react'
import ReactDOM from 'react-dom/client'
import BookingCalendarUI from './booking_calendar_ui_with_notifications.jsx'
import AdminDashboard from './admin_dashboard_with_notifications.jsx'
import HistoryDashboard from './history_dashboard.jsx'

const params = new URLSearchParams(window.location.search)
const isAdmin = params.get('admin') === 'true'
const isHistory = params.get('history') === 'true'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    {isHistory ? <HistoryDashboard /> : isAdmin ? <AdminDashboard /> : <BookingCalendarUI />}
  </React.StrictMode>
)
