# Specification: Schedule Grid

## Intent
Improve grid usability and scroll stability, provide a chronological list view of activities without time gaps, and dynamically greet the user based on their saved username in Neutral Spanish.

## Requirements

### 1. Chronological Agenda List View
- The Schedule screen MUST display a toggle control (e.g. icon button) to switch the display mode between:
  - **Grid View**: A 24-hour time block grid showing activities at their exact times with vertical spacing and gaps representing free time.
  - **Chronological/Agenda View**: A sequential list of activities ordered by start time, without vertical space gaps or hour rows representing empty periods.
- In Chronological View, if no activities are scheduled for the selected day, a friendly empty-state layout MUST be shown.
- The Chronological list items MUST render clearly, detailing name, time range, priority, and difficulty.

### 2. Scroll and Height Constraints
- The calendar Grid View scroll container MUST behave correctly under vertical scrolling, ensuring no overlapping cards or layout breaks.
- Flexbox layouts and height bounds MUST be set properly so the scroll view fits nicely inside all mobile screens.

### 3. Dynamic User Greeting and Localization
- On the Home screen (`HomeView.tsx`), the greeting text MUST dynamically display the user's username retrieved from the global app state (e.g., "Hola, {username}. Tu día está listo.") instead of the hardcoded name "Mario".
- The confirmation dialogs and prompt copy on the Home screen MUST use Neutral Spanish.
- Specifically, the following Argentinian conjugation MUST be replaced:
  - "querés" -> "quieres" (e.g. "Estás seguro de que quieres actualizar tu horario...")

---

## Scenarios

### Scenario 1: Toggling between Grid and Chronological view (Happy Path)
- **Given** the user is viewing their generated schedule on the Schedule tab
- **When** the user taps the view mode toggle button
- **Then** the view MUST switch from the 24-hour Grid View to the Chronological Agenda List View
- **And** the list MUST display the scheduled activities sequentially (e.g. 10:00 to 11:30 Class, immediately followed by 12:00 to 13:00 Work) with no empty space gaps between them
- **When** the user taps the toggle button again
- **Then** the view MUST switch back to the 24-hour Grid View showing the 10:00-11:30 and 12:00-13:00 blocks separated by an empty space representing the free hour (11:30 to 12:00)

### Scenario 2: Chronological View Empty State (Edge Case)
- **Given** the user is viewing the Chronological Agenda List View on a day with no activities scheduled (e.g., "Domingo")
- **When** that day is selected
- **Then** the list MUST show an empty state indicating that there are no activities scheduled for that day, instead of showing a blank screen or crashing

### Scenario 3: Dynamic User Greeting on Home screen (Happy Path)
- **Given** the user completed onboarding with username "Lucía"
- **When** the user navigates to the Home screen
- **Then** the top greeting header MUST display: "Hola, Lucía. Tu día está listo."
