from http.server import BaseHTTPRequestHandler, HTTPServer
import json

class MyHandler(BaseHTTPRequestHandler):
    def _set_cors_headers(self):
        # Add CORS headers to allow cross-origin requests
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')

    def do_OPTIONS(self):
        # Handle preflight (OPTIONS) requests
        self.send_response(204)
        self._set_cors_headers()
        self.end_headers()

    def do_GET(self):
        if self.path == '/':
            self.send_response(200)
            self.send_header('Content-type', 'text/html')
            self._set_cors_headers()
            self.end_headers()
            self.wfile.write(b"<h1>This is the json-server that receives orders on port 9000</h1>")
        elif self.path == '/my-endpoint':
            self.send_response(200)
            self.send_header('Content-type', 'application/json')
            self._set_cors_headers()
            self.end_headers()
            response = {"message": "This is a GET response from /my-endpoint"}
            self.wfile.write(json.dumps(response).encode())

    def do_POST(self):
        if self.path == '/write_order':
            content_length = int(self.headers['Content-Length'])
            post_data = self.rfile.read(content_length)
            data = json.loads(post_data)  # Parse the JSON data from the request body

            # Overwrite the JSON file with the new data
            with open('last_order.json', 'w') as f:
                json.dump(data, f, indent=4)

            # Append the data to the text file
            with open('order_written_protocol.txt', 'a') as f:
                f.write(json.dumps(data) + "\n")

            # Respond to the client
            self.send_response(201)
            self.send_header('Content-type', 'application/json')
            self._set_cors_headers()
            self.end_headers()
            response = {"status": "Data saved successfully", "received": data}
            self.wfile.write(json.dumps(response).encode())

def run(server_class=HTTPServer, handler_class=MyHandler, port=9000):
    server_address = ('', port)
    httpd = server_class(server_address, handler_class)
    print(f"Starting http server on port {port}")
    httpd.serve_forever()

if __name__ == '__main__':
    run()
