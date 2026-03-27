"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import { Save, ArrowLeft, Loader2, GitMerge } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function EditTopicPage({ params }) {
  const { id } = use(params);
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [subjects, setSubjects] = useState([]);
  const [availableParents, setAvailableParents] = useState([]);

  const [form, setForm] = useState({
    topicName: "",
    subject: "",
    parent: null,
    status: ""
  });

  useEffect(() => {
    // Fetch initial data, subjects, and then potential parents
    const fetchData = async () => {
      const [tRes, sRes] = await Promise.all([
        fetch(`/api/topics/${id}`),
        fetch("/api/subjects?activeOnly=true")
      ]);
      const tData = await tRes.json();
      const sData = await sRes.json();
      
      setForm({
        topicName: tData.topicName,
        subject: tData.subject?._id || "",
        parent: tData.parent?._id || null,
        status: tData.status
      });
      setSubjects(sData.subjects || []);
      setLoading(false);
    };
    fetchData();
  }, [id]);

  // Fetch parents based on selected subject
  useEffect(() => {
    if (form.subject) {
      fetch(`/api/topics?subjectId=${form.subject}`)
        .then(res => res.json())
        .then(data => {
          // Filter out the current topic so it can't be its own parent
          setAvailableParents(data.topics?.filter(t => t._id !== id) || []);
        });
    }
  }, [form.subject, id]);

  const handleUpdate = async (e) => {
    e.preventDefault();
    setSaving(true);
    const res = await fetch(`/api/topics/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    setSaving(false);
    if (res.ok) router.push(`/dashboard/topics/${id}`);
  };

  if (loading) return <div className="flex h-screen items-center justify-center"><Loader2 className="animate-spin text-primary" /></div>;

  return (
    <div className="max-w-xl mx-auto py-12 px-6">
      <Card className="border-border bg-card shadow-2xl rounded-[32px] overflow-hidden">
        <CardHeader className="pt-10 px-10">
          <CardTitle className="text-2xl font-black uppercase italic">Edit Topic Node</CardTitle>
        </CardHeader>
        <CardContent className="p-10 space-y-6">
          <form onSubmit={handleUpdate} className="space-y-6">
            <div className="space-y-2">
              <Label className="text-[10px] font-bold uppercase tracking-widest ml-1">Topic Name</Label>
              <Input 
                value={form.topicName} 
                onChange={(e) => setForm({ ...form, topicName: e.target.value })} 
                className="h-12 bg-muted/50 border-border" 
                required 
              />
            </div>

            <div className="space-y-2">
              <Label className="text-[10px] font-bold uppercase tracking-widest ml-1">Subject Association</Label>
              <Select value={form.subject} onValueChange={(val) => setForm({ ...form, subject: val, parent: null })}>
                <SelectTrigger className="h-12 bg-muted/50 border-border"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {subjects.map(s => <SelectItem key={s._id} value={s._id}>{s.subjectName}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="text-[10px] font-bold uppercase tracking-widest ml-1">Parent Relation</Label>
              <Select value={form.parent || "none"} onValueChange={(val) => setForm({ ...form, parent: val === "none" ? null : val })}>
                <SelectTrigger className="h-12 bg-muted/50 border-border"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None (Primary Topic)</SelectItem>
                  {availableParents.map(t => <SelectItem key={t._id} value={t._id}>{t.topicName}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="text-[10px] font-bold uppercase tracking-widest ml-1">Status</Label>
              <Select value={form.status} onValueChange={(val) => setForm({ ...form, status: val })}>
                <SelectTrigger className="h-12 bg-muted/50 border-border"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="ACTIVE">ACTIVE</SelectItem>
                  <SelectItem value="INACTIVE">INACTIVE</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Button type="submit" className="w-full" disabled={saving}>
              {saving ? <Loader2 className="animate-spin h-5 w-5" /> : <><Save className="mr-2 h-4 w-4" /> Commit Updates</>}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}