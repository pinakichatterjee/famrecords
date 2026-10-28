import { createFileRoute, Link } from "@tanstack/react-router";
import { queryOptions, useSuspenseQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from '@tanstack/react-start';
import { useEffect, useMemo, useRef, useState } from "react";
import { format, parseISO } from "date-fns";
import { Upload, Camera, Search, FileText, Image as ImageIcon, Trash2, ExternalLink, Pencil, CalendarIcon, Sparkles, Download, Plus, ClipboardList } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { membersQuery, recordsQuery } from "@/lib/data";
import { RECORD_TYPES } from "@/lib/record-filters";
import { listHealthEvents, saveMedicalRecord, deleteMedicalRecord, getRecordDocument, deleteHealthEvent } from '@/lib/health.functions';
import { validateDocument } from '@/lib/health-rules';
import { timelineGroups, type HealthEvent } from '@/lib/health-timeline';
import { healthCopy, healthDate, categoryLabel, type HealthLanguage } from '@/lib/health-copy';
import { HealthEventDialog } from '@/components/HealthEventDialog';
import { DoctorVisitPackDialog } from '@/components/DoctorVisitPackDialog';
import { RecordAiDialog } from "@/components/RecordAiDialog";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export const Route = createFileRoute("/_authenticated/_approved/records")({
  head: () => ({ meta: [{ title: "Medical Records — FamRecords" }, { name: "description", content: "Upload, filter and view your family's medical records." }, { property: "og:title", content: "Medical Records — FamRecords" }, { property: "og:description", content: "Upload, filter and view your family's medical records." }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" }] }),
  loader: async ({ context }) => {
    await Promise.all([context.queryClient.ensureQueryData(membersQuery), context.queryClient.ensureQueryData(recordsQuery), context.queryClient.ensureQueryData(eventsQuery)]);
  },
  component: RecordsPage,
});

const eventsQuery = queryOptions({ queryKey: ['health-events'], queryFn: () => listHealthEvents() });
const ACCEPT = '.pdf,.doc,.docx,.jpg,.jpeg,.png,.webp,.gif';

function RecordsPage() {
  const { user } = Route.useRouteContext();
  const qc = useQueryClient();
  const { data: members } = useSuspenseQuery(membersQuery);
  const { data: records } = useSuspenseQuery(recordsQuery);
  const { data: events } = useSuspenseQuery(eventsQuery);
  const saveRecord = useServerFn(saveMedicalRecord);
  const deleteRecord = useServerFn(deleteMedicalRecord);
  const documentUrl = useServerFn(getRecordDocument);
  const deleteEvent = useServerFn(deleteHealthEvent);
  const [language, setLanguage] = useState<HealthLanguage>('en');
  const c = healthCopy[language];
  useEffect(() => { if (language === 'bn') import('@/lib/visit-pack-pdf').then(m => m.loadHealthFont()).catch(() => toast.error('Could not load Bengali font.')); }, [language]);
  const [start, setStart] = useState(''); const [end, setEnd] = useState('');
  const [eventDialog, setEventDialog] = useState<{ event: HealthEvent | null } | null>(null);
  const [packOpen, setPackOpen] = useState(false);
  const [preview, setPreview] = useState<{ url: string; extension: string; name: string; id: string } | null>(null);
  const [filter, setFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [providerFilter, setProviderFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [memberId, setMemberId] = useState("");
  const [visitDate, setVisitDate] = useState<Date | undefined>();
  const [provider, setProvider] = useState("");
  const [recordType, setRecordType] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);
  const [aiRecord, setAiRecord] = useState<(typeof records)[number] | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const camRef = useRef<HTMLInputElement>(null);

  const providers = useMemo(
    () => [...new Set([...records, ...events].map((r) => r.provider).filter((p): p is string => !!p))].sort(),
    [records, events],
  );
  const groups = useMemo(
    () => timelineGroups(records, events, { member: filter, type: typeFilter, provider: providerFilter, search, start, end }),
    [records, events, filter, typeFilter, providerFilter, search, start, end],
  );

  const reset = () => {
    setEditId(null); setFile(null); setName(""); setMemberId("");
    setVisitDate(undefined); setProvider(""); setRecordType("");
  };
  const openNew = () => { reset(); setOpen(true); };
  const openEdit = (r: (typeof records)[number]) => {
    setEditId(r.id); setFile(null); setName(r.name); setMemberId(r.family_member_id);
    setVisitDate(r.visit_date ? parseISO(r.visit_date) : undefined);
    setProvider(r.provider ?? ""); setRecordType(r.record_type ?? "");
    setOpen(true);
  };

  const pick = (f: File | undefined) => {
    if (!f) return;
    const error = validateDocument(f); if (error) { toast.error(error); return; }
    setFile(f);
    if (!name) setName(f.name.replace(/\.[^.]+$/, ""));
  };

  const details = () => ({
    name: name.trim(),
    family_member_id: memberId,
    visit_date: visitDate ? format(visitDate, "yyyy-MM-dd") : null,
    provider: provider.trim() || null,
    record_type: recordType || null,
  });

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!memberId) { toast.error("Choose a family member"); return; }
    setSaving(true);
    let uploadedPath: string | undefined;
    try {
      if (editId) await saveRecord({ data: { ...details(), id: editId } });
      else {
        if (!file) throw new Error('Choose a file');
        const validation = validateDocument(file); if (validation) throw new Error(validation);
        const ext = file.name.split('.').pop()?.toLowerCase() || 'bin';
        const path = `${user.id}/${crypto.randomUUID()}.${ext}`;
        const { error } = await supabase.storage.from('medical-documents').upload(path, file, { contentType: file.type });
        if (error) throw error;
        uploadedPath = path;
        await saveRecord({ data: { ...details(), document: path } });
      }
      toast.success(editId ? 'Record updated' : 'Record uploaded'); setOpen(false); reset();
      await qc.invalidateQueries({ queryKey: ['records'] });
    } catch (error) {
      if (uploadedPath) await supabase.storage.from('medical-documents').remove([uploadedPath]);
      toast.error(error instanceof Error ? error.message : 'Could not save record.');
    } finally { setSaving(false); }
  };

  const view = async (r: (typeof records)[number], download = false) => {
    const win = download ? window.open('', '_blank') : null;
    try {
      const result = await documentUrl({ data: { id: r.id, download } });
      if (download) { if (win) win.location.href = result.url; else window.location.href = result.url; }
      else setPreview({ ...result, name: r.name, id: r.id });
    } catch (error) { win?.close(); toast.error(error instanceof Error ? error.message : 'Could not open file.'); }
  };

  const remove = async (id: string) => {
    if (!confirm("Delete this record?")) return;
    try { await deleteRecord({ data: { id } }); toast.success('Record deleted'); await qc.invalidateQueries({ queryKey: ['records'] }); }
    catch (error) { toast.error(error instanceof Error ? error.message : 'Could not delete record.'); }
  };
  const removeEvent = async (id: string) => {
    if (!confirm('Delete this user-entered event?')) return;
    try { await deleteEvent({ data: { id } }); await qc.invalidateQueries({ queryKey: ['health-events'] }); }
    catch (error) { toast.error(error instanceof Error ? error.message : 'Could not delete event.'); }
  };

  const isImage = (p: string) => /\.(png|jpe?g|gif|webp|heic|heif)$/i.test(p);

  return (
    <div className="health-experience space-y-8" lang={language}>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold">{c.timeline}</h1>
          <p className="text-base text-muted-foreground">{c.subtitle}</p>
        </div>
        <div className="flex flex-wrap justify-center gap-2">
          <Select value={language} onValueChange={v => setLanguage(v === 'bn' ? 'bn' : 'en')}><SelectTrigger className="w-28" aria-label="Language"><SelectValue/></SelectTrigger><SelectContent><SelectItem value="en">English</SelectItem><SelectItem value="bn">বাংলা</SelectItem></SelectContent></Select>
          <Button variant="outline" onClick={() => setPackOpen(true)} disabled={!records.length}><ClipboardList className="h-4 w-4"/>{c.pack}</Button>
          <Button variant="outline" onClick={() => setEventDialog({ event: null })} disabled={!members.length}><Plus className="h-4 w-4"/>{c.event}</Button>
          <Button onClick={openNew} disabled={!members.length}><Upload className="h-4 w-4"/>{c.upload}</Button>
        </div>
      </div>

      {members.length === 0 && (
        <div className="rounded-xl bg-accent/30 p-4 text-base">
          {c.noMembers} <Link to="/members" className="font-medium text-primary underline">Go to Members</Link>
        </div>
      )}

      <div className="flex flex-col gap-4 lg:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input aria-label={c.search} placeholder={c.search} className="pl-9" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <Select value={filter} onValueChange={setFilter}>
          <SelectTrigger aria-label={c.member} className="lg:w-48"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{c.allMembers}</SelectItem>
            {members.map((m) => <SelectItem key={m.id} value={m.id}>{m.member_name}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger aria-label={c.type} className="lg:w-48"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{c.allTypes}</SelectItem>
            {RECORD_TYPES.map((t) => <SelectItem key={t} value={t}>{categoryLabel(t, language)}</SelectItem>)}
            <SelectItem value="appointment">{c.appointment}</SelectItem><SelectItem value="health_event">{c.health_event}</SelectItem>
          </SelectContent>
        </Select>
        <Select value={providerFilter} onValueChange={setProviderFilter}>
          <SelectTrigger aria-label={c.provider} className="lg:w-48"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{c.allProviders}</SelectItem>
            {providers.map((p) => <SelectItem key={p} value={p}>{p}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      <div className="flex flex-wrap items-end gap-3"><div className="space-y-2"><Label htmlFor="timeline-start">{c.from}</Label><Input id="timeline-start" type="date" value={start} onChange={e => setStart(e.target.value)}/></div><div className="space-y-2"><Label htmlFor="timeline-end">{c.to}</Label><Input id="timeline-end" type="date" value={end} onChange={e => setEnd(e.target.value)}/></div><Button variant="ghost" onClick={() => { setStart(''); setEnd(''); setSearch(''); setFilter('all'); setTypeFilter('all'); setProviderFilter('all'); }}>{c.reset}</Button></div>
      {start && end && end < start && <p role="alert" className="text-destructive">{c.invalidRange}</p>}
      {!groups.length ? <p className="py-12 text-center text-muted-foreground">{c.empty}</p> : groups.map(group => <section key={group.month} className="space-y-4"><h2 className="border-b pb-3 text-xl font-semibold">{healthDate(`${group.month}-01`, language, true)}</h2><div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {group.items.map(row => {
            if (row.kind === 'event') { const event = row.item; return <div key={event.id} className="flex flex-col gap-3 rounded-lg border bg-card p-5"><div className="flex items-center gap-2 text-sm text-primary"><CalendarIcon className="h-4 w-4"/>{event.event_type === 'appointment' ? c.appointment : c.health_event}<span className="ml-auto text-xs text-muted-foreground">{c.manual}</span></div><h3 className="break-words text-lg font-semibold">{event.title}</h3><p className="text-sm text-muted-foreground">{members.find(m => m.id === event.family_member_id)?.member_name} · {healthDate(event.event_date, language)} {event.event_time?.slice(0, 5)}</p>{event.provider && <p className="break-words text-sm">{event.provider}</p>}{event.notes && <p className="whitespace-pre-wrap break-words text-sm text-muted-foreground">{event.notes}</p>}<div className="mt-auto flex justify-end gap-2"><Button variant="ghost" size="icon" aria-label={`${c.edit} ${event.title}`} title={c.edit} onClick={() => setEventDialog({ event })}><Pencil className="h-4 w-4"/></Button><Button variant="ghost" size="icon" aria-label={`${c.remove} ${event.title}`} title={c.remove} onClick={() => removeEvent(event.id)}><Trash2 className="h-4 w-4 text-destructive"/></Button></div></div>; }
            const r = row.item; return (
            <div key={r.id} className="flex flex-col gap-4 rounded-lg border bg-card p-5">
              <div className="flex items-start gap-3">
                <div className="rounded-lg bg-secondary p-3">
                  {isImage(r.document) ? <ImageIcon className="h-5 w-5 text-primary" /> : <FileText className="h-5 w-5 text-primary" />}
                </div>
                <div className="min-w-0 flex-1 space-y-1">
                  <h3 className="break-words text-lg font-semibold">{r.name}</h3>
                  {r.record_type && <span className="inline-block rounded bg-secondary px-2 py-0.5 text-xs font-medium text-secondary-foreground">{categoryLabel(r.record_type, language)}</span>}
                  <p className="text-sm text-muted-foreground">
                    {r.family_members?.member_name}
                  </p>
                  <p className="text-xs text-muted-foreground">{r.visit_date ? `${c.documentDate}: ${healthDate(r.visit_date, language)}` : c.missingDate}</p><p className="text-xs text-muted-foreground">{c.uploaded}: {healthDate(r.created_at, language)}{!r.visit_date && ` · ${c.uploadFallback}`}</p>
                  {r.provider && <p className="truncate text-sm text-muted-foreground">{r.provider}</p>}
                </div>
              </div>
               <div className="mt-auto flex flex-wrap items-center gap-2">
                <Button variant="secondary" size="sm" onClick={() => view(r)}><ExternalLink className="h-4 w-4" />{c.view}</Button>
                <Button variant="outline" size="sm" onClick={() => setAiRecord(r)}><Sparkles className="h-4 w-4" />{c.ai}</Button>
                <Button variant="ghost" size="icon" aria-label={`${c.download} ${r.name}`} title={c.download} onClick={() => view(r, true)}><Download className="h-4 w-4"/></Button>
                <Button variant="ghost" size="icon" aria-label={`${c.edit} ${r.name}`} title={c.edit} onClick={() => openEdit(r)}><Pencil className="h-4 w-4" /></Button>
                <Button variant="ghost" size="icon" aria-label={`${c.remove} ${r.name}`} title={c.remove} onClick={() => remove(r.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
              </div>
            </div>
          ); })}
        </div></section>)}

      <RecordAiDialog record={aiRecord} onClose={() => setAiRecord(null)} />
      {eventDialog && <HealthEventDialog key={eventDialog.event?.id ?? 'new'} event={eventDialog.event} memberId={filter} members={members} language={language} onClose={() => setEventDialog(null)}/>}
      {packOpen && <DoctorVisitPackDialog members={members} records={records} memberId={filter} language={language} onClose={() => setPackOpen(false)}/>}
      <Dialog open={!!preview} onOpenChange={open => !open && setPreview(null)}><DialogContent className="max-h-[92vh] overflow-y-auto sm:max-w-4xl"><DialogHeader><DialogTitle>{preview?.name}</DialogTitle></DialogHeader>{preview && (/^(png|jpg|jpeg|gif|webp)$/.test(preview.extension) ? <img src={preview.url} alt={preview.name} className="max-h-[65vh] w-full object-contain"/> : preview.extension === 'pdf' ? <iframe title={preview.name} src={preview.url} className="h-[65vh] w-full border"/> : <p className="text-muted-foreground">Word document · {c.download}</p>)}<div className="flex justify-center"><Button onClick={() => { const r = records.find(r => r.id === preview?.id); if (r) view(r, true); }}><Download className="h-4 w-4"/>{c.download}</Button></div></DialogContent></Dialog>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{editId ? (language === 'bn' ? 'নথি সম্পাদনা' : 'Edit medical record') : c.upload}</DialogTitle></DialogHeader>
          <form onSubmit={submit} className="space-y-4">
            <div className="space-y-2">
              <Label>{c.member}</Label>
              <Select value={memberId} onValueChange={setMemberId}>
                <SelectTrigger aria-label={c.member}><SelectValue placeholder={c.selectMember} /></SelectTrigger>
                <SelectContent>{members.map((m) => <SelectItem key={m.id} value={m.id}>{m.member_name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            {!editId && (
              <div className="space-y-2">
                <Label>Document</Label>
                <div className="grid grid-cols-2 gap-3">
                  <Button type="button" variant="outline" onClick={() => fileRef.current?.click()}><Upload className="h-4 w-4" /> Choose file</Button>
                  <Button type="button" variant="outline" onClick={() => camRef.current?.click()}><Camera className="h-4 w-4" /> Take photo</Button>
                </div>
                <input ref={fileRef} type="file" accept={ACCEPT} className="hidden" onChange={(e) => pick(e.target.files?.[0])} />
                <input ref={camRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={(e) => pick(e.target.files?.[0])} />
                {file && <p className="truncate text-sm text-muted-foreground">Selected: {file.name}</p>}
                <p className="text-xs text-muted-foreground">PDF, Word or image · up to 20 MB</p>
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="rn">{language === 'bn' ? 'নথির নাম' : 'Record name'}</Label>
              <Input id="rn" required value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Blood test – March" />
            </div>
            <div className="space-y-2">
              <Label>{c.type}</Label>
              <Select value={recordType} onValueChange={setRecordType}>
                <SelectTrigger aria-label={c.type}><SelectValue placeholder={c.type} /></SelectTrigger>
                <SelectContent>{RECORD_TYPES.map((t) => <SelectItem key={t} value={t}>{categoryLabel(t, language)}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>{c.documentDate}</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button type="button" variant="outline" className={cn("w-full justify-start text-left font-normal", !visitDate && "text-muted-foreground")}>
                    <CalendarIcon className="h-4 w-4" />
                    {visitDate ? healthDate(format(visitDate, 'yyyy-MM-dd'), language) : <span>{c.date}</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar mode="single" selected={visitDate} onSelect={setVisitDate} disabled={(d) => d > new Date()} initialFocus className="p-3 pointer-events-auto" />
                </PopoverContent>
              </Popover>
            </div>
            <div className="space-y-2">
              <Label htmlFor="pv">{c.provider}</Label>
              <Input id="pv" value={provider} onChange={(e) => setProvider(e.target.value)} placeholder="e.g. Dr. Sen, Apollo Hospital" list="providers" />
              <datalist id="providers">{providers.map((p) => <option key={p} value={p} />)}</datalist>
            </div>
            <DialogFooter><Button type="submit" disabled={saving}>{saving ? c.saving : editId ? c.save : language === 'bn' ? 'আপলোড' : 'Upload'}</Button></DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
