// // import React, { useContext, useEffect, useMemo, useState } from "react";
// // import { ThemeContext } from "@/context/ThemeContext";
// // import { Card, CardHeader, CardContent, CardTitle } from "@/components/ui/card";
// // import { Button } from "@/components/ui/button";
// // import { Input } from "@/components/ui/input";
// // import {
// //   DropdownMenu,
// //   DropdownMenuTrigger,
// //   DropdownMenuContent,
// //   DropdownMenuItem,
// // } from "@/components/ui/dropdown-menu";
// // import { Badge } from "@/components/ui/badge";
// // import { Separator } from "@/components/ui/separator";
// // import { Skeleton } from "@/components/ui/skeleton"

// // import {
// //   CalendarDays,
// //   Clock4,
// //   MapPin,
// //   Video,
// //   Plus,
// //   Search,
// //   UserPlus,
// //   Mail,
// //   CheckCircle2,
// //   AlertCircle,
// // } from "lucide-react";

// // /**
// //  * Compact Skeleton Dashboard
// //  * - Smaller, adaptive skeleton placeholders
// //  * - Reduced paddings/margins for a compact look while loading
// //  * - Keeps original layout & logic
// //  */

// // export default function Dashboard() {
// //   const { isDark } = useContext(ThemeContext);

// //   // date state (YYYY-MM-DD)
// //   const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));

// //   // backend-driven state
// //   const [meetings, setMeetings] = useState([]);
// //   const [tasks, setTasks] = useState([]);
// //   const [leaves, setLeaves] = useState([]);
// //   const [user, setUser] = useState(null);

// //   const [loading, setLoading] = useState(true);
// //   const [error, setError] = useState(null);

// //   // AUTH header helper (adjust if you store token elsewhere)
// //   const getAuthHeaders = () => {
// //     const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
// //     return token ? { Authorization: `Bearer ${token}` } : {};
// //   };

// //   // robust fetch helper with diagnostics (returns JSON or throws detailed Error)
// //   async function safeFetchJson(url, opts = {}) {
// //     const headers = { "Content-Type": "application/json", ...getAuthHeaders(), ...(opts.headers || {}) };
// //     const res = await fetch(url, { ...opts, headers });
// //     const contentType = res.headers.get("content-type") || "";

// //     if (!res.ok) {
// //       const text = await res.text().catch(() => "<unable to read>");
// //       const snippet = text.length > 300 ? text.slice(0, 300) + "..." : text;
// //       throw new Error(`HTTP ${res.status} ${res.statusText} — ${contentType}. Body: ${snippet}`);
// //     }

// //     if (contentType.includes("application/json")) {
// //       return res.json();
// //     } else {
// //       const text = await res.text().catch(() => "");
// //       throw new Error(`Expected JSON but got ${contentType}. Body: ${text.slice(0, 300)}`);
// //     }
// //   }

// //   useEffect(() => {
// //     let mounted = true;
// //     setLoading(true);
// //     setError(null);

// //     // require token early to avoid HTML redirect pages
// //     const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
// //     if (!token) {
// //       setError("No auth token found — please sign in.");
// //       setLoading(false);
// //       return;
// //     }

// //     const dateQuery = date;

// //     Promise.all([
// //       safeFetchJson(`https://tms-project-8.onrender.com/api/meetings/my-day?date=${encodeURIComponent(dateQuery)}`),
// //       safeFetchJson("https://tms-project-8.onrender.com/api/executive/info"),
// //       safeFetchJson("https://tms-project-8.onrender.com/api/executive/me/tasks"),
// //     ])
// //       .then(([meetRes, infoRes, tasksRes]) => {
// //         if (!mounted) return;

// //         // meetings: ensure array
// //         const rawMeetings = Array.isArray(meetRes.meetings) ? meetRes.meetings : (meetRes.meetings ? [meetRes.meetings] : []);
// //         setMeetings(rawMeetings);

// //         // user info
// //         const loadedUser = infoRes.user || null;
// //         setUser(loadedUser);

// //         // tasks
// //         const loadedTasks = tasksRes.tasks || [];
// //         setTasks(loadedTasks);

// //         // map leaves
// //         const leavePeriods = (loadedUser && Array.isArray(loadedUser.leavePeriods)) ? loadedUser.leavePeriods : [];
// //         const mappedLeaves = leavePeriods.map(lp => {
// //           try {
// //             const s = new Date(lp.start).toLocaleDateString(undefined, { month: "short", day: "numeric" });
// //             const e = new Date(lp.end).toLocaleDateString(undefined, { month: "short", day: "numeric" });
// //             const label = lp.reason || "Leave";
// //             return { date: s === e ? s : `${s} — ${e}`, label };
// //           } catch (e) {
// //             return { date: String(lp.start), label: lp.reason || "Leave" };
// //           }
// //         });
// //         setLeaves(mappedLeaves);

// //         setLoading(false);
// //       })
// //       .catch(err => {
// //         if (!mounted) return;
// //         console.error("Dashboard load error (diagnostic):", err);
// //         setError(err.message || "Failed to load dashboard data");
// //         setLoading(false);
// //       });

// //     return () => { mounted = false; };
// //   }, [date]);

// //   // KPI calculations
// //   const kpis = useMemo(() => {
// //     const meetingsToday = meetings.length;
// //     let focusMs = 0;
// //     for (const t of tasks) {
// //       const s = t.startTime ? new Date(t.startTime).getTime() : null;
// //       const e = t.endTime ? new Date(t.endTime).getTime() : null;
// //       if (s && e && e > s) focusMs += (e - s);
// //     }
// //     const focusHours = Math.round((focusMs / (1000 * 60 * 60)) * 10) / 10;
// //     const tasksCount = tasks.length;
// //     const leavesCount = leaves.length;

// //     return [
// //       { label: "Meetings Today", value: meetingsToday, icon: CalendarDays },
// //       { label: "Focus (hrs)", value: focusHours, icon: Clock4 },
// //       { label: "Tasks", value: tasksCount, icon: Search },
// //       { label: "Upcoming Leaves", value: leavesCount, icon: Mail },
// //     ];
// //   }, [meetings, tasks, leaves]);

// //   // format meetings for UI
// //   const formattedMeetings = useMemo(() => {
// //     return meetings.map((m) => {
// //       const s = m.startTime ? new Date(m.startTime) : null;
// //       const e = m.endTime ? new Date(m.endTime) : null;
// //       const time = s && e
// //         ? `${s.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })} – ${e.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`
// //         : (s ? new Date(s).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "-");
// //       const title = m.title || m.name || "Untitled";
// //       const venue = m.venue || m.location || "—";
// //       const attendees =
// //         Array.isArray(m.participants) && m.participants.length > 0
// //           ? m.participants.map(p => p.name || p.email || String(p))
// //           : (Array.isArray(m.invited) ? m.invited.map(i => i.email || (i.execId ? String(i.execId) : "invite")) : []);
// //       const status = m.status ? String(m.status).charAt(0).toUpperCase() + String(m.status).slice(1) : "Pending";
// //       return { id: m._id, time, title, venue, attendees, status };
// //     });
// //   }, [meetings]);

