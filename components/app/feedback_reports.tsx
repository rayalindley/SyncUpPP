"use client";

import { useEffect, useState, useRef } from "react";
import { Pie } from "react-chartjs-2";
import ChartDataLabels from "chartjs-plugin-datalabels";
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from "chart.js";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

import { createClient } from "@/lib/supabase/client";
import type { Event } from "@/models/Event";
import type { Organization } from "@/models/Organization";
import { generateFeedbackPDF } from "@/components/custom/generateFeedbackPDF";
import { late } from "zod";

ChartJS.register(ArcElement, Tooltip, Legend, ChartDataLabels);

interface FeedbackReport {
  id: string;
  generated_at: string;
  total_feedbacks?: number | null;
  avg_likert?: number | null;
  top_keywords?: Record<string, number> | string[] | null;
  sentiment_counts?: {
    positive?: number;
    negative?: number;
    neutral?: number;
    mixed?: number;
  } | null;
  recommendations?: string[] | null;
  summary?: string | null;
}

interface FeedbackReportsProps {
  feedbackreports: FeedbackReport[];
  organization: Organization;
  events: Event[];
  userId: string;
}

const FeedbackReports: React.FC<FeedbackReportsProps> = ({
  organization,
  events,
  userId,
}) => {
  const supabase = createClient();

  const [eventFilter, setEventFilter] = useState<string>("");
  const [eventName, setEventName] = useState<string>("");
  const [userName, setUserName] = useState<string>("Unknown");
  const [model, setModel] = useState<"llama" | "felbert">("llama");
  const reportRef = useRef<HTMLDivElement>(null);

  const [reports, setReports] = useState<FeedbackReport[]>([]);
  const [sentimentCounts, setSentimentCounts] = useState({ positive: 0, negative: 0 });
  const [summary, setSummary] = useState<string | null>(null);
  const [recommendations, setRecommendations] = useState<string[]>([]);
  const [topKeywords, setTopKeywords] = useState<[string, number][]>([]);
  const [averageLikert, setAverageLikert] = useState<string>("0");
  const [reportLimit, setReportLimit] = useState<number>(0);
  const [totalResponses, setTotalResponses] = useState<number>(0);
  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState(0);

  const loadStats = async () => {
    if (!eventFilter) {
      setReports([]);
      setSummary(null);
      setRecommendations([]);
      setSentimentCounts({ positive: 0, negative: 0 });
      setTopKeywords([]);
      setAverageLikert("0");
      setTotalResponses(0);
      setReportLimit(0);
      return;
    }

    try {
      // --- Event metadata ---
      const { data: eventData, error: eventErr } = await supabase
        .from("events")
        .select("report_limit")
        .eq("id", eventFilter)
        .single();

      if (eventErr) throw eventErr;
      setReportLimit(eventData?.report_limit ?? 0);

      // --- Total feedback count ---
      const { data: feedbacks, error: feedbackErr } = await supabase
        .from("feedbacks")
        .select("*")
        .eq("event_id", eventFilter);

      if (feedbackErr) {
        console.error("Error fetching feedbacks:", feedbackErr);
        setTotalResponses(0);
      } else {
        setTotalResponses(feedbacks?.length ?? 0);
      }

      // --- Processed report via API ---
      const res = await fetch(`/api/reports/get-feedback-report?eventId=${eventFilter}`);
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Failed to fetch reports");

      setReports(json.reports ?? []);
        const latest = json.reports?.[0];
      setSummary(latest?.summary ?? "No summary available.");
      setRecommendations(latest?.recommendations ?? []);  
        const topFive = Object.entries(latest?.top_keywords ?? {})
         .sort(([, a], [, b]) => (b as number) - (a as number))
         .slice(0, 5) as [string, number][];

         setSentimentCounts({
          positive: latest?.sentiment_counts?.positive ?? 0,
          negative: latest?.sentiment_counts?.negative ?? 0,
        });
      setTopKeywords(topFive);
      setAverageLikert(latest?.avg_likert?.toFixed(1) ?? "0");

    } catch (err: any) {
      console.error("Error loading stats:", err.message || err);
      toast.error("Failed to load feedback stats.");
      setReports([]);
      setSummary(null);
      setRecommendations([]);
      setSentimentCounts({ positive: 0, negative: 0 });
      setTopKeywords([]);
      setAverageLikert("0");
      setTotalResponses(0);
      setReportLimit(0);
    }
  };

  const handleDownloadPDF = () => {
    generateFeedbackPDF({
      eventName: events.find((e) => e.id === eventFilter)?.title ?? "",
      reportsLeft: events.find((e) => e.id === eventFilter)?.report_limit ?? 0,
      organization,
      totalResponses,
      averageLikert,
      sentimentCounts,
      topKeywords,
      summary,
      recommendations,
      userName,
      model,
      eventFilter,
    });
  };


  useEffect(() => {
    loadStats();
  }, [eventFilter]);

  useEffect(() => {
    let timer: number | undefined;

    if (isGenerating) {
      setProgress(5);
      timer = window.setInterval(() => {
        setProgress((p) => Math.min(90, p + Math.floor(Math.random() * 8) + 2));
      }, 700);
    } else {
      setProgress(0);
    }

    return () => timer && clearInterval(timer);
  }, [isGenerating]);

  useEffect(() => {
  const fetchUser = async () => {
    const { data } = await supabase
      .from("userprofiles")  
      .select("first_name, last_name")
      .eq("userid", userId)
      .single();
    if (data) {
      setUserName(
        [data.first_name, data.last_name].filter(Boolean).join(" ") || "Unknown"
      );
    }
  };
  fetchUser();
}, [userId]);

  const handleGenerateReport = async () => {
  if (reportLimit === 0 || !eventFilter) return;

  const confirm = window.confirm("This will decrement your generations. Do you wanna continue?");
  if (!confirm) return;

  setIsGenerating(true);
  setProgress(0);

  try {
    if (model === "llama") {
      // ── Groq / Llama path (existing) ──
      const res = await fetch("/api/ai/process", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ eventId: eventFilter }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error || "Processing failed");
      toast.success("Report generated successfully.");

    } else {
      // ── FELBERT path ──
      const { data: feedbacks } = await supabase
        .from("feedbacks")
        .select("id, text")
        .eq("event_id", eventFilter)
        .eq("processed", false);

      if (!feedbacks || feedbacks.length === 0) {
        toast.error("No unprocessed feedbacks to analyze.");
        return;
      }

      const comments = feedbacks.map((f) => f.text).filter(Boolean);

      const res = await fetch("https://felbert.onrender.com/batch-analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ comments }),
      });

      const json = await res.json();
      if (!res.ok) throw new Error("FELBERT processing failed");

      // Normalize FELBERT response into the same shape as Groq
      const positive = json.results.filter((r: any) => r.sentiment === "Positive").length;
      const negative = json.results.filter((r: any) => r.sentiment === "Negative").length;

      // Save report to Supabase
      await supabase.from("feedback_reports").insert({
        event_id: eventFilter,
        generated_at: new Date().toISOString(),
        total_feedbacks: feedbacks.length,
        sentiment_counts: { positive, negative, neutral: 0, mixed: 0 },
        top_keywords: json.keywords,
        summary: json.summary,
        recommendations: [],
        raw_analyses: json.results,
      });

      // Mark feedbacks as processed
      await supabase
        .from("feedbacks")
        .update({ processed: true, processed_at: new Date().toISOString() })
        .in("id", feedbacks.map((f) => f.id));

      toast.success("Report generated with FELBERT!");
    }

    await loadStats();
  } catch (err: any) {
    console.error("Report Generation Error:", err.message || err);
    toast.error("Failed to generate report.");
  } finally {
    setProgress(100);
    setTimeout(() => setIsGenerating(false), 600);
  }
};

