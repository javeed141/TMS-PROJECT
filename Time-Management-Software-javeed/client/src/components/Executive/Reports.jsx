// ExecutiveReportPage.jsx
"use client";
import { Loader2 } from "lucide-react";
import React, { useEffect, useMemo, useState, useContext } from "react";
import {
  AreaChart,
  Area,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  LineChart,
  Line,
  Legend,
} from "recharts";
import { Download } from "lucide-react";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import { ThemeContext } from "../../context/ThemeContext";

/**
 * API base
 */
const API_BASE = "https://tms-project-w5jz.onrender.com";

/**
 * ExecutiveReportPage
 */
export default function ExecutiveReportPage() {
  const { isDark } = useContext(ThemeContext || { isDark: false });

  // theme-aware palettes
  const palette = {
    bg: isDark ? "#0b1220" : "#F7F8FA",
    card: isDark ? "#0f1724" : "#FFFFFF",
    muted: isDark ? "#9aa6bd" : "#6b7280",
    primary: isDark ? "#60A5FA" : "#2563EB",
    accent: isDark ? "#34D399" : "#10B981",
    warn: isDark ? "#FB923C" : "#F97316",
    danger: isDark ? "#FB7185" : "#EF4444",
    border: isDark ? "#1f2937" : "#EDF0F4",
    text: isDark ? "#E6EEF8" : "#07111F",
  };

  const CHART_COLORS = [palette.primary, palette.warn, palette.accent, "#A78BFA", "#FBBF24"];

  // state
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [dateRange, setDateRange] = useState("Last 30 Days");
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [meetingsByDate, setMeetingsByDate] = useState({});
  const [error, setError] = useState(null);

  // fetch helpers
  async function fetchUser() {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_BASE}/api/executive/info`, {
        headers: { Authorization: token ? `Bearer ${token}` : "" },
      });
      if (!res.ok) throw new Error(`User fetch failed: ${res.status}`);
      const data = await res.json();
      setUser(data?.user ?? data);
      return data?.user ?? data;
    } catch (err) {
      console.error("fetchUser", err);
      setError(err.message || "Failed to load user");
      return null;
    }
  }

  async function fetchTasks() {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_BASE}/api/executive/me/tasks`, {
        headers: { Authorization: token ? `Bearer ${token}` : "" },
      });
      if (!res.ok) {
        const text = await res.text();
        throw new Error(`Tasks fetch failed: ${res.status} ${text}`);
      }
      const data = await res.json();
      const arr = data?.tasks ?? data ?? [];
      const norm = arr.map((t) => ({
        ...t,
        startTime: t.startTime ? new Date(t.startTime).toISOString() : null,
        endTime: t.endTime ? new Date(t.endTime).toISOString() : null,
      }));
      setTasks(norm);
      return norm;
    } catch (err) {
      console.error("fetchTasks", err);
      setError(err.message || "Failed to load tasks");
      return [];
    }
  }

  async function fetchMeetingsForDate(dateISO) {
    try {
      const token = localStorage.getItem("token");
      const url = `${API_BASE}/api/meetings/my-day?date=${encodeURIComponent(dateISO)}`;
      const res = await fetch(url, {
        headers: { Authorization: token ? `Bearer ${token}` : "" },
      });
      if (!res.ok) {
        const text = await res.text();
        throw new Error(`Meetings fetch failed: ${res.status} ${text}`);
      }
      const data = await res.json();
      return data?.meetings ?? [];
    } catch (err) {
      console.error("fetchMeetingsForDate", err);
      setError(err.message || "Failed to load meetings");
      return [];
    }
  }

  // load data
  useEffect(() => {
    let mounted = true;
    async function loadAll() {
      setLoading(true);
      setError(null);
      try {
        await fetchUser();
        await fetchTasks();

        const days =
          dateRange === "Last 7 Days" ? 7 : dateRange === "Last 90 Days" ? 90 : dateRange === "This Year" ? 365 : 30;
        const today = new Date();
        const byDate = {};
        const promises = [];
        for (let i = 0; i < days; i++) {
          const d = new Date(today);
          d.setDate(today.getDate() - i);
          const iso = d.toISOString().slice(0, 10);
          promises.push(
            fetchMeetingsForDate(iso).then((ms) => {
              byDate[iso] = ms;
            })
          );
        }
        await Promise.all(promises);
        if (!mounted) return;
        setMeetingsByDate(byDate);
      } catch (err) {
        console.error("loadAll error", err);
        setError(err.message || "Failed to load report data");
      } finally {
        if (mounted) setLoading(false);
      }
    }
    loadAll();
    return () => {
      mounted = false;
    };
  }, [dateRange]);

  // compute analytics
  const {
    kpi,
    weeklyMeetingData,
    executiveUtilization,
    projectDistribution,
    monthlyTrends,
    meetingSizeDistribution,
    avgDurationByProject,
    peakMeetingHours,
  } = useMemo(() => {
    const allMeetings = Object.values(meetingsByDate).flat();

    // KPIs & transforms (same as your previous logic)
    const totalMeetings = allMeetings.length;
    let totalHours = 0;
    allMeetings.forEach((m) => {
      try {
        const s = m.startTime ? new Date(m.startTime).getTime() : null;
        const e = m.endTime ? new Date(m.endTime).getTime() : null;
        if (s && e && e > s) totalHours += (e - s) / (1000 * 60 * 60);
      } catch {}
    });

    const execUtil = [];
    if (tasks.length) {
      let hours = 0;
      tasks.forEach((t) => {
        try {
          const s = t.startTime ? new Date(t.startTime).getTime() : null;
          const e = t.endTime ? new Date(t.endTime).getTime() : null;
          if (s && e && e > s) hours += (e - s) / (1000 * 60 * 60);
        } catch {}
      });
      execUtil.push({
        name: user?.name || "You",
        meetings: tasks.length,
        hours: Math.round(hours * 10) / 10,
        efficiency: Math.min(100, Math.round((hours / Math.max(1, totalHours || 1)) * 100) || 0),
      });
    }

    const projMap = new Map();
    allMeetings.forEach((m) => {
      const p = m.project || "Unspecified";
      const dur = m.startTime && m.endTime ? (new Date(m.endTime).getTime() - new Date(m.startTime).getTime()) / (1000 * 60 * 60) : 0;
      projMap.set(p, (projMap.get(p) || 0) + Math.max(0, dur));
    });
    const projArr = Array.from(projMap.entries()).map(([name, hours]) => ({ name, hours }));

    const monthMap = new Map();
    allMeetings.forEach((m) => {
      const dt = m.startTime ? new Date(m.startTime) : null;
      if (!dt) return;
      const key = `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, "0")}`;
      const entry = monthMap.get(key) || { meetings: 0, hours: 0 };
      entry.meetings += 1;
      const dur = m.startTime && m.endTime ? (new Date(m.endTime).getTime() - new Date(m.startTime).getTime()) / (1000 * 60 * 60) : 0;
      entry.hours += Math.max(0, dur);
      monthMap.set(key, entry);
    });
    const monthlyArr = Array.from(monthMap.entries())
      .sort()
      .map(([k, v]) => ({ month: k, meetings: v.meetings, hours: Math.round(v.hours), productivity: v.hours > 0 ? Math.round((v.meetings / v.hours) * 10) : 0 }));

    // weekly
    const weeklyMap = new Map();
    const now = new Date();
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(now.getDate() - i);
      const key = d.toLocaleDateString(undefined, { weekday: "short" });
      weeklyMap.set(key, { hours: 0, meetings: 0 });
    }
    allMeetings.forEach((m) => {
      if (!m.startTime) return;
      const dt = new Date(m.startTime);
      const dayName = dt.toLocaleDateString(undefined, { weekday: "short" });
      if (!weeklyMap.has(dayName)) return;
      const dur = m.startTime && m.endTime ? (new Date(m.endTime).getTime() - new Date(m.startTime).getTime()) / (1000 * 60 * 60) : 0;
      const cur = weeklyMap.get(dayName);
      cur.hours += Math.max(0, dur);
      cur.meetings += 1;
      weeklyMap.set(dayName, cur);
    });
    const weeklyData = Array.from(weeklyMap.entries()).map(([day, v]) => ({ day, hours: Math.round(v.hours * 10) / 10, meetings: v.meetings }));

    // meeting size distribution
    const sizeBuckets = { Small: 0, Medium: 0, Large: 0, Unknown: 0 };
    allMeetings.forEach((m) => {
      const count = Array.isArray(m.participants) ? m.participants.length : (m.participantsCount || null);
      if (typeof count === "number") {
        if (count <= 3) sizeBuckets.Small++;
        else if (count <= 6) sizeBuckets.Medium++;
        else sizeBuckets.Large++;
      } else {
        sizeBuckets.Unknown++;
      }
    });
    const meetingSizeDistribution = Object.entries(sizeBuckets).map(([name, value], i) => ({ name, value, color: CHART_COLORS[i % CHART_COLORS.length] }));

    const avgByProj = [];
    projArr.forEach((p) => {
      const hours = p.hours;
      const count = allMeetings.filter((m) => (m.project || "Unspecified") === p.name).length || 1;
      avgByProj.push({ project: p.name, avgDuration: Math.round((hours / count) * 10) / 10, totalHours: Math.round(hours) });
    });
    avgByProj.sort((a, b) => b.totalHours - a.totalHours);
    const avgDurationByProject = avgByProj.slice(0, 8);

    const hoursMap = Array.from({ length: 24 }, (_, i) => ({ hour: i, count: 0 }));
    allMeetings.forEach((m) => {
      if (!m.startTime) return;
      const h = new Date(m.startTime).getHours();
      hoursMap[h].count++;
    });
    const peakMeetingHours = hoursMap.map((x) => ({ hourLabel: `${String(x.hour).padStart(2, "0")}:00`, count: x.count }));

    return {
      kpi: {
        totalMeetings,
        totalHours: Math.round(totalHours * 10) / 10,
        avgEfficiency: execUtil.length ? Math.round(execUtil.reduce((s, e) => s + e.efficiency, 0) / execUtil.length) : 0,
        activeProjects: projArr.length,
      },
      weeklyMeetingData: weeklyData,
      executiveUtilization: execUtil,
      projectDistribution: projArr.length
        ? projArr.map((p, i) => ({ name: p.name, value: Math.round((p.hours / Math.max(1, totalHours || 1)) * 100), hours: Math.round(p.hours), color: CHART_COLORS[i % CHART_COLORS.length] }))
        : [],
      monthlyTrends: monthlyArr,
      meetingSizeDistribution,
      avgDurationByProject,
      peakMeetingHours,
    };
  }, [tasks, meetingsByDate, user]);

  // PDF export function
  async function downloadPdf() {
    try {
      const element = document.getElementById("report-root");
      if (!element) {
        console.error("report-root not found");
        return;
      }

      // hide controls with .no-print
      const controls = element.querySelectorAll(".no-print");
      controls.forEach((c) => (c.style.visibility = "hidden"));

      // ensure fonts loaded and charts rendered
      if (document.fonts && document.fonts.ready) await document.fonts.ready;
      // short wait for charts to finish layout
      await new Promise((r) => setTimeout(r, 300));

      // set background explicitly for canvas capture
      const originalBg = element.style.background;
      element.style.background = palette.bg;

      const scale = 2; // 2 or 2.5 for sharper images
      const canvas = await html2canvas(element, {
        scale,
        useCORS: true,
        allowTaint: true,
        logging: false,
        windowWidth: element.scrollWidth,
        windowHeight: element.scrollHeight,
        scrollX: -window.scrollX,
        scrollY: -window.scrollY,
      });

      // restore
      controls.forEach((c) => (c.style.visibility = ""));
      element.style.background = originalBg;

      const imgData = canvas.toDataURL("image/jpeg", 0.92);
      const pdf = new jsPDF("p", "mm", "a4");
      const pageWidth = 210;
      const pageHeight = 297;

      const imgProps = { width: canvas.width, height: canvas.height };
      const imgWidthMM = pageWidth;
      const imgHeightMM = (imgProps.height * imgWidthMM) / imgProps.width;

      if (imgHeightMM <= pageHeight) {
        pdf.addImage(imgData, "JPEG", 0, 0, imgWidthMM, imgHeightMM);
      } else {
        // slice into pages
        const pxPerMm = imgProps.width / imgWidthMM;
        let remainingHeightMM = imgHeightMM;
        let positionYmm = 0;
        while (remainingHeightMM > 0) {
          const sourceYpx = Math.round(positionYmm * pxPerMm);
          const pageHeightPx = Math.round(pageHeight * pxPerMm);

          const pageCanvas = document.createElement("canvas");
          pageCanvas.width = imgProps.width;
          pageCanvas.height = Math.min(pageHeightPx, canvas.height - sourceYpx);
          const ctx = pageCanvas.getContext("2d");
          ctx.drawImage(canvas, 0, sourceYpx, imgProps.width, pageCanvas.height, 0, 0, imgProps.width, pageCanvas.height);

          const pageData = pageCanvas.toDataURL("image/jpeg", 0.92);
          const pageImgHeightMM = (pageCanvas.height * imgWidthMM) / imgProps.width;

          if (pdf.internal.getNumberOfPages() > 0) pdf.addPage();
          pdf.addImage(pageData, "JPEG", 0, 0, imgWidthMM, pageImgHeightMM);

          remainingHeightMM -= pageHeight;
          positionYmm += pageHeight;
        }
      }

      pdf.save(`Executive_Report_${new Date().toISOString().slice(0, 10)}.pdf`);
    } catch (err) {
      console.error("PDF export failed", err);
      alert("Failed to export PDF. See console for details.");
    }
  }

  // UI states
  if (loading) {
    return (
      <div style={{ minHeight: "70vh", display: "flex", alignItems: "center", justifyContent: "center", background: palette.bg, color: palette.text }}>
        <div className="animate-spin text-muted-foreground">
  <Loader2 size={40} />
</div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ minHeight: "60vh", padding: 24, background: palette.bg, color: palette.text }}>
        <div style={{ color: palette.danger }}>Error: {error}</div>
      </div>
    );
  }

  // card component
  const Card = ({ children, title }) => (
    <div style={{ background: palette.card, borderRadius: 12, padding: 16, border: `1px solid ${palette.border}`, boxShadow: `0 6px 18px ${isDark ? "rgba(2,6,23,0.6)" : "rgba(16,24,40,0.04)"}`, marginBottom: 8 }}>
      {title && <div style={{ fontWeight: 700, color: palette.text, marginBottom: 12 }}>{title}</div>}
      {children}
    </div>
  );

  return (
    <>
      {/* small inline print styles */}
      <style>{`
        /* hide .no-print in real print media too */
        @media print {
          .no-print { display: none !important; }
          #report-root { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
        }
        /* avoid page breaks inside cards during printing */
        #report-root .card, #report-root .no-break { page-break-inside: avoid; break-inside: avoid; }
      `}</style>

      <div id="report-root" style={{ minHeight: "100vh", background: palette.bg, color: palette.text, padding: 20, fontFamily: "'Inter', system-ui, -apple-system, 'Segoe UI', Roboto" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18 }}>
          <h2 style={{ margin: 0 }}>Executive Dashboard</h2>
          <div style={{ display: "flex", gap: 8 }}>
            <select
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
              className="no-print"
              style={{ padding: "6px 10px", borderRadius: 8, border: `1px solid ${palette.border}`, background: palette.card, color: palette.text }}
            >
              <option>Last 7 Days</option>
              <option>Last 30 Days</option>
              <option>Last 90 Days</option>
              <option>This Year</option>
            </select>

            <button
              onClick={downloadPdf}
              className="no-print"
              style={{ padding: 8, borderRadius: 8, border: `1px solid ${palette.border}`, background: palette.card, display: "inline-flex", alignItems: "center", gap: 8 }}
            >
              <Download size={16} /> Download PDF
            </button>
          </div>
        </div>

        {/* KPI Row */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 12, marginBottom: 18 }}>
          <Card title="Total Meetings">
            <div style={{ fontSize: 22, fontWeight: 800 }}>{kpi.totalMeetings}</div>
            <div style={{ color: palette.muted, fontSize: 12, marginTop: 6 }}>Meetings in selected range</div>
          </Card>
          <Card title="Total Hours">
            <div style={{ fontSize: 22, fontWeight: 800 }}>{kpi.totalHours}h</div>
            <div style={{ color: palette.muted, fontSize: 12, marginTop: 6 }}>Sum of meeting durations</div>
          </Card>
          <Card title="Avg Efficiency">
            <div style={{ fontSize: 22, fontWeight: 800 }}>{kpi.avgEfficiency}%</div>
            <div style={{ color: palette.muted, fontSize: 12, marginTop: 6 }}>Heuristic: tasks / meeting-hours</div>
          </Card>
          <Card title="Active Projects">
            <div style={{ fontSize: 22, fontWeight: 800 }}>{kpi.activeProjects}</div>
            <div style={{ color: palette.muted, fontSize: 12, marginTop: 6 }}>Projects inferred from meetings</div>
          </Card>
        </div>

        {/* Main charts grid */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12, marginBottom: 18 }}>
          <div style={{ gridColumn: "span 2" }}>
            <Card title="Weekly Meeting Hours">
              <div style={{ height: 260 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={weeklyMeetingData}>
                    <defs>
                      <linearGradient id="g1" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={palette.primary} stopOpacity={0.24} />
                        <stop offset="95%" stopColor={palette.primary} stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke={palette.border} />
                    <XAxis dataKey="day" stroke={palette.muted} />
                    <YAxis stroke={palette.muted} />
                    <Tooltip contentStyle={{ background: palette.card, borderColor: palette.border }} />
                    <Area type="monotone" dataKey="hours" stroke={palette.primary} fill="url(#g1)" strokeWidth={2} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </Card>
          </div>

          <div>
            <Card title="Meeting Size Distribution">
              <div style={{ height: 260 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={meetingSizeDistribution} dataKey="value" nameKey="name" innerRadius={40} outerRadius={80} label>
                      {meetingSizeDistribution.map((entry, i) => (
                        <Cell key={`cell-${i}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={{ background: palette.card, borderColor: palette.border }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </Card>
          </div>
        </div>

        {/* Second row */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12, marginBottom: 18 }}>
          <div>
            <Card title="Project Time Distribution">
              <div style={{ height: 220 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={projectDistribution} dataKey="value" nameKey="name" outerRadius={80} labelLine={false} label={({ name, percent }) => `${name} ${Math.round(percent * 100)}%`}>
                      {projectDistribution.map((entry, idx) => (
                        <Cell key={idx} fill={entry.color || CHART_COLORS[idx % CHART_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={{ background: palette.card, borderColor: palette.border }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </Card>
          </div>

          <div>
            <Card title="Peak Meeting Hours">
              <div style={{ height: 220 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={peakMeetingHours}>
                    <CartesianGrid strokeDasharray="3 3" stroke={palette.border} />
                    <XAxis dataKey="hourLabel" stroke={palette.muted} />
                    <YAxis stroke={palette.muted} />
                    <Tooltip contentStyle={{ background: palette.card, borderColor: palette.border }} />
                    <Bar dataKey="count" fill={palette.primary} radius={[6, 6, 6, 6]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </Card>
          </div>

          <div>
            <Card title="Avg Meeting Duration (Top Projects)">
              <div style={{ height: 220 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={avgDurationByProject} layout="vertical" margin={{ left: 8, right: 8 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke={palette.border} />
                    <XAxis type="number" stroke={palette.muted} />
                    <YAxis dataKey="project" type="category" width={150} stroke={palette.muted} />
                    <Tooltip contentStyle={{ background: palette.card, borderColor: palette.border }} />
                    <Bar dataKey="avgDuration" fill={palette.accent} radius={[6, 6, 6, 6]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </Card>
          </div>
        </div>

        {/* Monthly + table */}
        <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 12 }}>
          <Card title="Monthly Productivity Trends">
            <div style={{ height: 320 }}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={monthlyTrends}>
                  <CartesianGrid strokeDasharray="3 3" stroke={palette.border} />
                  <XAxis dataKey="month" stroke={palette.muted} />
                  <YAxis stroke={palette.muted} />
                  <Tooltip contentStyle={{ background: palette.card, borderColor: palette.border }} />
                  <Legend />
                  <Line type="monotone" dataKey="productivity" stroke={palette.accent} strokeWidth={2} />
                  <Line type="monotone" dataKey="meetings" stroke={palette.warn} strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </Card>

          <Card title="Executive Performance Summary">
            <div style={{ maxHeight: 320, overflow: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", color: palette.text }}>
                <thead style={{ color: palette.muted, fontSize: 12 }}>
                  <tr>
                    <th style={{ textAlign: "left", padding: "8px 6px" }}>Executive</th>
                    <th style={{ textAlign: "left", padding: "8px 6px" }}>Meetings</th>
                    <th style={{ textAlign: "left", padding: "8px 6px" }}>Hours</th>
                    <th style={{ textAlign: "left", padding: "8px 6px" }}>Efficiency</th>
                  </tr>
                </thead>
                <tbody>
                  {executiveUtilization.length ? (
                    executiveUtilization.map((e, i) => (
                      <tr key={i} style={{ borderTop: `1px solid ${palette.border}` }}>
                        <td style={{ padding: "10px 6px" }}>{e.name}</td>
                        <td style={{ padding: "10px 6px" }}>{e.meetings}</td>
                        <td style={{ padding: "10px 6px" }}>{e.hours}h</td>
                        <td style={{ padding: "10px 6px" }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                            <div style={{ width: 120, background: palette.border, height: 8, borderRadius: 6 }}>
                              <div style={{ width: `${e.efficiency}%`, height: 8, background: palette.accent, borderRadius: 6 }} />
                            </div>
                            <div style={{ minWidth: 36 }}>{e.efficiency}%</div>
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={4} style={{ padding: 16, color: palette.muted }}>
                        No executive utilization data (fetch your tasks to populate this)
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      </div>
    </>
  );
}
