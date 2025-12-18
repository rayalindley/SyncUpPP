export interface Question {
  id: number;
  question_text: string;
  question_type: 'Choice' | 'Likert' | 'Choice';
  category_id?: number | null;
  likert_category?: string | null;
}