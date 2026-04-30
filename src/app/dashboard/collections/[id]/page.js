"use client";
import React, { useState, useEffect, use } from "react";
import { ArrowLeft, Plus, Trash2, ExternalLink, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";

const ITEMS_PER_PAGE = 10;

export default function CollectionSummaryPage({ params: paramsPromise }) {
  const params = use(paramsPromise);
  const [data, setData] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    fetch(`/api/collections/${params.id}`)
      .then(res => res.json())
      .then(setData);
  }, [params.id]);

  if (!data) return <div className="p-10 text-center">Loading...</div>;
  console.log("API DATA =>", data);

  const questions = data.questions || [];
  const totalPages = Math.ceil(questions.length / ITEMS_PER_PAGE);
  const startIdx = (currentPage - 1) * ITEMS_PER_PAGE;
  const paginatedQuestions = questions.slice(startIdx, startIdx + ITEMS_PER_PAGE);

  const getPageNumbers = () => {
    const pages = [];
    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      pages.push(1);
      if (currentPage > 3) pages.push("...");
      const s = Math.max(2, currentPage - 1);
      const e = Math.min(totalPages - 1, currentPage + 1);
      for (let i = s; i <= e; i++) pages.push(i);
      if (currentPage < totalPages - 2) pages.push("...");
      pages.push(totalPages);
    }
    return pages;
  };

  return (
    <div className="w-full mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/dashboard/collections"><Button variant="outline" size="icon"><ArrowLeft className="h-4 w-4" /></Button></Link>
          <h1 className="text-2xl font-bold">{data.title}</h1>
        </div>
        <Link href={`/dashboard/collections/${params.id}/addQuestions`}>
          <Button className="gap-2"><Plus className="h-4 w-4" /> Add/Manage Questions</Button>
        </Link>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-muted/30 p-6 rounded-xl border h-fit space-y-4">
          <h3 className="font-bold border-b pb-2">Stats</h3>
          <div className="flex justify-between text-sm"><span>Total Questions:</span><b>{questions.length}</b></div>
          <div className="flex justify-between text-sm"><span>Total Marks:</span><b>{data.settings?.totalMarks}</b></div>
          <div className="flex justify-between text-sm"><span>Duration:</span><b>{data.settings?.totalDuration} min</b></div>
          <Link href={`/dashboard/collections/${params.id}/edit`} className="block pt-4">
            <Button variant="outline" className="w-full">Edit Settings</Button>
          </Link>
        </div>

        <div className="md:col-span-2 space-y-4">
          <h2 className="text-sm font-bold uppercase text-muted-foreground tracking-widest">Question List</h2>
          <div className="border rounded-xl divide-y bg-card">
            {paginatedQuestions.map((q, idx) => (
              <div key={q._id} className="p-4 flex items-center justify-between hover:bg-muted/50 transition-colors">
                <div className="flex items-center gap-4 min-w-0">
                  <span className="text-muted-foreground font-mono text-xs shrink-0">{startIdx + idx + 1}.</span>
                  <div className="min-w-0">
                    <p className="text-sm font-medium line-clamp-1 truncate">{q.content?.en?.text || q.content?.hi?.text}</p>
                    <p className="text-[10px] text-primary uppercase font-bold truncate">{q.code}</p>
                  </div>
                </div>
                <Link href={`/dashboard/questions/${q._id}/edit`}>
                  <ExternalLink className="h-4 w-4 text-muted-foreground" />
                </Link>
              </div>
            ))}
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-end gap-1">
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8"
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(p => p - 1)}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>

              {getPageNumbers().map((page, i) =>
                page === "..." ? (
                  <span key={`ellipsis-${i}`} className="px-2 text-muted-foreground">...</span>
                ) : (
                  <Button
                    key={page}
                    variant={currentPage === page ? "default" : "outline"}
                    size="sm"
                    className="h-8 w-8 p-0"
                    onClick={() => setCurrentPage(page)}
                  >
                    {page}
                  </Button>
                )
              )}

              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8"
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage(p => p + 1)}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}