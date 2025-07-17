'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { 
  Shield, 
  Clock, 
  Users, 
  BookOpen, 
  AlertTriangle,
  Plus,
  Edit,
  Trash2,
  RefreshCw
} from 'lucide-react';

interface ScheduleConstraint {
  id: string;
  constraint_type: string;
  teacher?: { full_name: string };
  class?: { name: string };
  subject?: { name: string };
  time_slot?: { name: string; start_time: string; end_time: string };
  day_of_week?: number;
  description: string;
  priority: 'low' | 'medium' | 'high';
  is_active: boolean;
  created_at: string;
}

interface Teacher {
  id: string;
  full_name: string;
}

interface Class {
  id: string;
  name: string;
  grade_level: { name: string };
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
}

const constraintTypes = [
  { value: 'teacher_unavailable', label: 'Giáo viên không có mặt', icon: Users },
  { value: 'class_unavailable', label: 'Lớp học không có mặt', icon: BookOpen },
  { value: 'subject_consecutive', label: 'Môn học liên tiếp', icon: Clock },
  { value: 'subject_not_consecutive', label: 'Môn học không liên tiếp', icon: AlertTriangle },
  { value: 'preferred_time', label: 'Thời gian ưu tiên', icon: Shield },
  { value: 'avoid_time', label: 'Tránh thời gian', icon: AlertTriangle },
  { value: 'max_daily_lessons', label: 'Tối đa tiết/ngày', icon: Clock },
  { value: 'break_between_lessons', label: 'Nghỉ giữa các tiết', icon: RefreshCw }
];

const priorityColors = {
  low: 'bg-green-100 text-green-800',
  medium: 'bg-yellow-100 text-yellow-800',
  high: 'bg-red-100 text-red-800'
};

const priorityLabels = {
  low: 'Thấp',
  medium: 'Trung bình',
  high: 'Cao'
};

const dayNames = ['', 'Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7'];

