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
import ReactMarkdown from "react-markdown"

ChartJS.register(ArcElement, Tooltip, Legend, ChartDataLabels);

const generateInsights = async (comments: string[]): Promise<string> => {
  const trimmedComments = comments.slice(0, 15); // safer length
  const formatted = trimmedComments.map((c, i) => `- ${c}`).join("\n");

  const prompt = `Here are feedback comments from event attendees:\n${formatted}\n\nPlease summarize and give the key insights from this list.`;

  const res = await fetch("/api/phi-4", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ prompt }),
  });

  const data = await res.json();
  return data.explanation || "No insight generated.";
};

interface FeedbackReport {
  id: string;
  eventid: string;
  event_name: string;
  user_id: string;
  rating: number;
  sentiment: "positive" | "negative";
  keywords: string[];
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
  const [reportLimit, setReportLimit] = useState<number | null>(null);
  const [totalFormResponses, setTotalFormResponses] = useState<number>(0);
  const [isGenerating, setIsGenerating] = useState(false);
  const [reportGenerating, setReportGenerating] = useState(false);
  const [topKeywords, setTopKeywords] = useState<string[]>([]);
  const [averageLikertRating, setAverageLikert] = useState("0");

  const [insightComments, setInsightComments] = useState<string[]>([]);

  const [insight, setInsight] = useState<string>("");
  const [loadingInsight, setLoadingInsight] = useState<boolean>(false);

  const loadStats = async () => {
  if (!eventFilter) {
    setFilteredReports([]);
    setSummary(null);
    setReportLimit(null);
    setTotalFormResponses(0);
    return;
  }

  const supabase = createClient();

  // 1. Get event's report limit
  const { data: eventData } = await supabase
    .from("events")
    .select("report_limit")
    .eq("eventid", eventFilter)
    .single();
  setReportLimit(eventData?.report_limit ?? 0);

  // 2. Get total form responses for the event
  const { data: formResponses, error: formError } = await supabase
    .from("form_responses")
    .select("id, comment, submitted_at, forms!inner(event_id)")
    .eq("forms.event_id", eventFilter);

  if (formError) {
    toast.error("Failed to fetch form responses.");
    return;
  }

  setTotalFormResponses(formResponses.length);

  // 2. Get numeric Likert answers
  const { data: likertAnswers, error: likertError } = await supabase
    .from("form_answers")
    .select("answer, form_responses!inner(form_id, forms!inner(event_id))")
    .eq("form_responses.forms.event_id", eventFilter)
    .in("answer", ["1", "2", "3", "4", "5"]);

  if (likertError) {
    console.error("Error fetching Likert answers:", likertError);
    // TODO uncomment this line when the UI is ready.
    // toast.error("Failed to calculate average rating.");
  } else {
    const numericAnswers = likertAnswers.map(a => Number(a.answer)).filter(n => !isNaN(n));
    const avg =
      numericAnswers.length > 0
        ? (numericAnswers.reduce((sum, n) => sum + n, 0) / numericAnswers.length).toFixed(1)
        : "0";

    setAverageLikert(avg);
  }

  // 3. Fetch feedback reports
  const { data: feedbackReports, error: feedbackError } = await supabase
    .from("feedbackreports")
    .select("*")
    .eq("eventid", eventFilter);

  if (feedbackError) {
    console.error("Error fetching feedback reports:", feedbackError);
    return;
  }

  setFilteredReports(feedbackReports || []);

  if (!feedbackReports || feedbackReports.length === 0) {
    setSummary("No reports generated yet.");
  } else {
    const latest = [...feedbackReports]
      .sort((a, b) => new Date(b.submitted_at).getTime() - new Date(a.submitted_at).getTime())[0];
    setSummary(latest.feedback_text || "No summary found.");
  }
};



