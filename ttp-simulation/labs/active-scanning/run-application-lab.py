#!/usr/bin/env python3
"""Nmap -> 32 disposable loopback listeners -> actual application accept records.

No root, packet capture, downloads or external targets. This intentionally tests
open-port fan-out only. It cannot observe rejected/filtered probes, packet flags,
or a real perimeter. Evidence output must be a new directory.
"""
import argparse
import hashlib
import json
from pathlib import Path
import selectors
import shutil
import socket
import subprocess
import threading
import time

parser = argparse.ArgumentParser()
parser.add_argument('--output', required=True)
args = parser.parse_args()
out = Path(args.output).resolve()
if out.exists():
    raise SystemExit('Refusing to overwrite existing evidence; choose a new directory.')
nmap = shutil.which('nmap')
if not nmap:
    raise SystemExit('Nmap is required; installation is not performed by this lab.')
selector = selectors.DefaultSelector()
listeners, records = [], []
stop = threading.Event()
def collect():
    while not stop.is_set():
        for key, _ in selector.select(timeout=.1):
            conn, source = key.fileobj.accept()
            destination = conn.getsockname()
            records.append({'schema': '1200km.lab.tcp-accept.v1', 'synthetic': False, 'ts': time.time(), 'source_ip': source[0], 'source_port': source[1], 'destination_ip': destination[0], 'destination_port': destination[1], 'event': 'socket_accept'})
            conn.close()
thread = None
try:
    for port in range(18080, 18112):
        listener = socket.socket()
        listeners.append(listener)
        listener.bind(('127.0.0.1', port))
        listener.listen()
        selector.register(listener, selectors.EVENT_READ)
    out.mkdir(parents=True)
    thread = threading.Thread(target=collect, daemon=True)
    thread.start()
    command = [nmap, '-sT', '-Pn', '-n', '-p', '18080-18111', '--scan-delay', '100ms', '--max-retries', '0', '--host-timeout', '10s', '127.0.0.1']
    start = time.time()
    scan = subprocess.run(command, text=True, capture_output=True, timeout=15)
    time.sleep(.2)
    stop.set()
    thread.join(timeout=1)
    (out / 'nmap.txt').write_text(scan.stdout + scan.stderr)
    (out / 'accept.jsonl').write_text(''.join(json.dumps(r) + '\n' for r in records))
    if scan.returncode or len({r['destination_port'] for r in records}) != 32:
        raise RuntimeError('Expected 32 observed ports not confirmed. Evidence retained; no success claimed.')
    report = {'schema': '1200km.lab.capture.v1', 'target': '127.0.0.1', 'ports': '18080-18111', 'started_epoch': start, 'ended_epoch': time.time(), 'command': command, 'nmap_version': subprocess.run([nmap, '--version'], capture_output=True, text=True, timeout=5).stdout.splitlines()[0], 'collector': 'Python socket accept listener', 'synthetic': False, 'observed_ports': len({r['destination_port'] for r in records}), 'scope': 'Open TCP port fan-out on loopback only. Not packet/Zeek capture, external perimeter validation, or full T1595 coverage.', 'files': {p.name: hashlib.sha256(p.read_bytes()).hexdigest() for p in out.iterdir() if p.is_file()}}
    (out / 'capture-manifest.json').write_text(json.dumps(report, indent=2) + '\n')
    print(json.dumps(report, indent=2))
finally:
    stop.set()
    if thread:
        thread.join(timeout=1)
    for listener in listeners:
        listener.close()
    selector.close()
