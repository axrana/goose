import { BleClient, BleDevice, numberToUUID } from "@capacitor-community/bluetooth-le";
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

  HR_SERVICE: numberToUUID(0x180d),
  HR_MEASUREMENT: numberToUUID(0x2a37),

  BATTERY_SERVICE: numberToUUID(0x180f),
  BATTERY_LEVEL: numberToUUID(0x2a19),

  DEVICE_INFO_SERVICE: numberToUUID(0x180a),
  MODEL_NUMBER: numberToUUID(0x2a24),
  FIRMWARE_REVISION: numberToUUID(0x2a26),
  HARDWARE_REVISION: numberToUUID(0x2a27),
  SOFTWARE_REVISION: numberToUUID(0x2a28),
  MANUFACTURER_NAME: numberToUUID(0x2a29),
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

export function buildV5CommandFrame(
  commandNumber: number,
  sequence: number,
  payload: Uint8Array = new Uint8Array()
): Uint8Array {
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
  private deviceId: string | null = null;
  private connectionState = "disconnected";
  private listeners: Partial<{ [K in keyof BLEEventMap]: BLEEventMap[K][] }> = {};
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private commandSequence = 0;
  private commandCharUUID: string | null = null;
  private commandServiceUUID: string | null = null;
  private isReconnecting = false;
  private initialized = false;

  static isSupported(): boolean {
    return true;
  }

  on<K extends keyof BLEEventMap>(event: K, listener: BLEEventMap[K]) {
    if (!this.listeners[event]) this.listeners[event] = [];
    (this.listeners[event] as BLEEventMap[K][]).push(listener);
  }

  off<K extends keyof BLEEventMap>(event: K, listener: BLEEventMap[K]) {
    if (!this.listeners[event]) return;
    this.listeners[event] = (this.listeners[event] as BLEEventMap[K][]).filter(
      (l) => l !== listener
    ) as typeof this.listeners[K];
  }

  private emit<K extends keyof BLEEventMap>(event: K, ...args: Parameters<BLEEventMap[K]>) {
    (this.listeners[event] as ((...a: Parameters<BLEEventMap[K]>) => void)[] | undefined)?.forEach(
      (l) => l(...args)
    );
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

  private async ensureInitialized() {
    if (!this.initialized) {
      await BleClient.initialize({ androidNeverForLocation: true });
      this.initialized = true;
    }
  }

  async requestDevice(): Promise<boolean> {
    try {
      await this.ensureInitialized();
      this.setConnectionState("scanning");
      this.log("info", "ble", "scan.start");

      const device: BleDevice = await BleClient.requestDevice({
        services: [WHOOP_UUIDS.V5_SERVICE, WHOOP_UUIDS.GEN4_SERVICE],
        optionalServices: [
          WHOOP_UUIDS.HR_SERVICE,
          WHOOP_UUIDS.BATTERY_SERVICE,
          WHOOP_UUIDS.DEVICE_INFO_SERVICE,
        ],
        namePrefix: "WHOOP",
      });

      this.deviceId = device.deviceId;
      this.log("info", "ble", "device.selected", device.name ?? device.deviceId);
      return await this.connect();
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      this.log("warn", "ble", "scan.cancelled", msg);
      this.setConnectionState("disconnected");
      return false;
    }
  }

  async connect(): Promise<boolean> {
    if (!this.deviceId) {
      this.setConnectionState("error");
      return false;
    }
    try {
      this.setConnectionState("connecting");
      this.log("info", "ble", "connect.start", this.deviceId);

      await BleClient.connect(this.deviceId, (deviceId) => {
        this.log("warn", "ble", "device.disconnected", deviceId);
        this.setConnectionState("disconnected");
        this.commandCharUUID = null;
        this.commandServiceUUID = null;
        this.scheduleReconnect();
      });

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
    if (!this.deviceId) return;

    const services = [
      WHOOP_UUIDS.V5_SERVICE,
      WHOOP_UUIDS.GEN4_SERVICE,
      WHOOP_UUIDS.HR_SERVICE,
      WHOOP_UUIDS.BATTERY_SERVICE,
      WHOOP_UUIDS.DEVICE_INFO_SERVICE,
    ];

    for (const serviceUUID of services) {
      try {
        await this.setupService(serviceUUID);
      } catch {
        // Service may not be present on this device
      }
    }
  }

  private async setupService(serviceUUID: string) {
    if (!this.deviceId) return;
    const uuid = serviceUUID.toLowerCase();

    if (uuid === WHOOP_UUIDS.HR_SERVICE) {
      await this.setupHRService();
    } else if (uuid === WHOOP_UUIDS.BATTERY_SERVICE) {
      await this.setupBatteryService();
    } else if (uuid === WHOOP_UUIDS.DEVICE_INFO_SERVICE) {
      await this.readDeviceInfo();
    } else if (uuid.startsWith("fd4b") || uuid.startsWith("61080")) {
      await this.setupWhoopService(serviceUUID);
    }
  }

  private async setupHRService() {
    if (!this.deviceId) return;
    try {
      await BleClient.startNotifications(
        this.deviceId,
        WHOOP_UUIDS.HR_SERVICE,
        WHOOP_UUIDS.HR_MEASUREMENT,
        (value: DataView) => {
          const parsed = parseHeartRateMeasurement(value);
          if (parsed) {
            this.emit("heartRate", parsed.bpm, parsed.rrIntervalsMS, "ble.hr.standard");
          }
        }
      );
      this.log("info", "ble.hr", "hr_notifications.started");
    } catch (err) {
      this.log("warn", "ble.hr", "hr_setup.failed", String(err));
    }
  }

  private async setupBatteryService() {
    if (!this.deviceId) return;
    try {
      const value = await BleClient.read(
        this.deviceId,
        WHOOP_UUIDS.BATTERY_SERVICE,
        WHOOP_UUIDS.BATTERY_LEVEL
      );
      const percent = value.getUint8(0);
      this.emit("batteryLevel", percent, null);
      this.log("info", "ble.battery", "battery.read", `${percent}%`);

      await BleClient.startNotifications(
        this.deviceId,
        WHOOP_UUIDS.BATTERY_SERVICE,
        WHOOP_UUIDS.BATTERY_LEVEL,
        (v: DataView) => {
          this.emit("batteryLevel", v.getUint8(0), null);
        }
      ).catch(() => null);
    } catch (err) {
      this.log("warn", "ble.battery", "battery.failed", String(err));
    }
  }

  private async readDeviceInfo() {
    if (!this.deviceId) return;
    const readChar = async (charUUID: string, key: string) => {
      try {
        const value = await BleClient.read(
          this.deviceId!,
          WHOOP_UUIDS.DEVICE_INFO_SERVICE,
          charUUID
        );
        const text = new TextDecoder().decode(value.buffer);
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

  private async setupWhoopService(serviceUUID: string) {
    if (!this.deviceId) return;
    try {
      const services = await BleClient.getServices(this.deviceId);
      const service = services.find((s) => s.uuid.toLowerCase() === serviceUUID.toLowerCase());
      if (!service) return;
      const chars = service.characteristics;
      for (const char of chars) {
        const props = char.properties;
        if (props.write || props.writeWithoutResponse) {
          this.commandCharUUID = char.uuid;
          this.commandServiceUUID = serviceUUID;
          this.log("info", "ble.whoop", "command_char.found", char.uuid);
        }
        if (props.notify || props.indicate) {
          await BleClient.startNotifications(
            this.deviceId,
            serviceUUID,
            char.uuid,
            (value: DataView) => {
              const data = new Uint8Array(value.buffer);
              this.handleWhoopNotification(serviceUUID, char.uuid, data);
            }
          ).catch(() => null);
        }
      }
      this.log("info", "ble.whoop", "whoop_service.ready", serviceUUID.slice(0, 8));
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
      this.emit("syncProgress", "complete", "cmd=0x02 historical sync complete", payload.length, true);
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
    if (!this.deviceId || !this.commandCharUUID || !this.commandServiceUUID) {
      this.log("warn", "ble.cmd", "command.no_char", `cmd=0x${commandNumber.toString(16)}`);
      return;
    }
    const seq = (this.commandSequence++) & 0xff;
    const frame = buildV5CommandFrame(commandNumber, seq, payload);
    try {
      await BleClient.write(
        this.deviceId,
        this.commandServiceUUID,
        this.commandCharUUID,
        new DataView(frame.buffer)
      );
      this.log("debug", "ble.cmd", `cmd.sent=0x${commandNumber.toString(16)}`, `seq=${seq}`);
    } catch (err) {
      this.log("error", "ble.cmd", "command.failed", String(err));
    }
  }

  private scheduleReconnect() {
    if (this.isReconnecting || !this.deviceId) return;
    this.isReconnecting = true;
    if (this.reconnectTimer) clearTimeout(this.reconnectTimer);
    this.reconnectTimer = setTimeout(async () => {
      this.log("info", "ble", "reconnect.attempt");
      const ok = await this.connect();
      this.isReconnecting = false;
      if (!ok) this.scheduleReconnect();
    }, 3000);
  }

  async disconnect() {
    if (this.reconnectTimer) clearTimeout(this.reconnectTimer);
    this.isReconnecting = false;
    if (this.deviceId) {
      await BleClient.disconnect(this.deviceId).catch(() => null);
    }
    this.commandCharUUID = null;
    this.commandServiceUUID = null;
    this.setConnectionState("disconnected");
  }

  getDeviceId() {
    return this.deviceId;
  }

  isConnected() {
    return this.connectionState === "ready" || this.connectionState === "connected";
  }
}

export const whoopBLE = new WhoopBLEService();
