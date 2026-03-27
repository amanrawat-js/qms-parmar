"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Loader2, Calendar, Clock, Layers, Plus, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function CreateShiftPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [exams, setExams] = useState([]);

  
  const [form, setForm] = useState({ 
    exam: "", 
    shiftName: "", 
    date: "", 
    startTime: "" 
  });

  useEffect(() => {
    fetch("/api/exams?publishedOnly=true").then(res => res.json()).then(data => setExams(data.exams || []));
  }, []);

// 2. DERIVED STATE (No useEffect needed)
  // We use useMemo to only re-calculate when startTime, exam selection, or exams list change
  const calculatedEnd = useMemo(() => {
    if (!form.exam || !form.startTime) return "";

    const selectedExam = exams.find(e => e._id === form.exam);
    if (!selectedExam) return "";

    try {
      const [h, m] = form.startTime.split(':').map(Number);
      const d = new Date();
      d.setHours(h, m + (selectedExam.duration || 0));
      return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
    } catch (err) {
      return "";
    }
  }, [form.startTime, form.exam, exams]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    const res = await fetch("/api/shifts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    setLoading(false);
    if (res.ok) router.push("/dashboard/shifts");
  };

  return (
    <div className="max-w-2xl mx-auto py-12 px-6">
      <Card className="border-border bg-card shadow-2xl rounded-[32px] overflow-hidden">
        <CardHeader className="text-center pt-10">
          <Layers className="mx-auto h-10 w-10 text-primary mb-2" />
          <CardTitle className="text-2xl font-black uppercase italic">Initialize Shift</CardTitle>
        </CardHeader>
        <CardContent className="p-8 sm:p-10 space-y-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase tracking-widest">Target Examination</Label>
              <Select onValueChange={(val) => setForm({ ...form, exam: val })} required>
                <SelectTrigger className="h-12 bg-muted/50 border-border">
                  <SelectValue placeholder="Select Exam" />
                </SelectTrigger>
                <SelectContent>
                  {exams.map((exam) => (
                    <SelectItem key={exam._id} value={exam._id}>
                      {exam.examName} ({exam.duration} min)
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
  <Label className="text-[10px] font-black uppercase tracking-widest flex items-center gap-1">
    Shift Designation <span className="text-destructive">*</span>
  </Label>
  <Input 
    placeholder="e.g. Morning Shift"
    value={form.shiftName}
    onChange={e => setForm({...form, shiftName: e.target.value})}
    className="h-12 bg-muted/50 border-border focus-visible:ring-primary"
    required // Browser-level validation
  />
</div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-widest">Date</Label>
                <Input type="date" value={form.date} onChange={e => setForm({...form, date: e.target.value})} className="h-12 bg-muted/50" required />
              </div>
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-widest">Start Time</Label>
                <Input type="time" value={form.startTime} onChange={e => setForm({...form, startTime: e.target.value})} className="h-12 bg-muted/50" required />
              </div>
            </div>

            {calculatedEnd && (
              <div className="p-4 rounded-2xl bg-primary/5 border border-primary/20 flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs font-bold text-primary">
                  <Clock className="h-4 w-4" /> AUTO-CALCULATED END TIME
                </div>
                <div className="flex items-center gap-3 font-mono text-sm">
                  <span className="opacity-50">{form.startTime}</span>
                  <ArrowRight className="h-3 w-3 opacity-50" />
                  <span className="text-primary font-black underline underline-offset-4">{calculatedEnd}</span>
                </div>
              </div>
            )}

            <Button type="submit" className="w-full h-14 rounded-2xl font-bold uppercase tracking-widest" disabled={loading}>
              {loading ? <Loader2 className="animate-spin" /> : <><Plus className="mr-2 h-4 w-4" /> Create Shift</>}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}