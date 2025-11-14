# Admin Awards Nomination Management - Feature Plan

**Status:** Planning - Awaiting User Input
**Created:** 2025-01-13
**Type:** Enhancement - Admin Interface

---

## 1. Feature Overview

### Description
Add an admin interface to view, manage, and analyze awards nominations submitted through the public nomination form. Admins need to see all nominations in a table format, track nomination counts per nominee, filter/search by category, and view full nomination details.

### Business Value
- Centralized nomination management for awards committee
- Easy filtering and searching of nominations
- Track popularity (nomination count) per nominee
- Streamline review process
- Export data for committee review
- Professional admin interface

### Use Cases
- Admin views all nominations in sortable table
- Admin filters nominations by award category
- Admin searches for specific nominee or nominator
- Admin clicks row to see full nomination details
- Admin sees how many nominations each person received
- Admin exports nominations to CSV/Excel for offline review
- Admin tracks nomination trends over time
- Admin manages nomination status (pending, approved, rejected)

---

## 2. Key Decisions Needed

Before proceeding with implementation, the following decisions must be made:

### Decision 1: Nominations vs Votes Model

**Question:** Are nominations the same as votes, or are they separate?

**Option A: Nominations = Votes (Simple)**
- Each nomination submission counts as 1 vote
- Winner = person with most nominations in each category
- No separate voting phase needed
- **Recommended for quick implementation**

**Option B: Nominations + Separate Voting (Complex)**
- Phase 1: Collect nominations (already built)
- Phase 2: Admin reviews and selects finalists
- Phase 3: Public voting on finalists
- Winner = most votes (separate from nomination count)
- **Requires additional public voting interface**

**User Decision:** [ ] Option A  [ ] Option B

---

### Decision 2: Feature Scope

**Question:** What level of features do you need?

**Option A: Basic Admin Table (Quick - 2-3 hours)**
- Table showing all nominations
- Columns: Date, Category, Nominee Name, Nominator Name, Status
- Click row to open modal with full details
- Search box (searches across all fields)
- Filter dropdown (by category)
- Nomination count per nominee display
- Export to CSV button
- Sort by any column
- Pagination (if many nominations)

**Option B: Advanced Admin Interface (Full - 5-6 hours)**
- Everything in Basic, plus:
- Approval workflow (approve/reject buttons)
- Bulk actions (select multiple, approve all, export selected)
- Charts/graphs (nominations by category, trends over time)
- Nominee profile aggregation (all nominations for one person)
- Status badges (pending, approved, rejected, finalist)
- Email notifications to nominees
- Admin notes field (internal comments)
- Duplicate detection (same nominee + category)
- Rating/scoring system

**User Decision:** [ ] Basic  [ ] Advanced

---

### Decision 3: Integration Location

**Question:** Where should this be added in the admin panel?

**Option A: New Tab in Existing Admin Dashboard (Recommended)**
- Add "Awards" tab next to "Applications" and "Members" tabs
- Consistent with existing admin interface
- Easy navigation between sections
- File: Modify `src/pages/admin/AdminDashboard.jsx`

**Option B: Separate Admin Page**
- New route at `/admin/awards` or `/admin/nominations`
- Standalone page like AdminManagement
- Link from main admin dashboard
- File: Create new `src/pages/admin/AdminAwards.jsx`

**Option C: Integrate into AdminManagement**
- Add to existing management page as new section
- All admin functions in one place
- May become cluttered

**User Decision:** [ ] Option A  [ ] Option B  [ ] Option C

---

### Decision 4: Duplicate Handling

**Question:** What if the same person is nominated multiple times for the same award?

**Scenario:** Jane nominates John for "CEO Award" and Mary also nominates John for "CEO Award"

**Option A: Count All Separately (Simple)**
- Both nominations count as separate entries
- John has 2 nominations = 2 votes
- Table shows 2 rows
- Easy to implement
- **Recommended for Option A (Nominations = Votes)**

