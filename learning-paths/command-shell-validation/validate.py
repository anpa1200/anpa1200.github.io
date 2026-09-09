#!/usr/bin/env python3
"""Read synthetic JSON events; never execute their command lines or send data."""
import json
import ntpath
import sys
from pathlib import Path

def candidate(event):
    if str(event.get('EventID')) != '4688':
        return False
    parent = ntpath.basename(str(event.get('ParentProcessName', ''))).casefold()
    image = ntpath.basename(str(event.get('NewProcessName', ''))).casefold()
    return parent == 'winword.exe' and image == 'cmd.exe'

def main():
    path = Path(sys.argv[1]) if len(sys.argv) > 1 else Path(__file__).with_name('events.json')
    events = json.loads(path.read_text(encoding='utf-8'))
    found = [e['id'] for e in events if candidate(e)]
    print(json.dumps({'candidate_ids': found, 'events_read': len(events)}))
    return found

if __name__ == '__main__':
    main()
