# Socket.IO Notification Integration Guide for Frontend

## Overview
Hệ thống Socket.IO cho phép FE nhận thông báo real-time về các sự kiện liên quan đến invoice, order, và delivery.

## 1. Setup & Connection

### 1.1 Installation
```bash
npm install socket.io-client
# or
yarn add socket.io-client
```

### 1.2 Initialize Socket Connection
```typescript
import { io, Socket } from 'socket.io-client';

// Kết nối socket với authentication
const socket: Socket = io('YOUR_BACKEND_URL', {
  auth: {
    token: 'YOUR_ACCESS_TOKEN',      // Access token từ login
    userType: 'STAFF'                 // 'CUSTOMER' hoặc 'STAFF'
  },
  withCredentials: true
});
```

**Lưu ý:**
- `token`: Access token lấy từ API đăng nhập
- `userType`:
  - `'CUSTOMER'`: Dành cho khách hàng
  - `'STAFF'`: Dành cho nhân viên (Sale Staff, Operation Staff, Manager)

### 1.3 Connection Events
```typescript
// Khi kết nối thành công
socket.on('connect', () => {
  console.log('✅ Socket connected:', socket.id);
});

// Khi bị ngắt kết nối
socket.on('disconnect', (reason) => {
  console.log('❌ Socket disconnected:', reason);
});

// Khi có lỗi kết nối
socket.on('connect_error', (error) => {
  console.error('❌ Connection error:', error.message);
  // Có thể là do:
  // - Token không hợp lệ hoặc hết hạn
  // - userType không đúng
  // - Không có quyền truy cập
});
```

---

## 2. Notification Events

Hệ thống có 4 loại notification events chính:

### 2.1 RECEIVE_INVOICE_CREATE
**Mô tả**: Nhận thông báo khi có invoice mới được tạo

**Đối tượng nhận**:
- ✅ Sale Staff (role: `SALE_STAFF`)
- ❌ Không gửi cho Operation Staff, Manager, Customer

**Event name**: `RECEIVE_INVOICE_CREATE`

**Data Structure**:
```typescript
interface ReceiveInvoiceCreateData {
  newNotification: {
    _id: string;                      // ID của notification
    title: string;                    // "New Order Is Created"
    type: 'INVOICE_CREATE';           // Loại notification
    message: string;                  // "{fullName} has create an invoice {invoiceCode}, click to see more detail"
    metadata: {
      invoiceId: string;              // ID của invoice vừa tạo
    };
    createdAt: string;                // Formatted date string (DD/MM/YYYY HH:mm:ss)
    isRead: boolean;                  // Always false for new socket notifications
  };
}
```

**Example Usage**:
```typescript
socket.on('RECEIVE_INVOICE_CREATE', (data: ReceiveInvoiceCreateData) => {
  console.log('🔔 New invoice created:', data.newNotification);

  // Hiển thị notification popup
  showNotification({
    title: data.newNotification.title,
    message: data.newNotification.message,
    type: 'info',
    onClick: () => {
      // Redirect đến trang chi tiết invoice
      navigateToInvoice(data.newNotification.metadata.invoiceId);
    }
  });

  // Cập nhật notification badge count
  updateNotificationCount();
});
```

---

### 2.2 RECEIVE_ASSIGN_ORDER
**Mô tả**: Nhận thông báo khi operation staff được assign một order

**Đối tượng nhận**:
- ✅ Operation Staff được assign (cá nhân, private notification)
- ❌ Không gửi cho staff khác, Manager, Customer

**Event name**: `RECEIVE_ASSIGN_ORDER`

**Data Structure**:
```typescript
interface ReceiveAssignOrderData {
  newNotification: {
    _id: string;
    title: string;                    // "New Order Is Assigned"
    type: 'ASSIGN_ORDER';
    message: string;                  // "You has been assigned to order {orderCode}, click to see more detail"
    metadata: {
      orderId: string;                // ID của order được assign
    };
    createdAt: string;                // Formatted date string (DD/MM/YYYY HH:mm:ss)
    isRead: boolean;                  // Always false for new socket notifications
  };
}
```

