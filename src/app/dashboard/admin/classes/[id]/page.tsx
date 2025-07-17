'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';
import { 
  ArrowLeft,
  Users,
  UserCheck,
  Upload,
  Download,
  Search,
  Plus,
  Trash2,
  Home,
  GraduationCap,
  Calendar,
  MapPin
} from 'lucide-react';

interface Class {
  id: string;
  name: string;
  code: string;
  capacity: number;
  room_number?: string;
  is_combined: boolean;
  metadata: any;
  academic_year: {
    id: string;
    name: string;
    is_current: boolean;
  };
  grade_level: {
    id: string;
    name: string;
    level: number;
  };
}

interface Student {
  id: string;
  full_name: string;
  phone: string;
  gender?: string;
  date_of_birth?: string;
  enrollment_date: string;
  is_active: boolean;
}

interface Teacher {
  id: string;
  full_name: string;
  phone: string;
  role: string;
}

interface HomeroomAssignment {
  id: string;
  teacher_id: string;
  assigned_date: string;
  is_active: boolean;
  teacher: Teacher;
}

export default function ClassDetailPage() {
  const params = useParams();
  const router = useRouter();
  const classId = params.id as string;

  const [classData, setClassData] = useState<Class | null>(null);
  const [students, setStudents] = useState<Student[]>([]);
  const [availableStudents, setAvailableStudents] = useState<Student[]>([]);
  const [homeroomAssignment, setHomeroomAssignment] = useState<HomeroomAssignment | null>(null);
  const [availableTeachers, setAvailableTeachers] = useState<Teacher[]>([]);
  
  const [loading, setLoading] = useState(true);
  const [studentsLoading, setStudentsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStudents, setSelectedStudents] = useState<string[]>([]);
  const [selectedTeacher, setSelectedTeacher] = useState('');

  // Stats
  const [stats, setStats] = useState({
    totalStudents: 0,
    activeStudents: 0,
    availableCapacity: 0,
    hasHomeroomTeacher: false
  });

  useEffect(() => {
    if (classId) {
      fetchClassData();
      fetchStudents();
      fetchHomeroomAssignment();
      fetchAvailableTeachers();
    }
  }, [classId]);

  useEffect(() => {
    updateStats();
  }, [students, classData, homeroomAssignment]);

  const fetchClassData = async () => {
    try {
      const response = await fetch(`/api/classes/${classId}`);
      const result = await response.json();
      
      if (response.ok) {
        setClassData(result.data);
      } else {
        toast.error('Lỗi khi tải thông tin lớp học');
      }
    } catch (error) {
      toast.error('Lỗi khi tải thông tin lớp học');
    } finally {
      setLoading(false);
    }
  };

  const fetchStudents = async () => {
    setStudentsLoading(true);
    try {
      const response = await fetch(`/api/classes/${classId}/students`);
      const result = await response.json();
      
      if (response.ok) {
        // Process enrollment data to get student information
        const studentsData = (result.data || []).map((enrollment: any) => ({
          id: enrollment.student?.id,
          full_name: enrollment.student?.full_name,
          phone: enrollment.student?.phone,
          gender: enrollment.student?.gender,
          date_of_birth: enrollment.student?.date_of_birth,
          enrollment_date: enrollment.enrollment_date,
          is_active: enrollment.is_active
        }));
        setStudents(studentsData);
      } else {
        toast.error('Lỗi khi tải danh sách học sinh');
      }
    } catch (error) {
      toast.error('Lỗi khi tải danh sách học sinh');
    } finally {
      setStudentsLoading(false);
    }
  };

  const fetchHomeroomAssignment = async () => {
    try {
      const response = await fetch(`/api/classes/${classId}/homeroom-teacher`);
      if (response.ok) {
        const result = await response.json();
        setHomeroomAssignment(result.data);
      }
    } catch (error) {
      console.error('Error fetching homeroom assignment:', error);
    }
  };

  const fetchAvailableTeachers = async () => {
    try {
      const response = await fetch('/api/users?role=homeroom_teacher,subject_teacher');
      const result = await response.json();
      const teachers = result.data || result || [];
      
      // Ensure teachers is an array before filtering
      if (Array.isArray(teachers)) {
        setAvailableTeachers(teachers.filter((t: Teacher) => 
          t.role === 'homeroom_teacher' || t.role === 'subject_teacher'
        ));
      } else {
        console.error('Teachers data is not an array:', teachers);
        setAvailableTeachers([]);
      }
    } catch (error) {
      console.error('Error fetching teachers:', error);
      setAvailableTeachers([]);
    }
  };

  const fetchAvailableStudents = async () => {
    try {
      const response = await fetch('/api/students/available');
      const result = await response.json();
      setAvailableStudents(result.data || result);
    } catch (error) {
      console.error('Error fetching available students:', error);
    }
  };

  const updateStats = () => {
    const totalStudents = students.length;
    const activeStudents = students.filter(s => s.is_active).length;
    const availableCapacity = classData ? classData.capacity - activeStudents : 0;
    const hasHomeroomTeacher = homeroomAssignment?.is_active || false;

    setStats({
      totalStudents,
      activeStudents,
      availableCapacity,
      hasHomeroomTeacher
    });
  };

  const handleAssignHomeroomTeacher = async () => {
    if (!selectedTeacher) {
      toast.error('Vui lòng chọn giáo viên chủ nhiệm');
      return;
    }

    if (!classData?.academic_year?.id) {
      toast.error('Không tìm thấy thông tin năm học của lớp');
      return;
    }

    try {
      console.log('Assigning homeroom teacher:', {
        teacher_id: selectedTeacher,
        academic_year_id: classData.academic_year.id,
        class_id: classId
      });

      const response = await fetch(`/api/classes/${classId}/homeroom-teacher`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          teacher_id: selectedTeacher,
          academic_year_id: classData.academic_year.id
        }),
      });

      const result = await response.json();
      console.log('Homeroom assignment result:', result);

      if (response.ok && result.success) {
        toast.success('Gán giáo viên chủ nhiệm thành công');
        setSelectedTeacher('');
        await fetchHomeroomAssignment();
      } else {
        console.error('Homeroom assignment failed:', result);
        toast.error(result.error || 'Lỗi khi gán giáo viên chủ nhiệm');
      }
    } catch (error) {
      console.error('Error assigning homeroom teacher:', error);
      toast.error('Lỗi kết nối khi gán giáo viên chủ nhiệm');
    }
  };

  const handleRemoveHomeroomTeacher = async () => {
    if (!homeroomAssignment) return;

    if (!confirm('Bạn có chắc chắn muốn bỏ nhiệm giáo viên chủ nhiệm?')) return;

    try {
      const response = await fetch(`/api/classes/${classId}/homeroom-teacher`, {
        method: 'DELETE',
      });

      if (response.ok) {
        toast.success('Bỏ nhiệm giáo viên chủ nhiệm thành công');
        setHomeroomAssignment(null);
      } else {
        const result = await response.json();
        toast.error(result.error || 'Lỗi khi bỏ nhiệm giáo viên chủ nhiệm');
      }
    } catch (error) {
      toast.error('Lỗi khi bỏ nhiệm giáo viên chủ nhiệm');
    }
  };

  const handleAddStudents = async () => {
    if (selectedStudents.length === 0) {
      toast.error('Vui lòng chọn học sinh để thêm vào lớp');
      return;
    }

    try {
      const response = await fetch(`/api/classes/${classId}/students`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          student_ids: selectedStudents,
          academic_year_id: classData?.academic_year.id
        }),
      });

      const result = await response.json();

      if (response.ok) {
        toast.success(`Thêm ${selectedStudents.length} học sinh vào lớp thành công`);
        setSelectedStudents([]);
        fetchStudents();
        setAvailableStudents(prev => 
          prev.filter(s => !selectedStudents.includes(s.id))
        );
      } else {
        toast.error(result.error || 'Lỗi khi thêm học sinh vào lớp');
      }
    } catch (error) {
      toast.error('Lỗi khi thêm học sinh vào lớp');
    }
  };

  const handleRemoveStudent = async (studentId: string) => {
    if (!confirm('Bạn có chắc chắn muốn loại bỏ học sinh khỏi lớp?')) return;

    try {
      const response = await fetch(`/api/classes/${classId}/students`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ student_ids: [studentId] }),
      });

      if (response.ok) {
        toast.success('Loại bỏ học sinh khỏi lớp thành công');
        fetchStudents();
      } else {
        const result = await response.json();
        toast.error(result.error || 'Lỗi khi loại bỏ học sinh');
      }
    } catch (error) {
      toast.error('Lỗi khi loại bỏ học sinh');
    }
  };

  const filteredStudents = students.filter(student =>
    (student.full_name?.toLowerCase()?.includes(searchTerm.toLowerCase()) || false) ||
    (student.phone?.includes(searchTerm) || false)
  );

  const filteredAvailableStudents = availableStudents.filter(student =>
    (student.full_name?.toLowerCase()?.includes(searchTerm.toLowerCase()) || false) ||
    (student.phone?.includes(searchTerm) || false)
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p>Đang tải...</p>
        </div>
      </div>
    );
  }

  if (!classData) {
    return (
      <div className="text-center py-8">
        <p className="text-red-600">Không tìm thấy thông tin lớp học</p>
        <Button onClick={() => router.back()} className="mt-4">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Quay lại
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button variant="outline" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Quay lại
          </Button>
          <div>
            <div className="flex items-center space-x-3">
              <h1 className="text-2xl font-bold">{classData.name}</h1>
              <Badge variant={classData.is_combined ? 'default' : 'secondary'}>
                {classData.is_combined ? 'Lớp ghép' : 'Lớp tách'}
              </Badge>
            </div>
            <p className="text-gray-600">Mã lớp: {classData.code}</p>
          </div>
        </div>
      </div>

      {/* Class Info Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Users className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Tổng học sinh</p>
                <p className="text-xl font-bold">{stats.totalStudents}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <UserCheck className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Đang học</p>
                <p className="text-xl font-bold">{stats.activeStudents}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-orange-100 rounded-lg">
                <GraduationCap className="h-5 w-5 text-orange-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Sức chứa còn lại</p>
                <p className="text-xl font-bold">{stats.availableCapacity}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Home className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Chủ nhiệm</p>
                <p className="text-xl font-bold">
                  {stats.hasHomeroomTeacher ? 'Có' : 'Chưa có'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Class Details */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Calendar className="h-5 w-5" />
            <span>Thông tin lớp học</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label>Năm học</Label>
              <p className="font-medium">{classData.academic_year.name}</p>
            </div>
            <div>
              <Label>Khối lớp</Label>
              <p className="font-medium">{classData.grade_level.name}</p>
            </div>
            <div>
              <Label>Sức chứa</Label>
              <p className="font-medium">{classData.capacity} học sinh</p>
            </div>
            {classData.room_number && (
              <div>
                <Label>Phòng học</Label>
                <p className="font-medium flex items-center">
                  <MapPin className="h-4 w-4 mr-1" />
                  {classData.room_number}
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Main Content Tabs */}
      <Tabs defaultValue="students" className="space-y-4">
        <TabsList>
          <TabsTrigger value="students">Học sinh</TabsTrigger>
          <TabsTrigger value="homeroom">Giáo viên chủ nhiệm</TabsTrigger>
          <TabsTrigger value="add-students">Thêm học sinh</TabsTrigger>
        </TabsList>

        {/* Students Tab */}
        <TabsContent value="students" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Danh sách học sinh ({filteredStudents.length})</CardTitle>
                <div className="flex items-center space-x-2">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      placeholder="Tìm kiếm học sinh..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {studentsLoading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto mb-2"></div>
                  <p>Đang tải danh sách học sinh...</p>
                </div>
              ) : filteredStudents.length === 0 ? (
                <div className="text-center py-8">
                  <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">Chưa có học sinh nào trong lớp</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {filteredStudents.map((student) => (
                    <div
                      key={student.id}
                      className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50"
                    >
                      <div className="flex items-center space-x-3">
                        <div>
                          <p className="font-medium">{student.full_name}</p>
                          <p className="text-sm text-gray-600">{student.phone}</p>
                        </div>
                        {!student.is_active && (
                          <Badge variant="outline" className="text-red-600">
                            Không hoạt động
                          </Badge>
                        )}
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleRemoveStudent(student.id)}
                        className="text-red-600 hover:text-red-800"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Homeroom Teacher Tab */}
        <TabsContent value="homeroom" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Giáo viên chủ nhiệm</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {homeroomAssignment ? (
                <div className="p-4 border rounded-lg bg-green-50">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">{homeroomAssignment.teacher.full_name}</p>
                      <p className="text-sm text-gray-600">
                        Được gán từ: {new Date(homeroomAssignment.assigned_date).toLocaleDateString('vi-VN')}
                      </p>
                      <p className="text-sm text-gray-600">
                        SĐT: {homeroomAssignment.teacher.phone}
                      </p>
                    </div>
                    <Button
                      variant="outline"
                      onClick={handleRemoveHomeroomTeacher}
                      className="text-red-600 hover:text-red-800"
                    >
                      Bỏ nhiệm
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8">
                  <Home className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500 mb-4">Chưa có giáo viên chủ nhiệm</p>
                  
                  <div className="max-w-md mx-auto space-y-4">
                    <div>
                      <Label>Chọn giáo viên chủ nhiệm</Label>
                      <Select value={selectedTeacher} onValueChange={setSelectedTeacher}>
                        <SelectTrigger>
                          <SelectValue placeholder="Chọn giáo viên" />
                        </SelectTrigger>
                        <SelectContent>
                          {availableTeachers
                            .filter(teacher => teacher.role === 'homeroom_teacher' || teacher.role === 'subject_teacher')
                            .map((teacher) => (
                            <SelectItem key={teacher.id} value={teacher.id}>
                              {teacher.full_name} - {teacher.phone}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <Button 
                      onClick={handleAssignHomeroomTeacher} 
                      className="w-full"
                      disabled={!selectedTeacher}
                    >
                      Gán giáo viên chủ nhiệm
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Add Students Tab */}
        <TabsContent value="add-students" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Thêm học sinh vào lớp</CardTitle>
                <div className="flex items-center space-x-2">
                  <Button 
                    variant="outline" 
                    onClick={fetchAvailableStudents}
                    size="sm"
                  >
                    Tải danh sách
                  </Button>
                  {selectedStudents.length > 0 && (
                    <Button onClick={handleAddStudents}>
                      <Plus className="h-4 w-4 mr-2" />
                      Thêm {selectedStudents.length} học sinh
                    </Button>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {availableStudents.length === 0 ? (
                <div className="text-center py-8">
                  <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">Không có học sinh nào có thể thêm vào lớp</p>
                  <Button 
                    variant="outline" 
                    onClick={fetchAvailableStudents}
                    className="mt-2"
                  >
                    Tải lại danh sách
                  </Button>
                </div>
              ) : (
                <div className="space-y-2">
                  {filteredAvailableStudents.map((student) => (
                    <div
                      key={student.id}
                      className="flex items-center space-x-3 p-3 border rounded-lg hover:bg-gray-50"
                    >
                      <input
                        type="checkbox"
                        checked={selectedStudents.includes(student.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedStudents(prev => [...prev, student.id]);
                          } else {
                            setSelectedStudents(prev => prev.filter(id => id !== student.id));
                          }
                        }}
                        className="rounded"
                      />
                      <div className="flex-1">
                        <p className="font-medium">{student.full_name}</p>
                        <p className="text-sm text-gray-600">{student.phone}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
} 