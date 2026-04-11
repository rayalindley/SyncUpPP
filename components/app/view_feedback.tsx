"use client";

import { useEffect, useMemo, useState } from "react";
import dynamic from "next/dynamic";
import { useDebounce } from "use-debounce";
import { createClient } from "@/lib/supabase/client";
import { ArrowLeftIcon, XMarkIcon } from "@heroicons/react/24/outline";
import { useRouter } from "next/navigation";

const DataTable = dynamic(() => import("react-data-table-component"), {
  ssr: false,
}) as any;

const supabase = createClient();

type QuestionMeta = {
  choices?: string[];
  category?: string;
};

type QuestionObj = {
  id: string;
  question_text: string;
  question_type: string;
  metadata?: QuestionMeta;
  question_order?: number;
};

type FormAnswer = {
  answer: string;
  question: QuestionObj | null;
};

type FeedbackRow = {
  id: string;
  attendee_id: string;
  comment: string | null;
  submitted_at: string | null;
  certificate_preference: string | null;
  certificate_issued: boolean | null;
  form_answers?: FormAnswer[];
};

type DrawerQuestionItem = {
  question: QuestionObj;
  answer: string;
};

const likertLabelsMap: Record<string, string[]> = {
  Agreement: [
    "Strongly Disagree",
    "Disagree",
    "Neutral",
    "Agree",
    "Strongly Agree",
  ],
  Satisfaction: [
    "Very Unsatisfied",
    "Unsatisfied",
    "Neutral",
    "Satisfied",
    "Very Satisfied",
  ],
  Frequency: ["Never", "Rarely", "Sometimes", "Often", "Always"],
  Importance: [
    "Not Important",
    "Slightly Important",
    "Neutral",
    "Very Important",
    "Extremely Important",
  ],
  Effectiveness: [
    "Not Effective",
    "Slightly Effective",
    "Neutral",
    "Very Effective",
    "Extremely Effective",
  ],
};

