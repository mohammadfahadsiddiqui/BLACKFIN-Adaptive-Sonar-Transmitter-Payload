// BLACKFIN — Resilient Real-Time WebSocket Client Manager

import { useSystemStore } from '../stores/systemStore';
import { useSensorStore } from '../stores/sensorStore';
import { useSonarStore } from '../stores/sonarStore';
import { useEventStore } from '../stores/eventStore';

class BlackfinWebSocketManager {
  private dashboardWs: WebSocket | null = null;
  private sonarWs: WebSocket | null = null;
  private eventsWs: WebSocket | null = null;

  private reconnectInterval: number = 2500;
  private isDestroyed: boolean = false;
  private fallbackPollTimer: any = null;

  // React StrictMode & HMR reference counting
  private connectionCount: number = 0;
  private disconnectTimeout: any = null;

  public connect() {
    this.connectionCount++;
    this.isDestroyed = false;

    // If a disconnect was pending due to React StrictMode unmount/remount, cancel it
    if (this.disconnectTimeout) {
      clearTimeout(this.disconnectTimeout);
      this.disconnectTimeout = null;
    }

    this.connectDashboard();
    this.connectSonar();
    this.connectEvents();
    this.startFallbackPolling();
  }

  public disconnect() {
    this.connectionCount--;
    if (this.connectionCount <= 0) {
      this.connectionCount = 0;
      // Debounce teardown by 300ms to allow React StrictMode immediate remount to preserve connections
      if (this.disconnectTimeout) {
        clearTimeout(this.disconnectTimeout);
      }
      this.disconnectTimeout = setTimeout(() => {
        if (this.connectionCount === 0) {
          this.teardownAll();
        }
      }, 300);
    }
  }

  private teardownAll() {
    this.isDestroyed = true;
    this.safeClose(this.dashboardWs);
    this.dashboardWs = null;

    this.safeClose(this.sonarWs);
    this.sonarWs = null;

    this.safeClose(this.eventsWs);
    this.eventsWs = null;

    if (this.fallbackPollTimer) {
      clearInterval(this.fallbackPollTimer);
      this.fallbackPollTimer = null;
    }

    useSystemStore.getState().setWsConnected(false);
  }

  private safeClose(ws: WebSocket | null) {
    if (!ws) return;

    // Detach all listeners so old callbacks don't fire into stale state
    ws.onopen = null;
    ws.onmessage = null;
    ws.onerror = null;
    ws.onclose = null;

    if (ws.readyState === WebSocket.OPEN) {
      try {
        ws.close(1000, 'Normal closure');
      } catch (_) {}
    } else if (ws.readyState === WebSocket.CONNECTING) {
      // Do NOT call close() while CONNECTING as that causes:
      // "WebSocket is closed before the connection is established"
      // Instead, cleanly close once opened
      ws.onopen = () => {
        try {
          ws.close(1000, 'Closed after connection established');
        } catch (_) {}
      };
    }
  }

  private getHost(): string {
    const rawHost = window.location.hostname || '127.0.0.1';
    // On Windows, 'localhost' often resolves to IPv6 (::1) first, which fails if backend is IPv4
    // Using 127.0.0.1 ensures immediate, deterministic connection
    if (rawHost === 'localhost' || rawHost === '127.0.0.1') {
      return '127.0.0.1';
    }
    return rawHost;
  }

  private getWsBase(): string {
    return `ws://${this.getHost()}:8000`;
  }

  private getHttpBase(): string {
    return `http://${this.getHost()}:8000`;
  }

  private connectDashboard() {
    if (this.isDestroyed) return;

    // Check if already active or in-flight
    if (
      this.dashboardWs &&
      (this.dashboardWs.readyState === WebSocket.OPEN ||
        this.dashboardWs.readyState === WebSocket.CONNECTING)
    ) {
      return;
    }

    const wsUrl = `${this.getWsBase()}/ws/dashboard`;

    try {
      const ws = new WebSocket(wsUrl);
      this.dashboardWs = ws;

      ws.onopen = () => {
        if (this.dashboardWs !== ws) return;
        useSystemStore.getState().setWsConnected(true);
      };

      ws.onmessage = (event) => {
        if (this.dashboardWs !== ws) return;
        try {
          const raw = JSON.parse(event.data);
          const payload = raw.data || raw;

          if (payload.environment) {
            useSensorStore.getState().updateEnvironment(payload.environment);
          }
          if (payload.sonar_config) {
            useSonarStore.getState().updateSonarConfig(payload.sonar_config);
          }
          if (payload.target) {
            useSonarStore.getState().updateTarget(payload.target);
          }
          if (payload.energy) {
            useSonarStore.getState().updateEnergy(payload.energy);
          }
          if (payload.system_status) {
            useSystemStore.getState().updateSystemStatus(payload.system_status);
          }
          if (payload.latest_adaptation) {
            useSonarStore.getState().setLatestAdaptation(payload.latest_adaptation);
          }
        } catch (err) {
          console.error('[WS Dashboard] Parse error:', err);
        }
      };

      ws.onclose = () => {
        if (this.dashboardWs === ws) {
          this.dashboardWs = null;
          useSystemStore.getState().setWsConnected(false);
          if (!this.isDestroyed) {
            setTimeout(() => this.connectDashboard(), this.reconnectInterval);
          }
        }
      };

      ws.onerror = () => {
        // Do NOT call ws.close() here. The browser automatically fires onclose following an error.
      };
    } catch (e) {
      if (!this.isDestroyed) {
        setTimeout(() => this.connectDashboard(), this.reconnectInterval);
      }
    }
  }

