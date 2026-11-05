# AssetTrack — Structured Hardware Specifications Guide

AssetTrack maintains deep, category-specific hardware specifications rather than untyped JSON blobs or flat text fields (DEC-002).

---

## 1. Core Hardware Sub-Schemas

### 1.1 Central Processing Unit (CPU)
Tracks architecture, multi-threading, and frequency profiles.
```json
{
  "manufacturer": "Intel | AMD | Apple | Qualcomm",
  "model": "Core i7-13700K | Ryzen 9 7900X | M3 Max",
  "generation": "13th Gen | Zen 4",
  "cores": 16,
  "threads": 24,
  "baseClockGhz": 3.4,
  "boostClockGhz": 5.4
}
```

### 1.2 Random Access Memory (RAM)
Supports multi-slot modular array configurations to accommodate heterogeneous memory sticks and dual-channel setups.
```json
{
  "totalCapacityGb": 32,
  "ddrGeneration": "DDR5 | DDR4 | LPDDR5",
  "moduleType": "DIMM | SODIMM",
  "slotCount": 4,
  "modules": [
    {
      "slot": 1,
      "capacityGb": 16,
      "speedMts": 5600,
      "make": "Crucial",
      "serialNumber": "CT16G56C46S5"
    },
    {
      "slot": 2,
      "capacityGb": 16,
      "speedMts": 5600,
      "make": "Crucial",
      "serialNumber": "CT16G56C46S6"
    }
  ]
}
```

### 1.3 Storage Devices
Tracks multiple internal drives (OS root vs high-capacity storage pools).
```json
[
  {
    "driveNumber": 1,
    "driveType": "NVMe SSD",
    "busInterface": "PCIe 4.0 x4",
    "capacityGb": 1000,
    "manufacturer": "Samsung",
    "model": "990 PRO",
    "serialNumber": "S677NF0W123456"
  },
  {
    "driveNumber": 2,
    "driveType": "SATA HDD",
    "busInterface": "SATA III 6Gb/s",
    "capacityGb": 4000,
    "manufacturer": "Seagate",
    "model": "Barracuda 5400",
    "serialNumber": "W4K0ABCD"
  }
]
```

### 1.4 Motherboard & Mainboard
```json
{
  "manufacturer": "ASUS | Dell | Lenovo | MSI",
  "model": "ROG STRIX B760-I",
  "chipset": "Intel B760",
  "socket": "LGA1700",
  "expansionSlots": "1x PCIe 5.0 x16, 2x M.2 2280"
}
```

### 1.5 Graphics Processing Unit (GPU)
```json
{
  "isDedicated": true,
  "manufacturer": "NVIDIA",
  "model": "GeForce RTX 4080",
  "vramGb": 16
}
```

### 1.6 Network Interfaces
```json
{
  "ethernetMac": "00:1A:2B:3C:4D:5E",
  "wifiMac": "00:1A:2B:3C:4D:5F",
  "ipAddress": "192.168.1.105",
  "connectionType": "Ethernet Gigabit"
}
```

### 1.7 Operating System
```json
{
  "name": "Ubuntu Linux | Windows 11 | macOS",
  "edition": "Enterprise | Pro | Sonoma",
  "version": "24.04 LTS",
  "architecture": "x86_64 | ARM64",
  "buildNumber": "26100.1742",
  "installationDate": "2026-01-15T09:30:00.000Z"
}
```

---

## 2. Category-Specific Hardware Rules

1. **Laptops & Desktops:** Require CPU, RAM (with at least 1 module), Storage (with at least 1 drive), and OS.
2. **Network Switches & Routers:** Require Ports count, Management IP, MAC Address, Firmware Version.
3. **Monitors & Peripherals:** Require Display Resolution, Screen Size (inches), Refresh Rate, Refresh Ports (HDMI, DisplayPort, USB-C).
4. **RAM & Storage Modules (Loose Consumables):** Tracked in the Spare Parts Ledger (`stock_items`) until installed into an asset via maintenance.
