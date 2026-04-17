import { supabase } from './supabase';

export async function getUsers() {
  const { data, error } = await supabase.from('users').select('*');
  if (error) console.error('Error fetching users:', error);
  // Map back to expected structure
  return (data || []).map(u => ({
    id: u.id,
    name: u.name,
    email: u.email,
    role: u.role,
    status: u.status
  }));
}

export async function getUserByEmail(email) {
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .ilike('email', email)
    .single();
  if (error || !data) return null;
  return {
    id: data.id,
    name: data.name,
    email: data.email,
    role: data.role,
    status: data.status
  };
}

export async function getTasks() {
  const { data, error } = await supabase.from('tasks').select('*');
  if (error) console.error('Error fetching tasks:', error);
  
  return (data || []).map(t => ({
    taskId: t.task_id,
    name: t.name,
    description: t.description,
    assignedBy: t.assigned_by,
    assignee: t.assignee,
    status: t.status,
    startDate: t.start_date,
    deadline: t.deadline,
    progress: t.progress,
    priority: t.priority,
    attachmentLink: t.attachment_link,
    notes: t.notes
  }));
}

export async function getTasksByUser(email) {
  const { data, error } = await supabase
    .from('tasks')
    .select('*')
    .ilike('assignee', email);
  if (error) console.error('Error fetching tasks by user:', error);
  
  return (data || []).map(t => ({
    taskId: t.task_id,
    name: t.name,
    description: t.description,
    assignedBy: t.assigned_by,
    assignee: t.assignee,
    status: t.status,
    startDate: t.start_date,
    deadline: t.deadline,
    progress: t.progress,
    priority: t.priority,
    attachmentLink: t.attachment_link,
    notes: t.notes
  }));
}

export async function createTask(taskData) {
  const taskId = 'TASK-' + Math.random().toString(16).slice(2, 10).toUpperCase();
  const now = new Date().toISOString().split('T')[0];
  
  const { error } = await supabase.from('tasks').insert({
    task_id: taskId,
    name: taskData.name || '',
    description: taskData.description || '',
    assigned_by: taskData.assignedBy || '',
    assignee: taskData.assignee || '',
    status: taskData.status || 'Kế hoạch',
    start_date: taskData.startDate || now,
    deadline: taskData.deadline || '',
    progress: Number(taskData.progress) || 0,
    priority: taskData.priority || 'Trung bình',
    attachment_link: taskData.attachmentLink || '',
    notes: taskData.notes || ''
  });

  if (error) {
    console.error('Create task error:', error);
    throw new Error(error.message);
  }
  
  return { success: true, taskId };
}

export async function updateTask(taskData) {
  const updates = {};
  if (taskData.name !== undefined) updates.name = taskData.name;
  if (taskData.description !== undefined) updates.description = taskData.description;
  if (taskData.assignedBy !== undefined) updates.assigned_by = taskData.assignedBy;
  if (taskData.assignee !== undefined) updates.assignee = taskData.assignee;
  if (taskData.status !== undefined) updates.status = taskData.status;
  if (taskData.startDate !== undefined) updates.start_date = taskData.startDate;
  if (taskData.deadline !== undefined) updates.deadline = taskData.deadline;
  if (taskData.progress !== undefined) updates.progress = Number(taskData.progress);
  if (taskData.priority !== undefined) updates.priority = taskData.priority;
  if (taskData.attachmentLink !== undefined) updates.attachment_link = taskData.attachmentLink;
  if (taskData.notes !== undefined) updates.notes = taskData.notes;

  const { error } = await supabase
    .from('tasks')
    .update(updates)
    .eq('task_id', taskData.taskId);

  if (error) return { success: false, error: error.message };
  return { success: true };
}

export async function updateTaskStatus(taskId, newStatus) {
  const updates = { status: newStatus };
  if (newStatus === 'Hoàn thành') {
    updates.progress = 100;
  }
  
  const { error } = await supabase
    .from('tasks')
    .update(updates)
    .eq('task_id', taskId);

  if (error) return { success: false, error: error.message };
  return { success: true };
}

export async function updateUser(userData) {
  const { error } = await supabase
    .from('users')
    .update({
      name: userData.name,
      role: userData.role,
      status: userData.status
    })
    .eq('email', userData.email);
  if (error) return { success: false, error: error.message };
  return { success: true };
}

export async function addUser(userData) {
  const { error } = await supabase.from('users').insert({
    name: userData.name,
    email: userData.email,
    role: userData.role,
    status: userData.status || 'active'
  });
  if (error) return { success: false, error: error.message };
  return { success: true };
}

export async function deleteUser(email) {
  // Xóa tất cả các task mà user này được assign
  await supabase
    .from('tasks')
    .delete()
    .eq('assignee', email);

  // Xóa user
  const { error } = await supabase
    .from('users')
    .delete()
    .eq('email', email);
  if (error) return { success: false, error: error.message };
  return { success: true };
}

export async function deleteTask(taskId) {
  const { error } = await supabase
    .from('tasks')
    .delete()
    .eq('task_id', taskId);

  if (error) return { success: false, error: error.message };
  return { success: true };
}
