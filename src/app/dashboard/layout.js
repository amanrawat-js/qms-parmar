import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { BaseSidebar } from "@/components/dashboard/BaseSidebar";
import DashboardNavbar from "@/components/dashboard/DashboardNavbar";
import { getServerSession } from "next-auth";
import { authOptions } from "../api/auth/[...nextauth]/route";
import { ROLE_PERMISSIONS } from "@/enums/role";
import RouteGuard from "@/components/dashboard/RouteGuard";
import { ShieldAlert } from "lucide-react";
import { Toaster } from "@/components/ui/sonner";


const adminMenu = [
  { title: "Admin Overview", icon: "BarChart", url: "/dashboard" },
  { title: "Manage Users", icon: "Users", url: "/dashboard/users" },
  { title: "Boards", icon: "Building", url: "/dashboard/boards" },
  { title: "Exams", icon: "GraduationCap", url: "/dashboard/exams"},
  { title: "Subjects", icon: "BookOpen", url: "/dashboard/subjects"},
  { title: "Topics", icon: "BookMarked", url: "/dashboard/topics"},
  { title: "Questions", icon: "HelpCircle", url: "/dashboard/questions" },
  { title: "Collections", icon: "Layers", url: "/dashboard/collections" },
];

const reviewerMenu = [
  { title: "Question Review", icon: "ClipboardCheck", url: "/dashboard/review" },
];

const writerMenu = [
  { title: "Rejected Questions", icon: "PenLine", url: "/dashboard/writer" },
  { title: "Questions", icon: "HelpCircle", url: "/dashboard/questions" },
  { title: "Collections", icon: "Layers", url: "/dashboard/collections" },
];


export default async function AdminLayout({ children }) {
  const session = await getServerSession(authOptions);
  const role = session?.user?.role;

  // Pick the correct sidebar menu based on role
  const menu = role === "REVIEWER" ? reviewerMenu : role === "CONTENT_WRITER" ? writerMenu : adminMenu;
  const portalName = role === "REVIEWER" ? "Reviewer Panel" : role === "CONTENT_WRITER" ? "Writer Panel" : "Dashboard";

  const hasBasicAccess = ROLE_PERMISSIONS[role]?.includes("CAN_VIEW_DASHBOARD");

  return (
    <SidebarProvider>
      {/* Pass the main icon name as a string "ShieldCheck" */}
      <BaseSidebar title="QMS" items={menu} iconName="ShieldCheck" />
      <SidebarInset>
        <DashboardNavbar portalName={portalName} />
        <main className="p-6">
          {!hasBasicAccess ? (
            <div className="flex flex-col items-center justify-center h-[70vh] gap-4">
              <div className="h-16 w-16 rounded-full bg-destructive/10 flex items-center justify-center">
                <ShieldAlert className="h-8 w-8 text-destructive" />
              </div>
              <h2 className="text-2xl font-bold">Access Denied</h2>
              <p className="text-center text-muted-foreground max-w-md"> 
                You do not have the necessary permissions to access the dashboard.
              </p>
            </div> 
          ) : (
            <RouteGuard role={role}>
              {children}
            </RouteGuard>
          )}
        </main>
        <Toaster />
      </SidebarInset>
    </SidebarProvider>
  );
}