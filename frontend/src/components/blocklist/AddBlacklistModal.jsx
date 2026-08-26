import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { IoClose, IoCameraOutline } from "react-icons/io5";
import { motion, AnimatePresence } from "framer-motion";

const states = [
  "Andhra Pradesh",
  "Bihar",
  "Delhi",
  "Goa",
  "Gujarat",
  "Haryana",
  "Karnataka",
  "Kerala",
  "Madhya Pradesh",
  "Maharashtra",
  "Punjab",
  "Rajasthan",
  "Tamil Nadu",
  "Telangana",
  "Uttar Pradesh",
  "West Bengal",
];

const vehicleTypes = [
  "Sedan",
  "SUV",
  "Hatchback",
  "Coupe",
  "Convertible",
  "Two-Wheeler",
  "Commercial Vehicle",
  "Truck",
  "Bus",
];

const brands = [
  "Maruti",
  "Hyundai",
  "Tata",
  "Mahindra",
  "Toyota",
  "Kia",
  "Honda",
  "MG",
  "Volkswagen",
  "Skoda",
  "Renault",
  "Nissan",
  "Ford",
  "Jeep",
  "BMW",
  "Mercedes-Benz",
  "Audi",
];

const reasons = ["Stolen Vehicle", "Hit and Run", "Fraud", "Other Reason"];

const dateLabels = {
  "Stolen Vehicle": "Stolen Date",
  "Hit and Run": "Incident Date",
  Fraud: "Fraud Date",
  "Other Reason": "Date",
};

const subReasons = {
  "Stolen Vehicle": [
    "Theft from parking",
    "Carjacking",
    "Break-in theft",
    "Organized theft ring",
  ],
  "Hit and Run": [
    "Accident fled scene",
    "Property damage",
    "Injury caused",
    "Fatal accident",
  ],
  Fraud: [
    "Insurance fraud",
    "Registration fraud",
    "Sale of stolen vehicle",
    "Document forgery",
  ],
  "Other Reason": [
    "Police investigation",
    "Court order",
    "Missing vehicle",
    "Suspicious activity",
  ],
};

const colorOptions = [
  { name: "White", hex: "#f3f4f6" },
  { name: "Black", hex: "#1f2937" },
  { name: "Silver", hex: "#9ca3af" },
  { name: "Grey", hex: "#6b7280" },
  { name: "Red", hex: "#ef4444" },
  { name: "Blue", hex: "#3b82f6" },
  { name: "Green", hex: "#22c55e" },
  { name: "Yellow", hex: "#eab308" },
  { name: "Orange", hex: "#f97316" },
  { name: "Brown", hex: "#92400e" },
];

const users = [
  "Inspector Rajesh",
  "SI Anil Kumar",
  "Inspector Sandeep",
  "ASI Pankaj",
  "Inspector Mohan",
];

const inputClass =
  "w-full px-3 sm:px-4 py-2 sm:py-2.5 bg-[var(--input-bg)] border border-[var(--border-color)] rounded-xl focus:border-[var(--primary-color)] outline-none transition-all placeholder:text-[var(--text-muted)] text-xs sm:text-sm text-[var(--text-dark)]";

const optionClass = "text-[var(--text-dark)] bg-[var(--input-bg)]";

const labelClass =
  "text-[10px] sm:text-xs font-semibold uppercase tracking-wider text-[var(--text-dark)] flex items-center gap-1";

