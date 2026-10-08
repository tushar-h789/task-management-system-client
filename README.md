# Team Tasks

Internal workspace for a small team to plan, assign, track, review, and finish work. There is no real login. You pick a demo teammate and the app treats that person as the one doing the action. Tasks, comments, reviews, activity, and notifications stay in the browser (`localStorage` key `tms-demo-v1`). The team roster is fixed demo data and cannot be edited.

## What you can do

| Area         | What it is for                                                                                                                          |
| ------------ | --------------------------------------------------------------------------------------------------------------------------------------- |
| Dashboard    | See how much work is open, what needs attention first, deadlines in the next 7 days, recent activity, and each person’s open-task load. |
| All Tasks    | Search, filter, and sort every task. Switch between list and board. Create a task, edit one, or change its status.                      |
| My Tasks     | See only the tasks assigned to the person you are viewing as, grouped by what they should do next.                                      |
| Team Members | Find people by name or role and open one person’s assigned work. Open-task counts show workload, not performance.                       |
| Task Reviews | Work the review queue: approve, send back for changes, or resubmit.                                                                     |
| Calendar     | See which tasks are due, and which ones start, on each day.                                                                             |
| Task page    | Read one task, its dependencies, subtasks, checklist, comments, review history, and activity.                                           |
| Settings     | Switch the demo person, turn overdue highlighting on or off, and restore the original demo data.                                        |

The header search finds tasks by title or id. The bell lists notifications; you can mark one read or mark them all read.

## People

Each task has an assignee (who does the work), a creator, and an optional reviewer. Comments, status changes, and reviews are recorded under the person currently selected in Settings or on My Tasks. Switching people is a preview, not an account.

## A task

A task needs a title. Everything else is optional in practice, but the form also stores:

- description and notes
- assignee, creator, and reviewer
- priority: low, medium, high, or urgent
- start date and due date
- tags
- a checklist
- a parent task (this task is then a subtask)
- other tasks it depends on
- whether it repeats: does not repeat, daily, weekly, or monthly

New tasks get the next id in the form `TASK-1001`, `TASK-1002`, and so on.

Saving is rejected when:

- the title is empty
- the due date is before the start date
- the task depends on itself, or the dependencies would form a loop
- the task is its own parent, or the parent is already underneath it

## Status

A task is in exactly one of these states:

1. **Not started** — assigned, not begun
2. **In progress** — someone is doing it
3. **In review** — submitted and waiting for a decision
4. **Blocked** — work cannot continue
5. **Revision required** — a reviewer asked for more work
6. **Completed** — finished

**Overdue is not a status.** A task is overdue when it is not completed and its due date is before today. Due today and due tomorrow are shown as labels. Settings can add a visual highlight; the text label stays either way.

Changing status to **In progress**, **In review**, or **Completed** while a dependency is still unfinished asks for confirmation. Completing a task while checklist items are still open also asks for confirmation. You can continue; the app does not lock the status.

Moving a task to **In review** records the time it was submitted. If a reviewer is set, that also creates a “waiting for review” notification. Marking a task **Blocked** creates a blocked notification.

## Review

Reviews live on the task and on the Task Reviews page.

- While a task is **In review**, you can **approve** it or **request revisions**.
- Approval stores the feedback (or “Approved.” if you leave it blank), then marks the task **Completed**.
- A revision request needs a written explanation. The task moves to **Revision required**, and the assignee side gets a revision notification. Older feedback stays in the history.
- From **Revision required**, you can **resubmit**. An optional note is stored, and the task goes back to **In review**.

This demo records the review under whoever you are viewing as, even when that person is not the assigned reviewer.

## Dependencies and subtasks

A dependency means this task is waiting on earlier work.

- A prerequisite that is completed is done.
- A prerequisite that is blocked, or overdue and not completed, is treated as blocking.
- Any other unfinished prerequisite is still pending.

Creating a task that still has unfinished dependencies raises a notification that it is waiting on earlier work. The task page lists both what this task waits on and which other tasks wait on it.

A parent task groups subtasks. Progress uses the checklist when the task has one. If it has no checklist but has subtasks, progress is the share of subtasks that are completed. Otherwise progress follows the status: not started 0, blocked 20, in progress 45, revision required 55, in review 80, completed 100.

## Repeating work

Choosing daily, weekly, or monthly does not create future copies by itself. On the task page, **Create next occurrence** copies the task:

- status goes back to **Not started**
- checklist items are copied and unchecked
- comments and reviews start empty
- dates move forward by one day, one week, or one month from the due date when that date is still ahead, otherwise from today
- the copy is linked to the same series and points at the task it follows

## Comments, activity, and notifications

Anyone you are viewing as can add a comment. Empty comments are ignored. Checklist items can be checked off or added from the task page.

Activity is an append-only history: created, updated, reassigned, status changed, completed, comment, review, and a new occurrence.

Live actions create these notifications:

- **assignment** — a new task is assigned to someone other than the current person
- **review request** — a task is sent to review and has a reviewer
- **revision** — a reviewer asks for changes
- **blocked** — a task is marked blocked, or a new task still depends on unfinished work

The seeded demo also includes a deadline notice. Later actions do not create new deadline notifications; upcoming deadlines are shown on the dashboard and on My Tasks instead.

## Data

The first visit loads the Northstar demo team and sample tasks. After that, changes are saved in the browser. **Restore demo data** in Settings replaces tasks, notifications, activity, the selected person, and preferences with the original sample. It asks for confirmation first.

## Run it

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).
