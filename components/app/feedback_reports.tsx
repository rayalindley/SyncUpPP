"use client";

import { useEffect, useState, useRef, useCallback, useMemo } from "react";
import { Pie } from "react-chartjs-2";
import ChartDataLabels from "chartjs-plugin-datalabels";
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from "chart.js";
import { toast } from "react-toastify";

import { createClient } from "@/lib/supabase/client";
import type { Event } from "@/models/Event";
import type { Organization } from "@/models/Organization";
import { generateFeedbackPDF } from "@/components/custom/generateFeedbackPDF";

ChartJS.register(ArcElement, Tooltip, Legend, ChartDataLabels);

// ─── Types ────────────────────────────────────────────────────────────────────

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
  model?: string | null;
  generated_by?: string | null;
}

interface FeedbackReportsProps {
  feedbackreports: FeedbackReport[];
  organization: Organization;
  events: Event[];
  userId: string;
}

// ─── Keyword colors ───────────────────────────────────────────────────────────

const KEYWORD_COLORS = [
  "bg-violet-600/20 text-violet-300 border-violet-500",
  "bg-sky-600/20 text-sky-300 border-sky-500",
  "bg-emerald-600/20 text-emerald-300 border-emerald-500",
  "bg-amber-600/20 text-amber-300 border-amber-500",
  "bg-rose-600/20 text-rose-300 border-rose-500",
];

// ─── Sub-components ───────────────────────────────────────────────────────────

const Metric = ({ title, value }: { title: string; value: number | string }) => (
  <div className="bg-charleston p-6 rounded text-center">
    <div className="text-xl font-bold text-white">{value}</div>
    <div className="text-sm text-gray-300">{title}</div>
  </div>
);

const LaserAnimation = () => (
  <div className="flex justify-center">
    <style>{`
      @keyframes laserUp {
        0% { top: 100%; opacity: 0; }
        10% { opacity: 1; }
        90% { opacity: 1; }
        100% { top: -100%; opacity: 0; }
      }
      @keyframes laserDown {
        0% { top: -100%; opacity: 0; }
        10% { opacity: 1; }
        90% { opacity: 1; }
        100% { top: 100%; opacity: 0; }
      }
      @keyframes pulseArrow {
        0%, 100% { opacity: 0.4; }
        50% { opacity: 1; }
      }
    `}</style>
    <div className="relative flex h-16 w-16 items-center justify-center">
      <div className="absolute h-12 w-12 animate-pulse rounded-full bg-primary/10 blur-xl" />
      <div className="relative flex rotate-[45deg] scale-90 items-center justify-center space-x-2">
        <div className="relative mb-4 h-12 w-4 overflow-hidden rounded-full border-[2px] border-primary/30 bg-primary/5">
          <div
            className="absolute top-1 left-1/2 z-10 h-0 w-0 -translate-x-1/2 border-b-[5px] border-l-[4px] border-r-[4px] border-b-primary border-l-transparent border-r-transparent"
            style={{ animation: "pulseArrow 1.5s ease-in-out infinite" }}
          />
          <div
            className="absolute left-0 w-full h-6 rounded-full bg-gradient-to-t from-transparent via-primary/80 to-primary blur-[1px]"
            style={{ animation: "laserUp 1.5s cubic-bezier(0.4, 0, 0.2, 1) infinite" }}
          />
        </div>
        <div className="relative mt-4 h-12 w-4 overflow-hidden rounded-full border-[2px] border-white/20 bg-white/5">
          <div
            className="absolute left-0 w-full h-6 rounded-full bg-gradient-to-b from-transparent via-white/80 to-white blur-[1px]"
            style={{ animation: "laserDown 1.5s cubic-bezier(0.4, 0, 0.2, 1) infinite 0.75s" }}
          />
        </div>
      </div>
    </div>
  </div>
);

const EmptyCard = ({ text }: { text: string }) => (
  <div className="mt-6 w-full h-24 flex items-center justify-center rounded-lg border border-[#525252] bg-charleston">
    <p className="text-sm text-gray-400">{text}</p>
  </div>
);

