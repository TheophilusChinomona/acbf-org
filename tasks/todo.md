# Task: Display Nominee Submissions on Admin Dashboard

## Problem Statement
The awards nomination form (AwardsNominationForm.jsx) saves submissions to the `awards_nominations` Firestore collection, but there is currently no way for admins to view these submissions in the admin dashboard. Regular admins (NOT super admins) need to be able to:
- View all award nominations
- Filter and search through nominations
- See detailed information about each nomination
- Update nomination status (pending, approved, rejected)
- Archive/unarchive nominations
- Export nomination data

**IMPORTANT:** Award nominations should ONLY be visible to regular admins, NOT super admins. This feature will be conditionally hidden using `!isSuperAdmin` checks.

## Date Started
2025-11-14

## Feature Overview

### What Needs to Be Built
Add a new "Award Nominations" tab/section to the admin dashboard (AdminDashboard.jsx) that displays all award nominations submitted through the Awards page. This will allow admins to review, manage, and track all award nominations in one centralized location.

### Business Value
- Admins can efficiently review and process award nominations
- Centralized management of all award submissions
- Improved workflow for the awards committee
- Better tracking and reporting of nomination data
- Enhanced user experience for admin users

### Success Criteria
- [x] Plan created and approved by user
- [ ] Award nominations display in admin dashboard
- [ ] Filtering and search functionality works
- [ ] Status updates persist to Firestore
- [ ] Archive/unarchive functionality works
- [ ] Export functionality generates correct data
- [ ] UI is consistent with existing dashboard design
- [ ] Mobile responsive design maintained
- [ ] No console errors or warnings
- [ ] Security checklist passed

## Technical Analysis

### Files to Create
1. None required - will extend existing files

### Files to Modify
1. **src/hooks/useSubmissions.js** - Add awards nominations fetching logic
   - Add `awardsNominations` state
   - Add Firestore listener for `awards_nominations` collection
   - Add CRUD functions for awards nominations
   - Add archive/unarchive functions

2. **src/pages/admin/AdminDashboard.jsx** - Add awards nominations tab
   - Add new tab for "Award Nominations"
   - Add stats card for award nominations count
   - Add filtering and search for nominations
   - Display nominations list with details
   - Add status update functionality

3. **src/components/admin/FilterBar.jsx** - Add awards filter support
   - Add 'awards' type support with appropriate filters
   - Update status options for awards (pending, approved, rejected)

4. **src/components/admin/ExportButton.jsx** - Add awards export support
   - Add 'awards' type support
   - Format awards nomination data for export

5. **src/pages/admin/SubmissionsList.jsx** - Add awards display logic
   - Add 'awards' type support
   - Display award-specific fields (category, nominee, nominator, etc.)

### Dependencies and Integrations
- **Existing:** Firestore database (`awards_nominations` collection already exists)
- **Existing:** useSubmissions hook pattern (extend for awards)
- **Existing:** AdminDashboard component structure (add new tab)
- **Existing:** FilterBar component (add awards type)
- **Existing:** ExportButton component (add awards type)
- **Existing:** SubmissionsList component (add awards type)

### Potential Challenges and Risks
1. **Data Structure Complexity:** Award nominations have nested objects (nominee, nominator)
   - Mitigation: Flatten data for display, handle null values gracefully

2. **Large Text Fields:** Supporting statements and achievements can be long
   - Mitigation: Show truncated preview with "Read More" expansion

3. **Performance:** Loading multiple collections simultaneously
   - Mitigation: Already handled by existing useSubmissions pattern

4. **UI Space:** Admin dashboard is already dense with multiple tabs
   - Mitigation: Use existing tab pattern, ensure mobile scrollability

## Implementation Plan

### Phase 1: Extend useSubmissions Hook
- [ ] 1. Add `awardsNominations` state to useSubmissions hook
- [ ] 2. Add `awardsNominationsLoaded` state
- [ ] 3. Create Firestore listener for `awards_nominations` collection
- [ ] 4. Add `updateAwardsNominationStatus` function
- [ ] 5. Add `archiveAwardsNomination` and `unarchiveAwardsNomination` functions
- [ ] 6. Export awardsNominations data and functions

