"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Clock, Target, Calendar, Edit, ShieldCheck, Loader2, Sun, Moon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export default function ViewExamPage({ params }) {
  const { id } = use(params);
  const router = useRouter();
  const [exam, setExam] = useState(null);
  const [shifts, setShifts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch(`/api/exams/${id}`).then((res) => res.json()),
      fetch(`/api/shifts?examId=${id}`).then((res) => res.json()),
    ]).then(([examData, shiftsData]) => {
      setExam(examData);
      setShifts(shiftsData.shifts || []);
      setLoading(false);
    });
  }, [id]);

  if (loading) return <div className="flex h-screen items-center justify-center"><Loader2 className="animate-spin" /></div>;

  const shiftIcon = (name) => {
    const n = name?.toLowerCase() || "";
    if (n.includes("morning")) return <Sun className="h-3.5 w-3.5 text-amber-400" />;
    if (n.includes("evening") || n.includes("night")) return <Moon className="h-3.5 w-3.5 text-indigo-400" />;
    return <Clock className="h-3.5 w-3.5 text-muted-foreground" />;
  };

  return (
    <div className="relative min-h-[80vh] flex items-center p-6 w-full">

      <div className="w-full space-y-6">
        <div className="flex items-center justify-between">
          <Button variant="ghost" onClick={() => router.push(`/dashboard/exams`)} className="text-muted-foreground hover:text-white">
            <ArrowLeft className="mr-2 h-4 w-4" /> Back Exam List
          </Button>
          <Button onClick={() => router.push(`/dashboard/exams/${id}/edit`)}>
            <Edit className="mr-2 h-4 w-4" /> Edit Exam
          </Button>
        </div>

        <div className="rounded-xl border p-10">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-12">
            <div>
              <Badge variant="outline" className="border-primary/50 mb-4 text-primary bg-secondary uppercase tracking-[0.2em] font-mono text-[10px]">
                {exam.board?.boardShortName} • {exam.examYear}
              </Badge>
              <h1 className="text-4xl font-black tracking-tighter uppercase">{exam.examName}</h1>
            </div>
            <Badge className={exam.status === 'PUBLISHED' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-amber-500/20 text-amber-400'}>
              {exam.status}
            </Badge>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="space-y-2">
              <p className="text-[10px] font-bold uppercase tracking-widest flex items-center gap-2"><Clock className="h-3 w-3" /> Duration</p>
              <p className="text-xl font-bold">{exam.duration} Minutes</p>
            </div>
            <div className="space-y-2">
              <p className="text-[10px] font-bold uppercase tracking-widest flex items-center gap-2"><Target className="h-3 w-3" /> Total Marks</p>
              <p className="text-xl font-bold">{exam.totalMarks}</p>
            </div>
            <div className="space-y-2">
              <p className="text-[10px] font-bold uppercase tracking-widest flex items-center gap-2"><Calendar className="h-3 w-3" /> Registration</p>
              <p className="text-xl font-bold">{new Date(exam.createdAt).toLocaleDateString()}</p>
            </div>
            {/* Shift Column */}
            <div className="space-y-2">
              <p className="text-[10px] font-bold uppercase tracking-widest flex items-center gap-2">
                <Sun className="h-3 w-3" /> Shift
              </p>
              {shifts.length === 0 ? (
                <p className="text-sm text-muted-foreground italic">No shifts assigned</p>
              ) : (
                <div className="flex flex-col gap-2">
                  {shifts.map((shift) => (
                    <div key={shift._id} className="flex flex-col">
                      <div className="flex items-center gap-1.5 text-xl font-bold">
                        {shiftIcon(shift.shiftName)}
                        {shift.shiftName}
                      </div>
                      <span className="text-xs text-muted-foreground mt-0.5">
                        {new Date(shift.date).toLocaleDateString()} • {shift.startTime}
                        {shift.endTime ? ` – ${shift.endTime}` : ""}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="mt-12 pt-8 border-t border-white/5 flex items-center gap-4">
            <ShieldCheck className="h-5 w-5" />
            <p className="text-xs italic">This exam structure is verified and encrypted within the system vault.</p>
          </div>
        </div>
      </div>
    </div>
  );
}