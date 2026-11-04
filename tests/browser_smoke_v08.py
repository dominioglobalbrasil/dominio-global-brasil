"""Standalone browser smoke test (requires Python Playwright and Chromium).

The restricted browser cannot navigate to localhost. This harness injects the real HTML,
CSS and JS into the Chromium document, bridging fetch() to a real local Node server.
"""
from pathlib import Path
from playwright.sync_api import sync_playwright
import urllib.request, urllib.error, json, os, subprocess, time, base64

ROOT=Path(__file__).resolve().parent.parent
PORT=3268
BASE=f'http://127.0.0.1:{PORT}'
html=(ROOT/'public/index.html').read_text()
css=(ROOT/'public/styles.css').read_text()
# Inline locally owned decorative assets for the restricted browser harness.
for asset in ('soldier.webp','base-bunker.webp'):
    raw=(ROOT/'public/assets'/asset).read_bytes()
    css=css.replace(f"'/assets/{asset}'",f"'data:image/webp;base64,{base64.b64encode(raw).decode()}'")
js=(ROOT/'public/app.js').read_text()
html=html.replace('<link rel="stylesheet" href="/styles.css">', '<style>'+css+'</style>')
terrain=base64.b64encode((ROOT/'public/assets/terrain-relief.webp').read_bytes()).decode()
html=html.replace('/assets/terrain-relief.webp','data:image/webp;base64,'+terrain)
html=html.replace('<script type="module" src="/app.js"></script>','<script>'+js+'</script>')

def backend(path, method='GET', body=None):
    path=path if path.startswith('/') else '/'+path
    req=urllib.request.Request(BASE+path,data=body.encode() if body else None,method=method, headers={'content-type':'application/json'})
    try:
        with urllib.request.urlopen(req,timeout=3) as response:
            return {'status':response.status,'json':json.loads(response.read().decode())}
    except urllib.error.HTTPError as e:
        return {'status':e.code,'json':json.loads(e.read().decode())}