// ─── Main component ───────────────────────────────────────────────────────────

const FeedbackReports: React.FC<FeedbackReportsProps> = ({
  feedbackreports,
  organization,
  events,
  userId,
}) => {
  const supabase = createClient();

  // ── State ──────────────────────────────────────────────────────────────────
  const [eventFilter, setEventFilter] = useState<string>("");
  const [model, setModel] = useState<"llama" | "felbert">("llama");

  const [reports, setReports] = useState<FeedbackReport[]>([]);
  const [sentimentCounts, setSentimentCounts] = useState({ positive: 0, negative: 0 });
  const [summary, setSummary] = useState<string | null>(null);
  const [recommendations, setRecommendations] = useState<string[]>([]);
  const [topKeywords, setTopKeywords] = useState<[string, number][]>([]);
  const [averageLikert, setAverageLikert] = useState<string>("0");
  const [reportLimit, setReportLimit] = useState<number>(0);
  const [totalResponses, setTotalResponses] = useState<number>(0);

  const [isLoadingStats, setIsLoadingStats] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [generatedBy, setGeneratedBy] = useState<string>("Unknown");
  const [generatingMessage, setGeneratingMessage] = useState("Generating report...");

  const abortControllerRef = useRef<AbortController | null>(null);

  // ── Derived ────────────────────────────────────────────────────────────────
  const eventName = useMemo(
    () => events.find((e) => e.id === eventFilter)?.title ?? "",
    [events, eventFilter]
  );

  const total = sentimentCounts.positive + sentimentCounts.negative;

  // ── Chart config ───────────────────────────────────────────────────────────
  const pieData = useMemo(() => ({
    labels: ["Positive", "Negative"],
    datasets: [
      {
        data: [sentimentCounts.positive, sentimentCounts.negative],
        backgroundColor: ["rgba(52, 211, 153, 0.8)", "rgba(244, 63, 94, 0.8)"],
        borderColor: ["rgb(52, 211, 153)", "rgb(244, 63, 94)"],
        hoverBackgroundColor: ["rgba(52, 211, 153, 1)", "rgba(244, 63, 94, 1)"],
        borderWidth: 2,
        hoverOffset: 6,
      },
    ],
  }), [sentimentCounts]);

  const pieOptions = useMemo(() => ({
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
  }), [total]);

  // ── Reset state helper ─────────────────────────────────────────────────────
  const resetStats = useCallback(() => {
    setReports([]);
    setSummary(null);
    setRecommendations([]);
    setSentimentCounts({ positive: 0, negative: 0 });
    setTopKeywords([]);
    setAverageLikert("0");
    setTotalResponses(0);
    setReportLimit(0);
  }, []);

  const loadStats = useCallback(async () => {
    if (!eventFilter) { resetStats(); return; }
    setIsLoadingStats(true);

    try {
      const [
        { data: eventData, error: eventErr },
        { data: formResponses },
        { data: likertQuestions },
        reportRes,
      ] = await Promise.all([
        supabase.from("events").select("report_limit").eq("id", eventFilter).single(),
        supabase.from("form_responses").select("id").eq("event_id", eventFilter),
        supabase.from("questions").select("id").eq("question_type", "Likert"),
        fetch(`/api/reports/get-feedback-report?eventid=${eventFilter}`),
      ]);
      if (eventErr) throw eventErr;
      setReportLimit(eventData?.report_limit ?? 0);
      setTotalResponses(formResponses?.length ?? 0);

      const responseIds = formResponses?.map((r) => r.id) ?? [];
      const likertIds = likertQuestions?.map((q) => q.id) ?? [];

      const json = await reportRes.json();
      if (!reportRes.ok) throw new Error(json.error || "Failed to fetch reports");

      const latest = json.reports?.[0];
      setReports(json.reports ?? []);
      setSummary(latest?.summary ?? null);
      setRecommendations(latest?.recommendations ?? []);
      setSentimentCounts({
        positive: latest?.sentiment_counts?.positive ?? 0,
        negative: latest?.sentiment_counts?.negative ?? 0,
      });
      setTopKeywords(
        Object.entries(latest?.top_keywords ?? {})
          .sort(([, a], [, b]) => (b as number) - (a as number))
          .slice(0, 5) as [string, number][]
      );

      if (latest?.generated_by) {
        const { data: generator } = await supabase
          .from("userprofiles")
          .select("first_name, last_name")
          .eq("userid", latest.generated_by)
          .single();
        setGeneratedBy(
          generator
            ? [generator.first_name, generator.last_name].filter(Boolean).join(" ") || "Unknown"
            : "Unknown"
        );
      } else {
        setGeneratedBy("Unknown");
      }

      // Likert average
      if (likertIds.length > 0 && responseIds.length > 0) {
        const { data: likertAnswers } = await supabase
          .from("form_answers")
          .select("answer")
          .in("response_id", responseIds)
          .in("question_id", likertIds);

          const values = likertAnswers
          ?.map((a) => parseFloat(a.answer))
          .filter((v) => !isNaN(v)) ?? [];

        setAverageLikert(
          values.length > 0
            ? (values.reduce((sum, v) => sum + v, 0) / values.length).toFixed(1)
            : "0"
        );
      } else {
        setAverageLikert("0");
      }

    } catch (err: any) {
      console.error("Error loading stats:", err.message || err);
      toast.info("No feedbacks to process.");
      resetStats();
    } finally {
      setIsLoadingStats(false);
    }
  }, [eventFilter, resetStats]);   

  // ── Effects ────────────────────────────────────────────────────────────────
  useEffect(() => {
    loadStats();
  }, [loadStats]);

  useEffect(() => {
    let timer: number | undefined;
    let msg30: number | undefined;
    let msg45: number | undefined;
    let msg60: number | undefined;

    if (isGenerating) {
      setProgress(5);
      setGeneratingMessage("Generating report...");

      timer = window.setInterval(() => {
        setProgress((p) => Math.min(90, p + Math.floor(Math.random() * 8) + 2));
      }, 700);

      msg30 = window.setTimeout(() => setGeneratingMessage("Still thinking..."), 20000);
      msg45 = window.setTimeout(() => setGeneratingMessage("This may take a moment..."), 30000);
      msg60 = window.setTimeout(() => setGeneratingMessage("It's been a hot minute. Would you like to switch models?"), 60000);
    } else {
      setProgress(0);
      setGeneratingMessage("Generating report...");
    }

    return () => {
      if (timer) clearInterval(timer);
      if (msg30) clearTimeout(msg30);
      if (msg45) clearTimeout(msg45);
      if (msg60) clearTimeout(msg60);
    };
  }, [isGenerating]);

  const fetchUserName = useCallback(async (id: string): Promise<string> => {
    const { data } = await supabase
      .from("userprofiles")
      .select("first_name, last_name")
      .eq("userid", id)
      .single();
    return data
      ? [data.first_name, data.last_name].filter(Boolean).join(" ") || "Unknown"
      : "Unknown";
  }, []);
  
  // ── Handlers ───────────────────────────────────────────────────────────────
  const handleDownloadPDF = useCallback(() => {
  const latestReport = reports[0];
  
  generateFeedbackPDF({
    eventName,
    reportsLeft: events.find((e) => e.id === eventFilter)?.report_limit ?? 0,
    organization,
    totalResponses,
    averageLikert,
    sentimentCounts,
    topKeywords,
    summary,
    recommendations,
    generatedBy,
    model: (latestReport?.model ?? "llama") as "llama" | "felbert",
    eventFilter,
  });
}, [eventName, events, eventFilter, organization, totalResponses, averageLikert, sentimentCounts, topKeywords, summary, recommendations, generatedBy, reports]);

  const handleGenerateReport = useCallback(async () => {
    if (reportLimit === 0 || !eventFilter) return;

    const confirmed = window.confirm("This will decrement your generations. Do you wanna continue?");
    if (!confirmed) return;

    abortControllerRef.current = new AbortController();
    setIsGenerating(true);
    setProgress(0);

    try {
      if (model === "llama") {
        const res = await fetch("/api/ai/process-llama", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            eventId: eventFilter,
            organizationId: organization.organizationid,
            generatedBy: userId,
          }),
          signal: abortControllerRef.current.signal,
        });
        const json = await res.json();
        if (!res.ok) throw new Error(json?.error || "Processing failed");

        await supabase
        .from("events")
        .update({ report_limit: reportLimit - 1 })
        .eq("id", eventFilter);
        
        toast.success("Report generated successfully.");
      } else {
        const { data: feedbacks } = await supabase
          .from("form_responses")
          .select("id, comment")
          .eq("event_id", eventFilter)
          

        if (!feedbacks || feedbacks.length === 0) {
          toast.error("No unprocessed feedbacks to analyze.");
          return;
        }

        const res = await fetch("https://felbert.onrender.com/batch-analyze", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ comments: feedbacks.map((f) => f.comment).filter(Boolean) }),
          signal: abortControllerRef.current.signal,
        });

        const json = await res.json();
        if (!res.ok) throw new Error("FELBERT processing failed");

        // Save report, mark feedbacks processed, decrement limit — all server-side
        const saveRes = await fetch("/api/ai/process-felbert", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            eventId: eventFilter,
            organizationId: organization.organizationid, // ← add
            generatedBy: userId,                          // ← add
            feedbackIds: feedbacks.map((f) => f.id),
            results: json.results,
            keywords: json.keywords,
            summary: json.summary,
          }),
          signal: abortControllerRef.current?.signal,
        });

        if (!saveRes.ok) {
          const saveJson = await saveRes.json();
          throw new Error(saveJson?.error || "Failed to save FELBERT report");
        }

        toast.success("Report generated successfully");
      }

      await loadStats();
    } catch (err: any) {
      if (err.name === "AbortError") {
        toast.info("Report generation cancelled.");
      } else {
        console.error("Report Generation Error:", err.message || err);
        toast.error("Failed to generate report.");
      }
    } finally {
      setProgress(100);
      setTimeout(() => setIsGenerating(false), 600);
      abortControllerRef.current = null;
    }
  }, [eventFilter, model, reportLimit, loadStats]);

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <>
      {/* Generating modal */}
      {isGenerating && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="bg-[#0f1724] border border-[#525252] p-6 rounded-xl w-full max-w-md text-white space-y-4">
            <LaserAnimation />

            <div className="text-center">
              <h3 className="font-semibold text-white">{generatingMessage}</h3>
              <p className="text-xs text-gray-500 mt-1">
                {model === "felbert"
                  ? "FELBERT is analyzing your feedback..."
                  : "Llama is processing your feedback..."}
              </p>
            </div>

            <div className="w-full bg-gray-800 h-2 rounded-full overflow-hidden">
              <div
                className="bg-gradient-to-r from-blue-500 to-violet-500 h-full rounded-full transition-all duration-500"
                style={{ width: `${progress}%` }}
              />
            </div>
            <p className="text-xs text-center text-gray-500">{progress}%</p>

            {generatingMessage.includes("switch models") && (
              <button
                onClick={() => {
                  setModel((m) => (m === "llama" ? "felbert" : "llama"));
                  abortControllerRef.current?.abort();
                }}
                className="w-full px-3 py-2 text-sm rounded-md bg-primary hover:bg-primarydark text-white transition-colors"
              >
                Switch to {model === "llama" ? "FELBERT" : "Llama"}
              </button>
            )}

            <button
              onClick={() => abortControllerRef.current?.abort()}
              className="w-full px-3 py-2 text-sm rounded-md border border-[#525252] text-gray-400 hover:text-white hover:border-gray-400 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      <div className="px-6">
        <h1 className="text-lg font-semibold text-white mt-6">Feedback Reports</h1>

        {/* Header row */}
        <div className="flex items-center justify-between mt-4 flex-wrap gap-2">
          <select
            value={eventFilter}
            onChange={(e) => setEventFilter(e.target.value)}
            className="px-3 py-2 rounded bg-charleston text-white border border-gray-600 text-sm"
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
            {/* Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
              <Metric title="Total Feedbacks" value={totalResponses} />
              <Metric title="Avg Likert" value={`${averageLikert}/5`} />
              <Metric title="Generations Left" value={reportLimit} />
            </div>

            {/* Keywords */}
            <div className="mt-6 bg-charleston p-4 rounded-lg">
              <h3 className="font-semibold text-white mb-3">Top Keywords</h3>
              {isLoadingStats ? (
                <p className="text-sm text-gray-400">Fetching keywords...</p>
              ) : topKeywords.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {topKeywords.map(([word, count], i) => (
                    <div key={word} className="relative group">
                      <span className={`px-3 py-1 rounded-full border text-xs font-medium cursor-default ${KEYWORD_COLORS[i % KEYWORD_COLORS.length]}`}>
                        {word}
                      </span>
                      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 rounded bg-[#1a1a1a] border border-[#525252] text-xs text-white whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
                        mentioned {count}×
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-400">No keywords yet</p>
              )}
            </div>

            {/* Generate controls */}
            <div className="mt-4 flex items-center gap-2 flex-wrap">
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
                className="w-full max-w-xs text-sm rounded-md border border-[#525252] bg-charleston text-white px-3 py-2 focus:outline-none focus:border-primary"
              >
                <option value="llama">Llama — fast results, general analysis</option>
                <option value="felbert">FELBERT — tailored to event feedback</option>
              </select>
            </div>

            {/* Sentiment chart */}
            {isLoadingStats ? (
              <EmptyCard text="Fetching report..." />
            ) : total > 0 ? (
              <div className="mt-6 bg-charleston rounded-lg border border-[#525252] p-5">
                <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-4">
                  Sentiment Breakdown
                </h3>
                <div className="flex gap-3 mb-4">
                  <span className="px-3 py-1 rounded-full text-xs font-medium bg-emerald-600/20 text-emerald-300 border border-emerald-500">
                    ↑ {sentimentCounts.positive} Positive
                  </span>
                  <span className="px-3 py-1 rounded-full text-xs font-medium bg-rose-600/20 text-rose-300 border border-rose-500">
                    ↓ {sentimentCounts.negative} Negative
                  </span>
                </div>
                <div className="relative h-56">
                  <Pie data={pieData} options={pieOptions} />
                </div>
              </div>
            ) : (
              <EmptyCard text="No sentiment data yet" />
            )}

            {/* Summary & Recommendations */}
            <div className="mt-6 space-y-4">
              <div className="bg-charleston rounded-lg p-5 border border-[#525252]">
                <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-1">
                  Summary
                </h3>
                <div className="border-t border-[#525252] mt-2 pt-3">
                  {isLoadingStats ? (
                    <p className="text-sm text-gray-400">Fetching summary...</p>
                  ) : (
                    <p className="text-sm text-gray-200 leading-relaxed">
                      {summary ?? "No summary available."}
                    </p>
                  )}
                </div>
              </div>

              {!isLoadingStats && recommendations.length > 0 && (
                <div className="bg-charleston rounded-lg p-5 border border-[#525252]">
                  <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-1">
                    Recommendations
                  </h3>
                  <div className="border-t border-[#525252] mt-2 pt-3 space-y-2">
                    {recommendations.map((rec, i) => (
                      <div key={i} className="flex items-start gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-primary flex-shrink-0 translate-y-[6px]" />
                        <p className="text-sm text-gray-200 leading-relaxed">{rec}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </>
  );
};

export default FeedbackReports;