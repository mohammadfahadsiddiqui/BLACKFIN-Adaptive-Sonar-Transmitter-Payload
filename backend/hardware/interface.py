"""
BLACKFIN — Hardware Interface
Abstract base class for hardware communication.
"""

from abc import ABC, abstractmethod
from typing import Dict, Optional


class HardwareInterface(ABC):
    """Abstract interface for STM32 hardware communication."""

    @abstractmethod
    async def connect(self, port: str, baudrate: int = 115200) -> bool:
        """Establish connection to hardware."""
        pass

    @abstractmethod
    async def disconnect(self) -> None:
        """Disconnect from hardware."""
        pass

    @abstractmethod
    def is_connected(self) -> bool:
        """Check connection status."""
        pass

    @abstractmethod
    async def send_configuration(self, config: Dict) -> bool:
        """Send sonar configuration to STM32."""
        pass

    @abstractmethod
    async def receive_sensor_data(self) -> Optional[Dict]:
        """Receive sensor data packet from STM32."""
        pass

    @abstractmethod
    async def receive_sonar_data(self) -> Optional[Dict]:
        """Receive sonar data packet from STM32."""
        pass
