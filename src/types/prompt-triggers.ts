// TypeScript interfaces for Prompt Triggers API

export interface TriggerQuestion {
  qid: number;
  question_text: string;
  bucket: string;
}

export interface BucketInfo {
  name: string;
  id: number;
  questions: TriggerQuestion[];
}

export interface BucketCounts {
  [key: string]: number;
}

export interface PromptTrigger {
  id: number;
  earning_call_id: number;
  company_isin: string;
  company_name: string;
  earning_call_date: string;
  earning_call_url: string;
  document_type: string;
  bucket_counts: BucketCounts;
  total_triggers: number;
  created_at: string;
}

export interface UsageInfo {
  model: string;
  model_key: string;
  rates_per_1m: {
    input: number;
    cached_input: number;
    output: number;
  };
  cost: string;
  cost_float: number;
  input_cost: number;
  cached_input_cost: number;
  output_cost: number;
  prompt_tokens: number;
  cached_tokens: number;
  non_cached_prompt_tokens: number;
  completion_tokens: number;
  total_tokens: number;
  reasoning_tokens: number;
  cache_write_input_tokens: number;
  cache_read_input_tokens: number;
  note?: string;
}

export interface TriggerDetail {
  qid: number;
  bucket: string;
  question_text: string;
  answer: string;
  quote: string | null;
  confidence: number;
  reasoning?: string;
  processing_time_seconds?: number;
  was_verified?: boolean;
  verifier_model?: string | null;
  initial_answer?: string | null;
  verification_reasoning?: string | null;
  usage?: UsageInfo;
  verification_usage?: UsageInfo | null;
  total_cost?: number;
  error?: string | null;
}

export interface PromptTriggerDetail {
  id: number;
  earning_call_id: number;
  company_isin: string;
  company_name: string;
  earning_call_date: string;
  earning_call_url: string;
  document_type: string;
  bucket_counts: BucketCounts;
  total_triggers: number;
  triggers: TriggerDetail[];
  full_response?: unknown;
  created_at: string;
  modified_at: string;
  text_length?: number;
}

export interface PaginationInfo {
  current_page: number;
  page_size: number;
  total_count: number;
  total_pages: number;
  showing_from: number;
  showing_to: number;
  has_next: boolean;
  has_prev: boolean;
}

export interface FilterOptions {
  companies: string[];
  buckets: BucketInfo[];
  questions: TriggerQuestion[];
  date_range: {
    start: string;
    end: string;
  };
}

export interface PromptTriggersResponse {
  data: PromptTrigger[];
  pagination: PaginationInfo;
  filter_options?: FilterOptions;
}

export interface PromptTriggersStats {
  total_documents: number;
  unique_companies: number;
  date_range: {
    start: string;
    end: string;
  };
}

export interface PromptTriggersParams {
  page?: number;
  page_size?: number;
  date_range_start?: string;
  date_range_end?: string;
  companies?: string;
  buckets?: string;
  questions?: string;
  sort_by?: 'earning_call_date' | 'company_name';
  sort_order?: 'asc' | 'desc';
  include_filter_options?: boolean;
}

export interface FilterParams {
  date_range_start?: string;
  date_range_end?: string;
}

// Question & Bucket Management Types

export type SourceShorthand = 'A' | 'K' | 'E';

export interface PromptTriggerQuestion {
  id: number;
  question_text: string;
  group_name: string;
  source_shorthand: SourceShorthand;
  version: number;
  is_active: boolean;
  created_at: string;
  created_by: string | null;
  updated_at: string;
  updated_by: string | null;
}

export interface GroupInfo {
  name: string;
  question_count: number;
}

export interface GroupWithQuestions {
  name: string;
  question_count: number;
  questions: Array<{
    id: number;
    question_text: string;
    source_shorthand: SourceShorthand;
  }>;
}

export interface CreateQuestionParams {
  question_text: string;
  group_name: string;
  source_shorthand: SourceShorthand;
}

export interface UpdateQuestionParams {
  question_text?: string;
  group_name?: string;
  source_shorthand?: SourceShorthand;
  reason?: string;
}

export interface RenameGroupParams {
  old_name: string;
  new_name: string;
}

export interface RenameGroupResponse {
  success: boolean;
  message: string;
  questions_updated: number;
}

export interface DeleteGroupResponse {
  success: boolean;
  message: string;
  deleted_count: number;
}

export interface MoveQuestionParams {
  new_group_name: string;
}

// History Tracking Types

export interface PromptTriggerQuestionHistory {
  id: number;
  question_id: number;
  question_text: string;
  group_name: string;
  source_shorthand: SourceShorthand;
  version: number;
  created_at: string;
  created_by: string | null;
  replaced_at: string;
  replaced_by: string | null;
  reason: string | null;
}

export interface RestoreQuestionParams {
  history_id: number;
  reason?: string;
}

export interface ToggleActiveParams {
  is_active: boolean;
  reason?: string;
}
