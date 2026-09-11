"""
BLACKFIN — Communication Protocol
JSON-based packet encoding/decoding for STM32 communication.
"""

import json
from typing import Dict, Optional


def encode_config_packet(config: Dict) -> bytes:
    """Encode sonar configuration into a transmittable packet."""
    packet = {
        "type": "config",
        "frequency": config.get("frequency", 100000),
        "bandwidth": config.get("bandwidth", 10000),
        "pulse_duration": config.get("pulse_duration", 0.005),
        "transmit_power": config.get("transmit_power", 8.0),
        "waveform": config.get("waveform_type", "LFM"),
    }
    return (json.dumps(packet) + "\n").encode("utf-8")


def decode_sensor_packet(data: bytes) -> Optional[Dict]:
    """Decode a sensor data packet from STM32."""
    try:
        text = data.decode("utf-8").strip()
        packet = json.loads(text)
        if "depth" in packet:
            return {
                "timestamp": packet.get("timestamp", 0),
                "depth": float(packet.get("depth", 0)),
                "temperature": float(packet.get("temperature", 0)),
                "salinity": float(packet.get("salinity", 0)),
                "turbidity": float(packet.get("turbidity", 0)),
                "battery": float(packet.get("battery", 100)),
            }
    except (json.JSONDecodeError, UnicodeDecodeError, ValueError):
        return None
    return None


def decode_sonar_packet(data: bytes) -> Optional[Dict]:
    """Decode a sonar data packet from STM32."""
    try:
        text = data.decode("utf-8").strip()
        packet = json.loads(text)
        if "frequency" in packet:
            return {
                "timestamp": packet.get("timestamp", 0),
                "frequency": float(packet.get("frequency", 0)),
                "bandwidth": float(packet.get("bandwidth", 0)),
                "pulse_duration": float(packet.get("pulse_duration", 0)),
                "transmit_power": float(packet.get("transmit_power", 0)),
                "signal_strength": float(packet.get("signal_strength", 0)),
            }
    except (json.JSONDecodeError, UnicodeDecodeError, ValueError):
        return None
    return None
