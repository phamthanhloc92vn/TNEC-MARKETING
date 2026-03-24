import { getTasks, updateTaskStatus } from './lib/sheets.js';

async function run() {
  try {
    const tasks = await getTasks();
    console.log('Got tasks:', tasks.length);
    if (tasks.length > 0) {
      console.log('Testing update status on task:', tasks[0].taskId);
      const res = await updateTaskStatus(tasks[0].taskId, tasks[0].status);
      console.log('Result:', res);
    } else {
      console.log('No tasks found');
    }
  } catch (err) {
    if (err.response && err.response.data) {
        console.error('API Error Response:', JSON.stringify(err.response.data, null, 2));
    } else {
        console.error('Error:', err);
    }
  }
}

run();
