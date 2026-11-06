"""Civic FE Tune Assist: the server half of the tuning loop (ADR 0002, ADR 0004).

`kta_server.app:app` is the local run, `kta_server.owners:app` the hosted beta;
`create_app()` is what the seam-1 tests build over their own SQLite file.
"""

__all__ = ["create_app"]