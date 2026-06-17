import React, { createContext, useContext, useState, useEffect } from 'react';

const NotificationContext = createContext(null);

export const NotificationProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);
  const [liveDeed, setLiveDeed] = useState(null);

  // Add floating toast notification
  const addToast = (title, message, type = 'info') => {
    const id = Date.now() + Math.random().toString(36).substr(2, 9);
    setToasts((prev) => [...prev, { id, title, message, type }]);

    // Auto remove after 5 seconds
    setTimeout(() => {
      removeToast(id);
    }, 5000);
  };

  const removeToast = (id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  // Connect to Simulated Live Good Deeds SSE stream
  useEffect(() => {
    let eventSource;
    try {
      eventSource = new EventSource('/api/stream/live-deeds');
      
      eventSource.onmessage = (event) => {
        const data = JSON.parse(event.data);
        if (data.type === 'new_deed') {
          setLiveDeed(data.deed);
          addToast(
            '🌱 Việc tốt mới quanh bạn!',
            `${data.deed.author} vừa chia sẻ: "${data.deed.title}" tại ${data.deed.location}`,
            'success'
          );
        }
      };

      eventSource.onerror = () => {
        eventSource?.close();
      };
    } catch (e) {
      console.log('SSE preview fallbacks');
    }

    return () => {
      eventSource?.close();
    };
  }, []);

  return (
    <NotificationContext.Provider value={{ toasts, addToast, removeToast, liveDeed }}>
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotification = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotification must be used within a NotificationProvider');
  }
  return context;
};
