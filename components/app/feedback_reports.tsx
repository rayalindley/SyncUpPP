"use client";

import { useState, useEffect } from "react";
import { Pie } from "react-chartjs-2";
import ChartDataLabels from 'chartjs-plugin-datalabels';
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
import ReactMarkdown from "react-markdown";

// Register chart components
ChartJS.register(ArcElement, Tooltip, Legend, ChartDataLabels);

// Feedback report structure
interface FeedbackReport {
  feedbackreportid: string;
  eventid: string;
  userid: string;
  feedback_text: string;
  sentiment: { positive: number; negative: number };
  keywords: string[];
  submitted_at: string;
}

interface FeedbackReportsProps {
  feedbackreports: FeedbackReport[];
  organization: Organization;
  events: Event[];
  userId: string;
}

interface SentimentResult {
  sentiment: string;
  confidence: number;
  original: string;
  translated: string;
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
  const [sentimentResults, setSentimentResults] = useState<SentimentResult[]>([]);
  const [totalFormResponses, setTotalFormResponses] = useState<number>(0);
  const [isGenerating, setIsGenerating] = useState(false);
  const [topKeywords, setTopKeywords] = useState<string[]>([]);
  const [sentiment, setSentiment] = useState<{ positive: number; negative: number } | null>(null);
  const [averageLikertRating, setAverageLikert] = useState("0");

  // Load event stats and feedback
  const loadStats = async () => {
    if (!eventFilter) {
      setFilteredReports([]);
      setSummary(null);
      setTotalFormResponses(0);
      setSentiment(null);
      return;
    }

    const supabase = createClient();

    // 1. Total form responses
    const { data: formResponses, error: formError } = await supabase
      .from("form_responses")
      .select("id, comment, submitted_at, forms!inner(event_id)")
      .eq("forms.event_id", eventFilter);

    if (formError) {
      toast.error("Failed to fetch form responses.");
      return;
    }
    setTotalFormResponses(formResponses.length);

    // 2. Likert ratings
    const { data: likertAnswers, error: likertError } = await supabase
      .from("form_answers")
      .select("answer, form_responses!inner(form_id, forms!inner(event_id))")
      .eq("form_responses.forms.event_id", eventFilter)
      .in("answer", ["1", "2", "3", "4", "5"]);

    if (!likertError) {
      const numericAnswers = likertAnswers.map(a => Number(a.answer)).filter(n => !isNaN(n));
      const avg = numericAnswers.length > 0
        ? (numericAnswers.reduce((sum, n) => sum + n, 0) / numericAnswers.length).toFixed(1)
        : "0";
      setAverageLikert(avg);
    }

    // 3. Feedback reports
    const { data: feedbackReports, error: feedbackError } = await supabase
      .from("feedbackreports")
      .select("*")
      .eq("eventid", eventFilter);

    if (feedbackError) return;

    setFilteredReports(feedbackReports || []);

    if (!feedbackReports || feedbackReports.length === 0) {
      setSummary("No reports generated yet.");
      setSentiment(null);
      setTopKeywords([]);
    } else {
      const latest = [...feedbackReports].sort((a, b) =>
        new Date(b.submitted_at).getTime() - new Date(a.submitted_at).getTime()
      )[0];

      setSummary(latest.feedback_text || "No summary found.");
      setSentiment(latest.sentiment || { positive: 0, negative: 0 });

      if (latest.keywords && typeof latest.keywords === 'object') {
        const sorted = Object.entries(latest.keywords)
          .sort((a, b) => b[1] - a[1])
          .slice(0, 5)
          .map(([kw, count]) => `${kw}: ${count}`);
        setTopKeywords(sorted);
      }
    }
  };

  useEffect(() => {
    loadStats();
  }, [eventFilter]);

  // Count sentiments
  function getSentimentCounts(results: SentimentResult[]) {
    const counts = { positive: 0, negative: 0 };
    results.forEach((r) => {
      const sentiment = r.sentiment.toLowerCase();
      if (sentiment === "positive" || sentiment === "negative") {
        counts[sentiment]++;
      }
    });
    return counts;
  }

