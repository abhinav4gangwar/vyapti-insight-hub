import { authService } from './auth';
import type {
  PromptTriggersResponse,
  PromptTriggerDetail,
  FilterOptions,
  PromptTriggersStats,
  PromptTriggersParams,
  FilterParams,
  PromptTriggerQuestion,
  PromptTriggerQuestionHistory,
  GroupInfo,
  GroupWithQuestions,
  CreateQuestionParams,
  UpdateQuestionParams,
  RenameGroupParams,
  RenameGroupResponse,
  DeleteGroupResponse,
  MoveQuestionParams,
  RestoreQuestionParams,
  ToggleActiveParams,
  SourceShorthand,
} from '@/types/prompt-triggers';

/**
 * Fetch paginated list of prompt triggers with optional filters
 */
export async function getPromptTriggers(
  params: PromptTriggersParams = {},
  signal?: AbortSignal
): Promise<PromptTriggersResponse> {
  const client = authService.createAuthenticatedClient();
  const searchParams = new URLSearchParams();

  if (params.page) searchParams.append('page', params.page.toString());
  if (params.page_size) searchParams.append('page_size', params.page_size.toString());
  if (params.date_range_start) searchParams.append('date_range_start', params.date_range_start);
  if (params.date_range_end) searchParams.append('date_range_end', params.date_range_end);
  if (params.companies) searchParams.append('companies', params.companies);
  if (params.buckets) searchParams.append('buckets', params.buckets);
  if (params.questions) searchParams.append('questions', params.questions);
  if (params.sort_by) searchParams.append('sort_by', params.sort_by);
  if (params.sort_order) searchParams.append('sort_order', params.sort_order);
  if (params.include_filter_options) searchParams.append('include_filter_options', 'true');

  const response = await client.get(`/prompt-triggers?${searchParams.toString()}`, { signal });
  return response.data;
}

/**
 * Fetch filter options for prompt triggers
 */
export async function getPromptTriggerFilters(
  params: FilterParams = {}
): Promise<FilterOptions> {
  const client = authService.createAuthenticatedClient();
  const searchParams = new URLSearchParams();

  if (params.date_range_start) searchParams.append('date_range_start', params.date_range_start);
  if (params.date_range_end) searchParams.append('date_range_end', params.date_range_end);

  const queryString = searchParams.toString();
  const url = queryString ? `/prompt-triggers/filters?${queryString}` : '/prompt-triggers/filters';
  const response = await client.get(url);
  return response.data;
}

/**
 * Fetch prompt triggers statistics
 */
export async function getPromptTriggerStats(): Promise<PromptTriggersStats> {
  const client = authService.createAuthenticatedClient();
  const response = await client.get('/prompt-triggers/stats');
  return response.data;
}

/**
 * Fetch detailed information for a single prompt trigger
 */
export async function getPromptTriggerDetail(
  triggerId: number
): Promise<PromptTriggerDetail> {
  const client = authService.createAuthenticatedClient();
  const response = await client.get(`/prompt-triggers/${triggerId}`);
  return response.data;
}

// ============================================
// Question & Bucket Management API
// ============================================

const QUESTIONS_BASE_URL = '/prompt-trigger-questions';

/**
 * List all questions with optional filters
 */
export async function getQuestions(params?: {
  source_shorthand?: SourceShorthand;
  group_name?: string;
}): Promise<PromptTriggerQuestion[]> {
  const client = authService.createAuthenticatedClient();
  const searchParams = new URLSearchParams();

  if (params?.source_shorthand) searchParams.append('source_shorthand', params.source_shorthand);
  if (params?.group_name) searchParams.append('group_name', params.group_name);

  const queryString = searchParams.toString();
  const url = queryString
    ? `${QUESTIONS_BASE_URL}/questions?${queryString}`
    : `${QUESTIONS_BASE_URL}/questions`;
  const response = await client.get(url);
  return response.data;
}

/**
 * Get a single question by ID
 */
export async function getQuestion(questionId: number): Promise<PromptTriggerQuestion> {
  const client = authService.createAuthenticatedClient();
  const response = await client.get(`${QUESTIONS_BASE_URL}/questions/${questionId}`);
  return response.data;
}

/**
 * Create a new question
 */
export async function createQuestion(
  params: CreateQuestionParams
): Promise<PromptTriggerQuestion> {
  const client = authService.createAuthenticatedClient();
  const response = await client.post(`${QUESTIONS_BASE_URL}/questions`, params);
  return response.data;
}

