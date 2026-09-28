import React from 'react';
import { CheckCircle2, Clock, Ban, ShieldCheck, User } from 'lucide-react';

export function StatusBadge({ status, type = 'status' }) {
  if (!status) return null;

  const normalized = status.toLowerCase();

  if (type === 'role') {
    if (normalized === 'admin') {
      return (
        <span className="badge-pill badge-role-admin">
          <ShieldCheck size={12} /> Admin
        </span>
      );
    }
    return (
      <span className="badge-pill badge-role-user">
        <User size={12} /> User
      </span>
    );
  }

  // Type: Card or User Status
  switch (normalized) {
    case 'assigned':
      return (
        <span className="badge-pill badge-assigned">
          <CheckCircle2 size={12} /> Assigned
        </span>
      );
    case 'unassigned':
      return (
        <span className="badge-pill badge-unassigned">
          <Clock size={12} /> Unassigned
        </span>
      );
    case 'approved':
      return (
        <span className="badge-pill badge-approved">
          <CheckCircle2 size={12} /> Approved
        </span>
      );
    case 'pending':
      return (
        <span className="badge-pill badge-pending">
          <Clock size={12} /> Pending Approval
        </span>
      );
    case 'revoked':
      return (
        <span className="badge-pill badge-revoked">
          <Ban size={12} /> Revoked
        </span>
      );
    default:
      return <span className="badge-pill">{status}</span>;
  }
}
