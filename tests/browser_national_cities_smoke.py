"""Teste real da v0.11 em Chromium com HTTP Node e ponte local isolada."""
from pathlib import Path
from playwright.sync_api import sync_playwright
import urllib.request, urllib.error, json, os, subprocess, time, base64
ROOT=Path(__file__).resolve().parent.parent
PORT=3381; BASE=f'http://127.0.0.1:{PORT}';DATA=Path('/tmp/dg-v011-browsertest.json')
OUTPUT=Path('/mnt/data')

def backend(path,method='GET',body=None):
    req=urllib.request.Request(BASE+path,data=body.encode() if body else None,method=method,headers={'content-type':'application/json'})
    try:
        with urllib.request.urlopen(req,timeout=5) as r:return {'status':r.status,'json':json.loads(r.read())}
    except urllib.error.HTTPError as exc:return {'status':exc.code,'json':json.loads(exc.read())}

def html_bridge():
    html=(ROOT/'public/index.html').read_text();css=(ROOT/'public/styles.css').read_text()
    for name in ['soldier.webp','base-bunker.webp']:
        b=base64.b64encode((ROOT/'public/assets'/name).read_bytes()).decode()
        css=css.replace(f"'/assets/{name}'",f"'data:image/webp;base64,{b}'")
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

def inspect(browser,device):
    mobile=device=='mobile'; viewport={'width':390,'height':844} if mobile else {'width':1440,'height':900}
    context=browser.new_context(viewport=viewport,device_scale_factor=1,reduced_motion='reduce')
    page=context.new_page();page.set_default_timeout(12000)
    errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
    page.expose_function('__backend',backend);page.set_content(html_bridge(),wait_until='domcontentloaded')
    page.locator('#commanderName').fill('General '+device)
    page.locator('#stateSearch').fill('São Paulo' if mobile else 'Mato Grosso do Sul')
    page.locator('.faction-choice').first.click();page.locator('#joinButton').click()
    page.locator('#joinModal').wait_for(state='hidden')
    assert len(backend('/api/state')['json']['sectors'])==171
    assert page.locator('#worldMap .province').count()==27
    assert page.locator('.strategic-city').count()==0, 'Mapa nacional não pode exibir cidades no zoom 1'
    page.locator('#zoomIn').click()
    expected=10 if mobile else 8
    page.wait_for_function(f"document.querySelectorAll('.strategic-city').length === {expected}")
    assert page.locator('.strategic-route').count()>=expected-1
    page.screenshot(path=str(OUTPUT/f'DG_v011_Mapa_{device}.png'))
    target='sp-hub' if mobile else 'ms-tres-lagoas'
    node=page.locator(f'.strategic-city[data-sector="{target}"]')
    assert node.count()==1,'Cidade do cadastro não encontrada: '+target
    node.click(force=True)
    assert page.locator('#dialogTitle').text_content().strip()==('Campinas' if mobile else 'Três Lagoas')
    assert 'Economia local' in page.locator('#dialogBody').text_content()
    page.screenshot(path=str(OUTPUT/f'DG_v011_Cidade_{device}.png'))
    page.locator('#dialogClose').click()
    page.locator('#zoomOut').click();assert page.locator('.strategic-city').count()==0
    if mobile:
        page.locator('#moreButton').click();page.locator('#moreMenu [data-page="centers"]').click()
    else:page.locator('#primaryNav [data-page="centers"]').click()
    page.wait_for_function("document.querySelector('#pageTitle').textContent==='Cidades estratégicas'")
    assert page.locator('#cityStateFilter').input_value()==('sp' if mobile else 'ms')
    assert page.locator('.data-row').count()==expected
    page.screenshot(path=str(OUTPUT/f'DG_v011_Catalogo_{device}.png'),full_page=False)
    page.locator('#cityStateFilter').select_option('all')
    assert page.locator('.data-row').count()==171
    page.locator('#cityStateFilter').select_option('mg')
    assert page.locator('.data-row').count()==9
    if mobile:assert page.evaluate('document.body.scrollWidth <= window.innerWidth+1'),page.evaluate('document.body.scrollWidth')
    assert not errors,errors
    context.close();print(device, 'OK — cidades, rotas, filtros e janelas')

def run():
    DATA.unlink(missing_ok=True)
    env=os.environ.copy();env['DG_LEGACY_GUEST']='1';env.update(PORT=str(PORT),DATA_FILE=str(DATA),TICK_MS='300000')
    server=subprocess.Popen(['node','server.mjs'],cwd=ROOT,env=env,stdout=subprocess.DEVNULL,stderr=subprocess.PIPE)
    try:
        for i in range(40):
            try:
                if backend('/api/health')['status']==200:break
            except Exception:time.sleep(.15)
        else:raise RuntimeError('Servidor não iniciou')
        with sync_playwright() as pw:
            browser=pw.chromium.launch(headless=True,executable_path='/usr/bin/chromium',args=['--no-sandbox'])
            try:
                inspect(browser,'desktop');inspect(browser,'mobile')
            finally:browser.close()
    finally:
        server.terminate();server.wait(timeout=8)
if __name__=='__main__':run()
