import type { extendedIncomeTypes } from "@/constants/finance/income";

// Base types for finance module
export interface BaseFinanceRecord {
  id: string;
  organization_id: string;
  branch_id: string;
  amount: number;
  description?: string;
  notes?: string;
  date: string;
  created_by: string;
  created_at: string;
  updated_at: string;
}

// Income types
export interface IncomeRecord extends BaseFinanceRecord {
  // High-level income category flags
  income_type: 'general_income' | 'contribution' | 'donation' | 'pledge_payment';
  category: ExtendedIncomeType;
  occasion_name?: string;
  // Source of income and related relations
  source?: string;
  source_type?: 'church' | 'member' | 'tag_item' | 'group' | 'other';
  member_id?: string;
  // Convenience denormalized display field when joined with members
  member_name?: string;
  // Unified display name for contributor/donator based on source_type
  contributor_name?: string;
  group_id?: string;
  tag_item_id?: string;
  attendance_occasion_id?: string;
  attendance_session_id?: string;
  payment_method: PaymentMethod;
  receipt_number?: string;
  // Contribution-specific fields (optional for general income)
  envelope_number?: string;
  tax_deductible?: boolean;
  receipt_issued?: boolean;
}

// Joined relation summaries for income responses
export interface IncomeMemberRelation {
  id: string;
  first_name: string;
  middle_name: string | null;
  last_name: string;
  profile_image_url: string | null;
}

export interface IncomeGroupRelation {
  id: string;
  name: string;
}

export interface IncomeTagItemRelation {
  id: string;
  name: string;
  color: string | null;
}

// Income response row including joined relations and derived contributor fields
export interface IncomeResponseRow extends IncomeRecord {
  member?: IncomeMemberRelation | null;
  group?: IncomeGroupRelation | null;
  tag_item?: IncomeTagItemRelation | null;
  // Derived display fields computed in hooks
  contributor_name?: string;
  contributor_avatar_url?: string;
  contributor_tag_color?: string;
}

export type IncomeType = 'general_income' | 'contribution' | 'donation' | 'pledge_payment';

// Expense types
export interface ExpenseRecord extends BaseFinanceRecord {
  category: ExpenseCategory;
  vendor?: string;
  receipt_number?: string;
  payment_method: PaymentMethod;
  approved_by?: string;
  approval_date?: string;
}

export type ExpenseCategory = 
  | 'utilities'
  | 'maintenance'
  | 'supplies'
  | 'equipment'
  | 'salaries'
  | 'benefits'
  | 'ministry_expenses'
  | 'outreach'
  | 'missions'
  | 'events'
  | 'transportation'
  | 'insurance'
  | 'professional_services'
  | 'other';

// Contribution types
export interface ContributionRecord extends BaseFinanceRecord {
  member_id: string;
  member_name: string;
  contribution_type: ContributionType;
  payment_method: PaymentMethod;
  envelope_number?: string;
  tax_deductible: boolean;
  receipt_issued: boolean;
  receipt_number?: string;
}

export type ContributionType = 
  | 'tithe'
  | 'offering'
  | 'special_offering'
  | 'building_fund'
  | 'missions'
  | 'pledge_payment'
  | 'donation'
  | 'other';

  export interface ContributionDonationFormData {
      // Source info
      source_type: 'member' | 'group' | 'tag_item' | 'other';
      source?: string; // when source_type === 'other'
      member_id?: string;
      group_id?: string;
      tag_item_id?: string;
      // Core fields
      amount: number;
      payment_method: PaymentMethod;
      date: string; // YYYY-MM-DD
      description?: string;
      notes?: string;
      envelope_number?: string;
      income_type: Extract<IncomeType, 'contribution' | 'donation'>;
      category: ExtendedIncomeType;
      attendance_occasion_id?: string;
      attendance_session_id?: string;
    }