  useEffect(() => {
    loadStats();
  }, [eventFilter]);

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

const handleGenerateReport = async () => {
  if (reportLimit === 0 || !eventFilter) return;

  const confirm = window.confirm("This will decrement your generations. Do you wanna continue?");
  if (!confirm) return;

  setIsGenerating(true);
  setReportGenerating(true)

  const supabase = createClient();

  try {
    // Get comments
    const { data: formResponses } = await supabase
      .from("form_responses")
      .select("comment, forms!inner(event_id)")
      .eq("forms.event_id", eventFilter);

    const rawComments = formResponses?.map((d) => d.comment).filter(Boolean) || [];

    if (rawComments.length === 0) {

      //TODO uncomment this line when the UI is ready.
      // toast.error("No comments to analyze.");
      console.error("No comments to analyze.");
      return;
    }

    const res = await fetch("http://localhost:5000/batch-analyze", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ comments: rawComments }),
    });

    const json: { results: SentimentResult[]; keywords: Record<string, number> } = await res.json();
    console.log("API response:", json);
    setSentimentResults(json.results);

    const generatedText = rawComments.join("\n\n");
    setSummary(generatedText);

    // Save to form_responses (optional depending on your logic)
    const { error: insertError } = await supabase
      .from("form_responses")
      .insert([
        {
          form_id: null, // Replace if you have the actual form_id
          attendee_id: userId,
          comment: generatedText,
          submitted_at: new Date().toISOString(),
          certificate_issued: false,
          certificate_preference: "none",
        },
      ]);

    if (insertError) {
      console.error(insertError);

      // TODO uncomment this line when the UI is ready.
      // toast.error("Failed to save generated report.");
      console.error("Failed to save generated report:", insertError);
    }

    // Insert feedback report into feedbackreports table
    await supabase.from("feedbackreports").insert({
      feedbackreportid: crypto.randomUUID(),
      eventid: eventFilter,
      userid: userId,
      feedback_text: json.results.map((r) => r.original).join("\n"),
      sentiment: getSentimentCounts(json.results),
      keywords: Object.keys(json.keywords),
      submitted_at: new Date().toISOString(),
    });

    // Update report_limit
    const { error: updateError } = await supabase
      .from("events")
      .update({ report_limit: (reportLimit || 1) - 1 })
      .eq("eventid", eventFilter);

    if (updateError) {

      // TODO uncomment this line when the UI is ready.
      // toast.error("Failed to update report limit.");
      console.error("Failed to update report limit:", updateError);
    } else {
      setReportLimit((prev) => (prev || 1) - 1);
      // TODO uncomment this line when the UI is ready.
      // toast.success("Report generated and saved.");
      console.log("Report generated and saved successfully.");
    }

    // Top 5 keywords
    const sortedKeywords = Object.entries(json.keywords)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([kw, count]) => `${kw}: ${count}`);
    setTopKeywords(sortedKeywords);

    await loadStats();
  } catch (err) {
    console.error("Report generation error:", err);

    // TODO uncomment this line when the UI is ready.
    // toast.error(`An error occurred while generating the report);

  } finally {
    setIsGenerating(false);
  }
};




  const totalResponses = filteredReports.length;

  const sentimentCount: { [key in "positive" | "negative"]: number } = {
    positive: 0,
    negative: 0,
  };

  sentimentResults.forEach((res) => {
    const label = res.sentiment.toLowerCase() as "positive" | "negative";
    if (label in sentimentCount) {
      sentimentCount[label]++;
    }
  });

  // filteredReports.forEach((r) => {
  //   sentimentCount[r.sentiment]++;
  // });

  const sentimentCounts = getSentimentCounts(sentimentResults);

  const pieData = {
    labels: ["Positive", "Negative"],
    datasets: [
      {
        data: [sentimentCounts.positive, sentimentCounts.negative],
        backgroundColor: ["#5687F2", "#EAB308"],
        borderColor: "white",
        borderWidth: 1,
      },
    ],
  };


  const keywordMap: { [key: string]: number } = {};
  filteredReports.forEach((r) => {
    r.keywords.forEach((kw) => {
      keywordMap[kw] = (keywordMap[kw] || 0) + 1;
    });
  });


  useEffect(() => {
    const fetchComments = async () => {
      if (!eventFilter) {
        setInsightComments([]);
        return;
      }

      const supabase = createClient();
      const { data, error } = await supabase
        .from("feedbackreports")
        .select("feedback_text")
        .eq("eventid", eventFilter)
        .not("feedback_text", "is", null);

      if (error) {
        console.error("Error fetching comments:", error.message);
        setInsightComments([]);
      } else {
        const comments = data.map((row: { feedback_text: string }) => row.feedback_text);
        setInsightComments(comments);
      }
    };

    fetchComments();
  }, [eventFilter]);


  useEffect(() => {
    if (insightComments.length === 0) {
      setInsight("");
      return;
    }

    setLoadingInsight(true);
    generateInsights(insightComments)
      .then((text) => setInsight(text))
      .catch(() => setInsight("Failed to generate insight."))
      .finally(() => setLoadingInsight(false));
  }, [insightComments]);



  return (
    <>
      <ToastContainer />
      <div className="px-4 sm:px-6 lg:px-8">
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

        <div className="text-white">
          {eventFilter && (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="bg-charleston rounded-md p-10 text-center">
                  <h1 className="text-xl font-bold"> {totalFormResponses} </h1>
                  <h5 className="text-sm mt-2"> Total Responses </h5>
                </div>

                <div className="bg-charleston rounded-md p-10 text-center">
                  <h1 className="text-xl font-bold"> {averageLikertRating}/5.0</h1>
                  <h5 className="text-sm mt-2"> Average Likert Rating </h5>
                </div>

                <div className="bg-charleston rounded-md p-10 text-center">
                  <h1 className="text-xl font-bold">{reportLimit}</h1>
                  <h5 className="text-sm mt-2">Report Generations Left</h5>
                </div>

                <button
                  onClick={handleGenerateReport}
                  disabled={reportLimit === 0 || isGenerating}
                  title={reportLimit === 0 ? "No more generations left." : ""}
                  className={`mt-4 px-4 py-2 text-sm rounded-md ${
                    reportLimit === 0
                      ? "bg-gray-500 cursor-not-allowed"
                      : "bg-blue-600 hover:bg-blue-700"
                  } text-white`}
                >
                  {isGenerating ? "Generating..." : "Generate Report"}
                </button>

              <div className="bg-charleston rounded-md p-10 text-center">
                <h3 className="font-semibold mb-2">Most Mentioned Keywords:</h3>
                <ul className="list-disc list-inside text-sm">
                  {topKeywords.map((kw) => (
                    <li key={kw}>{kw}</li>
                  ))}
                </ul>
              </div>

              </div>

            { reportGenerating && (
              <>
              <div className="mt-8 mb-6 w-96 h-[250px]">
                  <h1 className="font-bold mb-4"> Sentiment Analysis </h1>
                  <Pie
                    data={pieData}
                    options={{
                      maintainAspectRatio: false,
                      layout: { padding: 0 },
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
                </div>

                <div className="mt-16 mr-24">
                  <h2 className="font-bold">Key Insights</h2>
                  {loadingInsight ? (
                    <p className="italic text-gray-400">Generating insight...</p>
                  ) : (
                    <ReactMarkdown className="bg-charleston rounded-md px-8 py-5 prose prose-invert mt-2 text-sm"
                      components={{
                        p: ({ node, ...props }) => <p className="mb-2" {...props} />,
                        ul: ({ node, ...props }) => <ul className="mb-3 list-disc pl-6" {...props} />,
                      }}
                    >
                      {insight}
                    </ReactMarkdown>


                  )}
                </div>
                </>
            )}
              
            </>
          )}
        </div>
      </div>
    </>
  );
};

export default FeedbackReports;