// //   const formattedTasks = useMemo(() => {
// //     return tasks.map((t) => {
// //       const s = t.startTime ? new Date(t.startTime) : null;
// //       const time = s ? s.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "-";
// //       return {
// //         id: t._id || `${t.title}-${time}`,
// //         time,
// //         task: t.title || t.description || "Untitled Task",
// //         priority: t.priority || "Medium",
// //       };
// //     });
// //   }, [tasks]);

// //   // date display
// //   const today = useMemo(() => new Date(date), [date]);
// //   const localeDate = useMemo(
// //     () =>
// //       new Intl.DateTimeFormat(undefined, {
// //         weekday: "long",
// //         month: "long",
// //         day: "numeric",
// //       }).format(today),
// //     [today]
// //   );

// //   // improved dark-mode / card styles
// //   const base = isDark ? "bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-slate-900 via-slate-900/95 to-slate-800 text-slate-100" : "bg-slate-50 text-slate-900";
// //   const cardTone = isDark
// //     ? "bg-gradient-to-br from-slate-900/70 via-slate-850/50 to-slate-800/60 border border-slate-800/60 backdrop-blur-sm"
// //     : "bg-white";

// //   // status badges mapping (more consistent)
// //   const statusBadge = (status) => {
// //     const map = {
// //       Confirmed: { variant: "default", icon: CheckCircle2 },
// //       Scheduled: { variant: "default", icon: CheckCircle2 },
// //       "Awaiting RSVP": { variant: "secondary", icon: AlertCircle },
// //       Tentative: { variant: "outline", icon: AlertCircle },
// //       Pending: { variant: "outline", icon: AlertCircle },
// //       Cancelled: { variant: "outline", icon: AlertCircle },
// //     };
// //     const cfg = map[status] ?? map["Tentative"];
// //     const Icon = cfg.icon;
// //     return (
// //       <Badge variant={cfg.variant} className="gap-1 inline-flex items-center text-xs">
// //         <Icon className="h-3.5 w-3.5" /> <span>{status}</span>
// //       </Badge>
// //     );
// //   };

// //   // --- Compact skeleton components ---

// //   // Small, responsive KPI skeletons (uses smaller avatar and tighter spacing)
// //   const SkeletonKPIs = () => {
// //     return (
// //       <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
// //         {Array.from({ length: 4 }).map((_, i) => (
// //           <div
// //             key={i}
// //             className="flex items-center space-x-3 rounded-lg border p-3 bg-white/60 dark:bg-slate-300/40 backdrop-blur-sm shadow-sm"
// //           >
// //             {/* Circle placeholder (smaller) */}
// //             <Skeleton className="h-8 w-8 rounded-full" />

// //             {/* Text placeholder (narrower) */}
// //             <div className="flex-1 space-y-2">
// //               <Skeleton className="h-4 w-[120px]" />
// //               <Skeleton className="h-4 w-[80px]" />
// //             </div>
// //           </div>
// //         ))}
// //       </div>
// //     );
// //   };

// //   // Compact list skeleton: reduced avatar + smaller text lines + tighter paddings
// //   const SkeletonList = ({ rows = 3 }) => {
// //     return (
// //       <div className="space-y-3">
// //         {Array.from({ length: rows }).map((_, i) => (
// //           <div
// //             key={i}
// //             className="flex items-center space-x-3 rounded-lg border p-3 bg-white/60 dark:bg-slate-300/40 backdrop-blur-sm shadow-sm"
// //           >
// //             {/* Icon/Avatar placeholder (smaller) */}
// //             <Skeleton className="h-8 w-8 rounded-full" />

// //             {/* Text lines (compact) */}
// //             <div className="flex-1 space-y-2">
// //               <Skeleton className="h-4 w-2/3" />
// //               <Skeleton className="h-4 w-1/3" />
// //             </div>
// //           </div>
// //         ))}
// //       </div>
// //     );
// //   };


// //   return (
// //     <div className={`${base} min-h-screen transition-colors duration-150`}>
// //       <div className="sticky top-0 z-40">
// //         <div className="mx-auto max-w-7xl px-4 py-4 md:py-5">
// //           <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
// //             <div className="flex items-center gap-3 w-full md:w-auto">
// //               <div className="flex-1 min-w-0">
// //                 <Input
// //                   placeholder="Search meetings, people, projects..."
// //                   className="w-full md:min-w-[360px] shadow-sm border-0 focus-visible:ring-2"
// //                 />
// //               </div>

// //               <Button size="sm" className="ml-1 shrink-0" variant="secondary">
// //                 <Search className="h-4 w-4" /> <span className="hidden md:inline">Search</span>
// //               </Button>
// //             </div>

// //             <div className="flex flex-wrap items-center gap-2 md:gap-3 justify-end">
// //               <DropdownMenu>
// //                 <DropdownMenuTrigger asChild>
// //                   <Button className="gap-2" size="sm">
// //                     <Plus className="h-4 w-4" /> <span className="hidden sm:inline">New</span>
// //                   </Button>
// //                 </DropdownMenuTrigger>
// //                 <DropdownMenuContent align="end">
// //                   <DropdownMenuItem>New Meeting</DropdownMenuItem>
// //                   <DropdownMenuItem>Find Common Slot</DropdownMenuItem>
// //                   <DropdownMenuItem>Add Task</DropdownMenuItem>
// //                   <DropdownMenuItem>Add Leave</DropdownMenuItem>
// //                 </DropdownMenuContent>
// //               </DropdownMenu>

// //               <Button size="sm" variant="secondary" className="gap-2 shrink-0">
// //                 <UserPlus className="h-4 w-4" /> <span className="hidden md:inline">Invite</span>
// //               </Button>
// //             </div>
// //           </div>

// //           <div className="mt-4 flex flex-col md:flex-row md:items-end md:justify-between gap-3">
// //             <div className="min-w-0">
// //               <h1 className="text-2xl md:text-3xl font-semibold tracking-tight leading-tight">Dashboard</h1>
// //               <p className="mt-1 flex items-center gap-2 text-sm opacity-80">
// //                 <CalendarDays className="h-4 w-4" /> {localeDate}
// //               </p>
// //             </div>

// //             <div className="flex flex-wrap items-center gap-2 md:gap-3">
// //               <Button size="sm" variant="outline" className="shrink-0">Today</Button>
// //               <Button size="sm" variant="outline" className="shrink-0">Week</Button>
// //               <Button size="sm" className="gap-2 shrink-0"><Plus className="h-4 w-4" /> New Meeting</Button>
// //             </div>
// //           </div>
// //         </div>
// //       </div>

// //       <div className="mx-auto max-w-7xl px-4 mt-6 pb-12">
// //         {/* error card */}
// //         {error && (
// //           <Card className={`${cardTone} border-0 shadow-sm mb-4`}>
// //             <CardContent>
// //               <div className="text-sm text-destructive">Error: {String(error)}</div>
// //             </CardContent>
// //           </Card>
// //         )}

