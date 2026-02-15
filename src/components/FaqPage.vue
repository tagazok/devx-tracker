<script setup lang="ts">
// FaqPage.vue — Static FAQ page component
// No props, no emits, purely presentational

const sections = [
  { id: 'tabs-overview', emoji: '📑', title: 'Tabs Overview' },
  { id: 'status-grouping', emoji: '📊', title: 'Status Grouping' },
  { id: 'activity-heatmap', emoji: '🗓️', title: 'Activity Heatmap' },
] as const
</script>

<template>
  <div class="faq-page">
    <header class="faq-header">
      <h1 class="faq-title">Frequently Asked Questions</h1>
      <p class="faq-intro">
        This page explains how the dashboard works — from ticket fields and status grouping
        to filters, labels, and the activity heatmap. Use the table of contents below to
        jump to a specific topic.
      </p>
    </header>

    <nav class="toc" aria-label="Table of contents">
      <h2 class="toc-heading">Contents</h2>
      <ul class="toc-list">
        <li v-for="s in sections" :key="s.id" class="toc-item">
          <a :href="'#' + s.id" class="toc-link">{{ s.emoji }} {{ s.title }}</a>
        </li>
      </ul>
    </nav>

    <!-- Tabs Overview -->
    <section id="tabs-overview" class="faq-section">
      <h2 class="section-heading">📑 Tabs Overview</h2>
      <p class="section-text">
        The dashboard organizes content into tabs. Each tab applies different filtering criteria
        or shows a different type of data. Below is a summary of every tab and what it displays.
      </p>

      <div class="tabs-cards">
        <div class="tab-card">
          <div class="tab-card-header">
            <span class="tab-card-name">All Activities</span>
          </div>
          <p class="tab-card-desc">
            Shows <strong>all tickets</strong> without any label-based filtering. Every ticket
            in the dataset appears here regardless of its labels. Use the filter bar to narrow
            results by assignee, organizer, engagement type, CFP status, co-speaker, or date range.
          </p>
          <div class="tab-card-meta">
            <span class="tab-meta-label">Data source:</span> All tickets
          </div>
          <div class="tab-card-meta">
            <span class="tab-meta-label">Filtering:</span> None (shows everything)
          </div>
        </div>

        <div class="label-effect-card label-effect-cfp">
          <div class="label-effect-header">
            <span class="label-effect-tab">3P Conferences Goals</span>
          </div>
          <p class="label-effect-desc">
            Applying either <code>CFP_Submitted: Yes</code> or <code>CFP_Accepted: Yes</code>
            causes a ticket to appear in the <strong>3P Conferences Goals</strong> tab. This tab
            is specifically designed to track conference CFP submissions and acceptances. A ticket
            needs at least one of these two labels to be included.
          </p>
          <div class="label-effect-labels">
            <span class="label-pill label-pill-cfp">CFP_Submitted: Yes</span>
            <span class="label-pill label-pill-cfp">CFP_Accepted: Yes</span>
          </div>
        </div>

        <div class="label-effect-card label-effect-students">
          <div class="label-effect-header">
            <span class="label-effect-tab">Students Activities</span>
          </div>
          <p class="label-effect-desc">
            Applying the <code>Segment: Students</code> label causes a ticket to appear in the
            <strong>Students Activities</strong> tab. This tab focuses on activities targeting
            student audiences. Only tickets carrying this specific label are included.
          </p>
          <div class="label-effect-labels">
            <span class="label-pill label-pill-segment">Segment: Students</span>
          </div>
        </div>

        <!-- <div class="tab-card">
          <div class="tab-card-header">
            <span class="tab-card-name">Statistics</span>
          </div>
          <p class="tab-card-desc">
            Computes and displays <strong>aggregate data</strong> from all tickets. Instead of
            listing individual tickets, this tab shows summary metrics, charts, and breakdowns
            across the entire dataset.
          </p>
          <div class="tab-card-meta">
            <span class="tab-meta-label">Data source:</span> All tickets (aggregated)
          </div>
          <div class="tab-card-meta">
            <span class="tab-meta-label">Filtering:</span> N/A — shows computed statistics
          </div>
        </div> -->

        <!-- <div class="tab-card">
          <div class="tab-card-header">
            <span class="tab-card-name">Community Goals</span>
          </div>
          <p class="tab-card-desc">
            Displays <strong>meetup data</strong> and is independent of ticket data. This tab
            pulls from a separate data source (meetups) and does not rely on SIM tickets at all.
          </p>
          <div class="tab-card-meta">
            <span class="tab-meta-label">Data source:</span> Meetup data (not tickets)
          </div>
          <div class="tab-card-meta">
            <span class="tab-meta-label">Filtering:</span> N/A — independent data source
          </div>
        </div> -->

        <!-- <div class="tab-card">
          <div class="tab-card-header">
            <span class="tab-card-name">FAQ</span>
          </div>
          <p class="tab-card-desc">
            This documentation page. Provides help and reference material for understanding
            the dashboard, ticket fields, filters, labels, and all other features.
          </p>
          <div class="tab-card-meta">
            <span class="tab-meta-label">Data source:</span> Static content
          </div>
          <div class="tab-card-meta">
            <span class="tab-meta-label">Filtering:</span> N/A
          </div>
        </div> -->
      </div>

      <h3 class="subsection-heading">Tab Summary</h3>
      <p class="section-text">
        The table below provides a quick reference for each tab's data source and filtering criteria:
      </p>
      <table class="field-table">
        <thead>
          <tr>
            <th>Tab</th>
            <th>Data Source</th>
            <th>Filter Criteria</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td><strong>All Activities</strong></td>
            <td>All tickets</td>
            <td>None — shows all tickets</td>
          </tr>
          <tr>
            <td><strong>3P Conferences Goals</strong></td>
            <td>Filtered tickets</td>
            <td>Label: <code>CFP_Submitted: Yes</code> or <code>CFP_Accepted: Yes</code></td>
          </tr>
          <tr>
            <td><strong>Students Activities</strong></td>
            <td>Filtered tickets</td>
            <td>Label: <code>Segment: Students</code></td>
          </tr>
          <!-- <tr>
            <td><strong>Statistics</strong></td>
            <td>All tickets (aggregated)</td>
            <td>N/A — computes aggregate data</td>
          </tr>
          <tr>
            <td><strong>Community Goals</strong></td>
            <td>Meetup data</td>
            <td>N/A — independent of ticket data</td>
          </tr> -->
          <!-- <tr>
            <td><strong>FAQ</strong></td>
            <td>Static content</td>
            <td>N/A</td>
          </tr> -->
        </tbody>
      </table>
    </section>

    <!-- Status Grouping -->
    <section id="status-grouping" class="faq-section">
      <h2 class="section-heading">📊 Status Grouping</h2>
      <p class="section-text">
        Tickets on the dashboard are organized into three columns based on their workflow status.
        Each column represents a stage in the ticket lifecycle: <strong>Backlog</strong>,
        <strong>Accepted</strong>, and <strong>Resolved</strong>.
      </p>

      <h3 class="subsection-heading">The Three Status Groups</h3>

      <div class="status-groups">
        <div class="status-group status-group-backlog">
          <div class="status-group-header">
            <span class="status-badge badge-backlog">Backlog</span>
          </div>
          <p class="status-group-desc">
            Tickets that have been created but not yet picked up. These are waiting to be reviewed or acted upon.
          </p>
          <ul class="status-group-values">
            <li>Status: <code>Assigned</code></li>
            <li>Status: <code>Under Consideration</code></li>
          </ul>
        </div>

        <div class="status-group status-group-accepted">
          <div class="status-group-header">
            <span class="status-badge badge-accepted">Accepted</span>
          </div>
          <p class="status-group-desc">
            Tickets that are actively being worked on or have been accepted for action.
          </p>
          <ul class="status-group-values">
            <li>computedPendingReason: <code>Accepted</code></li>
            <li>computedPendingReason: <code>In Progress</code></li>
            <li>Status: <code>In Progress</code></li>
          </ul>
        </div>

        <div class="status-group status-group-resolved">
          <div class="status-group-header">
            <span class="status-badge badge-resolved">Resolved</span>
          </div>
          <p class="status-group-desc">
            Tickets that have been completed and closed.
          </p>
          <ul class="status-group-values">
            <li>Status: <code>Resolved</code></li>
          </ul>
        </div>
      </div>

      <h3 class="subsection-heading">Status-to-Column Mapping</h3>
      <p class="section-text">
        The table below shows exactly which ticket field values place a ticket into each column:
      </p>
      <table class="field-table status-mapping-table">
        <thead>
          <tr>
            <th>Column</th>
            <th>Field</th>
            <th>Value</th>
          </tr>
        </thead>
        <tbody>
          <tr class="status-row-backlog">
            <td><span class="status-badge badge-backlog">Backlog</span></td>
            <td>status</td>
            <td><code>Assigned</code></td>
          </tr>
          <tr class="status-row-backlog">
            <td><span class="status-badge badge-backlog">Backlog</span></td>
            <td>status</td>
            <td><code>Under Consideration</code></td>
          </tr>
          <tr class="status-row-accepted">
            <td><span class="status-badge badge-accepted">Accepted</span></td>
            <td>computedPendingReason</td>
            <td><code>Accepted</code></td>
          </tr>
          <tr class="status-row-accepted">
            <td><span class="status-badge badge-accepted">Accepted</span></td>
            <td>computedPendingReason</td>
            <td><code>In Progress</code></td>
          </tr>
          <tr class="status-row-accepted">
            <td><span class="status-badge badge-accepted">Accepted</span></td>
            <td>status</td>
            <td><code>In Progress</code></td>
          </tr>
          <tr class="status-row-resolved">
            <td><span class="status-badge badge-resolved">Resolved</span></td>
            <td>status</td>
            <td><code>Resolved</code></td>
          </tr>
        </tbody>
      </table>

      <h3 class="subsection-heading">How It Works</h3>
      <p class="section-text">
        When a ticket is loaded, the dashboard checks its <code>status</code> and
        <code>computedPendingReason</code> fields and assigns it to the matching column.
        A ticket with status <code>In Progress</code> or a <code>computedPendingReason</code>
        of <code>Accepted</code> or <code>In Progress</code> lands in the Accepted column.
        Tickets with status <code>Assigned</code> or <code>Under Consideration</code> go to
        Backlog, and tickets with status <code>Resolved</code> go to Resolved.
      </p>
    </section>

    <!-- Activity Heatmap -->
    <section id="activity-heatmap" class="faq-section">
      <h2 class="section-heading">🗓️ Activity Heatmap</h2>
      <p class="section-text">
        The Activity Heatmap visualizes ticket dates on a calendar grid, giving you a quick
        overview of when activities are scheduled throughout the year. Each cell in the grid
        represents a single day, and the color intensity reflects how many tickets fall on
        that date — darker cells mean more activity.
      </p>

      <h3 class="subsection-heading">Data Source</h3>
      <p class="section-text">
        The heatmap reads from the custom date field <code>date</code> on each ticket. This is
        the same field used by the Date Range filter and displayed on ticket cards. If a ticket
        does not have a <code>date</code> value, it will not appear on the heatmap.
      </p>

      <h3 class="subsection-heading">Click-to-Filter</h3>
      <p class="section-text">
        The heatmap is interactive. Clicking a date on the heatmap filters the ticket list to
        show only tickets that fall on that specific day. This lets you quickly drill down into
        a single day's activities without manually setting a date range.
      </p>

      <h3 class="subsection-heading">Click-Again-to-Clear</h3>
      <p class="section-text">
        Clicking the same date again clears the date filter and returns the ticket list to its
        previous unfiltered state. This toggle behavior means you can explore individual days
        and return to the full view with a single click — no need to reset filters manually.
      </p>

      <h3 class="subsection-heading">Quick Reference</h3>
      <table class="field-table">
        <thead>
          <tr>
            <th>Action</th>
            <th>Result</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Click a date cell</td>
            <td>Filters the ticket list to show only tickets on that day</td>
          </tr>
          <tr>
            <td>Click the same date again</td>
            <td>Clears the date filter (shows all tickets again)</td>
          </tr>
          <tr>
            <td>Hover over a cell</td>
            <td>Shows the date and ticket count for that day</td>
          </tr>
        </tbody>
      </table>
    </section>
  </div>