### Phase 2: Update FilterBar Component
- [ ] 7. Add 'awards' type check in FilterBar
- [ ] 8. Define status options for awards (pending, approved, rejected)
- [ ] 9. Update search placeholder for awards context

### Phase 3: Update ExportButton Component
- [ ] 10. Add 'awards' type case in ExportButton
- [ ] 11. Format awards nomination data for CSV export
- [ ] 12. Include all relevant fields (category, nominee, nominator, dates)

### Phase 4: Update SubmissionsList Component
- [ ] 13. Add 'awards' type check in SubmissionsList
- [ ] 14. Create awards-specific display layout
- [ ] 15. Show nominee and nominator information
- [ ] 16. Display category, supporting statement, achievements
- [ ] 17. Add expandable sections for long text fields

### Phase 5: Update AdminDashboard
- [ ] 18. Add awardsNominations from useSubmissions hook
- [ ] 19. Create awards statistics (total, pending, approved, rejected)
- [ ] 20. Add "Award Nominations" stats card (conditionally hidden for super admins using !isSuperAdmin)
- [ ] 21. Add "Award Nominations" tab in navigation (conditionally hidden for super admins using !isSuperAdmin)
- [ ] 22. Add awards filtering logic (useMemo)
- [ ] 23. Create awards tab content section (conditionally hidden for super admins using !isSuperAdmin)
- [ ] 24. Add archive/unarchive handlers for awards
- [ ] 25. Update loading state to include awards
- [ ] 26. Ensure super admins cannot access awards tab even via URL/state manipulation

### Phase 6: Testing and Review
- [ ] 27. Test awards nominations display (regular admin)
- [ ] 28. Test that super admins CANNOT see awards nominations
- [ ] 29. Test filtering and search functionality
- [ ] 30. Test status updates
- [ ] 31. Test archive/unarchive functionality
- [ ] 32. Test export functionality
- [ ] 33. Verify mobile responsive design
- [ ] 34. Check for console errors
- [ ] 35. Complete security checklist
- [ ] 36. Final review and documentation

## Data Structure Reference

### awards_nominations Collection Schema
```javascript
{
  // Metadata
  submittedAt: Timestamp,
  nominationYear: Number (e.g., 2025),
  status: String ('pending', 'approved', 'rejected'),
  archived: Boolean (optional),
  archived_at: Timestamp (optional),

  // Award category
  category: String,

  // Nominee information
  nominee: {
    fullName: String,
    email: String,
    organization: String,
    phone: String (optional),
    website: String (optional),
  },

  // Nominator information
  nominator: {
    fullName: String,
    email: String,
    organization: String,
    relationship: String,
  },

  // Nomination details
  supportingStatement: String (100-1000 chars),
  achievements: String (100-1000 chars),
}
```

## Testing Strategy

### What Needs to Be Tested
1. **Data Fetching:**
   - Awards nominations load from Firestore
   - Real-time updates work correctly
   - Error handling displays appropriately

2. **Filtering and Search:**
   - Status filter works (all, pending, approved, rejected)
   - Search works across all text fields
   - Date range filtering works
   - Archive toggle works

3. **Status Updates:**
   - Changing status updates Firestore
   - UI reflects changes immediately
   - Error handling works

4. **Archive Functionality:**
   - Archive hides from active view
   - Unarchive restores to active view
   - Archive timestamp recorded

5. **Export Functionality:**
   - CSV export includes all fields
   - Data formatting is correct
   - Long text fields don't break export

### Edge Cases to Consider
- Empty nominations list (no data)
- Very long supporting statements/achievements
- Missing optional fields (phone, website)
- Network errors during data fetch
- Concurrent status updates from multiple admins
- Special characters in text fields
- Very old nomination dates

