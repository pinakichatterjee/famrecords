import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useRef, useState } from "react";
import { Upload, Camera, Search, FileText, Image as ImageIcon, Trash2, ExternalLink } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { membersQuery, recordsQuery } from "@/lib/data";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export const Route = createFileRoute("/_authenticated/records")({
  head: () => ({ meta: [{ title: "Medical Records — FamilyHealth Vault" }, { name: "description", content: "Upload, filter and view your family's medical records." }] }),
  component: RecordsPage,
});

const ACCEPT = ".pdf,.doc,.docx,image/*,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document";

function RecordsPage() {
  const { user } = Route.useRouteContext();
  const qc = useQueryClient();
  const { data: members = [] } = useQuery(membersQuery);
  const { data: records = [], isLoading } = useQuery(recordsQuery);
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [memberId, setMemberId] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const camRef = useRef<HTMLInputElement>(null);

  const filtered = useMemo(
    () => records.filter((r) =>
      (filter === "all" || r.family_member_id === filter) &&
      r.name.toLowerCase().includes(search.trim().toLowerCase())),
    [records, filter, search],
  );

  const pick = (f: File | undefined) => {
    if (!f) return;
    setFile(f);
    if (!name) setName(f.name.replace(/\.[^.]+$/, ""));
  };

  const upload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file || !memberId) { toast.error("Choose a family member and a file"); return; }
    setUploading(true);
    const ext = file.name.split(".").pop() || "bin";
    const path = `${user.id}/${crypto.randomUUID()}.${ext}`;
    const { error: upErr } = await supabase.storage.from("medical-documents").upload(path, file, { contentType: file.type });
    if (upErr) { setUploading(false); { toast.error(upErr.message); return; } }
    const { error } = await supabase.from("medical_records").insert({
      created_by: user.id, family_member_id: memberId, name: name.trim(), document: path,
    });
    setUploading(false);
    if (error) { await supabase.storage.from("medical-documents").remove([path]); { toast.error(error.message); return; } }
    toast.success("Record uploaded");
    setOpen(false); setFile(null); setName(""); setMemberId("");
    qc.invalidateQueries({ queryKey: ["records"] });
  };

  const view = async (path: string) => {
    const win = window.open("", "_blank");
    const { data, error } = await supabase.storage.from("medical-documents").createSignedUrl(path, 300);
    if (error || !data) { win?.close(); { toast.error(error?.message ?? "Could not open file"); return; } }
    if (win) win.location.href = data.signedUrl; else window.location.href = data.signedUrl;
  };

  const remove = async (id: string, path: string) => {
    if (!confirm("Delete this record?")) return;
    const { error } = await supabase.from("medical_records").delete().eq("id", id);
    if (error) { toast.error(error.message); return; }
    await supabase.storage.from("medical-documents").remove([path]);
    toast.success("Record deleted");
    qc.invalidateQueries({ queryKey: ["records"] });
  };

  const isImage = (p: string) => /\.(png|jpe?g|gif|webp|heic|heif)$/i.test(p);

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold">Medical Records</h1>
          <p className="text-base text-muted-foreground">Reports, prescriptions and scans for your family.</p>
        </div>
        <Button onClick={() => setOpen(true)} disabled={members.length === 0}><Upload className="h-4 w-4" /> Upload record</Button>
      </div>

      {members.length === 0 && (
        <div className="rounded-xl bg-accent/30 p-4 text-base">
          Add a family member first. <Link to="/members" className="font-medium text-primary underline">Go to Members</Link>
        </div>
      )}

      <div className="flex flex-col gap-4 sm:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder="Search by record name" className="pl-9" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <Select value={filter} onValueChange={setFilter}>
          <SelectTrigger className="sm:w-56"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All members</SelectItem>
            {members.map((m) => <SelectItem key={m.id} value={m.id}>{m.member_name}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <p className="text-muted-foreground">Loading…</p>
      ) : filtered.length === 0 ? (
        <div className="rounded-xl bg-secondary p-12 text-center text-muted-foreground">No records found.</div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((r) => (
            <div key={r.id} className="flex flex-col gap-4 rounded-xl border bg-card p-5">
              <div className="flex items-start gap-3">
                <div className="rounded-lg bg-secondary p-3">
                  {isImage(r.document) ? <ImageIcon className="h-5 w-5 text-primary" /> : <FileText className="h-5 w-5 text-primary" />}
                </div>
                <div className="min-w-0 flex-1">
                  <h2 className="truncate text-lg font-semibold">{r.name}</h2>
                  <p className="text-sm text-muted-foreground">
                    {r.family_members?.member_name} · {new Date(r.created_at).toLocaleDateString()}
                  </p>
                </div>
              </div>
              <div className="flex gap-2">
                <Button variant="secondary" size="sm" className="flex-1" onClick={() => view(r.document)}><ExternalLink className="h-4 w-4" /> View</Button>
                <Button variant="ghost" size="icon" aria-label="Delete" onClick={() => remove(r.id, r.document)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
              </div>
            </div>
          ))}
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Upload medical record</DialogTitle></DialogHeader>
          <form onSubmit={upload} className="space-y-4">
            <div className="space-y-2">
              <Label>Family member</Label>
              <Select value={memberId} onValueChange={setMemberId}>
                <SelectTrigger><SelectValue placeholder="Select member" /></SelectTrigger>
                <SelectContent>{members.map((m) => <SelectItem key={m.id} value={m.id}>{m.member_name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
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
            <div className="space-y-2">
              <Label htmlFor="rn">Record name</Label>
              <Input id="rn" required value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Blood test – March" />
            </div>
            <DialogFooter><Button type="submit" disabled={uploading}>{uploading ? "Uploading…" : "Upload"}</Button></DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
