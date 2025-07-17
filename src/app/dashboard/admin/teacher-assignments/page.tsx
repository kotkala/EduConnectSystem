'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { 
  Plus,
  Search,
  BookOpen,
  Users,
  Clock,
  Calendar,
  User,
  GraduationCap
} from 'lucide-react';
import { SimpleTeacherAssignmentForm, SimpleTeacherAssignmentFormData } from '@/components/admin/teacher-form';

interface AcademicTerm {
  id: string;
  name: string;
  start_date: string;
  end_date: string;
}

interface Class {
  id: string;
  name: string;
  grade_level: {
    id: string;
    name: string;
  };
}

interface Teacher {
  id: string;
  full_name: string;
  role: string;
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
}

interface SubjectAssignment {
  id: string;
  teacher: Teacher;
  class: Class;
  subject: Subject;
  academic_term: AcademicTerm;
  total_periods: number;
  schedules: any[];
}

interface HomeroomAssignment {
  id: string;
  teacher: Teacher;
  class: Class;
  academic_year: {
    id: string;
    name: string;
  };
  assigned_date: string;
}

interface AssignmentStats {
  totalSubjectAssignments: number;
  totalHomeroomAssignments: number;
  teachersWithAssignments: number;
  classesWithHomeroom: number;
}

export default function TeacherAssignmentsPage() {
  const [academicTerms, setAcademicTerms] = useState<AcademicTerm[]>([]);
  const [classes, setClasses] = useState<Class[]>([]);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([]);
  const [subjectAssignments, setSubjectAssignments] = useState<SubjectAssignment[]>([]);
  const [homeroomAssignments, setHomeroomAssignments] = useState<HomeroomAssignment[]>([]);
  const [stats, setStats] = useState<AssignmentStats>({
    totalSubjectAssignments: 0,
    totalHomeroomAssignments: 0,
    teachersWithAssignments: 0,
    classesWithHomeroom: 0
  });

  const [selectedTerm, setSelectedTerm] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('subject');

  // Assignment form states
  const [showAssignmentForm, setShowAssignmentForm] = useState(false);

  useEffect(() => {
    fetchInitialData();
  }, []);

  useEffect(() => {
    if (selectedTerm) {
      fetchAssignments();
    }
  }, [selectedTerm, activeTab]);

  const fetchInitialData = async () => {
    try {
      const [termsRes, classesRes, teachersRes, subjectsRes, timeSlotsRes] = await Promise.all([
        fetch('/api/academic-terms'),
        fetch('/api/classes'),
        fetch('/api/users?role=teacher'),
        fetch('/api/subjects'),
        fetch('/api/time-slots')
      ]);

      const [termsData, classesData, teachersData, subjectsData, timeSlotsData] = await Promise.all([
        termsRes.json(),
        classesRes.json(),
        teachersRes.json(),
        subjectsRes.json(),
        timeSlotsRes.json()
      ]);

      setAcademicTerms(termsData.data || termsData);
      setClasses(classesData.data || classesData);
      const teachers = teachersData.data || teachersData;
      setTeachers(teachers.filter((t: Teacher) => 
        t.role === 'subject_teacher' || t.role === 'homeroom_teacher' || t.role === 'school_administrator'
      ));
      setSubjects(subjectsData.data || subjectsData);
      setTimeSlots((timeSlotsData.data || timeSlotsData).sort((a: TimeSlot, b: TimeSlot) => a.order_index - b.order_index));

      const terms = termsData.data || termsData;
      if (terms.length > 0) {
        setSelectedTerm(terms[0].id);
      }
    } catch (error) {
      toast.error('Lỗi khi tải dữ liệu');
    }
  };

  const fetchAssignments = async () => {
    if (!selectedTerm) return;

    setLoading(true);
    try {
      const params = new URLSearchParams({
        academic_term_id: selectedTerm,
        type: activeTab === 'subject' ? 'subject' : 'homeroom'
      });

      const response = await fetch(`/api/teacher-assignments?${params}`);
      const data = await response.json();

      console.log('Fetched assignments data:', data); // Debug log

      if (response.ok) {
        if (activeTab === 'subject') {
          setSubjectAssignments(data.data || []); // Use data.data instead of data.assignments
        } else {
          setHomeroomAssignments(data.data || []); // Use data.data instead of data.assignments
        }
        calculateStats();
      } else {
        console.error('Failed to fetch assignments:', data);
        toast.error(data.error || 'Lỗi khi tải phân công');
      }
    } catch (error) {
      console.error('Error fetching assignments:', error);
      toast.error('Lỗi khi tải phân công');
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = () => {
    // Calculate statistics based on current assignments
    const uniqueTeachers = new Set([
      ...subjectAssignments.map(a => a.teacher.id),
      ...homeroomAssignments.map(a => a.teacher.id)
    ]);

    const classesWithHomeroom = new Set(homeroomAssignments.map(a => a.class.id));

    setStats({
      totalSubjectAssignments: subjectAssignments.length,
      totalHomeroomAssignments: homeroomAssignments.length,
      teachersWithAssignments: uniqueTeachers.size,
      classesWithHomeroom: classesWithHomeroom.size
    });
  };

  const handleCreateAssignment = async (formData: SimpleTeacherAssignmentFormData) => {
    try {
      const response = await fetch('/api/teacher-assignments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          action: 'simple_assign'
        })
      });

      const data = await response.json();

      if (response.ok) {
        toast.success(data.message || 'Phân công giáo viên thành công!');
        setShowAssignmentForm(false);
        fetchAssignments();
      } else {
        toast.error(data.error || 'Lỗi khi phân công giáo viên');
      }
    } catch (error) {
      toast.error('Lỗi khi phân công giáo viên');
    }
  };

  const filteredSubjectAssignments = subjectAssignments.filter(assignment =>
    assignment.teacher.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    assignment.class.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    assignment.subject.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredHomeroomAssignments = homeroomAssignments.filter(assignment =>
    assignment.teacher.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    assignment.class.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getDayName = (dayNumber: number) => {
    const days = ['Chủ nhật', 'Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7'];
    return days[dayNumber] || 'N/A';
  };

  if (showAssignmentForm) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Phân công giáo viên</h1>
            <p className="text-muted-foreground">
              Phân công giáo viên dạy môn học cho các lớp
            </p>
          </div>
        </div>

                    <SimpleTeacherAssignmentForm
          academicTerms={academicTerms}
          teachers={teachers}
          classes={classes}
          subjects={subjects}
          onSubmit={handleCreateAssignment}
          onCancel={() => setShowAssignmentForm(false)}
          loading={loading}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Phân công giáo viên</h1>
          <p className="text-muted-foreground">
            Quản lý phân công giáo viên dạy môn học và chủ nhiệm lớp
          </p>
        </div>
        <Button onClick={() => setShowAssignmentForm(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Phân công mới
        </Button>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <BookOpen className="h-5 w-5 text-blue-500" />
              <div>
                <div className="text-2xl font-bold">{stats.totalSubjectAssignments}</div>
                <div className="text-sm text-gray-600">Phân công môn học</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <GraduationCap className="h-5 w-5 text-green-500" />
              <div>
                <div className="text-2xl font-bold">{stats.totalHomeroomAssignments}</div>
                <div className="text-sm text-gray-600">Phân công chủ nhiệm</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Users className="h-5 w-5 text-purple-500" />
              <div>
                <div className="text-2xl font-bold">{stats.teachersWithAssignments}</div>
                <div className="text-sm text-gray-600">Giáo viên có phân công</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Clock className="h-5 w-5 text-orange-500" />
              <div>
                <div className="text-2xl font-bold">{stats.classesWithHomeroom}</div>
                <div className="text-sm text-gray-600">Lớp có chủ nhiệm</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Bộ lọc</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <Label>Học kỳ</Label>
              <select 
                value={selectedTerm} 
                onChange={(e) => setSelectedTerm(e.target.value)}
                className="w-full mt-1 p-2 border rounded-md"
              >
                {academicTerms.map(term => (
                  <option key={term.id} value={term.id}>
                    {term.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex-1">
              <Label>Tìm kiếm</Label>
              <div className="relative mt-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Tìm kiếm giáo viên, lớp, môn học..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Assignments List */}
      <Card>
        <CardHeader>
          <CardTitle>Danh sách phân công</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="subject">
                <BookOpen className="h-4 w-4 mr-2" />
                Phân công môn học
              </TabsTrigger>
              <TabsTrigger value="homeroom">
                <GraduationCap className="h-4 w-4 mr-2" />
                Phân công chủ nhiệm
              </TabsTrigger>
            </TabsList>

            <TabsContent value="subject" className="mt-4">
              {loading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
                  <p className="mt-2">Đang tải...</p>
                </div>
              ) : filteredSubjectAssignments.length === 0 ? (
                <div className="text-center py-8">
                  <BookOpen className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">Chưa có phân công môn học nào</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredSubjectAssignments.map(assignment => (
                    <Card key={assignment.id} className="hover:shadow-md transition-shadow">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="space-y-2">
                            <div className="flex items-center space-x-4">
                              <Badge variant="outline" className="bg-blue-50">
                                {assignment.subject.name}
                              </Badge>
                              <span className="font-medium">{assignment.teacher.full_name}</span>
                              <span className="text-gray-600">→</span>
                              <span className="font-medium">{assignment.class.name}</span>
                            </div>
                            <div className="text-sm text-gray-600">
                              <span className="flex items-center">
                                <Calendar className="h-4 w-4 mr-1" />
                                {assignment.total_periods > 0 ? `${assignment.total_periods} tiết/tuần` : 'Chưa có thời khóa biểu'}
                              </span>
                            </div>
                            {assignment.schedules.length > 0 ? (
                              <div className="flex flex-wrap gap-1">
                                {assignment.schedules.map((schedule: any, index: number) => (
                                  <Badge key={`${schedule.id || schedule.day_of_week}-${schedule.time_slot_id || index}`} variant="secondary" className="text-xs">
                                    {getDayName(schedule.day_of_week)} - {schedule.time_slot?.name}
                                  </Badge>
                                ))}
                              </div>
                            ) : (
                              <div className="text-sm text-amber-600 bg-amber-50 px-2 py-1 rounded">
                                ⏳ Sẽ được tạo thời khóa biểu tự động
                              </div>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="homeroom" className="mt-4">
              {loading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
                  <p className="mt-2">Đang tải...</p>
                </div>
              ) : filteredHomeroomAssignments.length === 0 ? (
                <div className="text-center py-8">
                  <GraduationCap className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">Chưa có phân công chủ nhiệm nào</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredHomeroomAssignments.map(assignment => (
                    <Card key={assignment.id} className="hover:shadow-md transition-shadow">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="space-y-2">
                            <div className="flex items-center space-x-4">
                              <Badge variant="outline" className="bg-green-50">
                                Chủ nhiệm
                              </Badge>
                              <span className="font-medium">{assignment.teacher.full_name}</span>
                              <span className="text-gray-600">→</span>
                              <span className="font-medium">{assignment.class.name}</span>
                            </div>
                            <div className="text-sm text-gray-600">
                              <span className="flex items-center">
                                <Calendar className="h-4 w-4 mr-1" />
                                Từ {new Date(assignment.assigned_date).toLocaleDateString('vi-VN')}
                              </span>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
} 