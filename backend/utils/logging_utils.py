"""
Structured JSON logger used by every agent node.
Produces lines like:
  {"ts": "...", "run_id": "...", "node": "discovery_node", "level": "INFO", "msg": "..."}
"""
import json
import logging
import sys
from datetime import datetime, timezone


def get_logger(node_name: str, run_id: str = ""):
    """Return a LoggerAdapter that injects run_id and node name."""
    logger = logging.getLogger(node_name)
    if not logger.handlers:
        handler = logging.StreamHandler(sys.stdout)
        handler.setFormatter(_JSONFormatter())
        logger.addHandler(handler)
        logger.setLevel(logging.DEBUG)
        logger.propagate = False
    return _NodeAdapter(logger, node_name, run_id)


class _JSONFormatter(logging.Formatter):
    def format(self, record: logging.LogRecord) -> str:
        payload = {
            "ts": datetime.now(timezone.utc).isoformat(),
            "node": getattr(record, "node_name", record.name),
            "run_id": getattr(record, "run_id", ""),
            "level": record.levelname,
            "msg": record.getMessage(),
        }
        if record.exc_info:
            payload["exc"] = self.formatException(record.exc_info)
        return json.dumps(payload)


class _NodeAdapter(logging.LoggerAdapter):
    def __init__(self, logger: logging.Logger, node_name: str, run_id: str):
        super().__init__(logger, {"node_name": node_name, "run_id": run_id})
        self._node_name = node_name
        self._run_id = run_id

    def process(self, msg, kwargs):
        kwargs.setdefault("extra", {}).update(
            {"node_name": self._node_name, "run_id": self._run_id}
        )
        return msg, kwargs
