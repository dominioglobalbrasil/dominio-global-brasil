"""Teste integrado da autenticação v0.13 em Chromium desktop e mobile."""
import os, subprocess, tempfile, time, socket
from pathlib import Path
from playwright.sync_api import sync_playwright

ROOT=Path(__file__).resolve().parent.parent

def free_port():
 with socket.socket() as s:
  s.bind(('127.0.0.1',0));return s.getsockname()[1]

def wait(port):
 import urllib.request
 for _ in range(100):
  try:
   with urllib.request.urlopen(f'http://127.0.0.1:{port}/api/health',timeout=1) as res:
    if res.status==200:return
  except Exception:time.sleep(.07)
 raise AssertionError('Servidor não iniciou')

with tempfile.TemporaryDirectory(prefix='dg13-browser-') as root:
 port=free_port()
 env=os.environ.copy();env.update(PORT=str(port),HOST='127.0.0.1',DB_FILE=str(Path(root)/'test.sqlite'),DATA_FILE=str(Path(root)/'legacy.json'),TICK_MS='300000',DG_LEGACY_GUEST='0')
 proc=subprocess.Popen(['node','server.mjs'],cwd=ROOT,env=env,stdout=subprocess.DEVNULL,stderr=subprocess.PIPE)
 try:
  wait(port)
  with sync_playwright() as p:
   browser=p.chromium.launch(headless=True,executable_path='/usr/bin/chromium',args=['--no-sandbox'])
   context=browser.new_context(viewport={'width':1400,'height':920},device_scale_factor=1,locale='pt-BR')
   page=context.new_page();errors=[]
   page.on('pageerror',lambda err:errors.append(str(err)))
   page.goto(f'http://127.0.0.1:{port}/',wait_until='domcontentloaded')
   page.locator('#authModal').wait_for(state='visible')
   page.screenshot(path='/mnt/data/DG_v013_Login_PC.png',full_page=True)
   page.locator('[data-auth-mode="register"]').click()
   page.locator('#authUsername').fill('comandante_teste')
   page.locator('#authDisplayName').fill('Comandante Teste')
   page.locator('#authPassword').fill('senha-segura-01234')
   page.locator('#authSubmit').click()
   page.locator('#recoveryDialog').wait_for(state='visible')
   assert len(page.locator('#recoveryCodeValue').inner_text())>=24
   page.locator('#recoveryAcknowledged').click()
   page.locator('#joinModal').wait_for(state='visible')
   page.locator('#stateSearch').fill('São Paulo')
   page.locator('#factionPicker button.faction-choice:not([disabled])').first.click()
   page.locator('#joinButton').click()
   page.locator('#joinModal').wait_for(state='hidden')
   assert 'São Paulo' in page.locator('#nationName').inner_text()
   page.locator('#logoutButton').wait_for(state='visible')
   # Enviar ordem de recrutamento pelo botão na janela.
   page.locator('[data-quick="recruit"]').first.click()
   page.locator('#gameDialog').wait_for(state='visible')
   # Confirma visual da janela de ordem.
   page.screenshot(path='/mnt/data/DG_v013_Conta_Jogo_PC.png',full_page=True)
   page.locator('#dialogClose').click()
   # Logout e re-login, mantendo o estado.
   page.locator('#logoutButton').click()
   page.locator('#authModal').wait_for(state='visible')
   page.locator('[data-auth-mode="login"]').click()
   page.locator('#authUsername').fill('comandante_teste')
   page.locator('#authPassword').fill('senha-segura-01234')
   page.locator('#authSubmit').click()
   page.locator('#authModal').wait_for(state='hidden')
   assert 'São Paulo' in page.locator('#nationName').inner_text()
   mobile=context.new_page(viewport={'width':390,'height':844})
   mobile.on('pageerror',lambda err:errors.append(str(err)))
   mobile.goto(f'http://127.0.0.1:{port}/',wait_until='domcontentloaded')
   mobile.locator('#joinModal').wait_for(state='hidden')
   mobile.screenshot(path='/mnt/data/DG_v013_Conta_Jogo_Mobile.png',full_page=True)
   # A versão mobile usa o mesmo cookie seguro do navegador.
   assert 'São Paulo' in mobile.locator('#nationName').inner_text()
   assert not errors,errors
   browser.close()
  print('BROWSER AUTH OK: cadastro, código de recuperação, posse de SP, modal militar, logout, login e celular')
 finally:
  proc.terminate()
  try:proc.wait(timeout=5)
  except subprocess.TimeoutExpired:proc.kill()
