"""
BLACKFIN — Serial Communication (Stub)
Stubbed serial communication for STM32. Ready for real hardware integration.
"""

from typing import Dict, Optional
from hardware.interface import HardwareInterface


class SerialCommunication(HardwareInterface):
    """
    Serial (USB/UART) communication with STM32.
    Currently stubbed — returns None for all reads, True for all writes.
    Replace with real pyserial implementation when hardware is available.
    """

    def __init__(self):
        self._connected = False
        self._port = ""
        self._baudrate = 115200

    async def connect(self, port: str, baudrate: int = 115200) -> bool:
        """Stub: Simulate connection."""
        self._port = port
        self._baudrate = baudrate
        self._connected = False  # Not actually connected — stub
        return False

    async def disconnect(self) -> None:
        """Stub: Disconnect."""
        self._connected = False

    def is_connected(self) -> bool:
        """Check if hardware is connected."""
        return self._connected

    async def send_configuration(self, config: Dict) -> bool:
        """Stub: Would send configuration over serial."""
        if not self._connected:
            return False
        # Real implementation:
        # packet = protocol.encode_config_packet(config)
        # self._serial.write(packet)
        return True

    async def receive_sensor_data(self) -> Optional[Dict]:
        """Stub: Would read sensor data from serial."""
        return None

    async def receive_sonar_data(self) -> Optional[Dict]:
        """Stub: Would read sonar data from serial."""
        return None