  // Generate feedback report
  const handleGenerateReport = async () => {
    if (!eventFilter) return;

    const supabase = createClient();

    try {
      // Check for existing responses
      const { data: formResponses } = await supabase
        .from("form_responses")
        .select("comment, forms!inner(event_id)")
        .eq("forms.event_id", eventFilter);

      const rawComments = formResponses?.map((d) => d.comment).filter(Boolean) || [];

      if (rawComments.length === 0) {
        alert("No responses available. Cannot generate report.");
        return;
      }

      // Confirm overwrite if previous report exists
      if (sentimentResults && sentimentResults.length > 0) {
        const confirm = window.confirm("This will erase the previous report. Continue?");
        if (!confirm) return;
      }

      setIsGenerating(true);

      // Call batch sentiment API
      const res = await fetch("http://localhost:5000/batch-analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ comments: rawComments }),
      });

      const json = await res.json();
      setSentimentResults(json.results);
      setSummary(json.summary);
      console.log("Generated feedback:", json);

      // Get form ID for current event
      const { data: formData, error: formIdError } = await supabase
        .from("forms")
        .select("id")
        .eq("event_id", eventFilter)
        .single();

      if (formIdError || !formData) return;

      // Insert new report into feedbackreports
      await supabase.from("feedbackreports").insert({
        feedbackreportid: crypto.randomUUID(),
        eventid: eventFilter,
        userid: userId,
        feedback_text: json.summary,
        sentiment: getSentimentCounts(json.results),
        keywords: json.keywords,
        submitted_at: new Date().toISOString(),
      });

      const sortedKeywords = Object.entries(json.keywords)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([kw, count]) => `${kw}: ${count}`);
      setTopKeywords(sortedKeywords);

      await loadStats();
    } catch (err) {
      console.error("Report generation error:", err);
    } finally {
      setIsGenerating(false);
    }
  };


  // Pie chart data
  const pieData = {
    labels: ["Positive", "Negative"],
    datasets: [
      {
        data: [sentiment?.positive ?? 0, sentiment?.negative ?? 0],
        backgroundColor: ["#5687F2", "#EAB308"],
        borderColor: "white",
        borderWidth: 1,
      },
    ],
  };

  return (
    <>
      <ToastContainer />
      <div className="px-4 sm:px-6 lg:px-8">
        <div className="sm:flex sm:items-center">
          <div className="sm:flex-auto">
            <h1 className="mt-6 text-base font-semibold leading-6 text-light text-white">
              Feedback Reports
            </h1>
            <p className="mt-2 text-sm text-light">
              Insights and summaries from event feedback responses.
            </p>
          </div>
        </div>

        {/* Event dropdown */}
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

        {/* Metrics & visualizations */}
        {eventFilter && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="bg-charleston rounded-md p-10 text-center">
                <h1 className="text-xl font-bold text-white"> {totalFormResponses} </h1>
                <h5 className="text-sm mt-2 text-white"> Total Responses </h5>
              </div>

              <div className="bg-charleston rounded-md p-10 text-center">
                <h1 className="text-xl font-bold text-white"> {averageLikertRating}/5.0</h1>
                <h5 className="text-sm mt-2 text-white"> Average Likert Rating </h5>
              </div>

              <div className="bg-charleston rounded-md p-10 text-center">
                <h3 className="font-semibold mb-2 text-white">Most Mentioned Keywords:</h3>
                <ul className="list-disc list-inside text-sm text-white">
                  {topKeywords.map((kw) => (
                    <ul key={kw}>{kw}</ul>
                  ))}
                </ul>
              </div>

            <button
              onClick={handleGenerateReport}
              disabled={isGenerating || totalFormResponses === 0}
              className="mt-4 px-4 py-2 text-sm rounded-md bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-50 disabled:cursor-not-allowed"
              title={totalFormResponses === 0 ? "No responses to generate from." : ""}
            >
              {isGenerating ? "Generating..." : "Generate Report"}
            </button>

            </div>

            {/* Sentiment Pie Chart */}
            <div className="mt-8 mb-6 w-96 h-[250px]">
              <h1 className="font-bold mb-4 text-white"> Sentiment Analysis </h1>
              {(sentiment?.positive ?? 0) + (sentiment?.negative ?? 0) > 0 ? (
                <Pie
                  data={pieData}
                  options={{
                    maintainAspectRatio: false,
                    layout: { padding: 1 },
                    plugins: {
                      datalabels: {
                        formatter: (value, context) => {
                          const total = (context.chart.data.datasets[0].data as number[]).reduce((a, b) => a + b, 0);
                          const percentage = ((value / total) * 100).toFixed(1) + '%';
                          return percentage;
                        },
                        color: 'white',
                        font: { weight: 'bold', size: 12 },
                      },
                      legend: {
                        position: 'right',
                        labels: { color: 'white', boxWidth: 12, padding: 8 },
                      },
                    },
                  }}
                />
              ) : (
                <div className="text-center text-white italic">No sentiment data available yet.</div>
              )}
            </div>

            {/* Summary of insights */}
            <div className="mt-16">
              <h2 className="text-lg font-semibold mb-2 text-white">Key Insights</h2>
              {summary ? (
                <div className="bg-charleston p-4 rounded-md text-sm text-white whitespace-pre-line">
                  <ReactMarkdown>{summary}</ReactMarkdown>
                </div>
              ) : (
                <p className="text-light text-sm italic">
                  {summary === "No reports generated yet." ? summary : "Getting insights."}
                </p>
              )}
            </div>
          </>
        )}
      </div>
    </>
  );
};

export default FeedbackReports;
