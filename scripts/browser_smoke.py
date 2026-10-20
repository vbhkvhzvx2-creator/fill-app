"""Browser smoke tests + reproducible visual baselines; requires Python Playwright and Chromium."""
from pathlib import Path
import os
import shutil
from PIL import Image, ImageChops
from playwright.sync_api import sync_playwright, expect

ROOT = Path(__file__).resolve().parents[1]
BASELINE = ROOT / 'screenshots' / 'baseline'
CURRENT = ROOT / 'screenshots' / 'current'
BASE_URL = os.environ.get('PWA_BASE_URL', 'http://127.0.0.1:4173')
UPDATE = os.environ.get('UPDATE_VISUAL_BASELINE') == '1'
BASELINE.mkdir(parents=True, exist_ok=True)
CURRENT.mkdir(parents=True, exist_ok=True)
console_errors = []
page_errors = []


def snapshot(page, name):
    path = CURRENT / f'{name}.png'
    page.screenshot(path=str(path), full_page=True, animations='disabled')
    expected = BASELINE / f'{name}.png'
    if UPDATE:
        shutil.copy2(path, expected)
        print(f'BASELINE creato/aggiornato esplicitamente: {name}')
        return
    if not expected.exists():
        raise AssertionError(f'Baseline visiva mancante: {expected}. Dopo revisione manuale iniziale, eseguire con UPDATE_VISUAL_BASELINE=1.')
    actual_img = Image.open(path).convert('RGBA')
    expected_img = Image.open(expected).convert('RGBA')
    if actual_img.size != expected_img.size:
        raise AssertionError(f'{name}: dimensioni screenshot diverse: {actual_img.size} vs {expected_img.size}')
    diff = ImageChops.difference(actual_img, expected_img)
    hist = diff.convert('L').histogram()
    changed = sum(hist[8:]) / (actual_img.width * actual_img.height)
    if changed > 0.015:
        diff_path = CURRENT / f'{name}-diff.png'
        diff.save(diff_path)
        raise AssertionError(f'{name}: regressione visiva {changed:.2%} > 1.50%; differenza in {diff_path}')
    print(f'VISUAL OK: {name} (pixel modificati {changed:.2%})')


