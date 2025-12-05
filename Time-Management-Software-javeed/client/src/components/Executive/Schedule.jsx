"use client";

import React, { useContext, useMemo, useState, useEffect } from "react";
import { ThemeContext } from "@/context/ThemeContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  format,
  addDays,
  isSameDay,
  isSameMonth,
  startOfMonth,
  startOfWeek,
  isBefore,
  startOfDay,
} from "date-fns";
import {
  Calendar as CalendarIcon,
  Plus,
  ChevronLeft,
  ChevronRight,
  Grid,
  Sun,
  Moon,
} from "lucide-react";
import EventModal from "./EventModal";

/* helpers (unchanged) */
function generateMonthGrid(currentDate) {
  const monthStart = startOfMonth(currentDate);
  const start = new Date(monthStart);
  // start from the previous Sunday so the grid always starts Sun..Sat (42 cells = 6 rows)
  start.setDate(start.getDate() - start.getDay());
  const days = [];
  for (let i = 0; i < 42; i++) {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    days.push(d);
  }
  return days;
}

function timeToMinutes(t) {
  if (!t || typeof t !== "string") return null;
  const parts = t.split(":");
  if (!parts.length) return null;
  const h = Number(parts[0] || 0);
  const m = Number(parts[1] || 0);
  if (Number.isNaN(h) || Number.isNaN(m)) return null;
  return h * 60 + m;
}

function minutesToTime(m) {
  if (m == null || Number.isNaN(Number(m))) return "00:00";
  const hh = Math.floor(m / 60).toString().padStart(2, "0");
  const mm = (m % 60).toString().padStart(2, "0");
  return `${hh}:${mm}`;
}

function computeStyleForEvent(start, end, workStart = "09:00", workEnd = "17:00") {
  const ws = timeToMinutes(workStart) ?? 9 * 60;
  const we = timeToMinutes(workEnd) ?? 17 * 60;
  const daySpan = Math.max(1, we - ws);

  const s = timeToMinutes(start);
  const e = timeToMinutes(end);

  if (s == null || e == null) {
    return { top: `0%`, height: `3%` };
  }

  const topPct = ((Math.max(s, ws) - ws) / daySpan) * 100;
  const heightPct = ((Math.max(e, s) - Math.max(s, ws)) / daySpan) * 100;
  return { top: `${topPct}%`, height: `${Math.max(1, heightPct)}%` };
}

/* config (unchanged) */
const DAY_START = "08:00";
const DAY_END = "19:00";
const SLOT_STEP_MIN = 60;
const SLOT_HEIGHT_PX = 88;

function buildDaySlots() {
  const slots = [];
  const start = timeToMinutes(DAY_START);
  const end = timeToMinutes(DAY_END);
  for (let t = start; t < end; t += SLOT_STEP_MIN) {
    const hh = Math.floor(t / 60).toString().padStart(2, "0");
    const mm = (t % 60).toString().padStart(2, "0");
    slots.push(`${hh}:${mm}`);
  }
  return slots;
}
const DAY_SLOTS = buildDaySlots();

