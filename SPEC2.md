Spec v2: Reconcile Check
## What it does
Creates a connected record for each school and grant, with a structured status alongside Renée’s visit notes.

For each school, the record connects the grant agreement, what was promised, what was paid, the school’s key grant metric, and Renée’s visit information. This gives Stacy a single source of truth and a quick view of where each school stands without replacing Renée’s detailed notes.

Each school is identified by a unique SchoolNumber, which connects the school, grant, payment, test data, and visit records.

## Inputs
School and grant information:
School name
Unique SchoolNumber
Grant agreement
What was promised
What was paid
Test data:
Enrollment-Weighted Average Residual for each school with available test data
Renée’s visit information:
data/visit-notes.csv
SchoolNumber
visit_date
notes

## Outputs
For each school Renée has visited, display:

School name and SchoolNumber
Grant information
Grant agreement
What was promised
What was paid
Key grant metric:
Enrollment-Weighted Average Residual
Status:
On Track when the residual is ≥ 0
Off Track when the residual is < 0
Renée’s original visit information:
Visit date
Original visit notes

Renée’s notes should be displayed as provided and should not be replaced, summarized, or modified.

If required test data is unavailable, do not infer an On Track or Off Track status.

Dashboard:
The connected school record should be presented as an interactive dashboard rather than a long static page.

Each school should have a clear dashboard view with multiple tabs that organize the connected information.

Suggested tabs:
Overview — school identity, current status, key metric, and high-level grant information

Grant — grant agreement, what was promised, and what was paid

Progress — Enrollment-Weighted Average Residual and On Track / Off Track status

Visit Notes — the already-built Renée notes section, incorporated as a dashboard tab without removing or changing its existing functionality


The dashboard should include functional buttons and interactions where useful, such as:
Switching between tabs
Searching for a school
Opening the grant agreement
Viewing related payment information
Returning to the school overview
Clearly navigating back to the school list

Interactive elements should perform their stated actions rather than being decorative.

Vibe & Experience:
The overall experience should feel corporate and trustworthy, but still warm, approachable, and fun enough to feel at home in a school environment.

The design should balance:
Corporate: clean, organized, polished, credible, and easy to scan
School: friendly, human, approachable, and not overly formal
Fun: subtle color, visual hierarchy, friendly micro-interactions, and small moments of personality without becoming playful or childish


The dashboard should feel like a tool that Stacy and the team would genuinely want to use every day—not a generic database interface.

Visual direction:
Clean dashboard layout with clear sections and strong hierarchy
Professional typography and spacing
Friendly but restrained color palette
Use color intentionally to make status easy to understand
On Track and Off Track should be immediately recognizable
Cards, tabs, badges, and progress indicators can be used to make information easy to scan
Avoid excessive decoration, cartoonish graphics, or anything that makes the tool feel like a children's application
Prioritize readability and usability over visual effects


Interaction direction:
Interactions should feel responsive and purposeful.

For example:
Tabs should switch content without unnecessarily navigating away from the school record.
Status should be visually prominent on the Overview.
Grant and payment information should be easy to reach without overwhelming the main view.
The Visit Notes tab should preserve the existing notes experience.
Buttons should have clear labels and obvious outcomes.
Hover, selected, and active states should make navigation understandable.
The dashboard should feel polished enough for a funder-facing environment while still feeling approachable to the people working with schools every day.

## Done when
Stacy can search for a school and find its grant agreement, payment information, key metric, status, and Renée’s visit notes in one connected dashboard.

The system is complete when:
Each school is identified by a unique SchoolNumber.
SchoolNumber connects the grant, payment, test, and visit records.
Only schools with a Renée visit record are shown.
Renée’s notes come from data/visit-notes.csv.
The existing notes section is preserved and available as the Visit Notes dashboard tab.
Every displayed school with test data has an On Track or Off Track status based on the defined residual rule.
Stacy can navigate between the Overview, Grant, Progress, and Visit Notes tabs.
Dashboard buttons and interactions are functional.
The grant agreement and related payment information are accessible from the connected school record.
Renée’s original notes remain unchanged.
Stacy can review the status from her desk without needing to ask Renée in person or wait for her to return from a visit.
No manual matching of school names is required to connect the records.
The overall interface feels professional, school-friendly, approachable, and polished.


