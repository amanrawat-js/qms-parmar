"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { 
  Search, 
  Plus, 
  MoreHorizontal, 
  Eye, 
  Edit, 
  Clock, 
  Filter,
  Loader2, 
  ChevronRight,
  ChevronLeft,
  Calendar,
} from "lucide-react";

import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { toast } from "sonner";

export default function ExamsPage() {
  const [exams, setExams] = useState([]);
  const [shifts, setShifts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [mounted, setMounted] = useState(false);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  useEffect(() => {
    setMounted(true);
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [examsRes, shiftsRes] = await Promise.all([
        fetch("/api/exams"),
        fetch("/api/shifts"),
      ]);
      const examsData = await examsRes.json();
      const shiftsData = await shiftsRes.json();
      setExams(examsData.exams || []);
      setShifts(shiftsData.shifts || []);
    } catch (error) {
      console.error("Failed to fetch data");
      toast.error("Failed to load exams data.");
    } finally {
      setLoading(false);
    }
  };

  // Group shifts by exam ID for fast lookup
  const shiftsByExam = useMemo(() => {
    const map = {};
    shifts.forEach((shift) => {
      const examId = typeof shift.exam === "object" ? shift.exam._id : shift.exam;
      if (!map[examId]) map[examId] = [];
      map[examId].push(shift);
    });
    return map;
  }, [shifts]);

  // Search and Filter Logic
  const filteredExams = useMemo(() => {
    return exams.filter((exam) => {
      const matchesSearch = exam.examName?.toLowerCase().includes(search.toLowerCase()) ||
                            exam.examYear?.toString().includes(search);
      const matchesStatus = statusFilter === "ALL" || exam.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [exams, search, statusFilter]);

  // Pagination Logic
  const totalPages = Math.max(1, Math.ceil(filteredExams.length / itemsPerPage));
  const paginatedExams = filteredExams.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  return (
    <div className="p-0 space-y-6 animate-in fade-in duration-500">
      {/* --- HEADER --- */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-foreground to-foreground/60 bg-clip-text text-transparent uppercase">
            Exams
          </h1>
          <p className="text-muted-foreground text-sm font-medium">Manage examinations and their shifts.</p>
        </div>
        <Link href="/dashboard/exams/create">
          <Button className="shadow-lg transition-transform active:scale-95">
            <Plus className="mr-2 h-4 w-4" /> Add Exam
          </Button>
        </Link>
      </div>

      {/* --- FILTER BAR --- */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="md:col-span-2 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search exams by name or year..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setCurrentPage(1);
            }}
            className="pl-10 bg-card/60"
          />
        </div>
        
        {mounted ? (
          <Select value={statusFilter} onValueChange={(val) => { setStatusFilter(val); setCurrentPage(1); }}>
            <SelectTrigger className="bg-card/60">
              <div className="flex items-center gap-2">
                <Filter className="h-3.5 w-3.5 text-muted-foreground" />
                <SelectValue placeholder="Filter Status" />
              </div>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All Status</SelectItem>
              <SelectItem value="PUBLISHED">Published</SelectItem>
              <SelectItem value="DRAFT">Draft</SelectItem>
            </SelectContent>
          </Select>
        ) : (
          <div className="h-10 w-full bg-card/60 border rounded-md animate-pulse" />
        )}
      </div>

      {/* --- TABLE CARD --- */}
      <Card className="border bg-card/60 shadow-sm overflow-hidden">
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-muted/30">
              <TableRow className="hover:bg-transparent border-t-0">
                <TableHead className="w-[100px] text-center font-bold text-[10px] uppercase tracking-widest pl-8">Year</TableHead>
                <TableHead className="font-bold text-[10px] uppercase tracking-widest">Exam Name</TableHead>
                <TableHead className="font-bold text-[10px] uppercase tracking-widest">Board</TableHead>
                <TableHead className="font-bold text-[10px] uppercase tracking-widest">Shift</TableHead>
                <TableHead className="font-bold text-[10px] uppercase tracking-widest">Status</TableHead>
                <TableHead className="text-right font-bold text-[10px] uppercase tracking-widest pr-8">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={6} className="h-64 text-center">
                    <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary/50" />
                  </TableCell>
                </TableRow>
              ) : paginatedExams.length > 0 ? (
                paginatedExams.map((exam) => {
                  const examShifts = shiftsByExam[exam._id] || [];
                  return (
                    <TableRow key={exam._id} className="hover:bg-muted/20 transition-colors group border-b">
                      <TableCell className="pl-8 text-center font-mono text-xs text-primary font-bold">
                        {exam.examYear}
                      </TableCell>
                      <TableCell>
                        <div className="font-bold text-sm tracking-tight">{exam.examName}</div>
                        <div className="flex items-center gap-2 text-[10px] text-muted-foreground mt-1 uppercase">
                          <Clock className="h-3 w-3" /> {exam.duration} Min • {exam.totalMarks} Marks
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-[10px] border uppercase tracking-tighter">
                          {exam.board?.boardShortName || "N/A"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {examShifts.length === 0 ? (
                          <span className="text-[10px] text-muted-foreground italic">No shifts</span>
                        ) : (
                          <div className="flex flex-wrap gap-1">
                            {examShifts.map((shift) => (
                              <Badge
                                key={shift._id}
                                variant="secondary"
                                className="text-[10px] font-semibold"
                              >
                                {shift.shiftLabel}
                              </Badge>
                            ))}
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge className={`text-[10px] font-bold uppercase ${
                          exam.status === 'PUBLISHED' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-amber-500/10 text-amber-500'
                        }`}>
                          {exam.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right pr-8">
                        <div className="flex justify-end gap-2">
                          <Link href={`/dashboard/exams/${exam._id}`}>
                            <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full"><Eye className="h-4 w-4" /></Button>
                          </Link>
                          <Link href={`/dashboard/exams/${exam._id}/edit`}>
                            <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full"><Edit className="h-4 w-4" /></Button>
                          </Link>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-48 shadow-xl">
                              <DropdownMenuLabel>Extra Actions</DropdownMenuLabel>
                              <DropdownMenuItem>Manage Questions</DropdownMenuItem>
                              <DropdownMenuItem>View Stats</DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })
              ) : (
                <TableRow>
                  <TableCell colSpan={6} className="h-32 text-center text-muted-foreground italic">
                    No exams matching your criteria.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>

        {/* --- FOOTER --- */}
        <CardFooter className="flex flex-col sm:flex-row items-center justify-between gap-4 py-4 bg-muted/5 border-t border-muted/20">
          <div className="flex items-center gap-4">
            <div className="text-xs text-muted-foreground font-medium border-r pr-4 border-muted-foreground/20">
              Showing <b>{paginatedExams.length}</b> of <b>{filteredExams.length}</b> Results
            </div>
            
            <div className="flex items-center gap-2">
              <span className="text-[10px] uppercase font-bold text-muted-foreground">Per Page:</span>
              {mounted ? (
                <Select value={itemsPerPage.toString()} onValueChange={(val) => { setItemsPerPage(parseInt(val)); setCurrentPage(1); }}>
                  <SelectTrigger className="h-8 w-[70px] text-xs bg-background">
                    <SelectValue placeholder="10" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="5">5</SelectItem>
                    <SelectItem value="10">10</SelectItem>
                    <SelectItem value="20">20</SelectItem>
                    <SelectItem value="50">50</SelectItem>
                  </SelectContent>
                </Select>
              ) : (
                <div className="h-8 w-[70px] bg-background border rounded-md animate-pulse" />
              )}
            </div>
          </div>

          <div className="flex items-center gap-6">
            <p className="text-xs text-muted-foreground">
              Page <b>{currentPage}</b> of <b>{totalPages}</b>
            </p>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                className="h-8 rounded-md border-muted/40"
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1 || loading}
              >
                <ChevronLeft className="h-4 w-4 mr-1" /> Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="h-8 rounded-md border-muted/40"
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages || loading}
              >
                Next <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </div>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}