  private connectSonar() {
    if (this.isDestroyed) return;

    // Check if already active or in-flight
    if (
      this.sonarWs &&
      (this.sonarWs.readyState === WebSocket.OPEN ||
        this.sonarWs.readyState === WebSocket.CONNECTING)
    ) {
      return;
    }

    const wsUrl = `${this.getWsBase()}/ws/sonar`;

    try {
      const ws = new WebSocket(wsUrl);
      this.sonarWs = ws;

      ws.onmessage = (event) => {
        if (this.sonarWs !== ws) return;
        try {
          const raw = JSON.parse(event.data);
          const payload = raw.data || raw;
          if (payload.signal) {
            useSonarStore.getState().updateSignal(payload.signal, payload.waterfall_row);
          }
        } catch (err) {
          console.error('[WS Sonar] Parse error:', err);
        }
      };

      ws.onclose = () => {
        if (this.sonarWs === ws) {
          this.sonarWs = null;
          if (!this.isDestroyed) {
            setTimeout(() => this.connectSonar(), this.reconnectInterval);
          }
        }
      };

      ws.onerror = () => {
        // Do NOT call ws.close() here.
      };
    } catch (e) {
      if (!this.isDestroyed) {
        setTimeout(() => this.connectSonar(), this.reconnectInterval);
      }
    }
  }

  private connectEvents() {
    if (this.isDestroyed) return;

    // Check if already active or in-flight
    if (
      this.eventsWs &&
      (this.eventsWs.readyState === WebSocket.OPEN ||
        this.eventsWs.readyState === WebSocket.CONNECTING)
    ) {
      return;
    }

    const wsUrl = `${this.getWsBase()}/ws/events`;

    try {
      const ws = new WebSocket(wsUrl);
      this.eventsWs = ws;

      ws.onmessage = (event) => {
        if (this.eventsWs !== ws) return;
        try {
          const raw = JSON.parse(event.data);
          const newEvent = raw.data || raw;
          if (newEvent && newEvent.message) {
            useEventStore.getState().addEvent(newEvent);
            if (newEvent.category === 'adaptation' && newEvent.details?.adaptation) {
              useSonarStore.getState().addAdaptationRecord(newEvent.details.adaptation);
            }
          }
        } catch (err) {
          console.error('[WS Events] Parse error:', err);
        }
      };

      ws.onclose = () => {
        if (this.eventsWs === ws) {
          this.eventsWs = null;
          if (!this.isDestroyed) {
            setTimeout(() => this.connectEvents(), this.reconnectInterval);
          }
        }
      };

      ws.onerror = () => {
        // Do NOT call ws.close() here.
      };
    } catch (e) {
      if (!this.isDestroyed) {
        setTimeout(() => this.connectEvents(), this.reconnectInterval);
      }
    }
  }

  // Backup HTTP polling if WebSocket is temporarily dropped
  private startFallbackPolling() {
    if (this.fallbackPollTimer) clearInterval(this.fallbackPollTimer);
    this.fallbackPollTimer = setInterval(async () => {
      const isWsConnected = useSystemStore.getState().wsConnected;
      if (!isWsConnected && !this.isDestroyed) {
        try {
          const res = await fetch(`${this.getHttpBase()}/api/sensors/latest`);
          if (res.ok) {
            const data = await res.json();
            if (data && data.depth !== undefined) {
              useSensorStore.getState().updateEnvironment(data);
              useSystemStore.getState().setWsConnected(true);
            }
          }
        } catch (e) {
          // ignore
        }
      }
    }, 2000);
  }
}

export const wsManager = new BlackfinWebSocketManager();
