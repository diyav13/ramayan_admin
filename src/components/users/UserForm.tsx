"use client";

import { FormEvent } from "react";
import { Input } from "@/components/ui/Input";
import { FormActions } from "@/components/FormActions";
import { optionalField, readText } from "@/lib/utils";
import type { UpdateUserInput, User } from "@/types/user";

function buildUpdatePayload(form: FormData): UpdateUserInput {
  const payload: UpdateUserInput = {
    name: optionalField(readText(form, "name")) ?? null,
    phone: optionalField(readText(form, "phone")) ?? null,
  };

  const email = readText(form, "email");
  if (email) payload.email = email;

  const password = readText(form, "password");
  if (password) payload.password = password;

  return payload;
}

export function UserForm({
  user,
  saving,
  onSave,
  onCancel,
}: {
  user: User;
  saving: boolean;
  onSave: (payload: UpdateUserInput) => Promise<void>;
  onCancel: () => void;
}) {
  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    await onSave(buildUpdatePayload(form));
  }

  return (
    <form onSubmit={(event) => void handleSubmit(event)} className="space-y-4">
      {user.avatarUrl || user.selectedAvatar ? (
        <div className="flex items-center gap-3 rounded-lg border border-white/5 bg-[var(--surface-alt)] p-4">
          {user.avatarUrl ? (
            <img
              src={user.avatarUrl}
              alt=""
              className="size-14 shrink-0 rounded-full object-cover ring-1 ring-white/10"
            />
          ) : (
            <div className="flex size-14 shrink-0 items-center justify-center rounded-full bg-[var(--surface)] text-lg font-bold text-[var(--gold)] ring-1 ring-white/10">
              ?
            </div>
          )}
          <div className="min-w-0">
            <p className="text-sm font-medium text-white">Selected avatar</p>
            {user.selectedAvatar ? (
              <p className="truncate text-sm text-[var(--gold)]">
                {user.selectedAvatar.name}
                {!user.selectedAvatar.isActive ? " (inactive)" : ""}
              </p>
            ) : (
              <p className="text-sm text-[var(--text-muted)]">
                Custom image — not linked to the avatar catalog
              </p>
            )}
          </div>
        </div>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2">
        <Input label="Name" name="name" defaultValue={user.name ?? ""} />
        <Input
          label="Email"
          name="email"
          type="email"
          defaultValue={user.email ?? ""}
        />
        <Input
          label="New password"
          name="password"
          type="password"
          placeholder="Leave blank to keep current"
          minLength={6}
        />
        <Input label="Phone" name="phone" defaultValue={user.phone ?? ""} />
      </div>

      <FormActions
        submitLabel={saving ? "Saving…" : "Save Changes"}
        onCancel={onCancel}
        submitDisabled={saving}
      />
    </form>
  );
}