const total = (sentimentCounts?.positive ?? 0) + (sentimentCounts?.negative ?? 0);

const pieData = {
  labels: ["Positive", "Negative"],
  datasets: [
    {
      data: [sentimentCounts.positive ?? 0, sentimentCounts.negative ?? 0],
      backgroundColor: ["rgba(52, 211, 153, 0.8)", "rgba(244, 63, 94, 0.8)"],
      borderColor: ["rgb(52, 211, 153)", "rgb(244, 63, 94)"],
      hoverBackgroundColor: ["rgba(52, 211, 153, 1)", "rgba(244, 63, 94, 1)"],
      borderWidth: 2,
      hoverOffset: 6,
    },
  ],
};

const pieOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      position: "bottom" as const,
      labels: {
        color: "#d1d5db",
        padding: 16,
        font: { size: 13 },
        usePointStyle: true,
        pointStyleWidth: 8,
      },
    },
    datalabels: {
      color: "#ffffff",
      font: { size: 13, weight: "bold" as const },
      formatter: (value: number) => {
        if (total === 0) return "";
        const pct = Math.round((value / total) * 100);
        return pct > 0 ? `${pct}%` : "";
      },
    },
    tooltip: {
      callbacks: {
        label: (ctx: any) => {
          const pct = total > 0 ? Math.round((ctx.parsed / total) * 100) : 0;
          return ` ${ctx.label}: ${ctx.parsed} (${pct}%)`;
        },
      },
    },
  },
};

  return (
    <>
      <ToastContainer />

      {isGenerating && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
          <div className="bg-[#0f1724] p-6 rounded-md w-full max-w-md text-white">
            <h3 className="font-semibold mb-2">Generating report...</h3>
            <div className="w-full bg-gray-700 h-3 rounded">
              <div
                className="bg-blue-500 h-full rounded transition-all"
                style={{ width: `${progress}%` }}
              />
            </div>
            <p className="mt-2 text-sm">{progress}%</p>
          </div>
        </div>
      )}

      <div className="px-6">
        <h1 className="text-lg font-semibold text-white mt-6">
          Feedback Reports
        </h1>
        <div className="flex items-center justify-between mt-4">
        <select
          value={eventFilter}
          onChange={(e) => setEventFilter(e.target.value)}
          className="mt-4 px-3 py-2 rounded bg-charleston text-white border border-gray-600"
        >
          <option value="">Select Event</option>
          {events.map((e) => (
            <option key={e.id} value={e.id}>
              {e.title}
            </option>
          ))}
        </select>
            <button
              onClick={handleDownloadPDF}
              disabled={!reports || reports.length === 0}
              className={`px-4 py-2 text-sm bg-emerald-600 rounded-md border border-[#525252] text-white ${
                !reports || reports.length === 0
                  ? "opacity-40 cursor-not-allowed"
                  : "hover:bg-charleston"
              }`}
            >
              ↓ Download PDF
            </button>
            </div>

        {eventFilter && (
          <>


            
            <div ref={reportRef}>
            
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
                <Metric title="Total Feedbacks" value={totalResponses} />
                <Metric title="Avg Likert" value={`${averageLikert}/5`} />
                <Metric title="Reports Left" value={reportLimit} />
              </div>

            <div className="mt-6 bg-charleston p-4 rounded-lg">
              <h3 className="font-semibold text-white mb-3">Top Keywords</h3>
              <div className="flex flex-wrap gap-2">
                {topKeywords.map(([word, count], i) => {
                  const colors = [
                    "bg-violet-600/20 text-violet-300 border-violet-500",
                    "bg-sky-600/20 text-sky-300 border-sky-500",
                    "bg-emerald-600/20 text-emerald-300 border-emerald-500",
                    "bg-amber-600/20 text-amber-300 border-amber-500",
                    "bg-rose-600/20 text-rose-300 border-rose-500",
                  ];
                  return (
                    <div key={word} className="relative group">
                      <span
                        className={`px-3 py-1 rounded-full border text-xs font-medium cursor-default ${colors[i % colors.length]}`}
                      >
                        {word}
                      </span>
                      {/* Tooltip */}
                      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 rounded bg-[#1a1a1a] border border-[#525252] text-xs text-white whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
                        mentioned {count}×
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="mt-4 flex items-center gap-2">
              {/* Generate */}
              <button
                onClick={handleGenerateReport}
                disabled={reportLimit === 0 || isGenerating}
                title={reportLimit === 0 ? "No more generations left." : ""}
                className={`px-4 py-2 bg-emerald-600 text-sm rounded-md ${
                  reportLimit === 0
                    ? "bg-gray-500 cursor-not-allowed"
                    : "bg-blue-600 hover:bg-blue-700"
                } text-white`}
              >
                {isGenerating ? "Generating..." : "Generate Report"}
              </button>
              <select
              value={model}
              onChange={(e) => setModel(e.target.value as "llama" | "felbert")}
              disabled={isGenerating}
              className="text-sm rounded-md border border-[#525252] bg-charleston text-white px-3 py-2 focus:outline-none focus:border-primary"
              >
                <option value="llama">Llama — fast results, general analysis</option>
                <option value="felbert">FELBERT — deeper analysis, tailored to event feedback</option>
              </select>
            </div>

            {(sentimentCounts.positive ?? 0) > 0 || (sentimentCounts.negative ?? 0) > 0 ? (
                <div className="mt-6 bg-charleston rounded-lg border border-[#525252] p-5">
                  <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-4">
                    Sentiment Breakdown
                  </h3>
                  {/* Summary badges */}
                  <div className="flex gap-3 mb-4">
                    <span className="px-3 py-1 rounded-full text-xs font-medium bg-emerald-600/20 text-emerald-300 border border-emerald-500">
                      ↑ {sentimentCounts.positive ?? 0} Positive
                    </span>
                    <span className="px-3 py-1 rounded-full text-xs font-medium bg-rose-600/20 text-rose-300 border border-rose-500">
                      ↓ {sentimentCounts.negative ?? 0} Negative
                    </span>
                  </div>
                  {/* Chart */}
                  <div className="relative h-56">
                    <Pie data={pieData} options={pieOptions} />
                  </div>
                </div>
              ) : (
              <div className="mt-6 w-full h-24 flex items-center justify-center rounded-lg border border-[#525252] bg-charleston">
                <p className="text-sm text-gray-400">No sentiment data yet</p>
              </div>
            )}
              
            <div className="mt-6 space-y-4">
              {/* Summary */}
              <div className="bg-charleston rounded-lg p-5 border border-[#525252]">
                <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-1">
                  Summary
                </h3>
                <div className="border-t border-[#525252] mt-2 pt-3">
                  <p className="text-sm text-gray-200 leading-relaxed">{summary}</p>
                </div>
              </div>

              {/* Recommendations */}
              {recommendations && recommendations.length > 0 && (
                <div className="bg-charleston rounded-lg p-5 border border-[#525252]">
                  <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-1">
                    Recommendations
                  </h3>
                  <div className="border-t border-[#525252] mt-2 pt-3 space-y-2">
                    {recommendations.map((rec: string, i: number) => (
                      <div key={i} className="flex items-start gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-primary flex-shrink-0 translate-y-[6px]" />
                        <p className="text-sm text-gray-200 leading-relaxed">{rec}</p>
                      </div>
                  ))}
                  </div>
                </div>
              )}
            </div>
            </div>
            </>
          )}
    </div>
    </>
  );
};

const Metric = ({
  title,
  value,
}: {
  title: string;
  value: number | string;
}) => (
  <div className="bg-charleston p-6 rounded text-center">
    <div className="text-xl font-bold text-white">{value}</div>
    <div className="text-sm text-gray-300">{title}</div>
  </div>
);

export default FeedbackReports;