export default function ScheduleConstraintsPage() {
  const [constraints, setConstraints] = useState<ScheduleConstraint[]>([]);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [classes, setClasses] = useState<Class[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([]);
  const [selectedType, setSelectedType] = useState<string>('teacher_unavailable');
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingConstraint, setEditingConstraint] = useState<ScheduleConstraint | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    constraint_type: 'teacher_unavailable',
    teacher_id: '',
    class_id: '',
    subject_id: '',
    time_slot_id: '',
    day_of_week: '',
    description: '',
    priority: 'medium' as 'low' | 'medium' | 'high',
    is_active: true
  });

  useEffect(() => {
    fetchInitialData();
  }, []);

  useEffect(() => {
    fetchConstraints();
  }, [selectedType]);

  const fetchInitialData = async () => {
    try {
      const [teachersRes, classesRes, subjectsRes, timeSlotsRes] = await Promise.all([
        fetch('/api/users?role=teacher'), // This will return both subject_teacher and homeroom_teacher
        fetch('/api/classes'),
        fetch('/api/subjects'),
        fetch('/api/time-slots')
      ]);

      const [teachersData, classesData, subjectsData, timeSlotsData] = await Promise.all([
        teachersRes.json(),
        classesRes.json(),
        subjectsRes.json(),
        timeSlotsRes.json()
      ]);

      setTeachers(teachersData.data || teachersData);
      setClasses(classesData.data || classesData);
      setSubjects(subjectsData.data || subjectsData);
      setTimeSlots(timeSlotsData.data || timeSlotsData);
    } catch (error) {
      toast.error('Lỗi khi tải dữ liệu');
    }
  };

  const fetchConstraints = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        type: selectedType
      });

      const response = await fetch(`/api/schedule-constraints?${params}`);
      const data = await response.json();

      if (response.ok) {
        setConstraints(data);
      } else {
        toast.error(data.error || 'Lỗi khi tải ràng buộc');
      }
    } catch (error) {
      toast.error('Lỗi khi tải ràng buộc');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const url = editingConstraint 
        ? `/api/schedule-constraints/${editingConstraint.id}`
        : '/api/schedule-constraints';
      
      const method = editingConstraint ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          day_of_week: formData.day_of_week ? parseInt(formData.day_of_week) : null,
          teacher_id: formData.teacher_id || null,
          class_id: formData.class_id || null,
          subject_id: formData.subject_id || null,
          time_slot_id: formData.time_slot_id || null
        }),
      });

      const data = await response.json();

      if (response.ok) {
        toast.success(editingConstraint ? 'Cập nhật ràng buộc thành công' : 'Thêm ràng buộc thành công');
        setShowForm(false);
        setEditingConstraint(null);
        resetForm();
        fetchConstraints();
      } else {
        toast.error(data.error || 'Lỗi khi lưu ràng buộc');
      }
    } catch (error) {
      toast.error('Lỗi khi lưu ràng buộc');
    }
  };

  const handleEdit = (constraint: ScheduleConstraint) => {
    setEditingConstraint(constraint);
    setFormData({
      constraint_type: constraint.constraint_type,
      teacher_id: constraint.teacher ? 'teacher_id' : '',
      class_id: constraint.class ? 'class_id' : '',
      subject_id: constraint.subject ? 'subject_id' : '',
      time_slot_id: constraint.time_slot ? 'time_slot_id' : '',
      day_of_week: constraint.day_of_week ? constraint.day_of_week.toString() : '',
      description: constraint.description,
      priority: constraint.priority,
      is_active: constraint.is_active
    });
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Bạn có chắc chắn muốn xóa ràng buộc này?')) return;

    try {
      const response = await fetch(`/api/schedule-constraints?id=${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        toast.success('Xóa ràng buộc thành công');
        fetchConstraints();
      } else {
        const data = await response.json();
        toast.error(data.error || 'Lỗi khi xóa ràng buộc');
      }
    } catch (error) {
      toast.error('Lỗi khi xóa ràng buộc');
    }
  };

  const resetForm = () => {
    setFormData({
      constraint_type: selectedType,
      teacher_id: '',
      class_id: '',
      subject_id: '',
      time_slot_id: '',
      day_of_week: '',
      description: '',
      priority: 'medium',
      is_active: true
    });
  };

  const renderConstraintForm = () => {
    if (!showForm) return null;

    return (
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>
            {editingConstraint ? 'Chỉnh sửa ràng buộc' : 'Thêm ràng buộc mới'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="constraint_type">Loại ràng buộc</Label>
                <Select 
                  value={formData.constraint_type} 
                  onValueChange={(value) => setFormData({...formData, constraint_type: value})}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {constraintTypes.map(type => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="priority">Mức độ ưu tiên</Label>
                <Select 
                  value={formData.priority} 
                  onValueChange={(value: 'low' | 'medium' | 'high') => setFormData({...formData, priority: value})}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Thấp</SelectItem>
                    <SelectItem value="medium">Trung bình</SelectItem>
                    <SelectItem value="high">Cao</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Conditional fields based on constraint type */}
              {(formData.constraint_type === 'teacher_unavailable' || 
                formData.constraint_type === 'preferred_time' || 
                formData.constraint_type === 'avoid_time') && (
                <div>
                  <Label htmlFor="teacher_id">Giáo viên</Label>
                  <Select 
                    value={formData.teacher_id} 
                    onValueChange={(value) => setFormData({...formData, teacher_id: value})}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Chọn giáo viên" />
                    </SelectTrigger>
                    <SelectContent>
                      {teachers.map(teacher => (
                        <SelectItem key={teacher.id} value={teacher.id}>
                          {teacher.full_name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {formData.constraint_type === 'class_unavailable' && (
                <div>
                  <Label htmlFor="class_id">Lớp học</Label>
                  <Select 
                    value={formData.class_id} 
                    onValueChange={(value) => setFormData({...formData, class_id: value})}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Chọn lớp học" />
                    </SelectTrigger>
                    <SelectContent>
                      {classes.map(cls => (
                        <SelectItem key={cls.id} value={cls.id}>
                          {cls.name} - {cls.grade_level.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {(formData.constraint_type === 'subject_consecutive' || 
                formData.constraint_type === 'subject_not_consecutive') && (
                <div>
                  <Label htmlFor="subject_id">Môn học</Label>
                  <Select 
                    value={formData.subject_id} 
                    onValueChange={(value) => setFormData({...formData, subject_id: value})}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Chọn môn học" />
                    </SelectTrigger>
                    <SelectContent>
                      {subjects.map(subject => (
                        <SelectItem key={subject.id} value={subject.id}>
                          {subject.name} ({subject.code})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              <div>
                <Label htmlFor="time_slot_id">Tiết học</Label>
                <Select 
                  value={formData.time_slot_id} 
                  onValueChange={(value) => setFormData({...formData, time_slot_id: value})}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Chọn tiết học (tùy chọn)" />
                  </SelectTrigger>
                  <SelectContent>
                    {timeSlots.map(slot => (
                      <SelectItem key={slot.id} value={slot.id}>
                        {slot.name} ({slot.start_time} - {slot.end_time})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="day_of_week">Thứ trong tuần</Label>
                <Select 
                  value={formData.day_of_week} 
                  onValueChange={(value) => setFormData({...formData, day_of_week: value})}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Chọn thứ (tùy chọn)" />
                  </SelectTrigger>
                  <SelectContent>
                    {dayNames.slice(1).map((day, index) => (
                      <SelectItem key={index + 1} value={(index + 1).toString()}>
                        {day}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label htmlFor="description">Mô tả</Label>
              <Input
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({...formData, description: e.target.value})}
                placeholder="Mô tả chi tiết về ràng buộc"
                required
              />
            </div>

            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="is_active"
                checked={formData.is_active}
                onChange={(e) => setFormData({...formData, is_active: e.target.checked})}
              />
              <Label htmlFor="is_active">Kích hoạt</Label>
            </div>

            <div className="flex justify-end space-x-2">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => {
                  setShowForm(false);
                  setEditingConstraint(null);
                  resetForm();
                }}
              >
                Hủy
              </Button>
              <Button type="submit">
                {editingConstraint ? 'Cập nhật' : 'Thêm mới'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">Ràng buộc Thời khóa biểu</h1>
          <p className="text-gray-600">Quản lý các ràng buộc và quy tắc cho thời khóa biểu</p>
        </div>
        <Button onClick={() => {
          setShowForm(true);
          setEditingConstraint(null);
          resetForm();
        }}>
          <Plus className="h-4 w-4 mr-2" />
          Thêm ràng buộc
        </Button>
      </div>

      {renderConstraintForm()}

      <Card>
        <CardHeader>
          <CardTitle>Danh sách ràng buộc</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs value={selectedType} onValueChange={setSelectedType} className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              {constraintTypes.slice(0, 4).map(type => {
                const Icon = type.icon;
                return (
                  <TabsTrigger key={type.value} value={type.value} className="text-xs">
                    <Icon className="h-3 w-3 mr-1" />
                    {type.label}
                  </TabsTrigger>
                );
              })}
            </TabsList>
            <TabsList className="grid w-full grid-cols-4 mt-2">
              {constraintTypes.slice(4).map(type => {
                const Icon = type.icon;
                return (
                  <TabsTrigger key={type.value} value={type.value} className="text-xs">
                    <Icon className="h-3 w-3 mr-1" />
                    {type.label}
                  </TabsTrigger>
                );
              })}
            </TabsList>
            
            {constraintTypes.map(type => (
              <TabsContent key={type.value} value={type.value} className="mt-4">
                {loading ? (
                  <div className="text-center py-8">
                    <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4" />
                    <p>Đang tải...</p>
                  </div>
                ) : constraints.length === 0 ? (
                  <div className="text-center py-8">
                    <type.icon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500">Chưa có ràng buộc nào cho loại này</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {constraints.map(constraint => (
                      <Card key={constraint.id} className="hover:shadow-md transition-shadow">
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-4">
                              <div className="flex items-center space-x-2">
                                <Badge 
                                  className={priorityColors[constraint.priority]}
                                  variant="secondary"
                                >
                                  {priorityLabels[constraint.priority]}
                                </Badge>
                                {!constraint.is_active && (
                                  <Badge variant="outline" className="text-gray-500">
                                    Không hoạt động
                                  </Badge>
                                )}
                              </div>
                              <div>
                                <div className="font-medium">{constraint.description}</div>
                                <div className="text-sm text-gray-600">
                                  {constraint.teacher && `Giáo viên: ${constraint.teacher.full_name}`}
                                  {constraint.class && `Lớp: ${constraint.class.name}`}
                                  {constraint.subject && `Môn: ${constraint.subject.name}`}
                                  {constraint.time_slot && ` • Tiết: ${constraint.time_slot.name}`}
                                  {constraint.day_of_week && ` • ${dayNames[constraint.day_of_week]}`}
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center space-x-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleEdit(constraint)}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleDelete(constraint.id)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </TabsContent>
            ))}
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
} 