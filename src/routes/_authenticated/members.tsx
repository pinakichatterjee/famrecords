import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";
import { membersQuery, RELATIONS, BLOOD_GROUPS } from "@/lib/data";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription,
  AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export const Route = createFileRoute("/_authenticated/members")({
  head: () => ({ meta: [{ title: "Family Members — FamilyHealth Vault" }] }),
  component: MembersPage,
});

type Member = Tables<"family_members">;
const empty = { member_name: "", height: "", weight: "", relation: "", blood_group: "" };

function MembersPage() {
  const { user } = Route.useRouteContext();
  const qc = useQueryClient();
  const { data: members = [], isLoading } = useQuery(membersQuery);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Member | null>(null);
  const [form, setForm] = useState(empty);
  const [toDelete, setToDelete] = useState<Member | null>(null);
  const [saving, setSaving] = useState(false);

  const openNew = () => { setEditing(null); setForm(empty); setOpen(true); };
  const openEdit = (m: Member) => {
    setEditing(m);
    setForm({
      member_name: m.member_name, height: m.height?.toString() ?? "", weight: m.weight?.toString() ?? "",
      relation: m.relation ?? "", blood_group: m.blood_group ?? "",
    });
    setOpen(true);
  };

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const payload = {
      member_name: form.member_name.trim(),
      height: form.height ? Number(form.height) : null,
      weight: form.weight ? Number(form.weight) : null,
      relation: form.relation || null,
      blood_group: form.blood_group || null,
    };
    const { error } = editing
      ? await supabase.from("family_members").update(payload).eq("id", editing.id)
      : await supabase.from("family_members").insert({ ...payload, user_id: user.id });
    setSaving(false);
    if (error) { toast.error(error.message); return; }
    toast.success(editing ? "Member updated" : "Member added");
    setOpen(false);
    qc.invalidateQueries({ queryKey: ["members"] });
  };

  const remove = async () => {
    if (!toDelete) return;
    const { error } = await supabase.from("family_members").delete().eq("id", toDelete.id);
    if (error) { toast.error(error.message); return; }
    toast.success("Member deleted");
    setToDelete(null);
    qc.invalidateQueries({ queryKey: ["members"] });
    qc.invalidateQueries({ queryKey: ["records"] });
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold">Family Members</h1>
          <p className="text-base text-muted-foreground">Everyone whose health records you look after.</p>
        </div>
        <Button onClick={openNew}><Plus className="h-4 w-4" /> Add member</Button>
      </div>

      <div className="overflow-hidden rounded-xl border bg-card">
        <Table>
          <TableHeader className="bg-secondary">
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Relation</TableHead>
              <TableHead>Height (cm)</TableHead>
              <TableHead>Weight (kg)</TableHead>
              <TableHead>Blood group</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow><TableCell colSpan={6} className="py-8 text-center text-muted-foreground">Loading…</TableCell></TableRow>
            ) : members.length === 0 ? (
              <TableRow><TableCell colSpan={6} className="py-8 text-center text-muted-foreground">No members yet. Add your first family member.</TableCell></TableRow>
            ) : members.map((m) => (
              <TableRow key={m.id}>
                <TableCell className="font-medium">{m.member_name}</TableCell>
                <TableCell>{m.relation ?? "—"}</TableCell>
                <TableCell>{m.height ?? "—"}</TableCell>
                <TableCell>{m.weight ?? "—"}</TableCell>
                <TableCell>{m.blood_group ? <span className="rounded-full bg-accent px-2 py-0.5 text-xs font-semibold text-accent-foreground">{m.blood_group}</span> : "—"}</TableCell>
                <TableCell className="text-right">
                  <Button variant="ghost" size="icon" aria-label="Edit" onClick={() => openEdit(m)}><Pencil className="h-4 w-4" /></Button>
                  <Button variant="ghost" size="icon" aria-label="Delete" onClick={() => setToDelete(m)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editing ? "Edit member" : "Add member"}</DialogTitle></DialogHeader>
          <form onSubmit={save} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="mn">Name</Label>
              <Input id="mn" required value={form.member_name} onChange={(e) => setForm({ ...form, member_name: e.target.value })} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="h">Height (cm)</Label>
                <Input id="h" type="number" step="0.1" min="0" value={form.height} onChange={(e) => setForm({ ...form, height: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="w">Weight (kg)</Label>
                <Input id="w" type="number" step="0.1" min="0" value={form.weight} onChange={(e) => setForm({ ...form, weight: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Relation</Label>
                <Select value={form.relation} onValueChange={(v) => setForm({ ...form, relation: v })}>
                  <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                  <SelectContent>{RELATIONS.map((r) => <SelectItem key={r} value={r}>{r}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Blood group</Label>
                <Select value={form.blood_group} onValueChange={(v) => setForm({ ...form, blood_group: v })}>
                  <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                  <SelectContent>{BLOOD_GROUPS.map((b) => <SelectItem key={b} value={b}>{b}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter><Button type="submit" disabled={saving}>{saving ? "Saving…" : "Save"}</Button></DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!toDelete} onOpenChange={(o) => !o && setToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete {toDelete?.member_name}?</AlertDialogTitle>
            <AlertDialogDescription>This also deletes all of their medical records.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={remove}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
