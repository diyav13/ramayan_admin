"use client";

import { FormEvent } from "react";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Checkbox } from "@/components/ui/Checkbox";
import { PageHeader } from "@/components/PageHeader";
import { RowActions } from "@/components/RowActions";
import { DataTable } from "@/components/DataTable";
import { EditView } from "@/components/EditView";
import { FormActions } from "@/components/FormActions";
import { useCrud } from "@/hooks/useCrud";
import { generateId, pluralize, readText, today } from "@/lib/utils";
import { ACCOUNT_TYPES, initialUsers, type User } from "@/lib/users";

const columns = [
  { label: "User" },
  { label: "Phone" },
  { label: "Account" },
  { label: "Premium" },
  { label: "Created" },
  { label: "Actions", align: "right" as const },
];

export default function UsersPage() {
  const crud = useCrud<User>(initialUsers);

  function handleSave(e: FormEvent<HTMLFormElement>, existing: User | null) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);

    const data = {
      name: readText(form, "name"),
      email: readText(form, "email"),
      phone: readText(form, "phone"),
      accountType: form.get("accountType") as User["accountType"],
      // Premium is read-only in the admin UI, so preserve the current value.
      isPremium: existing?.isPremium ?? false,
      avatarUrl: readText(form, "avatarUrl"),
    };

    if (existing) {
      crud.updateItem(existing.id, data);
    } else {
      crud.addItem({ ...data, id: generateId("u"), createdAt: today() });
    }
    crud.closeEditor();
  }

  if (crud.isEditing) {
    const user = crud.editingItem;
    return (
      <EditView
        title={crud.creating ? "Add User" : "Edit User"}
        subtitle={
          crud.creating
            ? "Create a new user account"
            : `Editing ${user?.name ?? "user"}`
        }
      >
        <UserForm
          user={user}
          onSave={(e) => handleSave(e, user)}
          onCancel={crud.closeEditor}
        />
      </EditView>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="User Management"
        subtitle={`${pluralize(crud.items.length, "user")} total`}
        actionLabel="Add User"
        onAction={crud.startCreate}
      />

      <DataTable columns={columns}>
        {crud.items.map((user) => (
          <tr
            key={user.id}
            className="border-b border-white/5 last:border-0 hover:bg-white/5"
          >
            <td className="px-4 py-3">
              <div className="flex items-center gap-3">
                <Avatar user={user} />
                <div>
                  <p className="font-medium text-white">{user.name}</p>
                  <p className="text-xs text-[var(--text-muted)]">
                    {user.email}
                  </p>
                </div>
              </div>
            </td>
            <td className="px-4 py-3 text-[var(--text-muted)]">{user.phone}</td>
            <td className="px-4 py-3 text-[var(--text-muted)]">
              {user.accountType}
            </td>
            <td className="px-4 py-3">
              {user.isPremium ? (
                <span className="text-[var(--gold)]">Premium</span>
              ) : (
                <span className="text-[var(--text-muted)]">Free</span>
              )}
            </td>
            <td className="px-4 py-3 text-[var(--text-muted)]">
              {user.createdAt}
            </td>
            <td className="px-4 py-3">
              <RowActions
                confirming={crud.confirmDeleteId === user.id}
                onEdit={() => crud.startEdit(user.id)}
                onAskDelete={() => crud.askDelete(user.id)}
                onCancelDelete={crud.cancelDelete}
                onConfirmDelete={() => {
                  crud.removeItem(user.id);
                  crud.cancelDelete();
                }}
              />
            </td>
          </tr>
        ))}
      </DataTable>
    </div>
  );
}

function UserForm({
  user,
  onSave,
  onCancel,
}: {
  user: User | null;
  onSave: (e: FormEvent<HTMLFormElement>) => void;
  onCancel: () => void;
}) {
  return (
    <form onSubmit={onSave} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <Input label="Name" name="name" defaultValue={user?.name} required />
        <Input
          label="Email"
          name="email"
          type="email"
          defaultValue={user?.email}
          required
        />
        <Input label="Phone" name="phone" defaultValue={user?.phone} />
        <Input
          label="Avatar URL"
          name="avatarUrl"
          placeholder="https://…"
          defaultValue={user?.avatarUrl}
        />
        <Select
          label="Account Type"
          name="accountType"
          options={ACCOUNT_TYPES}
          defaultValue={user?.accountType ?? "EMAIL"}
        />
      </div>
      <Checkbox
        label="Premium account (read-only)"
        checked={user?.isPremium ?? false}
        readOnly
        disabled
      />
      <FormActions
        submitLabel={user ? "Save Changes" : "Create User"}
        onCancel={onCancel}
      />
    </form>
  );
}

function Avatar({ user }: { user: User }) {
  if (user.avatarUrl) {
    // eslint-disable-next-line @next/next/no-img-element
    return (
      <img
        src={user.avatarUrl}
        alt={user.name}
        className="size-9 rounded-full object-cover"
      />
    );
  }
  const initials = user.name
    .split(" ")
    .map((n) => n[0])
    .slice(0, 2)
    .join("");
  return (
    <div className="flex size-9 items-center justify-center rounded-full bg-[var(--surface)] text-sm font-bold text-[var(--gold)]">
      {initials}
    </div>
  );
}
