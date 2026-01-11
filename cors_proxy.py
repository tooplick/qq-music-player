"""
Simple CORS Proxy Server for QQ Music API
Forwards requests to QQ Music API and adds CORS headers
Includes Lyric Decryption using QQMusicApi
"""

from http.server import HTTPServer, BaseHTTPRequestHandler
import urllib.request
import urllib.parse
import json
import sys
import os

# Local tripledes import
try:
    from tripledes import tripledes_key_setup, tripledes_crypt, DECRYPT
    import zlib
    
    def qrc_decrypt(encrypted_qrc: str | bytearray | bytes) -> str:
        """QRC 解码 - 本地实现"""
        if not encrypted_qrc:
            return ""

        # 将输入转为 bytearray 格式
        if isinstance(encrypted_qrc, str):
            encrypted_qrc = bytearray.fromhex(encrypted_qrc)
        elif isinstance(encrypted_qrc, bytearray | bytes):
            encrypted_qrc = bytearray(encrypted_qrc)
        else:
            raise ValueError("无效的加密数据类型")

        try:
            data = bytearray()
            # Key from common.py
            schedule = tripledes_key_setup(b"!@#)(*$%123ZXC!@!@#)(NHL", DECRYPT)

            # 分块解密数据
            # 以 8 字节为单位迭代 encrypted_qrc
            for i in range(0, len(encrypted_qrc), 8):
                data += tripledes_crypt(encrypted_qrc[i : i + 8], schedule)

            return zlib.decompress(data).decode("utf-8")

        except Exception as e:
            # print(f"解密失败: {e}")
            raise ValueError(f"解密失败: {e}")

    print("✅ Local qrc_decrypt loaded successfully")

except ImportError as e:
    print(f"⚠️ Warning: Could not import tripledes: {e}")
    qrc_decrypt = None

class CORSProxyHandler(BaseHTTPRequestHandler):
    def do_OPTIONS(self):
        self.send_response(200)
        self.send_cors_headers()
        self.end_headers()

    def do_POST(self):
        # Special handling for lyric proxy
        if self.path.startswith('/lyric_proxy'):
            self.handle_lyric_decrypt()
            return

        # Regular proxy logic
        self.handle_proxy()

    def handle_proxy(self):
        try:
            # Read request body
            content_length = int(self.headers.get('Content-Length', 0))
            body = self.rfile.read(content_length)
            
            # Parse query string for sign parameter
            sign_param = ''
            if '?' in self.path:
                query = self.path.split('?', 1)[1]
                sign_param = '?' + query
            
            # Forward to QQ Music API
            target_url = f'https://u.y.qq.com/cgi-bin/musics.fcg{sign_param}'
            
            # Build headers
            headers = {
                'Content-Type': 'application/json',
                'Referer': 'https://y.qq.com/',
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                'Origin': 'https://y.qq.com'
            }
            
            # Handle Cookies
            proxy_cookie = self.headers.get('X-Proxy-Cookie')
            if proxy_cookie:
                headers['Cookie'] = proxy_cookie
                
            req = urllib.request.Request(
                target_url,
                data=body,
                headers=headers,
                method='POST'
            )
            
            with urllib.request.urlopen(req) as response:
                response_body = response.read()
                
                self.send_response(200)
                self.send_cors_headers()
                self.send_header('Content-Type', 'application/json')
                self.end_headers()
                self.wfile.write(response_body)
                
        except Exception as e:
            print(f'✗ Proxy error: {e}')
            self.send_error_response(str(e))

    def handle_lyric_decrypt(self):
        try:
            # 1. Read request
            content_length = int(self.headers.get('Content-Length', 0))
            body = self.rfile.read(content_length)
            
            # 2. Forward to QQ (keep params as is, we want encrypted data to decrypt)
            target_url = "https://u.y.qq.com/cgi-bin/musics.fcg"
            
            # Check for sign param if calling with signature
            if '?' in self.path:
                query = self.path.split('?', 1)[1]
                target_url += '?' + query

            headers = {
                'Content-Type': 'application/json',
                'Referer': 'https://y.qq.com/',
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                'Origin': 'https://y.qq.com'
            }
            
            proxy_cookie = self.headers.get('X-Proxy-Cookie')
            if proxy_cookie:
                headers['Cookie'] = proxy_cookie
            
            req = urllib.request.Request(
                target_url,
                data=body,
                headers=headers,
                method='POST'
            )
            
            with urllib.request.urlopen(req) as response:
                resp_data = response.read()
                
                # 3. Decrypt logic
                try:
                    resp_json = json.loads(resp_data)
                    # Debug: print keys to find the correct one
                    # print(f"DEBUG keys: {list(resp_json.keys())}")
                    
                    key = 'music.musichallSong.PlayLyricInfo.GetPlayLyricInfo'
                    data_obj = resp_json.get(key, {}).get('data', {})
                    
                    if not data_obj:
                        print(f"⚠️ Warning: Lyric data not found at key: {key}")
                        # Fallback: check other keys?
                        # for k in resp_json.keys():
                        #     if 'PlayLyricInfo' in k:
                        #         data_obj = resp_json[k].get('data', {})
                        #         break
                    
                    if qrc_decrypt:
                        if data_obj.get('lyric'):
                            original_len = len(data_obj['lyric'])
                            data_obj['lyric'] = qrc_decrypt(data_obj['lyric'])
                            print(f"🔓 Lyrics decrypted (len {original_len} -> {len(data_obj['lyric'])})")
                        if data_obj.get('trans'):
                            data_obj['trans'] = qrc_decrypt(data_obj['trans'])
                        if data_obj.get('roma'):
                            data_obj['roma'] = qrc_decrypt(data_obj['roma'])
                    else:
                        print("⚠️ qrc_decrypt missing, returning raw")
                        
                    final_output = json.dumps(resp_json).encode('utf-8')
                    
                except Exception as e:
                    print(f"⚠️ Decryption/Parsing failed: {e}")
                    import traceback
                    traceback.print_exc()
                    final_output = resp_data

                self.send_response(200)
                self.send_cors_headers()
                self.send_header('Content-Type', 'application/json')
                self.end_headers()
                self.wfile.write(final_output)

        except Exception as e:
            print(f'✗ Lyric Proxy error: {e}')
            self.send_error_response(str(e))

    def send_error_response(self, error_msg):
        self.send_response(500)
        self.send_cors_headers()
        self.send_header('Content-Type', 'application/json')
        self.end_headers()
        self.wfile.write(json.dumps({'error': error_msg}).encode())

    def send_cors_headers(self):
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type, X-Proxy-Cookie, x-proxy-cookie')
    
    def log_message(self, format, *args):
        pass

if __name__ == '__main__':
    PORT = 8081
    server = HTTPServer(('localhost', PORT), CORSProxyHandler)
    print(f'🚀 CORS Proxy Server running on http://localhost:{PORT}')
    print(f'   - Lyric Proxy: /lyric_proxy enabled')
    print(f'📡 Forwarding requests to QQ Music API')
    
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print('\n✋ Server stopped')
        server.shutdown()
