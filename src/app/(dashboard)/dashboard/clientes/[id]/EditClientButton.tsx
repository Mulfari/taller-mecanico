"use client";

import { useState } from "react";
import EditClientModal from "./EditClientModal";

function IconEdit() {
  return (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
    </svg>
  );
}

interface Props {
  clientId: string;
  fullName: string;
  phone: string;
}

export default function EditClientButton({ clientId, fullName, phone }: Props) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-1.5 text-xs text-gray-500 hover:text-white border border-white/10 hover:border-white/20 px-3 py-1.5 rounded-lg transition-colors"
      >
        <IconEdit />
        Editar
      </button>
      {open && (
        <EditClientModal
          clientId={clientId}
          initialName={fullName}
          initialPhone={phone ?? ""}
          onClose={() => setOpen(false)}
        />
      )}
    </>
  );
}
