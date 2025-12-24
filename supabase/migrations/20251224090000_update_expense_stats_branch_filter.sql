-- Update: Add branch filter to expense statistics RPC (includes null-as-global handling)
CREATE OR REPLACE FUNCTION get_expense_stats(
  p_organization_id uuid,
  p_filters jsonb,
  p_search_text text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_result jsonb;
BEGIN
  WITH filtered_data AS (
    SELECT 
      e.amount,
      e.purpose
    FROM expenses e
    WHERE e.organization_id = p_organization_id
    AND e.is_deleted = false
    -- Date Filter
    AND (
      (p_filters->'date_filter'->>'start_date')::date IS NULL OR
      e.date >= (p_filters->'date_filter'->>'start_date')::date
    )
    AND (
      (p_filters->'date_filter'->>'end_date')::date IS NULL OR
      e.date <= (p_filters->'date_filter'->>'end_date')::date
    )
    -- Branch Filter (include NULL as global when a branch filter is applied)
    AND (
      (p_filters->'branch_id_filter' IS NULL OR jsonb_array_length(p_filters->'branch_id_filter') = 0)
      OR (
        e.branch_id = ANY(ARRAY(SELECT (jsonb_array_elements_text(p_filters->'branch_id_filter'))::uuid))
        OR e.branch_id IS NULL
      )
    )
    -- Category Filter
    AND (
      p_filters->'category_filter' IS NULL OR jsonb_array_length(p_filters->'category_filter') = 0 OR
      e.category = ANY(ARRAY(SELECT jsonb_array_elements_text(p_filters->'category_filter')))
    )
    -- Payment Method Filter
    AND (
      p_filters->'payment_method_filter' IS NULL OR jsonb_array_length(p_filters->'payment_method_filter') = 0 OR
      e.payment_method = ANY(ARRAY(SELECT jsonb_array_elements_text(p_filters->'payment_method_filter')))
    )
    -- Purpose Filter
    AND (
      p_filters->'purpose_filter' IS NULL OR jsonb_array_length(p_filters->'purpose_filter') = 0 OR
      e.purpose = ANY(ARRAY(SELECT jsonb_array_elements_text(p_filters->'purpose_filter')))
    )
    -- Search Text
    AND (
      p_search_text IS NULL OR p_search_text = '' OR
      e.description ILIKE '%' || p_search_text || '%' OR
      e.purpose ILIKE '%' || p_search_text || '%' OR
      e.vendor ILIKE '%' || p_search_text || '%' OR
      e.receipt_number ILIKE '%' || p_search_text || '%'
    )
  ),
  aggregates AS (
    SELECT
      COALESCE(SUM(amount), 0) as total_expenses,
      COUNT(*) as record_count,
      COALESCE(AVG(amount), 0) as average_expense
    FROM filtered_data
  ),
  top_purp AS (
    SELECT purpose, SUM(amount) as total
    FROM filtered_data
    GROUP BY purpose
    ORDER BY total DESC
    LIMIT 1
  )
  SELECT jsonb_build_object(
    'total_expenses', (SELECT total_expenses FROM aggregates),
    'record_count', (SELECT record_count FROM aggregates),
    'average_expense', (SELECT average_expense FROM aggregates),
    'top_purpose', COALESCE((SELECT purpose FROM top_purp), 'N/A'),
    'top_purpose_amount', COALESCE((SELECT total FROM top_purp), 0)
  ) INTO v_result;

  RETURN v_result;
END;
$$;