// //         {/* KPIs */}
// //         {loading ? (
// //           <SkeletonKPIs />
// //         ) : (
// //           <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
// //             {kpis.map(({ label, value, icon: Icon }, i) => (
// //               <Card key={i} className={`${cardTone} border-0 shadow-sm`}>
// //                 <CardContent className="p-3">
// //                   <div className="flex items-center justify-between">
// //                     <div>
// //                       <p className="text-xs uppercase tracking-wide opacity-70">{label}</p>
// //                       <p className="text-xl font-semibold mt-1">{value}</p>
// //                     </div>
// //                     <div className="rounded-lg p-1 bg-white/5 border border-white/6">
// //                       <Icon className="h-4 w-4" />
// //                     </div>
// //                   </div>
// //                 </CardContent>
// //               </Card>
// //             ))}
// //           </div>
// //         )}

// //         {/* Main grid */}
// //         <div className="mt-6 grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6">
// //           {/* Next Up */}
// //           <Card className={`${cardTone} border-0 shadow-sm lg:col-span-2`}>
// //             <CardHeader className="pb-2">
// //               <div className="flex items-center justify-between">
// //                 <CardTitle className="tracking-tight">Next Up</CardTitle>
// //                 <Button size="sm" variant="ghost" className="gap-2">
// //                   <Search className="h-4 w-4" /> <span className="hidden sm:inline">Find Slot</span>
// //                 </Button>
// //               </div>
// //             </CardHeader>

// //             <CardContent className="pt-0">
// //               {loading ? (
// //                 <SkeletonList rows={4} />
// //               ) : (
// //                 <div className="space-y-3">
// //                   {(() => {
// //                     const items = [];
// //                     for (const m of meetings) {
// //                       const start = m.startTime ? new Date(m.startTime) : null;
// //                       items.push({ type: "MEETING", start, title: m.title || m.name || "Meeting", meta: m.venue || m.location, isVirtual: m.venue === "Zoom" || m.isVirtual, raw: m });
// //                     }
// //                     for (const t of tasks) {
// //                       const start = t.startTime ? new Date(t.startTime) : null;
// //                       items.push({ type: "TASK", start, title: t.title || t.description || "Task", meta: t.description || "", raw: t });
// //                     }
// //                     items.sort((a, b) => {
// //                       const as = a.start ? a.start.getTime() : Infinity;
// //                       const bs = b.start ? b.start.getTime() : Infinity;
// //                       return as - bs;
// //                     });
// //                     const next = items.slice(0, 6);
// //                     if (next.length === 0) return <div className="text-sm opacity-70">No upcoming items.</div>;
// //                     return next.map((n, i) => {
// //                       const time = n.start ? n.start.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "—";
// //                       return (
// //                         <div key={i} className="flex items-start gap-3 rounded-lg border px-2 py-2">
// //                           <div className="shrink-0 mt-0.5">
// //                             <Badge variant="secondary" className="text-xs py-0.5 px-2">{time}</Badge>
// //                           </div>

// //                           <div className="min-w-0 flex-1">
// //                             <p className="font-medium truncate text-sm">{n.title}</p>
// //                             <div className="mt-1 flex items-center gap-2 text-sm opacity-80">
// //                               {n.type === "MEETING" ? (
// //                                 n.isVirtual ? (
// //                                   <span className="inline-flex items-center gap-1"><Video className="h-4 w-4" /> {n.meta || "Virtual"}</span>
// //                                 ) : (
// //                                   <span className="inline-flex items-center gap-1"><MapPin className="h-4 w-4" /> {n.meta || "Location"}</span>
// //                                 )
// //                               ) : (
// //                                 <span className="inline-flex items-center gap-1"><Clock4 className="h-4 w-4" /> {n.meta || "Task"}</span>
// //                               )}
// //                               <Badge variant="outline" className="text-xs">{n.type}</Badge>
// //                             </div>
// //                           </div>
// //                         </div>
// //                       );
// //                     });
// //                   })()}
// //                 </div>
// //               )}
// //             </CardContent>
// //           </Card>

// //           {/* Leaves */}
// //           <Card className={`${cardTone} border-0 shadow-sm`}>
// //             <CardHeader className="pb-2">
// //               <CardTitle className="tracking-tight">Upcoming Leaves</CardTitle>
// //             </CardHeader>
// //             <CardContent className="pt-0">
// //               {loading ? (
// //                 <SkeletonList rows={3} />
// //               ) : leaves.length ? (
// //                 <div className="space-y-2">
// //                   {leaves.map((l, i) => (
// //                     <div key={i} className="flex items-center justify-between rounded-lg border px-2 py-2">
// //                       <div className="flex items-center gap-2">
// //                         <CalendarDays className="h-4 w-4" />
// //                         <span className="font-medium text-sm">{l.date}</span>
// //                       </div>
// //                       <Badge variant="outline" className="text-xs">{l.label}</Badge>
// //                     </div>
// //                   ))}
// //                 </div>
// //               ) : (
// //                 <p className="text-sm opacity-70">No upcoming leaves.</p>
// //               )}
// //             </CardContent>
// //           </Card>
// //         </div>

// //         {/* Secondary grid */}
// //         <div className="mt-6 grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
// //           {/* Today's Meetings */}
// //           <Card className={`${cardTone} border-0 shadow-sm`}>
// //             <CardHeader className="pb-2">
// //               <CardTitle className="tracking-tight">Today's Meetings</CardTitle>
// //             </CardHeader>
// //             <CardContent className="pt-0">
// //               <div className="divide-y">
// //                 {loading ? (
// //                   <SkeletonList rows={4} />
// //                 ) : formattedMeetings.length === 0 ? (
// //                   <div className="py-4 text-sm opacity-70">No meetings for this day.</div>
// //                 ) : (
// //                   formattedMeetings.map((m, i) => (
// //                     <div key={m.id || i} className="py-3 flex flex-col gap-1">
// //                       <div className="flex items-center justify-between gap-3">
// //                         <p className="font-medium truncate text-sm">{m.title}</p>
// //                         {statusBadge(m.status)}
// //                       </div>
// //                       <div className="flex flex-wrap items-center gap-3 text-sm opacity-80">
// //                         <span className="inline-flex items-center gap-1"><Clock4 className="h-4 w-4" /> {m.time}</span>
// //                         {m.venue === "Zoom" ? (
// //                           <span className="inline-flex items-center gap-1"><Video className="h-4 w-4" /> {m.venue}</span>
// //                         ) : (
// //                           <span className="inline-flex items-center gap-1"><MapPin className="h-4 w-4" /> {m.venue}</span>
// //                         )}
// //                         <Separator orientation="vertical" className="h-4" />
// //                         <span className="truncate text-sm">Attendees: {m.attendees && m.attendees.length ? m.attendees.join(", ") : "—"}</span>
// //                       </div>
// //                     </div>
// //                   ))
// //                 )}
// //               </div>
// //             </CardContent>
// //           </Card>