**Option B: Aggregate by Nominee (Complex)**
- Group nominations by nominee + category
- John has 1 entry with 2 supporters
- Show supporter names in details
- Nomination count shown clearly
- **Better for viewing, more complex**

**Option C: Flag for Review**
- Show duplicates with warning badge
- Admin manually reviews and decides
- Can merge or keep separate
- Most flexible but requires admin action

**User Decision:** [ ] Option A  [ ] Option B  [ ] Option C

---

### Decision 5: Public Visibility

**Question:** Should nomination data be visible to the public?

**Option A: Completely Private (Recommended)**
- Only admins can see nominations
- No public leaderboard
- Winners announced manually
- Most secure

**Option B: Public Leaderboard**
- Display top nominees on /awards page
- Show nomination counts
- Update in real-time
- Encourages more nominations
- **Requires public-facing component**

**Option C: Hybrid Approach**
- Keep nominations private during collection
- Admin selects finalists
- Display finalists publicly (without counts)
- Voting phase (if separate from nominations)

**User Decision:** [ ] Option A  [ ] Option B  [ ] Option C

---

## 3. Recommended Quick Start Approach

Based on typical use cases, here's the recommended approach for fastest implementation:

### Recommendations:
1. **Nominations = Votes** (Decision 1: Option A)
   - Each nomination submission = 1 vote
   - Simple and clear logic

2. **Basic Admin Table** (Decision 2: Option A)
   - Get core functionality working quickly
   - Can enhance later based on real usage

3. **New Tab in Admin Dashboard** (Decision 3: Option A)
   - Consistent with existing design
   - Easy navigation

4. **Count All Separately** (Decision 4: Option A)
   - Simple implementation
   - Clear vote counting

5. **Completely Private** (Decision 5: Option A)
   - Secure and professional
   - Admin controls announcement

### Implementation Time: 2-3 hours

---

## 4. Technical Implementation Plan (Pending User Decisions)

Once decisions are made, implementation will follow this structure:

### Phase 1: Custom Hook for Nominations Data
- Create `useNominations.js` hook
- Fetch nominations from Firebase
- Real-time updates with Firestore listeners
- Calculate nomination counts per nominee
- Filter and search functionality
- Sort and pagination logic

### Phase 2: Nominations Table Component
- Create table component (similar to existing admin tables)
- Display nominations in sortable table
- Search input component
- Category filter dropdown
- Nomination count display
- Click row to view details
- Pagination controls
- Export to CSV functionality

### Phase 3: Nomination Details Modal
- Modal component to show full nomination details
- Display all fields (nominee info, nominator info, statements)
- Show nomination timestamp
- Status badge (if using approval workflow)
- Close/back button

### Phase 4: Integration with Admin Dashboard
- Add "Awards" tab to AdminDashboard.jsx
- Wire up components
- Add route if needed
- Update admin navigation

### Phase 5: Testing & Polish
- Test with various data scenarios
- Test search and filter
- Test export functionality
- Mobile responsive checks
- Error handling

---

## 5. Data Structure

### Existing Firestore Collection: `awards_nominations`

```javascript
{
  id: "auto-generated-id",
  submittedAt: Timestamp,
  nominationYear: 2025,
  status: "pending",
  category: "Excellence in Design",
  nominee: {
    fullName: "John Doe",
    email: "john@example.com",
    organization: "ABC Corp",
    phone: "+27123456789",
    website: "https://example.com"
  },
  nominator: {
    fullName: "Jane Smith",
    email: "jane@example.com",
    organization: "XYZ Ltd",
    relationship: "Colleague"
  },
  supportingStatement: "Detailed statement...",
  achievements: "Key achievements..."
}
```

### Nomination Count Calculation

**If Decision 4: Option A (Count All Separately)**
```javascript
// Simple count query
nominations.filter(n =>
  n.nominee.fullName === "John Doe" &&
  n.category === "CEO Award"
).length
```

