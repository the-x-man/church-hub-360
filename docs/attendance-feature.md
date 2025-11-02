Database Schema: Attendance Module

1. attendance_occasions

Stores general recurring or permanent occasions — e.g., “Sunday Service”, “Youth Meeting”, “Bible Studies”.

Column Type Description
id uuid (PK) Unique ID for the occasion
organization_id uuid (FK → organizations.id)`For multi-church support name text Occasion name (e.g. “Sunday Service”) description text Optional details recurrence_rule text iCalendar format (e.g. FREQ=WEEKLY;BYDAY=SU) or NULL for one-time default_duration_minutes integer Optional: how long a session usually lasts is_active boolean Whether this occasion is active created_by uuid (FK → users.id)` Who created it
created_at timestamp
updated_at timestamp

🟢 Usage: This defines the “type” of service or event you take attendance for.
For recurring ones, the system can automatically generate sessions on each recurrence day.

2. attendance_sessions

Represents a specific instance of attendance marking, e.g. “Sunday Service – 2025-10-12”.

Column Type Description
id uuid (PK) Unique ID for the session
organization_id uuid (FK → organizations.id)`occasion_id uuid (FK → attendance_occasions.id)` The parent occasion
name text Optional override name (e.g. “Sunday Service – Youth Branch”)
start_time timestamptz Session start date/time
end_time timestamptz Session end date/time
is_open boolean Whether attendance can be marked
allow_public_marking boolean Whether members can self-mark via link
proximity_required boolean If location validation is needed
location jsonb Optional {lat, lng, radius} for proximity check
allowed_tags uuid[] or text[] Restrict attendance to members with these tag IDs
marking_modes jsonb Example: { "email": true, "phone": false, "membership_id": true }
created_by uuid Admin who created the session
created_at timestamptz
updated_at timestamptz

🟢 Usage:
This is the “attendance event” — people actually mark attendance here.
It can be opened/closed manually or automatically (based on time).

3. attendance_links

Handles the public/self-marking URLs.

Column Type Description
id uuid (PK)
session_id uuid (FK → attendance_sessions.id)`
token text (unique) Used for link (e.g. /attendance?token=abcd123)
is_active boolean
expires_at timestamptz
max_usage integer Optional limit for link reuse
created_by uuid
created_at timestamptz

🟢 Usage:
A new link is created for each session (or regenerated).
This ensures session-level control and expiration.

4. attendance_records

Stores actual attendance logs for each member/session.

Column Type Description
id uuid (PK)
session_id uuid (FK → attendance_sessions.id)`The session attended member_id uuid (FK → members.id)` The member marked present
marked_by uuid (FK → users.id)` The user (admin) who marked attendance
marked_by_mode text How attendance was marked (email, phone, membership_id, manual, public_link)
marked_at timestamptz
location jsonb Optional: location where member marked (for public link)
notes text
is_valid boolean False if failed validation (e.g. not part of allowed tags)

🟢 Usage:
Each row = one attendance mark for one person in one session.
You can count members, export reports, and compute participation rates easily.

5. attendance_participants

Used when a session is restricted to specific people or groups.

Column Type Description
id uuid (PK)
session_id uuid (FK → attendance_sessions.id)`member_id uuid (FK → members.id)` Allowed participant
added_by uuid Admin who added
added_at timestamptz

🟢 Usage:
Optional — only needed if you want to explicitly define who can attend a particular session (e.g. “Youth Leadership Retreat — only for youth leaders”).

6. attendance_reports

(Optional pre-computed summaries for faster analytics.)

Column Type Description
id uuid (PK)
organization_id uuid
occasion_id uuid
session_id uuid
total_members integer
total_present integer
total_absent integer
attendance_rate numeric e.g. 0.85
generated_at timestamptz

🟢 Usage:
For caching daily or weekly stats to make dashboards super fast.

⚙️ Relationships Summary
organizations
└── members
└── attendance_occasions
└── attendance_sessions
├── attendance_records
├── attendance_links
├── attendance_participants

Key relationships:

One occasion → many sessions.

One session → many attendance_records.

One session → optional attendance_link(s).

Members → many attendance_records (via member_id).

Optionally, session may limit to specific attendance_participants.

🔒 Automation & Rules (for later implementation)
Function Description
Auto-start session When recurrence rule triggers, system creates and opens a new session automatically
Auto-close session Close session after end_time or when admin manually ends
Valid marking check Attendance can only be marked when session.is_open = true and within allowed tags or participant list
Tag validation Check if member belongs to any of the session’s allowed_tags
Public link validation Check is_active, expires_at, and optionally location proximity
Prevent duplicates One member can only have one record per session
🧩 Example Query Scenarios

1️⃣ Get all active sessions this week:

SELECT \* FROM attendance_sessions
WHERE organization_id = 'org-id'
AND start_time >= NOW() - INTERVAL '7 days'
AND is_open = true;

