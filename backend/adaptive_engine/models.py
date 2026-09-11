"""
BLACKFIN — Pydantic Models
Data models for the entire system.
"""

from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
from enum import Enum
import time


class SystemMode(str, Enum):
    SIMULATION = "simulation"
    HARDWARE = "hardware"


class AdaptationMode(str, Enum):
    AUTO = "auto"
    MANUAL = "manual"


class WaveformType(str, Enum):
    LFM = "LFM"      # Linear Frequency Modulated
    CW = "CW"        # Continuous Wave
    HFM = "HFM"      # Hyperbolic Frequency Modulated


class ComponentStatus(str, Enum):
    ONLINE = "online"
    OFFLINE = "offline"
    WARNING = "warning"
    ERROR = "error"


class EventCategory(str, Enum):
    ENVIRONMENT = "environment"
    SONAR = "sonar"
    ADAPTATION = "adaptation"
    TARGET = "target"
    HARDWARE = "hardware"
    WARNING = "warning"
    SYSTEM = "system"


# --- Environment ---

class EnvironmentState(BaseModel):
    """Current underwater environmental conditions."""
    timestamp: float = Field(default_factory=time.time)
    depth: float = 20.0                # meters
    temperature: float = 22.0          # °C
    salinity: float = 35.0             # PSU
    turbidity: float = 10.0            # %
    noise_level: float = 45.0          # dB
    target_distance: float = 50.0      # meters
    battery: float = 95.0              # %
    speed_of_sound: float = 1500.0     # m/s (calculated)


# --- Sonar Configuration ---

class SonarConfiguration(BaseModel):
    """Current sonar transmission parameters."""
    frequency: float = 100_000         # Hz
    bandwidth: float = 10_000          # Hz
    pulse_duration: float = 0.005      # seconds
    transmit_power: float = 8.0        # Watts
    waveform_type: WaveformType = WaveformType.LFM
    mode: AdaptationMode = AdaptationMode.AUTO

    def to_display(self) -> Dict[str, Any]:
        """Convert to human-readable display format."""
        return {
            "frequency_khz": round(self.frequency / 1000, 1),
            "bandwidth_khz": round(self.bandwidth / 1000, 1),
            "pulse_duration_ms": round(self.pulse_duration * 1000, 1),
            "transmit_power_w": round(self.transmit_power, 1),
            "waveform_type": self.waveform_type.value,
            "mode": self.mode.value,
        }


# --- Signal Data ---

class SignalData(BaseModel):
    """Processed sonar signal data for visualization."""
    timestamp: float = Field(default_factory=time.time)
    time_axis: List[float] = []        # ms
    amplitude: List[float] = []        # normalized amplitude
    freq_axis: List[float] = []        # kHz
    magnitude: List[float] = []        # dB
    echo_peaks: List[Dict[str, float]] = []  # [{time, amplitude, range}]


# --- Target Detection ---

class TargetDetection(BaseModel):
    """Detected target information."""
    timestamp: float = Field(default_factory=time.time)
    detected: bool = False
    estimated_range: float = 0.0       # meters
    signal_strength: float = 0.0       # dB
    snr: float = 0.0                   # dB
    confidence: float = 0.0            # 0-100 %
    peak_amplitude: float = 0.0


# --- Adaptation ---

class AdaptationResult(BaseModel):
    """Result of an adaptive engine decision."""
    timestamp: float = Field(default_factory=time.time)
    triggered: bool = False
    old_config: Dict[str, Any] = {}
    new_config: Dict[str, Any] = {}
    reason: str = ""
    triggered_rules: List[str] = []
    confidence: float = 0.0            # 0-100 %
    environment_snapshot: Dict[str, float] = {}


# --- Energy ---

class EnergyMetrics(BaseModel):
    """Power and energy usage metrics."""
    current_power: float = 0.0         # Watts
    average_power: float = 0.0         # Watts
    total_energy: float = 0.0          # Wh
    battery_level: float = 100.0       # %
    estimated_remaining_hours: float = 0.0
    adaptive_efficiency: float = 0.0   # % time in adaptive mode
    energy_saved_percent: float = 0.0  # simulated savings


# --- System Health ---

class ComponentHealth(BaseModel):
    """Health status of a system component."""
    name: str
    status: ComponentStatus = ComponentStatus.OFFLINE
    last_update: float = 0.0
    latency_ms: float = 0.0
    details: str = ""


class SystemHealth(BaseModel):
    """Overall system health."""
    components: List[ComponentHealth] = []
    uptime_seconds: float = 0.0
    mode: SystemMode = SystemMode.SIMULATION
    data_source: str = "SIMULATION"


# --- Events ---

class SystemEvent(BaseModel):
    """A logged system event."""
    timestamp: float = Field(default_factory=time.time)
    category: EventCategory = EventCategory.SYSTEM
    message: str = ""
    details: Optional[Dict[str, Any]] = None


# --- System Status ---

class SystemStatus(BaseModel):
    """Overall system status."""
    mode: SystemMode = SystemMode.SIMULATION
    adaptation_mode: AdaptationMode = AdaptationMode.AUTO
    sonar_running: bool = False
    connected: bool = True
    uptime: float = 0.0
    data_source: str = "SIMULATION"
    tick_count: int = 0


# --- Dashboard Payload (WebSocket) ---

class DashboardPayload(BaseModel):
    """Combined payload streamed via /ws/dashboard."""
    environment: EnvironmentState
    sonar_config: Dict[str, Any]
    target: TargetDetection
    energy: EnergyMetrics
    system_status: SystemStatus
    latest_adaptation: Optional[AdaptationResult] = None


class SonarPayload(BaseModel):
    """Signal payload streamed via /ws/sonar."""
    signal: SignalData
    waterfall_row: List[float] = []    # single FFT row for waterfall


# --- API Request Models ---

class SimulationUpdate(BaseModel):
    """Update simulation environment parameters."""
    depth: Optional[float] = None
    temperature: Optional[float] = None
    salinity: Optional[float] = None
    turbidity: Optional[float] = None
    noise_level: Optional[float] = None
    target_distance: Optional[float] = None
    battery: Optional[float] = None


class ManualSonarConfig(BaseModel):
    """Manual sonar configuration override."""
    frequency: Optional[float] = None
    bandwidth: Optional[float] = None
    pulse_duration: Optional[float] = None
    transmit_power: Optional[float] = None


class PresetRequest(BaseModel):
    """Apply an environment preset."""
    preset_name: str
