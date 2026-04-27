-- ============================================================
-- FlowTrack Kanban Migration Script
-- Run this ONCE against your Flow_db MySQL database
-- to migrate from fixed statuses to dynamic columns.
-- ============================================================

-- Step 1: Create the board_columns table (JPA will do this
--         automatically on startup due to ddl-auto=update,
--         but this script pre-populates the default columns
--         for any existing projects.)
-- ============================================================

-- Step 2: Add column_id to tasks table (JPA handles DDL,
--         but we seed the data here)
-- NOTE: Run AFTER starting the backend at least once so
--       JPA has created board_columns and added column_id
--       to tasks.

-- Step 3: For every existing project, insert the 3 default columns
INSERT INTO board_columns (project_id, column_name, order_index)
SELECT p.id, 'To Do', 0 FROM projects p
WHERE NOT EXISTS (
    SELECT 1 FROM board_columns bc WHERE bc.project_id = p.id
);

INSERT INTO board_columns (project_id, column_name, order_index)
SELECT p.id, 'In Progress', 1 FROM projects p
WHERE (SELECT COUNT(*) FROM board_columns bc WHERE bc.project_id = p.id) < 2;

INSERT INTO board_columns (project_id, column_name, order_index)
SELECT p.id, 'Done', 2 FROM projects p
WHERE (SELECT COUNT(*) FROM board_columns bc WHERE bc.project_id = p.id) < 3;

-- Step 4: Migrate existing task statuses to column_ids
-- Map TODO -> 'To Do' column, IN_PROGRESS -> 'In Progress', DONE -> 'Done'
-- This assumes the columns were just created above for each project.

-- Update tasks with status 'TODO' to the 'To Do' column_id
UPDATE tasks t
JOIN board_columns bc ON bc.project_id = t.project_id
    AND bc.column_name = 'To Do'
SET t.column_id = bc.id
WHERE t.column_id IS NULL OR t.column_id = 0;

-- Verify migration
SELECT 
    t.id, t.title, t.column_id, bc.column_name, bc.project_id
FROM tasks t
LEFT JOIN board_columns bc ON bc.id = t.column_id
LIMIT 20;