/* SlotModal unchanged (kept as-is) */
function SlotModal({ open, onClose, slot, events = [], onCreate, theme }) {
  if (!open || !slot) return null;
  const dateKey = format(slot.date, "yyyy-MM-dd");
  const isDark = theme === "dark";
  return (
    <div className="fixed inset-0 z-[20000] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div
        className={`relative w-full max-w-md rounded-xl p-5 shadow-2xl transform transition-all ${isDark ? "bg-slate-900 text-slate-100" : "bg-white text-slate-900"
          }`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between">
          <div>
            <div className="text-sm font-semibold">Selected slot</div>
            <div className="text-lg font-bold">
              {dateKey} · <span className="font-medium">{slot.start}</span>
            </div>
            <div className="text-xs text-muted-foreground mt-1">
              Create a focused 1-hour meeting at this time.
            </div>
          </div>
          <button aria-label="Close" className="text-muted-foreground hover:text-gray-400" onClick={onClose}>
            ✕
          </button>
        </div>

        <div className="mt-4">
          {events.length === 0 ? (
            <div className="text-sm text-muted-foreground">No events at this slot.</div>
          ) : (
            <div className="space-y-2">
              {events.map((ev) => (
                <div
                  key={ev.id}
                  className={`p-2 rounded-md border flex items-center justify-between ${isDark ? "border-slate-700" : "border-slate-200"
                    }`}
                >
                  <div>
                    <div className="text-sm font-medium">{ev.title}</div>
                    <div className="text-xs text-muted-foreground">
                      {ev.start} — {ev.end} · {ev.venue || ""}
                    </div>
                  </div>
                  <div className={`w-3 h-3 rounded-full ${ev.color}`} />
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="mt-6 flex justify-end gap-3">
          <Button variant="ghost" onClick={onClose}>
            Close
          </Button>
          <Button onClick={() => onCreate && onCreate(slot.date, slot.start)}>Create</Button>
        </div>
      </div>
    </div>
  );
}

/* SchedulePage */
export default function SchedulePage() {
  const themeContext = useContext(ThemeContext) || {};
  const isDarkFromContext = Boolean(themeContext.isDark);
  const toggleTheme = themeContext.toggleTheme || (() => { });

  const [localTheme, setLocalTheme] = useState(isDarkFromContext ? "dark" : "light");
  useEffect(() => { setLocalTheme(isDarkFromContext ? "dark" : "light"); }, [isDarkFromContext]);
  function handleToggleTheme() { if (toggleTheme) toggleTheme(); setLocalTheme((t) => (t === "dark" ? "light" : "dark")); }
  const theme = localTheme;

  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedView, setSelectedView] = useState("Month");

  /* FIX: compute monthGrid from currentDate so it updates when currentDate changes */
  const monthGrid = useMemo(() => generateMonthGrid(currentDate), [currentDate]);

  const [events, setEvents] = useState([]);
  const [loadingEvents, setLoadingEvents] = useState(true);
  const API_BASE = "http://localhost:5000";

  // compute today's start for date comparisons
  const todayStart = useMemo(() => startOfDay(new Date()), []);

  function mapTaskToEvent(task) {
    const start = task.startTime ? new Date(task.startTime) : null;
    const end = task.endTime ? new Date(task.endTime) : null;

    const date = start ? start.toISOString().slice(0, 10) : (task.date || new Date().toISOString().slice(0, 10));
    const startStr = start ? start.toTimeString().slice(0, 5) : (task.start || "09:00");
    const endStr = end ? end.toTimeString().slice(0, 5) : (task.end || minutesToTime((timeToMinutes(startStr) || 9*60) + 30));

    return {
      id: task._id || task.id || `${date}-${startStr}-${task.title}` ,
      title: task.title || task.description || "Task",
      date,
      start: startStr,
      end: endStr,
      venue: task.venue || "",
      attendees: task.assignees || "",
      notes: task.description || "",
      color: "bg-emerald-500",
      type: "task",
      raw: task,
    };
  }

  async function fetchUserTasks() {
    setLoadingEvents(true);
    try {
      const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
      const res = await fetch(`${API_BASE}/api/executive/info`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });

      if (res.status === 401) {
        setEvents([]);
        setLoadingEvents(false);
        return;
      }

      const body = await res.json();
      // executives route sometimes returns { user } - support both shapes
      const user = body?.user ?? body;
      const tasks = Array.isArray(user?.tasks) ? user.tasks : [];

      const mapped = tasks.map(mapTaskToEvent);
      setEvents(mapped);
    } catch (err) {
      console.error("Failed to load tasks for calendar", err);
      setEvents([]);
    } finally {
      setLoadingEvents(false);
    }
  }

  useEffect(() => {
    fetchUserTasks();
    // if you want the calendar to refresh when view or date changes, add deps here
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const eventsByDate = useMemo(() => {
    const map = new Map();
    events.forEach((ev) => {
      const key = typeof ev.date === "string" ? ev.date : format(ev.date, "yyyy-MM-dd");
      const list = map.get(key) || [];
      list.push(ev);
      map.set(key, list);
    });
    return map;
  }, [events]);

  const [openModal, setOpenModal] = useState(false);
  const [initialValues, setInitialValues] = useState({});
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [openSlotModal, setOpenSlotModal] = useState(false);

  function resetForm() {
    setInitialValues({
      title: "",
      date: format(new Date(), "yyyy-MM-dd"),
      start: "09:00",
      end: "10:00",
      guests: "",
      venue: "",
      notes: "",
      calendar: "Hackathon",
    });
  }

  function openModalForDate(dateObj, suggestedStartTime = null, durationMin = 60) {
    // Prevent opening modal for past dates
    if (isBefore(startOfDay(dateObj), todayStart)) return;

    const key = format(dateObj, "yyyy-MM-dd");
    let start = "09:00";
    let end = "10:00";
    if (suggestedStartTime) {
      start = suggestedStartTime;
      end = minutesToTime(timeToMinutes(suggestedStartTime) + durationMin);
    } else {
      end = minutesToTime(timeToMinutes(start) + durationMin);
    }
    setInitialValues({
      title: "",
      date: key,
      start,
      end,
      guests: "",
      venue: "",
      notes: "",
      calendar: "Hackathon",
    });
    setOpenSlotModal(false);
    setOpenModal(true);
  }

  function handleSave(values) {
    const newEv = {
      id: Date.now(),
      title: values.title,
      date: values.date,
      start: values.start,
      end: values.end,
      venue: values.venue,
      attendees: values.guests,
      notes: values.notes,
      calendar: values.calendar || "Hackathon",
      color: ["bg-indigo-600", "bg-emerald-500", "bg-amber-500", "bg-rose-500"][Math.floor(Math.random() * 4)],
    };
    setEvents((s) => [...s, newEv]);
    setOpenModal(false);
  }

  function prev() {
    if (selectedView === "Week") {
      const d = new Date(currentDate);
      d.setDate(d.getDate() - 7);
      setCurrentDate(d);
    } else if (selectedView === "Day") {
      const d = new Date(currentDate);
      d.setDate(d.getDate() - 1);
      setCurrentDate(d);
    } else {
      const d = new Date(currentDate);
      d.setMonth(d.getMonth() - 1);
      setCurrentDate(d);
    }
  }
  function next() {
    if (selectedView === "Week") {
      const d = new Date(currentDate);
      d.setDate(d.getDate() + 7);
      setCurrentDate(d);
    } else if (selectedView === "Day") {
      const d = new Date(currentDate);
      d.setDate(d.getDate() + 1);
      setCurrentDate(d);
    } else {
      const d = new Date(currentDate);
      d.setMonth(d.getMonth() + 1);
      setCurrentDate(d);
    }
  }
  function today() { setCurrentDate(new Date()); }

  const containerBg = theme === "dark" ? "bg-gradient-to-br from-slate-900 to-slate-800" : "bg-gradient-to-br from-white via-slate-50 to-indigo-50";
  const headerH = "12rem";

  return (
    <div className={`min-h-screen transition-colors duration-300 ${containerBg}`}>
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">

        <div className="sticky top-0 z-20">
          <div className="py-8">
            <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h1 className={`text-3xl font-semibold tracking-tight ${theme === "dark" ? "text-white" : "text-slate-900"}`}>Calendar</h1>
                <p className={`text-sm ${theme === "dark" ? "text-slate-300" : "text-slate-600"}`}>
                  Professional schedule with light & dark themes — click a day or a time slot to create an event.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <Button variant="outline" onClick={today} className="gap-2">
                  <CalendarIcon className="h-4 w-4" /> Today
                </Button>

                <Button onClick={() => { resetForm(); setOpenModal(true); }} className="flex items-center gap-2">
                  <Plus className="h-4 w-4" /> Create
                </Button>

                <button onClick={handleToggleTheme} aria-label="Toggle theme" className={`ml-2 inline-flex items-center gap-2 rounded-full px-3 py-2 ring-1 transition-colors ${theme === "dark" ? "bg-slate-800 ring-slate-700 text-slate-100 hover:bg-slate-700" : "bg-white ring-slate-200 text-slate-800 hover:bg-slate-50"}`}>
                  {theme === "dark" ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
                  <span className="text-sm font-medium">{theme === "dark" ? "Dark" : "Light"}</span>
                </button>
              </div>
            </div>

            <Card className={`mb-6 ${theme === "dark" ? "bg-slate-800 border-slate-700" : "bg-white"}`}>
              <CardContent className={`flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 py-3 ${theme === "dark" ? "text-slate-200" : "text-slate-700"}`}>
                <div className="flex items-center gap-3">
                  <Button variant="ghost" size="icon" onClick={prev}><ChevronLeft className="h-5 w-5" /></Button>

                  <div className="min-w-[14rem] text-center text-lg font-medium tracking-tight">
                    {format(currentDate, "MMMM yyyy")}
                  </div>

                  <Button variant="ghost" size="icon" onClick={next}><ChevronRight className="h-5 w-5" /></Button>
                </div>

                <div className="flex items-center gap-2">
                  <Tabs value={selectedView}>
                    <TabsList className="grid grid-cols-3">
                      <TabsTrigger className="px-4" value="Month" onClick={() => setSelectedView("Month")}>Month</TabsTrigger>
                      <TabsTrigger className="px-4" value="Week" onClick={() => setSelectedView("Week")}>Week</TabsTrigger>
                      <TabsTrigger className="px-4" value="Day" onClick={() => setSelectedView("Day")}>Day</TabsTrigger>
                    </TabsList>
                  </Tabs>

                  <Button variant="outline" size="sm" className="flex items-center gap-2">
                    <Grid className="h-4 w-4" /> {selectedView}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        <div
          className="grid grid-cols-1 gap-6 no-scrollbar"
          style={{ maxHeight: `calc(100vh - ${headerH})`, overflowY: "auto", overflowX: "hidden" }}
        >
          <main>
            <Card className={`${theme === "dark" ? "bg-slate-800 border-slate-700" : "bg-white"} overflow-hidden`}>
              <CardHeader>
                <CardTitle className={`text-sm ${theme === "dark" ? "text-slate-200" : "text-slate-700"}`}>{selectedView === "Month" ? "Month view" : selectedView === "Week" ? "Week view" : "Day view"}</CardTitle>
              </CardHeader>

              <CardContent className="p-4">
                {/* MONTH */}
                {selectedView === "Month" ? (
                  /* Responsive: mobile -> one column (each day full width), sm+ -> 7 columns */
                  <div className="grid grid-cols-1 sm:grid-cols-7 gap-3">
                    {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
                      <div key={d} className={`text-xs ${theme === "dark" ? "text-slate-300" : "text-muted-foreground"} p-2 text-center font-semibold hidden sm:block`}>{d}</div>
                    ))}

                    {monthGrid.map((day, idx) => {
                      const key = format(day, "yyyy-MM-dd");
                      const inMonth = isSameMonth(day, currentDate);
                      const isToday = isSameDay(day, new Date());
                      const evs = eventsByDate.get(key) || [];

                      // disable past dates
                      const dayStart = startOfDay(day);
                      const isPast = isBefore(dayStart, todayStart);

                      return (
                        <button
                          key={idx}
                          onClick={() => {
                            if (isPast) return;
                            openModalForDate(day);
                            setSelectedSlot({ date: day, start: null });
                          }}
                          aria-disabled={isPast}
                          disabled={isPast}
                          className={`relative group p-3 text-left min-h-[96px] rounded-lg transition transform duration-150 ease-out hover:translate-y-[-2px] hover:shadow-lg ${inMonth ? (theme === "dark" ? 'bg-slate-700' : 'bg-white') : (theme === "dark" ? 'bg-slate-800 text-slate-500' : 'bg-slate-50 text-slate-400') } ${isPast ? 'opacity-50 cursor-not-allowed' : ''}`}
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex items-center gap-2">
                              <div className={`w-8 h-8 flex items-center justify-center rounded-full text-sm font-semibold ${isToday ? 'bg-indigo-600 text-white' : (theme === 'dark' ? 'bg-slate-600 text-slate-100' : '')}`}>{format(day, 'd')}</div>
                              <div className={`text-xs ${theme === 'dark' ? 'text-slate-300' : 'text-muted-foreground'} hidden sm:block`}>{format(day, 'MMM')}</div>
                            </div>

                            {/* Open indicator — revealed on hover */}
                            <div className="text-xs text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity">Open</div>
                          </div>

                          <div className="mt-3 space-y-1">
                            {evs.slice(0, 3).map(ev => (
                              <div
                                key={ev.id}
                                className={`flex items-center gap-2 p-2 rounded-md truncate transition-colors group-hover:bg-opacity-10 ${theme === 'dark' ? 'group-hover:bg-white/6' : 'group-hover:bg-slate-100'}`}
                                title={ev.title}
                              >
                                <span className={`inline-block w-2 h-2 rounded-full ${ev.color}`}></span>
                                <div className="text-sm truncate">{ev.title}</div>
                              </div>
                            ))}
                            {evs.length > 3 && <div className="text-xs text-muted-foreground">+{evs.length - 3} more</div>}
                          </div>
                        </button>
                      );
                    })}
                  </div>

                ) : selectedView === "Week" ? (

                  /* WEEK */
                  <div className={`border rounded-lg overflow-hidden ${theme === 'dark' ? 'border-slate-700' : ''}`}>
                    <div
                      className="w-full"
                      style={{
                        display: 'grid',
                        gridTemplateColumns: `80px repeat(7, 1fr)`,
                        gridTemplateRows: `auto ${DAY_SLOTS.map(() => `${SLOT_HEIGHT_PX}px`).join(' ')}`,
                      }}
                    >
                      <div style={{ gridColumn: 1, gridRow: 1 }} className={`px-3 py-3 text-xs ${theme === 'dark' ? 'text-slate-400' : 'text-muted-foreground'}`}>Time</div>

                      {Array.from({ length: 7 }).map((_, i) => {
                        const day = addDays(startOfWeek(currentDate, { weekStartsOn: 1 }), i);
                        return (
                          <div key={i} style={{ gridColumn: i + 2, gridRow: 1 }} className={`px-3 py-2 text-sm font-medium ${theme === 'dark' ? 'text-slate-200' : ''}`}>
                            <div className={`text-xs ${theme === 'dark' ? 'text-slate-400' : 'text-muted-foreground'}`}>{format(day, 'EEE')}</div>
                            <div className="text-sm">{format(day, 'dd MMM')}</div>
                          </div>
                        );
                      })}

                      {DAY_SLOTS.map((t, rowIndex) => {
                        const row = rowIndex + 2;
                        return (
                          <React.Fragment key={t}>
                            <div style={{ gridColumn: 1, gridRow: row }} className={`px-2 text-[12px] flex items-center ${theme === 'dark' ? 'text-slate-400' : 'text-muted-foreground'}`}>
                              {t.endsWith(':00') ? t.split(':')[0] + ':00' : ''}
                            </div>

                            {Array.from({ length: 7 }).map((_, dayIdx) => {
                              const day = addDays(startOfWeek(currentDate, { weekStartsOn: 1 }), dayIdx);
                              const dayKey = format(day, 'yyyy-MM-dd');
                              const evs = eventsByDate.get(dayKey) || [];
                              const slotEvents = evs.filter((ev) => {
                                if (!ev?.start || !ev?.end) return false;
                                const s = timeToMinutes(ev.start);
                                const e = timeToMinutes(ev.end);
                                if (s == null || e == null) return false;
                                const slotStart = timeToMinutes(t);
                                if (slotStart == null) return false;
                                const slotEnd = slotStart + SLOT_STEP_MIN;
                                return !(e <= slotStart || s >= slotEnd);
                              });

                              const isSelected = selectedSlot && selectedSlot.date && format(selectedSlot.date, 'yyyy-MM-dd') === dayKey && selectedSlot.start === t;

                              // disable entire day column if the day is before today
                              const dayStart = startOfDay(day);
                              const isPastDay = isBefore(dayStart, todayStart);

                              return (
                                <div key={dayIdx} style={{ gridColumn: dayIdx + 2, gridRow: row }} className="p-1">
                                  <button
                                    type="button"
                                    onClick={() => {
                                      if (isPastDay) return;
                                      setSelectedSlot({ date: day, start: t });
                                      setOpenSlotModal(true);
                                    }}
                                    aria-disabled={isPastDay}
                                    disabled={isPastDay}
                                    className={`w-full h-full rounded-lg transition transform duration-150 ${isSelected ? (theme === 'dark' ? "bg-indigo-900/30 ring-1 ring-indigo-400/30" : "bg-indigo-50 ring-1 ring-indigo-200") : (theme === 'dark' ? "bg-transparent hover:bg-white/6 hover:shadow-sm hover:scale-[1.01]" : "bg-gray-50 hover:bg-gray-100 hover:shadow-sm hover:scale-[1.01]")}` + (isPastDay ? ' opacity-50 cursor-not-allowed' : '')}
                                    style={theme === 'dark' ? { background: isSelected ? undefined : 'rgba(255,255,255,0.02)', height: '100%' } : { height: '100%' }}
                                  >
                                    <div className="text-sm truncate">{slotEvents[0] ? slotEvents[0].title : ""}</div>
                                    <div className="flex items-center gap-2">{slotEvents.length > 0 && <div className={`w-3 h-3 rounded-full ${slotEvents[0].color}`} />}</div>
                                  </button>
                                </div>
                              );
                            })}
                          </React.Fragment>
                        );
                      })}

                    </div>
                  </div>

                ) : (

                  /* DAY view */
                  <div className={`border rounded-lg overflow-hidden ${theme === 'dark' ? 'border-slate-700' : ''}`}>
                    <div className={`flex border-b ${theme === 'dark' ? 'bg-slate-900' : 'bg-slate-50'}`}>
                      <div className={`w-20 border-r px-3 py-3 text-xs ${theme === 'dark' ? 'text-slate-400' : 'text-muted-foreground'}`}>Time</div>
                      <div className={`flex-1 px-4 py-3 text-sm font-medium ${theme === 'dark' ? 'text-slate-200' : ''}`}>{format(currentDate, 'EEEE, dd MMM yyyy')}</div>
                    </div>

                    <div className="flex">
                      <div className={`w-20 border-r ${theme === 'dark' ? 'bg-slate-900' : 'bg-white'}`}>
                        {DAY_SLOTS.map((t) => (
                          <div key={t} className={`px-2 text-[12px] ${theme === 'dark' ? 'text-slate-400' : 'text-muted-foreground'} border-b flex items-center`} style={{ height: SLOT_HEIGHT_PX }}>
                            {t.endsWith(':00') ? t.split(':')[0] + ':00' : ''}
                          </div>
                        ))}
                      </div>

                      <div className="flex-1 p-4">
                        <div className="space-y-3">
                          {DAY_SLOTS.map((t, slotIdx) => {
                            const isSelected = selectedSlot && selectedSlot.date && format(selectedSlot.date, 'yyyy-MM-dd') === format(currentDate, 'yyyy-MM-dd') && selectedSlot.start === t;

                            const evs = eventsByDate.get(format(currentDate, 'yyyy-MM-dd')) || [];
                            const slotEvents = evs.filter((ev) => {
                              const s = timeToMinutes(ev.start);
                              const e = timeToMinutes(ev.end);
                              const slotStart = timeToMinutes(t);
                              const slotEnd = slotStart + SLOT_STEP_MIN;
                              return !(e <= slotStart || s >= slotEnd);
                            });

                            // disable day if currentDate is before today
                            const isPastDay = isBefore(startOfDay(currentDate), todayStart);

                            return (
                              <div key={t + slotIdx} style={{ height: SLOT_HEIGHT_PX }}>
                                <button
                                  type="button"
                                  onClick={() => {
                                    if (isPastDay) return;
                                    setSelectedSlot({ date: currentDate, start: t });
                                    setOpenSlotModal(true);
                                  }}
                                  aria-disabled={isPastDay}
                                  disabled={isPastDay}
                                  className={`w-full h-full rounded-lg transition transform duration-150 flex items-center justify-between px-4 ${isSelected ? (theme === 'dark' ? "bg-indigo-900/30 ring-1 ring-indigo-400/30" : "bg-indigo-50 ring-1 ring-indigo-200") : (theme === 'dark' ? "bg-transparent hover:bg-white/3 hover:shadow-sm hover:scale-[1.01]" : "bg-gray-50 hover:bg-gray-100 hover:shadow-sm hover:scale-[1.01]")}` + (isPastDay ? ' opacity-50 cursor-not-allowed' : '')}
                                >
                                  <div className="text-sm truncate">{slotEvents[0] ? slotEvents[0].title : ""}</div>
                                  <div>{slotEvents.length > 0 && <div className={`w-3 h-3 rounded-full ${slotEvents[0].color}`} />}</div>
                                </button>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  </div>

                )}
              </CardContent>
            </Card>
          </main>
        </div>

      </div>

      <SlotModal
        open={openSlotModal}
        onClose={() => setOpenSlotModal(false)}
        slot={selectedSlot}
        theme={theme}
        events={
          selectedSlot
            ? (eventsByDate.get(format(selectedSlot.date, "yyyy-MM-dd")) || []).filter((ev) => {
              if (!ev?.start || !ev?.end) return false;
              const s = timeToMinutes(ev.start);
              const e = timeToMinutes(ev.end);
              if (s == null || e == null) return false;
              const slotStart = timeToMinutes(selectedSlot.start);
              if (slotStart == null) return false;
              const slotEnd = slotStart + SLOT_STEP_MIN;
              return !(e <= slotStart || s >= slotEnd);
            })
            : []
        }
        onCreate={(date, start) => openModalForDate(date, start, 60)}
      />

      <EventModal open={openModal} onClose={() => setOpenModal(false)} initialValues={initialValues} onSave={handleSave} isDark={theme === "dark"} />

      <style>{`
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
        .bg-indigo-600 { background-color: #4f46e5; }
        .bg-emerald-500 { background-color: #10b981; }
        .bg-amber-500 { background-color: #f59e0b; }
        .bg-rose-500 { background-color: #fb7185; }

        /* small extra polish for hover/interaction */
        .group:hover .group-hover\\:opacity-100 { opacity: 1; }
        .transition { transition: all 150ms ease-in-out; }
      `}</style>
    </div>
  );
}
