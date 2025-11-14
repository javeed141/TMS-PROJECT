"use client";
import React, { useCallback, useContext, useEffect, useMemo, useState } from "react";
import { ThemeContext } from "@/context/ThemeContext";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableHeader, TableRow, TableCell, TableBody } from "@/components/ui/table";
import { Button } from "@/components/ui/button";

const API_BASE = "https://time-management-software.onrender.com";

export default function SecretaryDashboard({ user, loading }) {
  const { isDark } = useContext(ThemeContext);
  const [summary, setSummary] = useState({ open: 0, in_progress: 0, resolved: 0, escalated: 0, openMeetings: 0 });
  const [conflicts, setConflicts] = useState([]);
  const [loadingConflicts, setLoadingConflicts] = useState(false);
  const [error, setError] = useState(null);

  const token = useMemo(() => (typeof window !== "undefined" ? localStorage.getItem("token") : null), []);

  const loadSummary = useCallback(async () => {
    if (!token) return;
    try {
      const res = await fetch(`${API_BASE}/api/secretary/conflicts?summary=true`, {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });
      if (!res.ok) throw new Error("Failed to load summary");
      const data = await res.json();
      setSummary((prev) => ({
        ...prev,
        open: data?.summary?.open ?? 0,
        in_progress: data?.summary?.in_progress ?? 0,
        resolved: data?.summary?.resolved ?? 0,
        escalated: data?.summary?.escalated ?? 0,
        openMeetings: data?.openMeetings ?? 0,
      }));
    } catch (err) {
      console.error(err);
    }
  }, [token]);

  const loadConflicts = useCallback(async () => {
    if (!token) return;
    setError(null);
    setLoadingConflicts(true);
    try {
      const res = await fetch(`${API_BASE}/api/secretary/conflicts?status=open&limit=5`, {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });
      if (!res.ok) throw new Error("Failed to load conflicts");
      const data = await res.json();
      setConflicts(Array.isArray(data?.conflicts) ? data.conflicts : []);
    } catch (err) {
      console.error(err);
      setError("Unable to load conflicts");
    } finally {
      setLoadingConflicts(false);
    }
  }, [token]);

  useEffect(() => {
    if (token) {
      loadSummary();
      loadConflicts();
    }
  }, [token, loadSummary, loadConflicts]);

  const cards = [
    { title: "Open Conflicts", value: summary.open, color: "text-red-500" },
    { title: "In Progress", value: summary.in_progress, color: "text-yellow-500" },
    { title: "Resolved (7d)", value: summary.resolved, color: "text-green-500" },
  ];

  return (
    <div className={`${isDark ? "text-gray-100" : "text-gray-900"}`}>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold">Dashboard</h1>
          {user?.name && <p className="text-sm text-gray-500 mt-1">Signed in as {user.name}</p>}
        </div>
        <Button variant="outline" size="sm" onClick={() => { loadSummary(); loadConflicts(); }}>
          Refresh
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        {cards.map((card, index) => (
          <Card key={index}>
            <CardHeader>
              <CardTitle className="text-sm">{card.title}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className={`text-3xl font-bold ${card.color}`}>{card.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Open Conflict Tickets</CardTitle>
        </CardHeader>
        <CardContent>
          {loadingConflicts ? (
            <p className="text-sm text-gray-500">Loading conflicts…</p>
          ) : error ? (
            <p className="text-sm text-red-500">{error}</p>
          ) : conflicts.length === 0 ? (
            <p className="text-sm text-gray-500">No conflicts require attention 🎉</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableCell>Meeting</TableCell>
                  <TableCell>Requested By</TableCell>
                  <TableCell>When</TableCell>
                  <TableCell>Status</TableCell>
                </TableRow>
              </TableHeader>
              <TableBody>
                {conflicts.map((item) => (
                  <TableRow key={item._id}>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="font-medium">{item.meeting?.title ?? "Untitled"}</span>
                        <span className="text-xs text-gray-500">{item.meeting?.project || "General"}</span>
                      </div>
                    </TableCell>
                    <TableCell>{item.requestedBy?.name || item.requestedBy?.email || "—"}</TableCell>
                    <TableCell>
                      {item.meeting?.startTime ? new Date(item.meeting.startTime).toLocaleString() : "TBD"}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="bg-yellow-100 text-yellow-700 capitalize">
                        {item.status}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <div className="mt-4 text-xs text-gray-500">
        Coordinating {summary.openMeetings} meetings awaiting reschedule.
      </div>
    </div>
  );
}
