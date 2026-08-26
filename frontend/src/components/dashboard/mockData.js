// ============================================
// CENTRALIZED MOCK DATA FOR VMS DASHBOARD
// ============================================
import { Users, Camera, Wifi, WifiOff, Bell } from "lucide-react";

// Police Station Districts
export const districts = [
  { id: "d1", name: "Muradka", zone: "North" },
  { id: "d2", name: "Nangloi", zone: "West" },
  { id: "d3", name: "Nihal Vihar", zone: "West" },
  { id: "d4", name: "Sultan Puri", zone: "North" },
  { id: "d5", name: "Paschim Vihar East", zone: "West" },
  { id: "d6", name: "Paschim Vihar West", zone: "West" },
  { id: "d7", name: "Rani Bagh", zone: "North" },
  { id: "d8", name: "Mangolpuri", zone: "North" },
  { id: "d9", name: "Ranhola", zone: "West" },
  { id: "d10", name: "Mundka", zone: "West" },
  { id: "d11", name: "Raj Park", zone: "Central" },
];

// District boundary polygons (approximate GeoJSON-style coordinates for map overlays)
export const districtBoundaries = {
  "Muradka": [
    [77.13, 28.66], [77.17, 28.66], [77.17, 28.70], [77.13, 28.70], [77.13, 28.66],
  ],
  "Nangloi": [
    [77.03, 28.60], [77.07, 28.60], [77.07, 28.64], [77.03, 28.64], [77.03, 28.60],
  ],
  "Nihal Vihar": [
    [77.04, 28.61], [77.08, 28.61], [77.08, 28.65], [77.04, 28.65], [77.04, 28.61],
  ],
  "Sultan Puri": [
    [77.10, 28.65], [77.14, 28.65], [77.14, 28.69], [77.10, 28.69], [77.10, 28.65],
  ],
  "Paschim Vihar East": [
    [77.085, 28.635], [77.115, 28.635], [77.115, 28.665], [77.085, 28.665], [77.085, 28.635],
  ],
  "Paschim Vihar West": [
    [77.075, 28.635], [77.105, 28.635], [77.105, 28.665], [77.075, 28.665], [77.075, 28.635],
  ],
  "Rani Bagh": [
    [77.115, 28.665], [77.145, 28.665], [77.145, 28.695], [77.115, 28.695], [77.115, 28.665],
  ],
  "Mangolpuri": [
    [77.095, 28.675], [77.125, 28.675], [77.125, 28.705], [77.095, 28.705], [77.095, 28.675],
  ],
  "Ranhola": [
    [77.065, 28.625], [77.095, 28.625], [77.095, 28.655], [77.065, 28.655], [77.065, 28.625],
  ],
  "Mundka": [
    [77.055, 28.665], [77.085, 28.665], [77.085, 28.695], [77.055, 28.695], [77.055, 28.665],
  ],
  "Raj Park": [
    [77.125, 28.625], [77.155, 28.625], [77.155, 28.655], [77.125, 28.655], [77.125, 28.625],
  ],
};

