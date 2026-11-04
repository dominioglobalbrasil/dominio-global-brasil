-- DOMINIO GLOBAL v0.14 -- EXECUTAR APENAS NO PROJETO SUPABASE EXCLUSIVO DO JOGO.
-- Nada de reusar projetos da UNIFA, Nexum ou outros aplicativos.
-- Operacoes atomicas para o servidor Node rodando no Render Free.

BEGIN;

CREATE TABLE IF NOT EXISTS public.dg_accounts (
 id text PRIMARY KEY,
 username text NOT NULL UNIQUE,
 display_name text NOT NULL,
 salt text NOT NULL,
 password_hash text NOT NULL,
 recovery_hash text NOT NULL,
 created_at bigint NOT NULL
);
CREATE TABLE IF NOT EXISTS public.dg_sessions (
 token_hash text PRIMARY KEY,
 account_id text NOT NULL REFERENCES public.dg_accounts(id) ON DELETE CASCADE,
 expires_at bigint NOT NULL,
 created_at bigint NOT NULL
);
CREATE INDEX IF NOT EXISTS dg_sessions_expires_idx ON public.dg_sessions(expires_at);
CREATE TABLE IF NOT EXISTS public.dg_campaigns (
 id text PRIMARY KEY,
 name text NOT NULL,
 created_at text NOT NULL,
 game_json jsonb NOT NULL,
 revision integer NOT NULL DEFAULT 0,
 last_tick_at bigint NOT NULL
);
CREATE TABLE IF NOT EXISTS public.dg_memberships (
 match_id text NOT NULL REFERENCES public.dg_campaigns(id),
 account_id text NOT NULL REFERENCES public.dg_accounts(id),
 nation_id text NOT NULL,
 game_token text NOT NULL,
 PRIMARY KEY(match_id, account_id),
 UNIQUE(match_id, nation_id),
 UNIQUE(match_id, game_token)
);
CREATE TABLE IF NOT EXISTS public.dg_commands (
 match_id text NOT NULL REFERENCES public.dg_campaigns(id),
 account_id text NOT NULL REFERENCES public.dg_accounts(id),
 request_id text NOT NULL,
 action text NOT NULL,
 input_hash text NOT NULL,
 result_json jsonb NOT NULL,
 created_at bigint NOT NULL,
 PRIMARY KEY(match_id, account_id, request_id)
);
CREATE TABLE IF NOT EXISTS public.dg_auth_attempts (
 attempt_key text PRIMARY KEY,
 window_start bigint NOT NULL,
 failures integer NOT NULL
);

ALTER TABLE public.dg_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dg_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dg_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dg_memberships ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dg_commands ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dg_auth_attempts ENABLE ROW LEVEL SECURITY;
-- Sem policies para 'anon' e 'authenticated'. Somente servidor com chave secreta.
REVOKE ALL ON public.dg_accounts,public.dg_sessions,public.dg_campaigns,
 public.dg_memberships,public.dg_commands,public.dg_auth_attempts FROM PUBLIC, anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.dg_accounts,public.dg_sessions,
 public.dg_campaigns,public.dg_memberships,public.dg_commands,public.dg_auth_attempts TO service_role;

CREATE OR REPLACE FUNCTION public.dg_bootstrap(p_game jsonb,p_now bigint)
RETURNS jsonb LANGUAGE plpgsql SECURITY INVOKER SET search_path = public AS $$
BEGIN
 INSERT INTO dg_campaigns(id,name,created_at,game_json,revision,last_tick_at)
 VALUES ('brasil-01','Campanha Brasil 01',to_char(to_timestamp(p_now/1000.0) at time zone 'UTC','YYYY-MM-DD"T"HH24:MI:SS"Z"'),p_game,0,p_now)
 ON CONFLICT (id) DO NOTHING;
 RETURN jsonb_build_object('ok',true);
END;
$$;

CREATE OR REPLACE FUNCTION public.dg_create_campaign(p_id text,p_name text,p_game jsonb,p_now bigint)
RETURNS jsonb LANGUAGE plpgsql SECURITY INVOKER SET search_path = public AS $$
BEGIN
 PERFORM pg_advisory_xact_lock(74442013);
 IF (SELECT count(*) FROM dg_campaigns)>=8 THEN RAISE EXCEPTION 'Limite de 8 campanhas atingido.'; END IF;
 INSERT INTO dg_campaigns(id,name,created_at,game_json,revision,last_tick_at)
 VALUES (p_id,p_name,to_char(to_timestamp(p_now/1000.0) at time zone 'UTC','YYYY-MM-DD"T"HH24:MI:SS"Z"'),p_game,0,p_now);
 RETURN jsonb_build_object('id',p_id,'name',p_name);
END;
$$;

CREATE OR REPLACE FUNCTION public.dg_join_nation(p_match text,p_account text,p_nation text,p_game_token text,p_expected integer,p_game jsonb)
RETURNS jsonb LANGUAGE plpgsql SECURITY INVOKER SET search_path = public AS $$
DECLARE current_rev integer;
BEGIN
 SELECT revision INTO current_rev FROM dg_campaigns WHERE id=p_match FOR UPDATE;
 IF current_rev IS NULL THEN RAISE EXCEPTION 'Campanha inexistente'; END IF;
 IF current_rev<>p_expected THEN RAISE EXCEPTION 'DG_CONFLICT'; END IF;
 IF EXISTS(SELECT 1 FROM dg_memberships WHERE match_id=p_match AND (account_id=p_account OR nation_id=p_nation))
 THEN RAISE EXCEPTION 'Estado ja ocupado ou conta vinculada'; END IF;
 UPDATE dg_campaigns SET game_json=p_game,revision=revision+1 WHERE id=p_match;
 INSERT INTO dg_memberships(match_id,account_id,nation_id,game_token)
 VALUES(p_match,p_account,p_nation,p_game_token);
 RETURN jsonb_build_object('revision',current_rev+1);
