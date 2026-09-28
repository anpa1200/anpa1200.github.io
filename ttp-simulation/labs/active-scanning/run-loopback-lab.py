#!/usr/bin/env python3
"""Bounded local collection lab: 127.0.0.1 TCP ports 18080-18111 only.

Requires nmap, dumpcap (capture privileges) and Zeek. No elevated execution, package
installation, downloaded payloads, DNS, scripts or external targets. Writes only to
a newly created output directory. Captures only traffic to the reserved lab range.
"""
import argparse
import hashlib
import json
from pathlib import Path
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
    raise SystemExit('Choose a new output directory; existing evidence is never overwritten.')
bins = {name: shutil.which(name) for name in ['nmap', 'dumpcap', 'zeek']}
if not all(bins.values()):
    raise SystemExit('Install and review Nmap, dumpcap and Zeek separately before this lab.')
listener = socket.socket()
listener.bind(('127.0.0.1', 18080))
listener.listen()
listener.settimeout(.2)
stop = threading.Event()
def accept_connections():
    while not stop.is_set():
        try:
            client, _ = listener.accept()
            client.close()
        except socket.timeout:
            continue
        except OSError:
            break
thread = threading.Thread(target=accept_connections, daemon=True)
thread.start()
out.mkdir(parents=True)
capture = None
try:
    command = [bins['nmap'], '-sT', '-Pn', '-n', '-p', '18080-18111', '--scan-delay', '100ms', '--max-retries', '0', '--host-timeout', '10s', '127.0.0.1']
    capture = subprocess.Popen([bins['dumpcap'], '-q', '-i', 'lo', '-f', 'tcp and host 127.0.0.1 and portrange 18080-18111', '-a', 'duration:9', '-w', str(out / 'scan.pcapng')], stdout=subprocess.PIPE, stderr=subprocess.PIPE)
    time.sleep(1)
    if capture.poll() is not None:
        raise RuntimeError('Capture failed: ' + capture.communicate()[1].decode())
    start = time.time()
    result = subprocess.run(command, capture_output=True, text=True, timeout=15)
    end = time.time()
    (out / 'nmap.txt').write_text(result.stdout + result.stderr)
    capture_out, capture_err = capture.communicate(timeout=12)
    (out / 'capture.txt').write_bytes(capture_out + capture_err)
    if result.returncode or capture.returncode:
        raise RuntimeError('Scan or capture failed; evidence retained, no success is claimed.')
    zeek = subprocess.run([bins['zeek'], '-C', '-r', str(out / 'scan.pcapng'), 'LogAscii::use_json=T'], cwd=out, capture_output=True, text=True, timeout=30)
    (out / 'zeek.txt').write_text(zeek.stdout + zeek.stderr)
    if zeek.returncode or not (out / 'conn.log').exists():
        raise RuntimeError('Zeek did not produce conn.log; no detection result is claimed.')
    versions = {name: subprocess.run([path, '--version' if name != 'dumpcap' else '-v'], capture_output=True, text=True, timeout=5).stdout.splitlines()[0] for name, path in bins.items()}
    report = {'scope': 'Local loopback TCP-connect scan; not an external perimeter reconstruction or production validation.', 'target': '127.0.0.1', 'ports': '18080-18111', 'command': command, 'started_epoch': start, 'ended_epoch': end, 'versions': versions, 'artifacts': {p.name: hashlib.sha256(p.read_bytes()).hexdigest() for p in out.iterdir() if p.is_file()}}
    (out / 'capture-manifest.json').write_text(json.dumps(report, indent=2) + '\n')
    print(json.dumps(report, indent=2))
finally:
    if capture and capture.poll() is None:
        capture.terminate()
        capture.communicate(timeout=5)
    stop.set()
    listener.close()
    thread.join(timeout=1)
