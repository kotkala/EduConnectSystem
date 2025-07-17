'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
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

  const renderScheduleGrid = () => {
    if (!schedules.length) {
      return (
        <div className="text-center py-12">
          <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500">Chưa có lịch dạy nào cho tuần này</p>
          <p className="text-sm text-gray-400 mt-2">Vui lòng liên hệ ban giám hiệu để được phân công lịch dạy</p>
        </div>
      );
    }

    // Group schedules by day and time slot
    const scheduleGrid: { [key: string]: TeachingSchedule[] } = {};
    schedules.forEach(schedule => {
      const key = `${schedule.day_of_week}-${schedule.time_slot.id}`;
      if (!scheduleGrid[key]) {
        scheduleGrid[key] = [];
      }
      scheduleGrid[key].push(schedule);
    });

    return (
      <div className="space-y-6">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse border border-gray-300">
            <thead>
              <tr className="bg-gray-50">
                <th className="border border-gray-300 px-4 py-2 text-left">Tiết học</th>
                {dayNames.slice(1).map((day, index) => (
                  <th key={index + 1} className="border border-gray-300 px-4 py-2 text-center min-w-[250px]">
                    {day}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {timeSlots.map(timeSlot => (
                <tr key={timeSlot.id}>
                  <td className="border border-gray-300 px-4 py-2 bg-gray-50 font-medium">
                    <div className="text-sm">
                      <div>{timeSlot.name}</div>
                      <div className="text-gray-500">
                        {timeSlot.start_time} - {timeSlot.end_time}
                      </div>
                      {timeSlot.is_break && (
                        <div className="text-xs text-orange-600 font-medium">
                          (Nghỉ giải lao)
                        </div>
                      )}
                    </div>
                  </td>
                  {[1, 2, 3, 4, 5, 6].map(dayOfWeek => {
                    const schedulesInSlot = scheduleGrid[`${dayOfWeek}-${timeSlot.id}`] || [];
                    
                    return (
                      <td key={dayOfWeek} className="border border-gray-300 px-2 py-2 min-h-[120px] align-top">
                        {schedulesInSlot.length > 0 ? (
                          <div className="space-y-1">
                            {schedulesInSlot.map((schedule, index) => {
                              // Check if this is a special activity
                              if (schedule.notes && !schedule.subject) {
                                return (
                                  <div key={index} className="bg-purple-50 border border-purple-200 rounded p-2">
                                    <div className="text-sm font-medium text-purple-900">
                                      {schedule.notes}
                                    </div>
                                    {schedule.room_number && (
                                      <div className="text-xs text-purple-600 flex items-center gap-1">
                                        <MapPin className="h-3 w-3" />
                                        {schedule.room_number}
                                      </div>
                                    )}
                                  </div>
                                );
                              }

                              // Regular subject schedule
                              const isCombinedClass = schedule.class.is_combined;
                              
                              return (
                                <div 
                                  key={index} 
                                  className={`border rounded p-2 ${
                                    isCombinedClass 
                                      ? 'bg-orange-50 border-orange-200' 
                                      : 'bg-blue-50 border-blue-200'
                                  }`}
                                >
                                  <div className={`text-sm font-medium ${
                                    isCombinedClass ? 'text-orange-900' : 'text-blue-900'
                                  }`}>
                                    {schedule.subject.name}
                                  </div>
                                  <div className={`text-xs ${
                                    isCombinedClass ? 'text-orange-700' : 'text-blue-700'
                                  } flex items-center gap-1`}>
                                    <Users className="h-3 w-3" />
                                    {schedule.class.name}
                                    {isCombinedClass && (
                                      <span className="ml-1 text-xs bg-orange-200 px-1 rounded">
                                        Lớp ghép
                                      </span>
                                    )}
                                  </div>
                                  {schedule.room_number && (
                                    <div className={`text-xs ${
                                      isCombinedClass ? 'text-orange-600' : 'text-blue-600'
                                    } flex items-center gap-1`}>
                                      <MapPin className="h-3 w-3" />
                                      {schedule.room_number}
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        ) : (
                          <div className="h-full min-h-[100px] bg-gray-50 rounded border-2 border-dashed border-gray-200 flex items-center justify-center">
                            <span className="text-gray-400 text-xs">Rảnh</span>
                          </div>
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
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
              <Label htmlFor="academic-year">Năm học</Label>
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
              <Label htmlFor="term">Học kỳ</Label>
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
              <Label htmlFor="week">Tuần học</Label>
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
              renderScheduleGrid()
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
} 