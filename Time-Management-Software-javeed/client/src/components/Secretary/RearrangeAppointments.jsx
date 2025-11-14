"use client";
import React, { useCallback, useContext, useEffect, useMemo, useState } from "react";
import { ThemeContext } from "@/context/ThemeContext";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";

const API_BASE = "https://time-management-software.onrender.com";

function toDateTimeLocal(value) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const pad = (num) => String(num).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

export default function RearrangeAppointments() {
  const { isDark } = useContext(ThemeContext);
  const token = useMemo(() => (typeof window !== "undefined" ? localStorage.getItem("token") : null), []);

  const [conflicts, setConflicts] = useState([]);
  const [loadingList, setLoadingList] = useState(false);
  const [listError, setListError] = useState(null);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedId, setSelectedId] = useState(null);
  const [detail, setDetail] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState(null);

  const [proposalForm, setProposalForm] = useState({ startTime: "", endTime: "", notes: "" });
  const [resolutionForm, setResolutionForm] = useState({ startTime: "", endTime: "", notes: "" });
  const [consultationForm, setConsultationForm] = useState({ participantKey: "", decision: "approved", notes: "" });

  const [savingProposal, setSavingProposal] = useState(false);
  const [resolving, setResolving] = useState(false);
  const [escalating, setEscalating] = useState(false);
  const [savingConsultation, setSavingConsultation] = useState(false);

  const loadConflicts = useCallback(async () => {
    if (!token) return;
    setLoadingList(true);
    setListError(null);
    try {
  const res = await fetch(`${API_BASE}/api/secretary/conflicts?limit=20`, {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });
      if (!res.ok) throw new Error("Unable to load conflicts");
  const data = await res.json();
  const items = Array.isArray(data?.conflicts) ? data.conflicts : [];
  setConflicts(items.filter((item) => item.status === "open" || item.status === "in_progress"));
    } catch (err) {
      console.error(err);
      setListError("Failed to fetch conflicts");
    } finally {
      setLoadingList(false);
    }
  }, [token]);

  const loadConflictDetail = useCallback(
    async (id) => {
      if (!token || !id) return;
      setDetailLoading(true);
      setDetailError(null);
      try {
        const res = await fetch(`${API_BASE}/api/secretary/conflicts/${id}`, {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        });
        if (!res.ok) throw new Error("Unable to load conflict detail");
        const data = await res.json();
        const conflict = data?.conflict ?? null;
        setDetail(conflict);
        if (conflict?.meeting) {
          setResolutionForm({
            startTime: toDateTimeLocal(conflict.meeting.startTime),
            endTime: toDateTimeLocal(conflict.meeting.endTime),
            notes: "",
          });
        }
        setProposalForm({ startTime: "", endTime: "", notes: "" });
        setConsultationForm({ participantKey: "", decision: "approved", notes: "" });
      } catch (err) {
        console.error(err);
        setDetailError("Unable to load conflict detail");
      } finally {
        setDetailLoading(false);
      }
    },
    [token]
  );

  useEffect(() => {
    loadConflicts();
  }, [loadConflicts]);

  const openDialogForConflict = (id) => {
    setSelectedId(id);
    setDialogOpen(true);
    loadConflictDetail(id);
  };

  const handleProposalSubmit = async (event) => {
    event.preventDefault();
    if (!selectedId || !proposalForm.startTime || !proposalForm.endTime) return;
    setSavingProposal(true);
    try {
      const res = await fetch(`${API_BASE}/api/secretary/conflicts/${selectedId}/proposals`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          startTime: proposalForm.startTime,
          endTime: proposalForm.endTime,
          notes: proposalForm.notes,
        }),
      });
      if (!res.ok) throw new Error("Failed to save proposal");
      const data = await res.json();
      setDetail(data?.conflict ?? detail);
      setProposalForm({ startTime: "", endTime: "", notes: "" });
      loadConflicts();
    } catch (err) {
      console.error(err);
      setDetailError("Unable to add proposal");
    } finally {
      setSavingProposal(false);
    }
  };

  const handleResolve = async (event) => {
    event.preventDefault();
    if (!selectedId || !resolutionForm.startTime || !resolutionForm.endTime) return;
    setResolving(true);
    try {
      const res = await fetch(`${API_BASE}/api/secretary/conflicts/${selectedId}/resolve`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          startTime: resolutionForm.startTime,
          endTime: resolutionForm.endTime,
          resolutionNotes: resolutionForm.notes,
        }),
      });
      if (!res.ok) throw new Error("Failed to resolve conflict");
      const data = await res.json();
      setDetail(data?.conflict ?? detail);
      loadConflicts();
    } catch (err) {
      console.error(err);
      setDetailError("Unable to resolve conflict");
    } finally {
      setResolving(false);
    }
  };

  const handleEscalate = async () => {
    if (!selectedId) return;
    setEscalating(true);
    try {
      const res = await fetch(`${API_BASE}/api/secretary/conflicts/${selectedId}/escalate`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ reason: resolutionForm.notes || "Escalated" }),
      });
      if (!res.ok) throw new Error("Failed to escalate conflict");
      const data = await res.json();
      setDetail(data?.conflict ?? detail);
      loadConflicts();
    } catch (err) {
      console.error(err);
      setDetailError("Unable to escalate conflict");
    } finally {
      setEscalating(false);
    }
  };

  const participantOptions = useMemo(() => {
    if (!detail) return [];
    const map = new Map();

    const addOption = ({ id, email, name }) => {
      const normalizedEmail = email ? String(email).toLowerCase() : null;
      const key = id ? `id:${id}` : normalizedEmail ? `email:${normalizedEmail}` : null;
      if (!key) return;
      if (!map.has(key)) {
        map.set(key, {
          key,
          id,
          email: normalizedEmail,
          label: name || email || 'Executive',
        });
      }
    };

    (detail.overlaps || []).forEach((item) => {
      addOption({
        id: item.executive?._id,
        email: item.executiveEmail || item.executive?.email,
        name: item.executive?.name,
      });
    });

    (detail.participantIds || []).forEach((id) => {
      if (id) addOption({ id, email: null, name: null });
    });

    (detail.participantEmails || []).forEach((email) => addOption({ id: null, email, name: email }));

    return Array.from(map.values());
  }, [detail]);

  const handleConsultationSubmit = async (event) => {
    event.preventDefault();
    if (!selectedId || !consultationForm.participantKey) return;
    const option = participantOptions.find((item) => item.key === consultationForm.participantKey);
    if (!option) return;

    const payload = {
      decision: consultationForm.decision,
      notes: consultationForm.notes,
    };

    if (option.id) payload.executiveId = option.id;
    if (option.email) payload.executiveEmail = option.email;
    payload.executiveName = option.label;

    setSavingConsultation(true);
    try {
      const res = await fetch(`${API_BASE}/api/secretary/conflicts/${selectedId}/consultations`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error("Failed to save consultation");
      const data = await res.json();
      setDetail(data?.conflict ?? detail);
      setConsultationForm({ participantKey: option.key, decision: consultationForm.decision, notes: "" });
      loadConflicts();
    } catch (err) {
      console.error(err);
      setDetailError("Unable to record consultation");
    } finally {
      setSavingConsultation(false);
    }
  };

  const dialogSurface = isDark
    ? "bg-slate-950/80 border-slate-800/80 text-slate-100"
    : "bg-white/95 border-white/60 text-slate-900";
  const glassPanel = isDark
    ? "bg-slate-900/60 border-slate-800/80 shadow-[0_24px_40px_-32px_rgba(15,23,42,0.9)]"
    : "bg-white/85 border-slate-200/80 shadow-[0_26px_48px_-30px_rgba(15,23,42,0.25)]";
  const softAccent = isDark
    ? "bg-gradient-to-r from-indigo-500/25 via-purple-500/10 to-transparent"
    : "bg-gradient-to-r from-indigo-500/15 via-sky-400/10 to-transparent";

  const participantsList = Array.isArray(detail?.participantEmails)
    ? detail.participantEmails.filter(Boolean)
    : [];
  const hasAgenda = Boolean(detail?.meeting?.description?.trim());
  const hasParticipants = participantsList.length > 0;
  const hasContextCards = hasAgenda || hasParticipants;
  const hasProposals = Array.isArray(detail?.proposedOptions) && detail.proposedOptions.length > 0;
  const hasConsultations = Array.isArray(detail?.consultations) && detail.consultations.length > 0;
  const projectLabel = detail?.meeting?.project?.trim() || null;
  const requestedByLabel = detail?.requestedBy?.name || detail?.requestedBy?.email || null;

  return (
    <div className={`${isDark ? "text-gray-100" : "text-gray-900"}`}>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold">Rearrange Appointments</h1>
          <p className="text-sm text-gray-500">Review conflicts, consult executives, and confirm updated times.</p>
        </div>
        <Button variant="outline" size="sm" onClick={loadConflicts} disabled={loadingList}>
          Refresh list
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Conflict queue</CardTitle>
        </CardHeader>
        <CardContent>
          {loadingList ? (
            <p className="text-sm text-gray-500">Loading conflicts…</p>
          ) : listError ? (
            <p className="text-sm text-red-500">{listError}</p>
          ) : conflicts.length === 0 ? (
            <p className="text-sm text-gray-500">No meetings awaiting rearrangement.</p>
          ) : (
            <div className="grid gap-3">
              {conflicts.map((conflict) => (
                <Card key={conflict._id} className="border border-slate-200">
                  <CardContent className="p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                    <div>
                      <h3 className="font-semibold text-base">{conflict.meeting?.title ?? "Untitled meeting"}</h3>
                      <p className="text-sm text-gray-500">
                        Requested by {conflict.requestedBy?.name || conflict.requestedBy?.email || "Unknown"}
                      </p>
                      <p className="text-xs text-gray-400 mt-1">
                        Current slot: {conflict.meeting?.startTime ? new Date(conflict.meeting.startTime).toLocaleString() : "TBD"}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <Badge variant="outline" className="capitalize">
                        {conflict.status}
                      </Badge>
                      <Button size="sm" onClick={() => openDialogForConflict(conflict._id)}>
                        Review
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent
          className={`${dialogSurface} top-[6vh] translate-y-0 w-[min(96vw,1100px)] max-w-5xl max-h-[82vh] overflow-hidden rounded-2xl border
          shadow-[0_40px_72px_-40px_rgba(15,23,42,0.65)] sm:rounded-3xl`}
        >
          <DialogHeader>
            <DialogTitle className="text-2xl font-semibold tracking-tight">Conflict resolution</DialogTitle>
            <DialogDescription className="text-base text-muted-foreground">
              Coordinate with executives, suggest alternatives, then guide the executive team to a confirmed plan.
            </DialogDescription>
          </DialogHeader>

          {detailLoading ? (
            <p className="text-sm text-gray-500">Loading details…</p>
          ) : detailError ? (
            <p className="text-sm text-red-500">{detailError}</p>
          ) : !detail ? (
            <p className="text-sm text-gray-500">Select a conflict to inspect details.</p>
          ) : (
            <ScrollArea className="max-h-[calc(82vh-8rem)] pr-3">
              <div className="space-y-6 pb-2">
                <section className={`rounded-3xl border ${glassPanel} overflow-hidden`}> 
                  <div className={`px-6 py-5 ${softAccent}`}>
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                      <div className="space-y-1">
                        <span className="text-xs uppercase tracking-[0.35em] text-indigo-500/80">Overview</span>
                        <h3 className="text-xl font-semibold">{detail.meeting?.title || "Untitled meeting"}</h3>
                        {(projectLabel || requestedByLabel) && (
                          <p className="text-sm text-muted-foreground">
                            {projectLabel ? `Project ${projectLabel}` : ""}
                            {projectLabel && requestedByLabel ? " · " : ""}
                            {requestedByLabel ? `Requested by ${requestedByLabel}` : ""}
                          </p>
                        )}
                      </div>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Badge variant="outline" className="bg-indigo-500/10 text-indigo-500 border-indigo-500/30">
                          {detail.status?.replace(/_/g, " ") || "open"}
                        </Badge>
                        <span>
                          Current slot: {detail.meeting?.startTime ? new Date(detail.meeting.startTime).toLocaleString() : "TBD"}
                        </span>
                      </div>
                    </div>
                  </div>
                  {hasContextCards && (
                    <div className="px-6 pb-6 pt-4 text-sm text-muted-foreground">
                      <div className="grid gap-4 sm:grid-cols-2">
                        {hasAgenda && (
                          <div className="rounded-2xl border border-white/10 bg-white/5 p-4 dark:border-slate-800/60 dark:bg-slate-950/40">
                            <p className="text-xs uppercase tracking-widest text-indigo-500/80">Agenda</p>
                            <p className="mt-2 leading-relaxed">{detail.meeting?.description}</p>
                          </div>
                        )}
                        {hasParticipants && (
                          <div className="rounded-2xl border border-white/10 bg-white/5 p-4 dark:border-slate-800/60 dark:bg-slate-950/40">
                            <p className="text-xs uppercase tracking-widest text-indigo-500/80">Participants</p>
                            <p className="mt-2 leading-relaxed">{participantsList.join(", ")}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </section>

                <section className={`rounded-3xl border ${glassPanel} p-6`}> 
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-xs uppercase tracking-[0.35em] text-indigo-500/80">Conflicts</span>
                      <h4 className="mt-2 text-lg font-semibold">Schedule overlaps</h4>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Review affected calendars and capture their feedback.
                    </p>
                  </div>
                  {detail.overlaps?.length ? (
                    <div className="mt-4 space-y-3">
                      {detail.overlaps.map((item) => (
                        <Card
                          key={item.executiveEmail || item.executive?._id}
                          className={`border ${glassPanel} px-4 py-3`}
                        >
                          <CardContent className="p-0">
                            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                              <div>
                                <p className="text-sm font-semibold">{item.executive?.name || item.executiveEmail}</p>
                                <p className="text-xs text-muted-foreground">{item.executiveEmail}</p>
                              </div>
                              <Badge variant="outline" className="bg-amber-500/10 text-amber-600 border-amber-500/20">
                                {item.conflicts?.length ?? 0} overlapping items
                              </Badge>
                            </div>
                            <ul className="mt-3 space-y-2 text-xs text-muted-foreground">
                              {(item.conflicts || []).map((conflict, index) => (
                                <li
                                  key={index}
                                  className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 dark:border-slate-800/60 dark:bg-slate-950/30"
                                >
                                  <span className="font-semibold capitalize text-foreground">{conflict.type}</span>
                                  {conflict.title ? ` · ${conflict.title}` : ""}
                                  {conflict.startTime ? ` · ${new Date(conflict.startTime).toLocaleString()}` : ""}
                                </li>
                              ))}
                            </ul>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-gray-500">No overlaps captured.</p>
                  )}
                </section>

                <section className="space-y-5">
                  <div className="flex flex-col gap-2">
                    <span className="text-xs uppercase tracking-[0.35em] text-indigo-500/80">Resolution flow</span>
                    <p className="text-sm text-muted-foreground">
                      Move through each step to capture alternative slots, confirm the final timing, and document executive consent.
                    </p>
                  </div>
                  <div className="grid gap-4 md:grid-cols-3">
                    <form
                      onSubmit={handleProposalSubmit}
                      className={`relative flex flex-col gap-3 rounded-3xl border ${glassPanel} p-5`}
                    >
                      <span className="text-xs uppercase tracking-[0.4em] text-indigo-500/80">Step 1</span>
                      <h4 className="text-base font-semibold">Log alternative slot</h4>
                      <p className="text-xs text-muted-foreground">
                        Capture candidate timings to keep everyone aligned while you coordinate.
                      </p>
                      <div className="space-y-2">
                        <Label htmlFor="proposal-start">Start</Label>
                        <Input
                          id="proposal-start"
                          type="datetime-local"
                          value={proposalForm.startTime}
                          onChange={(e) => setProposalForm((prev) => ({ ...prev, startTime: e.target.value }))}
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="proposal-end">End</Label>
                        <Input
                          id="proposal-end"
                          type="datetime-local"
                          value={proposalForm.endTime}
                          onChange={(e) => setProposalForm((prev) => ({ ...prev, endTime: e.target.value }))}
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="proposal-notes">Notes</Label>
                        <Textarea
                          id="proposal-notes"
                          rows={3}
                          value={proposalForm.notes}
                          onChange={(e) => setProposalForm((prev) => ({ ...prev, notes: e.target.value }))}
                          placeholder="Record whom you consulted and their feedback"
                        />
                      </div>
                      <Button type="submit" size="sm" className="mt-auto" disabled={savingProposal}>
                        {savingProposal ? "Saving…" : "Add proposal"}
                      </Button>
                    </form>

                    <form
                      onSubmit={handleResolve}
                      className={`relative flex flex-col gap-3 rounded-3xl border ${glassPanel} p-5`}
                    >
                      <span className="text-xs uppercase tracking-[0.4em] text-indigo-500/80">Step 2</span>
                      <h4 className="text-base font-semibold">Confirm final timing</h4>
                      <p className="text-xs text-muted-foreground">
                        Finalise the agreed window, update notes, and notify stakeholders.
                      </p>
                      <div className="space-y-2">
                        <Label htmlFor="resolve-start">Start</Label>
                        <Input
                          id="resolve-start"
                          type="datetime-local"
                          value={resolutionForm.startTime}
                          onChange={(e) => setResolutionForm((prev) => ({ ...prev, startTime: e.target.value }))}
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="resolve-end">End</Label>
                        <Input
                          id="resolve-end"
                          type="datetime-local"
                          value={resolutionForm.endTime}
                          onChange={(e) => setResolutionForm((prev) => ({ ...prev, endTime: e.target.value }))}
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="resolve-notes">Notes</Label>
                        <Textarea
                          id="resolve-notes"
                          rows={3}
                          value={resolutionForm.notes}
                          onChange={(e) => setResolutionForm((prev) => ({ ...prev, notes: e.target.value }))}
                          placeholder="Document decisions, attendees consulted, etc."
                        />
                      </div>
                      <div className="flex flex-wrap items-center gap-2 pt-1">
                        <Button type="submit" size="sm" disabled={resolving}>
                          {resolving ? "Saving…" : "Resolve conflict"}
                        </Button>
                        <Button type="button" variant="destructive" size="sm" onClick={handleEscalate} disabled={escalating}>
                          {escalating ? "Escalating…" : "Escalate"}
                        </Button>
                      </div>
                    </form>

                    <form
                      onSubmit={handleConsultationSubmit}
                      className={`relative flex flex-col gap-3 rounded-3xl border ${glassPanel} p-5`}
                    >
                      <span className="text-xs uppercase tracking-[0.4em] text-indigo-500/80">Step 3</span>
                      <h4 className="text-base font-semibold">Record executive consent</h4>
                      <p className="text-xs text-muted-foreground">
                        Note down feedback from each participant and mark their decision status.
                      </p>
                      {participantOptions.length === 0 ? (
                        <p className="text-xs text-gray-500">No participants detected for this conflict.</p>
                      ) : (
                        <>
                          <div className="space-y-2">
                            <Label htmlFor="consultation-target">Executive</Label>
                            <select
                              id="consultation-target"
                              className={`w-full rounded-md border px-3 py-2 text-sm ${
                                isDark ? "bg-slate-900 border-slate-700 text-gray-100" : "bg-white border-gray-300 text-gray-900"
                              }`}
                              value={consultationForm.participantKey}
                              onChange={(event) =>
                                setConsultationForm((prev) => ({ ...prev, participantKey: event.target.value }))
                              }
                              required
                            >
                              <option value="" disabled>
                                Select executive
                              </option>
                              {participantOptions.map((option) => (
                                <option key={option.key} value={option.key}>
                                  {option.label}
                                </option>
                              ))}
                            </select>
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor="consultation-decision">Decision</Label>
                            <select
                              id="consultation-decision"
                              className={`w-full rounded-md border px-3 py-2 text-sm ${
                                isDark ? "bg-slate-900 border-slate-700 text-gray-100" : "bg-white border-gray-300 text-gray-900"
                              }`}
                              value={consultationForm.decision}
                              onChange={(event) =>
                                setConsultationForm((prev) => ({ ...prev, decision: event.target.value }))
                              }
                            >
                              <option value="approved">Approved</option>
                              <option value="declined">Declined</option>
                              <option value="pending">Pending</option>
                            </select>
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor="consultation-notes">Notes</Label>
                            <Textarea
                              id="consultation-notes"
                              rows={3}
                              value={consultationForm.notes}
                              onChange={(event) =>
                                setConsultationForm((prev) => ({ ...prev, notes: event.target.value }))
                              }
                              placeholder="Document when and how consent was obtained"
                            />
                          </div>

                          <Button type="submit" size="sm" className="mt-auto" disabled={savingConsultation}>
                            {savingConsultation ? "Saving…" : "Log decision"}
                          </Button>
                        </>
                      )}
                    </form>
                  </div>
                </section>
                {hasProposals && (
                  <section className={`rounded-3xl border ${glassPanel} p-6`}>
                    <span className="text-xs uppercase tracking-[0.35em] text-indigo-500/80">Activity</span>
                    <h4 className="mt-2 text-lg font-semibold">Proposals logged</h4>
                    <ul className="mt-3 space-y-2 text-xs text-muted-foreground">
                      {detail.proposedOptions.map((proposal, index) => (
                        <li key={proposal._id || index} className="rounded-md bg-white/5 px-3 py-2">
                          <div className="flex items-center justify-between gap-3">
                            <div>
                              <p className="text-sm font-semibold">{proposal.title || "Proposed slot"}</p>
                              <p className="text-xs text-muted-foreground">
                                {proposal.startTime ? new Date(proposal.startTime).toLocaleString() : ""}
                                {proposal.endTime ? ` – ${new Date(proposal.endTime).toLocaleString()}` : ""}
                              </p>
                            </div>
                            {proposal.notes && <p className="text-xs text-muted-foreground">{proposal.notes}</p>}
                          </div>
                        </li>
                      ))}
                    </ul>
                  </section>
                )}

                {hasConsultations && (
                  <section className={`rounded-3xl border ${glassPanel} p-6`}>
                    <span className="text-xs uppercase tracking-[0.35em] text-indigo-500/80">Audit trail</span>
                    <h4 className="mt-2 text-lg font-semibold">Consultation record</h4>
                    <ul className="mt-3 space-y-2 text-xs text-gray-500">
                      {detail.consultations.map((entry, index) => {
                        const recordedAt = entry.updatedAt || entry.recordedAt;
                        return (
                          <li key={entry._id || index} className="rounded-md bg-slate-100/70 px-3 py-2">
                            <div className="flex items-center justify-between gap-3">
                              <span className="font-semibold text-sm">
                                {entry.executive?.name || entry.executiveName || entry.executiveEmail || "Executive"}
                              </span>
                              <Badge
                                variant="outline"
                                className={`capitalize ${
                                  entry.decision === "approved"
                                    ? "bg-emerald-100 text-emerald-700"
                                    : entry.decision === "declined"
                                    ? "bg-rose-100 text-rose-700"
                                    : "bg-amber-100 text-amber-700"
                                }`}
                              >
                                {entry.decision}
                              </Badge>
                            </div>
                            {entry.notes && <p className="mt-1">{entry.notes}</p>}
                            <div className="mt-1 flex items-center justify-between text-[10px] text-gray-400">
                              <span>{recordedAt ? new Date(recordedAt).toLocaleString() : ""}</span>
                              <span>{entry.recordedBy?.name ? `Logged by ${entry.recordedBy.name}` : ""}</span>
                            </div>
                          </li>
                        );
                      })}
                    </ul>
                  </section>
                )}
              </div>
            </ScrollArea>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
