import Sidebar from '@/components/layout/Sidebar';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-full">
      <Sidebar />
      <main className="flex-1 md:ml-64 min-h-screen overflow-y-auto bg-gray-50 dark:bg-gray-950">
        {children}
      </main>
    </div>
  );
}
