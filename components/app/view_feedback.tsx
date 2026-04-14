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
  Agreement: ["Strongly Disagree", "Disagree", "Neutral", "Agree", "Strongly Agree"],
  Satisfaction: ["Very Unsatisfied", "Unsatisfied", "Neutral", "Satisfied", "Very Satisfied"],
  Frequency: ["Never", "Rarely", "Sometimes", "Often", "Always"],
  Importance: ["Not Important", "Slightly Important", "Neutral", "Very Important", "Extremely Important"],
  Effectiveness: ["Not Effective", "Slightly Effective", "Neutral", "Very Effective", "Extremely Effective"],
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
  const [formQuestions, setFormQuestions] = useState<QuestionObj[]>([]);
  const [rows, setRows] = useState<FeedbackRow[]>([]);
  const [loading, setLoading] = useState(true);

  const [filterText, setFilterText] = useState<string>("");
  const [debouncedFilterText] = useDebounce(filterText, 300);

  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [selectedResponse, setSelectedResponse] = useState<FeedbackRow | null>(null);

  useEffect(() => {
    const loadFeedback = async () => {
      setLoading(true);

      // 1) Get event
      const { data: eventData, error: eventError } = await supabase
        .from("events")
        .select("id, title, organizationid")
        .eq("eventslug", eventSlug)
        .or("is_deleted.eq.false,is_deleted.is.null")
	      .maybeSingle();

      if (eventError || !eventData) {
        console.error("Error fetching event:", eventError);
        setEvent(null);
        setRows([]);
        setFormQuestions([]);
        setLoading(false);
        return;
      }

      setEvent(eventData);

      // 2) Sync org to sidebar state (localStorage keys)
      if (eventData.organizationid) {
        const { data: org, error: orgError } = await supabase
          .from("organizations")
          .select("organizationid, name, slug")
          .eq("organizationid", eventData.organizationid)
          .maybeSingle();

        if (!orgError && org) {
          localStorage.setItem("selectedOrgId", org.organizationid);
          localStorage.setItem("selectedOrgName", org.name ?? "");
          localStorage.setItem("selectedOrgSlug", org.slug ?? "");

          // broadcast so sidebar can react
          window.dispatchEvent(new Event("org-changed"));
        } else {
          // fallback if org table query fails
          localStorage.setItem("selectedOrgId", eventData.organizationid);
          window.dispatchEvent(new Event("org-changed"));
        }
      }

      // 3) Resolve form ID
      let resolvedFormId: string | null = null;

      const { data: formByEvent } = await supabase
        .from("forms")
        .select("id")
        .eq("event_id", eventData.id)
        .maybeSingle();

      if (formByEvent?.id) {
        resolvedFormId = formByEvent.id;
      } else {
        const { data: formBySlug } = await supabase
          .from("forms")
          .select("id")
          .eq("slug", eventSlug)
          .maybeSingle();

        resolvedFormId = formBySlug?.id ?? null;
      }

      if (!resolvedFormId) {
        setRows([]);
        setFormQuestions([]);
        setLoading(false);
        return;
      }

      // 4) Fetch all form questions
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
            if (!q?.id) return null;
            return { ...q, question_order: fq.question_order ?? 0 } as QuestionObj;
          })
          .filter(Boolean) as QuestionObj[];

        setFormQuestions(normalizedQuestions);
      }

      // 5) Fetch responses + answers
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
        console.error("Error fetching responses:", responsesError);
        setRows([]);
      } else {
        const normalized: FeedbackRow[] = (responses || [])
          .map((r: any) => ({
            id: r?.id ?? "",
            attendee_id: r?.attendee_id ?? "",
            comment: r?.comment ?? null,
            submitted_at: r?.submitted_at ?? null,
            certificate_preference: r?.certificate_preference ?? null,
            certificate_issued: r?.certificate_issued ?? null,
            form_answers: (r?.form_answers || []).map((fa: any) => ({
              answer: fa?.answer ?? "",
              question: Array.isArray(fa?.question)
                ? fa.question[0] ?? null
                : fa?.question ?? null,
            })),
          }))
          .filter((r) => Boolean(r.id && (r.attendee_id || r.comment || r.submitted_at)));

        setRows(normalized);
      }

      setLoading(false);
    };

    loadFeedback();
  }, [eventSlug]);

  const getLikertAverage = (row: FeedbackRow): string => {
    const likertAnswers = (row.form_answers || [])
      .filter((fa) => (fa.question?.question_type || "").toLowerCase() === "likert")
      .map((fa) => {
        const n = Number(fa.answer);
        if (Number.isNaN(n)) return null;
        return n >= 0 && n <= 4 ? n + 1 : n >= 1 && n <= 5 ? n : null;
      })
      .filter((n): n is number => n !== null);

    if (!likertAnswers.length) return "—";
    return `${(likertAnswers.reduce((a, b) => a + b, 0) / likertAnswers.length).toFixed(1)}/5`;
  };

  const filteredData = useMemo(() => {
    if (!debouncedFilterText) return rows;
    const q = debouncedFilterText.toLowerCase();

    return rows.filter((r) => {
      const answersText = (r.form_answers || [])
        .map((a) => `${a.question?.question_text || ""} ${a.answer || ""}`)
        .join(" ")
        .toLowerCase();

      return (
        (r.attendee_id || "").toLowerCase().includes(q) ||
        (r.comment || "").toLowerCase().includes(q) ||
        (r.submitted_at || "").toLowerCase().includes(q) ||
        answersText.includes(q) ||
        getLikertAverage(r).toLowerCase().includes(q)
      );
    });
  }, [rows, debouncedFilterText]);

  const openDrawer = (row: FeedbackRow) => {
    setSelectedResponse(row);
    setIsDrawerOpen(true);
  };

  const closeDrawer = () => {
    setIsDrawerOpen(false);
    setSelectedResponse(null);
  };

  const drawerItems: DrawerQuestionItem[] = useMemo(() => {
    if (!selectedResponse) return [];
    const answerMap = new Map<string, string>();

    (selectedResponse.form_answers || []).forEach((fa) => {
      if (fa.question?.id) answerMap.set(fa.question.id, fa.answer ?? "");
    });

    return [...formQuestions]
      .sort((a, b) => (a.question_order ?? 0) - (b.question_order ?? 0))
      .map((q) => ({ question: q, answer: answerMap.get(q.id) ?? "" }));
  }, [selectedResponse, formQuestions]);

  const handleExportCSV = () => {
    const headers = ["Submitted At", "Attendee ID", "Comment", "Likert Avg"];
    const csvRows = filteredData.map((r) => [
      r.submitted_at ?? "",
      r.attendee_id ?? "",
      (r.comment ?? "").replace(/"/g, '""'),
      getLikertAverage(r),
    ]);

    const csv = [headers, ...csvRows]
      .map((row) => row.map((c) => `"${c}"`).join(","))
      .join("\n");

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${event?.title || "event"}-feedback.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const renderLikertView = (answer: string, category?: string) => {
    const labels = category ? likertLabelsMap[category] : null;
    if (!labels?.length) return <p className="text-sm text-gray-300">{answer || "—"}</p>;

    const raw = Number(answer);
    const selectedIndex = Number.isNaN(raw) ? -1 : raw > 4 ? raw - 1 : raw;

    return (
      <div className="flex flex-wrap gap-2 mt-2">
        {labels.map((label, idx) => (
          <div
            key={idx}
            className={`px-3 py-1 rounded-full text-xs border ${
              idx === selectedIndex
                ? "bg-[#379A7B]/30 border-[#379A7B] text-white"
                : "bg-transparent border-gray-600 text-gray-400"
            }`}
          >
            {label}
          </div>
        ))}
      </div>
    );
  };

  const columns = [
    {
      name: "Submitted At",
      selector: (r: FeedbackRow) => r.submitted_at || "",
      sortable: true,
      cell: (r: FeedbackRow) =>
        r.submitted_at
          ? new Date(r.submitted_at).toLocaleString("en-US", {
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
      selector: (r: FeedbackRow) => r.attendee_id || "",
      sortable: true,
      wrap: true,
    },
    {
      name: "Comment",
      selector: (r: FeedbackRow) => r.comment || "",
      sortable: true,
      grow: 2,
      wrap: true,
      cell: (r: FeedbackRow) => r.comment || "—",
    },
    {
      name: "Likert Avg",
      selector: (r: FeedbackRow) => getLikertAverage(r),
      sortable: true,
      cell: (r: FeedbackRow) => <span className="font-semibold">{getLikertAverage(r)}</span>,
    },
    {
      name: "Actions",
      cell: (r: FeedbackRow) => (
        <button
          onClick={() => openDrawer(r)}
          className="px-3 py-1.5 rounded-md bg-primary text-white text-xs"
        >
          View
        </button>
      ),
      ignoreRowClick: true,
      button: true,
    },
  ];

  return (
    <div className="px-4 sm:px-6 lg:px-8 relative">
      <div className="flex flex-col space-y-4">
        <a onClick={() => router.back()} className="flex items-center gap-2 hover:opacity-80 font-bold text-gray-100">
          <div className="h-5 w-5 flex items-center justify-center">
            <ArrowLeftIcon />
          </div>
          Back
        </a>

        <div>
          <h1 className="text-xl font-semibold text-light">{event?.title || "Feedback Responses"}</h1>
          <p className="mt-2 text-sm text-light">A list of attendee feedback responses for this event.</p>
        </div>

        <div className="flex items-center justify-between gap-2">
          <input
            type="text"
            placeholder="Search..."
            value={filterText}
            onChange={(e) => setFilterText(e.target.value)}
            className="rounded-md border border-[#525252] bg-charleston px-3 py-2 text-white"
          />
          <button onClick={handleExportCSV} className="bg-primary p-2 rounded-md text-sm text-white">
            Export to CSV file
          </button>
        </div>
      </div>

      <div className="mt-8">
        <DataTable
          columns={columns}
          data={filteredData}
          progressPending={loading}
          pagination
          noDataComponent={<div className="py-4 text-sm text-gray-400">No feedback responses found.</div>}
          customStyles={{
            header: {
              style: {
                backgroundColor: "rgb(36, 36, 36)",
                color: "rgb(255, 255, 255)",
              },
            },
            subHeader: {
              style: {
                backgroundColor: "transparent",
                color: "rgb(255, 255, 255)",
              },
            },
            rows: {
              style: {
                minHeight: "52px",
                backgroundColor: "rgb(33, 33, 33)",
                color: "rgb(255, 255, 255)",
                borderBottom: "1px solid rgb(58, 58, 58)",
              },
            },
            headRow: {
              style: {
                backgroundColor: "rgb(36, 36, 36)",
                borderBottom: "1px solid rgb(70, 70, 70)",
              },
            },
            headCells: {
              style: {
                backgroundColor: "rgb(36, 36, 36)",
                color: "rgb(255, 255, 255)",
                fontWeight: 600,
              },
            },
            cells: {
              style: {
                backgroundColor: "rgb(33, 33, 33)",
                color: "rgb(255, 255, 255)",
              },
            },
            pagination: {
              style: {
                backgroundColor: "rgb(33, 33, 33)",
                color: "rgb(255, 255, 255)",
                borderTop: "1px solid rgb(58, 58, 58)",
              },
            },
          }}
        />
      </div>

      {isDrawerOpen && <div className="fixed inset-0 bg-black/40 z-40" onClick={closeDrawer} />}

      <div className={`fixed top-0 right-0 h-full w-full sm:w-[520px] bg-[#161616] z-50 transform transition-transform ${isDrawerOpen ? "translate-x-0" : "translate-x-full"}`}>
        <div className="flex items-center justify-between p-4 border-b border-[#2f2f2f]">
          <h2 className="text-white font-semibold text-lg">Feedback Details</h2>
          <button onClick={closeDrawer} className="p-2 rounded-md hover:bg-white/10 text-white">
            <XMarkIcon className="h-5 w-5" />
          </button>
        </div>

        <div className="p-4 overflow-y-auto h-[calc(100%-65px)] text-white space-y-4">
          {selectedResponse && (
            <div className="bg-charleston rounded-md p-3 text-sm space-y-1">
              <p><span className="text-gray-400">Attendee ID:</span> {selectedResponse.attendee_id}</p>
              <p><span className="text-gray-400">Likert Average:</span> {getLikertAverage(selectedResponse)}</p>
              <p><span className="text-gray-400">Certificate Preference:</span> {selectedResponse.certificate_preference || "none"}</p>
              <p><span className="text-gray-400">Certificate Issued:</span> {selectedResponse.certificate_issued ? "Yes" : "No"}</p>
            </div>
          )}

          {drawerItems.map((item, idx) => {
            const q = item.question;
            const type = (q.question_type || "").toLowerCase();
            const ans = item.answer || "";

            return (
              <div key={`${q.id}-${idx}`} className="bg-charleston rounded-md p-3">
                <label className="text-sm font-semibold block mb-2">{q.question_text}</label>

                {(type === "text" || type === "short_answer" || type === "input") && (
                  <input
                    type="text"
                    value={ans || "—"}
                    readOnly
                    className="w-full rounded-md border border-[#525252] bg-[#232323] px-3 py-2 text-sm text-gray-200"
                  />
                )}

                {type === "choice" && (
                  <div className="space-y-2">
                    {q.metadata?.choices?.length ? (
                      q.metadata.choices.map((choice, i) => (
                        <label key={i} className="flex items-center gap-2 text-sm text-gray-200">
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

                {type === "likert" && renderLikertView(ans, q.metadata?.category)}
              </div>
            );
          })}

          {selectedResponse && (
            <div className="bg-charleston rounded-md p-3">
              <label className="text-sm font-semibold block mb-2">Comment</label>
              <textarea
                value={selectedResponse.comment || ""}
                readOnly
                className="w-full min-h-[110px] rounded-md border border-[#525252] bg-[#232323] px-3 py-2 text-sm text-gray-200"
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}