// All Cameras with synchronized data
export const cameras = [
  // Muradka - 28 cameras (22 online, 6 offline)
  { id: "CAM-001", name: "Main Gate Camera", ip: "192.168.1.101", type: "Dome", status: "Online", district: "Muradka", location: "Main Entrance" },
  { id: "CAM-002", name: "Parking Lot A", ip: "192.168.1.102", type: "Bullet", status: "Online", district: "Muradka", location: "Parking Zone A" },
  { id: "CAM-003", name: "Lobby Camera", ip: "192.168.1.103", type: "PTZ", status: "Online", district: "Muradka", location: "Building Lobby" },
  { id: "CAM-004", name: "Reception Desk", ip: "192.168.1.104", type: "Dome", status: "Online", district: "Muradka", location: "Front Desk" },
  { id: "CAM-005", name: "Corridor East", ip: "192.168.1.105", type: "Dome", status: "Online", district: "Muradka", location: "East Wing" },
  { id: "CAM-006", name: "Server Room", ip: "192.168.1.106", type: "Bullet", status: "Online", district: "Muradka", location: "IT Room" },
  { id: "CAM-007", name: "Rooftop View", ip: "192.168.1.107", type: "PTZ", status: "Online", district: "Muradka", location: "Rooftop" },
  { id: "CAM-008", name: "Back Gate", ip: "192.168.1.108", type: "Bullet", status: "Online", district: "Muradka", location: "Rear Exit" },
  { id: "CAM-009", name: "Cafeteria", ip: "192.168.1.109", type: "Dome", status: "Online", district: "Muradka", location: "Canteen Area" },
  { id: "CAM-010", name: "Stairwell North", ip: "192.168.1.110", type: "NVR", status: "Online", district: "Muradka", location: "North Stairs" },
  { id: "CAM-011", name: "Office Area 1", ip: "192.168.1.111", type: "Dome", status: "Online", district: "Muradka", location: "Floor 1" },
  { id: "CAM-012", name: "Office Area 2", ip: "192.168.1.112", type: "Dome", status: "Online", district: "Muradka", location: "Floor 2" },
  { id: "CAM-013", name: "Conference Room", ip: "192.168.1.113", type: "Dome", status: "Online", district: "Muradka", location: "Meeting Room" },
  { id: "CAM-014", name: "Warehouse Entry", ip: "192.168.1.114", type: "Bullet", status: "Online", district: "Muradka", location: "Storage Wing" },
  { id: "CAM-015", name: "Vehicle Bay", ip: "192.168.1.115", type: "Bullet", status: "Online", district: "Muradka", location: "Garage" },
  { id: "CAM-016", name: "Perimeter East", ip: "192.168.1.116", type: "Bullet", status: "Online", district: "Muradka", location: "East Boundary" },
  { id: "CAM-017", name: "Perimeter West", ip: "192.168.1.117", type: "Bullet", status: "Online", district: "Muradka", location: "West Boundary" },
  { id: "CAM-018", name: "Cell Block A", ip: "192.168.1.118", type: "PTZ", status: "Online", district: "Muradka", location: "Detention A" },
  { id: "CAM-019", name: "Interrogation Room", ip: "192.168.1.119", type: "Dome", status: "Online", district: "Muradka", location: "Interview Room" },
  { id: "CAM-020", name: "Evidence Room", ip: "192.168.1.120", type: "NVR", status: "Online", district: "Muradka", location: "Evidence Storage" },
  { id: "CAM-021", name: "Command Center", ip: "192.168.1.121", type: "PTZ", status: "Online", district: "Muradka", location: "Control Room" },
  { id: "CAM-022", name: "Dispatch Office", ip: "192.168.1.122", type: "Dome", status: "Online", district: "Muradka", location: "Dispatch" },
  { id: "CAM-023", name: "Guard Post 1", ip: "192.168.1.123", type: "Bullet", status: "Offline", district: "Muradka", location: "Entry Post" },
  { id: "CAM-024", name: "Guard Post 2", ip: "192.168.1.124", type: "Bullet", status: "Offline", district: "Muradka", location: "Exit Post" },
  { id: "CAM-025", name: "Old Wing Camera", ip: "192.168.1.125", type: "Dome", status: "Offline", district: "Muradka", location: "Legacy Wing" },
  { id: "CAM-026", name: "Basement Entry", ip: "192.168.1.126", type: "NVR", status: "Offline", district: "Muradka", location: "Basement" },
  { id: "CAM-027", name: "Backup Camera 1", ip: "192.168.1.127", type: "Dome", status: "Offline", district: "Muradka", location: "Spare" },
  { id: "CAM-028", name: "Backup Camera 2", ip: "192.168.1.128", type: "Bullet", status: "Offline", district: "Muradka", location: "Spare" },

  // Nangloi - 8 cameras (5 online, 3 offline)
  { id: "CAM-029", name: "Station Main", ip: "192.168.2.101", type: "Dome", status: "Online", district: "Nangloi", location: "Entrance" },
  { id: "CAM-030", name: "Parking Area", ip: "192.168.2.102", type: "Bullet", status: "Online", district: "Nangloi", location: "Parking" },
  { id: "CAM-031", name: "Hallway Camera", ip: "192.168.2.103", type: "Dome", status: "Online", district: "Nangloi", location: "Corridor" },
  { id: "CAM-032", name: "Back Entrance", ip: "192.168.2.104", type: "Bullet", status: "Online", district: "Nangloi", location: "Rear Door" },
  { id: "CAM-033", name: "Office Monitor", ip: "192.168.2.105", type: "Dome", status: "Online", district: "Nangloi", location: "SHO Office" },
  { id: "CAM-034", name: "Old Camera 1", ip: "192.168.2.106", type: "NVR", status: "Offline", district: "Nangloi", location: "Legacy" },
  { id: "CAM-035", name: "Old Camera 2", ip: "192.168.2.107", type: "NVR", status: "Offline", district: "Nangloi", location: "Legacy" },
  { id: "CAM-036", name: "Damaged Unit", ip: "192.168.2.108", type: "Dome", status: "Offline", district: "Nangloi", location: "Storage" },

  // Nihal Vihar - 11 cameras (7 online, 4 offline)
  { id: "CAM-037", name: "Front Gate", ip: "192.168.3.101", type: "Bullet", status: "Online", district: "Nihal Vihar", location: "Main Gate" },
  { id: "CAM-038", name: "Reception", ip: "192.168.3.102", type: "Dome", status: "Online", district: "Nihal Vihar", location: "Lobby" },
  { id: "CAM-039", name: "Station Yard", ip: "192.168.3.103", type: "PTZ", status: "Online", district: "Nihal Vihar", location: "Courtyard" },
  { id: "CAM-040", name: "Side Passage", ip: "192.168.3.104", type: "Bullet", status: "Online", district: "Nihal Vihar", location: "Side Alley" },
  { id: "CAM-041", name: "Armory Camera", ip: "192.168.3.105", type: "NVR", status: "Online", district: "Nihal Vihar", location: "Arms Room" },
  { id: "CAM-042", name: "Lockup View", ip: "192.168.3.106", type: "PTZ", status: "Online", district: "Nihal Vihar", location: "Holding Cell" },
  { id: "CAM-043", name: "Parking Corner", ip: "192.168.3.107", type: "Bullet", status: "Online", district: "Nihal Vihar", location: "Vehicle Park" },
  { id: "CAM-044", name: "Broken Unit 1", ip: "192.168.3.108", type: "Dome", status: "Offline", district: "Nihal Vihar", location: "Storage" },
  { id: "CAM-045", name: "Broken Unit 2", ip: "192.168.3.109", type: "NVR", status: "Offline", district: "Nihal Vihar", location: "Storage" },
  { id: "CAM-046", name: "Offline Dome", ip: "192.168.3.110", type: "Dome", status: "Offline", district: "Nihal Vihar", location: "Basement" },
  { id: "CAM-047", name: "Retired Camera", ip: "192.168.3.111", type: "Bullet", status: "Offline", district: "Nihal Vihar", location: "Archive" },

  // Sultan Puri - 12 cameras (4 online, 8 offline)
  { id: "CAM-048", name: "Entry Point", ip: "192.168.4.101", type: "Bullet", status: "Online", district: "Sultan Puri", location: "Gate" },
  { id: "CAM-049", name: "Main Hall", ip: "192.168.4.102", type: "Dome", status: "Online", district: "Sultan Puri", location: "Hall" },
  { id: "CAM-050", name: "Duty Room", ip: "192.168.4.103", type: "Dome", status: "Online", district: "Sultan Puri", location: "Duty Desk" },
  { id: "CAM-051", name: "Exit Gate", ip: "192.168.4.104", type: "Bullet", status: "Online", district: "Sultan Puri", location: "Exit" },
  { id: "CAM-052", name: "Offline Unit 1", ip: "192.168.4.105", type: "PTZ", status: "Offline", district: "Sultan Puri", location: "Roof" },
  { id: "CAM-053", name: "Offline Unit 2", ip: "192.168.4.106", type: "Dome", status: "Offline", district: "Sultan Puri", location: "Corridor" },
  { id: "CAM-054", name: "Offline Unit 3", ip: "192.168.4.107", type: "NVR", status: "Offline", district: "Sultan Puri", location: "Storage" },
  { id: "CAM-055", name: "Offline Unit 4", ip: "192.168.4.108", type: "Bullet", status: "Offline", district: "Sultan Puri", location: "Perimeter" },
  { id: "CAM-056", name: "Offline Unit 5", ip: "192.168.4.109", type: "Dome", status: "Offline", district: "Sultan Puri", location: "Office" },
  { id: "CAM-057", name: "Offline Unit 6", ip: "192.168.4.110", type: "PTZ", status: "Offline", district: "Sultan Puri", location: "Yard" },
  { id: "CAM-058", name: "Offline Unit 7", ip: "192.168.4.111", type: "Bullet", status: "Offline", district: "Sultan Puri", location: "Gate 2" },
  { id: "CAM-059", name: "Offline Unit 8", ip: "192.168.4.112", type: "NVR", status: "Offline", district: "Sultan Puri", location: "Archive" },

  // Paschim Vihar East - 13 cameras (9 online, 4 offline)
  { id: "CAM-060", name: "East Gate", ip: "192.168.5.101", type: "Bullet", status: "Online", district: "Paschim Vihar East", location: "Main Entry" },
  { id: "CAM-061", name: "Reception Area", ip: "192.168.5.102", type: "Dome", status: "Online", district: "Paschim Vihar East", location: "Front Desk" },
  { id: "CAM-062", name: "Patrol Room", ip: "192.168.5.103", type: "Dome", status: "Online", district: "Paschim Vihar East", location: "Operations" },
  { id: "CAM-063", name: "Parking Entrance", ip: "192.168.5.104", type: "Bullet", status: "Online", district: "Paschim Vihar East", location: "Vehicle Entry" },
  { id: "CAM-064", name: "Covered Parking", ip: "192.168.5.105", type: "Dome", status: "Online", district: "Paschim Vihar East", location: "Indoor Parking" },
  { id: "CAM-065", name: "North Corridor", ip: "192.168.5.106", type: "Dome", status: "Online", district: "Paschim Vihar East", location: "North Wing" },
  { id: "CAM-066", name: "South Corridor", ip: "192.168.5.107", type: "Dome", status: "Online", district: "Paschim Vihar East", location: "South Wing" },
  { id: "CAM-067", name: "ROFT Camera", ip: "192.168.5.108", type: "PTZ", status: "Online", district: "Paschim Vihar East", location: "Rooftop" },
  { id: "CAM-068", name: "Back Area", ip: "192.168.5.109", type: "Bullet", status: "Online", district: "Paschim Vihar East", location: "Rear Zone" },
  { id: "CAM-069", name: "Old Unit 1", ip: "192.168.5.110", type: "NVR", status: "Offline", district: "Paschim Vihar East", location: "Archive" },
  { id: "CAM-070", name: "Old Unit 2", ip: "192.168.5.111", type: "Dome", status: "Offline", district: "Paschim Vihar East", location: "Archive" },
  { id: "CAM-071", name: "Damaged Unit", ip: "192.168.5.112", type: "Bullet", status: "Offline", district: "Paschim Vihar East", location: "Repair" },
  { id: "CAM-072", name: "Spare Camera", ip: "192.168.5.113", type: "Dome", status: "Offline", district: "Paschim Vihar East", location: "Storage" },

  // Paschim Vihar West - 17 cameras (10 online, 7 offline)
  { id: "CAM-073", name: "West Gate Main", ip: "192.168.6.101", type: "Bullet", status: "Online", district: "Paschim Vihar West", location: "Main Gate" },
  { id: "CAM-074", name: "Control Room", ip: "192.168.6.102", type: "PTZ", status: "Online", district: "Paschim Vihar West", location: "Command" },
  { id: "CAM-075", name: "Front Desk", ip: "192.168.6.103", type: "Dome", status: "Online", district: "Paschim Vihar West", location: "Reception" },
  { id: "CAM-076", name: "Parking Level 1", ip: "192.168.6.104", type: "Bullet", status: "Online", district: "Paschim Vihar West", location: "Parking L1" },
  { id: "CAM-077", name: "Parking Level 2", ip: "192.168.6.105", type: "Bullet", status: "Online", district: "Paschim Vihar West", location: "Parking L2" },
  { id: "CAM-078", name: "Corridor A", ip: "192.168.6.106", type: "Dome", status: "Online", district: "Paschim Vihar West", location: "Wing A" },
  { id: "CAM-079", name: "Corridor B", ip: "192.168.6.107", type: "Dome", status: "Online", district: "Paschim Vihar West", location: "Wing B" },
  { id: "CAM-080", name: "Evidence Vault", ip: "192.168.6.108", type: "NVR", status: "Online", district: "Paschim Vihar West", location: "Vault" },
  { id: "CAM-081", name: "Briefing Room", ip: "192.168.6.109", type: "Dome", status: "Online", district: "Paschim Vihar West", location: "Meeting Hall" },
  { id: "CAM-082", name: "Backyard View", ip: "192.168.6.110", type: "Bullet", status: "Online", district: "Paschim Vihar West", location: "Back Area" },
  { id: "CAM-083", name: "Defunct Camera 1", ip: "192.168.6.111", type: "Dome", status: "Offline", district: "Paschim Vihar West", location: "Archive" },
  { id: "CAM-084", name: "Defunct Camera 2", ip: "192.168.6.112", type: "NVR", status: "Offline", district: "Paschim Vihar West", location: "Archive" },
  { id: "CAM-085", name: "Broken Dome", ip: "192.168.6.113", type: "Dome", status: "Offline", district: "Paschim Vihar West", location: "Repair" },
  { id: "CAM-086", name: "Broken Bullet", ip: "192.168.6.114", type: "Bullet", status: "Offline", district: "Paschim Vihar West", location: "Repair" },
  { id: "CAM-087", name: "Retired PTZ", ip: "192.168.6.115", type: "PTZ", status: "Offline", district: "Paschim Vihar West", location: "Storage" },
  { id: "CAM-088", name: "Spare Unit 1", ip: "192.168.6.116", type: "Dome", status: "Offline", district: "Paschim Vihar West", location: "Storage" },
  { id: "CAM-089", name: "Spare Unit 2", ip: "192.168.6.117", type: "Bullet", status: "Offline", district: "Paschim Vihar West", location: "Storage" },

  // Rani Bagh - 1 camera (1 online, 0 offline)
  { id: "CAM-090", name: "Single Unit", ip: "192.168.7.101", type: "Dome", status: "Online", district: "Rani Bagh", location: "Main" },

  // Mangolpuri - 1 camera (1 online, 0 offline)
  { id: "CAM-091", name: "Single Unit", ip: "192.168.8.101", type: "Bullet", status: "Online", district: "Mangolpuri", location: "Main" },

  // Ranhola - 1 camera (1 online, 0 offline)
  { id: "CAM-092", name: "Single Unit", ip: "192.168.9.101", type: "Dome", status: "Online", district: "Ranhola", location: "Main" },

  // Mundka - 28 cameras (11 online, 17 offline)
  { id: "CAM-093", name: "Main Complex", ip: "192.168.10.101", type: "PTZ", status: "Online", district: "Mundka", location: "HQ" },
  { id: "CAM-094", name: "Entry Road", ip: "192.168.10.102", type: "Bullet", status: "Online", district: "Mundka", location: "Approach" },
  { id: "CAM-095", name: "Parking Zone", ip: "192.168.10.103", type: "Dome", status: "Online", district: "Mundka", location: "Vehicle Area" },
  { id: "CAM-096", name: "Admin Block", ip: "192.168.10.104", type: "Dome", status: "Online", district: "Mundka", location: "Office" },
  { id: "CAM-097", name: "Barracks View", ip: "192.168.10.105", type: "Bullet", status: "Online", district: "Mundka", location: "Living Quarters" },
  { id: "CAM-098", name: "Mess Hall", ip: "192.168.10.106", type: "Dome", status: "Online", district: "Mundka", location: "Dining" },
  { id: "CAM-099", name: "Training Ground", ip: "192.168.10.107", type: "PTZ", status: "Online", district: "Mundka", location: "Outdoor" },
  { id: "CAM-100", name: "Armory Gate", ip: "192.168.10.108", type: "NVR", status: "Online", district: "Mundka", location: "Arms Storage" },
  { id: "CAM-101", name: "North Perimeter", ip: "192.168.10.109", type: "Bullet", status: "Online", district: "Mundka", location: "North Wall" },
  { id: "CAM-102", name: "South Perimeter", ip: "192.168.10.110", type: "Bullet", status: "Online", district: "Mundka", location: "South Wall" },
  { id: "CAM-103", name: "Watch Tower", ip: "192.168.10.111", type: "PTZ", status: "Online", district: "Mundka", location: "Tower" },
  { id: "CAM-104", name: "Broken Unit 1", ip: "192.168.10.112", type: "Dome", status: "Offline", district: "Mundka", location: "Storage" },
  { id: "CAM-105", name: "Broken Unit 2", ip: "192.168.10.113", type: "NVR", status: "Offline", district: "Mundka", location: "Storage" },
  { id: "CAM-106", name: "Broken Unit 3", ip: "192.168.10.114", type: "Bullet", status: "Offline", district: "Mundka", location: "Storage" },
  { id: "CAM-107", name: "Broken Unit 4", ip: "192.168.10.115", type: "Dome", status: "Offline", district: "Mundka", location: "Repair" },
  { id: "CAM-108", name: "Broken Unit 5", ip: "192.168.10.116", type: "PTZ", status: "Offline", district: "Mundka", location: "Repair" },
  { id: "CAM-109", name: "Broken Unit 6", ip: "192.168.10.117", type: "NVR", status: "Offline", district: "Mundka", location: "Repair" },
  { id: "CAM-110", name: "Broken Unit 7", ip: "192.168.10.118", type: "Bullet", status: "Offline", district: "Mundka", location: "Archive" },
  { id: "CAM-111", name: "Broken Unit 8", ip: "192.168.10.119", type: "Dome", status: "Offline", district: "Mundka", location: "Archive" },
  { id: "CAM-112", name: "Broken Unit 9", ip: "192.168.10.120", type: "NVR", status: "Offline", district: "Mundka", location: "Archive" },
  { id: "CAM-113", name: "Broken Unit 10", ip: "192.168.10.121", type: "Bullet", status: "Offline", district: "Mundka", location: "Archive" },
  { id: "CAM-114", name: "Broken Unit 11", ip: "192.168.10.122", type: "Dome", status: "Offline", district: "Mundka", location: "Archive" },
  { id: "CAM-115", name: "Broken Unit 12", ip: "192.168.10.123", type: "PTZ", status: "Offline", district: "Mundka", location: "Archive" },
  { id: "CAM-116", name: "Broken Unit 13", ip: "192.168.10.124", type: "NVR", status: "Offline", district: "Mundka", location: "Archive" },
  { id: "CAM-117", name: "Broken Unit 14", ip: "192.168.10.125", type: "Bullet", status: "Offline", district: "Mundka", location: "Archive" },
  { id: "CAM-118", name: "Broken Unit 15", ip: "192.168.10.126", type: "Dome", status: "Offline", district: "Mundka", location: "Archive" },
  { id: "CAM-119", name: "Broken Unit 16", ip: "192.168.10.127", type: "NVR", status: "Offline", district: "Mundka", location: "Archive" },
  { id: "CAM-120", name: "Broken Unit 17", ip: "192.168.10.128", type: "Bullet", status: "Offline", district: "Mundka", location: "Archive" },

  // Raj Park - 1 camera (1 online, 0 offline)
  { id: "CAM-121", name: "Main Camera", ip: "192.168.11.101", type: "Dome", status: "Online", district: "Raj Park", location: "Main" },
];

