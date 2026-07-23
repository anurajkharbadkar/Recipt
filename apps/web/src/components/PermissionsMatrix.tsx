'use client';

interface PermissionsMatrixProps {
  modules: string[];
  value: any;
  onChange: (value: any) => void;
}

const ACTION_LABELS: Record<string, string> = {
  canCreate: 'Create',
  canEdit: 'Edit',
  canDelete: 'Delete/Void',
  canApprove: 'Approve',
};

export default function PermissionsMatrix({ modules, value, onChange }: PermissionsMatrixProps) {
  return (
    <div className="space-y-4">
      {modules.map((mod) => {
        const modPerms = value[mod] || { canView: true, canCreate: true, canEdit: true, canDelete: true, canApprove: true };

        return (
          <div key={mod} className="p-3 bg-white/5 rounded-xl border border-white/5 space-y-2">
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold text-white">{mod}</p>
              <label className="flex items-center gap-1.5 cursor-pointer text-[10px] text-white/70">
                <input
                  type="checkbox"
                  checked={!!modPerms.canView}
                  onChange={(e) => onChange({
                    ...value,
                    [mod]: { ...modPerms, canView: e.target.checked },
                  })}
                />
                Enable View
              </label>
            </div>

            {modPerms.canView && (
              <div className="flex flex-wrap gap-3 pt-1">
                {['canCreate', 'canEdit', 'canDelete', 'canApprove'].map((action) => {
                  if (mod === 'Reports' && action !== 'canView') return null;
                  if (mod === 'Settings' && (action === 'canDelete' || action === 'canApprove')) return null;
                  if (mod === 'Expenses' && action === 'canEdit') return null;
                  if (mod === 'Receipts' && action === 'canEdit') return null;

                  return (
                    <label key={action} className="flex items-center gap-1 text-[10px] text-white/50 cursor-pointer hover:text-white">
                      <input
                        type="checkbox"
                        checked={!!modPerms[action]}
                        onChange={(e) => onChange({
                          ...value,
                          [mod]: { ...modPerms, [action]: e.target.checked },
                        })}
                      />
                      {ACTION_LABELS[action]}
                    </label>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