// //           {/* Tasks */}
// //           <Card className={`${cardTone} border-0 shadow-sm`}>
// //             <CardHeader className="pb-2">
// //               <div className="flex items-center justify-between">
// //                 <CardTitle className="tracking-tight">Today's Tasks</CardTitle>
// //                 <Button size="sm" variant="ghost" className="gap-2">
// //                   <Plus className="h-4 w-4" /> Add Task
// //                 </Button>
// //               </div>
// //             </CardHeader>
// //             <CardContent className="pt-0">
// //               {loading ? (
// //                 <SkeletonList rows={4} />
// //               ) : formattedTasks.length === 0 ? (
// //                 <div className="text-sm opacity-70">No tasks for today.</div>
// //               ) : (
// //                 <div className="space-y-3">
// //                   {formattedTasks.map((t, i) => (
// //                     <div key={t.id || i} className="flex items-start gap-3 rounded-lg border px-2 py-2">
// //                       <Badge variant="secondary" className="text-xs py-0.5 px-2">{t.time}</Badge>
// //                       <div className="min-w-0 flex-1">
// //                         <p className="font-medium truncate text-sm">{t.task}</p>
// //                         <div className="mt-1 text-sm opacity-80 flex items-center gap-2">
// //                           <span>Priority:</span>
// //                           <Badge variant={t.priority === "High" ? "destructive" : t.priority === "Medium" ? "default" : "outline"} className="text-xs">
// //                             {t.priority}
// //                           </Badge>
// //                         </div>
// //                       </div>
// //                     </div>
// //                   ))}
// //                 </div>
// //               )}
// //             </CardContent>
// //           </Card>
// //         </div>
// //       </div>
// //     </div>
// //   );
// // }
// // src/components/Dashboard.jsx
// import React, { useContext, useEffect, useMemo, useState } from "react";
// import { ThemeContext } from '@/context/ThemeContext';
// import { Input } from '@/components/ui/input';
// import { Button } from '@/components/ui/button';
// import { Card, CardHeader, CardContent, CardFooter, CardTitle } from '@/components/ui/card';
// import { Badge } from '@/components/ui/badge';
// import { Skeleton } from '@/components/ui/skeleton';
// import { Separator } from '@/components/ui/separator';
// import { CalendarDays, Clock4, Plus, Search, MapPin, Video, CheckCircle2, AlertCircle, Mail, UserPlus } from 'lucide-react';

// export default function Dashboard() {
//   const { isDark } = useContext(ThemeContext);

//   // date state (YYYY-MM-DD)
//   const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));

//   // backend-driven state
//   const [meetings, setMeetings] = useState([]);
//   const [tasks, setTasks] = useState([]);
//   const [leaves, setLeaves] = useState([]);
//   const [user, setUser] = useState(null);

//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState(null);

//   // AUTH header helper (adjust if you store token elsewhere)
//   const getAuthHeaders = () => {
//     const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
//     return token ? { Authorization: `Bearer ${token}` } : {};
//   };

//   // robust fetch helper with diagnostics (returns JSON or throws detailed Error)
//   async function safeFetchJson(url, opts = {}) {
//     const headers = { "Content-Type": "application/json", ...getAuthHeaders(), ...(opts.headers || {}) };
//     const res = await fetch(url, { ...opts, headers });
//     const contentType = res.headers.get("content-type") || "";

//     if (!res.ok) {
//       const text = await res.text().catch(() => "<unable to read>");
//       const snippet = text.length > 300 ? text.slice(0, 300) + "..." : text;
//       throw new Error(`HTTP ${res.status} ${res.statusText} — ${contentType}. Body: ${snippet}`);
//     }

//     if (contentType.includes("application/json")) {
//       return res.json();
//     } else {
//       const text = await res.text().catch(() => "");
//       throw new Error(`Expected JSON but got ${contentType}. Body: ${text.slice(0, 300)}`);
//     }
//   }

//   useEffect(() => {
//     let mounted = true;
//     setLoading(true);
//     setError(null);

//     // require token early to avoid HTML redirect pages
//     const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
//     if (!token) {
//       setError("No auth token found — please sign in.");
//       setLoading(false);
//       return;
//     }

//     const dateQuery = date;

//     Promise.all([
//       safeFetchJson(`https://tms-project-8.onrender.com/api/meetings/my-day?date=${encodeURIComponent(dateQuery)}`),
//       safeFetchJson("https://tms-project-8.onrender.com/api/executive/info"),
//       safeFetchJson("https://tms-project-8.onrender.com/api/executive/me/tasks"),
//     ])
//       .then(([meetRes, infoRes, tasksRes]) => {
//         if (!mounted) return;

//         // meetings: ensure array
//         const rawMeetings = Array.isArray(meetRes.meetings) ? meetRes.meetings : (meetRes.meetings ? [meetRes.meetings] : []);
//         setMeetings(rawMeetings);

//         // user info
//         const loadedUser = infoRes.user || null;
//         setUser(loadedUser);

//         // tasks
//         const loadedTasks = tasksRes.tasks || [];
//         setTasks(loadedTasks);

//         // map leaves
//         const leavePeriods = (loadedUser && Array.isArray(loadedUser.leavePeriods)) ? loadedUser.leavePeriods : [];
//         const mappedLeaves = leavePeriods.map(lp => {
//           try {
//             const s = new Date(lp.start).toLocaleDateString(undefined, { month: "short", day: "numeric" });
//             const e = new Date(lp.end).toLocaleDateString(undefined, { month: "short", day: "numeric" });
//             const label = lp.reason || "Leave";
//             return { date: s === e ? s : `${s} — ${e}`, label };
//           } catch (e) {
//             return { date: String(lp.start), label: lp.reason || "Leave" };
//           }
//         });
//         setLeaves(mappedLeaves);

//         setLoading(false);
//       })
//       .catch(err => {
//         if (!mounted) return;
//         console.error("Dashboard load error (diagnostic):", err);
//         setError(err.message || "Failed to load dashboard data");
//         setLoading(false);
//       });

//     return () => { mounted = false; };
//   }, [date]);

//   // KPI calculations
//   const kpis = useMemo(() => {
//     const meetingsToday = meetings.length;
//     let focusMs = 0;
//     for (const t of tasks) {
//       const s = t.startTime ? new Date(t.startTime).getTime() : null;
//       const e = t.endTime ? new Date(t.endTime).getTime() : null;
//       if (s && e && e > s) focusMs += (e - s);
//     }
//     const focusHours = Math.round((focusMs / (1000 * 60 * 60)) * 10) / 10;
//     const tasksCount = tasks.length;
//     const leavesCount = leaves.length;

