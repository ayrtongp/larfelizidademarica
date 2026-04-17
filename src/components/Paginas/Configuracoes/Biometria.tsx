import React, { useEffect, useState } from 'react';
import { notifyError, notifySuccess } from '@/utils/Functions';
import { getUserID } from '@/utils/Login';

interface Credential {
  id: string;
  name: string;
  deviceType: string;
  registeredAt: string;
  transports: string[];
}

interface BiometriaData {
  biometriaHabilitada: boolean;
  credentials: Credential[];
}

const deviceIcon = (transports: string[]) => {
  if (transports.includes('internal')) return '🔐';
  if (transports.includes('usb')) return '🔑';
  if (transports.includes('nfc') || transports.includes('ble')) return '📱';
  return '🔐';
};

const Biometria: React.FC = () => {
  const userId = getUserID();
  const [data, setData] = useState<BiometriaData>({ biometriaHabilitada: false, credentials: [] });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [registrando, setRegistrando] = useState(false);
  const [nomeCredencial, setNomeCredencial] = useState('');
  const [showNomeInput, setShowNomeInput] = useState(false);

  const fetchData = async () => {
    try {
      const res = await fetch(`/api/Controller/C_biometria?tipo=dados-biometria&userId=${userId}`);
      if (res.ok) setData(await res.json());
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (userId) fetchData();
  }, [userId]);

  const handleToggle = async () => {
    try {
      setSaving(true);
      const res = await fetch('/api/Controller/C_biometria?tipo=toggle-biometria', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, habilitar: !data.biometriaHabilitada }),
      });
      if (!res.ok) throw new Error((await res.json()).message);
      setData((prev) => ({ ...prev, biometriaHabilitada: !prev.biometriaHabilitada }));
      notifySuccess(data.biometriaHabilitada ? 'Biometria desabilitada' : 'Biometria habilitada');
    } catch (err: any) {
      notifyError(err.message || 'Erro ao alterar configuração');
    } finally {
      setSaving(false);
    }
  };

  const handleRegistrar = async () => {
    const nome = nomeCredencial.trim() || 'Meu dispositivo';
    setRegistrando(true);
    try {
      // 1. Get registration options from server
      const initRes = await fetch('/api/Controller/C_biometria?tipo=registrar-inicio', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId }),
      });
      if (!initRes.ok) throw new Error((await initRes.json()).message);
      const options = await initRes.json();

      // 2. Prompt browser biometric
      const { startRegistration } = await import('@simplewebauthn/browser');
      const registrationResponse = await startRegistration({ optionsJSON: options });

      // 3. Verify with server
      const finalRes = await fetch('/api/Controller/C_biometria?tipo=registrar-finalizar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, response: registrationResponse, credentialName: nome }),
      });
      if (!finalRes.ok) throw new Error((await finalRes.json()).message);

      notifySuccess('Biometria cadastrada com sucesso!');
      setShowNomeInput(false);
      setNomeCredencial('');
      fetchData();
    } catch (err: any) {
      if (err.name === 'NotAllowedError') {
        notifyError('Operação cancelada ou não autorizada pelo dispositivo.');
      } else {
        notifyError(err.message || 'Erro ao registrar biometria');
      }
    } finally {
      setRegistrando(false);
    }
  };

  const handleRemover = async (credentialId: string, nome: string) => {
    if (!window.confirm(`Remover a biometria "${nome}"?`)) return;
    try {
      setSaving(true);
      const res = await fetch('/api/Controller/C_biometria?tipo=remover-credencial', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, credentialId }),
      });
      if (!res.ok) throw new Error((await res.json()).message);
      notifySuccess('Credencial removida');
      fetchData();
    } catch (err: any) {
      notifyError(err.message || 'Erro ao remover credencial');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16 text-gray-400 text-sm gap-2">
        <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24" fill="none">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4l3-3-3-3v4a8 8 0 00-8 8h4z" />
        </svg>
        Carregando...
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-xl">

      {/* Header info */}
      <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 flex gap-3">
        <span className="text-2xl mt-0.5">🔐</span>
        <div>
          <p className="text-sm font-semibold text-blue-800">Login biométrico (passkey)</p>
          <p className="text-xs text-blue-600 mt-1 leading-relaxed">
            Cadastre a biometria do seu dispositivo (impressão digital, Face ID ou Windows Hello) para entrar sem precisar digitar senha.
          </p>
        </div>
      </div>

      {/* Toggle */}
      <div className="bg-white border border-gray-200 rounded-xl p-4 flex items-center justify-between gap-4">
        <div>
          <p className="text-sm font-semibold text-gray-800">Login biométrico</p>
          <p className="text-xs text-gray-500 mt-0.5">
            {data.biometriaHabilitada ? 'Habilitado — você pode usar biometria na tela de login' : 'Desabilitado — apenas login com senha'}
          </p>
        </div>
        <button
          onClick={handleToggle}
          disabled={saving || data.credentials.length === 0}
          title={data.credentials.length === 0 ? 'Cadastre ao menos uma biometria para habilitar' : undefined}
          className={`relative inline-flex h-6 w-11 shrink-0 rounded-full border-2 border-transparent transition-colors focus:outline-none
            ${data.biometriaHabilitada ? 'bg-indigo-600' : 'bg-gray-200'}
            ${(saving || data.credentials.length === 0) ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer'}`}
        >
          <span
            className={`inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition-transform
              ${data.biometriaHabilitada ? 'translate-x-5' : 'translate-x-0'}`}
          />
        </button>
      </div>

      {/* Credentials list */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">
            Dispositivos cadastrados ({data.credentials.length})
          </p>
          {!showNomeInput && (
            <button
              onClick={() => setShowNomeInput(true)}
              className="flex items-center gap-1.5 text-xs px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors"
            >
              <span>+</span>
              Adicionar biometria
            </button>
          )}
        </div>

        {/* Nome input + registrar */}
        {showNomeInput && (
          <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 space-y-3">
            <p className="text-sm font-semibold text-gray-700">Novo dispositivo</p>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Nome do dispositivo (opcional)</label>
              <input
                type="text"
                value={nomeCredencial}
                onChange={(e) => setNomeCredencial(e.target.value)}
                placeholder="Ex: Touch ID MacBook, Face ID iPhone..."
                className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
              />
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleRegistrar}
                disabled={registrando}
                className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm rounded-lg transition-colors disabled:opacity-50"
              >
                {registrando ? (
                  <>
                    <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4l3-3-3-3v4a8 8 0 00-8 8h4z" />
                    </svg>
                    Aguardando dispositivo...
                  </>
                ) : (
                  <>🔐 Cadastrar biometria</>
                )}
              </button>
              <button
                onClick={() => { setShowNomeInput(false); setNomeCredencial(''); }}
                className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-600 text-sm rounded-lg transition-colors"
              >
                Cancelar
              </button>
            </div>
            <p className="text-xs text-gray-400">
              Seu navegador solicitará a autenticação biométrica do dispositivo.
            </p>
          </div>
        )}

        {/* Credentials */}
        {data.credentials.length === 0 ? (
          <div className="text-center py-8 text-gray-400 text-sm bg-gray-50 rounded-xl border border-dashed border-gray-200">
            <p className="text-2xl mb-2">🔐</p>
            <p>Nenhum dispositivo cadastrado.</p>
            <p className="text-xs mt-1">Clique em "Adicionar biometria" para começar.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {data.credentials.map((cred) => (
              <div key={cred.id} className="bg-white border border-gray-200 rounded-xl px-4 py-3 flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <span className="text-xl">{deviceIcon(cred.transports)}</span>
                  <div>
                    <p className="text-sm font-medium text-gray-800">{cred.name}</p>
                    <p className="text-xs text-gray-400">
                      Cadastrado em {new Date(cred.registeredAt).toLocaleDateString('pt-BR')}
                      {cred.deviceType === 'multiDevice' && (
                        <span className="ml-2 bg-green-100 text-green-700 px-1.5 py-0.5 rounded text-xs">sincronizado</span>
                      )}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => handleRemover(cred.id, cred.name)}
                  disabled={saving}
                  className="text-xs px-2 py-1 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg transition-colors disabled:opacity-50"
                >
                  Remover
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Support note */}
      <p className="text-xs text-gray-400">
        Requer navegador compatível com WebAuthn (Chrome, Firefox, Safari, Edge modernos). O cadastro é vinculado ao dispositivo — dispositivos diferentes precisam de cadastros separados.
      </p>
    </div>
  );
};

export default Biometria;
