'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';
import { 
  Calendar, 
  Clock, 
  Users, 
  BookOpen, 
  RefreshCw,
  Filter,
  MapPin
} from 'lucide-react';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { format, getDay } from 'date-fns';
import { useRef } from 'react';
import { Input } from '@/components/ui/input';
import { createClient } from '@/lib/supabase/client';

interface AcademicYear {
  id: string;
  name: string;
  start_date: string;
  end_date: string;
  is_current: boolean;
}

interface AcademicTerm {
  id: string;
  name: string;
  type: 'semester_1' | 'semester_2' | 'summer' | 'full_year';
  start_date: string;
  end_date: string;
  academic_year_id: string;
}

interface Class {
  id: string;
  name: string;
  grade_level: { name: string };
  is_combined?: boolean;
}

interface Subject {
  id: string;
  name: string;
  code: string;
}

interface TimeSlot {
  id: string;
  name: string;
  start_time: string;
  end_time: string;
  order_index: number;
  is_break?: boolean;
}

interface TeachingSchedule {
  id: string;
  academic_term: AcademicTerm;
  class: Class;
  subject: Subject;
  time_slot: TimeSlot;
  day_of_week: number;
  week_number: number;
  room_number?: string;
  notes?: string;
}

const dayNames = ['', 'Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7'];

// Helper function to get week range for semester
function getWeekRange(termType: string): { start: number; end: number } {
  switch (termType) {
    case 'semester_1':
      return { start: 1, end: 18 };
    case 'semester_2':
      return { start: 1, end: 17 };
    case 'summer':
      return { start: 1, end: 8 };
    case 'full_year':
      return { start: 1, end: 35 };
    default:
      return { start: 1, end: 35 };
  }
}