**If Decision 4: Option B (Aggregate)**
```javascript
// Group by nominee + category
const grouped = nominations.reduce((acc, nomination) => {
  const key = `${nomination.nominee.fullName}-${nomination.category}`;
  if (!acc[key]) {
    acc[key] = {
      nominee: nomination.nominee,
      category: nomination.category,
      count: 0,
      supporters: []
    };
  }
  acc[key].count++;
  acc[key].supporters.push(nomination.nominator);
  return acc;
}, {});
```

---

## 6. Files to Create/Modify

### Files to Create (Pending Decisions)

**If Basic Admin Table (Decision 2: Option A):**
```
src/hooks/useNominations.js
src/components/admin/NominationsTable.jsx
src/components/admin/NominationDetailsModal.jsx
```

**If Advanced Interface (Decision 2: Option B):**
```
src/hooks/useNominations.js
src/hooks/useNominationAnalytics.js
src/components/admin/NominationsTable.jsx
src/components/admin/NominationDetailsModal.jsx
src/components/admin/NominationApprovalControls.jsx
src/components/admin/NominationCharts.jsx
src/components/admin/BulkActionsBar.jsx
src/utils/nominationExport.js
```

**If Public Leaderboard (Decision 5: Option B):**
```
src/components/awards/NominationLeaderboard.jsx
src/hooks/usePublicNominations.js
```

### Files to Modify

**If Option A: New Tab in Dashboard:**
- `src/pages/admin/AdminDashboard.jsx` - Add Awards tab

**If Option B: Separate Page:**
- `src/pages/admin/AdminAwards.jsx` - New page
- `src/App.jsx` - Add route
- `src/pages/admin/AdminDashboard.jsx` - Add navigation link

---

## 7. UI/UX Mockup (Basic Table)

### Awards Tab in Admin Dashboard

```
┌─────────────────────────────────────────────────────────────┐
│ Admin Dashboard                                             │
├─────────────────────────────────────────────────────────────┤
│ [Applications] [Members] [Awards] [Settings]                │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│ Awards Nominations                                           │
│                                                              │
│ [Search...] [Filter by Category ▼] [Export CSV]             │
│                                                              │
│ ┌──────────────────────────────────────────────────────────┐│
│ │ Date       │ Category        │ Nominee     │ Count │ ... ││
│ ├──────────────────────────────────────────────────────────┤│
│ │ Jan 10     │ CEO Award       │ John Doe    │   3   │ [>] ││
│ │ Jan 10     │ Excellence IT   │ Jane Smith  │   1   │ [>] ││
│ │ Jan 11     │ CEO Award       │ Mary Johnson│   2   │ [>] ││
│ └──────────────────────────────────────────────────────────┘│
│                                                              │
│ [< Prev] Page 1 of 5 [Next >]                               │
└─────────────────────────────────────────────────────────────┘
```

### Nomination Details Modal (on row click)

```
┌─────────────────────────────────────────────────────────────┐
│ Nomination Details                                    [X]    │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│ Category: Excellence in Design                              │
│ Submitted: January 10, 2025 at 3:45 PM                      │
│ Status: [Pending ▼]                                         │
│                                                              │
│ NOMINEE INFORMATION                                          │
│ Name: John Doe                                               │
│ Email: john@example.com                                      │
│ Organization: ABC Corporation                                │
│ Phone: +27 12 345 6789                                       │
│ Website: https://example.com                                 │
│                                                              │
│ NOMINATOR INFORMATION                                        │
│ Name: Jane Smith                                             │
│ Email: jane@example.com                                      │
│ Organization: XYZ Consulting                                 │
│ Relationship: Colleague                                      │
│                                                              │
│ SUPPORTING STATEMENT                                         │
│ [Full supporting statement text...]                          │
│                                                              │
│ KEY ACHIEVEMENTS                                             │
│ [Full achievements text...]                                  │
│                                                              │
│ [Close]                                                      │
└─────────────────────────────────────────────────────────────┘
```

