"use client";

import React, { useState, useEffect } from "react";
import { 
  Database, Layers, GraduationCap, BookOpen, 
  Plus, ArrowUpRight, CheckCircle, Clock, BarChart3, Building,
  TrendingUp, Sparkles, ChevronRight, Activity
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";

export default function DashboardPage() {
  const [stats, setStats] = useState({
    totalQuestions: 0,
    totalCollections: 0,
    totalExams: 0,
    totalSubjects: 0,
    recentQuestions: [],
    recentCollections: []
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const res = await fetch("/api/dashboard/stats");
        const data = await res.json();
        setStats(data);
      } catch (err) {
        console.error("Dashboard fetch error:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchDashboardData();
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col justify-center items-center h-[70vh] gap-4">
        <div className="relative">
          <div className="h-14 w-14 rounded-full border-4 border-primary/20 animate-spin border-t-primary" />
        </div>
        <p className="text-muted-foreground text-sm font-medium animate-pulse">Loading Dashboard...</p>
      </div>
    );
  }

  if (stats?.role === "REVIEWER") {
    return (
      <div className="space-y-8">
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-violet-600 via-purple-600 to-indigo-700 p-8 text-white shadow-xl">
          <div className="absolute -top-24 -right-24 h-64 w-64 rounded-full bg-white/10 blur-3xl" />
          <div className="absolute -bottom-32 -left-16 h-48 w-48 rounded-full bg-white/10 blur-3xl" />
          <div className="relative">
            <div className="flex items-center gap-2 mb-2">
              <Sparkles className="h-5 w-5 text-purple-200" />
              <span className="text-sm font-medium text-purple-200">Welcome back</span>
            </div>
            <h1 className="text-3xl font-bold tracking-tight mb-2">Reviewer Dashboard</h1>
            <p className="text-purple-100 max-w-xl">Monitor and review questions assigned to you. Stay on top of your evaluation tasks.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          <StatCard 
            title="Assigned Boards" 
            value={stats.totalBoards || 0} 
            icon={Building} 
            gradient="from-blue-500 to-cyan-500" 
            href="/dashboard/review"
          />
          <StatCard 
            title="Assigned Exams" 
            value={stats.totalExams || 0} 
            icon={GraduationCap} 
            gradient="from-purple-500 to-pink-500" 
            href="/dashboard/review"
          />
        </div>
      </div>
    );
  }

  if (stats?.role === "CONTENT_WRITER") {
    return (
      <div className="space-y-8">
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-600 via-teal-600 to-cyan-700 p-8 text-white shadow-xl">
          <div className="absolute -top-24 -right-24 h-64 w-64 rounded-full bg-white/10 blur-3xl" />
          <div className="absolute -bottom-32 -left-16 h-48 w-48 rounded-full bg-white/10 blur-3xl" />
          <div className="relative">
            <div className="flex items-center gap-2 mb-2">
              <Sparkles className="h-5 w-5 text-teal-200" />
              <span className="text-sm font-medium text-teal-200">Welcome back</span>
            </div>
            <h1 className="text-3xl font-bold tracking-tight mb-2">Writer Dashboard</h1>
            <p className="text-teal-100 max-w-xl">Create and manage your content. Track rejected questions and improve your submissions.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          <StatCard 
            title="Assigned Boards" 
            value={stats.totalBoards || 0} 
            icon={Building} 
            gradient="from-blue-500 to-cyan-500" 
            href="/dashboard/writer"
          />
          <StatCard 
            title="Assigned Exams" 
            value={stats.totalExams || 0} 
            icon={GraduationCap} 
            gradient="from-purple-500 to-pink-500" 
            href="/dashboard/writer"
          />
        </div>
      </div>
    );
  }

  const statCards = [
    { title: "Total Questions", value: stats.totalQuestions, icon: Database, gradient: "from-blue-500 to-indigo-600", link: "/dashboard/questions", trend: "+12%" },
    { title: "Collections", value: stats.totalCollections, icon: Layers, gradient: "from-emerald-500 to-teal-600", link: "/dashboard/collections", trend: "+5%" },
    { title: "Exams", value: stats.totalExams, icon: GraduationCap, gradient: "from-purple-500 to-pink-600", link: "/dashboard/exams", trend: "+8%" },
    { title: "Subjects", value: stats.totalSubjects, icon: BookOpen, gradient: "from-amber-500 to-orange-600", link: "/dashboard/subjects", trend: "+3%" },
  ];

  return (
    <div className="space-y-8">
      {/* Hero Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 dark:from-slate-800 dark:via-slate-700 dark:to-slate-900 p-8 text-white shadow-2xl">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4wMyI+PHBhdGggZD0iTTM2IDM0djItSDI0di0yaDEyek0zNiAyNHYySDI0di0yaDEyeiIvPjwvZz48L2c+PC9zdmc+')] opacity-50" />
        <div className="absolute -top-32 -right-32 h-96 w-96 rounded-full bg-blue-500/20 blur-3xl" />
        <div className="absolute -bottom-24 -left-24 h-72 w-72 rounded-full bg-purple-500/20 blur-3xl" />
        <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 backdrop-blur-sm border border-white/10">
                <Activity className="h-3.5 w-3.5 text-blue-400" />
                <span className="text-xs font-medium text-blue-300">System Active</span>
              </div>
            </div>
            <h1 className="text-3xl lg:text-4xl font-bold tracking-tight mb-2">Admin Dashboard</h1>
            <p className="text-slate-300 max-w-xl">Manage your entire question bank ecosystem from one centralized command center.</p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link href="/dashboard/questions/import">
              <Button variant="outline" className="cursor-pointer gap-2 bg-white/10 border-white/20 text-white hover:bg-white/20 hover:text-white backdrop-blur-sm">
                 Import Questions
              </Button>
            </Link>
            <Link href="/dashboard/questions/create">
              <Button className="cursor-pointer gap-2 bg-white text-slate-900 hover:bg-white/90 shadow-lg shadow-white/10">
                <Plus className="h-4 w-4" /> Add Question
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {statCards.map((stat, i) => (
          <Link href={stat.link} key={i}>
            <Card className="group relative overflow-hidden border border-border/60 bg-card/50 backdrop-blur-sm hover:shadow-lg hover:shadow-primary/5 transition-all duration-300 hover:-translate-y-1 cursor-pointer h-full">
              <div className={`absolute inset-0 bg-gradient-to-br ${stat.gradient} opacity-0 group-hover:opacity-5 transition-opacity duration-300`} />
              <CardContent className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className={`p-2.5 rounded-xl bg-gradient-to-br ${stat.gradient} shadow-lg`}>
                    <stat.icon className="h-5 w-5 text-white" />
                  </div>
                  <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20">
                    <TrendingUp className="h-3 w-3 text-emerald-500" />
                    <span className="text-[10px] font-semibold text-emerald-500">{stat.trend}</span>
                  </div>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-1">{stat.title}</p>
                  <h3 className="text-3xl font-bold tracking-tight">{loading ? "..." : stat.value.toLocaleString()}</h3>
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      {/* Activity Section */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Recent Collections */}
        <Card className="xl:col-span-2 border-border/60 bg-card/50 backdrop-blur-sm overflow-hidden">
          <CardHeader className="border-b border-border/50 pb-4">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-lg font-semibold flex items-center gap-2">
                  <Layers className="h-5 w-5 text-emerald-500" />
                  Recent Collections
                </CardTitle>
                <CardDescription className="mt-1">Latest mock tests and practice sets</CardDescription>
              </div>
              <Link href="/dashboard/collections">
                <Button variant="ghost" size="sm" className="gap-1 text-primary hover:text-primary/80 group/link">
                  View All
                  <ChevronRight className="h-4 w-4 transition-transform group-hover/link:translate-x-0.5" />
                </Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y divide-border/50">
              {stats.recentCollections.map((col) => (
                <Link 
                  key={col._id} 
                  href={`/dashboard/collections/${col._id}`}
                  className="group flex items-center justify-between p-4 hover:bg-muted/30 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div className="h-11 w-11 rounded-xl bg-gradient-to-br from-emerald-500/10 to-teal-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-600 dark:text-emerald-400 group-hover:scale-105 transition-transform">
                      <Layers className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold group-hover:text-primary transition-colors">{col.title}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        <span className="uppercase tracking-wide">{col.category}</span>
                        <span className="mx-1.5 text-border">•</span>
                        <span>{col.questions?.length || 0} Questions</span>
                      </p>
                    </div>
                  </div>
                  <ArrowUpRight className="h-4 w-4 text-muted-foreground/50 group-hover:text-primary group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all" />
                </Link>
              ))}
              {stats.recentCollections.length === 0 && (
                <div className="p-8 text-center">
                  <Layers className="h-10 w-10 text-muted-foreground/30 mx-auto mb-3" />
                  <p className="text-sm text-muted-foreground">No collections yet</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Recent Questions */}
        <Card className="border-border/60 bg-card/50 backdrop-blur-sm overflow-hidden">
          <CardHeader className="border-b border-border/50 pb-4">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-lg font-semibold flex items-center gap-2">
                  <Database className="h-5 w-5 text-blue-500" />
                  Recent Questions
                </CardTitle>
                <CardDescription className="mt-1">Latest additions to the bank</CardDescription>
              </div>
              <Link href="/dashboard/questions">
                <Button variant="ghost" size="sm" className="gap-1 text-primary hover:text-primary/80 group/link">
                  View All
                  <ChevronRight className="h-4 w-4 transition-transform group-hover/link:translate-x-0.5" />
                </Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent className="p-4">
            <div className="space-y-4">
              {stats.recentQuestions.map((q) => (
                <Link 
                  key={q._id} 
                  href={`/dashboard/questions/${q._id}`}
                  className="group block p-3 rounded-xl border border-border/50 hover:border-primary/30 hover:bg-primary/5 transition-all duration-200"
                >
                  <div className="flex items-start gap-3">
                    <div className="mt-1.5 flex-shrink-0">
                      <div className="h-2.5 w-2.5 rounded-full bg-gradient-to-br from-blue-500 to-indigo-500 ring-4 ring-blue-500/10" />
                    </div>
                    <div className="space-y-1.5 min-w-0">
                      <p className="text-xs font-mono font-bold text-primary">{q.code}</p>
                      <p className="text-sm line-clamp-2 leading-snug text-foreground/80 group-hover:text-foreground transition-colors">
                        {q.content?.en?.text || q.content?.hi?.text}
                      </p>
                      <div className="flex items-center gap-2 pt-0.5">
                        <Badge variant="secondary" className="text-[10px] uppercase font-medium px-2 py-0">
                          {q.difficulty || 'Medium'}
                        </Badge>
                        <span className="text-[10px] text-muted-foreground/70">
                          {new Date(q.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                        </span>
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
              {stats.recentQuestions.length === 0 && (
                <div className="p-8 text-center">
                  <Database className="h-10 w-10 text-muted-foreground/30 mx-auto mb-3" />
                  <p className="text-sm text-muted-foreground">No questions yet</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function StatCard({ title, value, icon: Icon, gradient, href }) {
  return (
    <Link href={href}>
      <Card className="group relative overflow-hidden border border-border/60 bg-card/50 backdrop-blur-sm hover:shadow-lg hover:shadow-primary/5 transition-all duration-300 hover:-translate-y-1 cursor-pointer h-full">
        <div className={`absolute inset-0 bg-gradient-to-br ${gradient} opacity-0 group-hover:opacity-5 transition-opacity duration-300`} />
        <CardContent className="p-6">
          <div className="flex items-start justify-between mb-4">
            <div className={`p-2.5 rounded-xl bg-gradient-to-br ${gradient} shadow-lg`}>
              <Icon className="h-5 w-5 text-white" />
            </div>
          </div>
          <div>
            <p className="text-sm font-medium text-muted-foreground mb-1">{title}</p>
            <h3 className="text-3xl font-bold tracking-tight">{value.toLocaleString()}</h3>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
