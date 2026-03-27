"use client";

import React, { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import { Save, ArrowLeft, Settings2, ShieldCheck, Clock, Trophy, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import Link from "next/link";

export default function EditCollectionPage({ params: paramsPromise }) {
  const params = use(paramsPromise);
  const router = useRouter();
  
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  
  const [exams, setExams] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [topics, setTopics] = useState([]);

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    category: "",
    exam: "",
    subject: "",
    topic: "",
    settings: {
      totalDuration: 0,
      totalMarks: 0,
      isPublic: false,
    },
  });

  // 1. Rehydrate Form and Fetch Base Lists
  useEffect(() => {
    const loadData = async () => {
      try {
        const [colRes, exRes, subRes] = await Promise.all([
          fetch(`/api/collections/${params.id}`),
          fetch("/api/exams?publishedOnly=true"),
          fetch("/api/subjects?activeOnly=true")
        ]);

        const collection = await colRes.json();
        const examsData = await exRes.json();
        const subjectsData = await subRes.json();

        setExams(examsData.exams || []);
        setSubjects(subjectsData.subjects || []);

        // Populate Form
        setFormData({
          title: collection.title || "",
          description: collection.description || "",
          category: collection.category || "MOCK_TEST",
          exam: collection.exam?._id || collection.exam || "",
          subject: collection.subject?._id || collection.subject || "",
          topic: collection.topic?._id || collection.topic || "",
          settings: {
            totalDuration: collection.settings?.totalDuration || 60,
            totalMarks: collection.settings?.totalMarks || 100,
            isPublic: collection.settings?.isPublic ?? true,
          }
        });

        // Fetch topics if a subject was already selected
        const subjectId = collection.subject?._id || collection.subject;
        if (subjectId) {
          const tRes = await fetch(`/api/topics?subjectId=${subjectId}&activeOnly=true`);
          const tData = await tRes.json();
          setTopics(tData.topics || []);
        }

      } catch (err) {
        console.error("Initialization failed", err);
      } finally {
        setFetching(false);
      }
    };
    loadData();
  }, [params.id]);

  // 2. Event Handlers
  const handleRootChange = async (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));

    if (name === "subject") {
      setTopics([]);
      setFormData(prev => ({ ...prev, topic: "" }));
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
      const res = await fetch(`/api/collections/${params.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (res.ok) {
        router.push(`/dashboard/collections/${params.id}`);
        router.refresh();
      }
    } catch (err) {
      console.error("Update failed", err);
    } finally {
      setLoading(false);
    }
  };

  if (fetching) return (
    <div className="h-96 flex items-center justify-center">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
    </div>
  );

  return (
    <form onSubmit={handleSubmit} className="max-w-6xl space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between border-b pb-6">
        <div className="flex items-center gap-4">
          <Link href={`/dashboard/collections/${params.id}`}>
            <Button variant="outline" size="icon"><ArrowLeft className="h-4 w-4" /></Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Edit Collection</h1>
            <p className="text-sm text-muted-foreground">Modify metadata and test parameters.</p>
          </div>
        </div>
        <Button type="submit" disabled={loading} className="px-8 gap-2">
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          Update Changes
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-card p-6 border rounded-xl shadow-sm space-y-4">
            <h2 className="text-sm font-bold uppercase tracking-widest text-primary/70 flex items-center gap-2">
              <Settings2 className="h-4 w-4" /> General Settings
            </h2>
            
            <div className="space-y-2">
              <Label>Collection Title</Label>
              <Input 
                value={formData.title} 
                onChange={(e) => setFormData({...formData, title: e.target.value})} 
                required 
              />
            </div>

            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea 
                value={formData.description} 
                onChange={(e) => setFormData({...formData, description: e.target.value})} 
                rows={4}
              />
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
                <select name="exam" value={formData.exam} onChange={handleRootChange} className="w-full p-2 border rounded-md text-sm bg-background">
                  <option value="">Select Exam</option>
                  {exams.map(ex => <option key={ex._id} value={ex._id}>{ex.examName}</option>)}
                </select>
              </div>
              <div className="space-y-2">
                <Label>Subject</Label>
                <select name="subject" value={formData.subject} onChange={handleRootChange} className="w-full p-2 border rounded-md text-sm bg-background">
                  <option value="">Select Subject</option>
                  {subjects.map(sub => <option key={sub._id} value={sub._id}>{sub.subjectName}</option>)}
                </select>
              </div>
              <div className="space-y-2">
                <Label>Topic</Label>
                <select name="topic" value={formData.topic} onChange={handleRootChange} className="w-full p-2 border rounded-md text-sm bg-background" disabled={!formData.subject}>
                  <option value="">Select Topic</option>
                  {topics.map(tp => <option key={tp._id} value={tp._id}>{tp.topicName}</option>)}
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar Settings */}
        <div className="space-y-6">
          <div className="bg-muted/40 p-6 border rounded-xl space-y-6 shadow-inner h-fit">
            <h3 className="font-bold flex items-center gap-2 text-xs uppercase tracking-widest text-muted-foreground border-b pb-2">
              <ShieldCheck className="h-4 w-4" /> Parameters
            </h3>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label className="flex items-center gap-2"><Clock className="h-3 w-3" /> Duration (Min)</Label>
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
                <div className="space-y-1">
                  <Label>Public Access</Label>
                  <p className="text-[10px] text-muted-foreground leading-tight">Visible to students on the portal.</p>
                </div>
                <Switch 
                  checked={formData.settings.isPublic}
                  onCheckedChange={(val) => handleSettingsChange("isPublic", val)}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </form>
  );
}