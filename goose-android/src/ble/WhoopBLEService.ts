import type { GooseMessage } from "../types";

export const WHOOP_UUIDS = {
  V5_SERVICE: "fd4b0001-cce1-4033-93ce-002d5875f58a",
  V5_COMMAND: "fd4b0002-cce1-4033-93ce-002d5875f58a",
  V5_NOTIFY_3: "fd4b0003-cce1-4033-93ce-002d5875f58a",
  V5_NOTIFY_4: "fd4b0004-cce1-4033-93ce-002d5875f58a",
  V5_NOTIFY_5: "fd4b0005-cce1-4033-93ce-002d5875f58a",
  V5_NOTIFY_7: "fd4b0007-cce1-4033-93ce-002d5875f58a",

  GEN4_SERVICE: "61080001-8d6d-82b8-614a-1c8cb0f8dcc6",
  GEN4_COMMAND: "61080002-8d6d-82b8-614a-1c8cb0f8dcc6",
  GEN4_NOTIFY_3: "61080003-8d6d-82b8-614a-1c8cb0f8dcc6",
  GEN4_NOTIFY_4: "61080004-8d6d-82b8-614a-1c8cb0f8dcc6",
  GEN4_NOTIFY_5: "61080005-8d6d-82b8-614a-1c8cb0f8dcc6",
  GEN4_NOTIFY_7: "61080007-8d6d-82b8-614a-1c8cb0f8dcc6",

  HR_SERVICE: "0000180d-0000-1000-8000-00805f9b34fb",
  HR_MEASUREMENT: "00002a37-0000-1000-8000-00805f9b34fb",

  BATTERY_SERVICE: "0000180f-0000-1000-8000-00805f9b34fb",
  BATTERY_LEVEL: "00002a19-0000-1000-8000-00805f9b34fb",
  BATTERY_STATUS: "00002bed-0000-1000-8000-00805f9b34fb",

  DEVICE_INFO_SERVICE: "0000180a-0000-1000-8000-00805f9b34fb",
  MODEL_NUMBER: "00002a24-0000-1000-8000-00805f9b34fb",
  FIRMWARE_REVISION: "00002a26-0000-1000-8000-00805f9b34fb",
  HARDWARE_REVISION: "00002a27-0000-1000-8000-00805f9b34fb",
  SOFTWARE_REVISION: "00002a28-0000-1000-8000-00805f9b34fb",
  MANUFACTURER_NAME: "00002a29-0000-1000-8000-00805f9b34fb",
};

export interface BLEHeartRateMeasurement {
  bpm: number;
  rrIntervalsMS: number[];
  contactDetected: boolean;
}

export function parseHeartRateMeasurement(data: DataView): BLEHeartRateMeasurement | null {
  try {
    const flags = data.getUint8(0);
    const is16bit = (flags & 0x01) !== 0;
    const hasRR = (flags & 0x10) !== 0;
    const contactDetected = (flags & 0x06) === 0x06;

    let offset = 1;
    const bpm = is16bit ? data.getUint16(offset, true) : data.getUint8(offset);
    offset += is16bit ? 2 : 1;

    if ((flags & 0x08) !== 0) offset += 2;

    const rrIntervalsMS: number[] = [];
    if (hasRR) {
      while (offset + 1 < data.byteLength) {
        const rrRaw = data.getUint16(offset, true);
        rrIntervalsMS.push(Math.round((rrRaw / 1024) * 1000));
        offset += 2;
      }
    }

    return { bpm, rrIntervalsMS, contactDetected };
  } catch {
    return null;
  }
}

export function parseWhoopPacket(data: Uint8Array): { commandNumber: number; payload: Uint8Array } | null {
  if (data.length < 2 || data[0] !== 0xaa) return null;
  try {
    const commandNumber = data[1];
    const payload = data.slice(2);
    return { commandNumber, payload };
  } catch {
    return null;
  }
}