function AddBlacklistModal({ isOpen, onClose, onSave, initialData }) {
  const buildForm = (data) => ({
    vehicleNumber: data?.vehicleNumber || "",
    registrationState: data?.registrationState || "",
    vehicleType: data?.vehicleType || "",
    brand: data?.brand || "",
    model: data?.model || "",
    reason: data?.reason || "",
    customReason: data?.customReason || "",
    subReason: data?.subReason || "",
    stolenDate: data?.stolenDate || "",
    blacklistedBy: data?.blacklistedBy || "",
    policeStation: data?.policeStation || "",
    district: data?.district || "",
    caseNumber: data?.caseNumber || "",
    vehicleColor: data?.vehicleColor || "",
    remarks: data?.remarks || "",
  });

  const [form, setForm] = useState(() => buildForm(initialData));

  useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, [onClose]);

  useEffect(() => {
    setForm(buildForm(initialData));
  }, [initialData]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === "reason") {
      setForm((prev) => ({
        ...prev,
        reason: value,
        customReason: "",
      }));
    } else {
      setForm((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleColorSelect = (colorName) => {
    setForm({ ...form, vehicleColor: colorName });
  };

  const handleSubmit = () => {
    if (!form.vehicleNumber || !form.reason) return;
    onSave(form);
    onClose();
  };

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-[9999] flex items-center justify-center p-2 sm:p-4 bg-black/50"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <motion.div
            onClick={(e) => e.stopPropagation()}
            initial={{ opacity: 0, scale: 0.95, y: 30 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 30 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
            className="w-full max-w-5xl max-h-[95vh] sm:max-h-[90vh] bg-[var(--card-bg)] text-[var(--text-dark)] rounded-2xl sm:rounded-3xl border border-[var(--border-color)] shadow-2xl overflow-hidden flex flex-col"
          >
            {/* HEADER */}
            <div className="flex justify-between items-center px-4 sm:px-8 py-4 sm:py-5 border-b border-[var(--border-color)]">
              <div>
                <h2 className="text-sm sm:text-lg font-bold tracking-tight text-[var(--text-dark)]">
                  {initialData
                    ? "Edit Blacklisted Vehicle"
                    : "Add Blacklisted Vehicle"}
                </h2>
              </div>
              <button
                onClick={onClose}
                className="p-2 rounded-full text-[var(--text-dark)] hover:text-[var(--text-dark)] hover:bg-[var(--hover-bg)] transition-colors"
              >
                <IoClose size={20} />
              </button>
            </div>

            {/* FORM BODY */}
            <div className="p-4 sm:p-6 overflow-y-auto flex-1">
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-6 gap-x-4 gap-y-4">
                {/* Row 1 */}
                <div className="space-y-1.5">
                  <label className={labelClass}>Vehicle Number</label>
                  <input
                    name="vehicleNumber"
                    value={form.vehicleNumber}
                    onChange={handleChange}
                    placeholder="e.g. DL9BAR1234"
                    className={inputClass}
                  />
                </div>

                <div className="space-y-1.5">
                  <label className={labelClass}>Case Number / FIR No.</label>
                  <input
                    name="caseNumber"
                    value={form.caseNumber}
                    onChange={handleChange}
                    placeholder="Enter Case or FIR"
                    className={inputClass}
                  />
                </div>

                <div className="space-y-1.5">
                  <label className={labelClass}>FIR No. Date</label>
                  <input
                    type="date"
                    name="stolenDate"
                    value={form.stolenDate}
                    onChange={handleChange}
                    className={inputClass}
                  />
                </div>

                <div className="space-y-1.5">
                  <label className={labelClass}>Reason</label>
                  {form.reason === "Other Reason" ? (
                    <div className="relative">
                      <input
                        name="customReason"
                        value={form.customReason}
                        onChange={handleChange}
                        placeholder="Enter custom reason"
                        className={inputClass}
                      />
                      <button
                        type="button"
                        onClick={() =>
                          setForm((prev) => ({
                            ...prev,
                            reason: "",
                            customReason: "",
                          }))
                        }
                        className="absolute right-2 top-1/2 -translate-y-1/2 text-[var(--text-muted)] hover:text-[var(--text-dark)] text-xs"
                      >
                        Change
                      </button>
                    </div>
                  ) : (
                    <select
                      name="reason"
                      value={form.reason}
                      onChange={handleChange}
                      className={`${inputClass} cursor-pointer`}
                    >
                      <option value="" className={optionClass}>
                        Select Reason
                      </option>
                      {reasons.map((r) => (
                        <option key={r} value={r} className={optionClass}>
                          {r}
                        </option>
                      ))}
                    </select>
                  )}
                </div>

                <div className="space-y-1.5">
                  <label className={labelClass}>Date</label>
                  <input
                    type="date"
                    name="incidentDate"
                    value={form.incidentDate || ""}
                    onChange={handleChange}
                    className={inputClass}
                  />
                </div>

                <div className="space-y-1.5">
                  <label className={labelClass}>Vehicle Type</label>
                  <select
                    name="vehicleType"
                    value={form.vehicleType}
                    onChange={handleChange}
                    className={`${inputClass} cursor-pointer`}
                  >
                    <option value="" className={optionClass}>
                      Select Type
                    </option>
                    {vehicleTypes.map((t) => (
                      <option key={t} value={t} className={optionClass}>
                        {t}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Row 2 */}
                <div className="space-y-1.5">
                  <label className={labelClass}>Vehicle Color</label>
                  <select
                    name="vehicleColor"
                    value={form.vehicleColor}
                    onChange={handleChange}
                    className={`${inputClass} cursor-pointer`}
                  >
                    <option value="" className={optionClass}>
                      All Colors
                    </option>
                    {colorOptions.map((c) => (
                      <option
                        key={c.name}
                        value={c.name}
                        className={optionClass}
                      >
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5 sm:col-span-2 md:col-span-5">
                  <label className={labelClass}>Remarks</label>
                  <input
                    name="remarks"
                    value={form.remarks}
                    onChange={handleChange}
                    placeholder="Enter remarks (optional)"
                    maxLength={200}
                    className={inputClass}
                  />
                </div>
              </div>
            </div>

            {/* FOOTER */}
            <div className="flex justify-end gap-2 sm:gap-3 px-4 sm:px-6 py-3 sm:py-4 border-t border-[var(--border-color)]">
              <button
                type="button"
                onClick={onClose}
                className="px-4 sm:px-5 py-2 rounded-xl text-[var(--text-muted)] hover:text-[var(--text-dark)] hover:bg-[var(--hover-bg)] transition-all text-xs sm:text-sm font-semibold border border-[var(--border-color)]"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSubmit}
                className="px-4 sm:px-6 py-2 bg-[var(--primary-color)] hover:opacity-90 text-white rounded-xl text-xs sm:text-sm font-bold shadow-lg transition-all active:scale-[0.98]"
              >
                {initialData ? "Update" : "Add Blacklist Vehicle"}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body,
  );
}

export default AddBlacklistModal;