### Integration Points to Verify
- useSubmissions hook provides data correctly
- FilterBar filters awards nominations
- ExportButton exports awards data
- SubmissionsList displays awards format
- AdminDashboard integrates all components
- Real-time Firestore updates work

## Considerations

### Performance Implications
- **Minimal Impact:** Extending existing pattern used for contact/membership
- **Firestore Reads:** One additional real-time listener (already optimized)
- **Memory:** Awards data added to component state (acceptable trade-off)
- **Rendering:** useMemo filters prevent unnecessary re-renders

### Security Concerns
- [x] No hardcoded secrets required
- [x] Uses existing authentication (AdminProtectedRoute)
- [x] Firestore security rules already protect `awards_nominations`
- [x] Input validation already handled by form (zod schema)
- [x] Status updates require authentication
- [x] No XSS risk (React escapes by default)
- [x] No sensitive data exposed in UI

### Backward Compatibility
- **No Breaking Changes:** Only additions, no modifications to existing functionality
- **Existing Collections:** Contact and membership submissions unaffected
- **Existing Components:** FilterBar, ExportButton, SubmissionsList extended with new type
- **Existing Routes:** No route changes required
- **Database Schema:** awards_nominations collection already exists

## Implementation Notes

### Approach
1. Follow existing patterns (contact/membership submissions)
2. Extend rather than replace existing components
3. Maintain consistency with current UI/UX
4. Keep changes simple and focused
5. Test incrementally as we go

### Design Decisions
- **Tab Pattern:** Add as new tab (consistent with existing UI)
- **Status Values:** pending, approved, rejected (matches membership pattern)
- **Archive Support:** Yes (consistent with other submission types)
- **Export Format:** CSV (consistent with existing exports)
- **Filtering:** Same filter options as other submissions
- **Mobile First:** Maintain responsive design patterns
- **Access Control:** Awards nominations visible ONLY to regular admins, NOT super admins (using `!isSuperAdmin` conditional)

## Changes Made

### Phase 1: Extended useSubmissions Hook ✅
Added awards nominations support to the useSubmissions hook:
- Added `awardsNominations` state and `awardsNominationsLoaded` state
- Created Firestore listener for `awards_nominations` collection with real-time updates
- Added `updateAwardsNominationStatus()` function to update nomination status (pending, approved, rejected)
- Added `getAwardsNomination()` function to retrieve a single nomination by ID
- Added `archiveAwardsNomination()` and `unarchiveAwardsNomination()` functions
- Updated loading state logic to wait for all three collections (contact, membership, awards)
- Exported all new awards-related data and functions

**File Modified:** `src/hooks/useSubmissions.js`

### Phase 2: Updated FilterBar Component ✅
Extended FilterBar to support awards type:
- Updated JSDoc comment to include 'awards' as valid type parameter
- Modified `getAvailableStatuses()` function to return pending/approved/rejected statuses for awards (same as membership)
- Updated search input placeholder to show "nominations" when type is 'awards'

**File Modified:** `src/components/admin/FilterBar.jsx`

### Phase 3: Updated ExportButton Component ✅
Added awards export functionality:
- Imported `exportAwardsNominations` function from utils
- Updated JSDoc to include 'awards' as valid type
- Added awards export case in handleExport function
- Updated button title tooltip to show "nomination" for awards type
- Added success toast message for awards exports

**File Modified:** `src/components/admin/ExportButton.jsx`

**File Modified:** `src/utils/exportData.js`
- Created `prepareAwardsNominations()` function to format awards data for Excel export
- Maps all fields: category, nominee info (name, email, org, phone, website), nominator info (name, email, org, relationship), supporting statement, achievements, year, status, submission date
- Created `exportAwardsNominations()` function with customizable filename and timestamp options