</template>

<style scoped>
.faq-page {
  display: flex;
  flex-direction: column;
  gap: 32px;
  max-width: 900px;
  margin: 0 auto;
  padding: 8px 0;
  font-family: system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif;
  color: #1e293b;
}

/* Header */
.faq-header {
  margin-bottom: 8px;
}

.faq-title {
  font-size: 1.6rem;
  font-weight: 700;
  color: #1e293b;
  margin: 0 0 12px 0;
}

.faq-intro {
  font-size: 0.95rem;
  line-height: 1.6;
  color: #475569;
  margin: 0;
}

/* Table of Contents */
.toc {
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  padding: 20px 24px;
}

.toc-heading {
  font-size: 1rem;
  font-weight: 600;
  color: #334155;
  margin: 0 0 12px 0;
}

.toc-list {
  margin: 0;
  padding-left: 20px;
  display: flex;
  flex-direction: column;
  gap: 6px;
  list-style: none;
}

.toc-item {
  font-size: 0.9rem;
}

.toc-link {
  color: #2563eb;
  text-decoration: none;
  transition: color 0.15s ease;
}

.toc-link:hover {
  color: #1d4ed8;
  text-decoration: underline;
}

/* Sections */
.faq-section {
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  padding: 24px;
}

.section-heading {
  font-size: 1.15rem;
  font-weight: 600;
  color: #1e293b;
  margin: 0 0 12px 0;
}