**Example Usage**:
```typescript
socket.on('RECEIVE_ASSIGN_ORDER', (data: ReceiveAssignOrderData) => {
  console.log('🔔 New order assigned to you:', data.newNotification);

  // Hiển thị notification quan trọng (có thể dùng toast hoặc modal)
  showImportantNotification({
    title: data.newNotification.title,
    message: data.newNotification.message,
    type: 'success',
    duration: 5000, // Hiển thị lâu hơn vì là task assignment
    onClick: () => {
      navigateToOrder(data.newNotification.metadata.orderId);
    }
  });

  // Phát âm thanh thông báo (optional)
  playNotificationSound();

  // Cập nhật task list
  refreshTaskList();
});
```

---

### 2.3 RECEIVE_ASSIGN_INVOICE
**Mô tả**: Nhận thông báo khi staff được assign để xử lý delivery của invoice

**Đối tượng nhận**:
- ✅ Staff được assign xử lý delivery (private notification)
- ❌ Không gửi cho staff khác

**Event name**: `RECEIVE_ASSIGN_INVOICE`

**Data Structure**:
```typescript
interface ReceiveAssignInvoiceData {
  newNotification: {
    _id: string;
    title: string;                    // "New Delivery Invoice Is Assigned"
    type: 'ASSIGN_INVOICE';
    message: string;                  // "You has been assigned to invoice {invoiceCode} to handle delivery, click to see more detail"
    metadata: {
      invoiceId: string;              // ID của invoice cần xử lý delivery
    };
    createdAt: string;                // Formatted date string (DD/MM/YYYY HH:mm:ss)
    isRead: boolean;                  // Always false for new socket notifications
  };
}
```

**Example Usage**:
```typescript
socket.on('RECEIVE_ASSIGN_INVOICE', (data: ReceiveAssignInvoiceData) => {
  console.log('🔔 New delivery invoice assigned:', data.newNotification);

  // Hiển thị notification với action button
  showNotificationWithAction({
    title: data.newNotification.title,
    message: data.newNotification.message,
    type: 'warning',
    actions: [
      {
        label: 'View Details',
        onClick: () => navigateToInvoiceDelivery(data.newNotification.metadata.invoiceId)
      },
      {
        label: 'Dismiss',
        onClick: () => dismissNotification()
      }
    ]
  });

  // Cập nhật delivery task list
  refreshDeliveryTasks();
});
```

---

### 2.4 RECEIVE_COMPLETE_INVOICE
**Mô tả**: Nhận thông báo khi invoice đã hoàn thành và sẵn sàng để assign delivery

**Đối tượng nhận**:
- ✅ Manager phụ trách (private notification)
- ❌ Không gửi cho staff khác

**Event name**: `RECEIVE_COMPLETE_INVOICE`

**Data Structure**:
```typescript
interface ReceiveCompleteInvoiceData {
  newNotification: {
    _id: string;
    title: string;                    // "New Invoice Is Completed"
    type: 'COMPLETE_INVOICE';
    message: string;                  // "Invoice {invoiceCode} has been completed and ready to assign to handle delivery, click to see more detail"
    metadata: {
      invoiceId: string;              // ID của invoice đã hoàn thành
    };
    createdAt: string;                // Formatted date string (DD/MM/YYYY HH:mm:ss)
    isRead: boolean;                  // Always false for new socket notifications
  };
}
```

