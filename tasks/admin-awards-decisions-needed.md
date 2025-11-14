# Awards Admin Panel - Decisions Needed

**Date:** 2025-01-13
**Project:** ACBF Awards Nomination System
**Status:** Awaiting Client Decisions

---

## Overview

We've successfully implemented the public awards nomination form on your website. Users can now submit nominations for 28 different award categories at https://acbf.org.za/awards.

**Next Step:** Build an admin interface so you can view and manage all nominations.

Before we proceed, we need your input on a few key decisions to ensure the admin panel works exactly how you need it.

---

## Quick Summary

**If you're short on time:** We recommend the "Quick Start" approach (see bottom of this document). This gets you a working admin panel in 2-3 hours, and you can enhance it later based on real usage.

**If you want to customize:** Please review and answer the 5 decisions below.

---

## Decision 1: How Should Nominations Work?

### The Question
Should each nomination submission count as a vote, or do you want a separate voting phase?

### Your Options

**Option A: Simple - Nominations ARE Votes** ⭐ Recommended
- When someone submits a nomination form, that counts as 1 vote
- The person with the most nominations wins each category
- No additional voting system needed
- **Winner selection:** Count nominations, highest number wins

**Example:** If John Doe receives 15 nominations for "CEO Award" and Jane Smith receives 8, John wins.

---

**Option B: Complex - Nominations + Separate Voting**
- Phase 1: Collect nominations (what we just built)
- Phase 2: You review and select 3-5 finalists per category
- Phase 3: Public votes on finalists (requires building a voting page)
- **Winner selection:** Based on votes, not nomination count

**Example:** John gets 15 nominations, you select him as a finalist. Then public votes, and he gets 200 votes vs Jane's 300 votes. Jane wins despite fewer nominations.

---

**Your Decision:** (check one)
- [ ] **Option A** - Nominations count as votes (simple, recommended)
- [ ] **Option B** - Separate voting phase after nominations

---

## Decision 2: What Features Do You Need?

### The Question
Do you need a basic table to view nominations, or a full-featured admin system?

### Your Options

**Option A: Basic Admin Table** ⭐ Recommended
- **Time to build:** 2-3 hours
- **What you get:**
  - View all nominations in a sortable table
  - See: Date, Category, Nominee Name, Nominator Name, Status
  - Click any row to see full nomination details (in a popup)
  - Search box (search across all fields)
  - Filter by award category dropdown
  - See how many nominations each person has
  - Export all data to CSV/Excel file
  - Sort by any column (date, category, name, etc.)
  - Shows results across multiple pages if many nominations

**Perfect if you:** Just need to view, search, and export nominations for your committee to review offline.

---

**Option B: Advanced Admin System**
- **Time to build:** 5-6 hours
- **Everything in Basic, PLUS:**
  - Approve/reject buttons for each nomination
  - Status badges (pending, approved, rejected, finalist)
  - Select multiple nominations and approve them all at once
  - Charts and graphs:
    - Bar chart: Nominations by category
    - Line chart: Nominations over time
    - Leaderboard: Top nominees
  - See all nominations for one person in one view
  - Add internal notes/comments (not visible to public)
  - Automatic duplicate detection warnings
  - Send email notifications to nominees
  - Rate/score nominations (1-5 stars)
  - Export only selected nominations (not just all)
  - Advanced filters (by date range, status, etc.)

**Perfect if you:** Need workflow management, want to track approval status, need analytics, or have multiple people reviewing nominations.

---

**Your Decision:** (check one)
- [ ] **Option A** - Basic table (2-3 hours, recommended for starting)
- [ ] **Option B** - Advanced system (5-6 hours)

**Note:** You can always start with Basic and add advanced features later!

---

## Decision 3: Where Should This Appear?

### The Question
Where in your admin panel should the nominations management appear?

### Your Options

**Option A: New Tab in Your Existing Admin Dashboard** ⭐ Recommended
- Adds an "Awards" tab next to your current "Applications" and "Members" tabs
- Consistent with your current admin interface design
- Easy to navigate between different admin sections
- All admin functions accessible from one dashboard

---

**Option B: Separate Admin Page**
- Creates a new page at `/admin/awards` or `/admin/nominations`
- Standalone page (like your current AdminManagement page)
- Add a link from your main admin dashboard to this page
- More separation, but requires extra navigation

---

**Option C: Add to AdminManagement Page**
- Adds nominations as a new section on your existing management page
- Everything in one place
- May become cluttered if you have many admin functions

---

**Your Decision:** (check one)
- [ ] **Option A** - New tab in dashboard (recommended)
- [ ] **Option B** - Separate page
- [ ] **Option C** - Add to AdminManagement

---