// Users
export const users = [
  { id: 1, name: "Rajesh Kumar", role: "Admin", status: "Active", station: "CP Delhi", lastLogin: "2 min ago", email: "rajesh@delhipolice.gov.in" },
  { id: 2, name: "Amit Singh", role: "Operator", status: "Active", station: "Sector 29", lastLogin: "15 min ago", email: "amit@delhipolice.gov.in" },
  { id: 3, name: "Priya Sharma", role: "Operator", status: "Active", station: "Cyber Hub", lastLogin: "1 hr ago", email: "priya@delhipolice.gov.in" },
  { id: 4, name: "Mohit Verma", role: "Viewer", status: "Active", station: "NH48 Toll", lastLogin: "3 hrs ago", email: "mohit@delhipolice.gov.in" },
  { id: 5, name: "Sneha Gupta", role: "Admin", status: "Inactive", station: "CP Delhi", lastLogin: "2 days ago", email: "sneha@delhipolice.gov.in" },
  { id: 6, name: "Vikram Joshi", role: "Operator", status: "Active", station: "Dwarka", lastLogin: "30 min ago", email: "vikram@delhipolice.gov.in" },
  { id: 7, name: "Neha Agarwal", role: "Viewer", status: "Active", station: "Saket", lastLogin: "45 min ago", email: "neha@delhipolice.gov.in" },
];

