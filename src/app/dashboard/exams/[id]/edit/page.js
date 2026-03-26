"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import { Save, Loader2, ArrowLeft, Sun, Moon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";

export default function EditExamPage({ params }) {
  const { id } = use(params);
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    examName: "",
    examYear: "",
    duration: "",
    totalMarks: "",
    status: ""
  });

  // Shift editing state
  const [shifts, setShifts] = useState([]);
  const [shiftForms, setShiftForms] = useState([]);

  useEffect(() => {
    Promise.all([
      fetch(`/api/exams/${id}`).then(res => res.json()),
      fetch(`/api/shifts?examId=${id}`).then(res => res.json()),
    ]).then(([examData, shiftsData]) => {
      setFormData(examData);
      const existingShifts = shiftsData.shifts || [];
      setShifts(existingShifts);
      setShiftForms(
        existingShifts.map((s) => ({
          _id: s._id,
          shiftName: s.shiftName,
          date: s.date ? new Date(s.date).toISOString().split("T")[0] : "",
          startTime: s.startTime || "",
          endTime: s.endTime || "",
        }))
      );
      setLoading(false);
    });
  }, [id]);

  const updateShiftField = (idx, field, value) => {
    setShiftForms((prev) => {
      const copy = [...prev];
      copy[idx] = { ...copy[idx], [field]: value };
      return copy;
    });
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    setSaving(true);

    // 1. Update exam
    const examRes = await fetch(`/api/exams/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(formData)
    });

    // 2. Update each shift via its API
    const shiftUpdates = shiftForms.map((sf) =>
      fetch(`/api/shifts/${sf._id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          shiftName: sf.shiftName,
          date: sf.date,
          startTime: sf.startTime,
          endTime: sf.endTime || undefined,
        }),
      })
    );

    await Promise.all(shiftUpdates);

    setSaving(false);
    if (examRes.ok) {
      toast.success("Exam & Shift updated.");
      router.push(`/dashboard/exams/${id}`);
    } else {
      toast.error("Failed to update exam.");
    }
  };

  if (loading) return <div className="flex h-screen items-center justify-center"><Loader2 className="animate-spin" /></div>;

  return (
    <div className="w-full py-12 px-6">
      <div className="flex items-center gap-4 mb-10">
        <Button variant="ghost" size="icon" onClick={() => router.push(`/dashboard/exams/${id}`)} className="rounded-full">
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h1 className="text-3xl font-black tracking-tight uppercase italic">Modify Exam</h1>
      </div>

      <div className="rounded border p-4">
        <form onSubmit={handleUpdate} className="space-y-8">
          {/* Exam Name */}
          <div className="space-y-2">
            <Label className="font-black uppercase">Exam Name</Label>
            <Input value={formData.examName} onChange={(e) => setFormData({...formData, examName: e.target.value})} />
          </div>

          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label className="font-black uppercase">Session Year</Label>
              <Input type="number" value={formData.examYear} onChange={(e) => setFormData({...formData, examYear: e.target.value})} />
            </div>
            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase">Visibility Status</Label>
              <Select value={formData.status} onValueChange={(val) => setFormData({...formData, status: val})}>
                <SelectTrigger className="rounded">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="DRAFT">DRAFT</SelectItem>
                  <SelectItem value="PUBLISHED">PUBLISHED</SelectItem>
                  <SelectItem value="ARCHIVED">ARCHIVED</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase">Duration (Min)</Label>
              <Input type="number" value={formData.duration} onChange={(e) => setFormData({...formData, duration: e.target.value})}/>
            </div>
            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase">Total Marks</Label>
              <Input type="number" value={formData.totalMarks} onChange={(e) => setFormData({...formData, totalMarks: e.target.value})}/>
            </div>
          </div>

          {/* --- SHIFT EDITING --- */}
          {shiftForms.length > 0 && (
            <>
              <Separator />
              <div className="space-y-6">
                <div className="flex items-center gap-2">
                  <Sun className="h-4 w-4 text-amber-500" />
                  <span className="text-sm font-black uppercase tracking-widest">Shift Details</span>
                </div>

                {shiftForms.map((sf, idx) => (
                  <div key={sf._id} className="rounded-lg border p-4 space-y-4 bg-muted/10">
                    <div className="grid grid-cols-2 gap-4">
                      {/* Shift Name */}
                      <div className="space-y-2">
                        <Label className="text-[10px] font-black uppercase">Shift</Label>
                        <Select
                          value={sf.shiftName}
                          onValueChange={(val) => updateShiftField(idx, "shiftName", val)}
                        >
                          <SelectTrigger className="rounded">
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

                      {/* Date */}
                      <div className="space-y-2">
                        <Label className="text-[10px] font-black uppercase">Shift Date</Label>
                        <Input
                          type="date"
                          value={sf.date}
                          onChange={(e) => updateShiftField(idx, "date", e.target.value)}
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      {/* Start Time */}
                      <div className="space-y-2">
                        <Label className="text-[10px] font-black uppercase">Start Time</Label>
                        <Input
                          type="time"
                          value={sf.startTime}
                          onChange={(e) => updateShiftField(idx, "startTime", e.target.value)}
                        />
                      </div>

                      {/* End Time */}
                      <div className="space-y-2">
                        <Label className="text-[10px] font-black uppercase">End Time (Optional)</Label>
                        <Input
                          type="time"
                          value={sf.endTime}
                          onChange={(e) => updateShiftField(idx, "endTime", e.target.value)}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}

          <Button type="submit" className="w-full" disabled={saving}>
            {saving ? <Loader2 className="animate-spin" /> : <><Save className="mr-2 h-4 w-4" /> Save Exam &amp; Shift</>}
          </Button>
        </form>
      </div>
    </div>
  );
}