/**
 * Update an existing question
 */
export async function updateQuestion(
  questionId: number,
  params: UpdateQuestionParams
): Promise<PromptTriggerQuestion> {
  const client = authService.createAuthenticatedClient();
  const response = await client.put(`${QUESTIONS_BASE_URL}/questions/${questionId}`, params);
  return response.data;
}

/**
 * Delete a question
 */
export async function deleteQuestion(questionId: number): Promise<void> {
  const client = authService.createAuthenticatedClient();
  await client.delete(`${QUESTIONS_BASE_URL}/questions/${questionId}`);
}

/**
 * Move a question to a different group
 */
export async function moveQuestion(
  questionId: number,
  params: MoveQuestionParams
): Promise<PromptTriggerQuestion> {
  const client = authService.createAuthenticatedClient();
  const response = await client.post(`${QUESTIONS_BASE_URL}/questions/${questionId}/move`, params);
  return response.data;
}

/**
 * List all groups
 */
export async function getGroups(params?: {
  source_shorthand?: SourceShorthand;
}): Promise<GroupInfo[]> {
  const client = authService.createAuthenticatedClient();
  const searchParams = new URLSearchParams();

  if (params?.source_shorthand) searchParams.append('source_shorthand', params.source_shorthand);

  const queryString = searchParams.toString();
  const url = queryString
    ? `${QUESTIONS_BASE_URL}/groups?${queryString}`
    : `${QUESTIONS_BASE_URL}/groups`;
  const response = await client.get(url);
  return response.data;
}

/**
 * List all groups with nested questions
 */
export async function getGroupsWithQuestions(): Promise<GroupWithQuestions[]> {
  const client = authService.createAuthenticatedClient();
  const response = await client.get(`${QUESTIONS_BASE_URL}/groups-with-questions`);
  return response.data;
}

/**
 * Get questions in a specific group
 */
export async function getQuestionsInGroup(
  groupName: string
): Promise<PromptTriggerQuestion[]> {
  const client = authService.createAuthenticatedClient();
  const response = await client.get(
    `${QUESTIONS_BASE_URL}/groups/${encodeURIComponent(groupName)}/questions`
  );
  return response.data;
}

/**
 * Create a new group (by adding the first question to it)
 */
export async function createGroup(
  params: CreateQuestionParams
): Promise<PromptTriggerQuestion> {
  const client = authService.createAuthenticatedClient();
  const response = await client.post(`${QUESTIONS_BASE_URL}/groups`, params);
  return response.data;
}

/**
 * Rename a group
 */
export async function renameGroup(
  params: RenameGroupParams
): Promise<RenameGroupResponse> {
  const client = authService.createAuthenticatedClient();
  const response = await client.post(`${QUESTIONS_BASE_URL}/groups/rename`, params);
  return response.data;
}

/**
 * Delete a group
 */
export async function deleteGroup(
  groupName: string,
  deleteQuestions: boolean = false
): Promise<DeleteGroupResponse> {
  const client = authService.createAuthenticatedClient();
  const response = await client.delete(
    `${QUESTIONS_BASE_URL}/groups/${encodeURIComponent(groupName)}?delete_questions=${deleteQuestions}`
  );
  return response.data;
}

// ============================================
// NEW: History Management API
// ============================================

/**
 * Get question history
 */
export async function getQuestionHistory(
  questionId: number
): Promise<PromptTriggerQuestionHistory[]> {
  const client = authService.createAuthenticatedClient();
  const response = await client.get(`${QUESTIONS_BASE_URL}/questions/${questionId}/history`);
  return response.data;
}

/**
 * Restore a question to a previous version
 */
export async function restoreQuestionVersion(
  questionId: number,
  params: RestoreQuestionParams
): Promise<PromptTriggerQuestion> {
  const client = authService.createAuthenticatedClient();
  const response = await client.post(
    `${QUESTIONS_BASE_URL}/questions/${questionId}/restore`,
    params
  );
  return response.data;
}

/**
 * Toggle question active status
 */
export async function toggleQuestionActiveStatus(
  questionId: number,
  params: ToggleActiveParams
): Promise<PromptTriggerQuestion> {
  const client = authService.createAuthenticatedClient();
  const response = await client.post(
    `${QUESTIONS_BASE_URL}/questions/${questionId}/toggle-active`,
    params
  );
  return response.data;
}