// Alerts
export const alerts = [
  { id: 1, title: "Unauthorized Access Attempt", location: "Muradka", time: "2 min ago", severity: "Critical", description: "Multiple failed login attempts detected at main gate" },
  { id: 2, title: "Camera Offline Alert", location: "Sultan Puri", time: "15 min ago", severity: "Warning", description: "3 cameras lost connection simultaneously" },
  { id: 3, title: "Motion Detected", location: "Paschim Vihar West", time: "30 min ago", severity: "Information", description: "Movement detected in restricted zone after hours" },
  { id: 4, title: "Bandwidth Spike", location: "Nihal Vihar", time: "1 hr ago", severity: "Warning", description: "Network usage exceeded threshold - 85% utilization" },
  { id: 5, title: "Storage Critical", location: "Mundka", time: "2 hrs ago", severity: "Critical", description: "Storage capacity below 10% - immediate action required" },
  { id: 6, title: "Face Match Found", location: "Nangloi", time: "3 hrs ago", severity: "Information", description: "Blacklist database match detected at entry point" },
  { id: 7, title: "PTZ Malfunction", location: "Paschim Vihar East", time: "4 hrs ago", severity: "Warning", description: "Pan-tilt-zoom mechanism unresponsive on CAM-067" },
  { id: 8, title: "Power Failure", location: "Rani Bagh", time: "5 hrs ago", severity: "Critical", description: "UPS backup activated - mains power lost" },
  { id: 9, title: "Recording Gap", location: "Raj Park", time: "6 hrs ago", severity: "Warning", description: "15-minute recording gap detected" },
  { id: 10, title: "System Update Complete", location: "All Stations", time: "8 hrs ago", severity: "Information", description: "Firmware update v2.4.1 deployed successfully" },
];

