import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';

export const exportEmployeeTasksToExcel = async (employeeName, employeeRole, tasks, users = []) => {
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet('Báo cáo Công việc', {
    views: [{ state: 'frozen', ySplit: 5 }]
  });

  const currentMonth = new Date().getMonth() + 1;
  const currentYear = new Date().getFullYear();

  // Thêm các dòng Tiêu đề
  sheet.addRow(['TRUNGNAM E&C | BÁO CÁO CÔNG VIỆC TRONG THÁNG ' + currentMonth + '/' + currentYear]);
  sheet.addRow(['Họ và tên:', employeeName]);
  sheet.addRow(['Chức danh:', employeeRole]);
  sheet.addRow([]); // Dòng trống

  // Style Tiêu đề
  sheet.mergeCells('A1:I1');
  sheet.getCell('A1').font = { bold: true, size: 16, color: { argb: 'FF0D9488' } };
  sheet.getCell('A1').alignment = { vertical: 'middle', horizontal: 'center' };
  
  sheet.getCell('A2').font = { bold: true };
  sheet.getCell('A3').font = { bold: true };
  
  sheet.getCell('B2').font = { bold: true, size: 12 };
  sheet.getCell('B3').font = { italic: true };

  // Set độ rộng các cột
  sheet.getColumn(1).width = 40; // Tên công việc
  sheet.getColumn(2).width = 50; // Mô tả
  sheet.getColumn(3).width = 25; // Người giao
  sheet.getColumn(4).width = 25; // Người nhận
  sheet.getColumn(5).width = 20; // Trạng thái
  sheet.getColumn(6).width = 15; // Tiến độ
  sheet.getColumn(7).width = 20; // Ngày bắt đầu
  sheet.getColumn(8).width = 20; // Deadline
  sheet.getColumn(9).width = 40; // Link tài liệu

  // Thêm Header của bảng (Dòng 5)
  const headerRow = sheet.addRow([
    'Tên công việc', 'Mô tả chi tiết', 'Người giao', 'Người nhận',
    'Trạng thái', 'Tiến độ (%)', 'Ngày bắt đầu', 'Deadline', 'Link tài liệu'
  ]);

  // Style Header Row
  headerRow.eachCell((cell) => {
    cell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF1F4E79' } // Dark blue theme
    };
    cell.font = {
      bold: true,
      color: { argb: 'FFFFFFFF' },
      size: 12
    };
    cell.alignment = { vertical: 'middle', horizontal: 'center' };
    cell.border = {
      top: { style: 'thin' },
      left: { style: 'thin' },
      bottom: { style: 'thin' },
      right: { style: 'thin' }
    };
  });
  headerRow.height = 30;

  // Helper chuyển đổi email sang role
  const getRoleByEmail = (email) => {
    if (!email) return '';
    const user = users.find(u => u.email?.toLowerCase() === email.toLowerCase());
    // Nếu email hiện tại là người được lấy báo cáo (employeeName tương ứng thì có thể lấy role luôn, nhưng dùng mảng users sẽ bao quát cả người giao)
    return user ? user.role : email;
  };

  // Add Data
  tasks.forEach((task, index) => {
    const row = sheet.addRow([
      task.name || '',
      task.description || '',
      getRoleByEmail(task.assignedBy),
      getRoleByEmail(task.assignee),
      task.status || '',
      task.progress !== undefined && task.progress !== null ? `${task.progress}%` : '0%',
      task.startDate || '',
      task.deadline || '',
      task.attachmentLink || ''
    ]);

    // Lấy màu nền xen kẽ (Zebra striping)
    const rowBgColor = index % 2 === 0 ? 'FFFFFFFF' : 'FFF4F9FF'; // Trắng / Xanh nhạt

    // Formatting for each cell in row
    row.eachCell((cell, colNumber) => {
      cell.alignment = { vertical: 'middle', wrapText: true };
      
      // Mặc định bôi màu xen kẽ cho tất cả cột
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: rowBgColor }
      };

      cell.border = {
        top: { style: 'thin', color: { argb: 'FFEEEEEE' } },
        left: { style: 'thin', color: { argb: 'FFEEEEEE' } },
        bottom: { style: 'thin', color: { argb: 'FFEEEEEE' } },
        right: { style: 'thin', color: { argb: 'FFEEEEEE' } }
      };

      // Status color (Column 5)
      if (colNumber === 5) {
        let bgColor = 'FFFFFFFF';
        let textColor = 'FF000000';
        if (task.status === 'Hoàn thành') {
          bgColor = 'FFD1FAE5'; // emerald-100
          textColor = 'FF047857'; // emerald-700
        } else if (task.status === 'Cần chỉnh sửa') {
          bgColor = 'FFFEE2E2'; // red-100
          textColor = 'FFB91C1C'; // red-700
        } else if (task.status === 'Đang xử lý') {
          bgColor = 'FFFEF3C7'; // amber-100
          textColor = 'FFB45309'; // amber-700
        } else if (task.status === 'Chờ duyệt') {
          bgColor = 'FFCFFAFE'; // cyan-100
          textColor = 'FF0E7490'; // cyan-700
        } else {
          bgColor = 'FFE0E7FF'; // indigo-100
          textColor = 'FF4338CA'; // indigo-700
        }
        
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: bgColor } };
        cell.font = { color: { argb: textColor }, bold: true };
        cell.alignment = { horizontal: 'center', vertical: 'middle' };
      }
      
      // Progress formatting (Column 6)
      if (colNumber === 6) {
        cell.alignment = { horizontal: 'center', vertical: 'middle' };
      }
      
      // Link formatting (Column 9)
      if (colNumber === 9 && task.attachmentLink) {
        cell.value = { text: task.attachmentLink, hyperlink: task.attachmentLink };
        cell.font = { color: { argb: 'FF2563EB' }, underline: true };
      }
    });
  });

  // ==== PHẦN TỔNG HỢP & DASHBOARD ====
  sheet.addRow([]); // Dòng trống
  
  // Tiêu đề phần tổng hợp
  const summaryTitleRow = sheet.addRow(['TỔNG HỢP & DASHBOARD', '', '', '', '', '', '', '', '']);
  sheet.mergeCells(`A${summaryTitleRow.number}:I${summaryTitleRow.number}`);
  const summaryTitleCell = sheet.getCell(`A${summaryTitleRow.number}`);
  summaryTitleCell.font = { bold: true, color: { argb: 'FFFFFFFF' }, size: 12 };
  summaryTitleCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1F4E79' } };
  summaryTitleCell.alignment = { vertical: 'middle', horizontal: 'left', indent: 1 };
  summaryTitleRow.height = 25;

  // Tính toán chỉ số
  const totalItems = tasks.length;
  const avgProgress = tasks.length ? Math.round(tasks.reduce((sum, t) => sum + (parseInt(t.progress) || 0), 0) / tasks.length) : 0;

  // Header các chỉ số
  const summaryHeaderRow = sheet.addRow(['TỔNG HẠNG MỤC', '', '', '', 'TIẾN ĐỘ TB', '', '', '', '']);
  sheet.mergeCells(`A${summaryHeaderRow.number}:D${summaryHeaderRow.number}`);
  sheet.mergeCells(`E${summaryHeaderRow.number}:I${summaryHeaderRow.number}`);
  
  // Style cho header chỉ số
  [1, 5].forEach(colIndex => {
    const cell = sheet.getCell(summaryHeaderRow.number, colIndex);
    cell.font = { bold: true, color: { argb: 'FF1F4E79' }, size: 10 };
    cell.alignment = { horizontal: 'center', vertical: 'middle' };
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF0F4F8' } };
    
    // Border nhẹ
    cell.border = {
      top: { style: 'thin', color: { argb: 'FFEEEEEE' } },
      bottom: { style: 'thin', color: { argb: 'FFEEEEEE' } },
      left: { style: 'thin', color: { argb: 'FFEEEEEE' } },
      right: { style: 'thin', color: { argb: 'FFEEEEEE' } }
    };
  });
  summaryHeaderRow.height = 20;

  // Values các chỉ số
  const summaryDataRow = sheet.addRow([totalItems, '', '', '', `${avgProgress}%`, '', '', '', '']);
  sheet.mergeCells(`A${summaryDataRow.number}:D${summaryDataRow.number}`);
  sheet.mergeCells(`E${summaryDataRow.number}:I${summaryDataRow.number}`);

  // Style cho value
  const valueColors = ['FF1F4E79', 'FF059669']; // Dark blue, Green
  [1, 5].forEach((colIndex, idx) => {
    const cell = sheet.getCell(summaryDataRow.number, colIndex);
    cell.font = { bold: true, size: 16, color: { argb: valueColors[idx] } };
    cell.alignment = { horizontal: 'center', vertical: 'middle' };
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF8FAFC' } };
    
    // Border nhẹ
    cell.border = {
      top: { style: 'thin', color: { argb: 'FFEEEEEE' } },
      bottom: { style: 'thin', color: { argb: 'FFEEEEEE' } },
      left: { style: 'thin', color: { argb: 'FFEEEEEE' } },
      right: { style: 'thin', color: { argb: 'FFEEEEEE' } }
    };
  });
  summaryDataRow.height = 35;

  // ==== PHẦN CHỮ KÝ BÊN DƯỚI ====
  sheet.addRow([]); // Dòng trống cách ra
  
  const today = new Date();
  const dd = String(today.getDate()).padStart(2, '0');
  const mm = String(today.getMonth() + 1).padStart(2, '0');
  const yyyy = today.getFullYear();
  const dateStr = `TPHCM, ngày ${dd} tháng ${mm} năm ${yyyy}`;
  
  // Dòng Ngày tháng năm
  const dateRow = sheet.addRow(['', '', '', '', '', '', dateStr, '', '']);
  sheet.mergeCells(`G${dateRow.number}:I${dateRow.number}`);
  const dateCell = sheet.getCell(`G${dateRow.number}`);
  dateCell.alignment = { horizontal: 'center', vertical: 'middle' };
  dateCell.font = { italic: true, bold: true, color: { argb: 'FF1F4E79' } };
  
  // Dòng Chữ ký
  const sigRow = sheet.addRow(['Ban Lãnh Đạo', '', '', 'Trưởng bộ phận', '', '', 'Người lập', '', '']);
  sheet.mergeCells(`A${sigRow.number}:C${sigRow.number}`);
  sheet.mergeCells(`D${sigRow.number}:F${sigRow.number}`);
  sheet.mergeCells(`G${sigRow.number}:I${sigRow.number}`);
  
  [1, 4, 7].forEach(colIndex => {
    const cell = sheet.getCell(sigRow.number, colIndex);
    cell.font = { bold: true, size: 12, color: { argb: 'FF1F4E79' } };
    cell.alignment = { horizontal: 'center', vertical: 'middle' };
  });

  // Thêm 4 dòng trống để chừa chỗ ký tên
  sheet.addRow([]);
  sheet.addRow([]);
  sheet.addRow([]);
  sheet.addRow([]);

  // Thêm Data Validation cho toàn bộ các dòng (từ dòng 6 đến dòng 1000)
  sheet.dataValidations.add('E6:E1000', {
    type: 'list',
    allowBlank: true,
    formulae: ['"Kế hoạch,Đang xử lý,Chờ duyệt,Cần chỉnh sửa,Hoàn thành"'],
    showErrorMessage: true,
    errorStyle: 'information',
    errorTitle: 'Chú ý',
    error: 'Vui lòng chọn trạng thái từ danh sách (Dropdown).'
  });

  sheet.dataValidations.add('F6:F1000', {
    type: 'list',
    allowBlank: true,
    formulae: ['"0%,10%,20%,30%,40%,50%,60%,70%,80%,90%,100%"'],
    showErrorMessage: true,
    errorStyle: 'information',
    errorTitle: 'Chú ý',
    error: 'Vui lòng chọn % tiến độ từ danh sách (Dropdown).'
  });

  // Generate and save file
  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  const fileName = `Bao_Cao_Cong_Viec_${employeeName.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.xlsx`;
  saveAs(blob, fileName);
};
