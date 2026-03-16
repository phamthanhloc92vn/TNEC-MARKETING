import { google } from 'googleapis';

// Google Sheets API setup using Service Account
function getPrivateKey() {
  let key = process.env.GOOGLE_SHEETS_PRIVATE_KEY || '';
  // Remove surrounding quotes if present
  if (key.startsWith('"') && key.endsWith('"')) {
    key = key.slice(1, -1);
  }
  // Replace literal \n with real newlines
  key = key.replace(/\\n/g, '\n');
  return key;
}

function getAuth() {
  const auth = new google.auth.GoogleAuth({
    credentials: {
      client_email: process.env.GOOGLE_SHEETS_CLIENT_EMAIL,
      private_key: getPrivateKey(),
    },
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
  });
  return auth;
}

function getSheets() {
  const auth = getAuth();
  return google.sheets({ version: 'v4', auth });
}

const SHEET_ID = process.env.GOOGLE_SHEET_ID;
const TASKS_SHEET = 'Tasks';
const USERS_SHEET = 'Users';

const SECTION_HEADERS = ['DESIGNER', 'MEDIA', 'DIGITAL', 'VIDE CODE', 'VIDEO CODE'];

// ============================================================
// USERS
// ============================================================

export async function getUsers() {
  const sheets = getSheets();
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: SHEET_ID,
    range: `${USERS_SHEET}!A:E`,
  });

  const rows = res.data.values || [];
  if (rows.length <= 1) return [];

  return rows.slice(1).filter(row => row[0]).map(row => ({
    id: row[0] || '',
    name: row[1] || '',
    email: (row[2] || '').toString().trim(),
    role: row[3] || '',
    status: row[4] || '',
  }));
}

export async function getUserByEmail(email) {
  const users = await getUsers();
  return users.find(u => u.email.toLowerCase() === email.toLowerCase()) || null;
}

// ============================================================
// TASKS
// ============================================================

export async function getTasks() {
  const sheets = getSheets();
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: SHEET_ID,
    range: `${TASKS_SHEET}!A:L`,
  });

  const rows = res.data.values || [];
  if (rows.length <= 1) return [];

  return rows.slice(1)
    .filter(row => {
      const cellA = (row[0] || '').toString().trim();
      return cellA && !SECTION_HEADERS.includes(cellA.toUpperCase());
    })
    .map(row => rowToTask(row));
}

export async function getTasksByUser(email) {
  const tasks = await getTasks();
  return tasks.filter(t => t.assignee && t.assignee.toLowerCase() === email.toLowerCase());
}

export async function createTask(taskData) {
  const sheets = getSheets();
  const taskId = 'TASK-' + Math.random().toString(16).slice(2, 10).toUpperCase();
  const now = new Date().toISOString().split('T')[0];

  const row = [
    taskId,
    taskData.name || '',
    taskData.description || '',
    taskData.assignedBy || '',
    taskData.assignee || '',
    taskData.status || 'Kế hoạch',
    taskData.startDate || now,
    taskData.deadline || '',
    taskData.progress || 0,
    taskData.priority || 'Trung bình',
    taskData.attachmentLink || '',
    taskData.notes || '',
  ];

  // Find correct section based on assignee role
  const insertRowIndex = await findSectionRow(sheets, taskData.assignee);

  if (insertRowIndex > 0) {
    // Insert row at the correct position
    await sheets.spreadsheets.batchUpdate({
      spreadsheetId: SHEET_ID,
      requestBody: {
        requests: [{
          insertDimension: {
            range: {
              sheetId: await getSheetId(sheets, TASKS_SHEET),
              dimension: 'ROWS',
              startIndex: insertRowIndex,
              endIndex: insertRowIndex + 1,
            },
            inheritFromBefore: false,
          },
        }],
      },
    });

    // Write data to the new row
    await sheets.spreadsheets.values.update({
      spreadsheetId: SHEET_ID,
      range: `${TASKS_SHEET}!A${insertRowIndex + 1}:L${insertRowIndex + 1}`,
      valueInputOption: 'USER_ENTERED',
      requestBody: { values: [row] },
    });

    // Clear formatting (white background, normal font)
    await sheets.spreadsheets.batchUpdate({
      spreadsheetId: SHEET_ID,
      requestBody: {
        requests: [{
          repeatCell: {
            range: {
              sheetId: await getSheetId(sheets, TASKS_SHEET),
              startRowIndex: insertRowIndex,
              endRowIndex: insertRowIndex + 1,
              startColumnIndex: 0,
              endColumnIndex: 12,
            },
            cell: {
              userEnteredFormat: {
                backgroundColor: { red: 1, green: 1, blue: 1 },
                textFormat: { bold: false, foregroundColor: { red: 0, green: 0, blue: 0 } },
              },
            },
            fields: 'userEnteredFormat(backgroundColor,textFormat)',
          },
        }],
      },
    });
  } else {
    // Fallback: append
    await sheets.spreadsheets.values.append({
      spreadsheetId: SHEET_ID,
      range: `${TASKS_SHEET}!A:L`,
      valueInputOption: 'USER_ENTERED',
      requestBody: { values: [row] },
    });
  }

  return { success: true, taskId };
}

