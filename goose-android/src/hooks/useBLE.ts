import { useEffect, useCallback, useRef } from "react";
import { whoopBLE } from "../ble/WhoopBLEService";
import { useAppStore } from "../store/useAppStore";
import { computeHRV } from "../algorithms/hrv";
import { saveHRSample } from "../db/database";
import type { BLEConnectionState } from "../types";

export function useBLE() {
  const store = useAppStore();
  const rrBufferRef = useRef<number[]>([]);

  useEffect(() => {
    const handleHR = (bpm: number, rrIntervals: number[], source: string) => {
      store.setLiveHR(bpm, source);
      if (rrIntervals.length > 0) {
        store.addRRIntervals(rrIntervals);
        rrBufferRef.current = [...rrBufferRef.current, ...rrIntervals].slice(-200);

        if (rrBufferRef.current.length >= 10) {
          const result = computeHRV(rrBufferRef.current);
          store.setHRV({
            rmssd: result.rmssd,
            sdnn: result.sdnn,
            pnn50: result.pnn50,
            sampleCount: result.sampleCount,
            baseline: null,
            status: result.status,
          });
        }
      }

      saveHRSample({
        bpm,
        capturedAt: new Date(),
        rrIntervalsMS: rrIntervals,
        source,
      }).catch(() => null);
    };

    const handleBattery = (percent: number, charging: boolean | null) => {
      store.updateDevice({ batteryPercent: percent, batteryCharging: charging });
    };

    const handleDeviceInfo = (key: string, value: string) => {
      store.updateDevice({ [key]: value } as Parameters<typeof store.updateDevice>[0]);
    };

    const handleConnectionState = (state: string) => {
      store.setBLEState(state as BLEConnectionState);
      if (state === "ready" || state === "connected") {
        store.updateDevice({
          connectedAt: new Date(),
          name: "WHOOP",
          id: whoopBLE.getDeviceId() ?? "",
        });
      }
    };

    const handleMessage = (msg: Parameters<typeof store.addLog>[0]) => {
      store.addLog(msg);
    };

    const handleRawPacket = (serviceUUID: string, charUUID: string, data: Uint8Array) => {
      store.incrementPacketCount();
      store.addCapturedPacket({
        serviceUUID,
        charUUID,
        data: Array.from(data).map((b) => b.toString(16).padStart(2, "0")).join(" "),
        timestamp: new Date(),
      });
    };

    const handleSync = (status: string, detail: string, packetCount: number, isTerminal: boolean) => {
      store.setHistoricalSyncing(!isTerminal, `${status}: ${detail}`);
      if (packetCount > 0) store.incrementPacketCount(packetCount);
    };

    whoopBLE.on("heartRate", handleHR);
    whoopBLE.on("batteryLevel", handleBattery);
    whoopBLE.on("deviceInfo", handleDeviceInfo);
    whoopBLE.on("connectionState", handleConnectionState);
    whoopBLE.on("message", handleMessage);
    whoopBLE.on("rawPacket", handleRawPacket);
    whoopBLE.on("syncProgress", handleSync);

    return () => {
      whoopBLE.off("heartRate", handleHR);
      whoopBLE.off("batteryLevel", handleBattery);
      whoopBLE.off("deviceInfo", handleDeviceInfo);
      whoopBLE.off("connectionState", handleConnectionState);
      whoopBLE.off("message", handleMessage);
      whoopBLE.off("rawPacket", handleRawPacket);
      whoopBLE.off("syncProgress", handleSync);
    };
  }, []);

  const connectDevice = useCallback(async () => {
    await whoopBLE.requestDevice();
  }, []);

  const disconnectDevice = useCallback(() => {
    void whoopBLE.disconnect();
  }, []);

  const syncHistorical = useCallback(async () => {
    await whoopBLE.sendHistoricalSync();
  }, []);

  const toggleRealtimeHR = useCallback(async (enable: boolean) => {
    await whoopBLE.toggleRealtimeHR(enable);
  }, []);

  return {
    connectDevice,
    disconnectDevice,
    syncHistorical,
    toggleRealtimeHR,
    isSupported: true,
  };
}
