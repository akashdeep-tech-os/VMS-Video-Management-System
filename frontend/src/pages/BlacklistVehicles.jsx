import { useState, useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import BodyHead from "../components/common/BodyHead";
import BodyContainer from "../components/common/BodyContainer";
import BlacklistHeader from "../components/blocklist/BlacklistHeader";
import BlacklistTable from "../components/blocklist/BlacklistTable";
import AddBlacklistModal from "../components/blocklist/AddBlacklistModal";
import ConfirmDeleteModal from "../components/common/ConfirmDeleteModal";

const allVehicles = [
  {
    id: 1,
    number: "DL9BAR1234",
    vehicleType: "SUV",
    color: "White",
    reason: "Stolen Vehicle",
    blacklistedOn: "25-06-2026 11:30 AM",
    caseNo: "FIR/2026/1256",
    status: "Active",
    blockedIn: "Main Entrance Camera",
  },
  {
    id: 2,
    number: "HR26DK3915",
    vehicleType: "SUV",
    color: "Black",
    reason: "Other Reason",
    blacklistedOn: "20-06-2026 04:15 PM",
    caseNo: "FIR/2026/0587",
    status: "Active",
    blockedIn: "Parking Camera",
  },
  {
    id: 3,
    number: "UP16CA4567",
    vehicleType: "Sedan",
    color: "Silver",
    reason: "Stolen Vehicle",
    blacklistedOn: "18-06-2026 09:45 AM",
    caseNo: "FIR/2026/0745",
    status: "Found",
    blockedIn: "Back Gate Camera",
    foundedIn: "Main Entrance Camera",
    foundedTimestamp: "18-06-2026 10:30 AM",
  },
  {
    id: 4,
    number: "PB10E7788",
    vehicleType: "SUV",
    color: "Red",
    reason: "Other Reason",
    blacklistedOn: "15-06-2026 02:20 PM",
    caseNo: "FIR/2026/0633",
    status: "Active",
    blockedIn: "Warehouse Camera",
  },
  {
    id: 5,
    number: "RJ14UA9911",
    vehicleType: "SUV",
    color: "White",
    reason: "Stolen Vehicle",
    blacklistedOn: "10-06-2026 10:05 AM",
    caseNo: "FIR/2026/0412",
    status: "Found",
    blockedIn: "Corridor Camera",
    foundedIn: "Parking Camera",
    foundedTimestamp: "10-06-2026 11:45 AM",
  },
  {
    id: 6,
    number: "DL3CCT1234",
    vehicleType: "SUV",
    color: "Yellow",
    reason: "Stolen Vehicle",
    blacklistedOn: "12-06-2026 03:00 PM",
    caseNo: "FIR/2026/0500",
    status: "Active",
    blockedIn: "Lift Camera",
  },
  {
    id: 7,
    number: "KA01MN4567",
    vehicleType: "Sedan",
    color: "Blue",
    reason: "Fraud",
    blacklistedOn: "08-06-2026 11:00 AM",
    caseNo: "FIR/2026/0380",
    status: "Active",
    blockedIn: "Office Floor Camera",
  },
  {
    id: 8,
    number: "MH02DK1234",
    vehicleType: "SUV",
    color: "Black",
    reason: "Hit and Run",
    blacklistedOn: "05-06-2026 09:30 AM",
    caseNo: "FIR/2026/0290",
    status: "Found",
    blockedIn: "Reception Camera",
    foundedIn: "Back Gate Camera",
    foundedTimestamp: "05-06-2026 10:15 AM",
  },
  {
    id: 9,
    number: "TN09AB3322",
    vehicleType: "Hatchback",
    color: "White",
    reason: "Stolen Vehicle",
    blacklistedOn: "01-06-2026 02:15 PM",
    caseNo: "FIR/2026/0210",
    status: "Active",
    blockedIn: "Main Entrance Camera",
  },
  {
    id: 10,
    number: "GJ05CD8899",
    vehicleType: "SUV",
    color: "Red",
    reason: "Other Reason",
    blacklistedOn: "28-05-2026 04:45 PM",
    caseNo: "FIR/2026/0180",
    status: "Found",
    blockedIn: "Warehouse Camera",
    foundedIn: "Corridor Camera",
    foundedTimestamp: "28-05-2026 06:00 PM",
  },
];

export const BlacklistIcon = ({ className }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    width="1em"
    height="1em"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.8"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    {/* Car body */}
    <path d="M3 14.5h18v3a1.5 1.5 0 0 1-1.5 1.5h-15A1.5 1.5 0 0 1 3 17.5v-3z" />
    <path d="M5.5 14.5l2-5.5a1 1 0 0 1 1-.5h7a1 1 0 0 1 1 .5l2 5.5" />
    {/* Wheels */}
    <circle cx="7" cy="19" r="1.2" />
    <circle cx="17" cy="19" r="1.2" />
    {/* Windshield line */}
    <line x1="9.5" y1="10" x2="14.5" y2="10" />
    {/* Shield / ban badge */}
    <circle cx="18" cy="6" r="4.5" strokeWidth="1.6" />
    <line x1="15.5" y1="6" x2="20.5" y2="6" strokeWidth="1.8" />
  </svg>
);

function BlacklistVehicles() {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialTab = searchParams.get("tab") || "blacklist";

  const [search, setSearch] = useState("");
  const [reasonFilter, setReasonFilter] = useState("");
  const [activeTab, setActiveTab] = useState(initialTab);
  const [showModal, setShowModal] = useState(false);
  const [editingVehicle, setEditingVehicle] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);

  const counts = useMemo(
    () => ({
      total: allVehicles.length,
      blacklist: allVehicles.filter((v) => v.status === "Active").length,
      found: allVehicles.filter((v) => v.status === "Found").length,
    }),
    [],
  );

  const filteredData = useMemo(() => {
    let data = allVehicles;

    if (activeTab === "blacklist")
      data = data.filter((v) => v.status === "Active");
    else if (activeTab === "found")
      data = data.filter((v) => v.status === "Found");

    if (reasonFilter) data = data.filter((v) => v.reason === reasonFilter);

    if (search) {
      const q = search.toLowerCase();
      data = data.filter(
        (v) =>
          v.number.toLowerCase().includes(q) ||
          v.reason.toLowerCase().includes(q) ||
          v.caseNo.toLowerCase().includes(q),
      );
    }

    return data;
  }, [activeTab, reasonFilter, search]);

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    setSearchParams({ tab });
  };

  const handleAddClick = () => {
    setEditingVehicle(null);
    setShowModal(true);
  };

  const handleEditClick = (vehicle) => {
    setEditingVehicle(vehicle);
    setShowModal(true);
  };

  const handleSaveVehicle = (vehicleData) => {
    console.log("Save vehicle:", vehicleData);
    // TODO: API call to save vehicle
  };

  const triggerDelete = (id) => {
    setDeleteTarget(id);
  };

  const executeDelete = () => {
    console.log("Delete vehicle:", deleteTarget);
    // TODO: API call to delete vehicle
    setDeleteTarget(null);
  };

  return (
    <div className="flex flex-col h-full min-w-0 relative overflow-hidden">
      {/* HEADER */}
      <BodyHead>
        <div className="flex items-center gap-2">
          <div className=" flex-shrink-0">
            <BlacklistIcon className="text-[var(--primary-color)] text-2xl" />
          </div>
          <div>
            <h2 className="text-[18px] md:text-[18px] font-bold tracking-tight text-[var(--text-dark)] leading-none">
              Blacklist Vehicles
            </h2>
          </div>
        </div>
      </BodyHead>

      {/* CONTENT */}
      <div className="flex-1 min-h-0 flex flex-col p-2 gap-2 overflow-hidden">
        {/* ADD FORM CARD */}
        <div className="shrink-0 bg-[var(--card-bg)] rounded-2xl border border-[var(--border-color)] shadow-sm px-3 md:px-4 py-3">
          <h3 className="text-xs md:text-sm font-bold text-[var(--text-dark)] mb-2">
            Add Blacklist Vehicle
          </h3>
          <AddBlacklistInline
            onSave={handleSaveVehicle}
            onCancel={() => setShowModal(false)}
          />
        </div>

        {/* TABLE CARD */}
        <div className="flex-1 min-h-0 bg-[var(--card-bg)] rounded-2xl border border-[var(--border-color)] shadow-sm px-3 md:px-4 py-3 flex flex-col overflow-hidden">
          <BlacklistHeader
            search={search}
            setSearch={setSearch}
            reasonFilter={reasonFilter}
            setReasonFilter={setReasonFilter}
            activeTab={activeTab}
            setActiveTab={handleTabChange}
            counts={counts}
          />

          <div className="flex-1 min-h-0 mt-2 flex flex-col overflow-hidden">
            <BlacklistTable
              data={filteredData}
              onEdit={handleEditClick}
              onDelete={triggerDelete}
              activeTab={activeTab}
            />
          </div>
        </div>
      </div>

      {/* MODALS */}
      <AddBlacklistModal
        key={`${showModal}-${editingVehicle?.id || "new"}`}
        isOpen={showModal}
        onClose={() => {
          setShowModal(false);
          setEditingVehicle(null);
        }}
        onSave={handleSaveVehicle}
        initialData={editingVehicle}
      />

      <ConfirmDeleteModal
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={executeDelete}
        title="Delete Blacklisted Vehicle"
        message="Are you sure you want to remove this vehicle from the blocklist? This action cannot be undone."
      />
    </div>
  );
}