END;
$$;

CREATE OR REPLACE FUNCTION public.dg_commit_action(p_match text,p_account text,p_request text,
 p_action text,p_hash text,p_expected integer,p_game jsonb,p_result jsonb,p_now bigint)
RETURNS jsonb LANGUAGE plpgsql SECURITY INVOKER SET search_path = public AS $$
DECLARE current_rev integer; old_row record;
BEGIN
 SELECT revision INTO current_rev FROM dg_campaigns WHERE id=p_match FOR UPDATE;
 IF current_rev IS NULL THEN RAISE EXCEPTION 'Campanha inexistente'; END IF;
 SELECT * INTO old_row FROM dg_commands WHERE match_id=p_match AND account_id=p_account AND request_id=p_request;
 IF FOUND THEN
  IF old_row.input_hash<>p_hash OR old_row.action<>p_action THEN RAISE EXCEPTION 'DG_DUPLICATE_MISMATCH'; END IF;
  RETURN jsonb_build_object('result',old_row.result_json,'replayed',true);
 END IF;
 IF current_rev<>p_expected THEN RAISE EXCEPTION 'DG_CONFLICT'; END IF;
 IF NOT EXISTS(SELECT 1 FROM dg_memberships WHERE match_id=p_match AND account_id=p_account)
 THEN RAISE EXCEPTION 'Conta nao participa desta campanha'; END IF;
 UPDATE dg_campaigns SET game_json=p_game,revision=revision+1 WHERE id=p_match;
 INSERT INTO dg_commands(match_id,account_id,request_id,action,input_hash,result_json,created_at)
 VALUES(p_match,p_account,p_request,p_action,p_hash,p_result,p_now);
 RETURN jsonb_build_object('result',p_result,'replayed',false);
END;
$$;

CREATE OR REPLACE FUNCTION public.dg_commit_tick(p_match text,p_expected integer,p_game jsonb,p_delta bigint,p_now bigint)
RETURNS jsonb LANGUAGE plpgsql SECURITY INVOKER SET search_path = public AS $$
DECLARE current_rev integer; previous_tick bigint;
BEGIN
 SELECT revision,last_tick_at INTO current_rev,previous_tick FROM dg_campaigns WHERE id=p_match FOR UPDATE;
 IF current_rev IS NULL THEN RAISE EXCEPTION 'Campanha inexistente'; END IF;
 IF current_rev<>p_expected THEN RAISE EXCEPTION 'DG_CONFLICT'; END IF;
 IF p_delta<1 OR previous_tick+p_delta>p_now+1000 THEN RAISE EXCEPTION 'Avanco temporal invalido'; END IF;
 UPDATE dg_campaigns SET game_json=p_game,revision=revision+1,last_tick_at=previous_tick+p_delta WHERE id=p_match;
 RETURN jsonb_build_object('revision',current_rev+1,'last_tick_at',previous_tick+p_delta);
END;
$$;

CREATE OR REPLACE FUNCTION public.dg_record_login_failure(p_key text,p_now bigint)
RETURNS jsonb LANGUAGE plpgsql SECURITY INVOKER SET search_path = public AS $$
BEGIN
 INSERT INTO dg_auth_attempts(attempt_key,window_start,failures)VALUES(p_key,p_now,1)
 ON CONFLICT(attempt_key)DO UPDATE SET
 window_start=CASE WHEN p_now-dg_auth_attempts.window_start>900000 THEN p_now ELSE dg_auth_attempts.window_start END,
 failures=CASE WHEN p_now-dg_auth_attempts.window_start>900000 THEN 1 ELSE dg_auth_attempts.failures+1 END;
 RETURN jsonb_build_object('ok',true);
END;
$$;

CREATE OR REPLACE FUNCTION public.dg_reset_password(p_account_id text,p_old_recovery_hash text,
 p_salt text,p_password_hash text,p_new_recovery_hash text)
RETURNS jsonb LANGUAGE plpgsql SECURITY INVOKER SET search_path = public AS $$
BEGIN
 UPDATE dg_accounts SET salt=p_salt,password_hash=p_password_hash,recovery_hash=p_new_recovery_hash
 WHERE id=p_account_id AND recovery_hash=p_old_recovery_hash;
 IF NOT FOUND THEN RAISE EXCEPTION 'Codigo de recuperacao invalido'; END IF;
 DELETE FROM dg_sessions WHERE account_id=p_account_id;
 RETURN jsonb_build_object('ok',true);
END;
$$;

REVOKE ALL ON FUNCTION public.dg_bootstrap(jsonb,bigint) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.dg_create_campaign(text,text,jsonb,bigint) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.dg_join_nation(text,text,text,text,integer,jsonb) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.dg_commit_action(text,text,text,text,text,integer,jsonb,jsonb,bigint) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.dg_commit_tick(text,integer,jsonb,bigint,bigint) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.dg_record_login_failure(text,bigint) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.dg_reset_password(text,text,text,text,text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.dg_bootstrap(jsonb,bigint),
 public.dg_create_campaign(text,text,jsonb,bigint),
 public.dg_join_nation(text,text,text,text,integer,jsonb),
 public.dg_commit_action(text,text,text,text,text,integer,jsonb,jsonb,bigint),
 public.dg_commit_tick(text,integer,jsonb,bigint,bigint),
 public.dg_record_login_failure(text,bigint),
 public.dg_reset_password(text,text,text,text,text) TO service_role;
COMMIT;
