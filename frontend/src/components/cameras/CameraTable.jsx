import { IoEye, IoEyeOff } from "react-icons/io5";
import { CiEdit } from "react-icons/ci";
import { MdDelete } from "react-icons/md";

function CameraTable({
  cameras = [],
  toggleVisibility,
  handleDelete,
  onEdit,
  selectedIds = [],
  toggleSelect,
  toggleSelectAll,
  onRowDetailsClick,
  activeDetailCamera,
}) {
  return (
    <div className="h-auto min-h-0 flex flex-col rounded-xl border border-[var(--border-color)] bg-[var(--card-bg)] overflow-y-auto custom-scrollbar shadow-sm">
      <table className="w-full border-collapse tracking-wider ">
        <thead className="sticky top-0 z-10">
          <tr className="bg-[var(--primary-color)]/16 font-semibold text-[var(--text-dark)] text-[13px] uppercase">
            <th className="w-[44px] border border-[var(--border-color)] px-4 py-2.5 text-center font-semibold">
              <input
                type="checkbox"
                className="w-4 h-4 accent-[var(--primary-color)] cursor-pointer rounded"
                onChange={() => toggleSelectAll?.(cameras.map((cam) => cam.id))}
                checked={
                  cameras.length > 0 &&
                  cameras.every((cam) => selectedIds.includes(cam.id))
                }
              />
            </th>
            <th className="w-[80px] border border-[var(--border-color)] px-4 py-2.5 text-left font-semibold">
              ID
            </th>
            <th className="border border-[var(--border-color)] px-4 py-2.5 text-left font-semibold">
              DEVICE NAME
            </th>
            <th className="border border-[var(--border-color)] px-4 py-2.5 text-left font-semibold">
              IP ADDRESS
            </th>

            <th className="w-[50px] border border-[var(--border-color)] px-4 py-2.5 text-center font-semibold">
              STATUS
            </th>
            <th className="w-[90px] border border-[var(--border-color)] px-4 py-2.5 text-center font-semibold">
              ACTIONS
            </th>
          </tr>
        </thead>
        <tbody>
          {cameras.length === 0 ? (
            <tr>
              <td colSpan={9} className="border border-[var(--border-color)]">
                <div className="flex flex-col items-center justify-center text-[var(--text-muted)] py-16">
                  <div className="w-16 h-16 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center mb-3">
                    <svg
                      width="28"
                      height="28"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="text-gray-300 dark:text-gray-500"
                    >
                      <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
                      <circle cx="12" cy="13" r="4" />
                    </svg>
                  </div>
                  <p className="text-sm font-medium uppercase">
                    NO DEVICES FOUND
                  </p>
                  <p className="text-xs mt-1 uppercase">
                    ADD A DEVICE TO GET STARTED
                  </p>
                </div>
              </td>
            </tr>
          ) : (
            cameras.map((cam) => {
              const isSliderOpenForThisCam = activeDetailCamera?.id === cam.id;

              return (
                <tr
                  key={cam.id}
                  className={`transition-colors duration-150 cursor-pointer ${selectedIds.includes(cam.id) ? "bg-blue-50" : "hover:bg-[var(--primary-color)]/[0.07]"}`}
                  onClick={() => onRowDetailsClick?.(cam)}
                >
                  <td
                    className="border border-[var(--border-color)] text-center px-4 py-2"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <input
                      type="checkbox"
                      className="w-4 h-4 accent-[var(--primary-color)] cursor-pointer rounded"
                      checked={selectedIds.includes(cam.id)}
                      onChange={() => toggleSelect?.(cam.id)}
                    />
                  </td>
                  <td className="border border-[var(--border-color)] px-4 py-2 text-sm font-mono text-left">
                    {cam.id}
                  </td>
                  <td className="border border-[var(--border-color)] px-4 py-2 text-sm truncate text-left">
                    {cam.name}
                  </td>
                  <td className="border border-[var(--border-color)] px-4 py-2 text-sm font-mono text-[var(--primary-color)] text-left">
                    {cam.ip}
                  </td>

                  <td className="border border-[var(--border-color)] text-center px-4 py-2">
                    <span
                      className={`w-2 h-2 rounded-full ${cam.status === "online" ? "bg-green-500" : "bg-red-500"}`}
                    ></span>
                  </td>
                  <td
                    className="border border-[var(--border-color)] text-center px-4 py-2"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <div className="flex justify-center items-center gap-0.5 opacity-60 hover:opacity-100 transition">
                      <button
                        onClick={() => {
                          if (isSliderOpenForThisCam) {
                            onRowDetailsClick?.(null);
                          } else {
                            onRowDetailsClick?.(cam);
                          }
                        }}
                        className={`p-1.5 rounded-lg transition ${isSliderOpenForThisCam ? "bg-[var(--primary-color)]/10 text-[var(--primary-color)]" : "hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-400 dark:text-gray-300"}`}
                        title={
                          isSliderOpenForThisCam
                            ? "Hide Details"
                            : "Show Details"
                        }
                      >
                        {isSliderOpenForThisCam ? (
                          <IoEye size={14} />
                        ) : (
                          <IoEyeOff size={14} />
                        )}
                      </button>
                      <button
                        onClick={() => handleDelete?.(cam.id)}
                        className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-red-500 dark:text-red-400 transition"
                        title="Delete Device"
                      >
                        <MdDelete size={14} />
                      </button>
                      <button
                        onClick={() => onEdit?.(cam)}
                        className="p-1.5 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/20 text-blue-500 dark:text-blue-400 transition"
                        title="Edit Device"
                      >
                        <CiEdit size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })
          )}
        </tbody>
      </table>
    </div>
  );
}

export default CameraTable;
