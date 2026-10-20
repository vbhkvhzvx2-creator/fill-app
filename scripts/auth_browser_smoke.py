"""Browser integration test for Supabase login/session restoration (Auth responses are mocked)."""
import json
import os
import subprocess
import shutil
import time
import urllib.request
from pathlib import Path
from playwright.sync_api import sync_playwright, expect

ROOT = Path(__file__).resolve().parents[1]
PORT = int(os.environ.get('PWA_TEST_PORT', '4176'))
BASE_URL = f'http://127.0.0.1:{PORT}/'


def main():
    env = {**os.environ, 'PORT': str(PORT)}
    server = subprocess.Popen(['node', 'scripts/server.mjs'], cwd=ROOT, env=env, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True)
    try:
        ready = False
        for _ in range(100):
            if server.poll() is not None:
                raise RuntimeError('Il server di test è terminato prima dell’avvio.')
            try:
                with urllib.request.urlopen(BASE_URL, timeout=1) as response:
                    ready = response.status == 200
                    break
            except Exception:
                time.sleep(0.1)
        if not ready:
            raise RuntimeError('Il server di test non è disponibile.')

        with sync_playwright() as p:
            launch_options = {'headless': True, 'args': ['--no-sandbox', '--disable-dev-shm-usage']}
            chromium_path = os.environ.get('CHROMIUM_PATH') or shutil.which('chromium') or shutil.which('chromium-browser')
            if chromium_path:
                launch_options['executable_path'] = chromium_path
            browser = p.chromium.launch(**launch_options)
            page = browser.new_page(viewport={'width': 390, 'height': 844})
            page_errors = []
            console_errors = []
            page.on('pageerror', lambda error: page_errors.append(str(error)))
            page.on('console', lambda msg: console_errors.append(msg.text) if msg.type == 'error' else None)

            def auth_mock(route):
                url = route.request.url
                if route.request.method == 'OPTIONS':
                    route.fulfill(status=204, headers={
                        'access-control-allow-origin': route.request.headers.get('origin', '*'),
                        'access-control-allow-methods': 'POST, OPTIONS',
                        'access-control-allow-headers': 'apikey, authorization, content-type',
                    })
                elif route.request.method == 'POST' and 'grant_type=password' in url:
                    request_data = json.loads(route.request.post_data or '{}')
                    if request_data.get('password') == 'correct-password':
                        route.fulfill(status=200, content_type='application/json', body=json.dumps({
                            'access_token': 'browser-test-access',
                            'refresh_token': 'browser-test-refresh',
                            'token_type': 'bearer', 'expires_in': 3600, 'expires_at': 4102444800,
                            'user': {'id': 'browser-test-user', 'email': request_data.get('email')},
                        }))
                    else:
                        route.fulfill(status=400, content_type='application/json', body=json.dumps({'msg': 'Invalid login credentials'}))
                elif '/logout' in url:
                    route.fulfill(status=200, content_type='application/json', body='{}')
                else:
                    route.continue_()

            page.route('https://ykumlaitukrxwkyetlzg.supabase.co/auth/v1/**', auth_mock)
            page.goto(BASE_URL, wait_until='networkidle')
            page.evaluate('localStorage.clear()')
            page.reload(wait_until='networkidle')
            expect(page.get_by_label('Email')).to_be_visible()

            page.get_by_label('Email').fill('artigiano@example.it')
            page.get_by_label('Password').fill('correct-password')
            page.get_by_role('button', name='Accedi').click()
            expect(page.get_by_text('Scadenze importanti')).to_be_visible(timeout=5000)
            session = page.evaluate("JSON.parse(localStorage.getItem('il-tuo-lavoro.supabase-session.v1'))")
            assert session['user']['email'] == 'artigiano@example.it', 'La sessione Supabase non è stata salvata.'

            page.reload(wait_until='networkidle')
            expect(page.get_by_text('Scadenze importanti')).to_be_visible(timeout=3000)

            page.get_by_role('button', name='Impostazioni').click()
            page.get_by_role('button', name='Esci dall’account').click()
            expect(page.get_by_label('Email')).to_be_visible(timeout=3000)

            page.get_by_label('Email').fill('artigiano@example.it')
            page.get_by_label('Password').fill('wrong-password')
            page.get_by_role('button', name='Accedi').click()
            expect(page.get_by_role('alert')).to_contain_text('Email o password non corretti', timeout=3000)
            assert not page.get_by_text('Scadenze importanti').is_visible(), 'La dashboard non deve aprirsi con credenziali errate.'
            assert not page_errors, 'Errori JavaScript: ' + '; '.join(page_errors)
            assert not console_errors, 'Errori console: ' + '; '.join(console_errors)
            print('AUTH BROWSER SMOKE OK: login, sessione persistente, logout, errore credenziali e rendering senza errori.')
            browser.close()
    finally:
        server.terminate()
        try:
            server.wait(timeout=3)
        except subprocess.TimeoutExpired:
            server.kill()
            server.wait(timeout=3)


if __name__ == '__main__':
    main()
