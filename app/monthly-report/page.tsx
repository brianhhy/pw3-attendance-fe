"use client";

import { useMemo, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { CalendarDays, Download, FileText, Loader2, RefreshCw, Sparkles } from "lucide-react";
import {
  generateMonthlyAttendanceReport,
  getCachedMonthlyAttendanceReport,
  type MonthlyAttendanceReportRequest,
  type MonthlyAttendanceReportResponse,
} from "../(shared)/(api)/monthlyReport";
import { queryKeys } from "../(shared)/(api)/queryKeys";

const DEFAULT_WEAK_CLASS_THRESHOLD = 60;

const getInitialYearMonth = () => {
  const now = new Date();
  now.setMonth(now.getMonth() - 1);
  return {
    year: now.getFullYear(),
    month: now.getMonth() + 1,
  };
};

const getErrorMessage = (error: unknown) => {
  if (error instanceof Error) return error.message;
  return "보고서 요청 중 오류가 발생했습니다.";
};

export default function MonthlyReportPage() {
  const initialYearMonth = useMemo(() => getInitialYearMonth(), []);
  const queryClient = useQueryClient();
  const reportRef = useRef<HTMLElement | null>(null);
  const [year, setYear] = useState(initialYearMonth.year);
  const [month, setMonth] = useState(initialYearMonth.month);
  const [schoolYear, setSchoolYear] = useState(initialYearMonth.year);
  const [weakClassThreshold, setWeakClassThreshold] = useState(DEFAULT_WEAK_CLASS_THRESHOLD);

  const reportParams: MonthlyAttendanceReportRequest = useMemo(
    () => ({
      year,
      month,
      schoolYear,
      weakClassThreshold,
    }),
    [year, month, schoolYear, weakClassThreshold]
  );

  const reportQueryKey = queryKeys.monthlyAttendanceReport(year, month, schoolYear, weakClassThreshold);

  const {
    data: cachedReport,
    isLoading: isCacheLoading,
    isFetching: isCacheFetching,
    error: cacheError,
  } = useQuery({
    queryKey: reportQueryKey,
    queryFn: () => getCachedMonthlyAttendanceReport(reportParams),
    retry: false,
  });

  const { mutate: generateReport, data: generatedReport, isPending: isGenerating, error: generateError } = useMutation({
    mutationFn: () => generateMonthlyAttendanceReport(reportParams),
    onSuccess: (response) => {
      queryClient.setQueryData(reportQueryKey, response);
    },
  });

  const report: MonthlyAttendanceReportResponse | null = generatedReport ?? cachedReport ?? null;
  const hasReport = Boolean(report?.markdown);
  const isBusy = isCacheLoading || isGenerating;

  const handleDownloadPdf = () => {
    if (!reportRef.current || !report) return;

    const printWindow = window.open("", "_blank", "width=960,height=720");
    if (!printWindow) return;

    const title = `${report.year}년 ${report.month}월 월별 출석 보고서`;
    const reportHtml = reportRef.current.innerHTML;

    printWindow.document.write(`
      <!doctype html>
      <html lang="ko">
        <head>
          <meta charset="utf-8" />
          <title>${title}</title>
          <style>
            @page { size: A4; margin: 16mm; }
            * { box-sizing: border-box; }
            body {
              margin: 0;
              color: #111827;
              font-family: Arial, "Apple SD Gothic Neo", "Malgun Gothic", sans-serif;
              font-size: 12px;
              line-height: 1.6;
            }
            header {
              margin-bottom: 24px;
              padding-bottom: 14px;
              border-bottom: 2px solid #2C79FF;
            }
            header h1 {
              margin: 0;
              font-size: 24px;
              line-height: 1.3;
            }
            header p {
              margin: 6px 0 0;
              color: #4B5563;
              font-size: 12px;
            }
            h1 { margin: 0 0 16px; font-size: 22px; line-height: 1.35; }
            h2 { margin: 24px 0 10px; font-size: 18px; line-height: 1.4; }
            h3 { margin: 18px 0 8px; font-size: 15px; line-height: 1.4; }
            p { margin: 8px 0; color: #374151; }
            ul, ol { margin: 8px 0 8px 20px; padding: 0; }
            li { margin: 2px 0; }
            strong { color: #030712; font-weight: 700; }
            blockquote {
              margin: 12px 0;
              border-left: 4px solid #2C79FF;
              background: #F7F8FF;
              padding: 8px 12px;
              color: #374151;
            }
            code {
              border-radius: 4px;
              background: #F3F4F6;
              padding: 1px 4px;
              font-size: 11px;
            }
            table {
              width: 100%;
              border-collapse: collapse;
              table-layout: fixed;
              margin: 14px 0;
              font-size: 9px;
              page-break-inside: auto;
            }
            tr { page-break-inside: avoid; page-break-after: auto; }
            th, td {
              border: 1px solid #D8DDF0;
              padding: 5px 4px;
              text-align: center;
              vertical-align: middle;
              word-break: keep-all;
              overflow-wrap: anywhere;
            }
            th {
              background: #F7F8FF;
              color: #111827;
              font-weight: 700;
            }
            td { color: #374151; }
          </style>
        </head>
        <body>
          <header>
            <h1>${title}</h1>
            <p>${report.schoolYear}학년도 · 취약 반 기준 ${weakClassThreshold}%</p>
          </header>
          <main>${reportHtml}</main>
          <script>
            window.addEventListener("load", () => {
              window.print();
            });
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  return (
    <div className="w-full min-h-screen p-6 bg-gradient-to-b from-[#FFFFFF] to-[#ECEDFF]">
      <div className="max-w-7xl mx-auto">
        <div className="rounded-3xl bg-[rgba(245,247,255,0.6)] backdrop-blur-[16px] border border-[rgba(200,210,255,0.4)] p-6">
          <div className="flex flex-col gap-6">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-xl bg-[#2C79FF] text-white flex items-center justify-center">
                    <FileText className="w-6 h-6" />
                  </div>
                  <div>
                    <h1 className="text-3xl font-bold text-gray-900">월별 출석 보고서</h1>
                    <p className="mt-1 text-sm text-gray-600">월별 출석 데이터를 기반으로 생성된 보고서를 확인합니다.</p>
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap items-end gap-3">
                <label className="flex flex-col gap-2 text-sm font-medium text-gray-700">
                  기준 연도
                  <input
                    type="number"
                    min="2020"
                    max="2100"
                    value={year}
                    onChange={(event) => setYear(Number(event.target.value))}
                    className="h-11 w-28 rounded-lg border border-[#D8DDF0] bg-white px-3 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#2C79FF]"
                  />
                </label>
                <label className="flex flex-col gap-2 text-sm font-medium text-gray-700">
                  기준 월
                  <select
                    value={month}
                    onChange={(event) => setMonth(Number(event.target.value))}
                    className="h-11 w-24 rounded-lg border border-[#D8DDF0] bg-white px-3 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#2C79FF]"
                  >
                    {Array.from({ length: 12 }, (_, index) => index + 1).map((monthValue) => (
                      <option key={monthValue} value={monthValue}>
                        {monthValue}월
                      </option>
                    ))}
                  </select>
                </label>
                <label className="flex flex-col gap-2 text-sm font-medium text-gray-700">
                  학년도
                  <input
                    type="number"
                    min="2020"
                    max="2100"
                    value={schoolYear}
                    onChange={(event) => setSchoolYear(Number(event.target.value))}
                    className="h-11 w-28 rounded-lg border border-[#D8DDF0] bg-white px-3 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#2C79FF]"
                  />
                </label>
                <label className="flex flex-col gap-2 text-sm font-medium text-gray-700">
                  취약 반 기준
                  <div className="relative">
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={weakClassThreshold}
                      onChange={(event) => setWeakClassThreshold(Number(event.target.value))}
                      className="h-11 w-28 rounded-lg border border-[#D8DDF0] bg-white px-3 pr-8 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#2C79FF]"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-gray-500">%</span>
                  </div>
                </label>
              </div>
            </div>

            <div className="rounded-2xl bg-white/85 border border-[#E0E5F5] shadow-sm overflow-hidden">
              <div className="flex flex-col gap-3 border-b border-[#EEF1FA] px-6 py-4 lg:flex-row lg:items-center lg:justify-between">
                <div className="flex items-center gap-3 text-gray-700">
                  <CalendarDays className="w-5 h-5 text-[#2C79FF]" />
                  <span className="text-sm font-medium">
                    {year}년 {month}월 · {schoolYear}학년도
                  </span>
                  {isCacheFetching && !isCacheLoading && (
                    <span className="text-xs text-gray-500">저장된 보고서 확인 중</span>
                  )}
                </div>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={handleDownloadPdf}
                    disabled={!hasReport}
                    className="inline-flex h-10 items-center gap-2 rounded-lg border border-[#D8DDF0] bg-white px-4 text-sm font-medium text-gray-700 hover:bg-[#F7F8FF] disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <Download className="w-4 h-4" />
                    PDF 다운로드
                  </button>
                  <button
                    type="button"
                    onClick={() => queryClient.invalidateQueries({ queryKey: reportQueryKey })}
                    disabled={isBusy}
                    className="inline-flex h-10 items-center gap-2 rounded-lg border border-[#D8DDF0] bg-white px-4 text-sm font-medium text-gray-700 hover:bg-[#F7F8FF] disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <RefreshCw className={`w-4 h-4 ${isCacheFetching ? "animate-spin" : ""}`} />
                    저장된 보고서 다시 조회
                  </button>
                  <button
                    type="button"
                    onClick={() => generateReport()}
                    disabled={isBusy}
                    className="inline-flex h-10 items-center gap-2 rounded-lg bg-[#2C79FF] px-4 text-sm font-semibold text-white hover:bg-[#1F63D6] disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {isGenerating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                    {hasReport ? "보고서 재생성" : "보고서 생성"}
                  </button>
                </div>
              </div>

              <div className="min-h-[480px] px-6 py-6">
                {isCacheLoading ? (
                  <div className="flex min-h-[420px] flex-col items-center justify-center gap-3 text-gray-600">
                    <Loader2 className="w-8 h-8 animate-spin text-[#2C79FF]" />
                    <span className="text-sm font-medium">저장된 보고서를 확인하고 있습니다.</span>
                  </div>
                ) : hasReport ? (
                  <article ref={reportRef} className="monthly-report-markdown max-w-none text-gray-800">
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>{report?.markdown ?? ""}</ReactMarkdown>
                  </article>
                ) : (
                  <div className="flex min-h-[420px] flex-col items-center justify-center gap-4 text-center">
                    <div className="w-14 h-14 rounded-2xl bg-[#F7F8FF] text-[#2C79FF] flex items-center justify-center">
                      <FileText className="w-7 h-7" />
                    </div>
                    <div>
                      <h2 className="text-xl font-bold text-gray-900">저장된 보고서가 없습니다.</h2>
                      <p className="mt-2 text-sm text-gray-600">선택한 조건으로 월별 출석 보고서를 생성해 주세요.</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => generateReport()}
                      disabled={isGenerating}
                      className="inline-flex h-11 items-center gap-2 rounded-lg bg-[#2C79FF] px-5 text-sm font-semibold text-white hover:bg-[#1F63D6] disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {isGenerating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                      보고서 생성
                    </button>
                  </div>
                )}

                {(cacheError || generateError) && (
                  <div className="mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                    {getErrorMessage(generateError ?? cacheError)}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