/* ========== INLINE ADD FORM ========== */
function AddBlacklistInline({ onSave, onCancel }) {
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

  const [form, setForm] = useState({
    vehicleNumber: "",
    caseNumber: "",
    vehicleType: "",
    brand: "",
    reason: "",
    customReason: "",
    stolenDate: "",
    vehicleColor: "",
    remarks: "",
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === "reason") {
      setForm((prev) => ({
        ...prev,
        reason: value,
        customReason: value !== "Other Reason" ? "" : prev.customReason,
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
    setForm({
      vehicleNumber: "",
      caseNumber: "",
      vehicleType: "",
      brand: "",
      reason: "",
      customReason: "",
      stolenDate: "",
      vehicleColor: "",
      remarks: "",
    });
  };

  const inputClass =
    "w-full px-3 py-2 bg-[var(--input-bg)] border border-[var(--border-color)] rounded-xl focus:border-[var(--primary-color)] outline-none transition-all text-xs text-[var(--text-dark)] placeholder-[var(--text-muted)]";

  const selectClass = `${inputClass} cursor-pointer`;

  return (
    <div className="space-y-2">
      {/* Row 1: Vehicle Number, Case Number, Vehicle Type, Brand, Reason, Stolen Date */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2">
        <div className="space-y-1">
          <label className="text-[10px] font-semibold uppercase tracking-wider text-[var(--text-dark)]">
            Vehicle Number
          </label>
          <input
            name="vehicleNumber"
            value={form.vehicleNumber}
            onChange={handleChange}
            placeholder="e.g. DL9BAR1234"
            className={inputClass}
          />
        </div>

        <div className="space-y-1">
          <label className="text-[10px] font-semibold uppercase tracking-wider text-[var(--text-dark)]">
            Case Number / FIR No.
          </label>
          <input
            name="caseNumber"
            value={form.caseNumber}
            onChange={handleChange}
            placeholder="Enter Case or FIR"
            className={inputClass}
          />
        </div>

        <div className="space-y-1">
          <label className="text-[10px] font-semibold uppercase tracking-wider text-[var(--text-dark)]">
            FIR No. Date
          </label>
          <input
            type="date"
            name="firDate"
            value={form.firDate}
            onChange={handleChange}
            className={inputClass}
          />
        </div>

        <div className="space-y-1">
          <label className="text-[10px] font-semibold uppercase tracking-wider text-[var(--text-dark)]">
            Reason
          </label>
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
                  setForm((prev) => ({ ...prev, reason: "", customReason: "" }))
                }
                className="absolute right-2 top-1/2 -translate-y-1/2 text-[var(--text-muted)] hover:text-[var(--text-dark)] text-[10px]"
              >
                Change
              </button>
            </div>
          ) : (
            <select
              name="reason"
              value={form.reason}
              onChange={handleChange}
              className={selectClass}
            >
              <option value="">Select Reason</option>
              {reasons.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
          )}
        </div>

        <div className="space-y-1">
          <label className="text-[10px] font-semibold uppercase tracking-wider text-[var(--text-dark)]">
            {dateLabels[form.reason] || "Date"}
          </label>
          <input
            type="date"
            name="stolenDate"
            value={form.stolenDate}
            onChange={handleChange}
            className={inputClass}
          />
        </div>

        <div className="space-y-1">
          <label className="text-[10px] font-semibold uppercase tracking-wider text-[var(--text-dark)]">
            Vehicle Type
          </label>
          <select
            name="vehicleType"
            value={form.vehicleType}
            onChange={handleChange}
            className={selectClass}
          >
            <option value="">Select Type</option>
            {vehicleTypes.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Row 2: Color, Remarks, Buttons */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-6 gap-2 items-end">
        <div className="space-y-1 sm:col-span-1 md:col-span-2">
          <label className="text-[10px] font-semibold uppercase tracking-wider text-[var(--text-dark)]">
            Vehicle Color
          </label>
          <select
            name="vehicleColor"
            value={form.vehicleColor}
            onChange={handleChange}
            className={`${inputClass} cursor-pointer`}
          >
            <option value="">All Colors</option>
            {colorOptions.map((c) => (
              <option key={c.name} value={c.name}>
                {c.name}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-1 sm:col-span-1 md:col-span-3">
          <label className="text-[10px] font-semibold uppercase tracking-wider text-[var(--text-dark)]">
            Remarks
          </label>
          <input
            name="remarks"
            value={form.remarks}
            onChange={handleChange}
            placeholder="Enter remarks (optional)"
            maxLength={200}
            className={inputClass}
          />
        </div>

        <div className="flex items-end justify-end gap-2 sm:col-span-2 md:col-span-1">
          <button
            type="button"
            onClick={onCancel}
            className="px-3 md:px-4 py-2 rounded-xl text-[var(--text-muted)] hover:text-[var(--text-dark)] hover:bg-[var(--hover-bg)] transition-all text-xs font-semibold border border-[var(--border-color)]"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            className="px-4 md:px-5 py-2 bg-[var(--primary-color)] hover:opacity-90 text-white rounded-xl text-xs font-bold shadow-lg transition-all active:scale-[0.98]"
          >
            Add
          </button>
        </div>
      </div>
    </div>
  );
}

export default BlacklistVehicles;
