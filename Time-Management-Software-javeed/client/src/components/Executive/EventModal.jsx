
import React, { useEffect, useRef, useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Badge } from "../ui/badge";
import { toast } from "react-hot-toast";
import { Clock } from "lucide-react";


/**
 * TimePickerPopover
 * - small self-contained time picker used by the modal
 */
function TimePickerPopover({ open, anchorRef, initial = "09:00", onClose, onUse, isDark }) {
  const parseInitial = (init) => {
    if (!init && init !== 0) return { hour: 9, minute: 0 };

    if (typeof init === "object" && !(init instanceof Date)) {
      const candidate = init.start ?? init.startTime ?? init.time ?? init.datetime ?? init.dateTime ?? null;
      if (candidate) return parseInitial(candidate);
      return { hour: 9, minute: 0 };
    }

    if (init instanceof Date && !isNaN(init.getTime())) {
      return { hour: init.getHours(), minute: init.getMinutes() };
    }

    if (typeof init === "string") {
      const s = init.trim();
      const maybeDate = Date.parse(s);
      if (!Number.isNaN(maybeDate) && /T/.test(s)) {
        const d = new Date(maybeDate);
        return { hour: d.getHours(), minute: d.getMinutes() };
      }
      const timeMatch = s.match(/(\d{1,2}):(\d{2})(?::\d{2})?$/);
      if (timeMatch) {
        const hh = Number(timeMatch[1]);
        const mm = Number(timeMatch[2]);
        if (!Number.isNaN(hh) && !Number.isNaN(mm)) {
          return { hour: Math.max(0, Math.min(23, hh)), minute: Math.max(0, Math.min(59, mm)) };
        }
      }
    }

    return { hour: 9, minute: 0 };
  };

  const initialParsed = parseInitial(initial);
  const [hour, setHour] = useState(Number(initialParsed.hour || 9));
  const [minute, setMinute] = useState(Number(initialParsed.minute || 0));
  const popRef = useRef(null);

  useEffect(() => {
    const p = parseInitial(initial);
    setHour(Number(p.hour || 9));
    setMinute(Number(p.minute || 0));
  }, [initial, open]);

  useEffect(() => {
    function onDoc(e) {
      if (!open) return;
      const insidePop = popRef.current && popRef.current.contains(e.target);
      const insideAnchor = anchorRef && anchorRef.current && anchorRef.current.contains(e.target);
      if (!insidePop && !insideAnchor) {
        onClose && onClose();
      }
    }
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [open, onClose, anchorRef]);

  if (!open) return null;

  const apply = () => {
    const hh = String(hour).padStart(2, "0");
    const mm = String(minute).padStart(2, "0");
    onUse && onUse(`${hh}:${mm}`);
  };

  const toggleMinuteStep = (step) =>
    setMinute((m) => {
      const n = Math.min(59, Math.max(0, (Number(m) || 0) + step));
      return n;
    });

  return (
    <div
      ref={popRef}
      role="dialog"
      aria-label="Select time"
      className="absolute right-0 top-10 z-[9999] w-[320px] rounded-2xl p-3 shadow-2xl"
      style={{ background: isDark ? "#0b1220" : "#ffffff", color: isDark ? "#e6eef8" : "#0f1724" }}
    >
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-3">
          <Clock className="w-5 h-5" />
          <div className="text-sm font-medium">Choose time</div>
        </div>
        <button onClick={onClose} className="text-xs text-gray-400 hover:text-gray-600">
          Close
        </button>
      </div>

      <div className="grid grid-cols-6 gap-2 mt-2">
        {Array.from({ length: 24 }).map((_, i) => (
          <button
            key={`h-${i}`}
            onClick={() => setHour(i)}
            className={`py-1 rounded-md text-xs focus:outline-none focus:ring-2 focus:ring-offset-1 ${hour === i ? "ring-2 ring-offset-1 font-semibold" : "hover:bg-gray-100"}`}
            style={{
              background: hour === i ? (isDark ? "#0ea5e9" : "#e6f0ff") : "transparent",
              color: hour === i ? (isDark ? "#00243b" : "#0b1220") : undefined,
            }}
            aria-pressed={hour === i}
            aria-label={`Hour ${String(i).padStart(2, "0")}`}
          >
            {String(i).padStart(2, "0")}
          </button>
        ))}
      </div>

      <div className="mt-3 border-t pt-3">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <div className="text-xs">Minutes</div>
            <div className="text-sm font-medium">{String(minute).padStart(2, "0")}</div>
          </div>

          <div className="flex items-center gap-1">
            <button onClick={() => setMinute(0)} className="text-xs px-2 py-1 rounded-md border">
              00
            </button>
            <button onClick={() => setMinute(15)} className="text-xs px-2 py-1 rounded-md border">
              15
            </button>
            <button onClick={() => setMinute(30)} className="text-xs px-2 py-1 rounded-md border">
              30
            </button>
            <button onClick={() => setMinute(45)} className="text-xs px-2 py-1 rounded-md border">
              45
            </button>
          </div>
        </div>

        <div className="flex items-center gap-2 mt-2">
          <button onClick={() => toggleMinuteStep(-5)} className="px-2 py-1 rounded-md border text-xs">
            -5
          </button>
          <input
            type="number"
            value={minute}
            min={0}
            max={59}
            onChange={(e) => setMinute(Math.min(59, Math.max(0, Number(e.target.value || 0))))}
            className="w-20 px-2 py-1 rounded-md text-sm text-center border"
            aria-label="Custom minutes"
          />
          <button onClick={() => toggleMinuteStep(5)} className="px-2 py-1 rounded-md border text-xs">
            +5
          </button>

          <div className="ml-auto text-xs text-gray-500">Step: 5 min</div>
        </div>
      </div>

      <div className="mt-3 flex justify-end gap-2">
        <button onClick={onClose} className="px-3 py-1 rounded-md text-sm">
          Cancel
        </button>
        <button onClick={apply} className="px-3 py-1 rounded-md bg-blue-600 text-white text-sm">
          Use {String(hour).padStart(2, "0")}:{String(minute).padStart(2, "0")}
        </button>
      </div>
    </div>
  );
}

/* -------------------------------------------------
   EventModal (shadcn UI imports)
   - Guests are added one at a time via "Add & Check"
   - Save only uses checked/added emails
   ------------------------------------------------- */
export default function EventModal({ open, onClose, initialValues = {}, onSave, isDark = false }) {
  const [form, setForm] = useState({
    title: "",
    date: "",
    start: "09:00",
    end: "10:00",
    venue: "",
    notes: "",
    ...initialValues,
  });

  const [singleGuest, setSingleGuest] = useState("");
  // addedGuests: { email: string, status: 'free' }
  const [addedGuests, setAddedGuests] = useState([]);

  const [showStartClock, setShowStartClock] = useState(false);
  const [showEndClock, setShowEndClock] = useState(false);
  const [loading, setLoading] = useState(false);
  const [checkingEmail, setCheckingEmail] = useState(false);

  const [pendingConflictGuest, setPendingConflictGuest] = useState(null);
  const [loggingConflict, setLoggingConflict] = useState(false);

  const startAnchor = useRef(null);
  const endAnchor = useRef(null);

  useEffect(() => {
    setForm((f) => ({ ...f, ...initialValues }));
    setAddedGuests([]);
    setSingleGuest("");
    setPendingConflictGuest(null);
  }, [initialValues, open]);

  if (!open) return null;

  // optional helper: a wrapper to call your create-and-addtasks API
  async function createAndAddTasks(payload) {
    const API = "https://time-management-software.onrender.com/api/meetings/create-and-addtasks";
    const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
    try {
      const res = await fetch(API, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(payload),
      });

      const text = await res.text();
      let data;
      try {
        data = text ? JSON.parse(text) : null;
      } catch {
        data = { raw: text };
      }

      if (!res.ok) {
        const msg = (data && (data.msg || data.error)) || `Server error ${res.status}`;
        throw new Error(msg);
      }

      return data;
    } catch (err) {
      throw err;
    }
  }

  // simple email validator
  const isValidEmail = (email) => {
    const e = (email || "").trim().toLowerCase();
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e);
  };

  // Build ISO timestamps from form.date + time strings
  const buildISO = (dateStr, timeStr) => {
    if (!dateStr) {
      const today = new Date();
      const [hh, mm] = timeStr.split(":").map(Number);
      today.setHours(hh, mm, 0, 0);
      return today.toISOString();
    }
    return new Date(`${dateStr}T${timeStr}:00`).toISOString();
  };

  // call backend to check availability of one email for selected timeslot
  async function checkAvailability(email) {
    const API = "https://time-management-software.onrender.com/api/executive/check-availability";
    const payload = {
      email,
      startTime: buildISO(form.date, form.start),
      endTime: buildISO(form.date, form.end),
    };

    try {
      setCheckingEmail(true);
      const token = localStorage.getItem("token");
      const res = await fetch(API, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) throw new Error("server error");

      return data; // { free: true } or { free: false, conflicts: [...] }
    } catch (err) {
      console.error("Availability check error:", err);
      throw err;
    } finally {
      setCheckingEmail(false);
    }
  }

  const logConflictTicket = async (guest) => {
    const API = "https://time-management-software.onrender.com/api/meetings/conflicts/manual";
    const participantEmails = Array.from(
      new Set([
        ...addedGuests.map((g) => g.email),
        guest?.email || null,
      ].filter(Boolean))
    );

    const payload = {
      title: form.title || initialValues.title || "Untitled",
      startTime: buildISO(form.date, form.start),
      endTime: buildISO(form.date, form.end),
      venue: form.venue || "",
      project: form.project || initialValues.project || "",
      notes: form.notes || "",
      participantEmails,
      overlaps: [
        {
          executiveEmail: guest?.email || null,
          conflicts: Array.isArray(guest?.conflicts) ? guest.conflicts : [],
        },
      ],
    };

    const token = localStorage.getItem("token");
    const res = await fetch(API, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify(payload),
    });

    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      const message = data?.msg || data?.error || "Failed to log conflict for secretary";
      throw new Error(message);
    }

    return data;
  };

  const handleAddAndCheck = async () => {
    const email = (singleGuest || "").trim().toLowerCase();
    if (!email) {
      toast.error("Enter an email to check.");
      return;
    }
    if (!isValidEmail(email)) {
      toast.error("Please enter a valid email address.");
      return;
    }
    if (addedGuests.some((g) => g.email === email)) {
      toast.error("This email has already been added.");
      return;
    }

    try {
      const data = await checkAvailability(email);

      // interpret server response (tweak to match your backend)
      const free = data && (data.free === true || data.available === true || (Array.isArray(data.conflicts) && data.conflicts.length === 0));
      const busy = data && (data.free === false || data.available === false || (Array.isArray(data.conflicts) && data.conflicts.length > 0));

      if (free) {
        setAddedGuests((s) => [...s, { email, status: "free" }]);
        setSingleGuest("");
        toast.success(`${email} is free for the selected time slot.`);
      } else if (busy) {
        const conflicts = Array.isArray(data.conflicts) ? data.conflicts : [];
        setPendingConflictGuest({ email, conflicts });
      } else {
        toast.error(`Could not determine availability for ${email}.`);
      }
    } catch (err) {
      console.error("Availability check error:", err);
      toast.error(err.message || "Failed to check availability. Try again.");
    }
  };

  const handleRemoveGuest = (email) => {
    setAddedGuests((s) => s.filter((g) => g.email !== email));
  };

  const handleConflictDecision = async (decision) => {
    if (!pendingConflictGuest) return;

    if (decision === "secretary") {
      setLoggingConflict(true);
      try {
        await logConflictTicket(pendingConflictGuest);
        setAddedGuests((prev) => {
          if (prev.some((guest) => guest.email === pendingConflictGuest.email)) {
            return prev;
          }
          return [
            ...prev,
            {
              email: pendingConflictGuest.email,
              status: "needs-secretary",
              conflicts: pendingConflictGuest.conflicts,
            },
          ];
        });
        setSingleGuest("");
        toast.success(`Secretary will coordinate ${pendingConflictGuest.email}'s schedule.`);
        setPendingConflictGuest(null);
      } catch (err) {
        console.error("Manual conflict escalation error:", err);
        toast.error(err.message || "Failed to notify the secretary. Please try again.");
      } finally {
        setLoggingConflict(false);
      }
      return;
    }

    toast("You can pick another slot for the meeting.");
    setPendingConflictGuest(null);
  };

  const formatConflict = (conflict) => {
    if (!conflict) return "Busy";
    if (typeof conflict === "string") return conflict;
    const base = conflict.title || conflict.type || conflict.notes || "Busy";
    if (conflict.startTime) {
      try {
        return `${base} (${new Date(conflict.startTime).toLocaleString()})`;
      } catch (err) {
        return base;
      }
    }
    return base;
  };

  const handleSave = async () => {
    const [sh, sm] = form.start.split(":").map(Number);
    const [eh, em] = form.end.split(":").map(Number);
    const startMinutes = sh * 60 + sm;
    const endMinutes = eh * 60 + em;
    const corrected = { ...form };

    if (endMinutes <= startMinutes) {
      const newEnd = startMinutes + 30;
      const eh2 = Math.floor(newEnd / 60) % 24;
      const em2 = newEnd % 60;
      corrected.end = `${String(eh2).padStart(2, "0")}:${String(em2).padStart(2, "0")}`;
      setForm((f) => ({ ...f, end: corrected.end }));
    }

    const emails = addedGuests.map((g) => g.email);

    if (emails.length === 0) {
      toast.error("Please add and check at least one participant using the Add & Check button.");
      return;
    }

    const secretaryGuests = addedGuests.filter((g) => g.status === "needs-secretary");
    const conflictSummaries = secretaryGuests.flatMap((guest) => {
      if (!Array.isArray(guest.conflicts)) return [];
      return guest.conflicts.slice(0, 3).map((item) => formatConflict(item));
    });

    const payload = {
      title: corrected.title || "Untitled",
      startTime: corrected.date ? new Date(`${corrected.date}T${corrected.start}`).toISOString() : new Date().toISOString(),
      endTime: corrected.date ? new Date(`${corrected.date}T${corrected.end}`).toISOString() : new Date(Date.now() + 30 * 60000).toISOString(),
      venue: corrected.venue || "",
      project: "",
      participantEmails: emails,
      createdBy: typeof window !== "undefined" ? localStorage.getItem("userId") || null : null,
      secretaryConsent: secretaryGuests.length > 0,
      consentedParticipants: secretaryGuests.map((guest) => guest.email),
      conflictSummaries,
    };

    setLoading(true);
    try {
  const data = await createAndAddTasks(payload);

  const conflictDetected = Boolean(data?.conflict);
  const meeting = (data && (data.meeting || data)) || null;

      if (!meeting) {
        onSave &&
          onSave({
            title: corrected.title,
            date: corrected.date || new Date().toISOString().slice(0, 10),
            start: corrected.start,
            end: corrected.end,
            venue: corrected.venue,
            guests: emails.join(", "),
            notes: corrected.notes,
            calendar: "Default",
            color: "bg-indigo-600",
            type: "meeting",
          });
        toast.success("Created locally (server returned no meeting object)");
        onClose && onClose();
        return;
      }

      const mappedEvent = {
        id: meeting._id || meeting.meeting?._id || Date.now(),
        title: meeting.title || corrected.title,
        date: meeting.startTime ? new Date(meeting.startTime).toISOString().slice(0, 10) : corrected.date || new Date().toISOString().slice(0, 10),
        start: meeting.startTime ? new Date(meeting.startTime).toTimeString().slice(0, 5) : corrected.start,
        end: meeting.endTime ? new Date(meeting.endTime).toTimeString().slice(0, 5) : corrected.end,
        venue: meeting.venue || corrected.venue,
        attendees: (Array.isArray(meeting.participants) ? meeting.participants.map((p) => p.email || p) : (meeting.invited || []).map((i) => i.email)).join(", "),
        color:
          meeting.status === "conflict"
            ? "bg-red-500"
            : meeting.status === "pending"
            ? "bg-amber-500"
            : "bg-indigo-600",
        type: "meeting",
        raw: meeting,
      };

      onSave && onSave(mappedEvent);

      const notFound = data.notFoundEmails && data.notFoundEmails.length ? data.notFoundEmails : [];
      if (conflictDetected) {
        if (secretaryGuests.length > 0) {
          toast.success("Secretary has been notified to resolve the scheduling conflict.");
        } else {
          toast.error("Meeting still conflicts with executive calendars. Try a different time or involve the secretary.");
        }
      } else if (notFound.length) {
        toast.success(`Meeting created. ${notFound.length} email(s) not found: ${notFound.join(", ")}`);
      } else {
        toast.success("Meeting created and tasks added to executives ✅");
      }

      onClose && onClose();
    } catch (err) {
      console.error("create-and-addtasks error:", err);
      toast.error(err.message || "Failed to create meeting on server");

      onSave &&
        onSave({
          title: corrected.title,
          date: corrected.date || new Date().toISOString().slice(0, 10),
          start: corrected.start,
          end: corrected.end,
          venue: corrected.venue,
          guests: addedGuests.map((g) => g.email).join(", "),
          notes: corrected.notes,
          calendar: "Default",
          color: "bg-rose-500",
          type: "meeting",
        });
      onClose && onClose();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[20000] flex items-center justify-center p-4">
      <div className=" inset-0 bg-black/40" onClick={onClose} />
      <div
        onClick={(e) => e.stopPropagation()}
        className={`relative w-full max-w-lg rounded-2xl p-6 shadow-2xl ${isDark ? "bg-gray-900 text-gray-100" : "bg-white text-gray-900"} max-h-[80vh] overflow-auto`}
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Create Event</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">✕</button>
        </div>

        <div className={`space-y-3 ${pendingConflictGuest ? "pointer-events-none opacity-40" : "opacity-100"}`}>
          <div>
            <Label>Title</Label>
            <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Event title" />
          </div>

          <div>
            <Label>Date</Label>
            <Input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} />
          </div>

          <div className="grid grid-cols-2 gap-2 relative">
            <div className="relative">
              <Label>Start</Label>
              <div className="flex items-center gap-2" ref={startAnchor}>
                <Input type="text" readOnly value={form.start} className="flex-1 cursor-pointer" onClick={() => { setShowStartClock((s) => !s); setShowEndClock(false); }} />
                <Clock className="w-4 h-4 cursor-pointer" onClick={() => { setShowStartClock((s) => !s); setShowEndClock(false); }} />
              </div>

              {showStartClock && (
                <TimePickerPopover
                  open={showStartClock}
                  anchorRef={startAnchor}
                  onClose={() => setShowStartClock(false)}
                  onUse={(val) => {
                    setForm({ ...form, start: val });
                    setShowStartClock(false);
                    const [sh, sm] = val.split(":").map(Number);
                    const [eh, em] = form.end.split(":").map(Number);
                    if (eh * 60 + em <= sh * 60 + sm) {
                      const newEnd = sh * 60 + sm + 30;
                      const eh2 = Math.floor(newEnd / 60) % 24;
                      const em2 = newEnd % 60;
                      setForm((f) => ({ ...f, end: `${String(eh2).padStart(2, "0")}:${String(em2).padStart(2, "0")}` }));
                    }
                  }}
                  isDark={isDark}
                  initial={form.start}
                />
              )}
            </div>

            <div className="relative">
              <Label>End</Label>
              <div className="flex items-center gap-2" ref={endAnchor}>
                <Input type="text" readOnly value={form.end} className="flex-1 cursor-pointer" onClick={() => { setShowEndClock((s) => !s); setShowStartClock(false); }} />
                <Clock className="w-4 h-4 cursor-pointer" onClick={() => { setShowEndClock((s) => !s); setShowStartClock(false); }} />
              </div>

              {showEndClock && (
                <TimePickerPopover
                  open={showEndClock}
                  anchorRef={endAnchor}
                  onClose={() => setShowEndClock(false)}
                  onUse={(val) => {
                    setForm({ ...form, end: val });
                    setShowEndClock(false);
                  }}
                  isDark={isDark}
                  initial={form.end}
                />
              )}
            </div>
          </div>

          <div>
            <Label>Guests (add one at a time)</Label>
            <div className="flex gap-2">
              <Input value={singleGuest} onChange={(e) => setSingleGuest(e.target.value)} placeholder="alice@example.com" />
              <Button onClick={handleAddAndCheck} disabled={checkingEmail}>
                {checkingEmail ? "Checking..." : "Add & Check"}
              </Button>
            </div>
            <p className="text-xs text-muted-foreground mt-1">Click "Add & Check" to verify availability before saving.</p>

            {addedGuests.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-2">
                {addedGuests.map((g) => (
                  <div key={g.email} className="flex flex-col gap-2 rounded-md border p-2">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-3">
                        <div className="text-sm font-medium">{g.email}</div>
                        {g.status === "needs-secretary" ? (
                          <Badge variant="secondary" className="bg-amber-100 text-amber-700">
                            Secretary coordinating
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="text-emerald-600">
                            Available
                          </Badge>
                        )}
                      </div>
                      <Button variant="ghost" size="sm" onClick={() => handleRemoveGuest(g.email)}>
                        Remove
                      </Button>
                    </div>
                    {g.status === "needs-secretary" && Array.isArray(g.conflicts) && g.conflicts.length > 0 && (
                      <ul className="list-disc pl-5 text-xs text-muted-foreground">
                        {g.conflicts.slice(0, 3).map((conflict, index) => (
                          <li key={index}>{formatConflict(conflict)}</li>
                        ))}
                      </ul>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          <div>
            <Label>Venue</Label>
            <Input value={form.venue} onChange={(e) => setForm({ ...form, venue: e.target.value })} placeholder="Meeting room / link" />
          </div>

          <div>
            <Label>Notes</Label>
            <Textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} placeholder="Optional notes..." className="min-h-[80px]" />
          </div>
        </div>

        <div className={`mt-5 flex justify-end gap-3 ${pendingConflictGuest ? "pointer-events-none" : ""}`}>
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSave} disabled={loading || addedGuests.length === 0}>{loading ? "Saving..." : "Save"}</Button>
        </div>
        {pendingConflictGuest && (
          <div className=" inset-0 z-30 flex items-center justify-center px-4">
            <div className=" inset-0 rounded-2xl bg-black/70 backdrop-blur-sm" />
            <div className={`relative w-full max-w-md rounded-xl border p-6 shadow-xl ${isDark ? "bg-slate-900 border-slate-700 text-gray-100" : "bg-white border-slate-200 text-gray-900"}`}>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3 className="text-lg font-semibold">Executive is busy</h3>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {pendingConflictGuest?.email} already has commitments during this time. Would you like the secretary to coordinate a resolution, or try a different slot?
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setPendingConflictGuest(null)}
                  className="rounded-md p-1 text-sm text-muted-foreground hover:bg-muted"
                  aria-label="Dismiss conflict information"
                >
                  ✕
                </button>
              </div>

              {Array.isArray(pendingConflictGuest?.conflicts) && pendingConflictGuest.conflicts.length > 0 && (
                <div className={`mt-4 rounded-md border p-3 text-sm ${isDark ? "border-slate-700 bg-slate-900/60" : "border-slate-200 bg-slate-50"}`}>
                  <div className="font-medium text-foreground">Current conflicts</div>
                  <ul className="mt-2 list-disc space-y-1 pl-5 text-muted-foreground">
                    {pendingConflictGuest.conflicts.slice(0, 3).map((conflict, index) => (
                      <li key={index}>{formatConflict(conflict)}</li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:justify-end">
                <Button
                  variant="ghost"
                  onClick={() => handleConflictDecision("reschedule")}
                  disabled={loggingConflict}
                >
                  I&apos;ll pick another time
                </Button>
                <Button
                  onClick={() => handleConflictDecision("secretary")}
                  disabled={loggingConflict}
                >
                  {loggingConflict ? "Notifying secretary…" : "Ask secretary to coordinate"}
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