.section-placeholder {
  font-size: 0.9rem;
  color: #94a3b8;
  font-style: italic;
  margin: 0;
}

/* Section text */
.section-text {
  font-size: 0.9rem;
  line-height: 1.6;
  color: #475569;
  margin: 0 0 12px 0;
}

.subsection-heading {
  font-size: 1rem;
  font-weight: 600;
  color: #334155;
  margin: 20px 0 8px 0;
}

/* Field table */
.field-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.85rem;
  margin: 8px 0 16px 0;
}

.field-table th,
.field-table td {
  text-align: left;
  padding: 8px 12px;
  border: 1px solid #e2e8f0;
}

.field-table th {
  background: #f8fafc;
  font-weight: 600;
  color: #334155;
}

.field-table td {
  color: #475569;
}

.field-table code {
  background: #f1f5f9;
  padding: 1px 5px;
  border-radius: 4px;
  font-size: 0.82rem;
  color: #334155;
}

/* Code block */
.code-block {
  background: #f1f5f9;
  border: 1px solid #e2e8f0;
  border-radius: 6px;
  padding: 10px 14px;
  font-family: 'SFMono-Regular', Consolas, 'Liberation Mono', Menlo, monospace;
  font-size: 0.85rem;
  color: #334155;
  margin: 8px 0 12px 0;
  overflow-x: auto;
}