//     return [
//       { label: "Meetings Today", value: meetingsToday, icon: CalendarDays, tone: "from-emerald-400 to-emerald-600" },
//       { label: "Focus (hrs)", value: focusHours, icon: Clock4, tone: "from-indigo-400 to-indigo-600" },
//       { label: "Tasks", value: tasksCount, icon: Search, tone: "from-amber-400 to-amber-600" },
//       { label: "Upcoming Leaves", value: leavesCount, icon: Mail, tone: "from-rose-400 to-rose-600" },
//     ];
//   }, [meetings, tasks, leaves]);

//   // format meetings for UI
//   const formattedMeetings = useMemo(() => {
//     return meetings.map((m) => {
//       const s = m.startTime ? new Date(m.startTime) : null;
//       const e = m.endTime ? new Date(m.endTime) : null;
//       const time = s && e
//         ? `${s.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })} – ${e.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`
//         : (s ? new Date(s).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "-");
//       const title = m.title || m.name || "Untitled";
//       const venue = m.venue || m.location || "—";
//       const attendees =
//         Array.isArray(m.participants) && m.participants.length > 0
//           ? m.participants.map(p => p.name || p.email || String(p))
//           : (Array.isArray(m.invited) ? m.invited.map(i => i.email || (i.execId ? String(i.execId) : "invite")) : []);
//       const status = m.status ? String(m.status).charAt(0).toUpperCase() + String(m.status).slice(1) : "Pending";
//       return { id: m._id, time, title, venue, attendees, status };
//     });
//   }, [meetings]);

//   const formattedTasks = useMemo(() => {
//     return tasks.map((t) => {
//       const s = t.startTime ? new Date(t.startTime) : null;
//       const time = s ? s.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "-";
//       return {
//         id: t._id || `${t.title}-${time}`,
//         time,
//         task: t.title || t.description || "Untitled Task",
//         priority: t.priority || "Medium",
//       };
//     });
//   }, [tasks]);

//   // date display
//   const today = useMemo(() => new Date(date), [date]);
//   const localeDate = useMemo(
//     () =>
//       new Intl.DateTimeFormat(undefined, {
//         weekday: "long",
//         month: "long",
//         day: "numeric",
//       }).format(today),
//     [today]
//   );

//   // refined base + card tones (subtle, high-contrast, minimal blur)
//   const base = isDark
//     ? "bg-slate-900 text-slate-100"
//     : "bg-gray-50 text-slate-900";
//   const cardTone = isDark
//     ? "bg-slate-800 border border-slate-700 shadow-md"
//     : "bg-white border border-slate-100 shadow-sm";

//   // status badges mapping (more compact)
//   const statusBadge = (status) => {
//     const map = {
//       Confirmed: { variant: "default", icon: CheckCircle2 },
//       Scheduled: { variant: "default", icon: CheckCircle2 },
//       "Awaiting RSVP": { variant: "secondary", icon: AlertCircle },
//       Tentative: { variant: "outline", icon: AlertCircle },
//       Pending: { variant: "outline", icon: AlertCircle },
//       Cancelled: { variant: "outline", icon: AlertCircle },
//     };
//     const cfg = map[status] ?? map["Tentative"];
//     const Icon = cfg.icon;
//     return (
//       <Badge variant={cfg.variant} className="inline-flex items-center text-xs px-2 py-0.5 rounded-sm">
//         <Icon className="h-3 w-3 mr-1" /> <span>{status}</span>
//       </Badge>
//     );
//   };

//   // --- Compact skeleton components (subtle) ---
//   const SkeletonKPIs = () => {
//     return (
//       <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
//         {Array.from({ length: 4 }).map((_, i) => (
//           <div
//             key={i}
//             className="flex items-center space-x-4 rounded-md border p-3 bg-white/60 dark:bg-slate-300 shadow-sm"
//           >
//             <Skeleton className="h-10 w-10 rounded-md" />
//             <div className="flex-1 space-y-2">
//               <Skeleton className="h-4 w-28" />
//               <Skeleton className="h-5 w-20" />
//             </div>
//           </div>
//         ))}
//       </div>
//     );
//   };

//   const SkeletonList = ({ rows = 3 }) => {
//     return (
//       <div className="space-y-3">
//         {Array.from({ length: rows }).map((_, i) => (
//           <div
//             key={i}
//             className="flex items-center space-x-3 rounded-md border p-3 bg-white/60 dark:bg-slate-300 shadow-sm"
//           >
//             <Skeleton className="h-9 w-9 rounded-md" />
//             <div className="flex-1 space-y-2">
//               <Skeleton className="h-4 w-2/3" />
//               <Skeleton className="h-4 w-1/3" />
//             </div>
//           </div>
//         ))}
//       </div>
//     );
//   };

//   return (
//     <div className={`${base} min-h-screen transition-colors`}>
//       {/* Sticky top: simplified — removed search and action buttons. Show only concise data */}
//       <div className="sticky top-0 z-40 bg-transparent">
//         <div className="mx-auto max-w-7xl px-6 py-4">
//           <div className="flex items-center justify-between gap-4">
//             <div>
//               <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
//               <p className="mt-1 flex items-center gap-2 text-sm text-slate-500">
//                 <CalendarDays className="h-4 w-4" /> {localeDate}
//               </p>
//             </div>

//             {/* Data-only summary at the top */}
//             <div className="hidden sm:flex items-center gap-3">
//               <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white/90 dark:bg-slate-200 shadow-sm border">
//                 <div className="text-xs text-slate-500">Meetings</div>
//                 <div className="text-lg font-bold">{meetings.length}</div>
//               </div>

//               <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white/90 dark:bg-slate-200 shadow-sm border">
//                 <div className="text-xs text-slate-500">Tasks</div>
//                 <div className="text-lg font-bold">{tasks.length}</div>
//               </div>

//               <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white/90 dark:bg-slate-200 shadow-sm border">
//                 <div className="text-xs text-slate-500">Leaves</div>
//                 <div className="text-lg font-bold">{leaves.length}</div>
//               </div>

//               <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white/90 dark:bg-slate-200 shadow-sm border">
//                 <div className="text-xs text-slate-500">User</div>
//                 <div className="text-sm font-medium">{user ? (user.name || user.email || 'You') : '—'}</div>
//               </div>
//             </div>
//           </div>
//         </div>
//       </div>

//       <div className="mx-auto max-w-7xl px-6 mt-6 pb-12">
//         {error && (
//           <Card className={`${cardTone} mb-4`}>
//             <CardContent>
//               <div className="text-sm text-destructive">Error: {String(error)}</div>
//             </CardContent>
//           </Card>
//         )}

//         {/* KPIs */}
//         {loading ? (
//           <SkeletonKPIs />
//         ) : (
//           <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
//             {kpis.map(({ label, value, icon: Icon, tone }, i) => (
//               <Card key={i} className={`${cardTone} p-0 rounded-md`}>
//                 <div className="flex items-center justify-between p-4">
//                   <div>
//                     <p className="text-xs uppercase tracking-wide text-slate-500">{label}</p>
//                     <p className="text-xl font-bold mt-1 text-slate-900">{value}</p>
//                   </div>
//                   <div className="ml-4 flex items-center justify-center h-10 w-10 rounded-md bg-gray-50">
//                     <Icon className="h-5 w-5 text-slate-600" />
//                   </div>
//                 </div>
//               </Card>
//             ))}
//           </div>
//         )}

