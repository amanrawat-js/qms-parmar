"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { 
  Search, 
  MoreHorizontal, 
  Eye, 
  Edit, 
  Plus, 
  ChevronLeft, 
  ChevronRight,
  Loader2,
  Calendar,
  Filter
} from "lucide-react";

import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
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

export default function BoardsPage() {
  const [boards, setBoards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [mounted, setMounted] = useState(false);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  useEffect(() => {
    setMounted(true);
    fetchBoards();
  }, []);

  const fetchBoards = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/boards");
      const data = await res.json();
      setBoards(data?.boards || []); 
    } catch (error) {
      console.error("Failed to fetch boards");
      toast.error("Failed to load boards data.");
    } finally {
      setLoading(false);
    }
  };

  // Search and Filter Logic
  const filteredBoards = useMemo(() => {
    return boards.filter((b) => {
      const matchesSearch = b.boardName.toLowerCase().includes(search.toLowerCase()) ||
                            b.boardShortName.toLowerCase().includes(search.toLowerCase());
      const matchesStatus = statusFilter === "ALL" || b.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [boards, search, statusFilter]);

  // Pagination Logic
  const totalPages = Math.max(1, Math.ceil(filteredBoards.length / itemsPerPage));
  const paginatedBoards = filteredBoards.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  return (
    <div className="p-0 space-y-6 animate-in fade-in duration-500">
      {/* --- HEADER --- */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-foreground to-foreground/60 bg-clip-text text-transparent">
            Exam Boards
          </h1>
          <p className="text-muted-foreground text-sm font-medium">Manage organizations and exam bodies.</p>
        </div>
        <Link href="/dashboard/boards/create">
          <Button className="shadow-lg transition-transform active:scale-95">
            <Plus className="mr-2 h-4 w-4" />
            Add Board
          </Button>
        </Link>
      </div>

      {/* --- FILTER BAR --- */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="md:col-span-2 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search boards by name or code..."
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
              <SelectItem value="ACTIVE">Active</SelectItem>
              <SelectItem value="INACTIVE">Inactive</SelectItem>
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
                <TableHead className="w-[60px] text-center font-bold text-[10px] uppercase tracking-widest pl-6">S.No</TableHead>
                <TableHead className="font-bold text-[10px] uppercase tracking-widest">Organizer</TableHead>
                <TableHead className="font-bold text-[10px] uppercase tracking-widest">Slug</TableHead>
                <TableHead className="font-bold text-[10px] uppercase tracking-widest">Status</TableHead>
                <TableHead className="font-bold text-[10px] uppercase tracking-widest">Created At</TableHead>
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
              ) : paginatedBoards.length > 0 ? (
                paginatedBoards.map((board, index) => (
                  <TableRow key={board._id} className="hover:bg-muted/20 transition-colors group">
                    <TableCell className="text-center font-mono text-xs text-muted-foreground pl-6">
                      {((currentPage - 1) * itemsPerPage + index + 1).toString().padStart(2, '0')}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="h-9 w-9 border border-primary/10">
                          <AvatarFallback className="bg-primary/10 text-primary text-xs font-bold">
                            {board.boardShortName?.slice(0, 2).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex flex-col">
                          <span className="font-semibold text-sm leading-none">{board.boardShortName}</span>
                          <span className="text-[11px] text-muted-foreground mt-1">{board.boardName}</span>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <code className="text-[10px] font-mono bg-muted px-1.5 py-0.5 rounded text-muted-foreground">
                        {board.boardSlug}
                      </code>
                    </TableCell>
                    <TableCell>
                      <Badge className={`text-[10px] uppercase font-bold ${
                        board.status === 'ACTIVE' ? 'bg-emerald-500/10 text-emerald-600' : 'bg-rose-500/10 text-rose-600'
                      }`}>
                        {board.status || 'ACTIVE'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      <div className="flex items-center gap-1.5">
                        <Calendar className="h-3 w-3" />
                        {new Date(board.createdAt).toLocaleDateString()}
                      </div>
                    </TableCell>
                    <TableCell className="text-right pr-8">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="cursor-pointer h-8 w-8 rounded-full">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-48 shadow-xl">
                          <DropdownMenuLabel>Actions</DropdownMenuLabel>
                          <DropdownMenuItem onClick={() => window.location.href = `/dashboard/boards/${board._id}`}>
                            <Eye className="mr-2 h-4 w-4" /> View Details
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => window.location.href = `/dashboard/boards/${board._id}/edit`}>
                            <Edit className="mr-2 h-4 w-4" /> Edit Board
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={6} className="h-32 text-center text-muted-foreground italic">
                    No boards found.
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
              Showing <b>{paginatedBoards.length}</b> of <b>{filteredBoards.length}</b> Results
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