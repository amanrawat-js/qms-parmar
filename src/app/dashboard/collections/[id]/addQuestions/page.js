"use client";

import React, { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import { 
  Search, ArrowLeft, Save, Filter, 
  CheckCircle2, Plus, X, Loader2, ChevronRight 
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";

export default function AddQuestionsPage({ params: paramsPromise }) {
  const params = use(paramsPromise);
  const router = useRouter();
  
  // State for the Question Bank (Search Results)
  const [bank, setBank] = useState([]);
  const [searching, setSearching] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  // State for the Collection (Selected Items)
  const [selectedIds, setSelectedIds] = useState([]);
  const [saving, setSaving] = useState(false);

  // Filter States
  const [subjects, setSubjects] = useState([]);
  const [topics, setTopics] = useState([]);
  const [filters, setFilters] = useState({
    search: "",
    subject: "",
    topic: "",
    tags: "",
    page: 1
  });

  // 1. Initial Load: Fetch Collection & Base Lists
  useEffect(() => {
    const init = async () => {
      const [colRes, subRes] = await Promise.all([
        fetch(`/api/collections/${params.id}`),
        fetch("/api/subjects?activeOnly=true")
      ]);
      const colData = await colRes.json();
      const subData = await subRes.json();
      
      setSelectedIds(colData.questions?.map(q => q._id) || []);
      setSubjects(subData.subjects || []);
    };
    init();
  }, [params.id]);

  // 2. Fetch Topics when Subject changes
  const handleSubjectChange = async (val) => {
    setFilters({ ...filters, subject: val, topic: "" });
    if (val) {
      const res = await fetch(`/api/topics?subjectId=${val}&activeOnly=true`);
      const data = await res.json();
      setTopics(data.topics || []);
    } else {
      setTopics([]);
    }
  };

  // 3. Search Handler
  const getQuestions = async () => {
    setSearching(true);
    setHasSearched(true);
    try {
      const query = new URLSearchParams(filters).toString();
      const res = await fetch(`/api/questions?${query}`);
      const data = await res.json();
      setBank(data.questions || []);
    } catch (error) {
      console.error(error);
    } finally {
      setSearching(false);
    }
  };

  // 4. Selection Logic
  const toggleSelect = (id) => {
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const handleSaveCollection = async () => {
    setSaving(true);
    try {
      await fetch(`/api/collections/${params.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ questions: selectedIds }),
      });
      router.push(`/dashboard/collections/${params.id}`);
    } catch (error) {
      console.error(error);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between border-b pb-4">
        <div className="flex items-center gap-4">
          <Link href={`/dashboard/collections/${params.id}`}>
            <Button variant="outline" size="icon"><ArrowLeft className="h-4 w-4" /></Button>
          </Link>
          <h1 className="text-2xl font-bold">Manage Collection Questions</h1>
        </div>
        <div className="flex items-center gap-4">
          <Badge variant="secondary" className="px-3 py-1 text-sm">
            {selectedIds.length} Selected
          </Badge>
          <Button onClick={handleSaveCollection} disabled={saving} className="gap-2 bg-emerald-600 hover:bg-emerald-700">
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            Save Collection
          </Button>
        </div>
      </div>

      {/* SEARCH FORM SECTION */}
      
      <div className="bg-card border rounded-xl p-6 shadow-sm space-y-4">
        <div className="flex items-center gap-2 text-primary font-bold uppercase text-xs tracking-widest">
          <Filter className="h-4 w-4" /> Filter Bank
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="space-y-1">
            <label className="text-[10px] font-bold uppercase text-muted-foreground">Keyword</label>
            <Input 
              placeholder="Search text..." 
              value={filters.search} 
              onChange={(e) => setFilters({...filters, search: e.target.value})}
            />
          </div>
          <div className="space-y-1">
            <label className="text-[10px] font-bold uppercase text-muted-foreground">Subject</label>
            <select 
              className="w-full h-10 px-3 border rounded-md text-sm bg-background"
              value={filters.subject}
              onChange={(e) => handleSubjectChange(e.target.value)}
            >
              <option value="">All Subjects</option>
              {subjects.map(s => <option key={s._id} value={s._id}>{s.subjectName}</option>)}
            </select>
          </div>
          <div className="space-y-1">
            <label className="text-[10px] font-bold uppercase text-muted-foreground">Topic</label>
            <select 
              className="w-full h-10 px-3 border rounded-md text-sm bg-background"
              value={filters.topic}
              onChange={(e) => setFilters({...filters, topic: e.target.value})}
              disabled={!filters.subject}
            >
              <option value="">All Topics</option>
              {topics.map(t => <option key={t._id} value={t._id}>{t.topicName}</option>)}
            </select>
          </div>
          <div className="space-y-1">
            <label className="text-[10px] font-bold uppercase text-muted-foreground">Tags</label>
            <Input 
              placeholder="PYQ, 2026..." 
              value={filters.tags} 
              onChange={(e) => setFilters({...filters, tags: e.target.value})}
            />
          </div>
        </div>
        <Button onClick={getQuestions} className="w-full gap-2" variant="secondary" disabled={searching}>
          {searching ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
          Get Questions
        </Button>
      </div>

      {/* SEARCH RESULTS LIST */}
      
      {hasSearched && (
        <div className="space-y-4 animate-in fade-in slide-in-from-top-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold uppercase text-muted-foreground tracking-tighter">
              Search Results ({bank.length})
            </h2>
          </div>
          
          {bank.length === 0 ? (
            <div className="text-center p-12 border-2 border-dashed rounded-xl text-muted-foreground">
              No questions found matching your criteria.
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-3">
              {bank.map((q) => (
                <div 
                  key={q._id}
                  onClick={() => toggleSelect(q._id)}
                  className={`flex items-center justify-between p-4 rounded-xl border transition-all cursor-pointer ${
                    selectedIds.includes(q._id) 
                    ? "bg-primary/5 border-primary ring-1 ring-primary" 
                    : "bg-card hover:border-primary/50"
                  }`}
                >
                  <div className="flex gap-4 items-center overflow-hidden">
                    <div className={`h-6 w-6 rounded-full border flex items-center justify-center shrink-0 ${
                      selectedIds.includes(q._id) ? "bg-primary border-primary" : "bg-background"
                    }`}>
                      {selectedIds.includes(q._id) && <CheckCircle2 className="h-4 w-4 text-white" />}
                    </div>
                    <div>
                      <div className="flex gap-2 items-center mb-1">
                        <Badge variant="outline" className="text-[9px] h-4 uppercase font-bold">{q.code}</Badge>
                        <span className="text-[10px] text-muted-foreground uppercase">{q.difficulty}</span>
                      </div>
                      <p className="text-sm font-medium line-clamp-1">{q.content?.en?.text || q.content?.hi?.text}</p>
                    </div>
                  </div>
                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}