//         {/* Main grid */}
//         <div className="mt-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
//           <Card className={`${cardTone} lg:col-span-2 rounded-md`}>
//             <CardHeader className="pb-2">
//               <div className="flex items-center justify-between">
//                 <CardTitle className="text-lg">Next Up</CardTitle>
//                 {/* removed search button here as requested */}
//               </div>
//             </CardHeader>

//             <CardContent className="pt-0">
//               {loading ? (
//                 <SkeletonList rows={4} />
//               ) : (
//                 <div className="space-y-3">
//                   {(() => {
//                     const items = [];
//                     for (const m of meetings) {
//                       const start = m.startTime ? new Date(m.startTime) : null;
//                       items.push({ type: "MEETING", start, title: m.title || m.name || "Meeting", meta: m.venue || m.location, isVirtual: m.venue === "Zoom" || m.isVirtual, raw: m });
//                     }
//                     for (const t of tasks) {
//                       const start = t.startTime ? new Date(t.startTime) : null;
//                       items.push({ type: "TASK", start, title: t.title || t.description || "Task", meta: t.description || "", raw: t });
//                     }
//                     items.sort((a, b) => {
//                       const as = a.start ? a.start.getTime() : Infinity;
//                       const bs = b.start ? b.start.getTime() : Infinity;
//                       return as - bs;
//                     });
//                     const next = items.slice(0, 6);
//                     if (next.length === 0) return <div className="text-sm text-slate-500">No upcoming items.</div>;
//                     return next.map((n, i) => {
//                       const time = n.start ? n.start.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "—";
//                       return (
//                         <div key={i} className="flex items-start gap-3 rounded-md border p-3">
//                           <div className="shrink-0 mt-0.5">
//                             <Badge variant="secondary" className="text-xs py-0.5 px-2">{time}</Badge>
//                           </div>

//                           <div className="min-w-0 flex-1">
//                             <p className="font-medium truncate text-sm">{n.title}</p>
//                             <div className="mt-1 flex items-center gap-2 text-sm text-slate-600">
//                               {n.type === "MEETING" ? (
//                                 n.isVirtual ? (
//                                   <span className="inline-flex items-center gap-1"><Video className="h-4 w-4" /> {n.meta || "Virtual"}</span>
//                                 ) : (
//                                   <span className="inline-flex items-center gap-1"><MapPin className="h-4 w-4" /> {n.meta || "Location"}</span>
//                                 )
//                               ) : (
//                                 <span className="inline-flex items-center gap-1"><Clock4 className="h-4 w-4" /> {n.meta || "Task"}</span>
//                               )}
//                               <Badge variant="outline" className="text-xs">{n.type}</Badge>
//                             </div>
//                           </div>
//                         </div>
//                       );
//                     });
//                   })()}
//                 </div>
//               )}
//             </CardContent>
//           </Card>

//           <Card className={`${cardTone} rounded-md`}>
//             <CardHeader className="pb-2">
//               <CardTitle className="text-lg">Upcoming Leaves</CardTitle>
//             </CardHeader>
//             <CardContent className="pt-0">
//               {loading ? (
//                 <SkeletonList rows={3} />
//               ) : leaves.length ? (
//                 <div className="space-y-2">
//                   {leaves.map((l, i) => (
//                     <div key={i} className="flex items-center justify-between rounded-md border p-3">
//                       <div className="flex items-center gap-2">
//                         <CalendarDays className="h-4 w-4" />
//                         <span className="font-medium text-sm">{l.date}</span>
//                       </div>
//                       <Badge variant="outline" className="text-xs">{l.label}</Badge>
//                     </div>
//                   ))}
//                 </div>
//               ) : (
//                 <p className="text-sm text-slate-500">No upcoming leaves.</p>
//               )}
//             </CardContent>
//           </Card>
//         </div>

//         {/* Secondary grid */}
//         <div className="mt-6 grid grid-cols-1 lg:grid-cols-2 gap-6">
//           <Card className={`${cardTone} rounded-md`}>
//             <CardHeader className="pb-2">
//               <CardTitle className="text-lg">Today's Meetings</CardTitle>
//             </CardHeader>
//             <CardContent className="pt-0">
//               <div className="divide-y">
//                 {loading ? (
//                   <SkeletonList rows={4} />
//                 ) : formattedMeetings.length === 0 ? (
//                   <div className="py-4 text-sm text-slate-500">No meetings for this day.</div>
//                 ) : (
//                   formattedMeetings.map((m, i) => (
//                     <div key={m.id || i} className="py-3 flex flex-col gap-1">
//                       <div className="flex items-center justify-between gap-3">
//                         <p className="font-medium truncate text-sm">{m.title}</p>
//                         {statusBadge(m.status)}
//                       </div>
//                       <div className="flex flex-wrap items-center gap-3 text-sm text-slate-600">
//                         <span className="inline-flex items-center gap-1"><Clock4 className="h-4 w-4" /> {m.time}</span>
//                         {m.venue === "Zoom" ? (
//                           <span className="inline-flex items-center gap-1"><Video className="h-4 w-4" /> {m.venue}</span>
//                         ) : (
//                           <span className="inline-flex items-center gap-1"><MapPin className="h-4 w-4" /> {m.venue}</span>
//                         )}
//                         <Separator orientation="vertical" className="h-4" />
//                         <span className="truncate text-sm">Attendees: {m.attendees && m.attendees.length ? m.attendees.join(", ") : "—"}</span>
//                       </div>
//                     </div>
//                   ))
//                 )}
//               </div>
//             </CardContent>
//           </Card>

//           <Card className={`${cardTone} rounded-md`}>
//             <CardHeader className="pb-2">
//               <div className="flex items-center justify-between">
//                 <CardTitle className="text-lg">Today's Tasks</CardTitle>
//                 <Button size="sm" variant="ghost" className="gap-2"> <Plus className="h-4 w-4" /> Add Task</Button>
//               </div>
//             </CardHeader>
//             <CardContent className="pt-0">
//               {loading ? (
//                 <SkeletonList rows={4} />
//               ) : formattedTasks.length === 0 ? (
//                 <div className="text-sm text-slate-500">No tasks for today.</div>
//               ) : (
//                 <div className="space-y-3">
//                   {formattedTasks.map((t, i) => (
//                     <div key={t.id || i} className="flex items-start gap-3 rounded-md border p-3">
//                       <Badge variant="secondary" className="text-xs py-0.5 px-2">{t.time}</Badge>
//                       <div className="min-w-0 flex-1">
//                         <p className="font-medium truncate text-sm">{t.task}</p>
//                         <div className="mt-1 text-sm text-slate-600 flex items-center gap-2">
//                           <span>Priority:</span>
//                           <Badge variant={t.priority === "High" ? "destructive" : t.priority === "Medium" ? "default" : "outline"} className="text-xs px-2 py-0.5 rounded-sm">
//                             {t.priority}
//                           </Badge>
//                         </div>
//                       </div>
//                     </div>
//                   ))}
//                 </div>
//               )}
//             </CardContent>
//           </Card>
//         </div>
//       </div>
//     </div>
//   );
// }
// src/components/Dashboard.jsx

