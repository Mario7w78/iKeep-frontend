/**
 * La seccion CALENDARIO DE GOOGLE de Configuracion.
 *
 * Estados: sin conectar / conectado / reconexion, mas los errores aislados.
 * El store es el real (zustand): lo que se prueba es la pantalla completa,
 * no un mock que ya devuelve lo que quiero oir.
 */

import React from 'react';
import { Alert } from 'react-native';
import { act, fireEvent, render, waitFor } from '@testing-library/react-native';

jest.mock('@expo/vector-icons', () => ({ Ionicons: () => null }));
jest.mock('@react-native-async-storage/async-storage', () => ({
  setItem: jest.fn(), getItem: jest.fn().mockResolvedValue(null),
  removeItem: jest.fn(), clear: jest.fn(),
}));

const mockIniciar = jest.fn();
const mockConsultarEstado = jest.fn();
const mockDesconectar = jest.fn();
const mockCargarEventos = jest.fn();
jest.mock('../../../../../infrastructure/api/GoogleCalendarApiService', () => ({
  iniciarConexion: (...a: any[]) => mockIniciar(...a),
  consultarEstado: (...a: any[]) => mockConsultarEstado(...a),
  desconectar: (...a: any[]) => mockDesconectar(...a),
  cargarEventos: (...a: any[]) => mockCargarEventos(...a),
}));

const mockAbrirNavegador = jest.fn();
jest.mock('expo-web-browser', () => ({
  openAuthSessionAsync: (...a: any[]) => mockAbrirNavegador(...a),
}));

import { GoogleCalendarSection } from '../GoogleCalendarSection';
import { useGoogleCalendarStore } from '../../../../../infrastructure/store/useGoogleCalendarStore';

function resetStore(overrides: Record<string, unknown> = {}) {
  useGoogleCalendarStore.setState({
    estado: 'desconectado',
    porDia: {},
    cargando: false,
    error: null,
    ultimoConteo: null,
    verificado: false,
    ...overrides,
  });
}

