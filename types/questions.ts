export interface QuestionMetadata {
  // For Choice questions
  choices?: string[];
  // For Likert questions
  category?: string;
}

export interface Question {
  id: string;
  question_text: string;
  question_type: 'Choice' | 'Likert' | 'Text' | 'Comment';
  metadata: QuestionMetadata;
}