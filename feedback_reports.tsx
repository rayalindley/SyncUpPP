"use client";
import { useState, useEffect } from "react";
import { Pie } from "react-chartjs-2";
import ChartDataLabels from "chartjs-plugin-datalabels";
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
} from "chart.js";
import { toast, ToastContainer } from "react-toastify";
import { createClient } from "@/lib/supabase/client";
import { Event } from "@/models/Event";
import { Organization } from "@/models/Organization";
import Loader from "@/components/Loader";

ChartJS.register(ArcElement, Tooltip, Legend, ChartDataLabels);

interface FeedbackReport {
  id: string;
  eventid: string;
  event_name: string;
  user_id: string;
  rating: number;
  sentiment: "positive" | "negative" | "neutral" | "mixed" | "sarcastic";
  keywords: string[];
  submitted_at?: string;
  feedback_text?: string;
}

interface FeedbackReportsProps {
  feedbackreports: FeedbackReport[];
  organization: Organization;
  events: Event[];
  userId: string;
}

interface ProcessedResult {
  translation: string;
  summary: string;
  sentiment: {
    label: "Positive" | "Neutral" | "Negative" | "Mixed" | "Sarcastic";
    score: number;
  };
  likert: number;
  keywords: string[];
  recommendations: string[];
  original?: string;
}

