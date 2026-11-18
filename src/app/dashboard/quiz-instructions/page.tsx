"use client";

import { DataTable } from "@/components/DataTable";
import { EditView } from "@/components/EditView";
import { ErrorBanner } from "@/components/ErrorBanner";
import { InfoFiltersBar } from "@/components/information/InfoFiltersBar";
import { QuizInstructionForm } from "@/components/information/QuizInstructionForm";
import { QuizInstructionTable } from "@/components/information/QuizInstructionTable";
import { ListState } from "@/components/ListState";
import { PageHeader } from "@/components/PageHeader";
import { Pagination } from "@/components/Pagination";
import { useQuizInstructions } from "@/hooks/useQuizInstructions";
import { pluralize } from "@/lib/utils";

const SKELETON_ROWS = 6;
const cellPad = "px-1.5 py-2.5 sm:px-3 sm:py-3.5 md:px-4";

const instructionColumns = [
  { label: "Instruction" },
  { label: "Actions", align: "right" as const, width: "6.5rem" },
];

function SkeletonBar({ className = "" }: { className?: string }) {
  return (
    <div className={`skeleton-shimmer rounded ${className}`} aria-hidden />
  );
}

function QuizInstructionsTableSkeleton() {
  return (
    <div
      className="overflow-hidden rounded-lg border border-white/5 bg-[var(--surface-alt)]"
      role="status"
      aria-live="polite"
      aria-busy="true"
    >
      <DataTable columns={instructionColumns} embedded>
        {Array.from({ length: SKELETON_ROWS }, (_, index) => (
          <tr
            key={index}
            className="border-b border-white/5 last:border-0"
            style={{ opacity: 1 - index * 0.07 }}
          >
            <td className={cellPad}>
              <div className="flex min-w-0 items-start gap-2 sm:gap-3">
                <SkeletonBar className="h-8 w-11 shrink-0 rounded-md sm:h-10 sm:w-14 sm:rounded-lg" />
                <div className="min-w-0 flex-1 space-y-1.5">
                  <SkeletonBar className="h-3.5 w-[70%] max-w-[12rem]" />
                  <SkeletonBar className="h-3 w-[55%] max-w-[9rem]" />
                </div>
              </div>
            </td>
            <td className={cellPad}>
              <div className="flex justify-end gap-1 sm:gap-1.5">
                <SkeletonBar className="size-7 rounded sm:size-8" />
                <SkeletonBar className="size-7 rounded sm:size-8" />
              </div>
            </td>
          </tr>
        ))}
      </DataTable>
      <span className="sr-only">Loading quiz instructions…</span>
    </div>
  );
}

export default function QuizInstructionsPage() {
  const quizInstructions = useQuizInstructions();

  if (quizInstructions.isEditing) {
    const entity = quizInstructions.editingItem;
    return (
      <EditView
        title={
          quizInstructions.creating
            ? "Add Quiz Instruction"
            : "Edit Quiz Instruction"
        }
        subtitle={
          quizInstructions.creating
            ? "Create a new quiz instruction"
            : "Update instruction text or image"
        }
        onBack={quizInstructions.closeEditor}
      >
        {quizInstructions.error && (
          <p className="mb-4 text-sm text-red-400">{quizInstructions.error}</p>
        )}
        <QuizInstructionForm
          entity={entity}
          saving={quizInstructions.saving}
          creating={quizInstructions.creating}
          onSave={async (payload) => {
            if (entity) {
              await quizInstructions.updateQuizInstruction(entity.id, payload);
            } else {
              await quizInstructions.createQuizInstruction({
                instruction: payload.instruction ?? "",
                imageUrl: payload.imageUrl,
              });
            }
          }}
          onCancel={quizInstructions.closeEditor}
        />
      </EditView>
    );
  }

  const subtitle = quizInstructions.loading
    ? "Loading quiz instructions…"
    : `${pluralize(quizInstructions.totalCount, "quiz instruction")} total`;

  const paginationSummary = quizInstructions.pageRange
    ? `Showing ${quizInstructions.pageRange.from}–${quizInstructions.pageRange.to} of ${quizInstructions.totalCount}`
    : undefined;

  return (
    <div className="mx-auto w-full max-w-6xl space-y-3 sm:space-y-5">
      <PageHeader
        title="Quiz Instructions"
        subtitle={subtitle}
        actionLabel="Add Quiz Instruction"
        onAction={quizInstructions.startCreate}
        actionDisabled={quizInstructions.loading}
      />

      <InfoFiltersBar
        search={quizInstructions.searchInput}
        onSearchChange={quizInstructions.setSearchInput}
        onSearchClear={quizInstructions.clearSearch}
        placeholder="Search instructions…"
        disabled={quizInstructions.loading}
      />

      {quizInstructions.error && (
        <ErrorBanner message={quizInstructions.error} />
      )}

      {quizInstructions.loading ? (
        <QuizInstructionsTableSkeleton />
      ) : quizInstructions.items.length === 0 ? (
        <ListState
          message="No quiz instructions found"
          hint={
            quizInstructions.hasActiveFilters
              ? "Try adjusting your search."
              : "Create your first quiz instruction to get started."
          }
        />
      ) : (
        <div className="overflow-hidden rounded-lg border border-white/5 bg-[var(--surface-alt)]">
          <QuizInstructionTable
            items={quizInstructions.items}
            confirmDeleteId={quizInstructions.confirmDeleteId}
            onEdit={(id) => quizInstructions.startEdit(id)}
            onAskDelete={quizInstructions.askDelete}
            onCancelDelete={quizInstructions.cancelDelete}
            onConfirmDelete={(id) => {
              void quizInstructions.deleteQuizInstruction(id);
            }}
            embedded
          />

          {quizInstructions.pagination && (
            <Pagination
              pagination={quizInstructions.pagination}
              page={quizInstructions.page}
              onPageChange={quizInstructions.setPage}
              loading={quizInstructions.loading}
              summary={paginationSummary}
            />
          )}
        </div>
      )}
    </div>
  );
}