/* Card example (annotated visual) */
.card-example {
  display: flex;
  gap: 24px;
  margin-top: 12px;
}

.card-mock {
  position: relative;
  flex: 1;
  background: #ffffff;
  border: 2px solid #cbd5e1;
  border-radius: 8px;
  padding: 16px;
  font-size: 0.85rem;
  color: #1e293b;
  min-width: 0;
}

.card-mock-avatar {
  position: absolute;
  top: 12px;
  right: 12px;
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: #e2e8f0;
  color: #475569;
  font-size: 0.7rem;
  font-weight: 600;
  display: flex;
  align-items: center;
  justify-content: center;
}

.card-mock-title {
  font-weight: 600;
  margin-bottom: 6px;
  padding-right: 40px;
  color: #1e293b;
}

.card-mock-details {
  display: flex;
  gap: 16px;
  color: #64748b;
  margin-bottom: 8px;
  flex-wrap: wrap;
}

.card-mock-audience {
  color: #64748b;
  margin-bottom: 8px;
}

.card-mock-cospeakers {
  color: #64748b;
  margin-bottom: 8px;
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 6px;
}

.card-mock-pill {
  display: inline-block;
  background: #f1f5f9;
  color: #334155;
  font-size: 0.75rem;
  padding: 2px 8px;
  border-radius: 9999px;
}

