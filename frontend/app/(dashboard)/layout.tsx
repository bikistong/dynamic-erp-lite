import Sidebar from '@/components/layout/Sidebar';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-full">
      <Sidebar />
      <main className="flex-1 md:ml-56 min-h-screen overflow-y-auto">
        {children}
      </main>
    </div>
  );
}