def run():
    env=os.environ.copy();env['DG_LEGACY_GUEST']='1';env.update(PORT=str(PORT),TICK_MS='300000',DATA_FILE='/tmp/dominio-08-browser-test.json')
    Path(env['DATA_FILE']).unlink(missing_ok=True)
    server=subprocess.Popen(['node','server.mjs'],cwd=ROOT,env=env,stdout=subprocess.PIPE,stderr=subprocess.STDOUT)
    try:
        time.sleep(.45)
        assert backend('/api/state')['status']==200
        with sync_playwright() as p:
            b=p.chromium.launch(headless=True,executable_path='/usr/bin/chromium',args=['--no-sandbox'])
            try:
                desktop_token = None
                for label,viewport in [('desktop',{'width':1440,'height':900}),('mobile',{'width':390,'height':844})]:
                    context=b.new_context(viewport=viewport,device_scale_factor=1,reduced_motion='reduce')
                    page=context.new_page()
                    page.set_default_timeout(4500)
                    errors=[]
                    page.on('pageerror',lambda error:errors.append(str(error)))
                    page.expose_function('__backend',backend)
                    # Bridge all frontend requests to the actual Node game engine.
                    page.add_init_script('''
                    window.fetch=async function(path,options={}){
                       const r=await window.__backend(path,options.method||'GET',options.body||null);
                       return new Response(JSON.stringify(r.json),{status:r.status,headers:{'Content-Type':'application/json'}});
                    };
                    window.EventSource=class {addEventListener(){} close(){}};
                    ''')
                    # init scripts may not fire on set_content; also install bridge on the document itself.
                    bridge='''<script>const _testStore={};Object.defineProperty(window,'localStorage',{configurable:true,value:{getItem:k=>_testStore[k]||null,setItem:(k,v)=>_testStore[k]=String(v),removeItem:k=>delete _testStore[k]}});window.fetch=async function(path,options={}){const r=await window.__backend(path,options.method||'GET',options.body||null);return new Response(JSON.stringify(r.json),{status:r.status,headers:{'Content-Type':'application/json'}})};window.EventSource=class {addEventListener(){}close(){}};</script>'''
                    page.set_content(html.replace('<script>'+js+'</script>',bridge+'<script>'+js+'</script>'),wait_until='domcontentloaded')
                    page.locator('.faction-choice').first.wait_for(timeout=10000)
                    # Two individual players join different states across desktop and mobile tests.
                    pquery='Mato Grosso do Sul' if label=='desktop' else 'São Paulo'
                    page.locator('#commanderName').fill('Jogador '+label)
                    page.locator('#stateSearch').fill(pquery)
                    page.locator('.faction-choice').first.click()
                    page.locator('#joinButton').click()
                    page.locator('#joinModal').wait_for(state='hidden',timeout=10000)
                    assert page.locator('#nationName').text_content().strip()==pquery
                    if label=='desktop': desktop_token = page.evaluate('token')
                    assert page.locator('.resource-item').count()==5
                    assert page.locator('#worldMap .province').count()==27
                    assert page.locator('#tacticalContent').get_by_text(pquery.upper(),exact=False).count()>0
                    page.evaluate("document.querySelector('#toast').classList.add('hidden')")
                    page.screenshot(path=f'/mnt/data/Dominio_Global_Brasil_v0.8_{label}_preview.png',full_page=True)
                    if label=='desktop':
                        page.locator('#worldMap .province[data-id="ms"]').click(force=True)
                        page.locator('#gameDialog').wait_for(state='visible')
                        assert page.locator('#dialogTitle').text_content().strip()=='Mato Grosso do Sul'
                        page.screenshot(path='/mnt/data/Dominio_Global_Brasil_v0.8_dialog_desktop.png',full_page=False)
                        page.locator('#gameDialog').get_by_role('button',name='Mover / Atacar',exact=True).click()
                        assert page.locator('#dialogTitle').text_content().strip()=='Movimentar tropas'
                        page.locator('#modalUnits').fill('9')
                        # A timed update must not reset the draft order.
                        page.evaluate('fetchState()')
                        page.wait_for_timeout(250)
                        assert page.locator('#modalUnits').input_value()=='9'
                        page.locator('#dialogBack').click()
                        assert page.locator('#dialogTitle').text_content().strip()=='Mato Grosso do Sul'
                        page.locator('#gameDialog').get_by_role('button',name='Recrutar',exact=True).click()
                        page.get_by_role('button',name='CONFIRMAR RECRUTAMENTO').click()
                        page.locator('#gameDialog').wait_for(state='hidden')
                        page.locator('#primaryNav [data-page="military"]').click()
                        page.get_by_role('tab',name='Ordens ativas').click()
                        assert page.get_by_text('Infantaria',exact=True).count()>0
                        page.locator('#primaryNav [data-page="construction"]').click()
                        page.locator('.data-row .mini-btn').first.click()
                        assert page.locator('#dialogTitle').text_content().strip()=='Expandir indústria'
                        page.get_by_role('button',name='CONFIRMAR CONSTRUÇÃO').click()
                        page.locator('#gameDialog').wait_for(state='hidden')
                        page.get_by_role('tab',name='Fortificações').click()
                        page.locator('.row-list .mini-btn').first.click()
                        assert page.locator('#dialogTitle').text_content().strip()=='Fortificar estado'
                        page.get_by_role('button',name='CONFIRMAR FORTIFICAÇÃO').click()
                        page.locator('#gameDialog').wait_for(state='hidden')
                        assert any(o['type']=='fort' for o in backend('/api/state?token='+desktop_token)['json']['orders'])
                        for dest in ['economy','diplomacy','intelligence','news','ranking','map']:
                            page.locator(f'#primaryNav [data-page="{dest}"]').click()
                            assert page.locator('#pageTitle').inner_text()
                        page.screenshot(path='/mnt/data/Dominio_Global_Brasil_v0.8_desktop.png',full_page=True)
                        # Game HUD quick-action regression: dedicated order forms, no inert controls.
                        page.locator('[data-quick="move"]').click()
                        assert page.locator('#dialogTitle').text_content().strip()=='Movimentar tropas'
                        page.locator('#dialogClose').click()
                        page.locator('[data-quick="recruit"]').click()
                        assert page.locator('#dialogTitle').text_content().strip()=='Recrutar tropas'
                        page.locator('#recruitUnitType').select_option('drones')
                        assert page.get_by_text('Reconhecimento e vantagem tática no combate.').count()>0
                        page.screenshot(path='/mnt/data/Dominio_Global_Brasil_v0.8_producao_desktop.png',full_page=False)
                        page.get_by_role('button',name='CONFIRMAR RECRUTAMENTO').click()
                        page.locator('#gameDialog').wait_for(state='hidden')
                        assert any(o.get('unitType')=='drones' for o in backend('/api/state?token='+desktop_token)['json']['orders'])
                        page.locator('[data-quick="build"]').click()
                        assert page.locator('#dialogTitle').text_content().strip()=='Expandir indústria'
                        page.locator('#dialogClose').click()
                        page.locator('[data-quick="inspect"]').click()
                        assert page.locator('#dialogTitle').text_content().strip()==pquery
                        page.locator('#dialogClose').click()
                    else:
                        assert page.locator('.mobile-nav').is_visible()
                        page.locator('#quickState').select_option('sp')
                        assert page.locator('#dialogTitle').text_content().strip()=='São Paulo'
                        page.screenshot(path='/mnt/data/Dominio_Global_Brasil_v0.8_dialog_mobile.png',full_page=False)
                        page.locator('#dialogClose').click()
                        page.locator('#zoomIn').click()
                        assert page.locator('#worldMap').evaluate('(node)=>node.style.width')=='840px'
                        page.locator('.mobile-nav [data-page="military"]').click()
                        page.get_by_role('tab',name='Produção militar').click()
                        page.locator('.row-list .mini-btn').first.click()
                        assert page.locator('#dialogTitle').text_content().strip()=='Recrutar tropas'
                        assert page.locator('#gameDialog').evaluate('(node)=>node.open')
                        page.locator('#recruitUnitType').select_option('armor')
                        assert page.locator('#recruitUnitType').input_value()=='armor'
                        page.screenshot(path='/mnt/data/Dominio_Global_Brasil_v0.8_producao_mobile.png',full_page=False)
                        page.get_by_role('button',name='CONFIRMAR RECRUTAMENTO').click()
                        page.locator('#gameDialog').wait_for(state='hidden')
                        mobile_token=page.evaluate('token')
                        assert any(o.get('unitType')=='armor' for o in backend('/api/state?token='+mobile_token)['json']['orders'])
                        page.get_by_role('tab',name='Logística').click()
                        assert page.get_by_text('Rede territorial de abastecimento').count()>0
                        page.locator('.mobile-nav [data-page="construction"]').click()
                        page.get_by_role('tab',name='Bases militares').click()
                        page.locator('.row-list .mini-btn').first.click()
                        assert page.locator('#dialogTitle').text_content().strip()=='Construir base militar'
                        page.get_by_role('button',name='CONSTRUIR BASE MILITAR').click()
                        page.locator('#gameDialog').wait_for(state='hidden')
                        assert any(o['type']=='base' for o in backend('/api/state?token='+mobile_token)['json']['orders'])
                        page.locator('.mobile-nav [data-page="military"]').click()
                        page.locator('#moreButton').click()
                        assert page.locator('#moreMenu').is_visible()
                        page.locator('#moreMenu [data-page="diplomacy"]').click()
                        page.wait_for_function("document.querySelector('#pageTitle').textContent === 'Diplomacia'")
                        page.locator('.mobile-nav [data-page="map"]').click()
                        page.locator('#zoomOut').click()
                        page.screenshot(path='/mnt/data/Dominio_Global_Brasil_v0.8_mobile.png',full_page=True)
                        page.locator('#mobileTacticalButton').click()
                        assert page.locator('#dialogTitle').text_content().strip()=='São Paulo'
                        page.locator('#dialogClose').click()
                        page.locator('[data-quick="recruit"]').click()
                        assert page.locator('#dialogTitle').text_content().strip()=='Recrutar tropas'
                        page.locator('#dialogClose').click()
                        # Testar proposta de paz entre dois comandantes e resposta pela interface mobile.
                        declaration = backend('/api/diplomacy','POST',json.dumps({'token':desktop_token,'type':'declare_war','targetId':'sp'}))
                        assert declaration['status']==200,declaration
                        peace = backend('/api/diplomacy','POST',json.dumps({'token':desktop_token,'type':'offer_peace','targetId':'sp'}))
                        assert peace['status']==200,peace
                        page.evaluate('fetchState()')
                        page.locator('#moreButton').click()
                        page.locator('#moreMenu [data-page="diplomacy"]').click()
                        page.get_by_role('tab',name='Propostas de paz').click()
                        page.locator('.row-list .mini-btn').first.click()
                        assert page.locator('#dialogTitle').text_content().strip()=='Proposta de paz'
                        page.get_by_role('button',name='ACEITAR PAZ').click()
                        page.locator('#gameDialog').wait_for(state='hidden')
                        page.get_by_role('tab',name='Cessar-fogos').click()
                        assert page.get_by_text('Mato Grosso do Sul').count()>0
                        blocked=backend('/api/order','POST',json.dumps({'token':desktop_token,'type':'move','provinceId':'ms','targetId':'sp','units':10}))
                        assert blocked['status']==400 and 'Cessar-fogo' in blocked['json']['error'],blocked
                        # Check layout without clipping viewport horizontally.
                        assert page.evaluate('document.body.scrollWidth <= window.innerWidth+1'),page.evaluate('document.body.scrollWidth')
                    assert not errors,errors
                    print(f'{label.upper()}: integração com servidor real, navegação, janelas, ações e renderização OK')
                    context.close()
            finally: b.close()
    finally:
        server.terminate();server.wait(timeout=8)

if __name__=='__main__':run()
