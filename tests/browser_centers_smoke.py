"""Teste real de navegacao da campanha Brasil v0.9: Node HTTP e Chromium isolado.
O harness injeta HTML/CSS/JS local e roteia fetch ao servidor real, pois o Chromium
restrito nao pode acessar 127.0.0.1 diretamente.
"""
from pathlib import Path
from playwright.sync_api import sync_playwright
import urllib.request, urllib.error, json, os, subprocess, time, base64
ROOT=Path(__file__).resolve().parent.parent
PORT=3293
BASE=f'http://127.0.0.1:{PORT}'
DATA=Path('/tmp/dominio-v09-browser-test.json')

def backend(path,method='GET',body=None):
    request=urllib.request.Request(BASE+path,data=body.encode() if body else None,method=method,headers={'content-type':'application/json'})
    try:
        with urllib.request.urlopen(request,timeout=5) as response:
            return {'status':response.status,'json':json.loads(response.read().decode())}
    except urllib.error.HTTPError as exc:
        return {'status':exc.code,'json':json.loads(exc.read().decode())}

def html_with_bridge():
    html=(ROOT/'public/index.html').read_text()
    css=(ROOT/'public/styles.css').read_text()
    for asset in ('soldier.webp','base-bunker.webp'):
        binary=base64.b64encode((ROOT/'public/assets'/asset).read_bytes()).decode()
        css=css.replace(f"'/assets/{asset}'",f"'data:image/webp;base64,{binary}'")
    html=html.replace('<link rel="stylesheet" href="/styles.css">','<style>'+css+'</style>')
    relief=base64.b64encode((ROOT/'public/assets/terrain-relief.webp').read_bytes()).decode()
    html=html.replace('/assets/terrain-relief.webp','data:image/webp;base64,'+relief)
    js=(ROOT/'public/app.js').read_text()
    bridge='''<script>
      const _store={};Object.defineProperty(window,'localStorage',{configurable:true,value:{getItem:k=>_store[k]||null,setItem:(k,v)=>_store[k]=String(v),removeItem:k=>delete _store[k]}});
      window.fetch=async (path,options={})=>{const r=await window.__backend(path,options.method||'GET',options.body||null);return new Response(JSON.stringify(r.json),{status:r.status,headers:{'Content-Type':'application/json'}})};
      window.EventSource=class {addEventListener(){} close(){}};
    </script>'''
    return html.replace('<script type="module" src="/app.js"></script>',bridge+'<script>'+js+'</script>')

def play(platform,viewport,faction,browser):
    context=browser.new_context(viewport=viewport,device_scale_factor=1,reduced_motion='reduce')
    page=context.new_page();page.set_default_timeout(9500)
    errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
    page.expose_function('__backend',backend)
    page.set_content(html_with_bridge(),wait_until='domcontentloaded')
    page.locator('#commanderName').fill('Jogador '+platform)
    page.locator('#stateSearch').fill(faction)
    page.locator('.faction-choice').first.click()
    page.locator('#joinButton').click()
    page.locator('#joinModal').wait_for(state='hidden',timeout=12000)
    assert page.locator('#worldMap .province').count()==27
    assert backend('/api/state')['json']['sectors'].__len__()==54
    page.evaluate("document.querySelector('#toast').classList.add('hidden')")
    if platform=='desktop':
        assert page.locator('#sectorMarkers .sector-marker').count()==54
        page.locator('#sectorMarkers [data-sector="mg-capital"]').click(force=True)
        assert page.locator('#dialogTitle').text_content().strip()=='Belo Horizonte'
        page.get_by_role('button',name='PLANEJAR OCUPAÇÃO').click()
        assert page.locator('#dialogTitle').text_content().strip()=='Ocupar centro estratégico'
        page.locator('#sectorUnits_infantry').fill('90')
        assert page.locator('#sectorOrigin').input_value()=='sp'
        assert page.get_by_role('button',name='CONFIRMAR ORDEM').is_enabled()
        page.screenshot(path='/mnt/data/Dominio_Global_Brasil_v0.9_Operacao_desktop.png')
        page.get_by_role('button',name='CONFIRMAR ORDEM').click()
        page.locator('#gameDialog').wait_for(state='hidden')
        token=page.evaluate('token')
        assert any(o['type']=='sector_assault' and o['sectorId']=='mg-capital' for o in backend('/api/state?token='+token)['json']['orders'])
        page.locator('#primaryNav [data-page="centers"]').click()
        page.wait_for_function("document.querySelector('#pageTitle').textContent==='Cidades estratégicas'")
        page.get_by_role('tab',name='Todos os centros').click()
        assert page.locator('.data-row').count()==54
        page.screenshot(path='/mnt/data/Dominio_Global_Brasil_v0.9_Cidades_desktop.png',full_page=True)
        page.locator('#primaryNav [data-page="map"]').click()
        page.screenshot(path='/mnt/data/Dominio_Global_Brasil_v0.9_Mapa_desktop.png',full_page=True)
    else:
        assert page.locator('#sectorMarkers .sector-marker').count()==0
        page.locator('#sectorToggle').click()
        assert page.locator('#sectorMarkers .sector-marker').count()==54
        page.locator('#moreButton').click()
        page.locator('#moreMenu [data-page="centers"]').click()
        page.wait_for_function("document.querySelector('#pageTitle').textContent==='Cidades estratégicas'")
        assert page.locator('.data-row').count()==54
        page.get_by_role('tab',name='Em disputa').click()
        page.screenshot(path='/mnt/data/Dominio_Global_Brasil_v0.9_Cidades_mobile.png',full_page=True)
        page.get_by_role('tab',name='Todos os centros').click()
        page.locator('.data-row').filter(has_text='Belo Horizonte').get_by_role('button',name='Abrir centro').click()
        assert page.locator('#dialogTitle').text_content().strip()=='Belo Horizonte'
        page.screenshot(path='/mnt/data/Dominio_Global_Brasil_v0.9_Centro_mobile.png',full_page=False)
        page.locator('#dialogClose').click()
        page.locator('.mobile-nav [data-page="map"]').click()
        page.screenshot(path='/mnt/data/Dominio_Global_Brasil_v0.9_Mapa_mobile.png',full_page=True)
        assert page.evaluate('document.body.scrollWidth <= window.innerWidth+1'),page.evaluate('document.body.scrollWidth')
    assert not errors,errors
    context.close()
    print(f'{platform.upper()}: interface de cidades, mapa e operacoes integrados ao servidor OK')

def run():
    DATA.unlink(missing_ok=True)
    env=os.environ.copy();env['DG_LEGACY_GUEST']='1';env.update(PORT=str(PORT),DATA_FILE=str(DATA),TICK_MS='300000')
    server=subprocess.Popen(['node','server.mjs'],cwd=ROOT,env=env,stdout=subprocess.DEVNULL,stderr=subprocess.PIPE)
    try:
        for i in range(30):
            try:
                if backend('/api/health')['status']==200:break
            except Exception:time.sleep(.15)
        else:raise RuntimeError('Servidor nao iniciou')
        with sync_playwright() as pw:
            browser=pw.chromium.launch(headless=True,executable_path='/usr/bin/chromium',args=['--no-sandbox'])
            try:
                play('desktop',{'width':1440,'height':900},'São Paulo',browser)
                play('mobile',{'width':390,'height':844},'Minas Gerais',browser)
            finally:browser.close()
    finally:
        server.terminate();server.wait(timeout=8)

if __name__=='__main__':run()