// Pledge types
export interface PledgeRecord {
  id: string;
  organization_id: string;
  branch_id: string;
  // Source fields
  source_type?: 'church' | 'member' | 'tag_item' | 'group' | 'other';
  source?: string; // when source_type === 'other'
  member_id?: string;
  member_name?: string; // convenience display
  group_id?: string;
  group_name?: string; // convenience display
  tag_item_id?: string;
  tag_item_name?: string; // convenience display
  // Unified display name for pledge source
  contributor_name?: string;
  // Core fields
  pledge_amount: number;
  amount_paid: number;
  amount_remaining: number;
  pledge_type: string;
  campaign_name?: string;
  start_date: string;
  end_date: string;
  payment_frequency: string;
  status: PledgeStatus;
  description?: string;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface PledgePayment {
  id: string;
  pledge_id: string;
  amount: number;
  payment_date: string;
  payment_method: PaymentMethod;
  notes?: string;
  created_by: string;
  created_at: string;
}



export type PledgeStatus = 
  | 'active'
  | 'fulfilled'
  | 'cancelled'
  | 'overdue';

// Budget Planning types
export interface BudgetCategory {
  id: string;
  name: string;
  type: 'income' | 'expense';
  parent_category_id?: string;
  description?: string;
  is_active: boolean;
}

export interface BudgetPlan {
  id: string;
  organization_id: string;
  branch_id: string;
  name: string;
  fiscal_year: number;
  start_date: string;
  end_date: string;
  status: BudgetStatus;
  total_income_budget: number;
  total_expense_budget: number;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface BudgetLineItem {
  id: string;
  budget_plan_id: string;
  category_id: string;
  category_name: string;
  budgeted_amount: number;
  actual_amount: number;
  variance: number;
  variance_percentage: number;
  notes?: string;
}

export type BudgetStatus = 
  | 'draft'
  | 'approved'
  | 'active'
  | 'closed';

// Common types
export type PaymentMethod = 
  | 'cash'
  | 'check'
  | 'credit_card'
  | 'debit_card'
  | 'bank_transfer'
  | 'mobile_payment'
  | 'online'
  | 'other';

// Filter and reporting types
export interface DateFilter {
  type: 'custom' | 'preset';
  preset?: DatePreset;
  start_date?: string;
  end_date?: string;
}

export type DatePreset = 
  | 'today'
  | 'yesterday'
  | 'this_week'
  | 'last_week'
  | 'this_month'
  | 'last_month'
  | 'this_quarter'
  | 'last_quarter'
  | 'this_year'
  | 'last_year';

export interface FinanceFilter {
  date_filter: DateFilter;
  category_filter?: string[];
  member_filter?: string[];
  amount_range?: {
    min?: number;
    max?: number;
  };
  payment_method_filter?: PaymentMethod[];
  status_filter?: string[];
  // Extended filters for richer finance queries
  group_filter?: string[];
  tag_item_filter?: string[];
  attendance_occasion_filter?: string[];
  attendance_session_filter?: string[];
  income_type_filter?: IncomeType[];
}

// Pledge-specific filters used by pledge listing and stats
export interface PledgeFilter {
  date_filter: DateFilter;
  // Pledge status selection
  status_filter?: PledgeStatus[];
  // Ranges for amounts
  amount_range?: { min?: number; max?: number }; // pledge_amount
  amount_paid_range?: { min?: number; max?: number };
  amount_remaining_range?: { min?: number; max?: number };
  // Client-side progress percentage range (0-100)
  progress_range?: { min?: number; max?: number };
  // Optional source relations
  member_filter?: string[];
  group_filter?: string[];
  tag_item_filter?: string[];
}

export interface FinanceStats {
  total_amount: number;
  record_count: number;
  average_amount: number;
  period_comparison?: {
    current_period: number;
    previous_period: number;
    percentage_change: number;
  };
}

export interface ReportConfig {
  title: string;
  date_range: DateFilter;
  filters: FinanceFilter;
  include_summary: boolean;
  include_details: boolean;
  group_by?: string;
  sort_by?: string;
  sort_order?: 'asc' | 'desc';
}

export type ExtendedIncomeType = typeof extendedIncomeTypes[number];

// Form types
export interface IncomeFormData {
  amount: number;
  category: ExtendedIncomeType;
  occasion_name?: string;
  source?: string;
  payment_method: PaymentMethod;
  date: string;
  description?: string;
  notes?: string;
  receipt_number?: string;
}

export interface ExpenseFormData {
  amount: number;
  category: ExpenseCategory;
  vendor?: string;
  payment_method: PaymentMethod;
  date: string;
  description?: string;
  notes?: string;
  receipt_number?: string;
}

export interface ContributionFormData {
  member_id: string;
  amount: number;
  contribution_type: ContributionType;
  payment_method: PaymentMethod;
  date: string;
  description?: string;
  notes?: string;
  envelope_number?: string;
  tax_deductible: boolean;
}

export interface PledgeFormData {
  // Source info
  source_type: 'member' | 'group' | 'tag_item' | 'other' | 'church';
  source?: string; // when source_type === 'other'
  member_id?: string;
  group_id?: string;
  tag_item_id?: string;
  // Core fields
  pledge_amount: number;
  pledge_type: string;
  campaign_name?: string;
  start_date: string;
  end_date: string;
  payment_frequency: string;
  description?: string;
}

export interface PledgePaymentFormData {
  pledge_id: string;
  amount: number;
  payment_date: string;
  payment_method: PaymentMethod;
  notes?: string;
}

// Payments listing filters
export interface PaymentFilter {
  date_filter: DateFilter;
  payment_method_filter?: PaymentMethod[];
  amount_range?: { min?: number; max?: number };
}

// Extended Budget Planning Types
export interface BudgetAllocation {
  id: string;
  budget_plan_id: string;
  category_id: string;
  category_name: string;
  category_type: 'income' | 'expense';
  budgeted_amount: number;
  allocated_amount: number;
  spent_amount: number;
  remaining_amount: number;
  percentage_used: number;
  tag_allocations?: TagBudgetAllocation[];
  quarterly_breakdown?: QuarterlyBudget[];
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface TagBudgetAllocation {
  id: string;
  budget_allocation_id: string;
  tag_category: string;
  tag_item: string;
  allocated_amount: number;
  spent_amount: number;
  remaining_amount: number;
  percentage_used: number;
}

export interface QuarterlyBudget {
  quarter: 1 | 2 | 3 | 4;
  budgeted_amount: number;
  actual_amount: number;
  variance: number;
  variance_percentage: number;
}

export interface BudgetTemplate {
  id: string;
  organization_id: string;
  name: string;
  description?: string;
  template_data: BudgetTemplateData;
  is_default: boolean;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface BudgetTemplateData {
  categories: BudgetCategoryTemplate[];
  tag_allocations: TagAllocationTemplate[];
}

export interface BudgetCategoryTemplate {
  category_name: string;
  category_type: 'income' | 'expense';
  percentage_of_total: number;
  suggested_amount?: number;
  is_required: boolean;
}

export interface TagAllocationTemplate {
  tag_category: string;
  tag_item: string;
  percentage_of_category: number;
  category_name: string;
}

export interface BudgetProgress {
  budget_plan_id: string;
  overall_progress: number;
  income_progress: number;
  expense_progress: number;
  categories: CategoryProgress[];
  tag_progress: TagProgress[];
  monthly_progress: MonthlyProgress[];
  alerts: BudgetAlert[];
}

export interface CategoryProgress {
  category_id: string;
  category_name: string;
  category_type: 'income' | 'expense';
  budgeted_amount: number;
  actual_amount: number;
  percentage_used: number;
  variance: number;
  status: 'under_budget' | 'on_track' | 'over_budget' | 'exceeded';
}

export interface TagProgress {
  tag_category: string;
  tag_item: string;
  budgeted_amount: number;
  actual_amount: number;
  percentage_used: number;
  status: 'under_budget' | 'on_track' | 'over_budget' | 'exceeded';
}

export interface MonthlyProgress {
  month: number;
  year: number;
  budgeted_income: number;
  actual_income: number;
  budgeted_expenses: number;
  actual_expenses: number;
  net_budget: number;
  net_actual: number;
  variance: number;
}

export interface BudgetAlert {
  id: string;
  type: 'warning' | 'critical' | 'info';
  category: string;
  message: string;
  threshold_percentage: number;
  current_percentage: number;
  created_at: string;
}

export interface BudgetComparison {
  current_budget: BudgetPlan;
  previous_budget?: BudgetPlan;
  comparison_data: ComparisonData[];
}

export interface ComparisonData {
  category_name: string;
  current_amount: number;
  previous_amount: number;
  variance: number;
  variance_percentage: number;
  trend: 'increased' | 'decreased' | 'unchanged';
}

// Form Data Types for Budget Planning
export interface BudgetPlanFormData {
  name: string;
  fiscal_year: number;
  start_date: string;
  end_date: string;
  description?: string;
  template_id?: string;
  copy_from_previous?: boolean;
  previous_budget_id?: string;
}

export interface BudgetAllocationFormData {
  category_id: string;
  budgeted_amount: number;
  tag_allocations: TagAllocationFormData[];
  quarterly_breakdown: QuarterlyBudgetFormData[];
  notes?: string;
}

export interface TagAllocationFormData {
  tag_category: string;
  tag_item: string;
  allocated_amount: number;
}

export interface QuarterlyBudgetFormData {
  quarter: 1 | 2 | 3 | 4;
  budgeted_amount: number;
}

export interface BudgetApprovalFormData {
  budget_plan_id: string;
  approval_notes?: string;
  approved_by: string;
  approval_date: string;
}

// Budget Analysis Types
export interface BudgetAnalysis {
  budget_plan_id: string;
  analysis_date: string;
  overall_health: 'excellent' | 'good' | 'fair' | 'poor' | 'critical';
  recommendations: BudgetRecommendation[];
  projections: BudgetProjection[];
  risk_factors: RiskFactor[];
}

export interface BudgetRecommendation {
  type: 'increase' | 'decrease' | 'reallocate' | 'monitor';
  category: string;
  current_amount: number;
  suggested_amount: number;
  reason: string;
  priority: 'high' | 'medium' | 'low';
}

export interface BudgetProjection {
  category: string;
  projected_amount: number;
  confidence_level: number;
  factors: string[];
}

export interface RiskFactor {
  category: string;
  risk_level: 'high' | 'medium' | 'low';
  description: string;
  mitigation_strategy: string;
}