**Example Usage**:
```typescript
socket.on('RECEIVE_COMPLETE_INVOICE', (data: ReceiveCompleteInvoiceData) => {
  console.log('🔔 Invoice completed, ready for delivery:', data.newNotification);

  // Hiển thị notification với action assign delivery staff
  showNotificationWithAction({
    title: data.newNotification.title,
    message: data.newNotification.message,
    type: 'success',
    actions: [
      {
        label: 'Assign Delivery Staff',
        onClick: () => openAssignDeliveryModal(data.newNotification.metadata.invoiceId)
      },
      {
        label: 'View Invoice',
        onClick: () => navigateToInvoice(data.newNotification.metadata.invoiceId)
      }
    ]
  });

  // Cập nhật danh sách invoice cần assign
  refreshPendingAssignmentList();
});
```

---

## 3. Room Structure & Authorization

### 3.1 Automatic Room Joining
Khi kết nối thành công, staff sẽ tự động join vào các rooms sau (dựa trên role):

```typescript
// Room structure cho STAFF userType:
{
  public_all: 'NOTIFICATION:PUBLIC:ALL',           // Tất cả staff
  public_role: 'NOTIFICATION:PUBLIC:{role}',       // Staff cùng role (VD: SALE_STAFF, OPERATION_STAFF)
  private: 'NOTIFICATION:PRIVATE:{userId}'         // Notification riêng cho user cụ thể
}
```

**Ví dụ với Sale Staff (userId = "abc123", role = "SALE_STAFF")**:
- Join room: `NOTIFICATION:PUBLIC:ALL`
- Join room: `NOTIFICATION:PUBLIC:SALE_STAFF`
- Join room: `NOTIFICATION:PRIVATE:abc123`

### 3.2 Room Usage by Event Type

| Event | Room Type | Room Name |
|-------|-----------|-----------|
| `RECEIVE_INVOICE_CREATE` | Public Role | `NOTIFICATION:PUBLIC:SALE_STAFF` |
| `RECEIVE_ASSIGN_ORDER` | Private | `NOTIFICATION:PRIVATE:{assignedStaffId}` |
| `RECEIVE_ASSIGN_INVOICE` | Private | `NOTIFICATION:PRIVATE:{staffHandleDeliveryId}` |
| `RECEIVE_COMPLETE_INVOICE` | Private | `NOTIFICATION:PRIVATE:{managerOnboardId}` |

**Lưu ý**: FE không cần manually join/leave rooms, hệ thống backend tự động xử lý.

---

## 4. Complete Implementation Example

### 4.1 React Hook Implementation
```typescript
import { useEffect, useState, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';

interface Notification {
  _id: string;
  title: string;
  type: string;
  message: string;
  metadata: any;
  createdAt: string;                  // Formatted date string
  isRead: boolean;
}

export const useSocketNotification = (token: string | null, userType: 'CUSTOMER' | 'STAFF') => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (!token) return;

    // Initialize socket connection
    const newSocket = io(process.env.REACT_APP_SOCKET_URL || 'http://localhost:3000', {
      auth: { token, userType },
      withCredentials: true
    });

    // Connection handlers
    newSocket.on('connect', () => {
      console.log('✅ Socket connected');
      setIsConnected(true);
    });

    newSocket.on('disconnect', (reason) => {
      console.log('❌ Socket disconnected:', reason);
      setIsConnected(false);
    });

    newSocket.on('connect_error', (error) => {
      console.error('❌ Connection error:', error.message);
      setIsConnected(false);
    });

    // Notification event handlers
    newSocket.on('RECEIVE_INVOICE_CREATE', (data) => {
      handleNewNotification(data.newNotification);
    });

    newSocket.on('RECEIVE_ASSIGN_ORDER', (data) => {
      handleNewNotification(data.newNotification);
    });

    newSocket.on('RECEIVE_ASSIGN_INVOICE', (data) => {
      handleNewNotification(data.newNotification);
    });

    newSocket.on('RECEIVE_COMPLETE_INVOICE', (data) => {
      handleNewNotification(data.newNotification);
    });

    setSocket(newSocket);

    // Cleanup on unmount
    return () => {
      newSocket.disconnect();
    };
  }, [token, userType]);

  const handleNewNotification = useCallback((notification: Notification) => {
    setNotifications(prev => [notification, ...prev]);
    setUnreadCount(prev => prev + 1);

    // Show browser notification if permission granted
    if (Notification.permission === 'granted') {
      new Notification(notification.title, {
        body: notification.message,
        icon: '/notification-icon.png'
      });
    }
  }, []);

  const markAsRead = useCallback((notificationId: string) => {
    setNotifications(prev =>
      prev.map(n => n._id === notificationId ? { ...n, isRead: true } : n)
    );
    setUnreadCount(prev => Math.max(0, prev - 1));
  }, []);

  const clearAll = useCallback(() => {
    setNotifications([]);
    setUnreadCount(0);
  }, []);

  return {
    socket,
    isConnected,
    notifications,
    unreadCount,
    markAsRead,
    clearAll
  };
};
```

