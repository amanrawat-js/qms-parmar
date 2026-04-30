"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  Plus,
  Search,
  Filter,
  MoreHorizontal,
  FileText,
  Calendar,
  Eye,
  Edit,
  Trash2,
  Share,
  Loader2,
} from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

export default function CollectionsPage() {
  const [data, setData] = useState({ collections: [], pagination: {} });
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const resolver = React.useRef(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [search, setSearch] = useState("");
  const [filters, setFilters] = useState({
    category: "",
    exam: "",
    subject: "",
  });

  // Fetch Logic
  const fetchCollections = useCallback(async () => {
    setLoading(true);
    try {
      const query = new URLSearchParams({
        search,
        ...filters,
        page: data.pagination?.page || 1,
      }).toString();

      const res = await fetch(`/api/collections?${query}`);
      const result = await res.json();
      setData(result);
    } catch (error) {
      console.error("Failed to fetch collections", error);
    } finally {
      setLoading(false);
    }
  }, [search, filters, data.pagination?.page]);

  useEffect(() => {
    const timer = setTimeout(() => fetchCollections(), 400);
    return () => clearTimeout(timer);
  }, [fetchCollections]);

  const handleDelete = async (id) => {
     setOpen(true);
    setIsDeleting(true);

    try {
      if (!await new Promise((resolve) => {
        resolver.current = resolve
        setOpen(true)
      })) {
        return
      }
      const res = await fetch(`/api/collections/${id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        toast.success("Collection deleted successfully");
        // Refresh the list or filter out the deleted item
        // window.location.reload(); or use a state update
      }
    } catch (error) {
      console.error("Delete failed", error);
    } finally {
      setIsDeleting(false);
    }

  };

  return (
    <div className="space-y-6">
      {/* Header section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Collections</h1>
          <p className="text-muted-foreground text-sm">
            Manage question bundles, mock tests, and exam papers.
          </p>
        </div>
        <Link href="/dashboard/collections/create">
          <Button className="gap-2">
            <Plus className="h-4 w-4" /> Create Collection
          </Button>
        </Link>
      </div>

      {/* Filters bar */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 bg-card p-4 rounded-xl border shadow-sm">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by title..."
            className="pl-9"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <select
          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
          onChange={(e) => setFilters({ ...filters, category: e.target.value })}
        >
          <option value="">All Categories</option>
          <option value="MOCK_TEST">Mock Test</option>
          <option value="PRACTICE_SET">Practice Set</option>
          <option value="PREVIOUS_YEAR">Previous Year</option>
        </select>

        {/* Note: In a real app, populate these from your Exam/Subject APIs */}
        <select className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
          <option value="">Filter by Exam</option>
        </select>

        <select className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
          <option value="">Filter by Subject</option>
        </select>
      </div>

      {/* Shadcn Table */}

      <div className="rounded-xl border bg-card shadow-sm">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50">
              <TableHead className="w-[300px]">Collection Title</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Questions</TableHead>
              <TableHead>Hierarchy</TableHead>
              <TableHead>Created At</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={6} className="h-24 text-center">
                  Loading collections...
                </TableCell>
              </TableRow>
            ) : data.collections?.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="h-24 text-center">
                  No collections found.
                </TableCell>
              </TableRow>
            ) : (
              data.collections?.map((col) => (
                <TableRow
                  key={col._id}
                  className="hover:bg-muted/30 transition-colors"
                >
                  <TableCell className="font-medium">
                    <div className="flex flex-col">
                      <span>{col?.title}</span>
                      <span className="text-[10px] text-muted-foreground font-mono uppercase">
                        {col?.slug}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="text-[10px]">
                      {col?.category}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <FileText className="h-3 w-3 text-muted-foreground" />
                      <span className="text-sm font-semibold">
                        {(col.questionCount ?? col.questions?.length) || 0}
                      </span>
                    </div>
                    {col.missingQuestionCount > 0 && (
                      <p className="text-[10px] text-amber-600 mt-0.5">
                        {col.missingQuestionCount} missing link{col.missingQuestionCount > 1 ? "s" : ""}
                      </p>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col gap-1">
                      <span className="text-xs">
                        {col.exam?.examName || "No Exam"}
                      </span>
                      <span className="text-[10px] text-muted-foreground">
                        {col.subject?.subjectName || "No Subject"}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {new Date(col.createdAt).toLocaleDateString()}
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="cursor-pointer h-8 w-8 p-0">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                        <Link href={`/dashboard/collections/${col._id}`}>
                          <DropdownMenuItem className="gap-2">
                            <Eye className="h-4 w-4" /> View Summary
                          </DropdownMenuItem>
                        </Link>
                        <Link href={`/dashboard/collections/${col._id}/edit`}>
                          <DropdownMenuItem className="gap-2">
                            <Edit className="h-4 w-4" /> Edit Metadata
                          </DropdownMenuItem>
                        </Link>
                        <Link
                          href={`/dashboard/collections/${col._id}/addQuestions`}
                        >
                          <DropdownMenuItem className="gap-2">
                            <Plus className="h-4 w-4" /> Add Questions
                          </DropdownMenuItem>
                        </Link>

                        <Link href={`/dashboard/collections/${col._id}/export`}>
                          <DropdownMenuItem className="gap-2">
                            <Share className="h-4 w-4" /> Export Collection
                          </DropdownMenuItem>
                        </Link>
                        <DropdownMenuSeparator />

                        <DropdownMenuItem className="gap-2 text-red-500" onClick={() => handleDelete(col._id)}>
                          <Trash2 className="h-4 w-4 text-red-500" /> Delete Collection
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Simple Pagination Controls */}
      <div className="flex items-center justify-between px-2">
        <p className="text-xs text-muted-foreground">
          Showing {data.collections?.length} of {data.pagination?.total || 0}{" "}
          collections
        </p>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={data.pagination?.page === 1}
          >
            Previous
          </Button>
          <Button
            variant="outline"
            size="sm"
            disabled={data.pagination?.page === data.pagination?.pages}
          >
            Next
          </Button>
        </div>
      </div>



      <AlertDialog open={open} onOpenChange={setOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
          </AlertDialogHeader>

          <AlertDialogFooter>
            <AlertDialogCancel
              onClick={() => {
                resolver.current?.(false)
                setOpen(false)
              }}
            >
              Cancel
            </AlertDialogCancel>

            <AlertDialogAction
              className="bg-rose-600 text-white"
              onClick={() => {
                resolver.current?.(true)
                setOpen(false)
              }}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

    </div>
  );
}