// Helper functions for synchronized data
export const getTotalCameras = () => cameras.length;

export const getOnlineCameras = () => cameras.filter(c => c.status === "Online").length;

export const getOfflineCameras = () => cameras.filter(c => c.status === "Offline").length;

export const getCamerasByDistrict = (districtName) => cameras.filter(c => c.district === districtName);

export const getDistrictStats = () => districts.map(d => {
  const districtCameras = getCamerasByDistrict(d.name);
  const online = districtCameras.filter(c => c.status === "Online").length;
  const offline = districtCameras.filter(c => c.status === "Offline").length;
  return {
    ...d,
    total: districtCameras.length,
    online,
    offline,
  };
}).filter(d => d.total > 0);

export const getChartData = () => getDistrictStats().map(d => ({
  district: d.name,
  alerts: d.total,
}));

export const getWorkingStatusData = () => getDistrictStats().map(d => ({
  district: d.name,
  working: d.online,
  nonWorking: d.offline,
}));

export const getActiveAlerts = () => alerts.filter(a => a.severity === "Critical" || a.severity === "Warning").length;

// ANPR Camera data
export const anprCameras = [
  { id: "ANPR-001", name: "ANPR Cam - Main Gate", group: "Muradka", type: "ANPR", status: "Online" },
  { id: "ANPR-002", name: "ANPR Cam - Parking Entry", group: "Muradka", type: "ANPR", status: "Online" },
  { id: "ANPR-003", name: "ANPR Cam - Highway Toll", group: "Nangloi", type: "ANPR", status: "Online" },
  { id: "ANPR-004", name: "ANPR Cam - Sector 5 Road", group: "Nangloi", type: "ANPR", status: "Offline" },
  { id: "ANPR-005", name: "ANPR Cam - Nihal Vihar Chowk", group: "Nihal Vihar", type: "ANPR", status: "Online" },
  { id: "ANPR-006", name: "ANPR Cam - Sultan Puri Gate", group: "Sultan Puri", type: "ANPR", status: "Online" },
  { id: "ANPR-007", name: "ANPR Cam - East Flyover", group: "Paschim Vihar East", type: "ANPR", status: "Online" },
  { id: "ANPR-008", name: "ANPR Cam - West Junction", group: "Paschim Vihar West", type: "ANPR", status: "Offline" },
  { id: "ANPR-009", name: "ANPR Cam - Rani Bagh Entry", group: "Rani Bagh", type: "ANPR", status: "Online" },
  { id: "ANPR-010", name: "ANPR Cam - Mangolpuri Road", group: "Mangolpuri", type: "ANPR", status: "Online" },
  { id: "ANPR-011", name: "ANPR Cam - Ranhola Crossing", group: "Ranhola", type: "ANPR", status: "Online" },
  { id: "ANPR-012", name: "ANPR Cam - Mundka Highway", group: "Mundka", type: "ANPR", status: "Online" },
  { id: "ANPR-013", name: "ANPR Cam - Raj Park Gate", group: "Raj Park", type: "ANPR", status: "Online" },
  { id: "ANPR-014", name: "ANPR Cam - North Boundary", group: "Muradka", type: "ANPR", status: "Online" },
  { id: "ANPR-015", name: "ANPR Cam - South Checkpost", group: "Nihal Vihar", type: "ANPR", status: "Online" },
  { id: "ANPR-016", name: "ANPR Cam - West Entry Point", group: "Nangloi", type: "ANPR", status: "Online" },
  { id: "ANPR-017", name: "ANPR Cam - Central Hub", group: "Sultan Puri", type: "ANPR", status: "Online" },
  { id: "ANPR-018", name: "ANPR Cam - Ring Road North", group: "Rani Bagh", type: "ANPR", status: "Online" },
  { id: "ANPR-019", name: "ANPR Cam - Ring Road South", group: "Mangolpuri", type: "ANPR", status: "Offline" },
  { id: "ANPR-020", name: "ANPR Cam - Expressway Entry", group: "Mundka", type: "ANPR", status: "Online" },
];