export async function updateTask(taskData) {
  const sheets = getSheets();
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: SHEET_ID,
    range: `${TASKS_SHEET}!A:L`,
  });

  const rows = res.data.values || [];
  for (let i = 1; i < rows.length; i++) {
    if (rows[i][0] === taskData.taskId) {
      const rowIndex = i + 1;
      const updatedRow = [
        taskData.taskId,
        taskData.name ?? rows[i][1],
        taskData.description ?? rows[i][2],
        taskData.assignedBy ?? rows[i][3],
        taskData.assignee ?? rows[i][4],
        taskData.status ?? rows[i][5],
        taskData.startDate ?? rows[i][6],
        taskData.deadline ?? rows[i][7],
        taskData.progress !== undefined ? taskData.progress : rows[i][8],
        taskData.priority ?? rows[i][9],
        taskData.attachmentLink ?? rows[i][10],
        taskData.notes !== undefined ? taskData.notes : rows[i][11],
      ];

      await sheets.spreadsheets.values.update({
        spreadsheetId: SHEET_ID,
        range: `${TASKS_SHEET}!A${rowIndex}:L${rowIndex}`,
        valueInputOption: 'USER_ENTERED',
        requestBody: { values: [updatedRow] },
      });

      return { success: true };
    }
  }
  return { success: false, error: 'Task not found' };
}

export async function updateTaskStatus(taskId, newStatus) {
  const sheets = getSheets();
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: SHEET_ID,
    range: `${TASKS_SHEET}!A:L`,
  });

  const rows = res.data.values || [];
  for (let i = 1; i < rows.length; i++) {
    if (rows[i][0] === taskId) {
      const rowIndex = i + 1;
      await sheets.spreadsheets.values.update({
        spreadsheetId: SHEET_ID,
        range: `${TASKS_SHEET}!F${rowIndex}:F${rowIndex}`,
        valueInputOption: 'USER_ENTERED',
        requestBody: { values: [[newStatus]] },
      });

      if (newStatus === 'Hoàn thành') {
        await sheets.spreadsheets.values.update({
          spreadsheetId: SHEET_ID,
          range: `${TASKS_SHEET}!I${rowIndex}:I${rowIndex}`,
          valueInputOption: 'USER_ENTERED',
          requestBody: { values: [[100]] },
        });
      }
      return { success: true };
    }
  }
  return { success: false, error: 'Task not found' };
}

export async function deleteTask(taskId) {
  const sheets = getSheets();
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: SHEET_ID,
    range: `${TASKS_SHEET}!A:L`,
  });

  const rows = res.data.values || [];
  for (let i = 1; i < rows.length; i++) {
    if (rows[i][0] === taskId) {
      await sheets.spreadsheets.batchUpdate({
        spreadsheetId: SHEET_ID,
        requestBody: {
          requests: [{
            deleteDimension: {
              range: {
                sheetId: await getSheetId(sheets, TASKS_SHEET),
                dimension: 'ROWS',
                startIndex: i,
                endIndex: i + 1,
              },
            },
          }],
        },
      });
      return { success: true };
    }
  }
  return { success: false, error: 'Task not found' };
}

// ============================================================
// HELPERS
// ============================================================

function rowToTask(row) {
  return {
    taskId: row[0] || '',
    name: row[1] || '',
    description: row[2] || '',
    assignedBy: row[3] || '',
    assignee: row[4] || '',
    status: row[5] || 'Kế hoạch',
    startDate: row[6] || '',
    deadline: row[7] || '',
    progress: parseInt(row[8]) || 0,
    priority: row[9] || 'Trung bình',
    attachmentLink: row[10] || '',
    notes: row[11] || '',
  };
}

async function getSheetId(sheets, sheetName) {
  const res = await sheets.spreadsheets.get({ spreadsheetId: SHEET_ID });
  const sheet = res.data.sheets.find(s => s.properties.title === sheetName);
  return sheet ? sheet.properties.sheetId : 0;
}

const ROLE_SECTION_MAP = {
  'designer': 'DESIGNER',
  'media': 'MEDIA',
  'digital': 'DIGITAL',
  'vide code': 'VIDE CODE',
  'video code': 'VIDE CODE',
};

async function findSectionRow(sheets, assigneeEmail) {
  if (!assigneeEmail) return -1;

  const users = await getUsers();
  const user = users.find(u => u.email.toLowerCase() === assigneeEmail.toLowerCase());
  if (!user) return -1;

  const role = user.role.toLowerCase().trim();
  const sectionHeader = ROLE_SECTION_MAP[role];

  // Manager tasks go to top section
  if (role === 'trưởng phòng' || !sectionHeader) {
    const res = await sheets.spreadsheets.values.get({
      spreadsheetId: SHEET_ID,
      range: `${TASKS_SHEET}!A:A`,
    });
    const col = (res.data.values || []).map(r => (r[0] || '').toString().trim().toUpperCase());

    for (let i = 1; i < col.length; i++) {
      if (SECTION_HEADERS.includes(col[i])) {
        // Find last data row before this section
        for (let j = i - 1; j >= 1; j--) {
          if (col[j] !== '') return j + 1;
        }
        return 1;
      }
    }
    return -1;
  }

  // Find section header in Tasks sheet
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: SHEET_ID,
    range: `${TASKS_SHEET}!A:A`,
  });
  const col = (res.data.values || []).map(r => (r[0] || '').toString().trim().toUpperCase());

  let sectionStart = -1;
  let sectionEnd = -1;

  for (let i = 1; i < col.length; i++) {
    if (col[i] === sectionHeader) {
      sectionStart = i + 1;
      continue;
    }
    if (sectionStart > 0 && sectionEnd < 0 && SECTION_HEADERS.includes(col[i])) {
      sectionEnd = i;
      break;
    }
  }

  if (sectionStart < 0) return -1;
  if (sectionEnd < 0) sectionEnd = col.length;

  // Find first empty row in section
  for (let i = sectionStart; i < sectionEnd; i++) {
    if (!col[i] || col[i] === '') return i;
  }

  return sectionEnd;
}
