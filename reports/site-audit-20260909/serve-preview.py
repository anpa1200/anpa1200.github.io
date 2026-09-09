"""Serve the validated main build and separate actor build on one local origin."""
import argparse
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.parse import urlsplit

parser = argparse.ArgumentParser()
parser.add_argument('--site', default='/tmp/1200km-audit-release-preview')
parser.add_argument('--actors', default='/home/andrey/git-projects/1200km-actor-audit/build')
parser.add_argument('--port', type=int, default=4183)
args = parser.parse_args()
site, actors = Path(args.site).resolve(), Path(args.actors).resolve()
assert (site / 'index.html').is_file() and (actors / 'index.html').is_file()
prefix = '/israel-government-threat-actors-cti'


class Handler(SimpleHTTPRequestHandler):
    def __init__(self, *values, **kwargs):
        super().__init__(*values, directory=str(site), **kwargs)

    def translate_path(self, request_path):
        route = urlsplit(request_path).path
        if route == prefix or route.startswith(prefix + '/'):
            previous = self.directory
            self.directory = str(actors)
            try:
                return super().translate_path(request_path[len(prefix):] or '/')
            finally:
                self.directory = previous
        return super().translate_path(request_path)


print(f'Local review: http://127.0.0.1:{args.port}/', flush=True)
ThreadingHTTPServer(('127.0.0.1', args.port), Handler).serve_forever()
