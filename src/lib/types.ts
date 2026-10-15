export type UserRole = 'student' | 'mentor' | 'admin';

export interface Profile {
  id: string;
  email: string;
  full_name: string;
  role: UserRole;
  avatar_url: string | null;
  phone: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface StudentProfile {
  id: string;
  user_id: string;
  department: string;
  year: string;
  career_goals: string | null;
  skills: string[];
  interests: string[];
  startup_idea: string | null;
  projects: string | null;
  created_at: string;
  updated_at: string;
}

export interface MentorProfile {
  id: string;
  user_id: string;
  organization: string;
  designation: string;
  department: string;
  expertise_tags: string[];
  bio: string | null;
  availability: 'Available' | 'Limited' | 'Unavailable';
  mentoring_format: 'In-Person' | 'Online' | 'Hybrid';
  max_mentees: number;
  current_mentee_count: number;
  linkedin_url: string | null;
  is_approved: boolean;
  approved_by: string | null;
  approved_at: string | null;
  created_at: string;
  updated_at: string;
}

export type RequestStatus = 'pending' | 'accepted' | 'declined' | 'proposed_time';

export interface MentorshipRequest {
  id: string;
  student_id: string;
  mentor_id: string;
  goal: string;
  message: string;
  status: RequestStatus;
  proposed_time: string | null;
  created_at: string;
  updated_at: string;
  student_profile?: Profile;
  mentor_profile?: Profile;
  mentor_details?: MentorProfile;
}

export type MatchStatus = 'active' | 'completed' | 'cancelled';

export interface Match {
  id: string;
  request_id: string;
  student_id: string;
  mentor_id: string;
  status: MatchStatus;
  created_at: string;
  student_profile?: Profile;
  mentor_profile?: Profile;
}

export type SessionStatus = 'scheduled' | 'completed' | 'cancelled' | 'no_show';

export interface Session {
  id: string;
  match_id: string;
  mentor_id: string;
  student_id: string;
  title: string;
  session_date: string;
  session_time: string;
  status: SessionStatus;
  classroom_number: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface Message {
  id: string;
  match_id: string;
  sender_id: string;
  content: string;
  read_at: string | null;
  created_at: string;
}

export interface Feedback {
  id: string;
  session_id: string;
  match_id: string;
  student_id: string;
  mentor_id: string;
  rating: number;
  comment: string | null;
  created_at: string;
}

export interface ProgressUpdate {
  id: string;
  student_id: string;
  match_id: string;
  session_id: string | null;
  title: string;
  body: string;
  evidence_url: string | null;
  mentor_advice: string | null;
  created_at: string;
  updated_at: string;
  mentor_profile?: Profile;
}

export type PointEventType = 'session_completed' | 'feedback_submitted' | 'progress_posted';

export interface PointLedgerEntry {
  id: string;
  user_id: string;
  event_type: PointEventType;
  points: number;
  reference_id: string;
  idempotency_key: string;
  created_at: string;
}

export type RecognitionTier = 'Getting Started' | 'Committed' | 'Momentum Builder' | 'Role Model';

export type NotificationType =
  | 'new_request'
  | 'request_accepted'
  | 'request_declined'
  | 'new_message'
  | 'session_scheduled'
  | 'session_updated'
  | 'mentor_approved'
  | 'mentor_rejected'
  | 'new_feedback';

export interface Notification {
  id: string;
  user_id: string;
  type: NotificationType;
  title: string;
  body: string | null;
  related_id: string | null;
  is_read: boolean;
  created_at: string;
}