### 4.2 Usage in Component
```typescript
import React from 'react';
import { useSocketNotification } from './hooks/useSocketNotification';
import { useAuth } from './hooks/useAuth'; // Your auth hook

const NotificationBell: React.FC = () => {
  const { token, userType } = useAuth();
  const { isConnected, notifications, unreadCount, markAsRead } = useSocketNotification(token, userType);

  return (
    <div className="notification-container">
      <div className="notification-bell">
        <span className="icon">🔔</span>
        {unreadCount > 0 && (
          <span className="badge">{unreadCount}</span>
        )}
        <span className={`status ${isConnected ? 'connected' : 'disconnected'}`} />
      </div>

      <div className="notification-dropdown">
        {notifications.length === 0 ? (
          <p>No notifications</p>
        ) : (
          notifications.map(notif => (
            <div
              key={notif._id}
              className={`notification-item ${notif.isRead ? 'read' : 'unread'}`}
              onClick={() => {
                markAsRead(notif._id);
                // Handle navigation based on notification type
                handleNotificationClick(notif);
              }}
            >
              <h4>{notif.title}</h4>
              <p>{notif.message}</p>
              <small>{new Date(notif.createdAt).toLocaleString()}</small>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

const handleNotificationClick = (notification: Notification) => {
  const { type, metadata } = notification;

  switch (type) {
    case 'INVOICE_CREATE':
      window.location.href = `/invoices/${metadata.invoiceId}`;
      break;
    case 'ASSIGN_ORDER':
      window.location.href = `/orders/${metadata.orderId}`;
      break;
    case 'ASSIGN_INVOICE':
      window.location.href = `/invoices/${metadata.invoiceId}/delivery`;
      break;
    case 'COMPLETE_INVOICE':
      window.location.href = `/invoices/${metadata.invoiceId}/assign-delivery`;
      break;
  }
};

export default NotificationBell;
```

---

## 5. Error Handling

### 5.1 Common Errors

| Error | Cause | Solution |
|-------|-------|----------|
| `INVALID_TOKEN` | Token không hợp lệ hoặc hết hạn | Refresh token và reconnect |
| `INVALID_USER_TYPE` | userType không phải 'CUSTOMER' hoặc 'STAFF' | Kiểm tra lại giá trị userType |
| `connect_error` | Lỗi kết nối (network, CORS, auth) | Kiểm tra network, token, và CORS config |
| `disconnect` | Mất kết nối | Socket.IO sẽ tự động reconnect |

### 5.2 Error Handling Example
```typescript
socket.on('connect_error', (error) => {
  console.error('Connection error:', error.message);

  // Handle specific errors
  if (error.message.includes('INVALID_TOKEN')) {
    // Token expired, refresh and reconnect
    refreshTokenAndReconnect();
  } else if (error.message.includes('INVALID_USER_TYPE')) {
    // Wrong user type
    console.error('Invalid user type provided');
  } else {
    // Generic error handling
    showErrorToast('Failed to connect to notification service');
  }
});

// Auto-reconnect logic
socket.io.on('reconnect_attempt', () => {
  console.log('Attempting to reconnect...');
});

socket.io.on('reconnect', (attemptNumber) => {
  console.log('Reconnected successfully after', attemptNumber, 'attempts');
});

socket.io.on('reconnect_failed', () => {
  console.error('Failed to reconnect to socket');
  showErrorToast('Unable to restore notification connection');
});
```

