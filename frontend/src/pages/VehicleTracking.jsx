import { useState } from "react";
import BodyHead from "../components/common/BodyHead";
import SearchVehicle from "../components/VehicleTracking/SearchVehicle";
import DetectionResultsTable from "../components/VehicleTracking/DetectionResultsTable";
import VehicleMovementPath from "../components/VehicleTracking/VehicleMovementPath";
import { FaCarSide } from "react-icons/fa";

function VehicleTracking() {
  const [selectedVehicle, setSelectedVehicle] = useState("DL01AB1234");
  const [filters, setFilters] = useState({
    vehicleNumber: "",
    dateFrom: "",
    dateTo: "",
    timeFrom: "",
    timeTo: "",
    camera: "",
    vehicleType: "",
    vehicleColor: "",
    direction: "",
  });

  const handleSearch = () => {
    console.log("Search with filters:", filters);
  };

  const handleReset = () => {
    setFilters({
      vehicleNumber: "",
      dateFrom: "",
      dateTo: "",
      timeFrom: "",
      timeTo: "",
      camera: "",
      vehicleType: "",
      vehicleColor: "",
      direction: "",
    });
  };

  const handleSelectVehicle = (vehicleNumber) => {
    setSelectedVehicle(vehicleNumber);
  };

  return (
    <div className="flex flex-col h-full min-w-0 relative overflow-hidden">
      {/* ================= HEADER ================= */}
      <BodyHead>
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between w-full gap-2 sm:gap-0">
          <div className="flex items-center gap-2">
            <div className=" flex-shrink-0">
              <FaCarSide className="text-[var(--primary-color)] text-[22px]" />
            </div>
            <div>
              <h2 className="text-[18px] md:text-[18px] font-bold tracking-tight text-[var(--text-dark)] leading-none">
                Vehicle Tracking
              </h2>
            </div>
          </div>
        </div>
      </BodyHead>

      {/* ================= CONTENT ================= */}
      <div className="flex-1 min-h-0 flex flex-col p-2 gap-2 overflow-y-auto overflow-x-hidden">
        {/* Search Panel */}
        <SearchVehicle
          filters={filters}
          setFilters={setFilters}
          onSearch={handleSearch}
          onReset={handleReset}
        />

        {/* Table + Map Side by Side on desktop, stacked on mobile */}
        <div className="flex-1 min-h-0 flex flex-col lg:flex-row gap-2">
          {/* Detection Results Table */}
          <div className="lg:w-2/3 min-h-[400px] lg:min-h-0">
            <DetectionResultsTable
              onSelectVehicle={handleSelectVehicle}
              selectedVehicleNumber={selectedVehicle}
            />
          </div>

          {/* Vehicle Movement Path Map */}
          <div className="lg:w-1/3 min-h-[400px] md:min-h-[450px] lg:min-h-0">
            <VehicleMovementPath
              vehicleNumber={selectedVehicle}
              onClose={() => setSelectedVehicle(null)}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

export default VehicleTracking;