## Decision 4: What About Duplicate Nominations?

### The Question
What should happen if the same person is nominated multiple times for the same award?

### Scenario Example
- Jane submits a nomination for John Doe for "CEO Award"
- Mary also submits a nomination for John Doe for "CEO Award"

### Your Options

**Option A: Count Everything Separately** ⭐ Recommended for Simple
- Both nominations appear as separate rows in the table
- John has 2 nominations = 2 votes
- Easy to understand and implement
- **Use if:** Nominations = Votes (Decision 1, Option A)

---

**Option B: Group by Nominee**
- Nominations for the same person + category are grouped together
- John appears once with "2 nominations"
- Click to see all nominators who nominated him
- Shows: John Doe - CEO Award - 2 nominations (from Jane Smith, Mary Johnson)
- Better for viewing, slightly more complex

---

**Option C: Flag for Your Review**
- System detects potential duplicates
- Shows a warning badge: "⚠️ Possible duplicate"
- You manually review and decide to merge or keep separate
- Most flexible but requires your action for each duplicate

---

**Your Decision:** (check one)
- [ ] **Option A** - Count all separately (simple, recommended)
- [ ] **Option B** - Group nominations by nominee
- [ ] **Option C** - Flag duplicates for my review

---

## Decision 5: Should Nomination Data Be Public?

### The Question
Who should be able to see nomination counts and nominee names?

### Your Options

**Option A: Completely Private - Admin Only** ⭐ Recommended
- Only logged-in admins can see nominations
- No public leaderboard or counts visible
- You control when and how winners are announced
- Most professional and secure approach

---

**Option B: Public Leaderboard**
- Display top nominees on the /awards page
- Show nomination counts for each person
- Updates in real-time as nominations come in
- Can encourage more people to nominate
- **Requires:** Building a public leaderboard component

**Example:**
```
Top Nominees - CEO Award
1. John Doe - 15 nominations
2. Jane Smith - 8 nominations
3. Mark Johnson - 5 nominations
```

---

**Option C: Hybrid Approach**
- Keep nominations private during collection period
- You review and select finalists (manually or by count)
- Display finalists publicly (without showing counts)
- If using separate voting (Decision 1, Option B), show voting counts publicly

---

**Your Decision:** (check one)
- [ ] **Option A** - Private, admin only (recommended)
- [ ] **Option B** - Public leaderboard
- [ ] **Option C** - Hybrid (private collection, public finalists)

---

## Our Recommendation: Quick Start Approach

If you want to get this working quickly and refine later based on actual usage, we recommend:

### ✅ Recommended Decisions

**Decision 1:** Option A - Nominations = Votes
*Simple vote counting, no separate voting phase needed*

**Decision 2:** Option A - Basic Admin Table
*Get core functionality working, enhance later if needed*

**Decision 3:** Option A - New tab in AdminDashboard
*Consistent with your existing admin design*

**Decision 4:** Option A - Count all separately
*Simple and clear counting*

**Decision 5:** Option A - Completely private
*Professional and secure, you control announcements*

### What You Get with Quick Start
- Working admin panel in 2-3 hours
- View all nominations in sortable table
- Search and filter functionality
- See nomination counts per person
- Export data to CSV for your committee
- Click any row to see full details
- Professional, secure, and private

### You Can Add Later (If Needed)
- Approval workflow and status tracking
- Charts and analytics
- Email notifications
- Public leaderboard
- Duplicate detection
- Rating system

---

## How to Respond

### Option 1: Use Quick Start (Fastest)
Simply reply:
> "Use the Quick Start approach"

We'll implement the basic admin table with all recommended settings. Estimated time: 2-3 hours.

---

### Option 2: Custom Decisions
Fill in your choices for each decision above and reply with:

> **Decision 1:** [Option A/B]
> **Decision 2:** [Option A/B]
> **Decision 3:** [Option A/B/C]
> **Decision 4:** [Option A/B/C]
> **Decision 5:** [Option A/B/C]

---

### Option 3: Discuss First
If you have questions or want to discuss options, we're happy to explain any of these in more detail before you decide.

---

## Timeline Estimates

**Quick Start (Basic Table):** 2-3 hours
**Advanced System:** 5-6 hours
**Adding Public Leaderboard:** +1-2 hours
**Adding Separate Voting Phase:** +3-4 hours

---

## Questions?

If anything is unclear or you need more information about any option, please ask! We want to make sure the admin panel works exactly how you need it.

---

**Next Steps:**
1. Review this document
2. Make your decisions (or choose Quick Start)
3. Reply with your choices
4. We'll implement the admin panel

**Contact:** [Your contact information]
**Reference:** tasks/admin-awards-management-plan.md (technical details)