.card-mock-tag {
  display: inline-block;
  background: #dbeafe;
  color: #1e40af;
  font-size: 0.75rem;
  font-weight: 500;
  padding: 2px 10px;
  border-radius: 9999px;
  margin-bottom: 8px;
}

.card-mock-links {
  display: flex;
  gap: 12px;
}

.card-mock-link {
  color: #2563eb;
  font-size: 0.85rem;
  cursor: default;
}

/* Annotation labels on mock card elements */
.card-mock [data-label]::after {
  content: attr(data-label);
  display: block;
  font-size: 0.7rem;
  color: #94a3b8;
  font-style: italic;
  font-weight: 400;
  margin-top: 2px;
}

.card-mock-avatar[data-label]::after {
  position: absolute;
  top: 100%;
  right: 0;
  margin-top: 4px;
  white-space: nowrap;
}

/* Legend */
.card-legend {
  flex: 0 0 220px;
}

.legend-title {
  font-size: 0.85rem;
  font-weight: 600;
  color: #334155;
  margin: 0 0 8px 0;
}

.legend-list {
  list-style: none;
  padding: 0;
  margin: 0;
  font-size: 0.8rem;
  color: #475569;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.legend-list code {
  background: #f1f5f9;
  padding: 1px 4px;
  border-radius: 3px;
  font-size: 0.78rem;
}

.legend-dot {
  display: inline-block;
  width: 8px;
  height: 8px;
  border-radius: 50%;
  margin-right: 6px;
}