export function buildV5CommandFrame(commandNumber: number, sequence: number, payload: Uint8Array = new Uint8Array()): Uint8Array {
  const frameLength = 5 + payload.length;
  const frame = new Uint8Array(frameLength);
  frame[0] = 0xaa;
  frame[1] = commandNumber;
  frame[2] = sequence & 0xff;
  frame[3] = payload.length & 0xff;
  frame.set(payload, 4);
  let checksum = 0;
  for (let i = 0; i < frameLength - 1; i++) checksum ^= frame[i];
  frame[frameLength - 1] = checksum;
  return frame;
}

type BLEEventMap = {
  heartRate: (bpm: number, rrIntervals: number[], source: string) => void;
  batteryLevel: (percent: number, charging: boolean | null) => void;
  deviceInfo: (key: string, value: string) => void;
  connectionState: (state: string) => void;
  message: (msg: GooseMessage) => void;
  rawPacket: (serviceUUID: string, charUUID: string, data: Uint8Array) => void;
  syncProgress: (status: string, detail: string, packetCount: number, isTerminal: boolean) => void;
};

export class WhoopBLEService {
  private device: BluetoothDevice | null = null;
  private server: BluetoothRemoteGATTServer | null = null;
  private connectionState = "disconnected";
  private listeners: Partial<{ [K in keyof BLEEventMap]: BLEEventMap[K][] }> = {};
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private commandSequence = 0;
  private commandChar: BluetoothRemoteGATTCharacteristic | null = null;
  private isReconnecting = false;

  static isSupported(): boolean {
    return "bluetooth" in navigator;
  }

  on<K extends keyof BLEEventMap>(event: K, listener: BLEEventMap[K]) {
    if (!this.listeners[event]) this.listeners[event] = [];
    (this.listeners[event] as BLEEventMap[K][]).push(listener);
  }

  off<K extends keyof BLEEventMap>(event: K, listener: BLEEventMap[K]) {
    if (!this.listeners[event]) return;
    this.listeners[event] = (this.listeners[event] as BLEEventMap[K][]).filter((l) => l !== listener) as typeof this.listeners[K];
  }

  private emit<K extends keyof BLEEventMap>(event: K, ...args: Parameters<BLEEventMap[K]>) {
    (this.listeners[event] as ((...a: Parameters<BLEEventMap[K]>) => void)[] | undefined)?.forEach((l) => l(...args));
  }

  private log(level: GooseMessage["level"], source: string, title: string, body = "") {
    this.emit("message", {
      id: `${Date.now()}-${Math.random()}`,
      timestamp: new Date(),
      level,
      source,
      title,
      body,
    });
  }

  private setConnectionState(state: string) {
    this.connectionState = state;
    this.emit("connectionState", state);
  }

  getConnectionState() {
    return this.connectionState;
  }

  async requestDevice(): Promise<boolean> {
    if (!WhoopBLEService.isSupported()) {
      this.setConnectionState("unsupported");
      return false;
    }
    try {
      this.setConnectionState("scanning");
      this.log("info", "ble", "scan.start");
      this.device = await navigator.bluetooth.requestDevice({
        filters: [
          { namePrefix: "WHOOP" },
          { services: [WHOOP_UUIDS.V5_SERVICE] },
          { services: [WHOOP_UUIDS.GEN4_SERVICE] },
        ],
        optionalServices: [
          WHOOP_UUIDS.V5_SERVICE,
          WHOOP_UUIDS.GEN4_SERVICE,
          WHOOP_UUIDS.HR_SERVICE,
          WHOOP_UUIDS.BATTERY_SERVICE,
          WHOOP_UUIDS.DEVICE_INFO_SERVICE,
        ],
      });

      this.log("info", "ble", "device.selected", this.device.name ?? "unnamed");
      this.device.addEventListener("gattserverdisconnected", this.onDisconnected.bind(this));
      return await this.connect();
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      this.log("warn", "ble", "scan.cancelled", msg);
      this.setConnectionState("disconnected");
      return false;
    }
  }

