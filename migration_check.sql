-- DropForeignKey
ALTER TABLE "public"."ms_teams" DROP CONSTRAINT "ms_teams_department_id_fkey";

-- DropForeignKey
ALTER TABLE "public"."ms_ter_fee" DROP CONSTRAINT "ms_ter_fee_ter_type_fkey";

-- DropForeignKey
ALTER TABLE "public"."tr_employees" DROP CONSTRAINT "tr_employees_team_id_fkey";

-- DropForeignKey
ALTER TABLE "public"."tr_leave_requests" DROP CONSTRAINT "tr_leave_requests_work_handover_to_fkey";

-- DropForeignKey
ALTER TABLE "public"."tr_time_off_requests" DROP CONSTRAINT "tr_time_off_requests_work_handover_to_fkey";

-- DropForeignKey
ALTER TABLE "public"."tr_remote_work_requests" DROP CONSTRAINT "tr_remote_work_requests_employee_id_fkey";

-- DropForeignKey
ALTER TABLE "public"."tr_remote_work_requests" DROP CONSTRAINT "tr_remote_work_requests_supervisor_id_fkey";

-- DropForeignKey
ALTER TABLE "public"."tr_overnight_requests" DROP CONSTRAINT "tr_overnight_requests_employee_id_fkey";

-- DropForeignKey
ALTER TABLE "public"."tr_overnight_requests" DROP CONSTRAINT "tr_overnight_requests_supervisor_id_fkey";

-- DropForeignKey
ALTER TABLE "public"."tr_reimbursements" DROP CONSTRAINT "tr_reimbursements_employee_id_fkey";

-- DropForeignKey
ALTER TABLE "public"."tr_reimbursements" DROP CONSTRAINT "tr_reimbursements_supervisor_id_fkey";

-- DropForeignKey
ALTER TABLE "public"."tr_reimbursements" DROP CONSTRAINT "tr_reimbursements_hr_approved_by_fkey";

-- DropIndex
DROP INDEX "public"."ms_ter_ter_type_key";

-- DropIndex
DROP INDEX "public"."idx_ter_fee_type";

-- DropIndex
DROP INDEX "public"."idx_ter_fee_range";

-- DropIndex
DROP INDEX "public"."tr_employees_current_remote_work_id_key";

-- DropIndex
DROP INDEX "public"."idx_employees_current_remote_work";

-- AlterTable
ALTER TABLE "public"."ms_ter" ALTER COLUMN "id" DROP DEFAULT;
DROP SEQUENCE "";

-- AlterTable
ALTER TABLE "public"."ms_ter_fee" ALTER COLUMN "id" DROP DEFAULT;
DROP SEQUENCE "";

-- AlterTable
ALTER TABLE "public"."tr_employees" DROP COLUMN "team_id";

-- AlterTable
ALTER TABLE "public"."tr_time_off_requests" ADD COLUMN     "date" DATE NOT NULL,
ALTER COLUMN "start_date" DROP NOT NULL,
ALTER COLUMN "end_date" DROP NOT NULL;

-- DropTable
DROP TABLE "public"."ms_teams";

-- CreateIndex
CREATE INDEX "idx_leave_requests_work_handover" ON "public"."tr_leave_requests"("work_handover_to" ASC);

-- CreateIndex
CREATE INDEX "idx_time_off_requests_date" ON "public"."tr_time_off_requests"("date" ASC);

-- CreateIndex
CREATE INDEX "idx_time_off_requests_work_handover" ON "public"."tr_time_off_requests"("work_handover_to" ASC);

-- RenameForeignKey
ALTER TABLE "public"."tr_employees" RENAME CONSTRAINT "tr_employees_current_remote_work_id_fkey" TO "fk_employees_current_remote_work";

