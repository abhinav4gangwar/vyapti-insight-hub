import * as XLSX from "xlsx";

interface FlattenedRow {
  group_label: string;
  group_id: number;
  sub_label: string;
  [key: string]: string | number;
}

const MONTH_INDEX: Record<string, number> = {
  FULL: 0,
  JAN: 1,
  FEB: 2,
  MAR: 3,
  APR: 4,
  MAY: 5,
  JUN: 6,
  JUL: 7,
  AUG: 8,
  SEP: 9,
  OCT: 10,
  NOV: 11,
  DEC: 12
};

const orderPeriods = (keys: string[], selectedYears: number[]) => {
  return keys
    .filter(k => selectedYears.includes(Number(k.slice(-2))))
    .map(k => {
      const prefix = k.replace(/\d+$/, "");
      const year = Number(k.slice(-2));
      return { k, prefix, year };
    })
    .sort((a, b) => {
      if (a.year !== b.year) return a.year - b.year;
      return MONTH_INDEX[a.prefix] - MONTH_INDEX[b.prefix];
    })
    .map(v => v.k);
};

const getAllPeriodColumns = (data: FlattenedRow[], selectedYears: number[]) => {
  const keySet = new Set<string>();
  
  data.forEach(row => {
    Object.keys(row).forEach(k => {
      if (!["group_label", "group_id", "sub_label"].includes(k)) {
        keySet.add(k);
      }
    });
  });

  const keys = Array.from(keySet).filter(k => !k.endsWith("_YOY"));
  const ordered = orderPeriods(keys, selectedYears);

  const yoyCols = ordered
    .filter(k => k.startsWith("FULL"))
    .map(k => k + "_YOY");

  return [...ordered, ...yoyCols];
};

const groupDataByCategory = (data: FlattenedRow[]) => {
  const grouped = new Map<string, FlattenedRow[]>();
  
  data.forEach(row => {
    const groupLabel = row.group_label as string;
    if (!grouped.has(groupLabel)) {
      grouped.set(groupLabel, []);
    }
    grouped.get(groupLabel)!.push(row);
  });
  
  return grouped;
};

const createSheetData = (
  rows: FlattenedRow[],
  periodColumns: string[],
  firstColLabel: string,
  secondColLabel: string
) => {
  const sheetData: any[][] = [];
  
  // Header row
  const headers = [firstColLabel, secondColLabel, ...periodColumns];
  sheetData.push(headers);
  
  // Data rows
  rows.forEach(row => {
    const dataRow: any[] = [row.group_label, row.sub_label];
    
    periodColumns.forEach(col => {
      const isYoy = col.endsWith("_YOY");
      
      if (isYoy) {
        const yoyValue = row[col];
        dataRow.push(yoyValue != null ? `${yoyValue}%` : "");
      } else {
        const value = row[col] || 0;
        dataRow.push(value);
      }
    });
    
    sheetData.push(dataRow);
  });
  
  return sheetData;
};

export const exportToExcel = (
  data: FlattenedRow[],
  metricType: string,
  selectedYears: number[]
) => {
  const isFuel = metricType === "maker_vs_fuel";
  const firstColLabel = isFuel ? "Fuel" : "Maker";
  const secondColLabel = isFuel ? "Manufacturer" : "Category";
  
  const periodColumns = getAllPeriodColumns(data, selectedYears);
  
  const groupedData = groupDataByCategory(data);
  
  const workbook = XLSX.utils.book_new();
  const usedSheetNames = new Set<string>();

  groupedData.forEach((rows, groupLabel) => {
    const sheetData = createSheetData(
      rows,
      periodColumns,
      firstColLabel,
      secondColLabel
    );
    
    // Create worksheet
    const worksheet = XLSX.utils.aoa_to_sheet(sheetData);
    
    // Set column widths
    const colWidths = [
      { wch: 20 }, 
      { wch: 25 }, 
      ...periodColumns.map(() => ({ wch: 15 }))
    ];
    worksheet["!cols"] = colWidths;
    
    
    let sheetName = groupLabel.substring(0, 31); 
    sheetName = sheetName.replace(/[:\\/?*[\]]/g, "_");
    
   
    let finalSheetName = sheetName;
    let counter = 1;
    while (usedSheetNames.has(finalSheetName)) {
      const suffix = `_${counter}`;
      const maxLength = 31 - suffix.length;
      finalSheetName = sheetName.substring(0, maxLength) + suffix;
      counter++;
    }
    usedSheetNames.add(finalSheetName);
    
    
    XLSX.utils.book_append_sheet(workbook, worksheet, finalSheetName);
  });
  
  // Generate filename
  const yearSuffix = selectedYears.length > 0 
    ? `_${selectedYears.map(y => 2000 + y).join("_")}` 
    : "";
  const timestamp = new Date().toISOString().split("T")[0];
  const filename = `Vahan_${isFuel ? "Fuel" : "VehicleClass"}_Report${yearSuffix}_${timestamp}.xlsx`;
  
  // Write file
  XLSX.writeFile(workbook, filename);
};

export const exportFilteredToExcel = (
  filteredData: FlattenedRow[],
  metricType: string,
  selectedYears: number[],
  searchValue: string
) => {
  if (filteredData.length === 0) {
    alert("No data to export!");
    return;
  }
  
  exportToExcel(filteredData, metricType, selectedYears);
};