-- Set default preferences JSON and seed finance_preferences
do $$
declare
  default_prefs text := '{"categories":[{"key":"utilities","label":"Utilities","purposes":["Electricity","Water","Internet","Gas","Waste"]},{"key":"maintenance","label":"Maintenance","purposes":["Building Repairs","Equipment Repairs","Maintenance Contract"]},{"key":"supplies","label":"Supplies","purposes":["Office Supplies","Cleaning Supplies","Consumables"]},{"key":"equipment","label":"Equipment","purposes":["Audio Equipment","Furniture","IT Equipment"]},{"key":"salaries","label":"Salaries","purposes":["Pastoral Staff","Administrative Staff","Support Staff"]},{"key":"benefits","label":"Benefits","purposes":["Health Insurance","Retirement","Allowances"]},{"key":"ministry_expenses","label":"Ministry Expenses","purposes":["Children Ministry","Youth Ministry","Music Ministry"]},{"key":"outreach","label":"Outreach","purposes":["Community Outreach","Advertising","Evangelism Materials"]},{"key":"missions","label":"Missions","purposes":["Mission Trip Support","Missionary Support","Local Missions"]},{"key":"events","label":"Events","purposes":["Conference","Retreat","Workshop"]},{"key":"transportation","label":"Transportation","purposes":["Fuel","Vehicle Maintenance","Transport Services"]},{"key":"insurance","label":"Insurance","purposes":["Property Insurance","Vehicle Insurance","Liability Insurance"]},{"key":"professional_services","label":"Professional Services","purposes":["Accounting","Legal","Consulting"]},{"key":"other","label":"Other","purposes":["Miscellaneous"]}]}';
begin
  -- Ensure column has a default for new rows (use constant literal)
  alter table public.finance_preferences
    alter column expenses_prefs set default $prefs$ {"categories":[{"key":"utilities","label":"Utilities","purposes":["Electricity","Water","Internet","Gas","Waste"]},{"key":"maintenance","label":"Maintenance","purposes":["Building Repairs","Equipment Repairs","Maintenance Contract"]},{"key":"supplies","label":"Supplies","purposes":["Office Supplies","Cleaning Supplies","Consumables"]},{"key":"equipment","label":"Equipment","purposes":["Audio Equipment","Furniture","IT Equipment"]},{"key":"salaries","label":"Salaries","purposes":["Pastoral Staff","Administrative Staff","Support Staff"]},{"key":"benefits","label":"Benefits","purposes":["Health Insurance","Retirement","Allowances"]},{"key":"ministry_expenses","label":"Ministry Expenses","purposes":["Children Ministry","Youth Ministry","Music Ministry"]},{"key":"outreach","label":"Outreach","purposes":["Community Outreach","Advertising","Evangelism Materials"]},{"key":"missions","label":"Missions","purposes":["Mission Trip Support","Missionary Support","Local Missions"]},{"key":"events","label":"Events","purposes":["Conference","Retreat","Workshop"]},{"key":"transportation","label":"Transportation","purposes":["Fuel","Vehicle Maintenance","Transport Services"]},{"key":"insurance","label":"Insurance","purposes":["Property Insurance","Vehicle Insurance","Liability Insurance"]},{"key":"professional_services","label":"Professional Services","purposes":["Accounting","Legal","Consulting"]},{"key":"other","label":"Other","purposes":["Miscellaneous"]}]} $prefs$;

  -- Update existing rows with null preferences
  update public.finance_preferences
  set expenses_prefs = default_prefs
  where expenses_prefs is null;

  -- Insert missing rows for all organizations
  insert into public.finance_preferences (organization_id, expenses_prefs)
  select o.id, default_prefs
  from public.organizations o
  where not exists (
    select 1 from public.finance_preferences fp where fp.organization_id = o.id
  );
end $$;