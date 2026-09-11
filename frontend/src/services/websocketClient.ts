// BLACKFIN — Resilient Real-Time Hybrid WebSocket & Telemetry Manager
// Supports live Python backend over WebSockets, and automatically falls back to
// the high-fidelity Client-Side Simulation Engine when deployed on Vercel/cloud.

import { useSystemStore } from '../stores/systemStore';
import { useSensorStore } from '../stores/sensorStore';
import { useSonarStore } from '../stores/sonarStore';
import { useEventStore } from '../stores/eventStore';
import { clientSimulation } from './clientSimulationEngine';

class BlackfinWebSocketManager {
  private dashboardWs: WebSocket | null = null;
  private sonarWs: WebSocket | null = null;
  private eventsWs: WebSocket | null = null;

  private reconnectInterval: number = 3000;
  private isDestroyed: boolean = false;
  private connectionCount: number = 0;
  private disconnectTimeout: any = null;
  private isCloudDeployment: boolean = false;

  private getWsBase(): string | null {
    if (typeof window === 'undefined') return null;
    if (import.meta.env.VITE_WS_URL) {
      return import.meta.env.VITE_WS_URL;
    }
    const rawHost = window.location.hostname || '127.0.0.1';
    // Local development connects directly to FastAPI port 8000
    if (rawHost === 'localhost' || rawHost === '127.0.0.1') {
      return `ws://127.0.0.1:8000`;
    }
    // Deployed in cloud (Vercel, etc.) without explicit VITE_WS_URL
    return null;
  }

  public connect() {
    this.connectionCount++;
    this.isDestroyed = false;

    if (this.disconnectTimeout) {
      clearTimeout(this.disconnectTimeout);
      this.disconnectTimeout = null;
    }

    const wsBase = this.getWsBase();

    if (!wsBase) {
      // Deployed on Vercel or cloud without separate backend server:
      // Activate the high-fidelity Client-Side Simulation Engine so graphs,
      // A-Scan waveforms, power savings, and adaptations run live with real-time fluctuations!
      this.isCloudDeployment = true;
      clientSimulation.start();
      useSystemStore.getState().setWsConnected(true);
      useSystemStore.getState().updateSystemStatus({
        connected: true,
        data_source: 'STANDALONE CLOUD SIMULATION',
      });
      return;
    }

    // Local environment: Start client simulation immediately as warm-up so the UI never starts blank,
    // then attempt WebSocket connection to FastAPI backend.
    clientSimulation.start();
    useSystemStore.getState().setWsConnected(true);

    this.connectDashboard(wsBase);
    this.connectSonar(wsBase);
    this.connectEvents(wsBase);
  }

  public disconnect() {
    this.connectionCount--;
    if (this.connectionCount <= 0) {
      this.connectionCount = 0;
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

    clientSimulation.stop();
    useSystemStore.getState().setWsConnected(false);
  }

  private safeClose(ws: WebSocket | null) {
    if (!ws) return;
    ws.onopen = null;
    ws.onmessage = null;
    ws.onerror = null;
    ws.onclose = null;

    if (ws.readyState === WebSocket.OPEN) {
      try {
        ws.close(1000, 'Normal closure');
      } catch (_) {}
    } else if (ws.readyState === WebSocket.CONNECTING) {
      ws.onopen = () => {
        try {
          ws.close(1000, 'Closed after connection established');
        } catch (_) {}
      };
    }
  }

  private connectDashboard(wsBase: string) {
    if (this.isDestroyed || this.isCloudDeployment) return;

    if (
      this.dashboardWs &&
      (this.dashboardWs.readyState === WebSocket.OPEN ||
        this.dashboardWs.readyState === WebSocket.CONNECTING)
    ) {
      return;
    }

    const wsUrl = `${wsBase}/ws/dashboard`;

    try {
      const ws = new WebSocket(wsUrl);
      this.dashboardWs = ws;

      ws.onopen = () => {
        if (this.dashboardWs !== ws) return;
        // Backend connected: take over from client simulation
        clientSimulation.stop();
        useSystemStore.getState().setWsConnected(true);
        useSystemStore.getState().updateSystemStatus({
          connected: true,
          data_source: 'FASTAPI BACKEND TELEMETRY',
        });
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
          // Backend disconnected: fallback to client simulation so charts keep fluctuating smoothly
          clientSimulation.start();
          if (!this.isDestroyed) {
            setTimeout(() => this.connectDashboard(wsBase), this.reconnectInterval);
          }
        }
      };

      ws.onerror = () => {
        // Handled in onclose
      };
    } catch {
      clientSimulation.start();
      if (!this.isDestroyed) {
        setTimeout(() => this.connectDashboard(wsBase), this.reconnectInterval);
      }
    }
  }

  private connectSonar(wsBase: string) {
    if (this.isDestroyed || this.isCloudDeployment) return;

    if (
      this.sonarWs &&
      (this.sonarWs.readyState === WebSocket.OPEN ||
        this.sonarWs.readyState === WebSocket.CONNECTING)
    ) {
      return;
    }

    const wsUrl = `${wsBase}/ws/sonar`;

    try {
      const ws = new WebSocket(wsUrl);
      this.sonarWs = ws;

      ws.onmessage = (event) => {
        if (this.sonarWs !== ws) return;
        try {
          const raw = JSON.parse(event.data);
          const payload = raw.data || raw;

          if (payload.signal) {
            useSonarStore
              .getState()
              .updateSignal(payload.signal, payload.waterfall_row);
          }
        } catch (err) {
          console.error('[WS Sonar] Parse error:', err);
        }
      };

      ws.onclose = () => {
        if (this.sonarWs === ws) {
          this.sonarWs = null;
          if (!this.isDestroyed) {
            setTimeout(() => this.connectSonar(wsBase), this.reconnectInterval);
          }
        }
      };

      ws.onerror = () => {};
    } catch {
      if (!this.isDestroyed) {
        setTimeout(() => this.connectSonar(wsBase), this.reconnectInterval);
      }
    }
  }

  private connectEvents(wsBase: string) {
    if (this.isDestroyed || this.isCloudDeployment) return;

    if (
      this.eventsWs &&
      (this.eventsWs.readyState === WebSocket.OPEN ||
        this.eventsWs.readyState === WebSocket.CONNECTING)
    ) {
      return;
    }

    const wsUrl = `${wsBase}/ws/events`;

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
            setTimeout(() => this.connectEvents(wsBase), this.reconnectInterval);
          }
        }
      };

      ws.onerror = () => {};
    } catch {
      if (!this.isDestroyed) {
        setTimeout(() => this.connectEvents(wsBase), this.reconnectInterval);
      }
    }
  }
}

export const wsManager = new BlackfinWebSocketManager();
