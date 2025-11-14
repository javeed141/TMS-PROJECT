"use client";
import React, { useContext, useEffect, useMemo, useState } from "react";
import { ThemeContext } from "@/context/ThemeContext";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableHeader, TableBody, TableCell, TableRow } from "@/components/ui/table";

const API_BASE = "https://time-management-software.onrender.com/";

export default function ScheduleMeeting() {
  const { isDark } = useContext(ThemeContext);
  const token = useMemo(() => (typeof window !== "undefined" ? localStorage.getItem("token") : null), []);

  const [inProgress, setInProgress] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!token) return;
    setLoading(true);
    setError(null);
    fetch(`${API_BASE}/api/secretary/conflicts?status=in_progress&limit=10`, {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    })
      .then((res) => {
        if (!res.ok) throw new Error("Failed to load conflicts");
        return res.json();
      })
      .then((data) => {
        setInProgress(Array.isArray(data?.conflicts) ? data.conflicts : []);
      })
      .catch((err) => {
        console.error(err);
        setError("Unable to load active conflicts");
      })
      .finally(() => setLoading(false));
  }, [token]);

  return (
    <div className={`${isDark ? "text-gray-100" : "text-gray-900"}`}>
      <h1 className="text-3xl font-bold mb-6">Manual Coordination Inbox</h1>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Your role in conflict resolution</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-gray-600">
          <p>
            When the system cannot find a common slot, it raises a conflict ticket. Review participant calendars, consult the executives, and record any alternative slots discussed.
          </p>
          <p>
            Once everyone agrees, confirm the final schedule below. The platform will update meeting times and notify all participants automatically.
          </p>
          <Button size="sm" variant="secondary" onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}>
            Jump to conflict queue
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>In-progress consultations</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-sm text-gray-500">Loading…</p>
          ) : error ? (
            <p className="text-sm text-red-500">{error}</p>
          ) : inProgress.length === 0 ? (
            <p className="text-sm text-gray-500">No active consultations at the moment.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableCell>Meeting</TableCell>
                  <TableCell>Requested By</TableCell>
                  <TableCell>Current Slot</TableCell>
                  <TableCell>Status</TableCell>
                </TableRow>
              </TableHeader>
              <TableBody>
                {inProgress.map((item) => (
                  <TableRow key={item._id}>
                    <TableCell>{item.meeting?.title ?? "Untitled"}</TableCell>
                    <TableCell>{item.requestedBy?.name || item.requestedBy?.email}</TableCell>
                    <TableCell>
                      {item.meeting?.startTime ? new Date(item.meeting.startTime).toLocaleString() : "TBD"}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="capitalize bg-amber-100 text-amber-700">
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
    </div>
  );
}
