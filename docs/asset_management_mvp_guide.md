# Asset Management Module - MVP Implementation Guide

## Overview

This document provides step-by-step implementation instructions for
building a simple, generic, MVP-level Asset Management feature for a
church management system. The goal is to deliver only the essential
functionality while leaving advanced options for future enhancements.

---

## 1. Scope of MVP

The MVP includes: - Asset catalog (core metadata) - Asset location
tracking - Assignment of assets to people or groups - Simple images
storage via Cloudinary URLs - Basic lifecycle statuses - CRUD operations
for assets

Excluded for MVP (future enhancements): - Vendor management - Warranty
tracking - Audit & inventory count system - Maintenance & repair
management - Depreciation and financial tracking - Notifications &
reminders

---

## 2. Data Model Requirements

### 2.1. `assets` Table

Create a table `assets` with the following fields:

---

Field Type Notes

---

id UUID Primary key

organization_id UUID Foreign key (multi-tenant
support)

branch_id UUID Optional if your system
supports branches

name Text Required

description Text Optional

category Text Example: "Furniture",
"Audio/Visual", "Vehicle"

status Text Enum-like text (e.g.,
`Active`, `Stored`,
`Damaged`, `Retired`)

location Text Simple text field or room
name

assigned_to_id UUID User/member ID (nullable)

assigned_to_type Text "user" or "group"

images Text\[\] Array of Cloudinary URLs

purchase_date Date Optional

created_at Timestamp Default now()

updated_at Timestamp Default now()

---

> **Note:** Enable all access for authenticated users for RLS policies

---

## 3. Implementation Instructions

### 3.1. Step 1 --- Create Categories List

Keep it simple. Do not create a categories table.

Use a predefined list but allow entry of custom values:

    - Furniture
    - Instruments
    - Audio/Visual
    - Electricals
    - Vehicles
    - Office Equipment
    - Other

### 3.2. Step 2 --- Implement CRUD for Assets

Create query hooks for: - Create asset - Update asset -
Soft Delete asset - Fetch list of assets - Filter by category, status,
location, assigned user/group

### 3.3. Step 3 --- Asset Assignment Logic

Keep this super simple: - Allow assigning an asset to: - A person
(member) - A group. Use shared MemberSearchTypeAhead shared Groups selector components

Store only: - assigned_to_id - assigned_to_type

Assignment changes update `updated_at`.

### 3.4. Step 4 --- Location Handling

Use a **simple text field** for MVP: - Example: "Main Auditorium",
"Children's Hall", "Youth Room B"

Do not build a structured locations table now.

### 3.5. Step 5 --- Image Upload System

- Upload images to Cloudinary
- Store URLs in the `images` text\[\] column
- UI: allow multiple uploads

Keep it simple---no separate files table.

### 3.6. Step 6 --- Asset Status Lifecycle

For MVP, use these statuses:

    Active
    In Storage
    Damaged
    Retired

---

## 4. UI/UX Guidelines

### 4.1. Asset List Page

Provide: - Search bar - Filters: - Category - Status - Location - Grid
or table display

### 4.2. Create/Edit Asset Page

Sections: 1. Basic Details\

2. Assignment\
3. Images\
4. Metadata (status, location, dates)

### 4.3. Asset Detail Page

Tabs or sections: - Overview - Assignment history (optional for
future) - Images

For MVP, show: - Name, category, status - Description - Location -
Assigned member/group - Images

---

## 6. Summary

This MVP provides the simplest generic asset management system usable by
any church. It includes only essential features required to register
assets, categorize them, assign them, track locations, and store images.

Advanced features are intentionally excluded and pushed to **Future
Enhancements** to keep the MVP minimal and implementable quickly.