---

## 8. Example Features Based on Decisions

### If Basic Table (Decision 2: Option A)

**Features:**
- ✅ View all nominations in table
- ✅ Search across all fields
- ✅ Filter by category
- ✅ Sort by any column
- ✅ Click row to see details modal
- ✅ Show nomination count per nominee
- ✅ Export to CSV
- ✅ Pagination
- ✅ Real-time updates

**Time:** 2-3 hours

---

### If Advanced Interface (Decision 2: Option B)

**All Basic Features, Plus:**
- ✅ Approval workflow (approve/reject buttons)
- ✅ Status badges (pending, approved, rejected, finalist)
- ✅ Bulk actions (select multiple, bulk approve)
- ✅ Charts/graphs:
  - Nominations by category (bar chart)
  - Nominations over time (line chart)
  - Top nominees (leaderboard)
- ✅ Nominee profile view (all nominations for one person)
- ✅ Admin notes field (internal comments)
- ✅ Duplicate detection and warnings
- ✅ Email notifications to nominees
- ✅ Rating/scoring system
- ✅ Export selected (not just all)
- ✅ Advanced filters (date range, status, etc.)

**Time:** 5-6 hours

---

## 9. Implementation Sequence

Once user provides decisions, follow this sequence:

1. **Read Decisions** - Confirm all 5 decisions are made
2. **Plan to tasks/todo.md** - Create detailed checklist
3. **Check In With User** - Present plan for approval
4. **Phase 1: Hook** - Build data fetching logic
5. **Phase 2: Table** - Build main table component
6. **Phase 3: Modal** - Build details modal
7. **Phase 4: Integration** - Wire into admin dashboard
8. **Phase 5: Testing** - Test all functionality
9. **Document** - Update implementation docs

---

## 10. Questions for User

Please make decisions on the following:

### ✅ Decision 1: Nominations = Votes or Separate?
- [ ] Option A: Nominations = Votes (each submission = 1 vote)
- [ ] Option B: Nominations + Separate Voting Phase

### ✅ Decision 2: Feature Scope?
- [ ] Option A: Basic Admin Table (2-3 hours)
- [ ] Option B: Advanced Interface (5-6 hours)

### ✅ Decision 3: Where to Add?
- [ ] Option A: New tab in AdminDashboard
- [ ] Option B: Separate page at /admin/awards
- [ ] Option C: Add to AdminManagement

### ✅ Decision 4: Duplicate Handling?
- [ ] Option A: Count all separately (simple)
- [ ] Option B: Aggregate by nominee (grouped)
- [ ] Option C: Flag for admin review

### ✅ Decision 5: Public Visibility?
- [ ] Option A: Completely private (admin only)
- [ ] Option B: Public leaderboard
- [ ] Option C: Hybrid (finalists public)

---

## 11. Recommended Quick Decision Set

If you want to move fast and get this working quickly, choose:

```
✅ Decision 1: Option A (Nominations = Votes)
✅ Decision 2: Option A (Basic Table)
✅ Decision 3: Option A (New tab in AdminDashboard)
✅ Decision 4: Option A (Count all separately)
✅ Decision 5: Option A (Completely private)

Estimated Time: 2-3 hours
Result: Working admin interface to view and manage nominations
```

Then enhance later based on real usage:
- Add approval workflow if needed
- Add charts if helpful
- Add public leaderboard if desired

---

## 12. Next Steps

**For User:**
1. Review this plan document
2. Make decisions on the 5 key questions above
3. Indicate preferred approach (Quick Start or Custom)
4. Provide any additional requirements

**For Implementation:**
1. User provides decisions
2. Create detailed tasks/todo.md
3. Present plan for approval
4. Begin implementation
5. Test and deliver

---

**Status:** Awaiting user decisions to proceed with implementation planning
**Created:** 2025-01-13
