import {
  FaServer,
  FaDatabase,
  FaShieldAlt,
  FaNetworkWired,
  FaCogs,
  FaCheckCircle,
  FaTimesCircle,
  FaExclamationTriangle,
} from "react-icons/fa";

const VMSDetails = () => {
  const vmsInfo = {
    system: {
      name: "Surakshit VMS",
      version: "v2.4.0",
      licenseStatus: "Active",
      licenseType: "Enterprise Edition",
      licenseExpiry: "2025-12-31",
      activationDate: "2024-01-15",
      cameraLicense: { used: 95, total: 100 },
    },
    resources: {
      totalCameras: 1000,
      activeCameras: 456,
      totalUsers: 100,
      activeUsers: 23,
      storageTotal: "50 TB",
      storageUsed: "32 TB",
      storagePercentage: 64,
      networkBandwidth: "1 Gbps",
      bandwidthUsage: "45%",
    },
    features: [
      {
        name: "Analytics Engine",
        activationDate: "2024-01-15",
        quantity: 1,
        status: true,
      },
      {
        name: "Facial Recognition",
        activationDate: "2024-02-20",
        quantity: 1,
        status: true,
      },
      {
        name: "License Plate Recognition",
        activationDate: "2024-03-10",
        quantity: 1,
        status: true,
      },
      {
        name: "Video Wall Support",
        activationDate: "2024-04-05",
        quantity: 1,
        status: true,
      },
      {
        name: "Mobile App Support",
        activationDate: "2024-05-12",
        quantity: 1,
        status: true,
      },
      {
        name: "Cloud Backup",
        activationDate: "2024-06-18",
        quantity: 1,
        status: true,
      },
      {
        name: "AI Detection",
        activationDate: "2024-07-22",
        quantity: 1,
        status: true,
      },
      {
        name: "Intrusion Detection",
        activationDate: "2024-08-30",
        quantity: 1,
        status: true,
      },
    ],
    health: {
      serverStatus: "online",
      databaseStatus: "online",
      backupStatus: "completed",
      lastSystemCheck: "2024-07-08 14:30:00",
      cpuUsage: 35,
      memoryUsage: 68,
      diskUsage: 64,
    },
    support: {
      companyName: "Surakshit City",
      supportEmail: "connect@surakshitcity.com",
      supportPhone: "+91-7999999367",
      website: "www.surakshitcity.com",
    },
  };

  const StatusIndicator = ({ status }) => {
    const colors = {
      online: "bg-green-500",
      offline: "bg-red-500",
      warning: "bg-amber-500",
      completed: "bg-green-500",
      pending: "bg-amber-500",
    };
    return (
      <span
        className={`w-2 h-2 rounded-full ${colors[status] || "bg-gray-500"}`}
      />
    );
  };

  const FeatureStatus = ({ enabled }) =>
    enabled ? (
      <span className="flex justify-center">
        <FaCheckCircle className="text-green-500 text-sm" />
      </span>
    ) : (
      <span className="flex justify-center">
        <FaTimesCircle className="text-red-500 text-sm" />
      </span>
    );

  const ProgressBar = ({ percentage, color = "bg-[var(--primary-color)]" }) => (
    <div className="w-full bg-gray-200 rounded-full h-2">
      <div
        className={`${color} h-2 rounded-full transition-all duration-300`}
        style={{ width: `${percentage}%` }}
      />
    </div>
  );

  return (
    <div className="space-y-4">
      {/* System Overview */}
      <div className="bg-[var(--input-bg)] rounded-xl border border-[var(--border-color)] overflow-hidden">
        <div className="bg-gradient-to-r from-[var(--primary-color)]/10 to-transparent p-3 border-b border-[var(--border-color)]">
          <h3 className="text-sm font-bold text-[var(--text-dark)] flex items-center gap-2">
            <FaServer className="text-[var(--primary-color)]" />
            System Overview
          </h3>
        </div>
        <div className="p-3 space-y-2.5">
          <div className="flex justify-between items-center">
            <span className="text-xs text-[var(--text-muted)]">
              Software Name
            </span>
            <span className="text-xs font-medium text-[var(--text-dark)]">
              {vmsInfo.system.name}
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-xs text-[var(--text-muted)]">Version</span>
            <span className="text-xs font-medium text-[var(--text-dark)]">
              {vmsInfo.system.version}
            </span>
          </div>

          <div className="flex justify-between items-center">
            <span className="text-xs text-[var(--text-muted)]">
              License Status
            </span>
            <span
              className={`text-xs font-medium ${vmsInfo.system.licenseStatus === "Active" ? "text-green-600" : "text-red-600"}`}
            >
              {vmsInfo.system.licenseStatus}
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-xs text-[var(--text-muted)]">
              License Type
            </span>
            <span className="text-xs font-medium text-[var(--text-dark)]">
              {vmsInfo.system.licenseType}
            </span>
          </div>

          <div className="flex justify-between items-center">
            <span className="text-xs text-[var(--text-muted)]">
              Activation Date
            </span>
            <span className="text-xs font-medium text-[var(--text-dark)]">
              {vmsInfo.system.activationDate}
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-xs text-[var(--text-muted)]">
              Expiry Date
            </span>
            <span className="text-xs font-medium text-[var(--text-dark)]">
              {vmsInfo.system.licenseExpiry}
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-xs text-[var(--text-muted)]">
              Camera License
            </span>
            <span className="text-xs font-medium text-[var(--text-dark)]">
              {vmsInfo.system.cameraLicense.used}/
              {vmsInfo.system.cameraLicense.total}
            </span>
          </div>
        </div>
      </div>

      {/* Feature Status */}
      <div className="bg-[var(--input-bg)] rounded-xl border border-[var(--border-color)] overflow-hidden">
        <div className="bg-gradient-to-r from-[var(--primary-color)]/10 to-transparent p-3 border-b border-[var(--border-color)]">
          <h3 className="text-sm font-bold text-[var(--text-dark)] flex items-center gap-2">
            <FaCogs className="text-[var(--primary-color)]" />
            Feature Status
          </h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-[var(--border-color)] bg-[var(--card-bg)]">
                <th className="px-3 py-2 text-[10px] font-semibold uppercase tracking-wider text-[var(--text-muted)]">
                  Feature
                </th>

                <th className="px-3 py-2 text-[10px] font-semibold uppercase tracking-wider text-[var(--text-muted)] text-center w-[80px]">
                  Quantity
                </th>
                <th className="px-3 py-2 text-[10px] font-semibold uppercase tracking-wider text-[var(--text-muted)] text-center w-[80px]">
                  Status
                </th>
              </tr>
            </thead>
            <tbody>
              {vmsInfo.features.map((feature, idx) => (
                <tr
                  key={idx}
                  className="border-b border-[var(--border-color)] last:border-b-0 hover:bg-[var(--hover-bg)] transition"
                >
                  <td className="px-3 py-2 text-xs font-medium text-[var(--text-dark)]">
                    {feature.name}
                  </td>

                  <td className="px-3 py-2 text-xs text-[var(--text-dark)] text-center">
                    {feature.quantity}
                  </td>
                  <td className="px-3 py-2 text-center">
                    <FeatureStatus enabled={feature.status} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default VMSDetails;
