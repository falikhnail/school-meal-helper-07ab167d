import { useState } from 'react';
import { Sun, Search, FileDown, Check, X, Filter, ChevronDown, Eye, MousePointerClick, Layers, Calendar as CalendarIcon, FileSpreadsheet, CalendarRange } from 'lucide-react';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { format } from 'date-fns';
import { id as localeId } from 'date-fns/locale';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Teacher, MealRecord, MealType, MEAL_PRICES, ROLE_LABELS } from '@/types/meal';
import {
  getMonthDates,
  formatCurrency,
  getMonthName,
} from '@/lib/dateUtils';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';

const DAY_NAMES = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];
const DAY_FILTERS = [
  { value: 1, label: 'Senin' },
  { value: 2, label: 'Selasa' },
  { value: 3, label: 'Rabu' },
  { value: 4, label: 'Kamis' },
  { value: 5, label: 'Jumat' },
  { value: 6, label: 'Sabtu' },
  { value: 0, label: 'Minggu' },
];

interface MonthlyPayment {
  id: string;
  teacherId: string;
  month: number;
  year: number;
  amount: number;
  isPaid: boolean;
  paidAt?: Date;
}

interface MonthlyMealTableProps {
  teachers: Teacher[];
  month: number;
  year: number;
  getMealRecord: (teacherId: string, date: Date) => MealRecord | undefined;
  setMealRecord: (teacherId: string, date: Date, mealType: MealType | null) => Promise<void>;
  getMonthRecords: (month: number, year: number) => MealRecord[];
  getMonthlyPayment: (teacherId: string, month: number, year: number) => MonthlyPayment | undefined;
  setMonthlyPaymentStatus: (teacherId: string, month: number, year: number, amount: number, isPaid: boolean) => Promise<void>;
  getTeacherMonthlyTotal: (teacherId: string, month: number, year: number) => number;
}

