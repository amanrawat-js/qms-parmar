"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  Plus,
  Search,
  Edit,
  Trash2,
  ChevronRight,
  AlertCircle,
  Import,
  ChevronLeft,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { LANGUAGE_OPTIONS } from "@/enums/language";

export default function QuestionsPage() {
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [exams, setExams] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [shifts, setShifts] = useState([]);
  
  // Pagination State
  const [pagination, setPagination] = useState({
    total: 0,
    page: 1,
    limit: 10,
    pages: 1
  });

  const [filters, setFilters] = useState({
    examId: "",
    shiftId: "",
    subjectId: "",
    lang: "",
  });

  // Fetch exams and subjects for filter dropdowns
  useEffect(() => {
    fetch("/api/exams?publishedOnly=true").then(r => r.json()).then(d => setExams(d.exams || []));
    fetch("/api/subjects?activeOnly=true").then(r => r.json()).then(d => setSubjects(d.subjects || []));
  }, []);

  // Fetch Questions with Pagination
  const fetchQuestions = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        search,
        ...filters,
        page: pagination.page,
        limit: pagination.limit
      });
      const res = await fetch(`/api/questions?${params}`);
      const data = await res.json();
      
      setQuestions(data.questions || []);
      // Update pagination meta from server response
      if (data.pagination) {
        setPagination(prev => ({
          ...prev,
          total: data.pagination.total,
          pages: data.pagination.pages
        }));
      }
    } catch (error) {
      console.error("Failed to fetch questions", error);
    } finally {
      setLoading(false);
    }
  }, [search, filters, pagination.page, pagination.limit]);

  useEffect(() => {
    const delayDebounce = setTimeout(() => {
      fetchQuestions();
    }, 500);

    return () => clearTimeout(delayDebounce);
  }, [fetchQuestions]);

  // Reset to page 1 when filters or search change
  const handleFilterChange = async (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setPagination(prev => ({ ...prev, page: 1 }));

    // When exam changes, fetch shifts for that exam and reset shiftId
    if (key === "examId") {
      setShifts([]);
      setFilters(prev => ({ ...prev, examId: value, shiftId: "" }));
      if (value) {
        try {
          const res = await fetch(`/api/shifts?examId=${value}`);
          const data = await res.json();
          setShifts(data.shifts || []);
        } catch (err) {
          console.error("Failed to fetch shifts", err);
        }
      }
    }
  };

  const handleSearchChange = (e) => {
    setSearch(e.target.value);
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  return (
    <div className="space-y-6 pb-10">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Question Bank</h1>
          <p className="text-muted-foreground text-sm">
            Showing {questions.length} of {pagination.total} total questions.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link href="/dashboard/questions/import">
            <Button className="gap-2" variant="outline">
              <Import className="h-4 w-4" /> Import
            </Button>
          </Link>
          <Link href="/dashboard/questions/create">
            <Button className="gap-2">
              <Plus className="h-4 w-4" /> Add Question
            </Button>
          </Link>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4 bg-card p-4 rounded-xl border shadow-sm">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search code or text..."
            className="pl-9"
            value={search}
            onChange={handleSearchChange}
          />
        </div>

        <select
          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
          value={filters.lang}
          onChange={(e) => handleFilterChange("lang", e.target.value)}
        >
          <option value="">All Languages</option>
          {LANGUAGE_OPTIONS.map((lang) => (
            <option key={lang.code} value={lang.code}>
              {lang.label}
            </option>
          ))}
        </select>

        <select 
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            value={filters.examId}
            onChange={(e) => handleFilterChange("examId", e.target.value)}
        >
          <option value="">All Exams</option>
          {exams.map((ex) => (
            <option key={ex._id} value={ex._id}>{ex.examName}</option>
          ))}
        </select>

        <select 
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            value={filters.shiftId}
            onChange={(e) => handleFilterChange("shiftId", e.target.value)}
            disabled={!filters.examId}
        >
          <option value="">All Shifts</option>
          {shifts.map((sh) => (
            <option key={sh._id} value={sh._id}>{sh.shiftLabel}</option>
          ))}
        </select>

        <select 
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            value={filters.subjectId}
            onChange={(e) => handleFilterChange("subjectId", e.target.value)}
        >
          <option value="">All Subjects</option>
          {subjects.map((s) => (
            <option key={s._id} value={s._id}>{s.subjectName}</option>
          ))}
        </select>
      </div>

      {/* Table Section */}
      <div className="rounded-xl border bg-card shadow-sm">
        <div className="overflow-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-muted/50 text-muted-foreground font-medium border-b">
              <tr>
                <th className="p-4">Code & Question</th>
                <th className="p-4">Hierarchy</th>
                <th className="p-4">Languages</th>
                <th className="p-4">Status</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {loading ? (
                [...Array(5)].map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td colSpan={5} className="p-8 text-center text-muted-foreground italic">
                      Loading data...
                    </td>
                  </tr>
                ))
              ) : questions.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-12 text-center">
                    <p className="text-muted-foreground">No questions found.</p>
                  </td>
                </tr>
              ) : (
                questions.map((q) => (
                  <tr key={q._id} className="hover:bg-muted/30 transition-colors">
                    {/* ... same row content as your original code ... */}
                    <td className="p-4 max-w-md">
                      <div className="font-mono text-[10px] text-primary font-bold mb-1 uppercase">{q.code}</div>
                      <p className="line-clamp-2">{q.content?.en?.text || q.content?.hi?.text}</p>
                    </td>
                    <td className="p-4 text-xs">
                      <Badge variant="outline">{q.exam?.examName}</Badge>
                    </td>
                    <td className="p-4">
                      {q.availableLanguages?.map(l => (
                          <Badge key={l} variant="secondary" className="mr-1 uppercase text-[9px]">{l}</Badge>
                      ))}
                    </td>
                    <td className="p-4">
                      <Badge className={q.isActive ? "bg-emerald-500/10 text-emerald-600 shadow-none" : "bg-rose-500/10 text-rose-600 shadow-none"}>
                          {q.isActive ? "Active" : "Draft"}
                      </Badge>
                    </td>
                    <td className="p-4 text-right">
                      <div className="flex justify-end gap-2">
                          <Link href={`/dashboard/questions/${q._id}`}><Button variant="ghost" size="icon" className="h-8 w-8"><Edit className="h-4 w-4" /></Button></Link>
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-rose-500"><Trash2 className="h-4 w-4" /></Button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>


        {/* PAGINATION CONTROLS */}
        <div className="flex items-center justify-between p-4 bg-muted/20 border-t">
          <div className="text-xs text-muted-foreground">
            Page <strong>{pagination.page}</strong> of <strong>{pagination.pages}</strong>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              className="h-8 w-8 p-0"
              disabled={pagination.page <= 1 || loading}
              onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            
            <div className="flex items-center gap-1">
                {[...Array(pagination.pages)].map((_, i) => {
                    const pageNum = i + 1;
                    // Only show first, last, and pages around current
                    if (pageNum === 1 || pageNum === pagination.pages || (pageNum >= pagination.page - 1 && pageNum <= pagination.page + 1)) {
                        return (
                            <Button
                                key={pageNum}
                                variant={pagination.page === pageNum ? "default" : "outline"}
                                size="sm"
                                className="h-8 w-8 text-xs"
                                onClick={() => setPagination(prev => ({ ...prev, page: pageNum }))}
                            >
                                {pageNum}
                            </Button>
                        );
                    }
                    return null;
                })}
            </div>

            <Button
              variant="outline"
              size="sm"
              className="h-8 w-8 p-0"
              disabled={pagination.page >= pagination.pages || loading}
              onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}