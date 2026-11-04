"""Valida camada leve de 8 municípios de MS sem preencher o mapa do Brasil."""
import json
from pathlib import Path
from playwright.sync_api import sync_playwright
from browser_centers_smoke import ROOT, backend, html_with_bridge, DATA, PORT, BASE
import os, subprocess, time

cities=json.loads((ROOT/'public/data/municipios-ms.json').read_text())
assert len(cities)==8, 'O mapa deve expor somente os 8 municípios-chave.'
assert (ROOT/'public/data/municipios-ms.json').stat().st_size<3000

DATA.unlink(missing_ok=True)
env=os.environ.copy();env['DG_LEGACY_GUEST']='1';env.update(PORT=str(PORT),DATA_FILE=str(DATA),TICK_MS='300000')
server=subprocess.Popen(['node','server.mjs'],cwd=ROOT,env=env,stdout=subprocess.DEVNULL,stderr=subprocess.PIPE)
try:
    for _ in range(35):
        try:
            if backend('/api/health')['status']==200:break
        except Exception:time.sleep(.1)
    else:raise RuntimeError('Servidor não iniciou')
    with sync_playwright() as pw:
        browser=pw.chromium.launch(headless=True,executable_path='/usr/bin/chromium',args=['--no-sandbox'])
        try:
            for size,name in [({'width':1440,'height':900},'desktop'),({'width':390,'height':844},'mobile')]:
                context=browser.new_context(viewport=size)
                page=context.new_page();page.set_default_timeout(9000)
                failures=[]
                page.on('pageerror',lambda exc: failures.append(str(exc)))
                page.expose_function('__backend',backend)
                page.set_content(html_with_bridge(),wait_until='domcontentloaded')
                page.locator('#commanderName').fill('Teste '+name)
                page.locator('#stateSearch').fill('Mato Grosso do Sul' if name=='desktop' else 'São Paulo')
                page.locator('.faction-choice').first.click()
                page.locator('#joinButton').click()
                page.locator('#joinModal').wait_for(state='hidden')
                if name=='mobile':
                    page.locator('#quickState').select_option('ms')
                    page.locator('#dialogClose').click()
                assert page.locator('#municipalityMarkers [data-municipality]').count()==0
                assert page.locator('#provincePaths .province').count()==27
                page.locator('#zoomIn').click()
                assert page.locator('#municipalityMarkers [data-municipality]').count()==0
                page.locator('#zoomIn').click()
                page.wait_for_function("document.querySelectorAll('#municipalityMarkers [data-municipality]').length===8")
                assert page.locator('#municipalityOutlines .strategic-municipality-outline').count()==8
                page.locator('#zoomIn').click()
                assert page.locator('#municipalityMarkers .strategic-municipality-label').count()==0
                page.evaluate("document.querySelector('#toast').classList.add('hidden')")
                page.screenshot(path=f'/mnt/data/Dominio_Global_Brasil_v0.10_MS_8_Municipios_{name}.png')
                page.locator('#municipalityMarkers [data-municipality="5008305"] circle').click()
                assert page.locator('#dialogTitle').text_content()=='Três Lagoas'
                assert 'não são territórios conquistáveis' in page.locator('#dialogBody').inner_text()
                page.locator('#dialogClose').click()
                page.locator('#quickState').select_option('sp')
                assert page.locator('#municipalityMarkers [data-municipality]').count()==0
                page.locator('#dialogClose').click()
                assert not failures, failures
                print(name+': 27 estados, camada leve de MS por zoom, janela e ocultação OK')
                context.close()
        finally:browser.close()
finally:
    server.terminate();server.wait(timeout=8)