export function MonthlyMealTable({
  teachers,
  month,
  year,
  getMealRecord,
  setMealRecord,
  getMonthRecords,
  getMonthlyPayment,
  setMonthlyPaymentStatus,
  getTeacherMonthlyTotal,
}: MonthlyMealTableProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDays, setSelectedDays] = useState<number[]>([1, 2, 3, 4, 5]); // Default Senin-Jumat
  const [showPreview, setShowPreview] = useState(false);
  const [exportMode, setExportMode] = useState<'filtered' | 'all'>('filtered');
  const [isBulkMode, setIsBulkMode] = useState(true); // Toggle between bulk and individual mode
  const [selectedWeeks, setSelectedWeeks] = useState<number[]>([1, 2, 3, 4, 5]);
  const [showCustomDateExport, setShowCustomDateExport] = useState(false);
  const [customStartDate, setCustomStartDate] = useState<Date | undefined>(undefined);
  const [customEndDate, setCustomEndDate] = useState<Date | undefined>(undefined);
  const [customExportFormat, setCustomExportFormat] = useState<'pdf' | 'excel'>('pdf');
  
  const allMonthDates = getMonthDates(month, year);
  const monthDates = allMonthDates.filter(date => selectedDays.includes(date.getDay()));
  const monthRecords = getMonthRecords(month, year);
  const monthTotal = monthRecords.reduce((sum, r) => sum + r.cost, 0);

  // Helper function to get week number within month (1-5)
  const getWeekOfMonth = (date: Date): number => {
    const firstDayOfMonth = new Date(date.getFullYear(), date.getMonth(), 1);
    const firstDayOfWeek = firstDayOfMonth.getDay(); // 0 = Sunday
    const dayOfMonth = date.getDate();
    return Math.ceil((dayOfMonth + firstDayOfWeek) / 7);
  };

  // Get available weeks in the current month
  const getAvailableWeeks = (): number[] => {
    const weeks = new Set<number>();
    allMonthDates.forEach(date => {
      weeks.add(getWeekOfMonth(date));
    });
    return Array.from(weeks).sort((a, b) => a - b);
  };

  const availableWeeks = getAvailableWeeks();

  const filteredTeachers = teachers.filter(
    (teacher) =>
      teacher.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ROLE_LABELS[teacher.role].toLowerCase().includes(searchQuery.toLowerCase())
  );

  const toggleDay = (day: number) => {
    setSelectedDays(prev => 
      prev.includes(day) 
        ? prev.filter(d => d !== day)
        : [...prev, day].sort((a, b) => (a === 0 ? 7 : a) - (b === 0 ? 7 : b))
    );
  };

  const selectWeekdays = () => {
    setSelectedDays([1, 2, 3, 4, 5]);
  };

  const selectAllDays = () => {
    setSelectedDays([0, 1, 2, 3, 4, 5, 6]);
  };

  const handlePaymentToggle = async (teacher: Teacher) => {
    const total = getTeacherMonthlyTotal(teacher.id, month, year);
    const currentPayment = getMonthlyPayment(teacher.id, month, year);
    const newIsPaid = !currentPayment?.isPaid;
    await setMonthlyPaymentStatus(teacher.id, month, year, total, newIsPaid);
  };

  // Toggle week selection for bulk mode
  const toggleWeek = (week: number) => {
    setSelectedWeeks(prev => 
      prev.includes(week) 
        ? prev.filter(w => w !== week)
        : [...prev, week].sort((a, b) => a - b)
    );
  };

  const selectAllWeeks = () => {
    setSelectedWeeks([...availableWeeks]);
  };

  // Bulk toggle all same day-of-week in the selected weeks for a teacher
  const handleBulkDayToggle = async (teacher: Teacher, clickedDate: Date, isCurrentlyChecked: boolean) => {
    const dayOfWeek = clickedDate.getDay();
    // Filter same day dates that are also in selected weeks
    const sameDayDates = monthDates.filter(date => {
      return date.getDay() === dayOfWeek && selectedWeeks.includes(getWeekOfMonth(date));
    });
    
    // Toggle: if currently checked, uncheck all same days; otherwise check all
    const newMealType = isCurrentlyChecked ? null : 'siang' as MealType;
    
    // Process all same-day dates in selected weeks
    for (const date of sameDayDates) {
      await setMealRecord(teacher.id, date, newMealType);
    }
  };

  // Individual toggle for a single date
  const handleIndividualToggle = async (teacher: Teacher, date: Date, isCurrentlyChecked: boolean) => {
    const newMealType = isCurrentlyChecked ? null : 'siang' as MealType;
    await setMealRecord(teacher.id, date, newMealType);
  };

  // Handle checkbox change based on current mode
  const handleCheckboxChange = (teacher: Teacher, date: Date, isChecked: boolean) => {
    if (isBulkMode) {
      handleBulkDayToggle(teacher, date, isChecked);
    } else {
      handleIndividualToggle(teacher, date, isChecked);
    }
  };

  const DAY_NAMES_FULL = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];

  const openPreview = (mode: 'filtered' | 'all') => {
    setExportMode(mode);
    setShowPreview(true);
  };

  const getExportPreviewData = () => {
    const exportAll = exportMode === 'all';
    const exportDates = exportAll ? allMonthDates : monthDates;
    const exportTeachers = filteredTeachers;
    
    const getExportTotal = (teacherId: string) => {
      return exportDates.reduce((sum, date) => {
        const record = getMealRecord(teacherId, date);
        return sum + (record ? record.cost : 0);
      }, 0);
    };

    const exportMonthTotal = exportTeachers.reduce((sum, teacher) => sum + getExportTotal(teacher.id), 0);
    const teachersWithMeals = exportTeachers.filter(t => getExportTotal(t.id) > 0).length;
    
    return {
      monthName: getMonthName(month),
      year,
      modeLabel: exportAll ? 'Semua Hari' : 'Hari Terfilter',
      daysCount: exportDates.length,
      selectedDaysLabel: exportAll ? 'Semua hari dalam bulan' : selectedDays.map(d => DAY_NAMES_FULL[d]).join(', '),
      teacherCount: exportTeachers.length,
      teachersWithMeals,
      total: exportMonthTotal,
    };
  };

  const exportToPDF = () => {
    const exportAll = exportMode === 'all';
    // Export should follow current visible teacher filter (search)
    const exportTeachers = filteredTeachers;

    if (exportTeachers.length === 0) {
      alert('Tidak ada data guru untuk di-export. Tambahkan guru terlebih dahulu.');
      return;
    }
    
    setShowPreview(false);

    const doc = new jsPDF('landscape');
    const monthName = getMonthName(month);

    // Choose dates based on export option
    const exportDates = exportAll ? allMonthDates : monthDates;

    // Title with filter info
    doc.setFontSize(16);
    doc.text(`Data Makan Bulanan - ${monthName} ${year}`, 14, 15);
    
    // Show which days are included
    if (exportAll) {
      doc.setFontSize(8);
      doc.text(`Semua Hari`, 14, 20);
    } else {
      const dayNamesIncluded = selectedDays.map(d => DAY_NAMES_FULL[d]).join(', ');
      doc.setFontSize(8);
      doc.text(`Filter: ${dayNamesIncluded}`, 14, 20);
    }

    // Create date headers with day names
    const dateHeaders = exportDates.map(date => {
      const dayName = DAY_NAMES_FULL[date.getDay()].substring(0, 3);
      return `${dayName}\n${date.getDate()}`;
    });

    // Headers: Nama, Keterangan, [dates...], Total, Status
    const headers = ['Nama', 'Ket.', ...dateHeaders, 'Total', 'Status'];

    // Calculate total for each teacher based on export dates
    const getExportTotal = (teacherId: string) => {
      return exportDates.reduce((sum, date) => {
        const record = getMealRecord(teacherId, date);
        return sum + (record ? record.cost : 0);
      }, 0);
    };

    // Table data with meal records for each date - using checkmarks only for meals
    const tableData = exportTeachers.map((teacher) => {
      const teacherTotal = getExportTotal(teacher.id);
      const payment = getMonthlyPayment(teacher.id, month, year);
      
      // Mark cells that have meals - use placeholder that will be drawn as checkmark
      const mealStatuses = exportDates.map(date => {
        const record = getMealRecord(teacher.id, date);
        return record ? 'HAS_MEAL' : '';
      });
      
      return [
        teacher.name,
        ROLE_LABELS[teacher.role].substring(0, 8),
        ...mealStatuses,
        formatCurrency(teacherTotal),
        payment?.isPaid ? 'Lunas' : 'Belum',
      ];
    });

    // Calculate export month total
    const exportMonthTotal = exportTeachers.reduce((sum, teacher) => sum + getExportTotal(teacher.id), 0);

    // Dynamic column styles - adjust based on number of dates
    const columnStyles: { [key: string]: object } = {
      '0': { cellWidth: exportAll ? 25 : 30 },
      '1': { cellWidth: exportAll ? 12 : 18, halign: 'center' },
    };
    
    // Date columns - smaller if exporting all days
    const dateColWidth = exportAll ? 6 : 9;
    exportDates.forEach((_, index) => {
      columnStyles[String(index + 2)] = { cellWidth: dateColWidth, halign: 'center' };
    });
    
    // Total and Status columns
    columnStyles[String(exportDates.length + 2)] = { cellWidth: exportAll ? 20 : 25, halign: 'right', fontStyle: 'bold' };
    columnStyles[String(exportDates.length + 3)] = { cellWidth: exportAll ? 12 : 15, halign: 'center' };

    autoTable(doc, {
      head: [headers],
      body: tableData,
      startY: 25,
      styles: { fontSize: exportAll ? 5 : 6, cellPadding: 1, lineWidth: 0.2, lineColor: [0, 0, 0] },
      headStyles: { fillColor: [59, 130, 246], textColor: 255, halign: 'center', fontSize: exportAll ? 4 : 5, lineWidth: 0.2, lineColor: [0, 0, 0] },
      columnStyles,
      foot: [[
        { content: 'Total:', colSpan: exportDates.length + 2, styles: { halign: 'right', fontStyle: 'bold' } },
        { content: formatCurrency(exportMonthTotal), styles: { halign: 'right', fontStyle: 'bold' } },
        { content: '', styles: {} },
      ]],
      didParseCell: (data) => {
        if (data.section === 'body' && data.cell.raw === 'HAS_MEAL') {
          data.cell.text = [];
        }
      },
      didDrawCell: (data) => {
        if (data.section === 'body' && data.cell.raw === 'HAS_MEAL') {
          const x = data.cell.x + data.cell.width / 2;
          const y = data.cell.y + data.cell.height / 2;
          const size = Math.min(data.cell.width, data.cell.height) * 0.35;
          doc.setDrawColor(34, 139, 34);
          doc.setLineWidth(0.4);
          doc.line(x - size * 0.5, y, x - size * 0.1, y + size * 0.4);
          doc.line(x - size * 0.1, y + size * 0.4, x + size * 0.5, y - size * 0.4);
        }
      },
    });

    doc.save(`data-makan-${monthName}-${year}.pdf`);
  };

  const exportToExcel = (mode: 'filtered' | 'all') => {
    const exportAll = mode === 'all';
    const exportTeachers = filteredTeachers;
    if (exportTeachers.length === 0) {
      alert('Tidak ada data guru untuk di-export.');
      return;
    }
    setShowPreview(false);

    const monthName = getMonthName(month);
    const exportDates = exportAll ? allMonthDates : monthDates;

    const getExportTotal = (teacherId: string) => {
      return exportDates.reduce((sum, date) => {
        const record = getMealRecord(teacherId, date);
        return sum + (record ? record.cost : 0);
      }, 0);
    };

    // Build worksheet data
    const headers = ['No', 'Nama', 'Keterangan', ...exportDates.map(d => {
      const dayName = DAY_NAMES_FULL[d.getDay()].substring(0, 3);
      return `${dayName} ${d.getDate()}`;
    }), 'Jumlah Porsi', 'Total Tagihan', 'Status'];

    const rows = exportTeachers.map((teacher, idx) => {
      const teacherTotal = getExportTotal(teacher.id);
      const porsi = exportDates.filter(d => !!getMealRecord(teacher.id, d)).length;
      const payment = getMonthlyPayment(teacher.id, month, year);
      const mealStatuses = exportDates.map(d => getMealRecord(teacher.id, d) ? '✔' : '');
      return [idx + 1, teacher.name, ROLE_LABELS[teacher.role], ...mealStatuses, porsi, teacherTotal, payment?.isPaid ? 'Lunas' : 'Belum'];
    });

    const exportMonthTotal = exportTeachers.reduce((sum, t) => sum + getExportTotal(t.id), 0);
    rows.push(['', '', 'TOTAL', ...exportDates.map(() => ''), '', exportMonthTotal, '']);

    const ws = XLSX.utils.aoa_to_sheet([headers, ...rows]);
    ws['!cols'] = [
      { wch: 4 }, { wch: 20 }, { wch: 15 },
      ...exportDates.map(() => ({ wch: 6 })),
      { wch: 12 }, { wch: 15 }, { wch: 10 },
    ];

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, `${monthName} ${year}`);
    XLSX.writeFile(wb, `data-makan-${monthName}-${year}.xlsx`);
  };

  // Custom date range export helpers
  const getCustomDateRange = (): Date[] => {
    if (!customStartDate || !customEndDate) return [];
    const dates: Date[] = [];
    const current = new Date(customStartDate);
    while (current <= customEndDate) {
      dates.push(new Date(current));
      current.setDate(current.getDate() + 1);
    }
    return dates;
  };

  const exportCustomToPDF = () => {
    const exportDates = getCustomDateRange();
    const exportTeachers = filteredTeachers;
    if (exportTeachers.length === 0 || exportDates.length === 0) return;
    setShowCustomDateExport(false);

    const doc = new jsPDF('landscape');
    const startLabel = format(customStartDate!, 'd MMM yyyy', { locale: localeId });
    const endLabel = format(customEndDate!, 'd MMM yyyy', { locale: localeId });

    doc.setFontSize(16);
    doc.text(`Data Makan - ${startLabel} s/d ${endLabel}`, 14, 15);
    doc.setFontSize(8);
    doc.text(`Rentang Custom: ${exportDates.length} hari`, 14, 20);

    const dateHeaders = exportDates.map(date => {
      const dayName = DAY_NAMES_FULL[date.getDay()].substring(0, 3);
      return `${dayName}\n${date.getDate()}/${date.getMonth() + 1}`;
    });

    const headers = ['Nama', 'Ket.', ...dateHeaders, 'Total', 'Status'];

    const getExportTotal = (teacherId: string) =>
      exportDates.reduce((sum, date) => {
        const record = getMealRecord(teacherId, date);
        return sum + (record ? record.cost : 0);
      }, 0);

    const tableData = exportTeachers.map((teacher) => {
      const teacherTotal = getExportTotal(teacher.id);
      const mealStatuses = exportDates.map(date => getMealRecord(teacher.id, date) ? 'HAS_MEAL' : '');
      return [
        teacher.name,
        ROLE_LABELS[teacher.role].substring(0, 8),
        ...mealStatuses,
        formatCurrency(teacherTotal),
        teacherTotal > 0 ? 'Ada' : '-',
      ];
    });

    const exportTotal = exportTeachers.reduce((sum, t) => sum + getExportTotal(t.id), 0);

    const dateColWidth = exportDates.length > 20 ? 6 : 9;
    const columnStyles: { [key: string]: object } = {
      '0': { cellWidth: exportDates.length > 20 ? 25 : 30 },
      '1': { cellWidth: exportDates.length > 20 ? 12 : 18, halign: 'center' },
    };
    exportDates.forEach((_, i) => {
      columnStyles[String(i + 2)] = { cellWidth: dateColWidth, halign: 'center' };
    });
    columnStyles[String(exportDates.length + 2)] = { cellWidth: 20, halign: 'right', fontStyle: 'bold' };
    columnStyles[String(exportDates.length + 3)] = { cellWidth: 12, halign: 'center' };

    autoTable(doc, {
      head: [headers],
      body: tableData,
      startY: 25,
      styles: { fontSize: exportDates.length > 20 ? 5 : 6, cellPadding: 1 },
      headStyles: { fillColor: [59, 130, 246], textColor: 255, halign: 'center', fontSize: exportDates.length > 20 ? 4 : 5 },
      columnStyles,
      foot: [[
        { content: 'Total:', colSpan: exportDates.length + 2, styles: { halign: 'right', fontStyle: 'bold' } },
        { content: formatCurrency(exportTotal), styles: { halign: 'right', fontStyle: 'bold' } },
        { content: '', styles: {} },
      ]],
      didDrawCell: (data) => {
        if (data.section === 'body' && data.cell.raw === 'HAS_MEAL') {
          const x = data.cell.x + data.cell.width / 2;
          const y = data.cell.y + data.cell.height / 2;
          const size = Math.min(data.cell.width, data.cell.height) * 0.35;
          doc.setDrawColor(34, 139, 34);
          doc.setLineWidth(0.4);
          doc.line(x - size * 0.5, y, x - size * 0.1, y + size * 0.4);
          doc.line(x - size * 0.1, y + size * 0.4, x + size * 0.5, y - size * 0.4);
          data.cell.text = [];
        }
      },
    });

    doc.save(`data-makan-custom-${format(customStartDate!, 'yyyyMMdd')}-${format(customEndDate!, 'yyyyMMdd')}.pdf`);
  };

  const exportCustomToExcel = () => {
    const exportDates = getCustomDateRange();
    const exportTeachers = filteredTeachers;
    if (exportTeachers.length === 0 || exportDates.length === 0) return;
    setShowCustomDateExport(false);

    const getExportTotal = (teacherId: string) =>
      exportDates.reduce((sum, date) => {
        const record = getMealRecord(teacherId, date);
        return sum + (record ? record.cost : 0);
      }, 0);

    const headers = ['No', 'Nama', 'Keterangan', ...exportDates.map(d => {
      const dayName = DAY_NAMES_FULL[d.getDay()].substring(0, 3);
      return `${dayName} ${d.getDate()}/${d.getMonth() + 1}`;
    }), 'Jumlah Porsi', 'Total Tagihan'];

    const rows = exportTeachers.map((teacher, idx) => {
      const teacherTotal = getExportTotal(teacher.id);
      const porsi = exportDates.filter(d => !!getMealRecord(teacher.id, d)).length;
      const mealStatuses = exportDates.map(d => getMealRecord(teacher.id, d) ? '✔' : '');
      return [idx + 1, teacher.name, ROLE_LABELS[teacher.role], ...mealStatuses, porsi, teacherTotal];
    });

    const exportTotal = exportTeachers.reduce((sum, t) => sum + getExportTotal(t.id), 0);
    rows.push(['', '', 'TOTAL', ...exportDates.map(() => ''), '', exportTotal]);

    const ws = XLSX.utils.aoa_to_sheet([headers, ...rows]);
    ws['!cols'] = [
      { wch: 4 }, { wch: 20 }, { wch: 15 },
      ...exportDates.map(() => ({ wch: 7 })),
      { wch: 12 }, { wch: 15 },
    ];

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Custom Range');
    XLSX.writeFile(wb, `data-makan-custom-${format(customStartDate!, 'yyyyMMdd')}-${format(customEndDate!, 'yyyyMMdd')}.xlsx`);
  };

  const handleCustomExport = () => {
    if (customExportFormat === 'pdf') {
      exportCustomToPDF();
    } else {
      exportCustomToExcel();
    }
  };

  // Calculate paid and unpaid totals
  const paidTotal = filteredTeachers.reduce((sum, teacher) => {
    const payment = getMonthlyPayment(teacher.id, month, year);
    if (payment?.isPaid) {
      return sum + getTeacherMonthlyTotal(teacher.id, month, year);
    }
    return sum;
  }, 0);

  const unpaidTotal = monthTotal - paidTotal;

  return (
    <Card className="border-border/50">
      <CardHeader className="pb-3">
        <div className="flex flex-col gap-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <CardTitle className="text-lg font-semibold text-foreground">
                Data Makan Bulanan
              </CardTitle>
              <p className="text-sm text-muted-foreground mt-1">
                {getMonthName(month)} {year}
              </p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Cari nama atau keterangan..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="gap-2" size="sm">
                  <Filter className="w-4 h-4" />
                  <span className="hidden xs:inline">Hari</span> ({selectedDays.length})
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <div className="px-2 py-1.5 flex gap-2">
                  <Button size="sm" variant="ghost" className="flex-1 h-7 text-xs" onClick={selectWeekdays}>
                    Sen-Jum
                  </Button>
                  <Button size="sm" variant="ghost" className="flex-1 h-7 text-xs" onClick={selectAllDays}>
                    Semua
                  </Button>
                </div>
                {DAY_FILTERS.map((day) => (
                  <DropdownMenuCheckboxItem
                    key={day.value}
                    checked={selectedDays.includes(day.value)}
                    onCheckedChange={() => toggleDay(day.value)}
                  >
                    {day.label}
                  </DropdownMenuCheckboxItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
            <TooltipProvider delayDuration={100}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant={isBulkMode ? "default" : "outline"}
                    className="gap-1.5"
                    size="sm"
                    onClick={() => setIsBulkMode(!isBulkMode)}
                  >
                    {isBulkMode ? (
                      <>
                        <Layers className="w-4 h-4" />
                        <span className="hidden sm:inline">Bulk</span>
                      </>
                    ) : (
                      <>
                        <MousePointerClick className="w-4 h-4" />
                        <span className="hidden sm:inline">Individual</span>
                      </>
                    )}
                  </Button>
                </TooltipTrigger>
                <TooltipContent 
                  side="bottom" 
                  className="max-w-xs"
                  sideOffset={8}
                >
                  {isBulkMode ? (
                    <p><strong>Mode Bulk:</strong> Klik pada satu tanggal akan otomatis mencentang/menghapus centang semua hari yang sama di minggu yang dipilih (misal: semua hari Senin di minggu 1-4)</p>
                  ) : (
                    <p><strong>Mode Individual:</strong> Klik hanya akan mencentang/menghapus centang satu tanggal saja</p>
                  )}
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
            {isBulkMode && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="gap-1.5" size="sm">
                    <CalendarIcon className="w-4 h-4" />
                    <span className="hidden xs:inline">Minggu</span> ({selectedWeeks.length})
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <div className="px-2 py-1.5">
                    <Button size="sm" variant="ghost" className="w-full h-7 text-xs" onClick={selectAllWeeks}>
                      Pilih Semua Minggu
                    </Button>
                  </div>
                  <DropdownMenuSeparator />
                  {availableWeeks.map((week) => (
                    <DropdownMenuCheckboxItem
                      key={week}
                      checked={selectedWeeks.includes(week)}
                      onCheckedChange={() => toggleWeek(week)}
                    >
                      Minggu ke-{week}
                    </DropdownMenuCheckboxItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            )}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="gap-1.5" size="sm">
                  <FileDown className="w-4 h-4" />
                  <span className="hidden sm:inline">Export</span>
                  <ChevronDown className="w-3 h-3" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="bg-popover w-56">
                <div className="px-2 py-1.5 text-xs font-medium text-muted-foreground">Export PDF</div>
                <DropdownMenuItem onClick={() => openPreview('filtered')}>
                  <Eye className="w-4 h-4 mr-2" />
                  Hari Terfilter ({monthDates.length} tanggal)
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => openPreview('all')}>
                  <Eye className="w-4 h-4 mr-2" />
                  Semua Hari ({allMonthDates.length} tanggal)
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <div className="px-2 py-1.5 text-xs font-medium text-muted-foreground">Export Excel</div>
                <DropdownMenuItem onClick={() => exportToExcel('filtered')}>
                  <FileSpreadsheet className="w-4 h-4 mr-2" />
                  Excel - Hari Terfilter
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => exportToExcel('all')}>
                  <FileSpreadsheet className="w-4 h-4 mr-2" />
                  Excel - Semua Hari
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <div className="px-2 py-1.5 text-xs font-medium text-muted-foreground">Custom Rentang Tanggal</div>
                <DropdownMenuItem onClick={() => { setCustomExportFormat('pdf'); setShowCustomDateExport(true); }}>
                  <CalendarRange className="w-4 h-4 mr-2" />
                  PDF - Rentang Custom
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => { setCustomExportFormat('excel'); setShowCustomDateExport(true); }}>
                  <CalendarRange className="w-4 h-4 mr-2" />
                  Excel - Rentang Custom
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {teachers.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <p>Tambahkan guru terlebih dahulu untuk mengisi data makan</p>
          </div>
        ) : filteredTeachers.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <p>Tidak ada hasil untuk "{searchQuery}"</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto -mx-4 px-0 sm:px-4">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-2 sm:py-3 px-2 text-xs sm:text-sm font-medium text-muted-foreground sticky left-0 bg-card z-10 min-w-[100px] sm:min-w-[140px]">
                      Nama
                    </th>
                    {monthDates.map((date) => (
                      <th
                        key={date.toISOString()}
                        className="text-center py-2 sm:py-3 px-0.5 sm:px-1 text-xs sm:text-sm font-medium text-muted-foreground min-w-[32px] sm:min-w-[40px]"
                      >
                        <div className="text-[9px] sm:text-[10px] text-muted-foreground/70">{DAY_NAMES[date.getDay()]}</div>
                        <div className="text-[10px] sm:text-xs">{date.getDate()}</div>
                      </th>
                    ))}
                    <th className="text-right py-2 sm:py-3 px-1 sm:px-2 text-xs sm:text-sm font-medium text-muted-foreground min-w-[70px] sm:min-w-[90px]">
                      Total
                    </th>
                    <th className="text-center py-2 sm:py-3 px-1 sm:px-2 text-xs sm:text-sm font-medium text-muted-foreground min-w-[70px] sm:min-w-[100px]">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filteredTeachers.map((teacher) => {
                    const teacherMonthTotal = getTeacherMonthlyTotal(teacher.id, month, year);
                    const payment = getMonthlyPayment(teacher.id, month, year);
                    const isPaid = payment?.isPaid || false;

                    return (
                      <tr key={teacher.id} className="border-b border-border/50 hover:bg-muted/30">
                        <td className="py-2 sm:py-3 px-2 sticky left-0 bg-card z-10">
                          <div className="font-medium text-foreground text-xs sm:text-sm truncate max-w-[90px] sm:max-w-none">{teacher.name}</div>
                          <div className="text-[10px] sm:text-xs text-muted-foreground">
                            {ROLE_LABELS[teacher.role]}
                          </div>
                        </td>
                        {monthDates.map((date) => {
                          const record = getMealRecord(teacher.id, date);
                          const isChecked = !!record;
                          return (
                            <td 
                              key={date.toISOString()} 
                              className="py-1.5 sm:py-2 px-0.5 sm:px-1"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <div className="flex justify-center">
                              <Checkbox
                                  checked={isChecked}
                                  onCheckedChange={() => {
                                    handleCheckboxChange(teacher, date, isChecked);
                                  }}
                                  onClick={(e) => e.stopPropagation()}
                                  className="h-4 w-4 sm:h-5 sm:w-5 data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                                />
                              </div>
                            </td>
                          );
                        })}
                        <td className="py-2 sm:py-3 px-1 sm:px-2 text-right">
                          <span className={`text-xs sm:text-sm font-medium ${teacherMonthTotal > 0 ? 'text-success' : 'text-muted-foreground'}`}>
                            {formatCurrency(teacherMonthTotal)}
                          </span>
                        </td>
                        <td className="py-3 px-2 text-center">
                          {teacherMonthTotal > 0 ? (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handlePaymentToggle(teacher)}
                              className={`h-7 px-2 ${isPaid ? 'text-green-600 hover:text-green-700' : 'text-orange-500 hover:text-orange-600'}`}
                            >
                              {isPaid ? (
                                <Badge variant="outline" className="bg-green-500/10 text-green-600 border-green-500/30">
                                  <Check className="w-3 h-3 mr-1" />
                                  Lunas
                                </Badge>
                              ) : (
                                <Badge variant="outline" className="bg-orange-500/10 text-orange-500 border-orange-500/30">
                                  <X className="w-3 h-3 mr-1" />
                                  Belum
                                </Badge>
                              )}
                            </Button>
                          ) : (
                            <span className="text-xs text-muted-foreground">-</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
                <tfoot>
                  <tr className="bg-muted/50">
                    <td colSpan={monthDates.length + 1} className="py-3 px-2 text-right font-semibold text-foreground">
                      Total Bulan Ini:
                    </td>
                    <td className="py-3 px-2 text-right">
                      <span className="text-lg font-bold text-success">
                        {formatCurrency(monthTotal)}
                      </span>
                    </td>
                    <td className="py-3 px-2 text-center">
                      <div className="flex flex-col gap-1">
                        <span className="text-xs text-green-600">Lunas: {formatCurrency(paidTotal)}</span>
                        <span className="text-xs text-orange-500">Belum: {formatCurrency(unpaidTotal)}</span>
                      </div>
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
            <div className="flex flex-wrap gap-4 mt-4 pt-4 border-t border-border">
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Sun className="w-3 h-3 text-primary" />
                <span>Siang = {formatCurrency(MEAL_PRICES.siang)}</span>
              </div>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Check className="w-3 h-3 text-green-600" />
                <span>Klik status untuk mengubah</span>
              </div>
            </div>
          </>
        )}

        {/* Export Preview Modal */}
        <Dialog open={showPreview} onOpenChange={setShowPreview}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <FileDown className="w-5 h-5 text-primary" />
                Preview Export PDF
              </DialogTitle>
              <DialogDescription>
                Periksa ringkasan data sebelum mengunduh
              </DialogDescription>
            </DialogHeader>
            
            {showPreview && (() => {
              const preview = getExportPreviewData();
              return (
                <div className="space-y-4">
                  <div className="bg-muted/50 rounded-lg p-4 space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Periode</span>
                      <span className="font-medium">{preview.monthName} {preview.year}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Mode Export</span>
                      <Badge variant="secondary">{preview.modeLabel}</Badge>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Hari yang diexport</span>
                      <span className="text-sm font-medium">{preview.daysCount} hari</span>
                    </div>
                    <div className="text-xs text-muted-foreground border-t border-border pt-2">
                      {preview.selectedDaysLabel}
                    </div>
                  </div>
                  
                  <div className="bg-muted/50 rounded-lg p-4 space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Jumlah Guru</span>
                      <span className="font-medium">{preview.teacherCount} orang</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Guru dengan Data Makan</span>
                      <span className="font-medium">{preview.teachersWithMeals} orang</span>
                    </div>
                  </div>
                  
                  <div className="bg-primary/10 rounded-lg p-4">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium">Total Biaya</span>
                      <span className="text-lg font-bold text-primary">{formatCurrency(preview.total)}</span>
                    </div>
                  </div>
                  
                  {preview.teachersWithMeals === 0 && (
                    <div className="bg-orange-500/10 border border-orange-500/30 rounded-lg p-3 text-sm text-orange-600">
                      ⚠️ Tidak ada data makan untuk periode ini. PDF akan kosong.
                    </div>
                  )}
                </div>
              );
            })()}
            
            <DialogFooter className="gap-2 sm:gap-0">
              <Button variant="outline" onClick={() => setShowPreview(false)}>
                Batal
              </Button>
              <Button onClick={exportToPDF} className="gap-2">
                <FileDown className="w-4 h-4" />
                Download PDF
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Custom Date Range Export Dialog */}
        <Dialog open={showCustomDateExport} onOpenChange={setShowCustomDateExport}>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <CalendarRange className="w-5 h-5 text-primary" />
                Export Rentang Tanggal Custom
              </DialogTitle>
              <DialogDescription>
                Pilih tanggal mulai dan akhir untuk export {customExportFormat === 'pdf' ? 'PDF' : 'Excel'}
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">Tanggal Mulai</label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className="w-full justify-start text-left font-normal">
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {customStartDate ? format(customStartDate, 'd MMM yyyy', { locale: localeId }) : 'Pilih tanggal'}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={customStartDate}
                        onSelect={setCustomStartDate}
                        initialFocus
                        className="p-3 pointer-events-auto"
                      />
                    </PopoverContent>
                  </Popover>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">Tanggal Akhir</label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className="w-full justify-start text-left font-normal">
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {customEndDate ? format(customEndDate, 'd MMM yyyy', { locale: localeId }) : 'Pilih tanggal'}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={customEndDate}
                        onSelect={setCustomEndDate}
                        disabled={(date) => customStartDate ? date < customStartDate : false}
                        initialFocus
                        className="p-3 pointer-events-auto"
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              </div>

              {customStartDate && customEndDate && (
                <div className="bg-muted/50 rounded-lg p-4 space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Rentang</span>
                    <span className="text-sm font-medium">
                      {format(customStartDate, 'd MMM yyyy', { locale: localeId })} — {format(customEndDate, 'd MMM yyyy', { locale: localeId })}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Jumlah Hari</span>
                    <span className="text-sm font-medium">{getCustomDateRange().length} hari</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Format</span>
                    <Badge variant="secondary">{customExportFormat === 'pdf' ? 'PDF' : 'Excel'}</Badge>
                  </div>
                </div>
              )}

              {customStartDate && customEndDate && getCustomDateRange().length > 31 && (
                <div className="bg-orange-500/10 border border-orange-500/30 rounded-lg p-3 text-sm text-orange-600">
                  ⚠️ Rentang lebih dari 31 hari. Ukuran kolom di PDF mungkin sangat kecil.
                </div>
              )}
            </div>
            
            <DialogFooter className="gap-2 sm:gap-0">
              <Button variant="outline" onClick={() => setShowCustomDateExport(false)}>
                Batal
              </Button>
              <Button
                onClick={handleCustomExport}
                disabled={!customStartDate || !customEndDate}
                className="gap-2"
              >
                <FileDown className="w-4 h-4" />
                Download {customExportFormat === 'pdf' ? 'PDF' : 'Excel'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}
