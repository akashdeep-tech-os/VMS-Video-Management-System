import BodyContainer from "../common/BodyContainer";
import { CiEdit } from "react-icons/ci";
import { MdDelete } from "react-icons/md";

function UserTable({
  users = [],
  roles = [],
  handleDelete,
  onEdit,
  selectedIds = [],
  toggleSelect,
  toggleSelectAll,
}) {
  // Backend returns the role as a plain string in `role_name`. Fall back to a
  // roles-list lookup only if some caller still passes a numeric role id.
  const getRoleName = (user) => {
    if (user.role_name) return user.role_name;
    const role = roles.find((r) => r.id === user.role);
    return role ? role.name : "—";
  };

  return (
    <BodyContainer>
      <div className="bg-[var(--card-bg)] text-[var(--text-dark)] h-full min-h-0 rounded-2xl border border-[var(--border-color)] flex flex-col overflow-hidden shadow-sm">
        <div className="px-4 py-3 border-b border-[var(--border-color)] flex justify-between items-center">
          <h2 className="text-sm font-semibold tracking-wide uppercase">
            User Management
          </h2>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold uppercase bg-blue-100 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 px-2 py-0.5 rounded">
              TOTAL: {users.length}
            </span>
          </div>
        </div>

        <div className="flex-1 min-h-0 overflow-auto custom-scrollbar">
          <table className="min-w-[700px] w-full text-left text-xs">
            <thead className="sticky top-0 z-10">
              <tr className="bg-[var(--bg-color)] uppercase text-[10px] tracking-wider">
                <th className="py-3 px-3 font-semibold border-b border-[var(--border-color)] w-[50px] text-center">
                  <input
                    type="checkbox"
                    className="w-4 h-4 accent-[var(--primary-color)] cursor-pointer rounded"
                    onChange={() =>
                      toggleSelectAll?.(users.map((u) => u.id))
                    }
                    checked={
                      users.length > 0 &&
                      users.every((u) => selectedIds.includes(u.id))
                    }
                  />
                </th>
                <th className="py-3 px-3 font-semibold border-b border-[var(--border-color)] w-[60px]">
                  ID
                </th>
                <th className="py-3 px-3 font-semibold border-b border-[var(--border-color)] min-w-[120px]">
                  USERNAME
                </th>
                <th className="py-3 px-3 font-semibold border-b border-[var(--border-color)] min-w-[150px]">
                  EMAIL
                </th>
                <th className="py-3 px-3 font-semibold border-b border-[var(--border-color)] w-[100px]">
                  ROLE
                </th>
                <th className="py-3 px-3 font-semibold border-b border-[var(--border-color)] w-[80px]">
                  STATUS
                </th>
                <th className="py-3 px-3 font-semibold text-center border-b border-[var(--border-color)] w-[80px]">
                  ACTIONS
                </th>
              </tr>
            </thead>

            <tbody>
              {users.map((user) => (
                <tr
                  key={user.id}
                  className={`border-b border-[var(--border-color)] transition-colors duration-200 hover:bg-[var(--primary-color)]/[0.04] cursor-pointer ${
                    selectedIds.includes(user.id)
                      ? "bg-blue-50 dark:bg-blue-900/20"
                      : ""
                  }`}
                >
                  <td className="py-3 px-3 text-center">
                    <input
                      type="checkbox"
                      className="w-4 h-4 accent-[var(--primary-color)] cursor-pointer rounded"
                      checked={selectedIds.includes(user.id)}
                      onChange={() => toggleSelect?.(user.id)}
                    />
                  </td>
                  <td className="py-3 px-3 text-[var(--text-muted)] font-mono">
                    {user.id}
                  </td>
                  <td className="py-3 px-3 font-medium truncate max-w-[150px]">
                    {user.username}
                  </td>
                  <td className="py-3 px-3 text-[var(--text-muted)]">
                    {user.email || "—"}
                  </td>
                  <td className="py-3 px-3">
                    <span className="px-2 py-0.5 rounded-md text-[10px] font-semibold uppercase bg-purple-100 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400 border border-purple-100 dark:border-purple-800">
                      {getRoleName(user)}
                    </span>
                  </td>
                  <td className="py-3 px-3">
                    <span
                      className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[10px] font-semibold uppercase ${
                        user.active !== false
                          ? "bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-800"
                          : "bg-red-50 dark:bg-red-900/20 text-red-500 dark:text-red-400 border border-red-100 dark:border-red-800"
                      }`}
                    >
                      <span
                        className={`w-1.5 h-1.5 rounded-full ${
                          user.active !== false
                            ? "bg-emerald-500"
                            : "bg-red-400"
                        }`}
                      />
                      {user.active !== false ? "ACTIVE" : "INACTIVE"}
                    </span>
                  </td>
                  <td className="py-3 px-3">
                    <div className="flex justify-center items-center gap-1">
                      <button
                        onClick={() => onEdit?.(user)}
                        className="p-1.5 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/20 text-blue-500 dark:text-blue-400 transition"
                        title="Edit"
                      >
                        <CiEdit size={14} />
                      </button>
                      <button
                        onClick={() => handleDelete?.(user.id)}
                        className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-red-500 dark:text-red-400 transition"
                        title="Delete"
                      >
                        <MdDelete size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}

              {users.length === 0 && (
                <tr>
                  <td colSpan="7" className="py-10">
                    <div className="flex flex-col items-center text-[var(--text-muted)]">
                      <p className="text-sm font-medium">NO USERS FOUND</p>
                      <p className="text-xs mt-1 uppercase">
                        TRY ADJUSTING FILTERS OR SEARCH
                      </p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </BodyContainer>
  );
}

export default UserTable;
