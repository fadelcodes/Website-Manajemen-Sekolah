-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table (for authentication)
CREATE TABLE users (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  email VARCHAR UNIQUE NOT NULL,
  password VARCHAR NOT NULL,
  role VARCHAR NOT NULL CHECK (role IN ('admin', 'guru', 'siswa', 'ortu')),
  status VARCHAR DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'belum_lengkap')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW())
);

-- Guru table
CREATE TABLE gurus (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  nip VARCHAR UNIQUE,
  first_name VARCHAR,
  last_name VARCHAR,
  email VARCHAR,
  phone VARCHAR,
  address TEXT,
  photo_url VARCHAR,
  dob DATE,
  pob VARCHAR,
  university VARCHAR,
  degree VARCHAR,
  education_start_date DATE,
  education_end_date DATE,
  education_city VARCHAR,
  status VARCHAR DEFAULT 'belum_lengkap' CHECK (status IN ('aktif', 'belum_lengkap')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW())
);

-- Classes table
CREATE TABLE classes (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name VARCHAR NOT NULL,
  level VARCHAR NOT NULL,
  guru_id UUID REFERENCES gurus(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW())
);

-- Siswa table
CREATE TABLE siswas (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  nisn VARCHAR UNIQUE,
  first_name VARCHAR,
  last_name VARCHAR,
  email VARCHAR,
  phone VARCHAR,
  address TEXT,
  photo_url VARCHAR,
  dob DATE,
  pob VARCHAR,
  parent_name VARCHAR,
  parent_email VARCHAR,
  parent_phone VARCHAR,
  parent_address TEXT,
  class_id UUID REFERENCES classes(id),
  status VARCHAR DEFAULT 'belum_lengkap' CHECK (status IN ('aktif', 'belum_lengkap')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW())
);

-- Orang Tua table
CREATE TABLE ortu (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  siswa_id UUID REFERENCES siswas(id) ON DELETE CASCADE,
  first_name VARCHAR,
  last_name VARCHAR,
  email VARCHAR,
  phone VARCHAR,
  address TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW())
);

-- Subjects table
CREATE TABLE subjects (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name VARCHAR NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW())
);

-- Subjects assignment to classes and gurus
CREATE TABLE subject_assignments (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  subject_id UUID REFERENCES subjects(id) ON DELETE CASCADE,
  class_id UUID REFERENCES classes(id) ON DELETE CASCADE,
  guru_id UUID REFERENCES gurus(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()),
  UNIQUE(subject_id, class_id)
);

-- Schedules table
CREATE TABLE schedules (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  class_id UUID REFERENCES classes(id) ON DELETE CASCADE,
  subject_id UUID REFERENCES subjects(id) ON DELETE CASCADE,
  guru_id UUID REFERENCES gurus(id) ON DELETE CASCADE,
  day_of_week INTEGER NOT NULL CHECK (day_of_week BETWEEN 1 AND 7),
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  room VARCHAR,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW())
);

-- Grades table
CREATE TABLE grades (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  siswa_id UUID REFERENCES siswas(id) ON DELETE CASCADE,
  subject_id UUID REFERENCES subjects(id) ON DELETE CASCADE,
  guru_id UUID REFERENCES gurus(id) ON DELETE CASCADE,
  type VARCHAR NOT NULL CHECK (type IN ('tugas', 'uts', 'uas')),
  value DECIMAL(4,2) NOT NULL CHECK (value >= 0 AND value <= 100),
  max_value DECIMAL(4,2) DEFAULT 100,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW())
);

-- Attendance table
CREATE TABLE attendance (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  siswa_id UUID REFERENCES siswas(id) ON DELETE CASCADE,
  guru_id UUID REFERENCES gurus(id) ON DELETE CASCADE,
  subject_id UUID REFERENCES subjects(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  status VARCHAR NOT NULL CHECK (status IN ('hadir', 'izin', 'sakit', 'alpha')),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW())
);

-- Announcements table
CREATE TABLE announcements (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  title VARCHAR NOT NULL,
  content TEXT NOT NULL,
  author_id UUID REFERENCES users(id) ON DELETE CASCADE,
  target_roles VARCHAR[] DEFAULT '{}',
  is_published BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW())
);

-- Activity logs table
CREATE TABLE activity_logs (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  action VARCHAR NOT NULL,
  description TEXT,
  ip_address VARCHAR,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW())
);

