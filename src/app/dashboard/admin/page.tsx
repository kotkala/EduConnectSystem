import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { AcademicYearsTable } from "@/components/admin/academic-years-table";

export default async function AdminDashboard() {
  const supabase = await createClient();

  const { data, error } = await supabase.auth.getUser();
  if (error || !data?.user) {
    redirect("/auth/login");
  }

  // TODO: Check if user has admin role
  // For now, we'll just check if user is authenticated

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
          Admin Dashboard
        </h1>
        <p className="text-gray-600 dark:text-gray-300 mt-2">
          Manage your school's academic system
        </p>
      </div>

      {/* Academic Years Management */}
      <div className="mb-8">
        <AcademicYearsTable />
      </div>

      {/* TODO: Add more admin components */}
      {/* Classes, Subjects, Users, etc. */}
    </div>
  );
} 