export default function FeedbackTable({
  eventSlug,
  userId,
}: {
  eventSlug: string;
  userId: string;
}) {
  const router = useRouter();

  const [event, setEvent] = useState<any>(null);
  const [formId, setFormId] = useState<string | null>(null);
  const [formQuestions, setFormQuestions] = useState<QuestionObj[]>([]);
  const [rows, setRows] = useState<FeedbackRow[]>([]);
  const [loading, setLoading] = useState(true);

  const [filterText, setFilterText] = useState<string>("");
  const [debouncedFilterText] = useDebounce(filterText, 300);

  // Drawer state
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [selectedResponse, setSelectedResponse] = useState<FeedbackRow | null>(null);

  useEffect(() => {
    const loadFeedback = async () => {
      setLoading(true);

      // 1) event by slug
      const { data: eventData, error: eventError } = await supabase
        .from("events")
        .select("id, title")
        .eq("eventslug", eventSlug)
        .maybeSingle();

      if (eventError || !eventData) {
        console.error("Error fetching event by slug:", eventError);
        setEvent(null);
        setRows([]);
        setFormQuestions([]);
        setLoading(false);
        return;
      }

      setEvent(eventData);

      // 2) form by event_id (fallback slug)
      let resolvedFormId: string | null = null;

      const { data: formByEvent, error: formByEventError } = await supabase
        .from("forms")
        .select("id")
        .eq("event_id", eventData.id)
        .maybeSingle();

      if (!formByEventError && formByEvent?.id) {
        resolvedFormId = formByEvent.id;
      } else {
        const { data: formBySlug, error: formBySlugError } = await supabase
          .from("forms")
          .select("id")
          .eq("slug", eventSlug)
          .maybeSingle();

        if (formBySlugError || !formBySlug?.id) {
          console.error("No form found for event:", formByEventError || formBySlugError);
          setRows([]);
          setFormQuestions([]);
          setLoading(false);
          return;
        }

        resolvedFormId = formBySlug.id;
      }

      setFormId(resolvedFormId);

      // 3) fetch ALL questions attached to this form (for drawer full layout)
      const { data: formQuestionRows, error: fqError } = await supabase
        .from("form_questions")
        .select(`
          question_order,
          question:questions (
            id,
            question_text,
            question_type,
            metadata
          )
        `)
        .eq("form_id", resolvedFormId)
        .order("question_order", { ascending: true });

      if (fqError) {
        console.error("Error fetching form questions:", fqError);
        setFormQuestions([]);
      } else {
        const normalizedQuestions: QuestionObj[] = (formQuestionRows || [])
          .map((fq: any) => {
            const q = Array.isArray(fq.question) ? fq.question[0] : fq.question;
            if (!q) return null;
            return {
              ...q,
              question_order: fq.question_order ?? 0,
            } as QuestionObj;
          })
          .filter(Boolean) as QuestionObj[];

        setFormQuestions(normalizedQuestions);
      }

      // 4) fetch responses + answers
      const { data: responses, error: responsesError } = await supabase
        .from("form_responses")
        .select(`
          id,
          attendee_id,
          comment,
          submitted_at,
          certificate_preference,
          certificate_issued,
          form_answers (
            answer,
            question:questions (
              id,
              question_text,
              question_type,
              metadata
            )
          )
        `)
        .eq("form_id", resolvedFormId)
        .order("submitted_at", { ascending: false });

      if (responsesError) {
        console.error("Error fetching feedback responses:", responsesError);
        setRows([]);
      } else {
        const normalized: FeedbackRow[] = (responses || []).map((r: any) => ({
          id: r.id,
          attendee_id: r.attendee_id,
          comment: r.comment,
          submitted_at: r.submitted_at,
          certificate_preference: r.certificate_preference,
          certificate_issued: r.certificate_issued,
          form_answers: (r.form_answers || []).map((fa: any) => ({
            answer: fa.answer,
            question: Array.isArray(fa.question)
              ? fa.question[0] ?? null
              : fa.question ?? null,
          })),
        }));

        setRows(normalized);
      }

      setLoading(false);
    };

    loadFeedback();
  }, [eventSlug]);

  const getLikertAverage = (row: FeedbackRow): string => {
    const likertAnswers = (row.form_answers || [])
      .filter((fa) => {
        const qType = (fa.question?.question_type || "").toLowerCase();
        return qType === "likert";
      })
      .map((fa) => {
        const n = Number(fa.answer);
        if (Number.isNaN(n)) return null;
        return n >= 0 && n <= 4 ? n + 1 : n >= 1 && n <= 5 ? n : null;
      })
      .filter((n): n is number => n !== null);

    if (!likertAnswers.length) return "—";
    const avg = likertAnswers.reduce((sum, n) => sum + n, 0) / likertAnswers.length;
    return `${avg.toFixed(1)}/5`;
  };

  const filteredData = useMemo(() => {
    if (!debouncedFilterText) return rows;

    const q = debouncedFilterText.toLowerCase();

    return rows.filter((r) => {
      const attendee = (r.attendee_id || "").toLowerCase();
      const comment = (r.comment || "").toLowerCase();
      const submittedAt = (r.submitted_at || "").toLowerCase();
      const likertAvg = getLikertAverage(r).toLowerCase();

      const answersText = (r.form_answers || [])
        .map((a) => `${a.question?.question_text || ""} ${a.answer || ""}`)
        .join(" ")
        .toLowerCase();

      return (
        attendee.includes(q) ||
        comment.includes(q) ||
        submittedAt.includes(q) ||
        answersText.includes(q) ||
        likertAvg.includes(q)
      );
    });
  }, [rows, debouncedFilterText]);

  const formatAnswers = (answers?: FormAnswer[]) => {
    if (!answers || answers.length === 0) return "—";
    return answers
      .map((a) => `${a.question?.question_text || "Question"}: ${a.answer ?? ""}`)
      .join("\n");
  };

  const handleExportCSV = () => {
    const headers = [
      "Response ID",
      "Attendee ID",
      "Comment",
      "Likert Average",
      "Submitted At",
      "Certificate Preference",
      "Certificate Issued",
      "Answers",
    ];

    const csvRows = filteredData.map((r) => [
      r.id ?? "",
      r.attendee_id ?? "",
      (r.comment ?? "").replace(/"/g, '""'),
      getLikertAverage(r),
      r.submitted_at ?? "",
      r.certificate_preference ?? "",
      String(!!r.certificate_issued),
      formatAnswers(r.form_answers).replace(/"/g, '""'),
    ]);

    const csvContent = [headers, ...csvRows]
      .map((row) => row.map((cell) => `"${cell}"`).join(","))
      .join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = `${event?.title || "event"}-feedback-responses.csv`;
    a.click();

    URL.revokeObjectURL(url);
  };

  const openDrawer = (row: FeedbackRow) => {
    setSelectedResponse(row);
    setIsDrawerOpen(true);
  };

  const closeDrawer = () => {
    setIsDrawerOpen(false);
    setSelectedResponse(null);
  };

  // merge all form questions with selected response answers (so unanswered text questions still appear)
  const drawerItems: DrawerQuestionItem[] = useMemo(() => {
    if (!selectedResponse) return [];

    const answerByQuestionId = new Map<string, string>();
    (selectedResponse.form_answers || []).forEach((fa) => {
      const qid = fa.question?.id;
      if (qid) answerByQuestionId.set(qid, fa.answer ?? "");
    });

    return [...formQuestions]
      .sort((a, b) => (a.question_order ?? 0) - (b.question_order ?? 0))
      .map((q) => ({
        question: q,
        answer: answerByQuestionId.get(q.id) ?? "",
      }));
  }, [selectedResponse, formQuestions]);

  const renderLikertView = (answer: string, category?: string) => {
    const labels = category ? likertLabelsMap[category] : null;
    if (!labels || labels.length === 0) {
      return <p className="text-sm text-gray-300">{answer || "—"}</p>;
    }

    const raw = Number(answer);
    const selectedIndex = Number.isNaN(raw) ? -1 : raw > 4 ? raw - 1 : raw;

    return (
      <div className="flex flex-wrap gap-2 mt-2">
        {labels.map((label, idx) => {
          const active = idx === selectedIndex;
          return (
            <div
              key={idx}
              className={`px-3 py-1 rounded-full text-xs border ${
                active
                  ? "bg-[#379A7B]/30 border-[#379A7B] text-white"
                  : "bg-transparent border-gray-600 text-gray-400"
              }`}
            >
              {label}
            </div>
          );
        })}
      </div>
    );
  };

  const columns = [
    {
      name: "Submitted At",
      selector: (row: FeedbackRow) => row.submitted_at || "",
      sortable: true,
      cell: (row: FeedbackRow) =>
        row.submitted_at
          ? new Date(row.submitted_at).toLocaleString("en-US", {
              month: "short",
              day: "numeric",
              year: "numeric",
              hour: "numeric",
              minute: "numeric",
              hour12: true,
            })
          : "N/A",
    },
    {
      name: "Attendee ID",
      selector: (row: FeedbackRow) => row.attendee_id || "",
      sortable: true,
      wrap: true,
    },
    {
      name: "Comment",
      selector: (row: FeedbackRow) => row.comment || "",
      sortable: true,
      grow: 2,
      wrap: true,
      cell: (row: FeedbackRow) => row.comment || "—",
    },
    {
      name: "Likert Avg",
      selector: (row: FeedbackRow) => getLikertAverage(row),
      sortable: true,
      cell: (row: FeedbackRow) => (
        <span className="text-sm font-semibold">{getLikertAverage(row)}</span>
      ),
    },
    {
      name: "Actions",
      cell: (row: FeedbackRow) => (
        <button
          onClick={() => openDrawer(row)}
          className="px-3 py-1.5 rounded-md bg-primary text-white text-xs hover:opacity-90"
        >
          View
        </button>
      ),
      button: true,
      ignoreRowClick: true,
    },
  ];

  const subHeaderComponent = (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between w-full gap-2">
      <input
        type="text"
        placeholder="Search by attendee, comment, answers, avg..."
        value={filterText}
        onChange={(e) => setFilterText(e.target.value)}
        className="block rounded-md border border-[#525252] bg-charleston px-3 py-2 shadow-sm focus:border-primary focus:outline-none focus:ring-primary sm:text-sm"
      />
      <div className="mt-2 sm:mt-0">
        <button onClick={handleExportCSV} className="bg-primary p-2 rounded-md text-sm">
          Export to CSV file
        </button>
      </div>
    </div>
  );

  return (
    <div className="px-4 sm:px-6 lg:px-8 relative">
      <div className="flex flex-col space-y-4">
        <div className="text-gray-100 hover:cursor-pointer mb-4">
          <a onClick={() => router.back()} className="flex items-center gap-2 hover:opacity-80 font-bold">
            <div className="h-5 w-5 flex items-center justify-center">
              <ArrowLeftIcon />
            </div>
            Back
          </a>
        </div>

        <div>
          <h1 className="text-base font-semibold leading-6 text-light text-xl">
            {event?.title || "Feedback Responses"}
          </h1>
          <p className="mt-2 text-sm text-light">
            A list of attendee feedback responses for this event.
          </p>
        </div>
      </div>

      <div className="mt-8">
        <DataTable
          columns={columns}
          data={filteredData}
          progressPending={loading}
          pagination
          subHeader
          subHeaderComponent={subHeaderComponent}
          highlightOnHover
          persistTableHead
          customStyles={{
            header: { style: { backgroundColor: "rgb(36, 36, 36)", color: "rgb(255, 255, 255)" } },
            subHeader: { style: { backgroundColor: "transparent", color: "rgb(255, 255, 255)", padding: 0, marginBottom: 10 } },
            rows: { style: { minHeight: "6vh", backgroundColor: "rgb(33, 33, 33)", color: "rgb(255, 255, 255)" } },
            headCells: { style: { backgroundColor: "rgb(36, 36, 36)", color: "rgb(255, 255, 255)", fontWeight: 600 } },
            cells: { style: { backgroundColor: "rgb(33, 33, 33)", color: "rgb(255, 255, 255)" } },
            pagination: { style: { backgroundColor: "rgb(33, 33, 33)", color: "rgb(255, 255, 255)" } },
          }}
        />
      </div>

      {isDrawerOpen && <div className="fixed inset-0 bg-black/40 z-40" onClick={closeDrawer} />}

      <div
        className={`fixed top-0 right-0 h-full w-full sm:w-[520px] bg-[#161616] border-l border-[#2f2f2f] z-50 transform transition-transform duration-300 ${
          isDrawerOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="flex items-center justify-between p-4 border-b border-[#2f2f2f]">
          <h2 className="text-white font-semibold text-lg">Feedback Details</h2>
          <button onClick={closeDrawer} className="p-2 rounded-md hover:bg-white/10 text-white">
            <XMarkIcon className="h-5 w-5" />
          </button>
        </div>

        <div className="p-4 overflow-y-auto h-[calc(100%-65px)] text-white space-y-4">
          {!selectedResponse ? (
            <p className="text-sm text-gray-300">No response selected.</p>
          ) : (
            <>
              <div className="bg-charleston rounded-md p-3 text-sm space-y-1">
                <p><span className="text-gray-400">Attendee ID:</span> {selectedResponse.attendee_id}</p>
                <p>
                  <span className="text-gray-400">Submitted:</span>{" "}
                  {selectedResponse.submitted_at
                    ? new Date(selectedResponse.submitted_at).toLocaleString()
                    : "N/A"}
                </p>
                <p><span className="text-gray-400">Likert Average:</span> {getLikertAverage(selectedResponse)}</p>
                <p><span className="text-gray-400">Certificate Preference:</span> {selectedResponse.certificate_preference || "none"}</p>
                <p><span className="text-gray-400">Certificate Issued:</span> {selectedResponse.certificate_issued ? "Yes" : "No"}</p>
              </div>

              {drawerItems.length === 0 ? (
                <p className="text-sm text-gray-300">No form questions found.</p>
              ) : (
                drawerItems.map((item, idx) => {
                  const q = item.question;
                  const qType = (q.question_type || "").toLowerCase();
                  const ans = item.answer ?? "";

                  return (
                    <div key={`${q.id}-${idx}`} className="bg-charleston rounded-md p-3">
                      <label className="text-sm font-semibold text-white block mb-2">
                        {q.question_text}
                      </label>

                      {(qType === "text" || qType === "short_answer" || qType === "input") && (
                        <input
                          type="text"
                          value={ans || "—"}
                          readOnly
                          className="w-full rounded-md border border-[#525252] bg-[#232323] px-3 py-2 text-sm text-gray-200"
                        />
                      )}

                      {qType === "choice" && (
                        <div className="space-y-2">
                          {q.metadata?.choices?.length ? (
                            q.metadata.choices.map((choice, cIdx) => (
                              <label key={cIdx} className="flex items-center gap-2 text-sm text-gray-200">
                                <input type="radio" checked={ans === choice} readOnly disabled />
                                <span>{choice}</span>
                              </label>
                            ))
                          ) : (
                            <input
                              type="text"
                              value={ans || "—"}
                              readOnly
                              className="w-full rounded-md border border-[#525252] bg-[#232323] px-3 py-2 text-sm text-gray-200"
                            />
                          )}
                        </div>
                      )}

                      {qType === "likert" && renderLikertView(ans, q.metadata?.category)}
                    </div>
                  );
                })
              )}

              <div className="bg-charleston rounded-md p-3">
                <label className="text-sm font-semibold text-white block mb-2">Comment</label>
                <textarea
                  value={selectedResponse.comment || ""}
                  readOnly
                  className="w-full min-h-[110px] rounded-md border border-[#525252] bg-[#232323] px-3 py-2 text-sm text-gray-200"
                />
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}