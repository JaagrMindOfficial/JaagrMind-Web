import { Header } from "@/components/Header";
import { LeftSidebar } from "@/components/LeftSidebar";

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="flex min-h-[calc(100vh-56px)] justify-center">
        {/* Left Sidebar - Persistent */}
        <div className="hidden lg:block w-64 flex-shrink-0 border-r border-border sticky top-14 h-[calc(100vh-56px)] overflow-y-auto no-scrollbar">
          <LeftSidebar />
        </div>

        {/* Main Content + Right Sidebar placeholder */}
        {/* Flex-1 ensures it takes remaining space, justify-center for pages that center content */}
        <div className="flex-1 flex justify-center w-full"> 
          {children}
        </div>
      </div>
    </div>
  );
}