describe('GoogleCalendarSection', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockIniciar.mockResolvedValue('https://accounts.google.com/o/oauth2/auth?x=1');
    mockConsultarEstado.mockResolvedValue(false);
    mockDesconectar.mockResolvedValue(undefined);
    mockCargarEventos.mockResolvedValue({ conectado: true, eventos: [], diasPorEvento: {} });
    resetStore();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('sin conexion ofrece Conectar y consulta el estado al abrir', async () => {
    const vista = await render(<GoogleCalendarSection />);

    expect(vista.getByTestId('google-section')).toBeTruthy();
    await waitFor(() => expect(mockConsultarEstado).toHaveBeenCalled());
    expect(vista.getByTestId('google-conectar')).toBeTruthy();
  });

  it('conectado muestra el estado y cambia el boton a Desconectar', async () => {
    resetStore({ estado: 'conectado', verificado: true });
    mockConsultarEstado.mockResolvedValue(true);

    const vista = await render(<GoogleCalendarSection />);

    expect(await waitFor(() => vista.getByTestId('google-desconectar'))).toBeTruthy();
    expect(vista.getByText('Conectado')).toBeTruthy();
  });

  it('reconexion explica por que y pide reconectar', async () => {
    // spec external-events-ui: token revocado -> se surfaced el estado.
    // /estado no puede responder (sin red tras el fallo): se conserva lo sabido.
    resetStore({ estado: 'reconexion', verificado: true });
    mockConsultarEstado.mockRejectedValue(new Error('sin red'));

    const vista = await render(<GoogleCalendarSection />);

    expect(vista.getByText(/revocó el acceso|venció/)).toBeTruthy();
    expect(vista.getByTestId('google-conectar')).toBeTruthy();
    expect(vista.getByText('Reconectar')).toBeTruthy();
  });

  describe('el flujo de conectar', () => {
    it('abre el navegador con la url del backend y el redirect lotus://', async () => {
      // Al abrir: desconectado; tras volver del navegador: conectado.
      mockConsultarEstado.mockResolvedValueOnce(false).mockResolvedValueOnce(true);
      mockCargarEventos.mockResolvedValue({
        conectado: true,
        eventos: [{ id: 'e1', titulo: 'Clase', inicio: '', fin: '', todoElDia: false }],
        diasPorEvento: {},
      });
      const vista = await render(<GoogleCalendarSection />);
      const boton = await waitFor(() => vista.getByTestId('google-conectar'));

      await act(async () => { fireEvent.press(boton); });

      expect(mockIniciar).toHaveBeenCalledTimes(1);
      expect(mockAbrirNavegador).toHaveBeenCalledWith(
        'https://accounts.google.com/o/oauth2/auth?x=1',
        'lotus://google/callback'
      );
      // D6: al volver, /estado confirma — nunca se confia solo en el redirect.
      await waitFor(() =>
        expect(useGoogleCalendarStore.getState().estado).toBe('conectado')
      );
    });

    it('tras conectar, la primera sincronización llena un banner con el conteo', async () => {
      // El item 4: conectar no puede parecer un botón que no hizo nada. Al
      // volver del navegador se sincroniza el mes y el resultado se muestra.
      mockConsultarEstado.mockResolvedValueOnce(false).mockResolvedValueOnce(true);
      mockCargarEventos.mockResolvedValue({
        conectado: true,
        eventos: [
          { id: 'e1', titulo: 'Clase', inicio: '', fin: '', todoElDia: false },
          { id: 'e2', titulo: 'Parcial', inicio: '', fin: '', todoElDia: false },
        ],
        diasPorEvento: {},
      });
      const vista = await render(<GoogleCalendarSection />);
      const boton = await waitFor(() => vista.getByTestId('google-conectar'));

      await act(async () => { fireEvent.press(boton); });

      expect(mockCargarEventos).toHaveBeenCalledTimes(1);
      await waitFor(() => expect(vista.getByTestId('google-banner-conteo')).toBeTruthy());
      expect(
        vista.getByText('Se sincronizaron 2 eventos del mes.')
      ).toBeTruthy();
    });

    it('cero eventos en el mes lo dice, en vez de fingir silencio', async () => {
      mockConsultarEstado.mockResolvedValueOnce(false).mockResolvedValueOnce(true);
      mockCargarEventos.mockResolvedValue({
        conectado: true,
        eventos: [],
        diasPorEvento: {},
      });
      const vista = await render(<GoogleCalendarSection />);
      const boton = await waitFor(() => vista.getByTestId('google-conectar'));

      await act(async () => { fireEvent.press(boton); });

      await waitFor(() => expect(vista.getByTestId('google-banner-conteo')).toBeTruthy());
      expect(
        vista.getByText('Sincronizado: no hay eventos en los próximos días.')
      ).toBeTruthy();
    });

    it('un 503 dice que falta configuracion, en vez de un error generico', async () => {
      const vista = await render(<GoogleCalendarSection />);
      const boton = await waitFor(() => vista.getByTestId('google-conectar'));
      mockIniciar.mockRejectedValue({ status: 503, message: 'config' });

      await act(async () => { fireEvent.press(boton); });

      expect(
        vista.getByText('El servidor aún no tiene Google Calendar configurado.')
      ).toBeTruthy();
    });

    it('cancelar en el navegador no rompe: igual confirma con /estado', async () => {
      mockConsultarEstado.mockResolvedValue(false);
      const vista = await render(<GoogleCalendarSection />);
      const boton = await waitFor(() => vista.getByTestId('google-conectar'));
      mockAbrirNavegador.mockResolvedValue({ type: 'cancel' });

      await act(async () => { fireEvent.press(boton); });

      expect(mockConsultarEstado).toHaveBeenCalled();
      expect(useGoogleCalendarStore.getState().estado).toBe('desconectado');
    });
  });

  describe('el flujo de desconectar', () => {
    it('pide confirmacion antes de borrar nada', async () => {
      resetStore({ estado: 'conectado', verificado: true, porDia: { '2026-08-11': [] } });
      mockConsultarEstado.mockResolvedValue(true);   // el chequeo de monton confirma lo conectado
      const espia = jest.spyOn(Alert, 'alert');
      const vista = await render(<GoogleCalendarSection />);
      const boton = await waitFor(() => vista.getByTestId('google-desconectar'));

      await act(async () => { fireEvent.press(boton); });

      expect(espia).toHaveBeenCalledWith(
        expect.stringContaining('Desconectar'),
        expect.any(String),
        expect.arrayContaining([
          expect.objectContaining({ text: 'Conservar' }),
          expect.objectContaining({ text: 'Desconectar' }),
        ])
      );
      // Todavia nada borrado: nadie apreto el boton destructivo.
      expect(mockDesconectar).not.toHaveBeenCalled();
    });

    it('confirmar desconecta y limpia todo lo local', async () => {
      resetStore({
        estado: 'conectado',
        verificado: true,
        porDia: { '2026-08-11': [{ id: 'x', titulo: 't', inicio: '', fin: '', todoElDia: false }] },
      });
      mockConsultarEstado.mockResolvedValue(true);
      let onPressDesconectar!: () => void;
      jest.spyOn(Alert, 'alert').mockImplementation((_t, _m, botones: any) => {
        onPressDesconectar = botones.find((b: any) => b.text === 'Desconectar').onPress;
      });
      const vista = await render(<GoogleCalendarSection />);
      const boton = await waitFor(() => vista.getByTestId('google-desconectar'));

      await act(async () => { fireEvent.press(boton); });
      await act(async () => { onPressDesconectar(); });

      expect(mockDesconectar).toHaveBeenCalledTimes(1);
      expect(useGoogleCalendarStore.getState().porDia).toEqual({});
      expect(useGoogleCalendarStore.getState().estado).toBe('desconectado');
    });
  });

  it('un error de sincronizacion se muestra aca y solo aca', async () => {
    resetStore({ estado: 'conectado', verificado: true, error: 'No pudimos traer tus eventos de Google.' });

    const vista = await render(<GoogleCalendarSection />);

    expect(vista.getByTestId('google-error')).toBeTruthy();
    expect(vista.getByText('No pudimos traer tus eventos de Google.')).toBeTruthy();
  });
});