---

## 6. Best Practices

### 6.1 Connection Management
```typescript
// ✅ DO: Initialize socket once in app root/layout
// ✅ DO: Use context or state management to share socket instance
// ❌ DON'T: Create multiple socket connections
// ❌ DON'T: Initialize socket in multiple components

// Example with React Context
import { createContext, useContext } from 'react';

const SocketContext = createContext<Socket | null>(null);

export const SocketProvider: React.FC = ({ children }) => {
  const { token, userType } = useAuth();
  const [socket] = useState(() => {
    if (!token) return null;
    return io(SOCKET_URL, {
      auth: { token, userType },
      withCredentials: true
    });
  });

  useEffect(() => {
    return () => socket?.disconnect();
  }, []);

  return (
    <SocketContext.Provider value={socket}>
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => useContext(SocketContext);
```

### 6.2 Performance Optimization
```typescript
// ✅ DO: Use useCallback for event handlers
const handleNotification = useCallback((data) => {
  // Handle notification
}, [dependencies]);

// ✅ DO: Clean up event listeners
useEffect(() => {
  socket?.on('RECEIVE_INVOICE_CREATE', handleNotification);

  return () => {
    socket?.off('RECEIVE_INVOICE_CREATE', handleNotification);
  };
}, [socket, handleNotification]);

// ✅ DO: Limit notification history
const MAX_NOTIFICATIONS = 50;
setNotifications(prev => [notification, ...prev].slice(0, MAX_NOTIFICATIONS));
```

### 6.3 User Experience
```typescript
// ✅ Request notification permission on user action
const requestNotificationPermission = async () => {
  if ('Notification' in window && Notification.permission === 'default') {
    await Notification.requestPermission();
  }
};

// ✅ Group similar notifications
const groupedNotifications = notifications.reduce((acc, notif) => {
  const key = notif.type;
  if (!acc[key]) acc[key] = [];
  acc[key].push(notif);
  return acc;
}, {});

// ✅ Implement notification sound (optional, user preference)
const playNotificationSound = () => {
  const audio = new Audio('/notification-sound.mp3');
  audio.play().catch(console.error);
};

// ✅ Show connection status indicator
<div className={`connection-status ${isConnected ? 'online' : 'offline'}`}>
  {isConnected ? '🟢 Connected' : '🔴 Disconnected'}
</div>
```

---

## 7. Testing

### 7.1 Test Connection
```typescript
// Test if socket connects successfully
socket.on('connect', () => {
  console.log('✅ Connection test passed');
  console.log('Socket ID:', socket.id);
  console.log('Connected:', socket.connected);
});
```

### 7.2 Debug Mode
```typescript
// Enable debug mode to see all socket events
const socket = io(SOCKET_URL, {
  auth: { token, userType },
  withCredentials: true,
  // Enable debug logging
  transports: ['websocket', 'polling'],
  debug: true
});

// Log all events for debugging
const originalOn = socket.on.bind(socket);
socket.on = (event: string, handler: any) => {
  return originalOn(event, (...args: any[]) => {
    console.log(`[Socket Event] ${event}:`, args);
    return handler(...args);
  });
};
```

---

## 8. Troubleshooting

### Issue: Socket not connecting
**Check:**
1. Is token valid and not expired?
2. Is userType correctly set to 'CUSTOMER' or 'STAFF'?
3. Is CORS configured correctly on backend?
4. Is backend Socket.IO server running?

