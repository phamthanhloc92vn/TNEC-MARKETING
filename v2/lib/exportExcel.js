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
  sheet.addRow([`TRUNGNAM E&C \u00B7 BÁO CÁO CÔNG VIỆC THÁNG ${currentMonth}/${currentYear}`]);
  sheet.addRow(['', '', '', 'HỌ VÀ TÊN:', employeeName]);
  sheet.addRow(['', '', '', 'CHỨC DANH:', employeeRole]);
  sheet.addRow([]); // Dòng trống

  // Style Tiêu đề
  sheet.mergeCells('A1:I1');
  const titleCell = sheet.getCell('A1');
  titleCell.font = { bold: true, size: 18, color: { argb: 'FFFFFFFF' } };
  titleCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF00B050' } }; // Xanh lá TRUNGNAM
  titleCell.alignment = { vertical: 'middle', horizontal: 'center' };
  sheet.getRow(1).height = 40;
  
  sheet.getCell('D2').alignment = { horizontal: 'right', vertical: 'middle' };
  sheet.getCell('D2').font = { color: { argb: 'FF595959' }, bold: true };
  sheet.getCell('E2').font = { color: { argb: 'FF00529B' }, bold: true }; // Xanh dương đậm
  
  sheet.getCell('D3').alignment = { horizontal: 'right', vertical: 'middle' };
  sheet.getCell('D3').font = { color: { argb: 'FF595959' }, bold: true };
  sheet.getCell('E3').font = { color: { argb: 'FF00529B' }, italic: true };

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
      fgColor: { argb: 'FF00529B' } // Xanh dương đậm theo chuẩn bảng biểu
    };
    cell.font = {
      bold: true,
      color: { argb: 'FFFFFFFF' },
      size: 11
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
    if (email.toLowerCase() === 'tnechcm@gmail.com') return 'Trungnam E&C';
    const user = users.find(u => u.email?.toLowerCase() === email.toLowerCase());
    // Nếu email hiện tại là người được lấy báo cáo (employeeName tương ứng thì có thể lấy role luôn, nhưng dùng mảng users sẽ bao quát cả người giao)
    return user ? user.role : email;
  };

  // Add Data
  tasks.forEach((task, index) => {
    let statusIcon = '';
    let textColor = 'FF000000';
    if (task.status === 'Hoàn thành') {
      statusIcon = '✓ Hoàn thành';
      textColor = 'FF00B050'; // Green
    } else if (task.status === 'Cần chỉnh sửa') {
      statusIcon = '⚠️ Cần chỉnh sửa';
      textColor = 'FFC00000'; // Red
    } else if (task.status === 'Đang xử lý') {
      statusIcon = '⏳ Đang xử lý';
      textColor = 'FFED7D31'; // Orange
    } else if (task.status === 'Chờ duyệt') {
      statusIcon = '👁 Chờ duyệt';
      textColor = 'FF00B0F0'; // Cyan
    } else {
      statusIcon = '⏱ Kế hoạch';
      textColor = 'FF00529B'; // Dark Blue
    }

    const progressValue = task.progress !== undefined && task.progress !== null ? task.progress / 100 : 0;

    // Helper định dạng ngày DD/MM/YYYY
    const formatDate = (dateString) => {
      if (!dateString) return '';
      try {
        const d = new Date(dateString);
        if (isNaN(d.getTime())) return dateString;
        return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;
      } catch {
        return dateString;
      }
    };

    const row = sheet.addRow([
      task.name || '',
      task.description || '',
      getRoleByEmail(task.assignedBy),
      getRoleByEmail(task.assignee),
      statusIcon,
      progressValue,
      formatDate(task.startDate),
      formatDate(task.deadline),
      task.attachmentLink || ''
    ]);

    // Lấy màu nền xen kẽ (Zebra striping)
    const rowBgColor = index % 2 === 0 ? 'FFFFFFFF' : 'FFF4F9FF'; // Trắng / Xanh nhạt

    // Formatting for each cell in row
    row.eachCell((cell, colNumber) => {
      // Mặc định bôi màu xen kẽ cho tất cả cột (chứ không tô màu lổm chổm)
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

      // Alignment mặc định là Left
      cell.alignment = { vertical: 'middle', wrapText: true, horizontal: 'left' };

      // Cột 3,4,7,8 căn giữa
      if ([3, 4, 7, 8].includes(colNumber)) {
        cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
      }

      // Status color (Column 5)
      if (colNumber === 5) {
        cell.font = { color: { argb: textColor }, bold: true };
        cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
      }
      
      // Progress formatting (Column 6)
      if (colNumber === 6) {
        cell.alignment = { horizontal: 'center', vertical: 'middle' };
        cell.numFmt = '0%';
        if (progressValue === 1) {
          cell.font = { color: { argb: 'FF00B050' }, bold: true }; // Tô xanh là đật 100%
        } else if (progressValue === 0) {
          cell.font = { color: { argb: 'FF00529B' }, bold: true };
        }
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
  const summaryTitleRow = sheet.addRow(['🗂 TỔNG HỢP & DASHBOARD', '', '', '', '', '', '', '', '']);
  sheet.mergeCells(`A${summaryTitleRow.number}:I${summaryTitleRow.number}`);
  const summaryTitleCell = sheet.getCell(`A${summaryTitleRow.number}`);
  summaryTitleCell.font = { bold: true, color: { argb: 'FFFFFFFF' }, size: 12 };
  summaryTitleCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1F4E79' } };
  summaryTitleCell.alignment = { vertical: 'middle', horizontal: 'left', indent: 1 };
  summaryTitleRow.height = 25;

  // Header các chỉ số
  const summaryHeaderRow = sheet.addRow(['TỔNG HẠNG MỤC', '', '', '', 'TIẾN ĐỘ TRUNG BÌNH', '', '', '', '']);
  sheet.mergeCells(`A${summaryHeaderRow.number}:D${summaryHeaderRow.number}`);
  sheet.mergeCells(`E${summaryHeaderRow.number}:I${summaryHeaderRow.number}`);
  
  // Style cho header chỉ số
  [1, 5].forEach(colIndex => {
    const cell = sheet.getCell(summaryHeaderRow.number, colIndex);
    cell.font = { bold: true, color: { argb: 'FF00529B' }, size: 10 };
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

  // Tính toán chỉ số bằng Công Thức Excel
  const lastTaskRow = Math.max(6, tasks.length + 5);

  const summaryDataRow = sheet.addRow(['', '', '', '', '', '', '', '', '']);
  sheet.mergeCells(`A${summaryDataRow.number}:D${summaryDataRow.number}`);
  sheet.mergeCells(`E${summaryDataRow.number}:I${summaryDataRow.number}`);

  const totalItemsCell = sheet.getCell(`A${summaryDataRow.number}`);
  totalItemsCell.value = { formula: `COUNTA(A6:A${lastTaskRow})`, result: tasks.length };
  
  const avgProgressCell = sheet.getCell(`E${summaryDataRow.number}`);
  avgProgressCell.value = { formula: `IFERROR(AVERAGE(F6:F${lastTaskRow}), 0)` };

  // Style cho value
  const valueColors = ['FF00529B', 'FF00B050']; // Xanh lam, Xanh lá cây
  [1, 5].forEach((colIndex, idx) => {
    const cell = sheet.getCell(summaryDataRow.number, colIndex);
    cell.font = { bold: true, size: 16, color: { argb: valueColors[idx] } };
    cell.alignment = { horizontal: 'center', vertical: 'middle' };
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFFFFF' } };
    
    if (colIndex === 5) cell.numFmt = '0%'; // Định dạng trung bình%

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

  // Bỏ Validation Data của Cột Tiến Độ để ưu tiên dùng định dạng Số Number giúp Excel dễ tính Công Thức
  // Và bổ sung Icon cho Validation Trạng thái luôn
  sheet.dataValidations.add('E6:E1000', {
    type: 'list',
    allowBlank: true,
    formulae: ['"✓ Hoàn thành,⏱ Kế hoạch,⏳ Đang xử lý,⚠️ Cần chỉnh sửa,👁 Chờ duyệt"'],
    showErrorMessage: true,
    errorStyle: 'information',
    errorTitle: 'Chú ý',
    error: 'Vui lòng chọn trạng thái từ danh sách.'
  });

  sheet.dataValidations.add('F6:F1000', {
    type: 'list',
    allowBlank: true,
    formulae: ['"0%,20%,40%,60%,80%,100%"'],
    showErrorMessage: true,
    errorStyle: 'information',
    errorTitle: 'Chú ý',
    error: 'Vui lòng chọn hoặc nhập % tiến độ.'
  });

  // Tự động nhận diện màu sắc (Conditional Formatting) khi xổ Dropdown
  sheet.addConditionalFormatting({
    ref: 'E6:E1000',
    rules: [
      { type: 'cellIs', operator: 'equal', formulae: ['"✓ Hoàn thành"'], style: { font: { color: { argb: 'FF047857' }, bold: true }, fill: { type: 'pattern', pattern: 'solid', bgColor: { argb: 'FFD1FAE5' } } } },
      { type: 'cellIs', operator: 'equal', formulae: ['"⏱ Kế hoạch"'], style: { font: { color: { argb: 'FF4338CA' }, bold: true }, fill: { type: 'pattern', pattern: 'solid', bgColor: { argb: 'FFE0E7FF' } } } },
      { type: 'cellIs', operator: 'equal', formulae: ['"⏳ Đang xử lý"'], style: { font: { color: { argb: 'FFB45309' }, bold: true }, fill: { type: 'pattern', pattern: 'solid', bgColor: { argb: 'FFFEF3C7' } } } },
      { type: 'cellIs', operator: 'equal', formulae: ['"⚠️ Cần chỉnh sửa"'], style: { font: { color: { argb: 'FFB91C1C' }, bold: true }, fill: { type: 'pattern', pattern: 'solid', bgColor: { argb: 'FFFEE2E2' } } } },
      { type: 'cellIs', operator: 'equal', formulae: ['"👁 Chờ duyệt"'], style: { font: { color: { argb: 'FF0E7490' }, bold: true }, fill: { type: 'pattern', pattern: 'solid', bgColor: { argb: 'FFCFFAFE' } } } }
    ]
  });

  // Thêm thanh tiến độ (Data Bar) chạy ngang ô cho Cột F (Tiến độ)
  sheet.addConditionalFormatting({
    ref: 'F6:F1000',
    rules: [
      {
        type: 'dataBar',
        cfvo: [{ type: 'num', value: 0 }, { type: 'num', value: 1 }],
        gradient: false, // Màu đặc không đổ bóng (Solid)
        color: { argb: 'FF86EFAC' }, // Xanh lá mạ (green-300)
        border: true // Có viền chạy theo
      }
    ]
  });

  // Generate and save file
  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  const fileName = `Bao_Cao_Cong_Viec_${employeeName.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.xlsx`;
  saveAs(blob, fileName);
};
