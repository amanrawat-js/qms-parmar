"use client";

import React, { useState, useEffect, use } from "react";
import Link from "next/link";
import { ArrowLeft, Edit, Globe, Tag as TagIcon, Calendar, BookOpen, Layers, Languages } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LANGUAGE_OPTIONS, LANGUAGES } from "@/enums/language";

export default function ViewQuestionPage({ params: paramsPromise }) {
  const params = use(paramsPromise);
  const [question, setQuestion] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchQuestion = async () => {
      try {
        const res = await fetch(`/api/questions/${params.id}`);
        const data = await res.json();
        setQuestion(data);
      } catch (err) {
        console.error("Failed to fetch question:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchQuestion();
  }, [params.id]);

  if (loading) return <div className="p-10 text-center animate-pulse">Loading Question Details...</div>;
  if (!question) return <div className="p-10 text-center text-rose-500">Question not found.</div>;

  return (
    <div className="space-y-6">

      {/* Header Action Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b pb-6">
        <div className="flex items-center gap-4">
          <Link href="/dashboard/questions">
            <Button variant="outline" size="icon"><ArrowLeft className="h-4 w-4" /></Button>
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold">Question Details</h1>
              <Badge variant="secondary" className="font-mono uppercase">{question.id}</Badge>
            </div>
            <p className="text-sm text-muted-foreground">Created on {new Date(question.createdAt).toLocaleDateString()}</p>
          </div>
        </div>
        <Link href={`/dashboard/questions/${params.id}/edit`}>
          <Button className="cursor-pointer gap-2">
            <Edit className="h-4 w-4" /> Edit Question
          </Button>
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

        {/* Left Column: Content Display */}
        <div className="lg:col-span-2 space-y-6">
          <Tabs defaultValue={LANGUAGES.ENGLISH}>
            <TabsList className="flex w-full overflow-x-auto bg-muted/50 p-1">
              {LANGUAGE_OPTIONS.filter(l => question.availableLanguages?.includes(l.code)).map((lang) => (
                <TabsTrigger 
                  key={lang.code} 
                  value={lang.code} 
                  className="flex-1 gap-2"
                >
                 <Languages className="h-3 w-3" /> {lang.label}
                </TabsTrigger>
              ))}
            </TabsList>

            

            {Object.keys(question.content || {}).map((langCode) => (
              <TabsContent key={langCode} value={langCode} className="mt-0 space-y-8 animate-in fade-in slide-in-from-bottom-2">
                
                {/* Passage Section */}
                {question.content[langCode].passage && (
                  <div className="bg-muted/30 border-l-4 border-primary p-6 rounded-r-lg">
                    <h4 className="text-xs font-bold uppercase text-primary mb-2">Passage / Context</h4>
                    <p className="text-sm leading-relaxed whitespace-pre-wrap overflow-x-auto">{question.content[langCode].passage}</p>
                  </div>
                )}

                {/* Question Text */}
                <div className="space-y-4">
                  <h4 className="text-xs font-bold uppercase text-muted-foreground">Question</h4>
                  <p className="text-xl font-medium leading-snug overflow-x-auto">{question.content[langCode].text}</p>
                </div>

                {/* Options Section */}
                <div className="grid gap-3">
                  <h4 className="text-xs font-bold uppercase text-muted-foreground mb-1">Options</h4>
                  {question.content[langCode].options.map((opt, idx) => (
                      <div 
                        key={idx} 
                        className={`flex items-start gap-4 p-4 rounded-xl border transition-all ${
                          opt.correctOption 
                          ? "bg-emerald-500/10 border-emerald-500 ring-1 ring-emerald-500" 
                          : "bg-background border-border"
                        }`}
                      >
                        <div className={`flex items-center justify-center h-6 w-6 rounded-full text-xs font-bold shrink-0 mt-0.5 ${
                          opt.correctOption ? "bg-emerald-500 text-white" : "bg-muted text-muted-foreground"
                        }`}>
                          {String.fromCharCode(65 + idx)}
                        </div>
                        <p className="text-sm font-medium overflow-x-auto">{opt.text}</p>
                      </div>
                  ))}
                </div>

                {/* Solution Section */}
                {(question.content[langCode].solution || question.content[langCode].description) && (
                  <div className="pt-8 border-t space-y-6">
                    {question.content[langCode].solution && (
                      <div className="space-y-2">
                        <h4 className="text-xs font-bold uppercase text-emerald-600">Step-by-step Solution</h4>
                        <div className="p-4 bg-emerald-50/50 rounded-lg text-sm border border-emerald-100 whitespace-pre-wrap overflow-x-auto">
                          {question.content[langCode].solution}
                        </div>
                      </div>
                    )}
                    {question.content[langCode].description && (
                      <div className="space-y-2">
                        <h4 className="text-xs font-bold uppercase text-blue-600">Additional Information</h4>
                        <p className="text-sm text-muted-foreground italic">{question.content[langCode].description}</p>
                      </div>
                    )}
                  </div>
                )}
              </TabsContent>
            ))}
          </Tabs>
        </div>

        {/* Right Column: Metadata Sidebar */}
        <div className="space-y-6">
          <div className="bg-card border rounded-xl p-5 space-y-4 shadow-sm">
            <h3 className="text-sm font-bold uppercase text-primary/70 tracking-wider flex items-center gap-2">
              <Layers className="h-4 w-4" /> Logistics
            </h3>
            <div className="space-y-3">
              <div className="flex flex-col">
                <span className="text-[10px] uppercase font-bold text-muted-foreground">Exam</span>
                <span className="text-sm font-medium">{question.exam?.examName || "N/A"}</span>
              </div>
              <div className="flex flex-col">
                <span className="text-[10px] uppercase font-bold text-muted-foreground">Shift</span>
                <span className="text-sm font-medium">{question.shift?.shiftLabel || "N/A"}</span>
              </div>
              <div className="flex flex-col border-t pt-3">
                <span className="text-[10px] uppercase font-bold text-muted-foreground">Subject</span>
                <span className="text-sm font-medium">{question.subject?.subjectName || "N/A"}</span>
              </div>
              <div className="flex flex-col">
                <span className="text-[10px] uppercase font-bold text-muted-foreground">Topic</span>
                <span className="text-sm font-medium">{question.topic?.topicName || "N/A"}</span>
              </div>
            </div>
          </div>

          <div className="bg-card border rounded-xl p-5 space-y-4 shadow-sm">
            <h3 className="text-sm font-bold uppercase text-primary/70 tracking-wider flex items-center gap-2">
              <TagIcon className="h-4 w-4" /> Tags & Difficulty
            </h3>
            <div className="flex flex-wrap gap-2">
              <Badge className={
                question.difficulty === 'HARD' ? "bg-rose-500" : 
                question.difficulty === 'MEDIUM' ? "bg-amber-500" : "bg-emerald-500"
              }>
                {question.difficulty}
              </Badge>
              {question.tags?.map(tag => (
                <Badge key={tag} variant="outline" className="bg-background">{tag}</Badge>
              ))}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}