-- School years table
CREATE TABLE school_years (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  year VARCHAR NOT NULL,
  semester INTEGER NOT NULL CHECK (semester IN (1, 2)),
  is_active BOOLEAN DEFAULT false,
  start_date DATE,
  end_date DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW())
);

-- Enable Row Level Security
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE gurus ENABLE ROW LEVEL SECURITY;
ALTER TABLE siswas ENABLE ROW LEVEL SECURITY;
ALTER TABLE ortu ENABLE ROW LEVEL SECURITY;
ALTER TABLE classes ENABLE ROW LEVEL SECURITY;
ALTER TABLE subjects ENABLE ROW LEVEL SECURITY;
ALTER TABLE subject_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE grades ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE announcements ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE school_years ENABLE ROW LEVEL SECURITY;

-- Create policies for users table
CREATE POLICY "Users can view own data" ON users FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Admin can manage all users" ON users FOR ALL USING (
  EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
);

-- Create policies for gurus table
CREATE POLICY "Gurus can view own data" ON gurus FOR SELECT USING (
  user_id = auth.uid() OR 
  EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
);
CREATE POLICY "Admin can manage gurus" ON gurus FOR ALL USING (
  EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
);

-- Create policies for siswas table
CREATE POLICY "Siswas can view own data" ON siswas FOR SELECT USING (
  user_id = auth.uid() OR 
  EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('admin', 'guru'))
);
CREATE POLICY "Ortu can view anak data" ON siswas FOR SELECT USING (
  EXISTS (SELECT 1 FROM ortu WHERE user_id = auth.uid() AND siswa_id = siswas.id)
);
CREATE POLICY "Admin can manage siswas" ON siswas FOR ALL USING (
  EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
);

-- Create policies for ortu table
CREATE POLICY "Ortu can view own data" ON ortu FOR SELECT USING (
  user_id = auth.uid() OR 
  EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
);

-- Create policies for classes table
CREATE POLICY "Anyone can view classes" ON classes FOR SELECT USING (true);
CREATE POLICY "Admin can manage classes" ON classes FOR ALL USING (
  EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
);

-- Create policies for subjects table
CREATE POLICY "Anyone can view subjects" ON subjects FOR SELECT USING (true);
CREATE POLICY "Admin can manage subjects" ON subjects FOR ALL USING (
  EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
);

-- Create policies for grades table
CREATE POLICY "Siswas can view own grades" ON grades FOR SELECT USING (
  siswa_id IN (SELECT id FROM siswas WHERE user_id = auth.uid()) OR
  EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('admin', 'guru'))
);
CREATE POLICY "Guru can manage grades for their subjects" ON grades FOR ALL USING (
  guru_id IN (SELECT id FROM gurus WHERE user_id = auth.uid()) OR
  EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
);

-- Create policies for attendance table
CREATE POLICY "Siswas can view own attendance" ON attendance FOR SELECT USING (
  siswa_id IN (SELECT id FROM siswas WHERE user_id = auth.uid()) OR
  EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('admin', 'guru'))
);
CREATE POLICY "Guru can manage attendance for their subjects" ON attendance FOR ALL USING (
  guru_id IN (SELECT id FROM gurus WHERE user_id = auth.uid()) OR
  EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
);

-- Create policies for announcements table
CREATE POLICY "Anyone can view published announcements" ON announcements FOR SELECT USING (
  is_published = true OR
  EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
);
CREATE POLICY "Admin can manage announcements" ON announcements FOR ALL USING (
  EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = TIMEZONE('utc'::text, NOW());
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_gurus_updated_at BEFORE UPDATE ON gurus FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_siswas_updated_at BEFORE UPDATE ON siswas FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_grades_updated_at BEFORE UPDATE ON grades FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_attendance_updated_at BEFORE UPDATE ON attendance FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_announcements_updated_at BEFORE UPDATE ON announcements FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create indexes for better performance
CREATE INDEX idx_grades_siswa_id ON grades(siswa_id);
CREATE INDEX idx_grades_subject_id ON grades(subject_id);
CREATE INDEX idx_attendance_siswa_id ON attendance(siswa_id);
CREATE INDEX idx_attendance_date ON attendance(date);
CREATE INDEX idx_siswas_class_id ON siswas(class_id);
CREATE INDEX idx_schedules_class_id ON schedules(class_id);
CREATE INDEX idx_schedules_day_time ON schedules(day_of_week, start_time);