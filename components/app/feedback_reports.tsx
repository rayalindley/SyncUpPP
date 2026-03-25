"use client";

import { useEffect, useState } from "react";
import { Pie } from "react-chartjs-2";
import ChartDataLabels from "chartjs-plugin-datalabels";
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from "chart.js";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

import { createClient } from "@/lib/supabase/client";
import type { Event } from "@/models/Event";
import type { Organization } from "@/models/Organization";

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
  summaries?: string[] | null;
}

interface FeedbackReportsProps {
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
  const [reports, setReports] = useState<FeedbackReport[]>([]);
  const [summary, setSummary] = useState<string | null>(null);
  const [topKeywords, setTopKeywords] = useState<string[]>([]);
  const [averageLikert, setAverageLikert] = useState<string>("0");
  const [reportLimit, setReportLimit] = useState<number>(0);
  const [totalResponses, setTotalResponses] = useState<number>(0);
  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState(0);

  const loadStats = async () => {
    if (!eventFilter) {
      setReports([]);
      setSummary(null);
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
      setSummary(latest?.summaries?.length ? latest.summaries.join("\n\n") : "No summary available.");
      setTopKeywords(normalizeKeywords(latest?.top_keywords));
      setAverageLikert(latest?.avg_likert?.toFixed(1) ?? "0");
    } catch (err: any) {
      console.error("Error loading stats:", err.message || err);
      toast.error("Failed to load feedback stats.");
      setReports([]);
      setSummary(null);
      setTopKeywords([]);
      setAverageLikert("0");
      setTotalResponses(0);
      setReportLimit(0);
    }
  };

  const normalizeKeywords = (raw: FeedbackReport["top_keywords"]): string[] => {
  if (!raw) return [];
  if (Array.isArray(raw)) return raw; // already array
  // convert object to array of "keyword: count"
  return Object.entries(raw)
    .sort((a, b) => (b[1] as number) - (a[1] as number))
    .map(([kw, count]) => `${kw}: ${count}`);
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

  const handleGenerateReport = async () => {
    if (!eventFilter || reportLimit <= 0) {
      toast.error("No report generations left.");
      return;
    }

    if (!window.confirm("This will use one report generation. Continue?")) return;

    setIsGenerating(true);

    try {
      const res = await fetch("/api/ai/process", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ eventId: eventFilter }),
      });

      const json = await res.json();

      if (!res.ok) throw new Error(json?.error || "Processing failed");

      toast.success("Report generated successfully.");
      await loadStats();
    } catch (err: any) {
      console.error("Report Generation Error:", err.message || err);
      toast.error("Failed to generate report.");
    } finally {
      setProgress(100);
      setTimeout(() => setIsGenerating(false), 600);
    }
  };

  const sentimentCounts = reports[0]?.sentiment_counts ?? { positive: 0, negative: 0 };
  const pieData = {
    labels: ["Positive", "Negative"],
    datasets: [
      { data: [sentimentCounts.positive ?? 0, sentimentCounts.negative ?? 0] },
    ],
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

        {eventFilter && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
              <Metric title="Total Feedbacks" value={totalResponses} />
              <Metric title="Avg Likert" value={`${averageLikert}/5`} />
              <Metric title="Reports Left" value={reportLimit} />
            </div>

            <div className="mt-6 bg-charleston p-4 rounded">
              <h3 className="font-semibold text-white mb-2">Top Keywords</h3>
              <ul className="text-sm text-white list-disc list-inside">
                {topKeywords.map((k) => (
                  <li key={k}>{k}</li>
                ))}
              </ul>
            </div>

            <button
              onClick={handleGenerateReport}
              disabled={isGenerating || totalResponses === 0}
              className="mt-6 px-4 py-2 bg-blue-600 text-white rounded disabled:opacity-50"
            >
              Generate Report
            </button>

            <div className="mt-10 w-80 h-64">
              <Pie data={pieData} />
            </div>

            <div className="mt-10 bg-charleston p-4 rounded text-white whitespace-pre-line">
              {summary}
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
