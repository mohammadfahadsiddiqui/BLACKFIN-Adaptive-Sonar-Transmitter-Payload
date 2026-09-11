"""
BLACKFIN — Database Layer
SQLite database for persistent storage of sensor, sonar, adaptation, and detection records.
"""

import aiosqlite
import json
import time
import os
from typing import List, Dict, Any, Optional

DB_PATH = os.path.join(os.path.dirname(os.path.dirname(__file__)), "blackfin.db")
MAX_RECORDS = 10_000


async def init_db():
    """Initialize the database and create tables."""
    async with aiosqlite.connect(DB_PATH) as db:
        await db.execute("""
            CREATE TABLE IF NOT EXISTS sensor_records (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                timestamp REAL NOT NULL,
                depth REAL,
                temperature REAL,
                salinity REAL,
                turbidity REAL,
                noise_level REAL,
                battery REAL
            )
        """)
        await db.execute("""
            CREATE TABLE IF NOT EXISTS sonar_records (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                timestamp REAL NOT NULL,
                frequency REAL,
                bandwidth REAL,
                pulse_duration REAL,
                power REAL,
                waveform TEXT
            )
        """)
        await db.execute("""
            CREATE TABLE IF NOT EXISTS adaptation_records (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                timestamp REAL NOT NULL,
                old_config TEXT,
                new_config TEXT,
                reason TEXT,
                triggered_rules TEXT,
                confidence REAL,
                environment TEXT
            )
        """)
        await db.execute("""
            CREATE TABLE IF NOT EXISTS detection_records (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                timestamp REAL NOT NULL,
                detected INTEGER,
                estimated_range REAL,
                signal_strength REAL,
                snr REAL,
                confidence REAL
            )
        """)
        await db.execute("""
            CREATE TABLE IF NOT EXISTS event_log (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                timestamp REAL NOT NULL,
                category TEXT,
                message TEXT,
                details TEXT
            )
        """)
        await db.commit()


async def insert_sensor_record(env: Dict[str, Any]):
    """Insert a sensor reading."""
    async with aiosqlite.connect(DB_PATH) as db:
        await db.execute(
            "INSERT INTO sensor_records (timestamp, depth, temperature, salinity, turbidity, noise_level, battery) VALUES (?, ?, ?, ?, ?, ?, ?)",
            (env.get("timestamp", time.time()), env.get("depth"), env.get("temperature"),
             env.get("salinity"), env.get("turbidity"), env.get("noise_level"), env.get("battery"))
        )
        await db.commit()


async def insert_sonar_record(config: Dict[str, Any]):
    """Insert a sonar configuration record."""
    async with aiosqlite.connect(DB_PATH) as db:
        await db.execute(
            "INSERT INTO sonar_records (timestamp, frequency, bandwidth, pulse_duration, power, waveform) VALUES (?, ?, ?, ?, ?, ?)",
            (time.time(), config.get("frequency"), config.get("bandwidth"),
             config.get("pulse_duration"), config.get("transmit_power"), config.get("waveform_type"))
        )
        await db.commit()


async def insert_adaptation_record(adaptation: Dict[str, Any]):
    """Insert an adaptation event."""
    async with aiosqlite.connect(DB_PATH) as db:
        await db.execute(
            "INSERT INTO adaptation_records (timestamp, old_config, new_config, reason, triggered_rules, confidence, environment) VALUES (?, ?, ?, ?, ?, ?, ?)",
            (adaptation.get("timestamp", time.time()),
             json.dumps(adaptation.get("old_config", {})),
             json.dumps(adaptation.get("new_config", {})),
             adaptation.get("reason", ""),
             json.dumps(adaptation.get("triggered_rules", [])),
             adaptation.get("confidence", 0),
             json.dumps(adaptation.get("environment_snapshot", {})))
        )
        await db.commit()


async def insert_detection_record(detection: Dict[str, Any]):
    """Insert a target detection record."""
    async with aiosqlite.connect(DB_PATH) as db:
        await db.execute(
            "INSERT INTO detection_records (timestamp, detected, estimated_range, signal_strength, snr, confidence) VALUES (?, ?, ?, ?, ?, ?)",
            (detection.get("timestamp", time.time()),
             1 if detection.get("detected", False) else 0,
             detection.get("estimated_range", 0),
             detection.get("signal_strength", 0),
             detection.get("snr", 0),
             detection.get("confidence", 0))
        )
        await db.commit()


async def insert_event(event: Dict[str, Any]):
    """Insert a system event."""
    async with aiosqlite.connect(DB_PATH) as db:
        await db.execute(
            "INSERT INTO event_log (timestamp, category, message, details) VALUES (?, ?, ?, ?)",
            (event.get("timestamp", time.time()),
             event.get("category", "system"),
             event.get("message", ""),
             json.dumps(event.get("details")))
        )
        await db.commit()


async def get_events(category: Optional[str] = None, limit: int = 100) -> List[Dict[str, Any]]:
    """Retrieve events with optional category filter."""
    async with aiosqlite.connect(DB_PATH) as db:
        db.row_factory = aiosqlite.Row
        if category and category != "all":
            cursor = await db.execute(
                "SELECT * FROM event_log WHERE category = ? ORDER BY timestamp DESC LIMIT ?",
                (category, limit)
            )
        else:
            cursor = await db.execute(
                "SELECT * FROM event_log ORDER BY timestamp DESC LIMIT ?",
                (limit,)
            )
        rows = await cursor.fetchall()
        return [dict(row) for row in rows]


async def get_adaptation_history(limit: int = 50) -> List[Dict[str, Any]]:
    """Retrieve adaptation history."""
    async with aiosqlite.connect(DB_PATH) as db:
        db.row_factory = aiosqlite.Row
        cursor = await db.execute(
            "SELECT * FROM adaptation_records ORDER BY timestamp DESC LIMIT ?",
            (limit,)
        )
        rows = await cursor.fetchall()
        results = []
        for row in rows:
            d = dict(row)
            d["old_config"] = json.loads(d.get("old_config", "{}"))
            d["new_config"] = json.loads(d.get("new_config", "{}"))
            d["triggered_rules"] = json.loads(d.get("triggered_rules", "[]"))
            d["environment"] = json.loads(d.get("environment", "{}"))
            results.append(d)
        return results


async def cleanup_old_records():
    """Remove old records exceeding MAX_RECORDS per table."""
    tables = ["sensor_records", "sonar_records", "adaptation_records", "detection_records", "event_log"]
    async with aiosqlite.connect(DB_PATH) as db:
        for table in tables:
            await db.execute(f"""
                DELETE FROM {table} WHERE id NOT IN (
                    SELECT id FROM {table} ORDER BY id DESC LIMIT {MAX_RECORDS}
                )
            """)
        await db.commit()