### Issue: Not receiving notifications
**Check:**
1. Is socket connected? (check `socket.connected`)
2. Does your user role match the notification target role?
3. Are event listeners registered before events are emitted?
4. Check browser console for errors

### Issue: Duplicate notifications
**Check:**
1. Are you creating multiple socket connections?
2. Are event listeners registered multiple times?
3. Use `socket.off()` to clean up old listeners

---

## 9. API Reference

### Socket Connection Options
```typescript
interface SocketOptions {
  auth: {
    token: string;              // Required: Access token
    userType: 'CUSTOMER' | 'STAFF';  // Required: User type
  };
  withCredentials: boolean;     // Should be true for cookies
  transports?: ['websocket', 'polling'];  // Transport methods
  reconnection?: boolean;       // Auto reconnect (default: true)
  reconnectionAttempts?: number;  // Max reconnect attempts (default: Infinity)
  reconnectionDelay?: number;   // Delay between reconnects (default: 1000ms)
}
```

### Notification Data Types
```typescript
type NotificationType =
  | 'INVOICE_CREATE'
  | 'ASSIGN_ORDER'
  | 'ASSIGN_INVOICE'
  | 'COMPLETE_INVOICE';

interface NotificationMetadata {
  invoiceId?: string;  // For INVOICE_CREATE, ASSIGN_INVOICE, COMPLETE_INVOICE
  orderId?: string;    // For ASSIGN_ORDER
}

interface Notification {
  _id: string;
  title: string;
  type: NotificationType;
  message: string;
  metadata: NotificationMetadata;
  createdAt: string;                  // Formatted date string (DD/MM/YYYY HH:mm:ss)
  isRead: boolean;
}
```

---

## 11. Fetching Notification History with Lazy Load

### 11.1 API Endpoint
```
GET /api/v1/notifications
```

### 11.2 Query Parameters
```typescript
interface NotificationListQuery {
  lastNotificationAt?: number;        // Timestamp của notification cuối cùng (for lazy load)
  limit?: number;                     // Số lượng notifications mỗi lần load (default: 10, max: 100)
  isRead?: 'true' | 'false';         // Filter theo trạng thái đã đọc
}
```

### 11.3 Response Format
```typescript
interface NotificationListResponse {
  notifications: Array<{
    _id: string;
    title: string;
    message: string;
    type: NotificationType;
    isRead: boolean;
    metadata: NotificationMetadata;
    createdAt: string;                // Formatted date string (DD/MM/YYYY HH:mm:ss)
  }>;
  pagination: {
    hasNext: boolean;                 // true nếu còn notifications để load
    lastItem: number | null;          // Timestamp của notification cuối cùng (dùng cho lần load tiếp)
  };
}
```

### 11.4 Usage Examples

**Initial Load (First time)**:
```typescript
// Load first 10 notifications
const response = await fetch('/api/v1/notifications?limit=10');
const data = await response.json();

console.log(data);
// {
//   notifications: [...],
//   pagination: {
//     hasNext: true,
//     lastItem: 1709971200000
//   }
// }
```

**Lazy Load (Load more when scrolling)**:
```typescript
// Load next 10 notifications using lastItem from previous response
const response = await fetch(`/api/v1/notifications?limit=10&lastNotificationAt=${lastItem}`);
const data = await response.json();

console.log(data);
// {
//   notifications: [...],
//   pagination: {
//     hasNext: true,
//     lastItem: 1709884800000
//   }
// }
```

**Filter by Read Status**:
```typescript
// Load only unread notifications
const response = await fetch('/api/v1/notifications?limit=10&isRead=false');

// Load only read notifications
const response = await fetch('/api/v1/notifications?limit=10&isRead=true');
```

### 11.5 React Implementation with Lazy Load

