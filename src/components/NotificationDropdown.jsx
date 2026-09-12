import { useState, useEffect } from "react";
import { supabase } from "../supabaseClient";

export default function NotificationDropdown({ profile, onClose, onNavigate, onUnreadChange }) {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchNotifications();
  }, [profile]);

  async function fetchNotifications() {
    setLoading(true);
    try {
      let items = [];
      const role = profile?.role || "citizen";

      if (role === "citizen") {
        // Fetch citizen's reports
        const { data: reports } = await supabase
          .from("reports")
          .select("*")
          .order("created_at", { ascending: false })
          .limit(10);

        const userReports = (reports || []).filter((r) => r.citizen_id === profile.id || !r.citizen_id);

        userReports.forEach((r) => {
          if (r.status === "resolved") {
            items.push({
              id: `rep-res-${r.id}`,
              type: "success",
              icon: "🎉",
              title: "Report Resolved! (+50 Points)",
              message: `Your report for "${r.category}" at ${r.address || "your location"} has been verified clean by authority!`,
              time: r.created_at,
              read: false,
              nav: 1, // My Reports
            });
          } else if (r.status === "assigned") {
            items.push({
              id: `rep-ass-${r.id}`,
              type: "info",
              icon: "👷",
              title: "Worker Assigned to Complaint",
              message: `A sanitation team has been dispatched for "${r.category}".`,
              time: r.created_at,
              read: false,
              nav: 1,
            });
          } else {
            items.push({
              id: `rep-sub-${r.id}`,
              type: "info",
              icon: "📥",
              title: "Complaint Received",
              message: `Your report for "${r.category}" is registered under ID #${r.id.slice(0, 6)}.`,
              time: r.created_at,
              read: false,
              nav: 1,
            });
          }
        });

        // Fetch citizen withdrawals / coupons
        const { data: wds } = await supabase
          .from("withdrawals")
          .select("*")
          .order("created_at", { ascending: false })
          .limit(5);

        (wds || []).forEach((w) => {
          const code = w.status?.startsWith("COUPON:") ? w.status.replace("COUPON:", "") : null;
          items.push({
            id: `wd-${w.id}`,
            type: "reward",
            icon: "🎟️",
            title: "Digital Coupon Redeemed",
            message: code ? `Coupon code ${code} issued for ₹${w.amount_inr} voucher.` : `Redeemed ${w.points} points.`,
            time: w.created_at,
            read: false,
            nav: 0,
          });
        });

      } else if (role === "worker") {
        // Fetch tasks assigned to worker
        const { data: reports } = await supabase
          .from("reports")
          .select("*")
          .order("created_at", { ascending: false })
          .limit(10);

        (reports || []).forEach((r) => {
          if (r.worker_id === profile.id || r.status === "assigned") {
            items.push({
              id: `work-${r.id}`,
              type: "warning",
              icon: "🚨",
              title: "Sanitation Assignment",
              message: `Task #${r.id.slice(0, 6)}: ${r.category} at ${r.address || "Assigned Area"}.`,
              time: r.created_at,
              read: false,
              nav: 1, // Work Queue
            });
          }
        });

        // System notification for breaks
        items.push({
          id: "work-break-info",
          type: "info",
          icon: "☕",
          title: "Duty Status Reminder",
          message: "Toggle your break status from the header when resting so auto-dispatch pauses.",
          time: new Date().toISOString(),
          read: true,
          nav: 0,
        });

      } else if (role === "admin") {
        // Fetch overall reports for admin
        const { data: reports } = await supabase
          .from("reports")
          .select("*, profiles:citizen_id(name)")
          .order("created_at", { ascending: false })
          .limit(8);

        (reports || []).forEach((r) => {
          items.push({
            id: `adm-rep-${r.id}`,
            type: r.status === "resolved" ? "success" : "info",
            icon: r.status === "resolved" ? "✅" : "🔔",
            title: `Report ${r.status.toUpperCase()}: ${r.category}`,
            message: `By ${r.profiles?.name || "Citizen"} at ${r.address || "City Zone"}. Status: ${r.status}`,
            time: r.created_at,
            read: false,
            nav: 1, // Reports tab
          });
        });
      }

      // Sort items by time descending
      items.sort((a, b) => new Date(b.time) - new Date(a.time));

      // Read status stored in localStorage
      const readIds = JSON.parse(localStorage.getItem(`read_notifs_${profile?.id}`) || "[]");
      const updated = items.map(item => ({ ...item, read: readIds.includes(item.id) }));

      setNotifications(updated);
      const unread = updated.filter(n => !n.read).length;
      if (onUnreadChange) onUnreadChange(unread);

    } catch (e) {
      console.error("Error loading notifications:", e);
    } finally {
      setLoading(false);
    }
  }

  function markAllRead() {
    const allIds = notifications.map(n => n.id);
    localStorage.setItem(`read_notifs_${profile?.id}`, JSON.stringify(allIds));
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    if (onUnreadChange) onUnreadChange(0);
  }

  function markSingleRead(id) {
    const readIds = JSON.parse(localStorage.getItem(`read_notifs_${profile?.id}`) || "[]");
    if (!readIds.includes(id)) {
      readIds.push(id);
      localStorage.setItem(`read_notifs_${profile?.id}`, JSON.stringify(readIds));
    }
    setNotifications(prev => {
      const next = prev.map(n => n.id === id ? { ...n, read: true } : n);
      if (onUnreadChange) onUnreadChange(next.filter(n => !n.read).length);
      return next;
    });
  }

  function formatTime(isoStr) {
    if (!isoStr) return "Just now";
    const diffSec = Math.floor((new Date() - new Date(isoStr)) / 1000);
    if (diffSec < 60) return "Just now";
    if (diffSec < 3600) return `${Math.floor(diffSec / 60)}m ago`;
    if (diffSec < 86400) return `${Math.floor(diffSec / 3600)}h ago`;
    return `${Math.floor(diffSec / 86400)}d ago`;
  }

  return (
    <div className="notif-popover">
      <div className="notif-header">
        <div className="notif-title-group">
          <span className="notif-heading">Notifications</span>
          {notifications.filter(n => !n.read).length > 0 && (
            <span className="notif-badge">{notifications.filter(n => !n.read).length} Unread</span>
          )}
        </div>
        <div className="notif-actions">
          {notifications.filter(n => !n.read).length > 0 && (
            <button className="notif-btn-clear" onClick={markAllRead}>Mark all read</button>
          )}
          <button className="notif-btn-close" onClick={onClose}>×</button>
        </div>
      </div>

      <div className="notif-body">
        {loading ? (
          <div className="notif-empty">Loading notifications...</div>
        ) : notifications.length === 0 ? (
          <div className="notif-empty">
            <span style={{ fontSize: 24, display: "block", marginBottom: 6 }}>🔔</span>
            No new notifications yet
          </div>
        ) : (
          notifications.map((item) => (
            <div
              key={item.id}
              className={`notif-item ${item.read ? "read" : "unread"}`}
              onClick={() => {
                markSingleRead(item.id);
                if (onNavigate && item.nav !== undefined) {
                  onNavigate(item.nav);
                  onClose();
                }
              }}
            >
              <div className="notif-icon-box">{item.icon}</div>
              <div className="notif-content">
                <div className="notif-item-top">
                  <span className="notif-item-title">{item.title}</span>
                  <span className="notif-time">{formatTime(item.time)}</span>
                </div>
                <div className="notif-item-msg">{item.message}</div>
              </div>
              {!item.read && <div className="notif-unread-dot" />}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
