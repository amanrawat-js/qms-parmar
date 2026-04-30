"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { 
  Search, 
  MoreHorizontal, 
  Eye, 
  Edit, 
  UserPlus, 
  ChevronLeft, 
  ChevronRight,
  Mail,
  Calendar,
  Loader2,
  CheckCircle2,
  XCircle,
  ShieldCheck
} from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
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
  DropdownMenuSeparator
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import ManagePermissionsDialog from "@/components/dashboard/ManagePermissionsDialog";


export default function UsersPage() {

  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  // Manage Permissions Dialog state
  const [permDialogOpen, setPermDialogOpen] = useState(false);
  const [writerPermDialogOpen, setWriterPermDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/users");
      const data = await res.json();
      setUsers(data?.users);
    } catch (error) {
      console.error("Failed to fetch users");
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (id, newStatus) => {
    try {
      const res = await fetch(`/api/users/${id}/edit`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      if (res.ok){
        toast.success(`Status Updated to ${newStatus}.`)
        fetchUsers();
      }
    } catch (error) {
      console.error("Update failed");
    }
  };

  // Search and Filter Logic
  const filteredUsers = useMemo(() => {
    return users?.filter((u) =>
      u.name.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase()) ||
      u.role?.toLowerCase().includes(search.toLowerCase())
    );
  }, [users, search]);

  // Pagination Logic
  const totalPages = Math.ceil(filteredUsers?.length / itemsPerPage);
  const paginatedUsers = filteredUsers?.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const getInitials = (name) => {
    return name?.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2) || "??";
  };

  return (
    <div className="p-0 space-y-2 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">User Management</h1>
          <p className="text-muted-foreground text-sm">Review, edit, and manage system access permissions.</p>
        </div>
        
          <Link href="/dashboard/users/create">
            <Button className="cursor-pointer shadow-lg transition-transform active:scale-95">
              <UserPlus className="mr-2 h-4 w-4" /> Add User
            </Button>
          </Link>
     
      </div>

      <Card className="border bg-card/60">
        <CardHeader>
          <div className="flex flex-col sm:flex-row gap-4 justify-between items-center">
            <div className="relative w-full sm:w-96 flex items-center">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by name, email, or role..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setCurrentPage(1);
                }}
                className="pl-10 bg-background/50 focus-visible:ring-primary/20"
              />
            </div>
            <div className="text-xs text-muted-foreground font-medium">
              Showing {paginatedUsers?.length} of {filteredUsers?.length} Users
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border border-muted/40">
            <Table>
              <TableHeader className="bg-muted/30">
                <TableRow>
                  <TableHead className="w-[60px] text-center font-bold">S.No</TableHead>
                  <TableHead className="font-bold">Member</TableHead>
                  <TableHead className="font-bold">Role</TableHead>
                  <TableHead className="font-bold">Status</TableHead>
                  <TableHead className="font-bold">Joined At</TableHead>
                  <TableHead className="text-right font-bold">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={6} className="h-64 text-center">
                      <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
                      <p className="mt-2 text-sm text-muted-foreground">Synchronizing user data...</p>
                    </TableCell>
                  </TableRow>
                ) : paginatedUsers?.length > 0 ? (
                  paginatedUsers?.map((user, index) => (
                    <TableRow key={user._id} className="hover:bg-muted/20 transition-colors group">
                      <TableCell className="text-center font-mono text-xs text-muted-foreground">
                        {(currentPage - 1) * itemsPerPage + index + 1}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar className="h-9 w-9 border border-primary/10">
                            <AvatarFallback className="bg-primary/10 text-primary text-xs font-bold">
                              {getInitials(user.name)}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex flex-col">
                            <span className="font-semibold text-sm leading-none">{user.name}</span>
                            <span className="text-xs text-muted-foreground mt-1">{user.email}</span>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                         
                            <Badge variant="outline" className="text-[10px] font-bold bg-background">
                              {user.role || 'USER'}
                            </Badge>
                          
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={`text-[10px] uppercase font-bold ${
                          user.status === 'APPROVED' ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' : 'bg-amber-500/10 text-amber-600 dark:text-amber-400'
                        }`}>
                          {user.status || 'PENDING'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        <div className="flex items-center gap-1.5">
                          <Calendar className="h-3 w-3" />
                          {new Date(user.createdAt || Date.now()).toLocaleDateString()}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="cursor-pointer h-8 w-8 rounded-full">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-40">
                            <DropdownMenuLabel>Actions</DropdownMenuLabel>
                            <DropdownMenuItem onClick={() => window.location.href = `/dashboard/users/${user._id}`}>
                              <Eye className="cursor-pointer mr-2 h-4 w-4" /> View Detail
                            </DropdownMenuItem>
                           
                              <DropdownMenuItem onClick={() => window.location.href = `/dashboard/users/${user._id}/edit`}>
                                <Edit className="mr-2 h-4 w-4" /> Edit Profile
                              </DropdownMenuItem>
                              {user.role === 'REVIEWER' && (
                              <DropdownMenuItem 
                                className="text-blue-600 font-bold focus:text-blue-600 focus:bg-blue-500/5"
                                onClick={() => {
                                  setSelectedUser(user);
                                  setPermDialogOpen(true);
                                }}
                              >
                                <ShieldCheck className="mr-2 h-4 w-4" /> Manage Permissions
                              </DropdownMenuItem>
                              )}
                              {user.role === 'CONTENT_WRITER' && (
                              <DropdownMenuItem 
                                className="text-blue-600 font-bold focus:text-blue-600 focus:bg-blue-500/5"
                                onClick={() => {
                                  setSelectedUser(user);
                                  setWriterPermDialogOpen(true);
                                }}
                              >
                                <ShieldCheck className="mr-2 h-4 w-4" /> Manage Permissions
                              </DropdownMenuItem>
                              )}
                              <DropdownMenuSeparator />
                            {user.status === 'PENDING' ? (
                              <DropdownMenuItem 
                                className="text-emerald-600 font-bold focus:text-emerald-600 focus:bg-emerald-500/5"
                                onClick={() => handleStatusUpdate(user._id, 'APPROVED')}
                              >
                                <CheckCircle2 className="mr-2 h-4 w-4" /> Approve Member
                              </DropdownMenuItem>
                            ) : (
                              <DropdownMenuItem 
                                className="text-amber-600 font-bold focus:text-amber-600 focus:bg-amber-500/5"
                                onClick={() => handleStatusUpdate(user._id, 'PENDING')}
                              >
                                <XCircle className="mr-2 h-4 w-4 text-amber-600" /> Mark as Pending
                              </DropdownMenuItem>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={6} className="h-32 text-center text-muted-foreground italic">
                      No members matching your criteria.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-6">
              <p className="text-xs text-muted-foreground">
                Page <b>{currentPage}</b> of <b>{totalPages}</b>
              </p>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                >
                  <ChevronLeft className="h-4 w-4 mr-1" /> Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                  disabled={currentPage === totalPages}
                >
                  Next <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Manage Permissions Dialog — Reviewer */}
      <ManagePermissionsDialog
        open={permDialogOpen}
        onOpenChange={setPermDialogOpen}
        user={selectedUser}
        permissionType="reviewer"
      />

      {/* Manage Permissions Dialog — Writer */}
      <ManagePermissionsDialog
        open={writerPermDialogOpen}
        onOpenChange={setWriterPermDialogOpen}
        user={selectedUser}
        permissionType="writer"
      />
    </div>
  );
}