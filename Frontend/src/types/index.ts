export interface User {
  id: number;
  name: string;
  email: string;
  empId?: string;
  role: 'USER' | 'MANAGER';
  passwordResetRequired?: boolean;
}

export interface Project {
  id: number;
  name: string;
  description: string;
  objective?: string;
  governance?: string;
  teamSize?: number;
  deadline?: string;
  createdAt?: string;
  createdBy?: User;
  projectKey?: string;
  projectType?: string;
  category?: string;
  visibility?: string;
}

export interface Task {
  id: number;
  title: string;
  description: string;
  columnId: number;
  orderIndex: number;
  assignee?: User;
  assigneeId?: number;
  project?: Project;
  projectId?: number;
  dueDate?: string;
  createdAt?: string;
  updatedAt?: string;
  tags?: string[];
  attachments?: string[];
  priority?: 'LOW' | 'MEDIUM' | 'HIGH';
  environment?: string;
  status?: string;
  issueType?: string;
  storyPoints?: number;
  sprintId?: number;
  sprint?: Sprint;
}

export interface Sprint {
  id: number;
  name: string;
  startDate: string;
  endDate: string;
  status: 'PLANNED' | 'ACTIVE' | 'COMPLETED';
  projectId: number;
}

export interface Comment {
  id: number;
  content: string;
  user: User;
  createdAt: string;
}

export interface BoardColumn {
  id: number;
  projectId: number;
  name: string;
  orderIndex: number;
}
