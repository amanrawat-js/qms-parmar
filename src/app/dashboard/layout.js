import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { BaseSidebar } from "@/components/dashboard/BaseSidebar";
import DashboardNavbar from "@/components/dashboard/DashboardNavbar";
import { getServerSession } from "next-auth";
import { authOptions } from "../api/auth/[...nextauth]/route";
import { ROLES, ROLE_PERMISSIONS } from "@/enums/role";


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
];


export default async function AdminLayout({ children }) {
  const session = await getServerSession(authOptions);
  const role = session?.user?.role;

  // Pick the correct sidebar menu based on role
  const menu = role === "REVIEWER" ? reviewerMenu : role === "CONTENT_WRITER" ? writerMenu : adminMenu;
  const portalName = role === "REVIEWER" ? "Reviewer Panel" : role === "CONTENT_WRITER" ? "Writer Panel" : "Dashboard";

  return (
    <SidebarProvider>
      {/* Pass the main icon name as a string "ShieldCheck" */}
      <BaseSidebar title="QMS" items={menu} iconName="ShieldCheck" />
      <SidebarInset>
        <DashboardNavbar portalName={portalName} />
        <main className="p-6">
          {!ROLE_PERMISSIONS[session?.user?.role]?.includes("CAN_VIEW_DASHBOARD") ? (
            <div className="flex flex-col items-center justify-center h-[70vh]">
              <h2 className="text-2xl font-bold mb-4">Access Denied</h2>
              <p className="text-center text-muted-foreground max-w-md"> 
                You do not have the necessary permissions to access this section of the application.
              </p>
            </div> 
          ) : 
          children
          }
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}