  async connect(): Promise<boolean> {
    if (!this.device?.gatt) {
      this.setConnectionState("error");
      return false;
    }
    try {
      this.setConnectionState("connecting");
      this.log("info", "ble", "connect.start", this.device.name ?? "");
      this.server = await this.device.gatt.connect();
      this.log("info", "ble", "connect.success");
      await this.discoverServices();
      this.setConnectionState("ready");
      return true;
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      this.log("error", "ble", "connect.failed", msg);
      this.setConnectionState("error");
      return false;
    }
  }

  private async discoverServices() {
    if (!this.server) return;
    const services = await this.server.getPrimaryServices().catch(() => []);
    this.log("info", "ble", "services.discovered", `${services.length} services`);

    for (const service of services) {
      try {
        await this.setupService(service);
      } catch (err) {
        this.log("warn", "ble", "service.setup_failed", `${service.uuid}: ${err}`);
      }
    }
  }

  private async setupService(service: BluetoothRemoteGATTService) {
    const uuid = service.uuid.toLowerCase();

    if (uuid === WHOOP_UUIDS.HR_SERVICE) {
      await this.setupHRService(service);
    } else if (uuid === WHOOP_UUIDS.BATTERY_SERVICE) {
      await this.setupBatteryService(service);
    } else if (uuid === WHOOP_UUIDS.DEVICE_INFO_SERVICE) {
      await this.readDeviceInfo(service);
    } else if (uuid.startsWith("fd4b") || uuid.startsWith("61080")) {
      await this.setupWhoopService(service);
    }
  }

  private async setupHRService(service: BluetoothRemoteGATTService) {
    try {
      const hrChar = await service.getCharacteristic(WHOOP_UUIDS.HR_MEASUREMENT);
      await hrChar.startNotifications();
      hrChar.addEventListener("characteristicvaluechanged", (event) => {
        const char = event.target as BluetoothRemoteGATTCharacteristic;
        if (!char.value) return;
        const parsed = parseHeartRateMeasurement(char.value);
        if (parsed) {
          this.emit("heartRate", parsed.bpm, parsed.rrIntervalsMS, "ble.hr.standard");
        }
      });
      this.log("info", "ble.hr", "hr_notifications.started");
    } catch (err) {
      this.log("warn", "ble.hr", "hr_setup.failed", String(err));
    }
  }

  private async setupBatteryService(service: BluetoothRemoteGATTService) {
    try {
      const battChar = await service.getCharacteristic(WHOOP_UUIDS.BATTERY_LEVEL);
      const value = await battChar.readValue();
      const percent = value.getUint8(0);
      this.emit("batteryLevel", percent, null);
      this.log("info", "ble.battery", "battery.read", `${percent}%`);

      await battChar.startNotifications().catch(() => null);
      battChar.addEventListener("characteristicvaluechanged", (event) => {
        const char = event.target as BluetoothRemoteGATTCharacteristic;
        if (!char.value) return;
        this.emit("batteryLevel", char.value.getUint8(0), null);
      });
    } catch (err) {
      this.log("warn", "ble.battery", "battery.failed", String(err));
    }
  }

  private async readDeviceInfo(service: BluetoothRemoteGATTService) {
    const readChar = async (uuid: string, key: string) => {
      try {
        const char = await service.getCharacteristic(uuid);
        const value = await char.readValue();
        const text = new TextDecoder().decode(value);
        this.emit("deviceInfo", key, text.trim());
      } catch {
        /* optional */
      }
    };

    await readChar(WHOOP_UUIDS.FIRMWARE_REVISION, "firmwareVersion");
    await readChar(WHOOP_UUIDS.MODEL_NUMBER, "modelNumber");
    await readChar(WHOOP_UUIDS.HARDWARE_REVISION, "hardwareRevision");
    await readChar(WHOOP_UUIDS.MANUFACTURER_NAME, "manufacturerName");
  }

