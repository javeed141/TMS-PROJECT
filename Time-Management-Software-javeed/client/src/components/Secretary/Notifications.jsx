"use client";
import React, { useContext, useEffect, useMemo, useState } from "react";
import { ThemeContext } from "@/context/ThemeContext";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

const API_BASE = "https://time-management-software.onrender.com/";
const FILTERS = [
  { value: "all", label: "All" },
  { value: "unread", label: "Unread" },
  { value: "read", label: "Read" },
];

export default function Notifications() {
  const { isDark } = useContext(ThemeContext);
  const token = useMemo(() => (typeof window !== "undefined" ? localStorage.getItem("token") : null), []);

  const [items, setItems] = useState([]);
  const [filter, setFilter] = useState("all");
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchNotifications = async (status = filter) => {
    if (!token) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE}/api/secretary/notifications?status=${status}`, {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });
      if (!res.ok) throw new Error("Failed to load notifications");
      const data = await res.json();
      setItems(Array.isArray(data?.notifications) ? data.notifications : []);
      setUnreadCount(data?.unreadCount ?? 0);
    } catch (err) {
      console.error(err);
      setError("Unable to fetch notifications");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) {
      fetchNotifications(filter);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, filter]);

  const handleMark = async (id, mark = "read") => {
    if (!token) return;
    try {
      const res = await fetch(`${API_BASE}/api/secretary/notifications/${id}/read`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ mark }),
      });
      if (!res.ok) throw new Error("Failed to update notification");
      const data = await res.json();
      setItems((prev) => prev.map((item) => (item._id === id ? { ...item, ...data.notification } : item)));
      setUnreadCount(data?.unreadCount ?? 0);
    } catch (err) {
      console.error(err);
    }
  };

  const handleMarkAll = async () => {
    if (!token) return;
    try {
      const res = await fetch(`${API_BASE}/api/secretary/notifications/mark-all-read`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });
      if (!res.ok) throw new Error("Failed to mark notifications");
      await fetchNotifications(filter);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className={`${isDark ? "text-gray-100" : "text-gray-900"}`}>
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-bold">Notifications</h1>
          <p className="text-sm text-gray-500 mt-1">
            {unreadCount} unread notification{unreadCount === 1 ? "" : "s"}.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <select
            className={`rounded-md border px-3 py-2 text-sm ${isDark ? "bg-gray-900 border-gray-700" : "bg-white border-gray-300"}`}
            value={filter}
            onChange={(event) => setFilter(event.target.value)}
          >
            {FILTERS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          <Button size="sm" variant="outline" onClick={() => fetchNotifications(filter)} disabled={loading}>
            {loading ? "Refreshing…" : "Refresh"}
          </Button>
          <Button size="sm" onClick={handleMarkAll} disabled={loading || unreadCount === 0}>
            Mark all read
          </Button>
        </div>
      </div>

      {error ? (
        <Card className="border border-red-300 bg-red-50 text-red-700">
          <CardContent className="py-6 text-sm">{error}</CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {loading && items.length === 0 ? (
            <Card>
              <CardContent className="py-6 text-sm text-gray-500">Loading notifications…</CardContent>
            </Card>
          ) : items.length === 0 ? (
            <Card>
              <CardContent className="py-6 text-sm text-gray-500">Nothing new right now.</CardContent>
            </Card>
          ) : (
            items.map((notification) => {
              const isUnread = !notification.readAt;
              const createdAt = notification.createdAt ? new Date(notification.createdAt) : null;
              const dateLabel = createdAt ? createdAt.toLocaleString() : "";
              const channelLabel = notification.channel || "system";

              return (
                <Card
                  key={notification._id}
                  className={`transition-all ${isUnread ? "border-l-4 border-indigo-600" : "opacity-90"}`}
                >
                  <CardHeader className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                    <div className="flex flex-col gap-1">
                      <span className="font-semibold">{notification.title}</span>
                      <span className="text-sm text-gray-500">{notification.message}</span>
                      {dateLabel && <span className="text-xs text-gray-400">{dateLabel}</span>}
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="capitalize">
                        {channelLabel}
                      </Badge>
                      <Badge
                        variant="outline"
                        className={`capitalize ${
                          notification.severity === "critical"
                            ? "bg-red-100 text-red-700"
                            : notification.severity === "warning"
                            ? "bg-amber-100 text-amber-700"
                            : "bg-slate-100 text-slate-700"
                        }`}
                      >
                        {notification.severity}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="flex items-center gap-2">
                    {isUnread ? (
                      <Button size="sm" variant="outline" onClick={() => handleMark(notification._id, "read")}>
                        Mark as read
                      </Button>
                    ) : (
                      <Button size="sm" variant="ghost" onClick={() => handleMark(notification._id, "unread")}>
                        Mark unread
                      </Button>
                    )}
                    {notification.metadata?.meetingTitle && (
                      <span className="text-xs text-gray-500">
                        Meeting: {notification.metadata.meetingTitle}
                      </span>
                    )}
                  </CardContent>
                </Card>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}