import React, { useContext, useEffect, useMemo, useState } from "react";
import { ThemeContext } from "@/context/ThemeContext";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardContent, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import {
  CalendarDays,
  Clock4,
  Plus,
  Search,
  MapPin,
  Video,
  CheckCircle2,
  AlertCircle,
  Mail,
  UserPlus,
} from "lucide-react";

export default function Dashboard() {
  const { isDark } = useContext(ThemeContext);

  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [meetings, setMeetings] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [leaves, setLeaves] = useState([]);
  const [user, setUser] = useState(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const getAuthHeaders = () => {
    const token =
      typeof window !== "undefined" ? localStorage.getItem("token") : null;
    return token ? { Authorization: `Bearer ${token}` } : {};
  };

  async function safeFetchJson(url, opts = {}) {
    const headers = {
      "Content-Type": "application/json",
      ...getAuthHeaders(),
      ...(opts.headers || {}),
    };
    const res = await fetch(url, { ...opts, headers });
    const contentType = res.headers.get("content-type") || "";

    if (!res.ok) {
      const text = await res.text().catch(() => "<unable to read>");
      throw new Error(`HTTP ${res.status} — ${text}`);
    }

    if (contentType.includes("application/json")) return res.json();
    throw new Error("Invalid response from server");
  }

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    setError(null);

    const token =
      typeof window !== "undefined" ? localStorage.getItem("token") : null;
    if (!token) {
      setError("No auth token found — please sign in.");
      setLoading(false);
      return;
    }

    Promise.all([
      safeFetchJson(
        `https://tms-project-8.onrender.com/api/meetings/my-day?date=${encodeURIComponent(
          date
        )}`
      ),
      safeFetchJson("https://tms-project-8.onrender.com/api/executive/info"),
      safeFetchJson("https://tms-project-8.onrender.com/api/executive/me/tasks"),
    ])
      .then(([meetRes, infoRes, tasksRes]) => {
        if (!mounted) return;

        setMeetings(
          Array.isArray(meetRes.meetings)
            ? meetRes.meetings
            : meetRes.meetings
            ? [meetRes.meetings]
            : []
        );

        const loadedUser = infoRes.user || null;
        setUser(loadedUser);

        setTasks(tasksRes.tasks || []);

        const leavePeriods =
          loadedUser && Array.isArray(loadedUser.leavePeriods)
            ? loadedUser.leavePeriods
            : [];
        setLeaves(
          leavePeriods.map((lp) => {
            const s = new Date(lp.start).toLocaleDateString(undefined, {
              month: "short",
              day: "numeric",
            });
            const e = new Date(lp.end).toLocaleDateString(undefined, {
              month: "short",
              day: "numeric",
            });
            return { date: s === e ? s : `${s} — ${e}`, label: lp.reason };
          })
        );

        setLoading(false);
      })
      .catch((e) => {
        if (!mounted) return;
        setError(e.message);
        setLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, [date]);

  const kpis = useMemo(() => {
    const meetingsToday = meetings.length;
    let focusMs = 0;
    for (const t of tasks) {
      const s = t.startTime ? new Date(t.startTime).getTime() : null;
      const e = t.endTime ? new Date(t.endTime).getTime() : null;
      if (s && e && e > s) focusMs += e - s;
    }
    const focusHours = Math.round((focusMs / 3600000) * 10) / 10;

    return [
      { label: "Meetings Today", value: meetingsToday, icon: CalendarDays },
      { label: "Focus (hrs)", value: focusHours, icon: Clock4 },
      { label: "Tasks", value: tasks.length, icon: Search },
      { label: "Upcoming Leaves", value: leaves.length, icon: Mail },
    ];
  }, [meetings, tasks, leaves]);

  const formattedMeetings = useMemo(() => {
    return meetings.map((m) => ({
      id: m._id,
      title: m.title || m.name || "Untitled",
      venue: m.venue || m.location || "—",
      attendees:
        m.participants?.map((p) => p.name || p.email) ||
        m.invited?.map((i) => i.email) ||
        [],
      status:
        m.status &&
        m.status.charAt(0).toUpperCase() + m.status.slice(1).toLowerCase(),
      time: m.startTime
        ? `${new Date(m.startTime).toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          })}`
        : "-",
    }));
  }, [meetings]);

  const formattedTasks = useMemo(() => {
    return tasks.map((t) => ({
      id: t._id,
      time: t.startTime
        ? new Date(t.startTime).toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          })
        : "-",
      task: t.title || t.description || "Task",
      priority: t.priority || "Medium",
    }));
  }, [tasks]);

  const base = isDark
    ? "bg-slate-900 text-slate-100"
    : "bg-gray-50 text-slate-900";

  const cardTone = isDark
    ? "bg-slate-800 border border-slate-700 shadow-md"
    : "bg-white border border-slate-200 shadow-sm";

  const statusBadge = (s) => {
    const map = {
      Confirmed: CheckCircle2,
      Scheduled: CheckCircle2,
      Pending: AlertCircle,
      Cancelled: AlertCircle,
    };
    const Icon = map[s] || AlertCircle;

    return (
      <Badge className="inline-flex items-center text-xs px-2 py-0.5 gap-1">
        <Icon className="h-3 w-3" /> {s}
      </Badge>
    );
  };

  const SkeletonKPIs = () => (
    <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="flex items-center space-x-3 border p-3 rounded-md">
          <Skeleton className="h-10 w-10 rounded-md" />
          <div className="space-y-2 flex-1">
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-5 w-10" />
          </div>
        </div>
      ))}
    </div>
  );

  const SkeletonList = ({ rows }) => (
    <div className="space-y-3">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex items-center space-x-3 border rounded-md p-3">
          <Skeleton className="h-9 w-9 rounded-md" />
          <div className="space-y-2 flex-1">
            <Skeleton className="h-4 w-2/3" />
            <Skeleton className="h-4 w-1/3" />
          </div>
        </div>
      ))}
    </div>
  );

  return (
    <div className={`${base} min-h-screen`}>
      {/* HEADER */}
      <div className="sticky top-0 z-40 px-4 py-4 sm:px-6 bg-transparent">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold">Dashboard</h1>
            <p className="text-sm text-slate-500 flex items-center gap-2">
              <CalendarDays className="h-4 w-4" />{" "}
              {new Intl.DateTimeFormat(undefined, {
                weekday: "long",
                month: "long",
                day: "numeric",
              }).format(new Date(date))}
            </p>
          </div>

          {/* MOBILE SUMMARY */}
          <div className="grid grid-cols-3 sm:flex gap-2">
            <div className="px-3 py-2 rounded-md bg-white dark:bg-slate-700 shadow border text-center">
              <p className="text-xs">Meetings</p>
              <p className="text-base font-bold">{meetings.length}</p>
            </div>
            <div className="px-3 py-2 rounded-md bg-white dark:bg-slate-700 shadow border text-center">
              <p className="text-xs">Tasks</p>
              <p className="text-base font-bold">{tasks.length}</p>
            </div>
            <div className="px-3 py-2 rounded-md bg-white dark:bg-slate-700 shadow border text-center">
              <p className="text-xs">Leaves</p>
              <p className="text-base font-bold">{leaves.length}</p>
            </div>
          </div>
        </div>
      </div>

      {/* BODY */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 mt-6 pb-20">
        {error && (
          <Card className={`${cardTone} mb-4`}>
            <CardContent>
              <p className="text-sm text-red-500">{error}</p>
            </CardContent>
          </Card>
        )}

        {/* KPIs */}
        {loading ? <SkeletonKPIs /> : (
          <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-4">
            {kpis.map((k, i) => (
              <Card key={i} className={`${cardTone} p-4`}>
                <div className="flex justify-between items-center">
                  <div>
                    <p className="text-xs text-slate-500">{k.label}</p>
                    <p className="text-xl font-bold">{k.value}</p>
                  </div>
                  <k.icon className="h-6 w-6 text-slate-600" />
                </div>
              </Card>
            ))}
          </div>
        )}

        {/* MAIN GRID */}
        <div className="mt-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* NEXT UP */}
          <Card className={`${cardTone} lg:col-span-2`}>
            <CardHeader>
              <CardTitle>Next Up</CardTitle>
            </CardHeader>

            <CardContent>
              {loading ? (
                <SkeletonList rows={4} />
              ) : (
                <div className="space-y-3">
                  {(() => {
                    const items = [];

                    for (const m of meetings)
                      items.push({
                        type: "MEETING",
                        title: m.title || m.name,
                        start: m.startTime ? new Date(m.startTime) : null,
                        meta: m.venue || m.location,
                        isVirtual:
                          m.venue === "Zoom" || m.isVirtual || m.location === "Zoom",
                      });

                    for (const t of tasks)
                      items.push({
                        type: "TASK",
                        title: t.title,
                        start: t.startTime ? new Date(t.startTime) : null,
                        meta: t.description,
                      });

                    items.sort((a, b) =>
                      !a.start || !b.start
                        ? 1
                        : a.start.getTime() - b.start.getTime()
                    );

                    return items.slice(0, 6).map((item, i) => (
                      <div
                        key={i}
                        className="border rounded-md p-3 flex gap-3"
                      >
                        <Badge variant="secondary" className="text-xs px-2 py-0.5">
                          {item.start
                            ? item.start.toLocaleTimeString([], {
                                hour: "2-digit",
                                minute: "2-digit",
                              })
                            : "—"}
                        </Badge>

                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm truncate max-w-full break-words">
                            {item.title}
                          </p>

                          <div className="flex items-center gap-2 text-sm text-slate-600 mt-1">
                            {item.type === "MEETING" ? (
                              item.isVirtual ? (
                                <span className="inline-flex items-center gap-1">
                                  <Video className="h-4 w-4" /> {item.meta}
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1">
                                  <MapPin className="h-4 w-4" /> {item.meta}
                                </span>
                              )
                            ) : (
                              <span className="inline-flex items-center gap-1">
                                <Clock4 className="h-4 w-4" /> {item.meta}
                              </span>
                            )}

                            <Badge variant="outline" className="text-xs">
                              {item.type}
                            </Badge>
                          </div>
                        </div>
                      </div>
                    ));
                  })()}
                </div>
              )}
            </CardContent>
          </Card>

          {/* LEAVES */}
          <Card className={`${cardTone}`}>
            <CardHeader>
              <CardTitle>Upcoming Leaves</CardTitle>
            </CardHeader>

            <CardContent>
              {loading ? (
                <SkeletonList rows={3} />
              ) : leaves.length ? (
                <div className="space-y-3">
                  {leaves.map((l, i) => (
                    <div
                      key={i}
                      className="flex items-center justify-between border rounded-md p-3"
                    >
                      <div className="flex items-center gap-2">
                        <CalendarDays className="h-4 w-4" />
                        <p className="text-sm font-medium">{l.date}</p>
                      </div>
                      <Badge variant="outline">{l.label}</Badge>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-slate-500">No upcoming leaves.</p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* SECONDARY GRID */}
        <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* TODAY'S MEETINGS */}
          <Card className={`${cardTone}`}>
            <CardHeader>
              <CardTitle>Today's Meetings</CardTitle>
            </CardHeader>

            <CardContent>
              {loading ? (
                <SkeletonList rows={4} />
              ) : formattedMeetings.length === 0 ? (
                <p className="text-sm text-slate-500">No meetings.</p>
              ) : (
                <div className="divide-y">
                  {formattedMeetings.map((m, i) => (
                    <div key={i} className="py-3">
                      <div className="flex justify-between items-center mb-1">
                        <p className="text-sm font-medium truncate max-w-full">{m.title}</p>
                        {statusBadge(m.status)}
                      </div>

                      <div className="flex flex-wrap items-center gap-3 text-sm text-slate-600">
                        <span className="inline-flex items-center gap-1">
                          <Clock4 className="h-4 w-4" /> {m.time}
                        </span>

                        {m.venue === "Zoom" ? (
                          <span className="inline-flex items-center gap-1">
                            <Video className="h-4 w-4" /> Zoom
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1">
                            <MapPin className="h-4 w-4" /> {m.venue}
                          </span>
                        )}

                        <Separator orientation="vertical" className="h-4" />

                        <span className="truncate">
                          Attendees: {m.attendees.join(", ") || "—"}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* TASKS */}
          <Card className={`${cardTone}`}>
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle>Today's Tasks</CardTitle>
                <Button size="sm" variant="ghost">
                  <Plus className="h-4 w-4" /> Add Task
                </Button>
              </div>
            </CardHeader>

            <CardContent>
              {loading ? (
                <SkeletonList rows={4} />
              ) : formattedTasks.length === 0 ? (
                <p className="text-sm text-slate-500">No tasks for today.</p>
              ) : (
                <div className="space-y-3">
                  {formattedTasks.map((t, i) => (
                    <div
                      key={i}
                      className="border rounded-md p-3 flex gap-3"
                    >
                      <Badge variant="secondary" className="text-xs px-2 py-0.5">
                        {t.time}
                      </Badge>

                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate max-w-full">
                          {t.task}
                        </p>

                        <div className="mt-1 text-sm text-slate-600 flex items-center gap-2">
                          Priority:
                          <Badge
                            variant={
                              t.priority === "High"
                                ? "destructive"
                                : t.priority === "Medium"
                                ? "default"
                                : "outline"
                            }
                            className="text-xs px-2 py-0.5"
                          >
                            {t.priority}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