export default function TeacherSchedulePage() {
  const [schedules, setSchedules] = useState<TeachingSchedule[]>([]);
  const [academicYears, setAcademicYears] = useState<AcademicYear[]>([]);
  const [academicTerms, setAcademicTerms] = useState<AcademicTerm[]>([]);
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([]);
  
  // Filter states
  const [selectedAcademicYear, setSelectedAcademicYear] = useState<string>('');
  const [selectedTerm, setSelectedTerm] = useState<string>('');
  const [selectedWeek, setSelectedWeek] = useState<string>('1');
  
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [viewMode, setViewMode] = useState<'table' | 'column'>('table');

  // Add modal state
  const [feedbackOpen, setFeedbackOpen] = useState(false);
  const [feedbackLesson, setFeedbackLesson] = useState<any>(null);
  const [students, setStudents] = useState<any[]>([]);
  const [studentFeedbacks, setStudentFeedbacks] = useState<{ [studentId: string]: string }>({});
  const [submittingFeedback, setSubmittingFeedback] = useState(false);

  // Add new state for feedback modal fields
  const [feedbackType, setFeedbackType] = useState<'lesson' | 'behavior' | 'general'>('lesson');
  const [feedbackScope, setFeedbackScope] = useState<'individual' | 'group' | 'class'>('individual');
  const [mainContent, setMainContent] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');
  const [attachments, setAttachments] = useState<File[]>([]);
  // Add state for per-student attachments and group/class selection
  const [studentAttachments, setStudentAttachments] = useState<{ [studentId: string]: File[] }>({});
  const [selectedStudents, setSelectedStudents] = useState<string[]>([]);
  // Remove isAIProcessed and aiSummary state

  // Get filtered data based on selections
  const filteredTerms = academicTerms.filter(term => 
    !selectedAcademicYear || term.academic_year_id === selectedAcademicYear
  );

  // Get week range for selected term
  const selectedTermData = academicTerms.find(term => term.id === selectedTerm);
  const weekRange = selectedTermData ? getWeekRange(selectedTermData.type) : { start: 1, end: 35 };
  const availableWeeks = Array.from({ length: weekRange.end - weekRange.start + 1 }, (_, i) => weekRange.start + i);

  useEffect(() => {
    fetchInitialData();
  }, []);

  useEffect(() => {
    if (selectedTerm && selectedWeek && user) {
      fetchSchedules();
    }
  }, [selectedTerm, selectedWeek, user]);

  const fetchInitialData = async () => {
    try {
      setLoading(true);
      
      // Get current user
      const userRes = await fetch('/api/auth/user');
      const userData = await userRes.json();
      setUser(userData);
      
      const [yearsRes, termsRes, timeSlotsRes] = await Promise.all([
        fetch('/api/academic-years'),
        fetch('/api/academic-terms'),
        fetch('/api/time-slots')
      ]);

      const [years, terms, timeSlotsData] = await Promise.all([
        yearsRes.json(),
        termsRes.json(),
        timeSlotsRes.json()
      ]);

      setAcademicYears(years.data || years);
      setAcademicTerms(terms.data || terms);
      setTimeSlots(timeSlotsData.data || timeSlotsData);

      // Auto-select current academic year
      const currentYear = (years.data || years).find((year: AcademicYear) => year.is_current);
      if (currentYear) {
        setSelectedAcademicYear(currentYear.id);
        
        // Auto-select current term
        const currentTerms = (terms.data || terms).filter((term: AcademicTerm) => 
          term.academic_year_id === currentYear.id
        );
        if (currentTerms.length > 0) {
          setSelectedTerm(currentTerms[0].id);
        }
      }
    } catch (error) {
      toast.error('Lỗi khi tải dữ liệu');
    } finally {
      setLoading(false);
    }
  };

  const fetchSchedules = async () => {
    if (!selectedTerm || !selectedWeek || !user) return;

    setLoading(true);
    try {
      const params = new URLSearchParams({
        academic_term_id: selectedTerm,
        teacher_id: user.id,
        week_number: selectedWeek
      });

      const response = await fetch(`/api/teaching-schedules?${params}`);
      const data = await response.json();

      if (response.ok) {
        setSchedules(data);
      } else {
        toast.error(data.error || 'Lỗi khi tải thời khóa biểu');
      }
    } catch (error) {
      toast.error('Lỗi khi tải thời khóa biểu');
    } finally {
      setLoading(false);
    }
  };

  // Fetch students in class for feedback modal
  const openFeedbackModal = async (lesson: any) => {
    setFeedbackLesson(lesson);
    setFeedbackOpen(true);
    setStudentFeedbacks({});
    setStudents([]);
    setFeedbackType('lesson');
    setFeedbackScope('individual');
    setMainContent('');
    setTags([]);
    setTagInput('');
    setAttachments([]);
    setStudentAttachments({});
    setSelectedStudents([]);
    // Restore fetching students logic
    const classId = lesson.class?.id || lesson.class_id;
    if (!classId) {
      toast.error('Không tìm thấy lớp cho tiết học này.');
      return;
    }
    try {
      const res = await fetch(`/api/classes/${classId}/students`);
      const data = await res.json();
      if (data.success) {
        setStudents(data.data.map((enr: any) => enr.student));
      }
    } catch {
      toast.error('Lỗi khi tải danh sách học sinh');
    }
  };
  const closeFeedbackModal = () => {
    setFeedbackOpen(false);
    setFeedbackLesson(null);
    setStudents([]);
    setStudentFeedbacks({});
  };
  const handleFeedbackChange = (studentId: string, value: string) => {
    setStudentFeedbacks(prev => ({ ...prev, [studentId]: value }));
  };
  const handleAddTag = () => {
    if (tagInput.trim() && !tags.includes(tagInput.trim())) {
      setTags([...tags, tagInput.trim()]);
      setTagInput('');
    }
  };
  const handleRemoveTag = (tag: string) => {
    setTags(tags.filter(t => t !== tag));
  };
  const handleAttachmentChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setAttachments(Array.from(e.target.files));
    }
  };
  const handleStudentAttachmentChange = (studentId: string, files: FileList | null) => {
    if (files) {
      setStudentAttachments(prev => ({ ...prev, [studentId]: Array.from(files) }));
    }
  };
  const handleSelectStudent = (studentId: string) => {
    setSelectedStudents(prev => prev.includes(studentId) ? prev.filter(id => id !== studentId) : [...prev, studentId]);
  };
  const handleSubmitFeedback = async () => {
    if (!feedbackLesson) return;
    setSubmittingFeedback(true);
    const classId = feedbackLesson.class?.id || feedbackLesson.class_id;
    if (!classId) {
      toast.error('Không tìm thấy lớp cho tiết học này.');
      setSubmittingFeedback(false);
      return;
    }
    try {
      const supabase = createClient();
      let body: any = {
        schedule_id: feedbackLesson.id,
        class_id: classId,
        feedback_date: new Date().toISOString().slice(0, 10),
        feedback_type: feedbackType,
        scope: feedbackScope,
        content: feedbackScope === 'individual' ? 'Feedback for lesson' : mainContent,
        tags,
        attachments: [],
      };
      if (feedbackScope === 'individual') {
        // Upload photos for each student and collect URLs
        const student_feedbacks = await Promise.all(students.map(async stu => {
          let urls: string[] = [];
          if (studentAttachments[stu.id]) {
            urls = await Promise.all(studentAttachments[stu.id].map(async (file) => {
              const { data, error } = await supabase.storage.from('feedback-photos').upload(`${stu.id}/${Date.now()}_${file.name}`, file);
              if (error) return '';
              return data?.path ? supabase.storage.from('feedback-photos').getPublicUrl(data.path).data.publicUrl : '';
            }));
          }
          return {
            student_id: stu.id,
            content: studentFeedbacks[stu.id] || '',
            attachments: urls.filter(Boolean),
          };
        }));
        body.student_feedbacks = student_feedbacks;
      } else {
        // Group/class: selected students, same content/attachments
        let urls: string[] = [];
        if (attachments.length > 0) {
          urls = await Promise.all(attachments.map(async (file) => {
            const { data, error } = await supabase.storage.from('feedback-photos').upload(`group/${Date.now()}_${file.name}`, file);
            if (error) return '';
            return data?.path ? supabase.storage.from('feedback-photos').getPublicUrl(data.path).data.publicUrl : '';
          }));
        }
        body.student_feedbacks = selectedStudents.map(studentId => ({
          student_id: studentId,
          content: mainContent,
          attachments: urls.filter(Boolean),
        }));
      }
      const res = await fetch('/api/lesson-feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });
      const data = await res.json();
      if (data.success) {
        toast.success('Đã lưu nhận xét thành công!');
        closeFeedbackModal();
      } else {
        toast.error(data.error || 'Lỗi khi lưu nhận xét');
      }
    } catch {
      toast.error('Lỗi khi lưu nhận xét');
    } finally {
      setSubmittingFeedback(false);
    }
  };

  // Simple classic table: each row is a lesson
  const renderSimpleLessonTable = () => {
    if (!schedules.length) {
      return (
        <div className="text-center py-12">
          <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500">Chưa có lịch dạy nào cho tuần này</p>
          <p className="text-sm text-gray-400 mt-2">Vui lòng liên hệ ban giám hiệu để được phân công lịch dạy</p>
        </div>
      );
    }
    // Sort by day_of_week, then by time_slot.order_index
    const sortedLessons = [...schedules]
      .sort((a, b) => {
        if (a.day_of_week !== b.day_of_week) return a.day_of_week - b.day_of_week;
        return (a.time_slot?.order_index || 0) - (b.time_slot?.order_index || 0);
      });
    return (
      <div className="overflow-x-auto">
        <table className="w-full border-collapse border border-gray-300">
          <thead>
            <tr className="bg-gray-50">
              <th className="border border-gray-300 px-4 py-2">Thứ</th>
              <th className="border border-gray-300 px-4 py-2">Tiết học</th>
              <th className="border border-gray-300 px-4 py-2">Môn học</th>
              <th className="border border-gray-300 px-4 py-2">Lớp</th>
              <th className="border border-gray-300 px-4 py-2">Phòng</th>
              <th className="border border-gray-300 px-4 py-2">Ghi chú</th>
            </tr>
          </thead>
          <tbody>
            {sortedLessons.map((lesson, idx) => (
              <tr key={lesson.id || idx}>
                <td className="border border-gray-300 px-4 py-2">{dayNames[lesson.day_of_week] || '---'}</td>
                <td className="border border-gray-300 px-4 py-2">{lesson.time_slot?.name || '---'}<br/>{lesson.time_slot?.start_time} - {lesson.time_slot?.end_time}</td>
                <td className="border border-gray-300 px-4 py-2">{lesson.subject?.name || '---'}</td>
                <td className="border border-gray-300 px-4 py-2">{lesson.class?.name || '---'}</td>
                <td className="border border-gray-300 px-4 py-2">{lesson.room_number || '---'}</td>
                <td className="border border-gray-300 px-4 py-2">{lesson.notes || ''}</td>
                <td className="border border-gray-300 px-4 py-2">
                  <Button size="sm" variant="outline" onClick={() => openFeedbackModal(lesson)}>
                    Nhận xét học sinh
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  // Single straight column view for all lessons
  const renderSingleColumnSchedule = () => {
    if (!schedules.length) {
      return (
        <div className="text-center py-12">
          <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500">Chưa có lịch dạy nào cho tuần này</p>
          <p className="text-sm text-gray-400 mt-2">Vui lòng liên hệ ban giám hiệu để được phân công lịch dạy</p>
        </div>
      );
    }
    // Sort all lessons by day_of_week, then by time_slot.order_index
    const sortedLessons = [...schedules]
      .filter(s => s && s.subject && s.class && s.time_slot)
      .sort((a, b) => {
        if (a.day_of_week !== b.day_of_week) return a.day_of_week - b.day_of_week;
        return a.time_slot.order_index - b.time_slot.order_index;
      });
    return (
      <div className="space-y-4">
        <div className="mb-2">
          <span className="font-semibold text-lg text-blue-700">Lịch dạy tuần này (dạng cột thẳng)</span>
        </div>
        <div className="flex flex-col gap-4">
          {sortedLessons.map((lesson, idx) => {
            const isCombinedClass = lesson.class.is_combined;
            return (
              <Card key={lesson.id || idx} className="w-full">
                <CardContent className="py-4 flex flex-col gap-2">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-xs px-2 py-1">
                      {dayNames[lesson.day_of_week]}
                    </Badge>
                    <span className="text-sm text-gray-600">
                      {lesson.time_slot.name} ({lesson.time_slot.start_time} - {lesson.time_slot.end_time})
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-2 items-center">
                    <span className={`font-semibold ${isCombinedClass ? 'text-orange-700' : 'text-blue-700'}`}>{lesson.subject.name}</span>
                    <span className="text-xs text-gray-500">|</span>
                    <span className={`text-xs ${isCombinedClass ? 'bg-orange-100 text-orange-800' : 'bg-blue-100 text-blue-800'} px-2 py-1 rounded`}>
                      {lesson.class.name}{isCombinedClass && ' (Lớp ghép)'}
                    </span>
                    {lesson.room_number && (
                      <span className="text-xs bg-purple-100 text-purple-800 px-2 py-1 rounded flex items-center gap-1">
                        <MapPin className="h-3 w-3" />
                        {lesson.room_number}
                      </span>
                    )}
                  </div>
                  {lesson.notes && (
                    <div className="text-xs text-purple-700 bg-purple-50 rounded px-2 py-1">
                      {lesson.notes}
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    );
  };

  const canShowSchedules = selectedTerm && selectedWeek && user;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">Lịch dạy của tôi</h1>
          <p className="text-gray-600">Xem lịch dạy theo tuần</p>
        </div>
        <div className="flex space-x-2">
          <Button 
            variant="outline" 
            size="sm"
            onClick={fetchSchedules}
            disabled={!canShowSchedules}
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Làm mới
          </Button>
        </div>
      </div>
      {/* View mode toggle */}
      <div className="flex justify-end mb-2">
        <Tabs value={viewMode} onValueChange={v => v && setViewMode(v as 'table' | 'column')}>
          <TabsList>
            <TabsTrigger value="table">Bảng</TabsTrigger>
            <TabsTrigger value="column">Cột</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>
      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Chọn thời gian
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <label className="font-medium">Năm học</label>
              <Select value={selectedAcademicYear} onValueChange={setSelectedAcademicYear}>
                <SelectTrigger>
                  <SelectValue placeholder="Chọn năm học" />
                </SelectTrigger>
                <SelectContent>
                  {academicYears.map(year => (
                    <SelectItem key={year.id} value={year.id}>
                      {year.name} {year.is_current && '(Hiện tại)'}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="font-medium">Học kỳ</label>
              <Select value={selectedTerm} onValueChange={setSelectedTerm}>
                <SelectTrigger>
                  <SelectValue placeholder="Chọn học kỳ" />
                </SelectTrigger>
                <SelectContent>
                  {filteredTerms.map(term => (
                    <SelectItem key={term.id} value={term.id}>
                      {term.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="font-medium">Tuần học</label>
              <Select value={selectedWeek} onValueChange={setSelectedWeek}>
                <SelectTrigger>
                  <SelectValue placeholder="Chọn tuần" />
                </SelectTrigger>
                <SelectContent>
                  {availableWeeks.map(week => (
                    <SelectItem key={week} value={week.toString()}>
                      Tuần {week}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          
          {selectedTermData && (
            <div className="mt-4 p-3 bg-blue-50 rounded-lg">
              <p className="text-sm text-blue-800">
                <strong>{selectedTermData.name}:</strong> {selectedTermData.type === 'semester_1' ? 'Học kỳ 1 (18 tuần)' : selectedTermData.type === 'semester_2' ? 'Học kỳ 2 (17 tuần)' : 'Học kỳ hè (8 tuần)'}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Schedule Display */}
      {canShowSchedules && (
        <Card>
          <CardHeader>
            <CardTitle>
              Lịch dạy tuần {selectedWeek} - {selectedTermData?.name}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-8">
                <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4" />
                <p>Đang tải...</p>
              </div>
            ) : (
              viewMode === 'table' ? renderSimpleLessonTable() : renderSingleColumnSchedule()
            )}
          </CardContent>
        </Card>
      )}
      {feedbackOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
          <div className="bg-white rounded-lg shadow-lg w-full max-w-2xl p-6 relative">
            <h2 className="text-lg font-bold mb-4">Nhận xét tiết học ({feedbackLesson?.class?.name})</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="font-medium">Loại nhận xét</label>
                <Select value={feedbackType} onValueChange={v => setFeedbackType(v as any)}>
                  <SelectTrigger><SelectValue placeholder="Chọn loại" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="lesson">Nhận xét tiết học</SelectItem>
                    <SelectItem value="behavior">Nhận xét hành vi</SelectItem>
                    <SelectItem value="general">Nhận xét chung</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="font-medium">Phạm vi</label>
                <Select value={feedbackScope} onValueChange={v => setFeedbackScope(v as any)}>
                  <SelectTrigger><SelectValue placeholder="Chọn phạm vi" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="individual">Từng học sinh</SelectItem>
                    <SelectItem value="group">Nhóm</SelectItem>
                    <SelectItem value="class">Cả lớp</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            {/* Tags */}
            <div className="mb-4">
              <label className="font-medium">Tags</label>
              <div className="flex gap-2 flex-wrap">
                {tags.map(tag => (
                  <span key={tag} className="bg-blue-100 text-blue-800 px-2 py-1 rounded flex items-center gap-1">
                    {tag}
                    <button type="button" className="ml-1 text-xs" onClick={() => handleRemoveTag(tag)}>&times;</button>
                  </span>
                ))}
                <input
                  type="text"
                  value={tagInput}
                  onChange={e => setTagInput(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); handleAddTag(); }}}
                  placeholder="Thêm tag..."
                  className="border border-gray-300 rounded px-2 py-1 text-sm bg-white text-black placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary"
                />
                <Button size="sm" variant="outline" type="button" onClick={handleAddTag}>Thêm</Button>
              </div>
            </div>
            {/* Attachments (group/class) */}
            {feedbackScope !== 'individual' && (
              <div className="mb-4">
                <label className="font-medium">Đính kèm ảnh cho nhóm/lớp</label>
                <input type="file" multiple onChange={e => setAttachments(e.target.files ? Array.from(e.target.files) : [])} className="border border-gray-300 rounded px-2 py-1 text-sm bg-white text-black placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary" />
              </div>
            )}
            {/* Main content or per-student feedback */}
            {feedbackScope === 'individual' ? (
              <div className="space-y-4 max-h-[40vh] overflow-y-auto mb-4">
                {students.length === 0 && <div>Đang tải danh sách học sinh...</div>}
                {students.map(stu => (
                  <div key={stu.id} className="flex flex-col gap-1 border-b pb-2">
                    <label className="font-medium">{stu.full_name}</label>
                    <textarea
                      rows={2}
                      value={studentFeedbacks[stu.id] || ''}
                      onChange={e => handleFeedbackChange(stu.id, e.target.value)}
                      placeholder="Nhận xét..."
                      className="resize-none border border-gray-300 rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-primary w-full bg-white text-black placeholder-gray-500"
                    />
                    <input
                      type="file"
                      multiple
                      onChange={e => handleStudentAttachmentChange(stu.id, e.target.files)}
                      className="border border-gray-300 rounded px-2 py-1 text-sm bg-white text-black placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>
                ))}
              </div>
            ) : (
              <div className="mb-4">
                <label className="font-medium">Chọn học sinh nhận nhận xét này</label>
                <div className="flex flex-wrap gap-2 mb-2">
                  {students.map(stu => (
                    <label key={stu.id} className="flex items-center gap-1">
                      <input
                        type="checkbox"
                        checked={selectedStudents.includes(stu.id)}
                        onChange={() => handleSelectStudent(stu.id)}
                      />
                      <span>{stu.full_name}</span>
                    </label>
                  ))}
                </div>
                <label className="font-medium">Nội dung nhận xét</label>
                <textarea
                  rows={4}
                  value={mainContent}
                  onChange={e => setMainContent(e.target.value)}
                  placeholder="Nhập nội dung nhận xét..."
                  className="resize-none border border-gray-300 rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-primary w-full bg-white text-black placeholder-gray-500"
                />
              </div>
            )}
            <div className="flex justify-end gap-2 mt-6">
              <Button variant="ghost" onClick={closeFeedbackModal} disabled={submittingFeedback}>Đóng</Button>
              <Button onClick={handleSubmitFeedback} disabled={submittingFeedback}>
                {submittingFeedback ? 'Đang lưu...' : 'Lưu nhận xét'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 