```typescript
import { useState, useEffect, useCallback } from 'react';
import { useInView } from 'react-intersection-observer'; // npm install react-intersection-observer

interface Notification {
  _id: string;
  title: string;
  message: string;
  type: string;
  isRead: boolean;
  metadata: any;
  createdAt: string;
}

const NotificationList: React.FC = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [hasNext, setHasNext] = useState(true);
  const [lastItem, setLastItem] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);

  // Intersection observer for infinite scroll
  const { ref, inView } = useInView({
    threshold: 0,
  });

  // Fetch notifications
  const fetchNotifications = useCallback(async (lastNotificationAt?: number) => {
    if (loading) return;

    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.append('limit', '10');
      if (lastNotificationAt) {
        params.append('lastNotificationAt', lastNotificationAt.toString());
      }

      const response = await fetch(`/api/v1/notifications?${params}`);
      const data = await response.json();

      if (lastNotificationAt) {
        // Append to existing notifications (lazy load)
        setNotifications(prev => [...prev, ...data.notifications]);
      } else {
        // Initial load
        setNotifications(data.notifications);
      }

      setHasNext(data.pagination.hasNext);
      setLastItem(data.pagination.lastItem);
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
    } finally {
      setLoading(false);
    }
  }, [loading]);

  // Initial load
  useEffect(() => {
    fetchNotifications();
  }, []);

  // Load more when scrolled to bottom
  useEffect(() => {
    if (inView && hasNext && !loading && lastItem) {
      fetchNotifications(lastItem);
    }
  }, [inView, hasNext, loading, lastItem, fetchNotifications]);

  return (
    <div className="notification-list">
      {notifications.map((notif) => (
        <div
          key={notif._id}
          className={`notification-item ${notif.isRead ? 'read' : 'unread'}`}
        >
          <h4>{notif.title}</h4>
          <p>{notif.message}</p>
          <small>{notif.createdAt}</small>
        </div>
      ))}

      {/* Loading indicator */}
      {loading && <div className="loading">Loading...</div>}

      {/* Infinite scroll trigger */}
      {hasNext && !loading && <div ref={ref} style={{ height: 20 }} />}

      {/* End of list */}
      {!hasNext && <div className="end-message">No more notifications</div>}
    </div>
  );
};

export default NotificationList;
```

### 11.6 Mark Notification as Read

**Endpoint**:
```
PATCH /api/v1/notifications/:notificationId/read
```

**Usage**:
```typescript
const markAsRead = async (notificationId: string) => {
  try {
    await fetch(`/api/v1/notifications/${notificationId}/read`, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    // Update local state
    setNotifications(prev =>
      prev.map(n => n._id === notificationId ? { ...n, isRead: true } : n)
    );
  } catch (error) {
    console.error('Failed to mark as read:', error);
  }
};
```

### 11.7 Best Practices for Lazy Load

1. **Cache Management**: Store notifications in memory/state để tránh load lại
2. **Optimistic Updates**: Cập nhật UI ngay khi nhận socket event, không cần fetch lại
3. **Merge Socket + API**: Khi nhận notification mới qua socket, thêm vào đầu list
4. **Debounce Scroll**: Tránh gọi API quá nhiều khi scroll nhanh
5. **Error Handling**: Hiển thị retry button khi load fail

```typescript
// Example: Merge socket notification with existing list
socket.on('RECEIVE_INVOICE_CREATE', (data) => {
  setNotifications(prev => [data.newNotification, ...prev]);
  setUnreadCount(prev => prev + 1);
});
```

---

## 12. Support & Contact

Nếu có vấn đề hoặc câu hỏi về Socket.IO integration:
1. Kiểm tra phần Troubleshooting ở trên
2. Xem console logs cho error messages chi tiết
3. Liên hệ Backend team với thông tin:
   - Error message cụ thể
   - User role và userType
   - Socket connection status
   - Browser console logs

---

**Last Updated**: 2026-03-09
**Backend Socket.IO Version**: socket.io ^4.x
**Recommended Frontend Version**: socket.io-client ^4.x
