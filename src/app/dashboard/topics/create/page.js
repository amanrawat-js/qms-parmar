"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, GitBranch, Plus, Loader2, GitMerge, Layout } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue 
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function CreateTopicPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [subjects, setSubjects] = useState([]);
  const [availableParents, setAvailableParents] = useState([]);
  
  const [form, setForm] = useState({ 
    topicName: "", 
    topicSlug: "", 
    subject: "", 
    parent: null 
  });

  // 1. Fetch all subjects on mount
  useEffect(() => {
    fetch("/api/subjects?activeOnly=true")
      .then(res => res.json())
      .then(data => setSubjects(data.subjects || []))
      .catch(err => console.error("Error fetching subjects:", err));
  }, []);

  // 2. Optimized fetch for parent topics when subject changes
  // Avoids synchronous setState warnings and handles race conditions
  useEffect(() => {
    if (!form.subject) {
      if (availableParents.length !== 0) setAvailableParents([]);
      return;
    }

    let isMounted = true;
    const fetchPotentialParents = async () => {
      try {
        const res = await fetch(`/api/topics?subjectId=${form.subject}`);
        const data = await res.json();
        if (isMounted) {
          setAvailableParents(data.topics || []);
        }
      } catch (err) {
        console.error("Error fetching potential parents:", err);
      }
    };

    fetchPotentialParents();
    return () => { isMounted = false; };
  }, [form.subject]);

  const handleNameChange = (e) => {
    const name = e.target.value;
    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
    setForm({ ...form, topicName: name, topicSlug: slug });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch("/api/topics", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (res.ok) {
        router.push("/dashboard/topics");
        router.refresh();
      }
    } catch (err) {
      console.error("Submission error:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-xl mx-auto py-12 px-6">
      <Button 
        variant="ghost" 
        onClick={() => router.back()} 
        className="mb-6 text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="mr-2 h-4 w-4" /> Back to Index
      </Button>

      <Card className="border-border bg-card shadow-2xl rounded-[32px] overflow-hidden">
        <CardHeader className="text-center pt-10">
          <GitBranch className="mx-auto h-10 w-10 text-primary mb-2" />
          <CardTitle className="text-2xl font-black uppercase italic tracking-tight">
            Initialize Topic
          </CardTitle>
        </CardHeader>

        <CardContent className="p-8 space-y-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            
            {/* Subject Selection */}
            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase tracking-widest ml-1 flex items-center gap-2">
                <Layout className="h-3 w-3" /> Parent Subject
              </Label>
              <Select 
                onValueChange={(val) => setForm({ ...form, subject: val, parent: null })} 
                required
              >
                <SelectTrigger className="h-12 bg-muted/50 border-border">
                  <SelectValue placeholder="Select Subject" />
                </SelectTrigger>
                <SelectContent>
                  {subjects.map((s) => (
                    <SelectItem key={s._id} value={s._id}>{s.subjectName}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Parent Topic Selection (Hierarchical) */}
            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase tracking-widest ml-1 flex items-center gap-2">
                <GitMerge className="h-3 w-3" /> Nest Under Topic (Optional)
              </Label>
              <Select 
                disabled={!form.subject || availableParents.length === 0}
                onValueChange={(val) => setForm({ ...form, parent: val === "none" ? null : val })}
                value={form.parent || "none"}
              >
                <SelectTrigger className="h-12 bg-muted/50 border-border">
                  <SelectValue placeholder={!form.subject ? "Select Subject First" : "Top-Level Topic"} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None (Primary Topic)</SelectItem>
                  {availableParents.map((t) => (
                    <SelectItem key={t._id} value={t._id}>{t.topicName}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {!form.subject && (
                <p className="text-[9px] text-muted-foreground italic ml-1 italic">
                  * Select a subject to see potential parent topics.
                </p>
              )}
            </div>

            {/* Topic Name */}
            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase tracking-widest ml-1">Topic Name</Label>
              <Input 
                placeholder="e.g. Percentage" 
                value={form.topicName} 
                onChange={handleNameChange} 
                className="h-12 bg-muted/50 border-border" 
                required 
              />
            </div>

            {/* Slug Display */}
            <div className="py-2 flex flex-col items-center">
               <span className="text-[9px] font-bold uppercase text-muted-foreground tracking-widest mb-1">Generated Registry Slug</span>
               <code className="text-[10px] font-mono bg-muted px-3 py-1.5 rounded-lg text-primary border border-border">
                 {form.topicSlug || "awaiting-input..."}
               </code>
            </div>

            <Button 
              type="submit" 
              disabled={loading}
            >
              {loading ? (
                <Loader2 className="animate-spin h-5 w-5" />
              ) : (
                <span className="flex items-center gap-2">
                  Create Topic <Plus className="h-4 w-4" />
                </span>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}