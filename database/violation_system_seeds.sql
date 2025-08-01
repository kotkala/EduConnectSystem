-- Student Violation System Seed Data
-- Vietnamese violation categories and types for high school

-- Insert violation categories
INSERT INTO violation_categories (name, description) VALUES
('Kỷ luật', 'Vi phạm liên quan đến kỷ luật và hành vi'),
('Học tập', 'Vi phạm liên quan đến việc học tập'),
('Chuyên cần', 'Vi phạm liên quan đến việc đi học đều đặn'),
('Trang phục', 'Vi phạm liên quan đến trang phục và hình thức'),
('Thiết bị', 'Vi phạm liên quan đến việc sử dụng thiết bị điện tử')
ON CONFLICT (name) DO NOTHING;

-- Get category IDs for reference
DO $$
DECLARE
    discipline_id UUID;
    study_id UUID;
    attendance_id UUID;
    uniform_id UUID;
    device_id UUID;
BEGIN
    SELECT id INTO discipline_id FROM violation_categories WHERE name = 'Kỷ luật';
    SELECT id INTO study_id FROM violation_categories WHERE name = 'Học tập';
    SELECT id INTO attendance_id FROM violation_categories WHERE name = 'Chuyên cần';
    SELECT id INTO uniform_id FROM violation_categories WHERE name = 'Trang phục';
    SELECT id INTO device_id FROM violation_categories WHERE name = 'Thiết bị';

    -- Insert violation types for Kỷ luật (Discipline)
    INSERT INTO violation_types (category_id, name, description, default_severity) VALUES
    (discipline_id, 'Nói chuyện riêng trong giờ học', 'Học sinh nói chuyện riêng, làm ồn trong giờ học', 'minor'),
    (discipline_id, 'Không tôn trọng thầy cô', 'Có thái độ thiếu tôn trọng với giáo viên', 'serious'),
    (discipline_id, 'Đánh nhau, xô xát', 'Tham gia vào các vụ đánh nhau, xô xát', 'severe'),
    (discipline_id, 'Chửi bậy, nói tục', 'Sử dụng ngôn từ không phù hợp, chửi bậy', 'moderate'),
    (discipline_id, 'Phá hoại tài sản trường', 'Làm hỏng, phá hoại tài sản của trường học', 'serious'),
    (discipline_id, 'Hút thuốc trong trường', 'Hút thuốc lá trong khuôn viên trường học', 'serious'),
    (discipline_id, 'Mang đồ vật nguy hiểm', 'Mang dao, kéo hoặc đồ vật nguy hiểm khác', 'severe'),
    (discipline_id, 'Bắt nạt bạn học', 'Hành vi bắt nạt, đe dọa các bạn học khác', 'serious')
    ON CONFLICT (category_id, name) DO NOTHING;

    -- Insert violation types for Học tập (Study)
    INSERT INTO violation_types (category_id, name, description, default_severity) VALUES
    (study_id, 'Không làm bài tập về nhà', 'Không hoàn thành bài tập được giao về nhà', 'minor'),
    (study_id, 'Quên mang sách vở', 'Không mang đủ sách vở theo thời khóa biểu', 'minor'),
    (study_id, 'Ngủ trong giờ học', 'Ngủ gật hoặc ngủ trong giờ học', 'minor'),
    (study_id, 'Không tham gia hoạt động nhóm', 'Không tích cực tham gia các hoạt động học tập nhóm', 'minor'),
    (study_id, 'Gian lận trong kiểm tra', 'Sao chép, gian lận trong các bài kiểm tra', 'serious'),
    (study_id, 'Không nộp bài đúng hạn', 'Nộp bài tập, bài kiểm tra muộn hơn thời hạn quy định', 'minor'),
    (study_id, 'Làm việc riêng trong giờ học', 'Làm bài tập môn khác hoặc việc riêng trong giờ học', 'minor'),
    (study_id, 'Không tập trung nghe giảng', 'Mất tập trung, không chú ý nghe giảng', 'minor')
    ON CONFLICT (category_id, name) DO NOTHING;

    -- Insert violation types for Chuyên cần (Attendance)
    INSERT INTO violation_types (category_id, name, description, default_severity) VALUES
    (attendance_id, 'Đi học muộn', 'Đến lớp muộn hơn giờ quy định', 'minor'),
    (attendance_id, 'Vắng học không phép', 'Nghỉ học không có lý do chính đáng hoặc không xin phép', 'moderate'),
    (attendance_id, 'Bỏ tiết học', 'Rời khỏi lớp học trong giờ học mà không xin phép', 'moderate'),
    (attendance_id, 'Về sớm không phép', 'Về nhà sớm hơn giờ tan học mà không xin phép', 'minor'),
    (attendance_id, 'Không tham gia hoạt động tập thể', 'Không tham gia các hoạt động tập thể của lớp, trường', 'minor'),
    (attendance_id, 'Ra ngoài trong giờ học', 'Rời khỏi phòng học trong giờ học không có lý do chính đáng', 'minor')
    ON CONFLICT (category_id, name) DO NOTHING;

    -- Insert violation types for Trang phục (Uniform)
    INSERT INTO violation_types (category_id, name, description, default_severity) VALUES
    (uniform_id, 'Không mặc đồng phục', 'Không mặc đồng phục theo quy định của trường', 'minor'),
    (uniform_id, 'Đồng phục không sạch sẽ', 'Đồng phục bẩn, nhăn nhúm, không gọn gàng', 'minor'),
    (uniform_id, 'Trang điểm đậm', 'Trang điểm quá đậm, không phù hợp với học sinh', 'minor'),
    (uniform_id, 'Để tóc không đúng quy định', 'Kiểu tóc không phù hợp với quy định của trường', 'minor'),
    (uniform_id, 'Đeo trang sức quá mức', 'Đeo nhiều trang sức, phụ kiện không phù hợp', 'minor'),
    (uniform_id, 'Giày dép không đúng quy định', 'Mang giày dép không phù hợp với quy định', 'minor'),
    (uniform_id, 'Nhuộm tóc màu lạ', 'Nhuộm tóc màu sặc sỡ, không phù hợp', 'moderate')
    ON CONFLICT (category_id, name) DO NOTHING;

    -- Insert violation types for Thiết bị (Devices)
    INSERT INTO violation_types (category_id, name, description, default_severity) VALUES
    (device_id, 'Sử dụng điện thoại trong giờ học', 'Sử dụng điện thoại di động trong giờ học', 'minor'),
    (device_id, 'Chơi game trong giờ học', 'Chơi game trên điện thoại hoặc thiết bị khác trong giờ học', 'moderate'),
    (device_id, 'Nghe nhạc trong giờ học', 'Sử dụng tai nghe nghe nhạc trong giờ học', 'minor'),
    (device_id, 'Quay phim, chụp ảnh không phép', 'Quay phim, chụp ảnh trong lớp học mà không xin phép', 'moderate'),
    (device_id, 'Mang thiết bị điện tử không cần thiết', 'Mang máy tính bảng, laptop khi không cần thiết cho việc học', 'minor'),
    (device_id, 'Sạc điện thoại trong lớp', 'Sạc pin điện thoại trong lớp học', 'minor'),
    (device_id, 'Chia sẻ nội dung không phù hợp', 'Chia sẻ hình ảnh, video không phù hợp qua thiết bị điện tử', 'serious')
    ON CONFLICT (category_id, name) DO NOTHING;

END $$;
