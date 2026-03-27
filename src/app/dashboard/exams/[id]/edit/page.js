"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import { Save, Loader2, ArrowLeft } from "lucide-react";
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
  const [shiftForms, setShiftForms] = useState([]);

  useEffect(() => {
    Promise.all([
      fetch(`/api/exams/${id}`).then(res => res.json()),
      fetch(`/api/shifts?examId=${id}`).then(res => res.json()),
    ]).then(([examData, shiftsData]) => {
      setFormData(examData);
      const existingShifts = shiftsData.shifts || [];

      // Parse each shiftLabel back into editable fields
      setShiftForms(
        existingShifts.map((s) => {
          const parsed = parseShiftLabel(s.shiftLabel || "");
          return {
            _id: s._id,
            date: parsed.date,
            startTime: parsed.startTime,
            endTime: parsed.endTime,
          };
        })
      );
      setLoading(false);
    });
  }, [id]);

  // Parse "DD/MM/YYYY | H:MM AM – H:MM PM" → { date (YYYY-MM-DD), startTime (HH:mm), endTime (HH:mm) }
  const parseShiftLabel = (label) => {
    const result = { date: "", startTime: "", endTime: "" };
    if (!label) return result;

    const parts = label.split("|").map(s => s.trim());
    if (parts[0]) {
      const [d, m, y] = parts[0].split("/");
      if (d && m && y) result.date = `${y}-${m.padStart(2, "0")}-${d.padStart(2, "0")}`;
    }
    if (parts[1]) {
      const timeParts = parts[1].split("–").map(s => s.trim());
      result.startTime = to24(timeParts[0] || "");
      result.endTime = timeParts[1] ? to24(timeParts[1]) : "";
    }
    return result;
  };

  const to24 = (t) => {
    if (!t) return "";
    const match = t.match(/(\d{1,2}):(\d{2})\s*(AM|PM)/i);
    if (!match) return t;
    let h = parseInt(match[1], 10);
    const m = match[2];
    const meridian = match[3].toUpperCase();
    if (meridian === "PM" && h !== 12) h += 12;
    if (meridian === "AM" && h === 12) h = 0;
    return `${h.toString().padStart(2, "0")}:${m}`;
  };

  const to12 = (t) => {
    if (!t) return "";
    let [h, min] = t.split(":");
    h = parseInt(h, 10);
    const meridian = h >= 12 ? "PM" : "AM";
    if (h > 12) h -= 12;
    if (h === 0) h = 12;
    return `${h}:${min} ${meridian}`;
  };

  const buildShiftLabel = (sf) => {
    if (!sf.date) return "";
    const [y, m, d] = sf.date.split("-");
    const dateStr = `${d}/${m}/${y}`;
    const start12 = to12(sf.startTime);
    const end12 = sf.endTime ? to12(sf.endTime) : "";
    return end12 ? `${dateStr} | ${start12} – ${end12}` : `${dateStr} | ${start12}`;
  };

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

    // 2. Update each shift
    const shiftUpdates = shiftForms.map((sf) =>
      fetch(`/api/shifts/${sf._id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          shiftLabel: buildShiftLabel(sf),
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
    <div className="w-full py-2 px-6">
      <div className="flex items-center gap-4 mb-8">
        <Button variant="ghost" size="icon" onClick={() => router.push(`/dashboard/exams/${id}`)} className="rounded-full">
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h1 className="text-3xl font-black tracking-tight uppercase italic">Modify Exam</h1>
      </div>

      <div className="rounded border p-4">
        <form onSubmit={handleUpdate} className="space-y-8">
          <div className="space-y-3">
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
                <p className="text-sm font-black uppercase tracking-widest mb-4">Shift Details</p>

                {shiftForms.map((sf, idx) => (
                  <div key={sf._id} className="rounded-lg border p-4 space-y-4 bg-muted/10">
                    <div className="grid grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <Label className="text-[10px] font-black uppercase">Shift Date</Label>
                        <Input
                          type="date"
                          value={sf.date}
                          onChange={(e) => updateShiftField(idx, "date", e.target.value)}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-[10px] font-black uppercase">Start Time</Label>
                        <Input
                          type="time"
                          value={sf.startTime}
                          onChange={(e) => updateShiftField(idx, "startTime", e.target.value)}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-[10px] font-black uppercase">End Time</Label>
                        <Input
                          type="time"
                          value={sf.endTime}
                          onChange={(e) => updateShiftField(idx, "endTime", e.target.value)}
                        />
                      </div>
                    </div>
                    {/* Live preview */}
                    <div className="p-2 rounded bg-primary/5 border border-dashed border-primary/20 font-mono text-[11px] text-primary/80">
                      {buildShiftLabel(sf)}
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