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
  /** Graph / heuristic audit fields */
  reason?: string;
  source?: string;
  cause_explanation?: string;
  causal_impact?: {
    affected_services?: string[];
    risk_factors?: string[];
  };
};

export type GraphContextPayload = {
  root_cause?: string;
  affected_services?: string[];
  risk_factors?: string[];
  causal_insights?: Array<{ service?: string; statement?: string; severity?: string }>;
  graph_summary?: { node_count?: number; edge_count?: number };
  graph_node_sample?: string[];
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

export type SimulationResult = {
  scenario: {
    id: string;
    name: string;
    type: string;
    target: string;
    value?: number;
    confidence_weight?: number;
  };
  predicted_savings: number;
  confidence: number;
  score: number;
  selected?: boolean;
  mutated_twin_baseline_cost?: number;
  original_baseline_cost?: number;
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
  simulation_results?: SimulationResult[];
  context_memory: any;
  graph_context?: GraphContextPayload;
  graph_alerts?: Array<Record<string, unknown>>;
  knowledge_graph?: Record<string, unknown>;

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

