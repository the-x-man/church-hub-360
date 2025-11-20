create view public.members_summary as
select
  m.id,
  m.organization_id,
  m.branch_id,
  m.membership_id,
  m.first_name,
  m.last_name,
  m.middle_name,
  concat(
    m.first_name,
    ' ',
    COALESCE(m.middle_name::text || ' '::text, ''::text),
    m.last_name
  ) as full_name,
  m.email,
  m.phone,
  m.date_of_birth,
  m.gender,
  m.membership_status,
  m.membership_type,
  m.date_joined,
  m.is_active,
  m.profile_image_url,
  m.created_at,
  m.updated_at,
  m.address_line_1,
  m.address_line_2,
  m.city,
  m.state,
  m.postal_code,
  m.country,
  b.name as branch_name,
  b.location as branch_location,
  case
    when m.date_of_birth is not null then date_part(
      'year'::text,
      age (m.date_of_birth::timestamp with time zone)
    )
    else null::double precision
  end as age,
  case
    when m.date_joined is not null then date_part(
      'year'::text,
      age (m.date_joined::timestamp with time zone)
    )
    else null::double precision
  end as membership_years,
  COALESCE(tag_data.all_tags, ''::text) as assigned_tags,
  COALESCE(tag_data.tag_count, 0::bigint) as tag_count,
  COALESCE(tag_data.tags_with_categories, ''::text) as tags_with_categories,
  COALESCE(tag_data.tags_array, array[]::text[]) as tags_array,
  COALESCE(group_data.member_groups, array[]::text[]) as member_groups
from
  members m
  left join branches b on m.branch_id = b.id
  left join (
    select
      mti.member_id,
      string_agg(
        distinct ti.name,
        ', '::text
        order by
          ti.name
      ) as all_tags,
      count(distinct ti.id) as tag_count,
      string_agg(
        distinct (t.name || ': '::text) || ti.name,
        ' | '::text
        order by
          ((t.name || ': '::text) || ti.name)
      ) as tags_with_categories,
      array_agg(
        distinct ti.name
        order by
          ti.name
      ) as tags_array
    from
      member_tag_items mti
      join tag_items ti on mti.tag_item_id = ti.id
      and ti.is_active = true
      join tags t on ti.tag_id = t.id
      and t.is_active = true
    group by
      mti.member_id
  ) tag_data on m.id = tag_data.member_id
  left join (
    select
      mag.member_id,
      array_agg(
        distinct g.name::text || COALESCE(
          ' - '::text || NULLIF(
            TRIM(
              both
              from
                mag."position"
            ),
            ''::text
          ),
          ''::text
        )
        order by
          (
            g.name::text || COALESCE(
              ' - '::text || NULLIF(
                TRIM(
                  both
                  from
                    mag."position"
                ),
                ''::text
              ),
              ''::text
            )
          )
      ) as member_groups
    from
      member_assigned_groups mag
      join groups g on mag.group_id = g.id
      and g.is_active = true
    group by
      mag.member_id
  ) group_data on m.id = group_data.member_id
where
  m.is_active = true;