  private async setupWhoopService(service: BluetoothRemoteGATTService) {
    try {
      const chars = await service.getCharacteristics();
      for (const char of chars) {
        if (char.properties.write || char.properties.writeWithoutResponse) {
          this.commandChar = char;
          this.log("info", "ble.whoop", "command_char.found", char.uuid);
        }
        if (char.properties.notify || char.properties.indicate) {
          await char.startNotifications().catch(() => null);
          char.addEventListener("characteristicvaluechanged", (event) => {
            const c = event.target as BluetoothRemoteGATTCharacteristic;
            if (!c.value) return;
            const data = new Uint8Array(c.value.buffer);
            this.handleWhoopNotification(service.uuid, c.uuid, data);
          });
        }
      }
      this.log("info", "ble.whoop", "whoop_service.ready", service.uuid.slice(0, 8));

      await this.sendGetDataRange();
    } catch (err) {
      this.log("warn", "ble.whoop", "whoop_service.failed", String(err));
    }
  }

  private handleWhoopNotification(serviceUUID: string, charUUID: string, data: Uint8Array) {
    this.emit("rawPacket", serviceUUID, charUUID, data);
    const parsed = parseWhoopPacket(data);
    if (!parsed) return;

    const { commandNumber, payload } = parsed;

    if (commandNumber === 0x01) {
      this.emit("syncProgress", "receiving", `cmd=0x01 bytes=${data.length}`, payload.length, false);
    } else if (commandNumber === 0x02) {
      this.emit("syncProgress", "complete", `cmd=0x02 historical sync complete`, payload.length, true);
    } else if (commandNumber === 0x20 || commandNumber === 0x21) {
      if (payload.length >= 2) {
        const bpm = (payload[0] << 8) | payload[1];
        if (bpm > 20 && bpm < 250) {
          this.emit("heartRate", bpm, [], "ble.whoop.realtime");
        }
      }
    }
  }

  async sendGetDataRange() {
    await this.sendCommand(0x40, new Uint8Array([0x01]));
  }

  async sendHistoricalSync() {
    await this.sendCommand(0x41, new Uint8Array([]));
  }

  async sendGetClock() {
    await this.sendCommand(0x60, new Uint8Array([]));
  }

  async sendSetClock() {
    const now = Math.floor(Date.now() / 1000);
    const buf = new Uint8Array(4);
    new DataView(buf.buffer).setUint32(0, now, false);
    await this.sendCommand(0x61, buf);
  }

  async toggleRealtimeHR(enable: boolean) {
    await this.sendCommand(0x22, new Uint8Array([enable ? 0x01 : 0x00]));
  }

  private async sendCommand(commandNumber: number, payload: Uint8Array) {
    if (!this.commandChar) {
      this.log("warn", "ble.cmd", "command.no_char", `cmd=0x${commandNumber.toString(16)}`);
      return;
    }
    const seq = (this.commandSequence++) & 0xff;
    const frame = buildV5CommandFrame(commandNumber, seq, payload);
    try {
      await this.commandChar.writeValue(frame);
      this.log("debug", "ble.cmd", `cmd.sent=0x${commandNumber.toString(16)}`, `seq=${seq}`);
    } catch (err) {
      this.log("error", "ble.cmd", "command.failed", String(err));
    }
  }

  private onDisconnected() {
    this.log("warn", "ble", "device.disconnected");
    this.setConnectionState("disconnected");
    this.commandChar = null;
    this.scheduleReconnect();
  }

  private scheduleReconnect() {
    if (this.isReconnecting || !this.device) return;
    this.isReconnecting = true;
    if (this.reconnectTimer) clearTimeout(this.reconnectTimer);
    this.reconnectTimer = setTimeout(async () => {
      this.log("info", "ble", "reconnect.attempt");
      const ok = await this.connect();
      this.isReconnecting = false;
      if (!ok) this.scheduleReconnect();
    }, 3000);
  }

  disconnect() {
    if (this.reconnectTimer) clearTimeout(this.reconnectTimer);
    this.isReconnecting = false;
    this.device?.gatt?.disconnect();
    this.commandChar = null;
    this.server = null;
    this.setConnectionState("disconnected");
  }

  getDevice() {
    return this.device;
  }

  isConnected() {
    return this.connectionState === "ready" || this.connectionState === "connected";
  }
}

export const whoopBLE = new WhoopBLEService();
