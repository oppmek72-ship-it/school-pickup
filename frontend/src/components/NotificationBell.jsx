import { useState, useEffect, useRef } from 'react';
import api from '../api/axios';
import { useSocketEvent } from '../hooks/useSocket';

export default function NotificationBell() {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  const fetchNotifications = async () => {
    try {
      const { data } = await api.get('/notifications');
      setNotifications(data);
      setUnreadCount(data.filter(n => n.status === 'unread').length);
    } catch (e) {}
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  useSocketEvent('notification:new', (notif) => {
    setNotifications(prev => [notif, ...prev]);
    setUnreadCount(prev => prev + 1);
  });

  useEffect(() => {
    const handleClick = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const markRead = async () => {
    await api.put('/notifications/read');
    setUnreadCount(0);
    setNotifications(prev => prev.map(n => ({ ...n, status: 'read' })));
  };

  return (
    <div className="relative" ref={ref}>
      <button onClick={() => { setOpen(!open); if (!open) markRead(); }} className="relative p-2">
        <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
        </svg>
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
            {unreadCount}
          </span>
        )}
      </button>
      {open && (
        <div className="absolute right-0 top-full mt-2 w-72 bg-white rounded-xl shadow-lg border max-h-80 overflow-y-auto z-50">
          {notifications.length === 0 ? (
            <p className="p-4 text-center text-gray-400 text-sm">ບໍ່ມີການແຈ້ງເຕືອນ</p>
          ) : (
            notifications.slice(0, 20).map((n, i) => (
              <div key={n.id || i} className={`p-3 border-b last:border-b-0 text-sm ${n.status === 'unread' ? 'bg-blue-50' : ''}`}>
                <p className="text-gray-700">{n.message}</p>
                <p className="text-xs text-gray-400 mt-1">{new Date(n.createdAt).toLocaleString('lo-LA')}</p>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