2️⃣ Get attendance percentage for a session:

SELECT
COUNT(_) FILTER (WHERE is_valid = true) AS present,
COUNT(DISTINCT m.id) AS total,
COUNT(_) FILTER (WHERE is_valid = true)::float / COUNT(DISTINCT m.id)::float AS attendance_rate
FROM members m
LEFT JOIN attendance_records ar ON m.id = ar.member_id
WHERE ar.session_id = 'session-id';

3️⃣ Automatically close expired sessions:

UPDATE attendance_sessions
SET is_open = false
WHERE end_time < NOW() AND is_open = true;

✅ Benefits of this Design

Flexible: Supports one-time, recurring, restricted, or public sessions.

Scalable: Designed for multiple organizations and potentially thousands of records.

Safe: Even if an occasion or tag is deleted, session/record data remains intact (since it references by ID, not label).

Compatible: You can easily connect to your existing members table.

Extendable: Add QR codes, geolocation, or biometrics later without structural changes.

Purpose of recurrence_rule

It defines when and how often an occasion automatically occurs — e.g.:

Weekly Sunday service:
FREQ=WEEKLY;BYDAY=SU

Every Wednesday prayer meeting:
FREQ=WEEKLY;BYDAY=WE

Monthly leaders’ meeting (first Saturday):
FREQ=MONTHLY;BYDAY=1SA

One-time event (revival week):
NULL (meaning not recurring)

So your attendance_occasions table acts as a template for generating or managing sessions.

🧩 How it fits into the attendance workflow

Let’s connect this to your system logic:

1. attendance_occasions

Stores the definition of an occasion — e.g.

id name recurrence_rule start_date end_date ...
1 Sunday Service FREQ=WEEKLY;BYDAY=SU 2025-01-01 NULL
2 Youth Camp 2025 NULL 2025-06-10 2025-06-14

2. attendance_sessions

These are actual instances of attendance-taking events derived from the occasion.

For example:

id occasion_id date status
11 1 2025-10-12 Closed
12 1 2025-10-19 Open
13 2 2025-06-10 Closed

Sessions can be created:

Automatically (based on recurrence rules, e.g. every Sunday)

Manually (when an admin starts a new attendance session)

⚙️ How to Use the Recurrence Rule Practically
✅ Option 1 — Generate sessions automatically

When the system runs (e.g. daily cron or background worker):

Query all occasions with a recurrence_rule.

Parse each rule using a recurrence library (examples below).

Check if there’s a session for this Sunday (or the next occurrence).

If not, auto-create a session.

Example pseudo-code:

import { rrulestr } from 'rrule';

const rule = rrulestr('FREQ=WEEKLY;BYDAY=SU', { dtstart: new Date('2025-01-01') });
const nextDates = rule.between(new Date(), addDays(new Date(), 7));

for (const date of nextDates) {
const existingSession = await db.sessions.find({ occasion_id, date });
if (!existingSession) {
await db.sessions.insert({ occasion_id, date, status: 'Scheduled' });
}
}

This ensures your “Sunday Service” automatically appears each week.

✅ Option 2 — Use it dynamically in the UI

If you don’t want to auto-generate, you can use it in the frontend to show upcoming services or auto-suggest session creation.

For instance:

When an admin opens the Attendance page, you calculate “next Sunday” from the rule and offer a “Start Attendance for Next Sunday” button.

🧠 Libraries for Parsing RRULE

In your stack (assuming you’re using TypeScript / React):

Frontend: rrule

npm install rrule

import { RRule } from 'rrule';

const rule = new RRule({
freq: RRule.WEEKLY,
byweekday: [RRule.SU],
dtstart: new Date('2025-01-01'),
});
const next = rule.after(new Date());
console.log('Next Sunday:', next);

Backend (Node/Postgres):

You can use the same library or PostgreSQL’s date functions to compute next occurrences.

🕓 How it Affects Attendance Logic

Recurring occasion (e.g. Sunday): attendance sessions are time-based and recurring.

One-time occasion (e.g. Youth Camp): attendance session is manual and finite.

Rules can expire (if end_date is provided).

You can combine recurrence with other rules like:

auto_start and auto_close flags

recurrence_until date

location_id for geofencing attendance

🧭 Summary
Concept Purpose Example
recurrence_rule Defines how often an occasion repeats FREQ=WEEKLY;BYDAY=SU
attendance_occasions Template or pattern (Sunday Service, Camp, etc.) “Sunday Service”
attendance_sessions Specific occurrence (Oct 12, 2025 Sunday) “Sunday Service – Oct 12”
Auto-generation Use recurrence to pre-create or suggest sessions Weekly cron or dynamic UI suggestion

✅ In short:
Your recurrence_rule turns static “occasions” into dynamic, time-aware attendance sessions that can automatically start, close, or appear on schedule — enabling automation and consistency across your entire attendance system.
