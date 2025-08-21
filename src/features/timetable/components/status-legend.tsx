"use client";

import { useState } from "react";
import { Button } from "@/shared/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/shared/components/ui/popover";
import { HelpCircle } from "lucide-react";
import { getAllStatusIndicators } from "@/features/timetable/utils/status-indicators";

export function StatusLegend() {
  const [isOpen, setIsOpen] = useState(false);
  const statusIndicators = getAllStatusIndicators();

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="gap-2"
        >
          <HelpCircle className="h-4 w-4" />
          Hướng dẫn trạng thái
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80" align="end">
        <div className="space-y-4">
          <div>
            <h4 className="font-semibold text-sm mb-2">Chỉ báo trạng thái tiết học</h4>
            <p className="text-xs text-muted-foreground mb-3">
              Mỗi tiết học hiển thị chỉ báo trạng thái để giúp bạn nhanh chóng hiểu tình trạng hiện tại.
            </p>
          </div>

          <div className="space-y-3">
            {statusIndicators.map((indicator) => (
              <div key={indicator.label} className="flex items-start gap-3">
                <div className={`px-2 py-1 rounded text-xs font-medium ${indicator.color} ${indicator.bgColor}`}>
                  {indicator.label}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    {indicator.description}
                  </p>
                </div>
              </div>
            ))}
          </div>

          <div className="pt-2 border-t">
            <p className="text-xs text-muted-foreground">
              Trạng thái được xác định tự động dựa trên thời gian tiết học và thông tin phản hồi.
            </p>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