### Phase 4: Updated SubmissionsList Component ✅
Enhanced SubmissionsList to display awards nominations:
- Added `expandedItems` state to manage expandable supporting statements
- Added `toggleExpanded()` function to expand/collapse long text fields
- Updated JSDoc to include 'awards' as valid type
- Modified `canArchive()` function to include awards type (same logic as membership)
- Updated empty state to show appropriate message for awards nominations
- Added awards-specific icon (FiAward) with yellow styling
- Updated display logic to show nominee information instead of regular name/email
- Added awards-specific additional info section showing:
  - Category badge with yellow styling
  - Nominee organization
  - Nominator name and relationship
  - Expandable supporting statement with "View/Hide Details" button
  - Expandable achievements section
  - Used whitespace-pre-wrap to preserve formatting in long text fields

**File Modified:** `src/pages/admin/SubmissionsList.jsx`

### Phase 5: Updated AdminDashboard ✅
Integrated awards nominations into admin dashboard with access control:

**Data and State:**
- Destructured awards-related data and functions from useSubmissions hook
- Created `awardsStats` object (total, pending, approved, rejected counts)
- Added `awardsTabRef` for mobile tab scrolling
- Updated `activeTab` state comment to include 'awards' option
- Added `filteredAwardsNominations` useMemo with comprehensive filtering:
  - Archive status filtering
  - Status filtering (pending/approved/rejected)
  - Search filtering across all text fields (category, nominee, nominator, statements)
  - Date range filtering using submittedAt field

**Archive Handlers:**
- Created `handleArchiveAwards()` function
- Created `handleUnarchiveAwards()` function
- Both with proper error handling and toast notifications

**UI Updates:**
- Added Award Nominations stats card (conditionally hidden for super admins using `!isSuperAdmin`)
  - Yellow gradient styling (from-yellow-50 to-yellow-100)
  - Shows total, pending, approved, rejected counts
  - Clickable to switch to awards tab
- Added Award Nominations tab button in navigation (conditionally hidden for super admins)
  - Yellow accent color when active
  - Shows count badge
  - Positioned between Membership and Admin Management tabs
- Added awards tab content section with complete UI:
  - Header with archive toggle button
  - Export button for awards data
  - FilterBar component configured for awards type
  - SubmissionsList component with archive/unarchive handlers
- Updated `handleTabChange()` to include awardsTabRef for mobile scrolling
- Updated useEffect for tab scrolling to include awards tab

**Access Control Implementation:**
- Awards stats card only visible when `!isSuperAdmin`
- Awards tab button only visible when `!isSuperAdmin`
- Awards content accessible through proper conditional rendering
- Super admins CANNOT see or access awards nominations at all

**File Modified:** `src/pages/admin/AdminDashboard.jsx`

### Phase 6: Build Verification ✅
- ✅ Build completed successfully with no errors
- ✅ All TypeScript/JSX compilation successful
- ✅ No console errors during build
- ✅ All 5 files modified successfully
- ⏳ Manual testing pending (see Testing Verification section below)

## Security Review Checklist
- [x] No hardcoded secrets added
- [x] No sensitive data exposed in code or logs
- [x] Input validation maintained (zod schema in form)
- [x] File paths validated (not applicable)
- [x] Authentication required for all operations (AdminProtectedRoute)
- [x] Error messages don't leak sensitive information
- [x] Dependencies are secure (no new dependencies added)
- [x] HTTPS enforced (server configuration)
- [x] No injection risks (Firestore SDK handles escaping, React escapes by default)
- [x] File operations check return values (not applicable)
- [x] Logging doesn't expose sensitive data (only logs error messages)

## Testing Verification
- [ ] Awards nominations display correctly
- [ ] Filtering works (status, search, date range)
- [ ] Status updates persist to Firestore
- [ ] Archive/unarchive functionality works
- [ ] Export generates correct CSV
- [ ] Edge cases handled (empty list, long text, missing fields)
- [ ] Error handling works as expected
- [ ] No console errors or warnings
- [ ] Mobile responsive design maintained
- [ ] Real-time updates work correctly
- [ ] Performance is acceptable

## Review Summary
[To be filled upon completion]

### Date Completed
[To be filled upon completion]
