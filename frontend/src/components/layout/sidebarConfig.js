import {
  FaHome,
  FaVideo,
  FaPlayCircle,
  FaCarSide,
  FaCar,
  FaCog,
  FaClipboardList,
  FaInfoCircle,
} from "react-icons/fa";
import { HiOutlineDocumentChartBar } from "react-icons/hi2";





import { BarChart3 } from "lucide-react";


import {
  MdOutlineOndemandVideo,
} from "react-icons/md";

import { TbFaceId } from "react-icons/tb";
import { IoMdPeople } from "react-icons/io";
import { TbLine, TbTarget } from "react-icons/tb";

import {
  HiOutlineUserAdd,
} from "react-icons/hi";

import { BsFillGridFill } from "react-icons/bs";

import { BlacklistIcon } from "../../pages/BlacklistVehicles";

export const sidebarConfig = [
  {
    type: "single",
    name: "Dashboard",
    path: "/dashboard",
    icon: FaHome,
  },

  // VIDEO MANAGEMENT
  {
    type: "group",
    key: "video",
    title: "Video Management",
    icon: MdOutlineOndemandVideo,
    children: [
      { name: "Live Monitoring", path: "/live", icon: FaVideo },
      { name: "Playback", path: "/playback", icon: FaPlayCircle },
      { name: "Reports", path: "/reports", icon: FaClipboardList },
    ],
  },

  // ANPR SYSTEM
  {
    type: "group",
    key: "anpr",
    title: "ANPR System",
    icon: FaCar,
    children: [
      { name: "ANPR Dashboard", path: "/anpr-dashboard", icon: BsFillGridFill },
      { name: "Vehicle Tracking", path: "/tracking", icon: FaCarSide },
      { name: "Blacklist Vehicles", path: "/blacklist-vehicles", icon: BlacklistIcon },
      { name: "ANPR Reports", path: "/anpr-reports", icon: HiOutlineDocumentChartBar },
    ],
  },



  // ABOUT
  {
    type: "single",
    name: "About",
    path: "/about",
    icon: FaInfoCircle,
  },

  // SETTINGS (Clickable, no dropdown)
  {
    type: "single",
    name: "Settings",
    path: "/settings",
    icon: FaCog,
  },
];