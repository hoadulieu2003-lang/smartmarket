import type { Response } from 'express';
import ExcelJS from 'exceljs';
import { AppError } from './errors';

export type ExcelColumn = {
  header: string;
  key: string;
  width?: number;
  numFmt?: string;
};

export type ExcelSheet = {
  name: string;
  columns: ExcelColumn[];
  rows: Record<string, unknown>[];
};

const MAX_ROWS = 50_000;

export async function sendExcel(res: Response, filename: string, sheets: ExcelSheet[]) {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'Smart Market';
  workbook.created = new Date();

  for (const source of sheets) {
    if (source.rows.length > MAX_ROWS)
      throw new AppError(413, 'EXPORT_TOO_LARGE', `Dữ liệu vượt quá ${MAX_ROWS.toLocaleString('vi-VN')} dòng, vui lòng thu hẹp bộ lọc`);
    const sheet = workbook.addWorksheet(source.name.slice(0, 31), {
      views: [{ state: 'frozen', ySplit: 1 }],
      properties: { defaultRowHeight: 20 },
    });
    sheet.columns = source.columns.map((column) => ({
      header: column.header,
      key: column.key,
      width: column.width ?? 18,
      style: column.numFmt ? { numFmt: column.numFmt } : undefined,
    }));
    sheet.addRows(source.rows);
    const header = sheet.getRow(1);
    header.font = { bold: true, color: { argb: 'FFFFFFFF' } };
    header.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF15803D' } };
    header.alignment = { vertical: 'middle', horizontal: 'center' };
    header.height = 24;
    sheet.autoFilter = { from: 'A1', to: `${sheet.getColumn(source.columns.length).letter}1` };
    sheet.eachRow((row, rowNumber) => {
      if (rowNumber > 1) row.alignment = { vertical: 'top', wrapText: true };
    });
  }

  const buffer = await workbook.xlsx.writeBuffer();
  const encoded = encodeURIComponent(filename).replace(/'/g, '%27');
  res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  res.setHeader('Content-Disposition', `attachment; filename*=UTF-8''${encoded}`);
  res.setHeader('Cache-Control', 'no-store');
  res.send(Buffer.from(buffer));
}
