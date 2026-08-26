import { FaSearch, FaFilter } from "react-icons/fa";

const inputClass =
  "w-full px-3 py-2 bg-[var(--input-bg)] border border-[var(--border-color)] rounded-xl focus:border-[var(--primary-color)] outline-none transition-all text-xs text-[var(--text-dark)] placeholder-[var(--text-muted)]";

const selectClass = `${inputClass} cursor-pointer`;

function SearchVehicle({ filters, setFilters, onSearch, onReset }) {
  const handleChange = (e) => {
    setFilters({ ...filters, [e.target.name]: e.target.value });
  };

  return (
    <div className="bg-[var(--card-bg)] rounded-2xl border border-[var(--border-color)] shadow-sm p-3">
      {/* Title Row */}
      <div className="flex items-center justify-between mb-2"></div>

      {/* Fields Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 items-end">
        <div className="space-y-1">
          <label className="text-[10px] font-semibold uppercase tracking-wider text-[var(--text-dark)]">
            Vehicle Number
          </label>
          <input
            name="vehicleNumber"
            value={filters.vehicleNumber}
            onChange={handleChange}
            placeholder="e.g. DL01AB1234"
            className={inputClass}
          />
        </div>

        <div className="space-y-1">
          <label className="text-[10px] font-semibold uppercase tracking-wider text-[var(--text-dark)]">
            Date Range
          </label>
          <div className="flex items-center gap-1">
            <input
              type="date"
              name="dateFrom"
              value={filters.dateFrom}
              onChange={handleChange}
              className={`${inputClass} flex-1`}
            />
            <span className="text-[var(--text-dark)] text-xs">To</span>
            <input
              type="date"
              name="dateTo"
              value={filters.dateTo}
              onChange={handleChange}
              className={`${inputClass} flex-1`}
            />
          </div>
        </div>

        <div className="space-y-1">
          <label className="text-[10px] font-semibold uppercase tracking-wider text-[var(--text-dark)]">
            Time Range
          </label>
          <div className="flex items-center gap-1">
            <input
              type="time"
              name="timeFrom"
              value={filters.timeFrom}
              onChange={handleChange}
              className={`${inputClass} flex-1`}
            />
            <span className="text-[var(--text-dark)] text-xs">To</span>
            <input
              type="time"
              name="timeTo"
              value={filters.timeTo}
              onChange={handleChange}
              className={`${inputClass} flex-1`}
            />
          </div>
        </div>

        <div className="space-y-1">
          <label className="text-[10px] font-semibold uppercase tracking-wider text-[var(--text-dark)]">
            Vehicle Type
          </label>
          <select
            name="vehicleType"
            value={filters.vehicleType}
            onChange={handleChange}
            className={selectClass}
          >
            <option value="">All Types</option>
            <option value="Car">Car</option>
            <option value="Bike">Bike</option>
            <option value="Truck">Truck</option>
            <option value="Bus">Bus</option>
            <option value="Auto">Auto</option>
          </select>
        </div>
      </div>

      {/* Row 2 */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 items-end mt-3">
        <div className="space-y-1">
          <label className="text-[10px] font-semibold uppercase tracking-wider text-[var(--text-dark)]">
            Camera Name
          </label>
          <select
            name="camera"
            value={filters.camera}
            onChange={handleChange}
            className={selectClass}
          >
            <option value="">All Cameras</option>
            <option value="Gate 1 - Entry">Gate 1 - Entry</option>
            <option value="Gate 2 - Exit">Gate 2 - Exit</option>
            <option value="Gate 3 - Entry">Gate 3 - Entry</option>
            <option value="Road 1">Road 1</option>
            <option value="Road 2">Road 2</option>
            <option value="Parking Area">Parking Area</option>
          </select>
        </div>

        <div className="space-y-1">
          <label className="text-[10px] font-semibold uppercase tracking-wider text-[var(--text-dark)]">
            Vehicle Color
          </label>
          <select
            name="vehicleColor"
            value={filters.vehicleColor}
            onChange={handleChange}
            className={selectClass}
          >
            <option value="">All Colors</option>
            <option value="White">White</option>
            <option value="Black">Black</option>
            <option value="Silver">Silver</option>
            <option value="Red">Red</option>
            <option value="Blue">Blue</option>
            <option value="Yellow">Yellow</option>
            <option value="Green">Green</option>
          </select>
        </div>

        <div className="md:col-span-2 flex justify-end items-end gap-2 h-full">
          <button
            onClick={onReset}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-[var(--primary-color)] hover:bg-[var(--primary-color)]/10 rounded-lg transition-colors"
          >
            <FaFilter size={12} />
            Reset
          </button>

          <button
            onClick={onSearch}
            className="flex items-center gap-1.5 px-5 py-2 text-xs font-bold text-white bg-[var(--primary-color)] rounded-xl hover:opacity-90 transition-opacity shadow-lg"
          >
            <FaSearch size={12} />
            Search
          </button>
        </div>
      </div>
    </div>
  );
}

export default SearchVehicle;
