"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Save, ArrowLeft, Settings2, Info, Calendar, Clock, Trophy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch"; // Shadcn Switch
import { Label } from "@/components/ui/label";
import Link from "next/link";

export default function CreateCollectionPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  
  // Lists for dropdowns
  const [exams, setExams] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [topics, setTopics] = useState([]);

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    category: "MOCK_TEST",
    exam: "",
    board: "",
    subject: "",
    topic: "",
    tags: [],
    settings: {
      totalDuration: 60,
      totalMarks: 100,
      isPublic: true,
    },
  });

  // Initial Data Fetch
  useEffect(() => {
    const fetchBaseData = async () => {
      const [exRes, subRes] = await Promise.all([
        fetch("/api/exams?publishedOnly=true"),
        fetch("/api/subjects?activeOnly=true")
      ]);
      const exData = await exRes.json();
      const subData = await subRes.json();
      setExams(exData.exams || []);
      setSubjects(subData.subjects || []);
    };
    fetchBaseData();
  }, []);

  const handleRootChange = async (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));

    // Fetch topics if subject changes
    if (name === "subject") {
      setTopics([]);
      if (value) {
        const res = await fetch(`/api/topics?subjectId=${value}&activeOnly=true`);
        const data = await res.json();
        setTopics(data.topics || []);
      }
    }
  };

  const handleSettingsChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      settings: { ...prev.settings, [field]: value }
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch("/api/collections", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (res.ok) {
        const data = await res.json();
        // Redirect to selection screen to pick questions for this new collection
        router.push(`/dashboard/collections/${data._id}/addQuestions`);
      }
    } catch (error) {
      console.error("Creation failed", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="p-6 max-w-5xl mx-auto space-y-6">
      {/* Top Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/dashboard/collections">
            <Button variant="outline" size="icon"><ArrowLeft className="h-4 w-4" /></Button>
          </Link>
          <h1 className="text-2xl font-bold tracking-tight">Create Collection</h1>
        </div>
        <Button type="submit" disabled={loading} className="px-8 gap-2">
          <Save className="h-4 w-4" /> {loading ? "Creating..." : "Create & Add Questions"}
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Side: General Info & Hierarchy */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-card p-6 border rounded-xl shadow-sm space-y-4">
            <div className="flex items-center gap-2 font-semibold text-primary border-b pb-2">
              <Info className="h-4 w-4" /> Basic Details
            </div>
            <div className="space-y-2">
              <Label>Collection Title</Label>
              <Input 
                placeholder="e.g. SSC CGL 2026 - Mathematics Full Mock" 
                value={formData.title}
                onChange={(e) => setFormData({...formData, title: e.target.value})}
                required
              />
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea 
                placeholder="Describe the purpose of this collection..." 
                value={formData.description}
                onChange={(e) => setFormData({...formData, description: e.target.value})}
              />
            </div>
          </div>

          <div className="bg-card p-6 border rounded-xl shadow-sm space-y-4">
            <div className="flex items-center gap-2 font-semibold text-primary border-b pb-2">
              <Settings2 className="h-4 w-4" /> Categorization & Hierarchy
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Category</Label>
                <select 
                  name="category"
                  className="w-full p-2 border rounded-md bg-background text-sm"
                  value={formData.category}
                  onChange={handleRootChange}
                >
                  <option value="MOCK_TEST">Mock Test</option>
                  <option value="PRACTICE_SET">Practice Set</option>
                  <option value="PREVIOUS_YEAR">Previous Year Paper</option>
                  <option value="EXPORT_BUNDLE">Export Bundle</option>
                </select>
              </div>
              <div className="space-y-2">
                <Label>Exam</Label>
                <select name="exam" onChange={handleRootChange} className="w-full p-2 border rounded-md text-sm bg-background">
                  <option value="">Select Exam</option>
                  {exams.map(ex => <option key={ex._id} value={ex._id}>{ex.examName}</option>)}
                </select>
              </div>
              <div className="space-y-2">
                <Label>Subject</Label>
                <select name="subject" onChange={handleRootChange} className="w-full p-2 border rounded-md text-sm bg-background">
                  <option value="">Select Subject</option>
                  {subjects.map(sub => <option key={sub._id} value={sub._id}>{sub.subjectName}</option>)}
                </select>
              </div>
              <div className="space-y-2">
                <Label>Topic</Label>
                <select name="topic" onChange={handleRootChange} className="w-full p-2 border rounded-md text-sm bg-background" disabled={!formData.subject}>
                  <option value="">Select Topic</option>
                  {topics.map(tp => <option key={tp._id} value={tp._id}>{tp.topicName}</option>)}
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side: Test Settings */}
        <div className="space-y-6">
          <div className="bg-muted/40 p-6 border rounded-xl space-y-6 h-fit shadow-inner">
            <h3 className="font-bold border-b pb-2 flex items-center gap-2 uppercase text-xs tracking-widest text-muted-foreground">
               Test Parameters
            </h3>
            
            <div className="space-y-4">
              <div className="space-y-2">
                <Label className="flex items-center gap-2"><Clock className="h-3 w-3" /> Duration (Mins)</Label>
                <Input 
                  type="number" 
                  value={formData.settings.totalDuration}
                  onChange={(e) => handleSettingsChange("totalDuration", e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label className="flex items-center gap-2"><Trophy className="h-3 w-3" /> Total Marks</Label>
                <Input 
                  type="number" 
                  value={formData.settings.totalMarks}
                  onChange={(e) => handleSettingsChange("totalMarks", e.target.value)}
                />
              </div>

              <div className="flex items-center justify-between pt-4 border-t">
                <div className="space-y-0.5">
                  <Label>Public Visibility</Label>
                  <p className="text-[10px] text-muted-foreground">Make this available to students</p>
                </div>
                <Switch 
                  checked={formData.settings.isPublic}
                  onCheckedChange={(val) => handleSettingsChange("isPublic", val)}
                />
              </div>
            </div>

            <div className="bg-primary/5 p-4 rounded-lg border border-primary/10">
              <p className="text-[11px] text-primary/80 leading-relaxed italic">
                * After creating the collection, you will be redirected to the question selector to choose specific questions from the bank.
              </p>
            </div>
          </div>
        </div>
      </div>
    </form>
  );
}