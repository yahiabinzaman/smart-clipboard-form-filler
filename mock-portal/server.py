#!/usr/bin/env python3
"""
Simple localhost Python Web Server to serve the mock BOESL application form
"""

import os
import sys
import http.server
import socketserver

PORT = 8000

def main():
    # Get current directory of the script and set it as working directory
    script_dir = os.path.dirname(os.path.abspath(__file__))
    if script_dir:
        os.chdir(script_dir)
    
    Handler = http.server.SimpleHTTPRequestHandler

    print(f"\n========================================================")
    print(f" 🌟 BOESL Mock Registration Portal Server Starting 🌟")
    print(f" Localhost URL: http://localhost:{PORT}/step1.html")
    print(f"========================================================")
    print(f"Press Ctrl+C in this terminal to stop the web server.\n")

    # Allow port reuse immediately
    socketserver.TCPServer.allow_reuse_address = True
    
    with socketserver.TCPServer(("", PORT), Handler) as httpd:
        try:
            httpd.serve_forever()
        except KeyboardInterrupt:
            print("\nShutting down web server...")
            sys.exit(0)

if __name__ == "__main__":
    main()
