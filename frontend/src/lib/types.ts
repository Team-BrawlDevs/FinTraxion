export type RiskLevel = "low" | "medium" | "high";

export type WorkflowNode =
  | "discovery"
  | "normalization"
  | "enrichment"
  | "duplicate_detection"
  | "decision"
  | "human_approval"
  | "execution"
  | "recovery"
  | "memory_update"
  | string;

export type AgentEvent = {
  ts?: string;
  run_id?: string;
  node?: WorkflowNode | string;
  event: string;
  message?: string;
  error?: string;
  traceback?: string;
  output_keys?: string[];
  [k: string]: any;
};

export type DuplicateCandidate = {
  type: string;
  service_a?: string;
  service_b?: string;
  category?: string;
  similarity?: number;
  monthly_cost_a?: number;
  monthly_cost_b?: number;
  recommendation?: string;
};

export type Recommendation = {
  action: string;
  action_type: string;
  target: Record<string, any>;
  params: Record<string, any>;
  confidence: number;
  risk: RiskLevel;
  savings: number;
  justification: string;
  status: string;
  run_id: string;
};

export type ExecutionLog = {
  id: string;
  run_id: string;
  action: string;
  timestamp: string;
  status: string;
  details?: {
    savings?: number;
    action_key?: string;
    action_type?: string;
    recovered_on_attempt?: number;
    result?: any;
    error?: string;
  };
};

export type StatusPayload = {
  run_id: string;
  status: string;
  last_error: string | null;
  human_feedback: string | null;
  retry_count: number;
  errors: string[];
  recommendations: Recommendation[];
  duplicate_candidates: DuplicateCandidate[];
  execution_logs: ExecutionLog[];
  context_memory: any;

  // some runs may include extra keys; keep it flexible
  [k: string]: any;
};

export type MockServiceRow = {
  name: string;
  monthlyCost: number;
  activeUsers: number;
  usagePct: number;
  status: "Active" | "Underutilized";
};

