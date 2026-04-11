import { useState, useEffect } from "react";
import { fetchIndividualFeedbackResponses } from "@/lib/feedback_responses";
import { format } from "date-fns";

export default function IndividualFeedbackView({ id }: { id: string }) {
  const [responses, setResponses] = useState<any[]>([]);
  const [selectedResponse, setSelectedResponse] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadResponses = async () => {
      setLoading(true);
      const data = await fetchIndividualFeedbackResponses(id);
      if (data) setResponses(data);
      setLoading(false);
    };

    if (id) loadResponses();
  }, [id]);

  if (loading) return <p className="text-white">Loading individual responses...</p>;

  if (responses.length === 0) {
    return <p className="text-gray-400">No individual feedback has been submitted yet.</p>;
  }

  return (
    <div className="flex gap-4 w-full h-[600px] text-white">
      {/* Left Sidebar: List of respondents */}
      <div className="w-1/3 bg-[#1C1C1C] border border-[#333] rounded-lg overflow-y-auto">
        <h3 className="p-4 border-b border-[#333] font-bold text-lg sticky top-0 bg-[#1C1C1C]">
          Respondents ({responses.length})
        </h3>
        <ul className="divide-y divide-[#333]">
          {responses.map((response) => (
            <li 
              key={response.id}
              onClick={() => setSelectedResponse(response)}
              className={`p-4 cursor-pointer hover:bg-[#282828] transition-colors ${
                selectedResponse?.id === response.id ? "bg-[#282828] border-l-4 border-primary" : ""
              }`}
            >
              <p className="font-semibold">
                {response.attendee?.first_name} {response.attendee?.last_name}
              </p>
              <p className="text-xs text-gray-400 truncate">{response.attendee?.email}</p>
              <p className="text-xs text-gray-500 mt-1">
                {format(new Date(response.submitted_at), "MMM d, yyyy h:mm a")}
              </p>
            </li>
          ))}
        </ul>
      </div>

      {/* Right Sidebar: Detailed View */}
      <div className="w-2/3 bg-[#1C1C1C] border border-[#333] rounded-lg p-6 overflow-y-auto">
        {selectedResponse ? (
          <div>
            <h2 className="text-xl font-bold mb-1">
              Feedback from {selectedResponse.attendee?.first_name}
            </h2>
            <p className="text-sm text-gray-400 mb-6">
              Submitted on {format(new Date(selectedResponse.submitted_at), "MMMM d, yyyy 'at' h:mm a")}
            </p>

            <div className="space-y-6">
              {/* Iterating through form answers */}
              {selectedResponse.form_answers.map((ans: any, idx: number) => (
                <div key={idx} className="bg-[#282828] p-4 rounded border border-[#444]">
                  <p className="font-medium mb-2">{ans.question.question_text}</p>
                  <p className="text-gray-300">
                    <span className="text-primary mr-2">↳</span>
                    {ans.answer}
                  </p>
                </div>
              ))}

              {/* General Comments */}
              {selectedResponse.comment && (
                <div className="bg-[#282828] p-4 rounded border border-[#444]">
                  <p className="font-medium mb-2">Additional Comments/Suggestions</p>
                  <p className="text-gray-300 italic">"{selectedResponse.comment}"</p>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-center h-full text-gray-500">
            Select a respondent from the list to view their answers.
          </div>
        )}
      </div>
    </div>
  );
}