const FeedbackReports: React.FC<FeedbackReportsProps> = ({
  feedbackreports,
  organization,
  events,
  userId,
}) => {
  const [eventFilter, setEventFilter] = useState<string>("");
  const [filteredReports, setFilteredReports] = useState<FeedbackReport[]>([]);
  const [summary, setSummary] = useState<string | null>(null);
  const [sentimentResults, setSentimentResults] = useState<ProcessedResult[]>([]);
  const [reportLimit, setReportLimit] = useState<number | null>(null);
  const [totalFormResponses, setTotalFormResponses] = useState<number>(0);
  const [isGenerating, setIsGenerating] = useState(false);
  const [topKeywords, setTopKeywords] = useState<string[]>([]);
  const [averageLikertRating, setAverageLikert] = useState("0");

  const loadStats = async () => {
    if (!eventFilter) {
      setFilteredReports([]);
      setSummary(null);
      setReportLimit(null);
      setTotalFormResponses(0);
      return;
    }

    const supabase = createClient();

    // Get event's report limit
    const { data: eventData } = await supabase
      .from("events")
      .select("report_limit")
      .eq("eventid", eventFilter)
      .single();
    setReportLimit(eventData?.report_limit ?? 0);

    // Get total form responses
    const { data: formResponses, error: formError } = await supabase
      .from("form_responses")
      .select("id, comment, submitted_at, forms!inner(event_id)")
      .eq("forms.event_id", eventFilter);

    if (formError) {
      toast.error("Failed to fetch form responses.");
      return;
    }
    setTotalFormResponses(formResponses?.length ?? 0);

    // Average Likert rating
    const { data, error } = await supabase
      .from("form_answers")
      .select("avg:answer", { count: "exact" })
      .eq("form_responses.forms.event_id", eventFilter)
      .in("answer", ["1", "2", "3", "4", "5"]);

    if (!error) {
      const avg = data?.[0]?.avg ?? "0";
      setAverageLikert(Number(avg).toFixed(1));
    }

    // Fetch feedback reports
    const { data: feedbackReports, error: feedbackError } = await supabase
      .from("feedbackreports")
      .select("*")
      .eq("eventid", eventFilter);

    if (feedbackError) {
      console.error("Error fetching feedback reports:", feedbackError);
      return;
    }

    setFilteredReports(feedbackReports || []);
    setSummary(
      feedbackReports && feedbackReports.length > 0
        ? feedbackReports[0].feedback_text || "No summary found."
        : "No reports generated yet."
    );
  };

  useEffect(() => {
    loadStats();
  }, [eventFilter]);

  const aggregateSentimentCounts = (results: ProcessedResult[]) => {
    const counts = { Positive: 0, Neutral: 0, Negative: 0, Mixed: 0, Sarcastic: 0 };
    results.forEach((r) => {
      const key = r.sentiment.label;
      if (counts[key] !== undefined) counts[key]++;
    });
    return counts;
  };

  const handleGenerateReport = async () => {
    if (!eventFilter || reportLimit === 0) return;

    const confirmGen = window.confirm(
      "This will decrement your generations. Do you want to continue?"
    );
    if (!confirmGen) return;

    setIsGenerating(true);
    const supabase = createClient();

    try {
      // Fetch comments
      const { data: formResponses } = await supabase
        .from("form_responses")
        .select("comment, forms!inner(event_id)")
        .eq("forms.event_id", eventFilter);

      const rawComments = formResponses?.map((f) => f.comment).filter(Boolean) || [];
      if (!rawComments.length) {
        toast.error("No comments to analyze.");
        return;
      }

      // Call AI process API
      const results: ProcessedResult[] = [];
      for (const comment of rawComments) {
        const res = await fetch("/api/process", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ feedback: comment }),
        });
        const json = await res.json();
        if (json.result) {
          results.push({ ...json.result, original: comment });
        }
      }

      setSentimentResults(results);

      // Summary
      setSummary(results.map((r) => r.summary).join("\n\n"));

      // Aggregate keywords
      const keywordMap: Record<string, number> = {};
      results.forEach((r) => {
        r.keywords.forEach((kw) => {
          keywordMap[kw] = (keywordMap[kw] || 0) + 1;
        });
      });
      const sortedKeywords = Object.entries(keywordMap)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([kw, count]) => `${kw}: ${count}`);
      setTopKeywords(sortedKeywords);

      // Insert feedback report
      await supabase.from("feedbackreports").insert({
        feedbackreportid: crypto.randomUUID(),
        eventid: eventFilter,
        userid: userId,
        feedback_text: results.map((r) => r.summary).join("\n"),
        sentiment: results.map((r) => r.sentiment.label),
        keywords: Object.keys(keywordMap),
        submitted_at: new Date().toISOString(),
      });

      // Update report limit
      const { error: updateError } = await supabase
        .from("events")
        .update({ report_limit: (reportLimit || 1) - 1 })
        .eq("eventid", eventFilter);

      if (!updateError) setReportLimit((prev) => (prev || 1) - 1);

      await loadStats();
    } catch (err) {
      console.error("Report generation error:", err);
      toast.error("Failed to generate report.");
    } finally {
      setIsGenerating(false);
    }
  };

  const sentimentCounts = aggregateSentimentCounts(sentimentResults);

  const pieData = {
    labels: ["Positive", "Neutral", "Negative", "Mixed", "Sarcastic"],
    datasets: [
      {
        data: [
          sentimentCounts.Positive,
          sentimentCounts.Neutral,
          sentimentCounts.Negative,
          sentimentCounts.Mixed,
          sentimentCounts.Sarcastic,
        ],
        backgroundColor: ["#5687F2", "#9CA3AF", "#EAB308", "#F97316", "#EF4444"],
        borderColor: "white",
        borderWidth: 1,
      },
    ],
  };

  return (
    <>
      <ToastContainer />
      <div className="px-4 sm:px-6 lg:px-8 relative">
        {isGenerating && <Loader />}
        <div className={`${isGenerating ? "opacity-50 pointer-events-none" : ""}`}>
          <div className="sm:flex sm:items-center">
            <div className="sm:flex-auto">
              <h1 className="mt-6 text-base font-semibold leading-6 text-light">
                Feedback Reports
              </h1>
              <p className="mt-2 text-sm text-light">
                Insights and summaries from event feedback responses.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <select
              value={eventFilter}
              onChange={(e) => setEventFilter(e.target.value)}
              className="w-full sm:w-auto truncate rounded-md border border-[#525252] bg-charleston px-3 py-2 mt-6 mb-6 text-white shadow-sm focus:border-primary focus:outline-none focus:ring-primary sm:text-sm"
            >
              <option value="">Select Event</option>
              {events.map((event) => (
                <option key={event.eventid} value={event.eventid}>
                  {event.title}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="bg-charleston rounded-md p-10 text-center">
              <h1 className="text-xl font-bold">{totalFormResponses}</h1>
              <h5 className="text-sm mt-2">Total Responses</h5>
            </div>

            <div className="bg-charleston rounded-md p-10 text-center">
              <h1 className="text-xl font-bold">{averageLikertRating}/5.0</h1>
              <h5 className="text-sm mt-2">Average Likert Rating</h5>
            </div>

            <div className="bg-charleston rounded-md p-10 text-center">
              <h1 className="text-xl font-bold">{reportLimit}</h1>
              <h5 className="text-sm mt-2">Report Generations Left</h5>
            </div>

            {!isGenerating && (
              <button
                onClick={handleGenerateReport}
                disabled={reportLimit === 0}
                className={`mt-4 px-4 py-2 text-sm rounded-md ${
                  reportLimit === 0
                    ? "bg-gray-500 cursor-not-allowed"
                    : "bg-blue-600 hover:bg-blue-700"
                } text-white`}
              >
                Generate Report
              </button>
            )}

            <div className="bg-charleston rounded-md p-10 text-center">
              <h3 className="font-semibold mb-2">Most Mentioned Keywords:</h3>
              <ul className="list-disc list-inside text-sm">
                {topKeywords.map((kw) => (
                  <li key={kw}>{kw}</li>
                ))}
              </ul>
            </div>
          </div>

          <div className="mt-8 mb-6 w-96 h-[250px]">
            <h1 className="font-bold mb-4">Sentiment Analysis</h1>
            <Pie
              data={pieData}
              options={{
                maintainAspectRatio: false,
                layout: { padding: 0 },
                plugins: {
                  datalabels: {
                    formatter: (value, context) => {
                      const total = (context.chart.data.datasets[0].data as number[]).reduce(
                        (a, b) => a + b,
                        0
                      );
                      return ((value / total) * 100).toFixed(1) + "%";
                    },
                    color: "white",
                    font: { weight: "bold", size: 12 },
                  },
                  legend: {
                    position: "right",
                    labels: { color: "white", boxWidth: 12, padding: 8 },
                  },
                },
              }}
            />
          </div>

          <div className="mt-16">
            <h2 className="text-lg font-semibold mb-2">Key Insights</h2>
            {summary ? (
              <div className="bg-charleston p-4 rounded-md text-sm text-white whitespace-pre-line">
                {summary}
              </div>
            ) : (
              <p className="text-light text-sm italic">
                {summary === "No reports generated yet." ? summary : "Getting insights."}
              </p>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default FeedbackReports;