with sync_playwright() as p:
    launch_options = {'headless': True, 'args': ['--no-sandbox', '--disable-dev-shm-usage']}
    chromium_path = os.environ.get('CHROMIUM_PATH') or shutil.which('chromium') or shutil.which('chromium-browser')
    if chromium_path:
        launch_options['executable_path'] = chromium_path
    browser = p.chromium.launch(**launch_options)
    context = browser.new_context(viewport={'width': 390, 'height': 844}, device_scale_factor=1, is_mobile=True, has_touch=True)
    page = context.new_page()
    page.on('console', lambda msg: console_errors.append(msg.text) if msg.type == 'error' else None)
    page.on('pageerror', lambda error: page_errors.append(str(error)))

    # L'autenticazione viene simulata nello smoke test locale: i test unitari coprono
    # i payload/errori Supabase, mentre qui si verifica il rendering post-login.
    def mock_password_login(route):
        if route.request.method == 'POST' and 'grant_type=password' in route.request.url:
            route.fulfill(status=200, content_type='application/json', body='''{"access_token":"browser-test-access","refresh_token":"browser-test-refresh","token_type":"bearer","expires_in":3600,"expires_at":4102444800,"user":{"id":"browser-test-user","email":"demo@example.it"}}''')
        else:
            route.continue_()
    page.route('https://ykumlaitukrxwkyetlzg.supabase.co/auth/v1/**', mock_password_login)
    page.goto(BASE_URL, wait_until='networkidle')
    page.evaluate("localStorage.clear()")
    page.reload(wait_until='networkidle')
    expect(page.get_by_role('heading', name='Il Tuo Lavoro')).to_be_visible()
    snapshot(page, '01-login')

    page.get_by_label('Email').fill('demo@example.it')
    page.get_by_label('Password').fill('demo-password')
    page.get_by_role('button', name='Accedi').click()
    expect(page.get_by_text('Scadenze importanti')).to_be_visible(timeout=5000)
    snapshot(page, '03-dashboard')

    page.get_by_role('button', name='Lavori Oggi').click()
    expect(page.get_by_role('heading', name='Lavori di oggi')).to_be_visible()
    snapshot(page, '04-oggi')
    page.get_by_role('button', name='Aggiungi').click()
    expect(page.get_by_role('heading', name='Nuovo intervento')).to_be_visible()
    snapshot(page, '08-nuovo-intervento')
    page.get_by_role('button', name='Chiudi').click()

    page.get_by_role('button', name='Indietro').click()
    page.get_by_role('button', name='Calendario').click()
    expect(page.get_by_role('heading', name='Calendario')).to_be_visible()
    snapshot(page, '05-calendario')
    page.get_by_role('button', name='Indietro').click()

    page.get_by_role('button', name='Clienti').click()
    expect(page.get_by_role('heading', name='Clienti')).to_be_visible()
    snapshot(page, '06-clienti')
    page.get_by_label('Cerca cliente').fill('Bianchi')
    expect(page.get_by_text('Bianchi S.r.l.')).to_be_visible()
    expect(page.get_by_text('Rossi Mario')).to_have_count(0)
    page.get_by_label('Cerca cliente').fill('')
    page.get_by_role('button', name='Aggiungi').click()
    expect(page.get_by_role('heading', name='Nuovo cliente')).to_be_visible()
    page.get_by_label('Nome e cognome / Azienda *').fill('Cliente Browser Test')
    page.get_by_label('Indirizzo *').fill('Via Test 1, Brescia')
    page.get_by_role('button', name='Salva cliente').click()
    expect(page.get_by_text('Cliente Browser Test')).to_be_visible()
    page.get_by_role('button', name='Indietro').click()

    page.get_by_role('button', name='Scadenze').click()
    expect(page.get_by_role('heading', name='Scadenze')).to_be_visible()
    snapshot(page, '07-scadenze')
    page.get_by_role('button', name='Indietro').click()

    page.get_by_role('button', name='Impostazioni').click()
    expect(page.get_by_role('heading', name='Impostazioni')).to_be_visible()
    snapshot(page, '09-impostazioni')
    before = page.get_by_role('switch', name='Biometria').get_attribute('aria-checked')
    page.get_by_role('switch', name='Biometria').click()
    after = page.get_by_role('switch', name='Biometria').get_attribute('aria-checked')
    assert before != after, 'Il toggle biometria non cambia stato'
    page.reload(wait_until='networkidle')
    # Il token salvato deve ripristinare direttamente la dashboard, senza re-login.
    expect(page.get_by_text('Scadenze importanti')).to_be_visible(timeout=3000)
    page.get_by_role('button', name='Impostazioni').click()
    expect(page.get_by_role('heading', name='Impostazioni')).to_be_visible()
    assert page.get_by_role('switch', name='Biometria').get_attribute('aria-checked') == after, 'L impostazione non persiste dopo reload'
    page.get_by_role('button', name='Indietro').click()

    page.get_by_role('button', name='Cantieri').click()
    expect(page.get_by_role('heading', name='Cantiere')).to_be_visible()
    snapshot(page, '10-cantiere')
    page.get_by_role('button', name='Documenti').click()
    expect(page.get_by_text('Preventivo.pdf')).to_be_visible()
    page.get_by_role('button', name='Dettagli').click()
    page.get_by_role('button', name='Indietro').click()
    page.get_by_role('button', name='Lavori Oggi').click()
    page.get_by_role('button', name='Aggiungi').click()
    page.get_by_label('Seleziona cliente').fill('Rossi')
    page.get_by_role('button', name='Rossi Mario').click()
    page.get_by_label('Descrizione').fill('Test creazione intervento')
    page.get_by_role('button', name='Salva', exact=True).click()
    expect(page.get_by_text('Test creazione intervento')).to_be_visible()
    page.reload(wait_until='networkidle')
    saved_job = page.evaluate("JSON.parse(localStorage.getItem('il-tuo-lavoro.data.v1')).jobs.some(job => job.title === 'Test creazione intervento')")
    assert saved_job, 'Il nuovo intervento non è stato persistito nel browser'

    # Controllo geometrico a viewport mobile: niente scroll orizzontale significativo.
    overflow = page.evaluate('document.documentElement.scrollWidth - document.documentElement.clientWidth')
    assert overflow <= 1, f'Overflow orizzontale rilevato: {overflow}px'
    assert not page_errors, 'Errori JavaScript browser: ' + '; '.join(page_errors)
    assert not console_errors, 'Errori console browser: ' + '; '.join(console_errors)
    print('BROWSER SMOKE OK: navigazione, ricerca, creazione cliente, toggle persistente, documenti e viewport mobile.')
    browser.close()