export const getAnprCameras = () => anprCameras;
export const getTotalAnprCameras = () => anprCameras.length;
export const getOnlineAnprCameras = () => anprCameras.filter(c => c.status === "Online").length;
export const getOfflineAnprCameras = () => anprCameras.filter(c => c.status === "Offline").length;

export const getDashboardStats = () => [
  {
    title: "Total Users",
    value: users.length,
    color: "#8b5cf6",
    icon: Users,
    change: `${users.filter(u => u.status === "Active").length} active`,
    showProgress: false,
    showDot: false,
    cardType: "Total Users",
  },
  {
    title: "Total Cameras",
    value: getTotalCameras(),
    color: "#3b82f6",
    icon: Camera,
    change: `Across ${districts.length} stations`,
    showProgress: false,
    showDot: false,
    cardType: "Total Cameras",
  },
  {
    title: "Online Cameras",
    value: getOnlineCameras(),
    color: "#10b981",
    icon: Wifi,
    change: `${Math.round((getOnlineCameras() / getTotalCameras()) * 100)}% uptime`,
    showProgress: false,
    progressPercent: Math.round((getOnlineCameras() / getTotalCameras()) * 100),
    showDot: false,
    cardType: "Online Cameras",
  },
  {
    title: "Offline Cameras",
    value: getOfflineCameras(),
    color: "#ef4444",
    icon: WifiOff,
    change: `Needs attention`,
    showProgress: false,
    showDot: true,
    cardType: "Offline Cameras",
  },
  {
    title: "Alerts",
    value: getActiveAlerts(),
    color: "#f59e0b",
    icon: Bell,
    change: `${alerts.filter(a => a.severity === "Critical").length} critical`,
    showProgress: false,
    showDot: true,
    cardType: "Alerts",
  },
];