.dot-blue { background: #3b82f6; }
.dot-purple { background: #8b5cf6; }
.dot-green { background: #22c55e; }
.dot-orange { background: #f97316; }
.dot-red { background: #ef4444; }
.dot-teal { background: #14b8a6; }
.dot-yellow { background: #eab308; }
.dot-gray { background: #94a3b8; }

/* Tabs Overview cards */
.tabs-cards {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin: 12px 0 16px 0;
}

.tab-card {
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  padding: 14px 16px;
}

.tab-card-header {
  margin-bottom: 8px;
}

.tab-card-name {
  font-size: 0.9rem;
  font-weight: 600;
  color: #1e293b;
}

.tab-card-desc {
  font-size: 0.85rem;
  line-height: 1.55;
  color: #475569;
  margin: 0 0 8px 0;
}

.tab-card-desc code {
  background: #f1f5f9;
  padding: 1px 5px;
  border-radius: 4px;
  font-size: 0.82rem;
  color: #334155;
}

.tab-card-meta {
  font-size: 0.8rem;
  color: #64748b;
  margin-bottom: 2px;
}

.tab-card-meta code {
  background: #f1f5f9;
  padding: 1px 5px;
  border-radius: 4px;
  font-size: 0.78rem;
  color: #334155;
}

.tab-meta-label {
  font-weight: 600;
  color: #475569;
}

/* Status Grouping */
.status-groups {
  display: flex;
  gap: 16px;
  margin: 12px 0 16px 0;
}

.status-group {
  flex: 1;
  border-radius: 8px;
  padding: 14px;
  font-size: 0.85rem;
}

.status-group-backlog {
  background: #fef9c3;
  border: 1px solid #fde047;
}

.status-group-accepted {
  background: #dbeafe;
  border: 1px solid #93c5fd;
}

.status-group-resolved {
  background: #dcfce7;
  border: 1px solid #86efac;
}

.status-group-header {
  margin-bottom: 8px;
}

.status-badge {
  display: inline-block;
  font-size: 0.75rem;
  font-weight: 600;
  padding: 2px 10px;
  border-radius: 9999px;
}

.badge-backlog {
  background: #facc15;
  color: #713f12;
}

.badge-accepted {
  background: #3b82f6;
  color: #ffffff;
}

.badge-resolved {
  background: #22c55e;
  color: #052e16;
}

.status-group-desc {
  color: #475569;
  margin: 0 0 8px 0;
  line-height: 1.5;
}

.status-group-values {
  margin: 0;
  padding-left: 18px;
  color: #334155;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.status-group-values code {
  background: rgba(255, 255, 255, 0.6);
  padding: 1px 5px;
  border-radius: 4px;
  font-size: 0.82rem;
  color: #334155;
}

.status-mapping-table .status-badge {
  white-space: nowrap;
}

.status-row-backlog {
  background: #fefce8;
}

.status-row-accepted {
  background: #eff6ff;
}

.status-row-resolved {
  background: #f0fdf4;
}

/* Filter section */
.filter-values-list {
  margin: 4px 0 12px 0;
  padding-left: 20px;
  font-size: 0.85rem;
  color: #475569;
  display: flex;
  flex-direction: column;
  gap: 6px;
  line-height: 1.5;
}

.filter-values-list code {
  background: #f1f5f9;
  padding: 1px 5px;
  border-radius: 4px;
  font-size: 0.82rem;
  color: #334155;
}

.engagement-dot {
  display: inline-block;
  width: 8px;
  height: 8px;
  border-radius: 50%;
  margin-right: 4px;
}

.dot-engagement-blue { background: #3b82f6; }
.dot-engagement-yellow { background: #eab308; }
.dot-engagement-green { background: #22c55e; }

.filter-availability-table td {
  text-align: center;
}

.filter-availability-table td:first-child {
  text-align: left;
}

.filter-available {
  color: #16a34a;
}

.filter-unavailable {
  color: #94a3b8;
}

/* Labels section */
.label-effects {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin: 12px 0 16px 0;
}

.label-effect-card {
  border-radius: 8px;
  padding: 14px 16px;
}

.label-effect-cfp {
  background: #fef3c7;
  border: 1px solid #fcd34d;
}

.label-effect-students {
  background: #ede9fe;
  border: 1px solid #c4b5fd;
}

.label-effect-header {
  margin-bottom: 8px;
}

.label-effect-tab {
  font-size: 0.9rem;
  font-weight: 600;
  color: #1e293b;
}

.label-effect-desc {
  font-size: 0.85rem;
  line-height: 1.55;
  color: #475569;
  margin: 0 0 10px 0;
}

.label-effect-desc code {
  background: rgba(255, 255, 255, 0.6);
  padding: 1px 5px;
  border-radius: 4px;
  font-size: 0.82rem;
  color: #334155;
}

.label-effect-labels {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.label-pill {
  display: inline-block;
  font-size: 0.78rem;
  font-weight: 500;
  padding: 3px 10px;
  border-radius: 9999px;
}

.label-pill-cfp {
  background: #fbbf24;
  color: #78350f;
}

.label-pill-segment {
  background: #8b5cf6;
  color: #ffffff;
}

/* Ticket Card Display — engagement tag examples */
.engagement-tags {
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin: 8px 0 16px 0;
}

.engagement-tag-example {
  display: flex;
  align-items: center;
  gap: 12px;
}

.engagement-tag-demo {
  display: inline-block;
  font-size: 0.78rem;
  font-weight: 500;
  padding: 3px 12px;
  border-radius: 9999px;
  flex-shrink: 0;
}

.tag-blue {
  background: #dbeafe;
  color: #1e40af;
}

.tag-yellow {
  background: #fef9c3;
  color: #854d0e;
}

.tag-green {
  background: #dcfce7;
  color: #166534;
}

.engagement-tag-label {
  font-size: 0.85rem;
  color: #475569;
}

/* Responsive: single-column stacking below 768px */
@media (max-width: 768px) {
  .faq-page {
    gap: 24px;
    padding: 0 4px;
  }

  .faq-title {
    font-size: 1.3rem;
  }

  .toc {
    padding: 16px;
  }

  .faq-section {
    padding: 16px;
  }

  .toc-list {
    padding-left: 16px;
  }

  .card-example {
    flex-direction: column;
  }

  .status-groups {
    flex-direction: column;
  }

  .card-legend {
    flex: none;
  }

  .field-table {
    font-size: 0.8rem;
  }

  .field-table th,
  .field-table td {
    padding: 6px 8px;
  }
}
</style>
