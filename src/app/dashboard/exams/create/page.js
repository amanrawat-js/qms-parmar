"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Loader2, Plus, Layout, Sun, Moon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue 
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

export default function CreateExamPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [boards, setBoards] = useState([]);
  
  // Exam form state
  const [form, setForm] = useState({
    examName: "",
    examYear: new Date().getFullYear(),
    examSlug: "",
    duration: 60,
    totalMarks: 100,
    board: "",
    status: "DRAFT",
  });

  // Shift form state
  const [shiftForm, setShiftForm] = useState({
    shiftName: "Morning",
    date: "",
    startTime: "09:00",
    endTime: "",
  });

  useEffect(() => {
    fetch("/api/boards")
      .then(res => res.json())
      .then(data => setBoards(data.boards || []));
  }, []);

  const handleNameChange = (e) => {
    const name = e.target.value;
    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
    setForm({ ...form, examName: name, examSlug: slug });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!shiftForm.date) {
      alert("Please select a shift date.");
      return;
    }
    setLoading(true);
    
    // Step 1: Create the exam
    const examRes = await fetch("/api/exams", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });

    if (!examRes.ok) {
      setLoading(false);
      alert("Failed to create exam. Ensure slug is unique.");
      return;
    }

    const newExam = await examRes.json();

    // Step 2: Create the shift linked to the exam
    await fetch("/api/shifts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        exam: newExam._id,
        shiftName: shiftForm.shiftName,
        date: shiftForm.date,
        startTime: shiftForm.startTime,
        endTime: shiftForm.endTime || undefined,
      }),
    });

    setLoading(false);
    router.push(`/dashboard/exams/${newExam._id}`);
  };

  return (
    <div className="max-w-2xl mx-auto py-10 px-4 animate-in fade-in duration-500">
      <Button variant="ghost" onClick={() => router.back()} className="mb-4 text-muted-foreground hover:text-foreground">
        <ArrowLeft className="mr-2 h-4 w-4" /> Back to Registry
      </Button>

      <Card className="border-white/10 shadow-2xl rounded-3xl overflow-hidden">
        <div className="h-1 bg-primary/50 w-full" />
        <CardHeader>
          <CardTitle className="text-xl font-bold uppercase tracking-tight flex items-center gap-2">
            <Layout className="h-5 w-5 text-primary" /> Initialize Exam
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            
            {/* Board Selection */}
            <div className="space-y-2">
              <Label className="text-[10px] font-bold uppercase text-muted-foreground tracking-widest">Organizing Board</Label>
              <Select onValueChange={(val) => setForm({ ...form, board: val })} required>
                <SelectTrigger className="h-12 bg-white/5 border-white/10 rounded-xl">
                  <SelectValue placeholder="Select Board (SSC, IBPS, RSSB...)" />
                </SelectTrigger>
                <SelectContent>
                  {boards.map((b) => (
                    <SelectItem key={b._id} value={b._id}>{b.boardShortName} - {b.boardName}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Exam Name */}
              <div className="space-y-2">
                <Label className="text-[10px] font-bold uppercase text-muted-foreground tracking-widest">Exam Name</Label>
                <Input 
                  value={form.examName} 
                  onChange={handleNameChange} 
                  placeholder="Combined Graduate Level"
                  className="h-12 bg-white/5 border-white/10 rounded-xl"
                  required 
                />
              </div>
              {/* Year */}
              <div className="space-y-2">
                <Label className="text-[10px] font-bold uppercase text-muted-foreground tracking-widest">Year</Label>
                <Input 
                  type="number" 
                  value={form.examYear} 
                  onChange={(e) => setForm({ ...form, examYear: parseInt(e.target.value) })}
                  className="h-12 bg-white/5 border-white/10 rounded-xl"
                  required 
                />
              </div>
            </div>

            {/* Registry Slug */}
            <div className="space-y-2">
              <Label className="text-[10px] font-bold uppercase text-muted-foreground tracking-widest">Registry Slug</Label>
              <div className="p-3 rounded-xl bg-primary/5 border border-dashed border-primary/20 font-mono text-[11px] text-primary/80">
                /exams/{form.examSlug || "..."}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Duration */}
              <div className="space-y-2">
                <Label className="text-[10px] font-bold uppercase text-muted-foreground tracking-widest">Duration (Minutes)</Label>
                <Input 
                  type="number" 
                  value={form.duration} 
                  onChange={(e) => setForm({ ...form, duration: parseInt(e.target.value) })}
                  className="h-12 bg-white/5 border-white/10 rounded-xl"
                  required 
                />
              </div>
              {/* Total Marks */}
              <div className="space-y-2">
                <Label className="text-[10px] font-bold uppercase text-muted-foreground tracking-widest">Total Marks</Label>
                <Input 
                  type="number" 
                  value={form.totalMarks} 
                  onChange={(e) => setForm({ ...form, totalMarks: parseInt(e.target.value) })}
                  className="h-12 bg-white/5 border-white/10 rounded-xl"
                  required 
                />
              </div>
            </div>

            {/* --- SHIFT SECTION --- */}
            <Separator className="my-2" />
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Sun className="h-4 w-4 text-amber-500" />
                <span className="text-sm font-bold uppercase tracking-widest text-muted-foreground">Shift Details</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Shift Name */}
                <div className="space-y-2">
                  <Label className="text-[10px] font-bold uppercase text-muted-foreground tracking-widest">Shift</Label>
                  <Select
                    value={shiftForm.shiftName}
                    onValueChange={(val) => setShiftForm({ ...shiftForm, shiftName: val })}
                  >
                    <SelectTrigger className="h-12 bg-white/5 border-white/10 rounded-xl">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Morning">
                        <span className="flex items-center gap-2"><Sun className="h-3.5 w-3.5 text-amber-500" /> Morning</span>
                      </SelectItem>
                      <SelectItem value="Evening">
                        <span className="flex items-center gap-2"><Moon className="h-3.5 w-3.5 text-indigo-400" /> Evening</span>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Shift Date */}
                <div className="space-y-2">
                  <Label className="text-[10px] font-bold uppercase text-muted-foreground tracking-widest">Shift Date</Label>
                  <Input
                    type="date"
                    value={shiftForm.date}
                    onChange={(e) => setShiftForm({ ...shiftForm, date: e.target.value })}
                    className="h-12 bg-white/5 border-white/10 rounded-xl"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Start Time */}
                <div className="space-y-2">
                  <Label className="text-[10px] font-bold uppercase text-muted-foreground tracking-widest">Start Time</Label>
                  <Input
                    type="time"
                    value={shiftForm.startTime}
                    onChange={(e) => setShiftForm({ ...shiftForm, startTime: e.target.value })}
                    className="h-12 bg-white/5 border-white/10 rounded-xl"
                    required
                  />
                </div>

                {/* End Time */}
                <div className="space-y-2">
                  <Label className="text-[10px] font-bold uppercase text-muted-foreground tracking-widest">End Time (Optional)</Label>
                  <Input
                    type="time"
                    value={shiftForm.endTime}
                    onChange={(e) => setShiftForm({ ...shiftForm, endTime: e.target.value })}
                    className="h-12 bg-white/5 border-white/10 rounded-xl"
                  />
                </div>
              </div>
            </div>

            <Button type="submit" className="w-full h-14 rounded-2xl text-sm font-black uppercase tracking-[0.2em] bg-white text-black hover:bg-primary hover:text-white transition-all shadow-xl" disabled={loading}>
              {loading ? <Loader2 className="animate-spin" /> : <><Plus className="mr-2 h-4 w-4" /> Create Exam &amp; Shift</>}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}