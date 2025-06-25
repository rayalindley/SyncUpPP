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

ChartJS.register(ArcElement, Tooltip, Legend, ChartDataLabels);

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

const FeedbackReports: React.FC<FeedbackReportsProps> = ({
  feedbackreports,
  organization,
  events,
  userId,
}) => {
  const [eventFilter, setEventFilter] = useState<string>("");
  const [filteredReports, setFilteredReports] = useState<FeedbackReport[]>([]);
  const [summary, setSummary] = useState<string | null>(null);
  const [sentimentResults, setSentimentResults] = useState<any[]>([]);

  useEffect(() => {
    const analyzeFeedback = async () => {
      if (!eventFilter) {
        setFilteredReports([]);
        return;
      }

      const filtered = feedbackreports.filter(r => r.eventid === eventFilter);
      setFilteredReports(filtered);

      const supabase = createClient();
      const { data, error } = await supabase
        .from("form_responses")
        .select("comment, forms!inner(event_id)")
        .eq("forms.event_id", eventFilter);

      if (error) {
        toast.error("Failed to fetch comments.");
        return;
      }

      const rawComments = data.map(d => d.comment).filter(Boolean);

      try {
        const res = await fetch("https://felbert.onrender.com/batch-analyze", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ comments: rawComments }),
        });

        const json = await res.json();
        setSentimentResults(json.results);

        // const summary = await callMistral(json.results);
        // setSummary(summary);
        setSummary(rawComments.join("\n\n"));
      } catch (err) {
        toast.error("Sentiment or summarization API failed.");
      }
    };

    analyzeFeedback();
  }, [eventFilter]);

  const totalResponses = filteredReports.length;
  const averageRating = totalResponses
    ? (filteredReports.reduce((sum, r) => sum + r.rating, 0) / totalResponses).toFixed(1)
    : "0";

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

  filteredReports.forEach((r) => {
    sentimentCount[r.sentiment]++;
  });

  const pieData = {
    labels: ["Positive", "Negative"],
    datasets: [
      {
        data: [
          sentimentCount.positive,
          sentimentCount.negative,
        ],
        backgroundColor: ["#5687F2", "#EAB308", "#EA3A88"],
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

  const topKeywords = Object.entries(keywordMap)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([kw]) => kw);

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
                  <h1 className="text-xl font-bold"> {totalResponses} </h1>
                  <h5 className="text-sm mt-2"> Total Responses </h5>
                </div>

                <div className="bg-charleston rounded-md p-10 text-center">
                  <h1 className="text-xl font-bold"> {averageRating}/5</h1>
                  <h5 className="text-sm mt-2"> Average Rating </h5>
                </div>

                <div>
                  <h3> Most mentioned keywords: </h3>
                  <ul className="list-disc pl-6">
                    {topKeywords.map((kw) => (
                      <li key={kw}>{kw}</li>
                    ))}
                  </ul>
                </div>
              </div>

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

              <div className="mt-16">
                <h2 className="text-lg font-semibold mb-2">Key Insights</h2>
                {summary ? (
                  <div className="bg-charleston p-4 rounded-md text-sm text-white whitespace-pre-line">
                    {summary}
                  </div>
                ) : (
                  <p className="text-light text-sm italic">Getting insights.</p>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </>
  );
};

export default FeedbackReports;
