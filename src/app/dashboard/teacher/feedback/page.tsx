import { Metadata } from "next";
import { HomeroomFeedbackDashboard } from "@/features/grade-management/components/homeroom-feedback/homeroom-feedback-dashboard";

export const metadata: Metadata = {
  title: "Pháº£n Há»“i Há»c Sinh",
  description: "Xem pháº£n há»“i há»c táº­p cá»§a há»c sinh trong lá»›p chá»§ nhiá»‡m",
};

export default function HomeroomFeedbackPage() {
  return (
    <div className="p-6">
      <div className="flex flex-1 flex-col gap-4">
        <HomeroomFeedbackDashboard />
      </div>
    </div>
  );
}
