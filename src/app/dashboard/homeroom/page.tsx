"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";

// Helper for week range by term type
function getWeekRange(termType: string): { start: number; end: number } {
  switch (termType) {
    case "semester_1":
      return { start: 1, end: 18 };
    case "semester_2":
      return { start: 1, end: 17 };
    case "summer":
      return { start: 1, end: 8 };
    case "full_year":
      return { start: 1, end: 35 };
    default:
      return { start: 1, end: 35 };
  }
}

export default function HomeroomDashboardPage() {
  // Filters
  const [academicYears, setAcademicYears] = useState<any[]>([]);
  const [academicTerms, setAcademicTerms] = useState<any[]>([]);
  const [selectedYear, setSelectedYear] = useState<string>("");
  const [selectedTerm, setSelectedTerm] = useState<string>("");
  const [selectedWeek, setSelectedWeek] = useState<string>("1");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Homeroom class and students
  const [homeroomClass, setHomeroomClass] = useState<any>(null);
  const [students, setStudents] = useState<any[]>([]);
  const [schedule, setSchedule] = useState<any[]>([]); // periods for the week
  const [feedbacks, setFeedbacks] = useState<any>({}); // { [studentId_periodId]: feedback }

  // Fetch academic years and terms
  useEffect(() => {
    async function fetchFilters() {
      setLoading(true);
      setError(null);
      try {
        const [yearsRes, termsRes] = await Promise.all([
          fetch("/api/academic-years"),
          fetch("/api/academic-terms"),
        ]);
        const yearsData = await yearsRes.json();
        const termsData = await termsRes.json();
        setAcademicYears(yearsData.data || []);
        setAcademicTerms(termsData.data || []);
        // Auto-select current year/term
        const currentYear = (yearsData.data || []).find((y: any) => y.is_current);
        if (currentYear) setSelectedYear(currentYear.id);
        const currentTerm = (termsData.data || []).find((t: any) => t.is_current);
        if (currentTerm) setSelectedTerm(currentTerm.id);
      } catch (e) {
        setError("Lỗi khi tải bộ lọc năm học/học kỳ");
      } finally {
        setLoading(false);
      }
    }
    fetchFilters();
  }, []);

  // Fetch homeroom class for current teacher
  useEffect(() => {
    if (!selectedYear) return;
    setLoading(true);
    setError(null);
    async function fetchHomeroomClass() {
      try {
        // Get current user
        const userRes = await fetch("/api/auth/user");
        const userData = await userRes.json();
        if (!userData || !userData.id) throw new Error("Không xác định được giáo viên");
        // Get homeroom assignments for this teacher
        const assignmentsRes = await fetch(`/api/teacher-assignments?type=homeroom&teacher_id=${userData.id}`);
        const assignmentsData = await assignmentsRes.json();
        // Find assignment for the selected academic year
        const myAssignment = (assignmentsData.data || []).find((a: any) => a.academic_year?.id === selectedYear && a.is_active);
        setHomeroomClass(myAssignment?.class || null);
      } catch (e) {
        setError("Lỗi khi tải lớp chủ nhiệm");
      } finally {
        setLoading(false);
      }
    }
    fetchHomeroomClass();
  }, [selectedYear]);

  // Fetch students in class
  useEffect(() => {
    if (!homeroomClass) return;
    setLoading(true);
    setError(null);
    async function fetchStudents() {
      try {
        const res = await fetch(`/api/classes/${homeroomClass.id}/students`);
        const data = await res.json();
        setStudents(data.data?.map((en: any) => en.student) || []);
      } catch (e) {
        setError("Lỗi khi tải danh sách học sinh");
      } finally {
        setLoading(false);
      }
    }
    fetchStudents();
  }, [homeroomClass]);

  // Fetch schedule for class and week
  useEffect(() => {
    if (!homeroomClass || !selectedTerm || !selectedWeek) return;
    setLoading(true);
    setError(null);
    async function fetchSchedule() {
      try {
        const params = new URLSearchParams({
          academic_term_id: selectedTerm,
          class_id: homeroomClass.id,
          week_number: selectedWeek,
        });
        const res = await fetch(`/api/teaching-schedules?${params}`);
        const data = await res.json();
        setSchedule(data || []);
      } catch (e) {
        setError("Lỗi khi tải thời khóa biểu");
      } finally {
        setLoading(false);
      }
    }
    fetchSchedule();
  }, [homeroomClass, selectedTerm, selectedWeek]);

  // Fetch feedbacks for all students and periods in the week
  useEffect(() => {
    if (!homeroomClass || !schedule.length || !students.length) return;
    setLoading(true);
    setError(null);
    async function fetchAllFeedbacks() {
      try {
        const feedbackMap: any = {};
        // For each period, fetch feedback for the class and date
        await Promise.all(
          schedule.map(async (period: any) => {
            if (!period.date) return; // Skip if date is missing
            const res = await fetch(`/api/lesson-feedback?class_id=${homeroomClass.id}&schedule_id=${period.id}&feedback_date=${period.date}`);
            const data = await res.json();
            if (data.success && data.data) {
              // Map feedbacks by student and period
              data.data.forEach((fb: any) => {
                feedbackMap[`${fb.student_id || "class"}_${period.id}`] = fb;
              });
            }
          })
        );
        setFeedbacks(feedbackMap);
      } catch (e) {
        setError("Lỗi khi tải phản hồi tiết học");
      } finally {
        setLoading(false);
      }
    }
    fetchAllFeedbacks();
  }, [schedule, students, homeroomClass]);

  // Filtered terms for selected year
  const filteredTerms = academicTerms.filter((t) => !selectedYear || t.academic_year_id === selectedYear);
  const selectedTermData = academicTerms.find((t) => t.id === selectedTerm);
  const weekRange = selectedTermData ? getWeekRange(selectedTermData.type) : { start: 1, end: 35 };
  const availableWeeks = Array.from({ length: weekRange.end - weekRange.start + 1 }, (_, i) => weekRange.start + i);

  return (
    <div className="max-w-7xl mx-auto py-8">
      <Card>
        <CardHeader>
          <CardTitle>Bảng tổng hợp phản hồi lớp chủ nhiệm</CardTitle>
        </CardHeader>
        <CardContent>
          {/* Filters */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div>
              <Label>Năm học</Label>
              <Select value={selectedYear} onValueChange={setSelectedYear}>
                <SelectTrigger>
                  <SelectValue placeholder="Chọn năm học" />
                </SelectTrigger>
                <SelectContent>
                  {academicYears.map((year) => (
                    <SelectItem key={year.id} value={year.id}>
                      {year.name} {year.is_current && "(Hiện tại)"}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Học kỳ</Label>
              <Select value={selectedTerm} onValueChange={setSelectedTerm}>
                <SelectTrigger>
                  <SelectValue placeholder="Chọn học kỳ" />
                </SelectTrigger>
                <SelectContent>
                  {filteredTerms.map((term) => (
                    <SelectItem key={term.id} value={term.id}>
                      {term.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Tuần</Label>
              <Select value={selectedWeek} onValueChange={setSelectedWeek}>
                <SelectTrigger>
                  <SelectValue placeholder="Chọn tuần" />
                </SelectTrigger>
                <SelectContent>
                  {availableWeeks.map((week) => (
                    <SelectItem key={week} value={week.toString()}>
                      Tuần {week}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Table */}
          {loading ? (
            <div className="text-center py-8">Đang tải dữ liệu...</div>
          ) : error ? (
            <div className="text-center text-red-500 py-8">{error}</div>
          ) : !homeroomClass ? (
            <div className="text-center py-8">Không tìm thấy lớp chủ nhiệm của bạn trong năm học này.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full border text-sm">
                <thead>
                  <tr>
                    <th className="border px-2 py-1 bg-gray-50">Học sinh</th>
                    {schedule.map((period: any) => (
                      <th key={period.id} className="border px-2 py-1 bg-gray-50">
                        {period.subject?.name || "Tiết"} <br />
                        {period.time_slot?.name || ""}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {students.map((student) => (
                    <tr key={student.id}>
                      <td className="border px-2 py-1 font-medium">{student.full_name}</td>
                      {schedule.map((period: any) => {
                        const fb = feedbacks[`${student.id}_${period.id}`] || null;
                        return (
                          <td key={period.id} className="border px-2 py-1 text-center">
                            {fb ? (
                              <Badge variant={fb.feedback_type === "lesson" ? "default" : "secondary"}>
                                {fb.content?.slice(0, 20) || "Có phản hồi"}
                              </Badge>
                            ) : (
                              <span className="text-gray-400">-</span>
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
} 