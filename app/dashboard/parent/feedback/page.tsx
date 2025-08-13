import { Metadata } from "next";
import ParentFeedbackDashboard from "@/components/parent-feedback/parent-feedback-dashboard";
import { BarChart3 } from "lucide-react";

export const metadata: Metadata = {
  title: "Phản Hồi Học Tập",
  description: "Xem phản hồi học tập của con em từ giáo viên",
};

export default function ParentFeedbackPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50/30">
      <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
        <div className="space-y-8">
          {/* Modern Header */}
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-white/20 shadow-lg shadow-blue-500/5 p-6 sm:p-8">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-xl flex items-center justify-center">
                <BarChart3 className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">
                  Phản Hồi Học Tập
                </h1>
                <p className="text-gray-600 mt-1">
                  Xem phản hồi và đánh giá học tập của con em từ giáo viên
                </p>
              </div>
            </div>
          </div>

          {/* Feedback Content */}
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-white/20 shadow-lg shadow-blue-500/5 p-6 sm:p-8">
            <ParentFeedbackDashboard />
          </div>
        </div>
      </div>
    </div>
  );
}
