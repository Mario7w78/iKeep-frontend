import { mapParsedResponseToFormState, applyParsedState } from '../parseNlMapper';
import { ParseNLResponseDto } from '../../../infrastructure/api/dto/ParseNLDto';
import { DayOfWeek } from '../../../domain/entities/Activity';

describe('mapParsedResponseToFormState', () => {
  const fullResponse: ParseNLResponseDto = {
    name: 'Fútbol con amigos',
    activity_type: 'tarea',
    is_fixed: true,
    is_anchor: false,
    difficulty: 'media',
    priority: 'alta',
    schedule: [
      { day: 'Lunes', start_time: 540, end_time: 660 },
      { day: 'Miercoles', start_time: 540, end_time: 660 },
    ],
    duracion_minutos: null,
    hora_preferida_inicio: null,
    hora_preferida_fin: null,
    location: 'Cancha 1',
    confidence: 0.95,
    missing_fields: [],
  };

  const partialResponse: ParseNLResponseDto = {
    name: 'Estudiar',
    activity_type: null,
    is_fixed: false,
    is_anchor: false,
    difficulty: null,
    priority: null,
    schedule: [
      { day: 'Martes', start_time: 480, end_time: 600 },
    ],
    duracion_minutos: null,
    hora_preferida_inicio: null,
    hora_preferida_fin: null,
    location: null,
    confidence: 0.7,
    missing_fields: ['activity_type', 'difficulty', 'priority', 'location'],
  };

  describe('with full response data', () => {
    it('maps name from response', () => {
      const state = mapParsedResponseToFormState(fullResponse, 1);
      expect(state.activityName).toBe('Fútbol con amigos');
    });

    it('maps identity from response', () => {
      const state = mapParsedResponseToFormState(fullResponse, 1);
      expect(state.identity).toBe('tarea');
    });

    it('maps isFixed and isAnchor from response', () => {
      const state = mapParsedResponseToFormState(fullResponse, 1);
      expect(state.isFixed).toBe(true);
      expect(state.isAnchor).toBe(false);
    });

    it('maps difficulty and priority from response', () => {
      const state = mapParsedResponseToFormState(fullResponse, 1);
      expect(state.difficulty).toBe('media');
      expect(state.priority).toBe('alta');
    });

    it('maps schedule to selectedDays', () => {
      const state = mapParsedResponseToFormState(fullResponse, 1);
      expect(state.selectedDays).toEqual(['Lunes', 'Miercoles']);
    });

    it('maps schedule to daysDict with partitions', () => {
      const state = mapParsedResponseToFormState(fullResponse, 1);
      expect(Object.keys(state.daysDict)).toEqual(['Lunes', 'Miercoles']);
      expect(state.daysDict['Lunes'].partitions).toHaveLength(1);
      expect(state.daysDict['Lunes'].partitions[0].durationTime).toBe(120);
    });

    it('uses individual groupId for fixed activities', () => {
      const state = mapParsedResponseToFormState(fullResponse, 5);
      // Fixed: each day gets a unique groupId
      expect(state.daysDict['Lunes'].groupId).toBe(5);
      expect(state.daysDict['Miercoles'].groupId).toBe(6);
      expect(state.nextGroupId).toBe(7);
    });

    it('sets activeDay to the first schedule day', () => {
      const state = mapParsedResponseToFormState(fullResponse, 1);
      expect(state.activeDay).toBe('Lunes');
    });
  });

  describe('with partial response data', () => {
    it('sets name when present', () => {
      const state = mapParsedResponseToFormState(partialResponse, 1);
      expect(state.activityName).toBe('Estudiar');
    });

    it('leaves identity as null when in missing_fields', () => {
      const state = mapParsedResponseToFormState(partialResponse, 1);
      expect(state.identity).toBeNull();
    });

    it('leaves difficulty as null when in missing_fields', () => {
      const state = mapParsedResponseToFormState(partialResponse, 1);
      expect(state.difficulty).toBeNull();
    });

    it('maps schedule even with missing fields', () => {
      const state = mapParsedResponseToFormState(partialResponse, 1);
      expect(state.selectedDays).toEqual(['Martes']);
      expect(state.daysDict['Martes'].partitions).toHaveLength(1);
    });

    it('uses shared groupId for flexible activities', () => {
      const state = mapParsedResponseToFormState(partialResponse, 3);
      // Flexible: all days share the same groupId
      expect(state.daysDict['Martes'].groupId).toBe(3);
      expect(state.nextGroupId).toBe(4);
    });
  });

  describe('with empty schedule', () => {
    const noScheduleResponse: ParseNLResponseDto = {
      name: 'Test',
      activity_type: null,
      is_fixed: false,
      is_anchor: false,
      difficulty: null,
      priority: null,
      schedule: [],
      duracion_minutos: null,
      hora_preferida_inicio: null,
      hora_preferida_fin: null,
      location: null,
      confidence: 0.5,
      missing_fields: ['schedule'],
    };

    it('leaves selectedDays empty when schedule is missing', () => {
      const state = mapParsedResponseToFormState(noScheduleResponse, 1);
      expect(state.selectedDays).toEqual([]);
      expect(state.daysDict).toEqual({});
    });
  });
});

describe('applyParsedState', () => {
  it('calls all relevant setters with mapped values', () => {
    const setters = {
      setActivityName: jest.fn(),
      setIdentity: jest.fn(),
      setIsFixed: jest.fn(),
      setIsAnchor: jest.fn(),
      setDifficulty: jest.fn(),
      setPriority: jest.fn(),
      setSelectedDays: jest.fn(),
      setDaysDict: jest.fn(),
      setPartitions: jest.fn(),
      setActiveDay: jest.fn(),
      setActivePartitionIndex: jest.fn(),
      setNextGroupId: jest.fn(),
      setPreferredStartTime: jest.fn(),
      setPreferredEndTime: jest.fn(),
      setStep: jest.fn(),
    };

    const response: ParseNLResponseDto = {
      name: 'Gimnasio',
      activity_type: 'tarea',
      is_fixed: true,
      is_anchor: false,
      difficulty: 'alta',
      priority: 'media',
      schedule: [{ day: 'Lunes', start_time: 600, end_time: 690 }],
      duracion_minutos: null,
      hora_preferida_inicio: null,
      hora_preferida_fin: null,
      location: null,
      confidence: 0.9,
      missing_fields: [],
    };

    const state = mapParsedResponseToFormState(response, 1);
    applyParsedState(state, setters);

    expect(setters.setActivityName).toHaveBeenCalledWith('Gimnasio');
    expect(setters.setIdentity).toHaveBeenCalledWith('tarea');
    expect(setters.setIsFixed).toHaveBeenCalledWith(true);
    expect(setters.setIsAnchor).toHaveBeenCalledWith(false);
    expect(setters.setDifficulty).toHaveBeenCalledWith('alta');
    expect(setters.setPriority).toHaveBeenCalledWith('media');
    expect(setters.setSelectedDays).toHaveBeenCalled();
    expect(setters.setDaysDict).toHaveBeenCalled();
    expect(setters.setPartitions).toHaveBeenCalled();
    expect(setters.setActiveDay).toHaveBeenCalledWith('Lunes');
  });

  it('does not call setters for null fields', () => {
    const setters = {
      setActivityName: jest.fn(),
      setIdentity: jest.fn(),
      setIsFixed: jest.fn(),
      setIsAnchor: jest.fn(),
      setDifficulty: jest.fn(),
      setPriority: jest.fn(),
      setSelectedDays: jest.fn(),
      setDaysDict: jest.fn(),
      setPartitions: jest.fn(),
      setActiveDay: jest.fn(),
      setActivePartitionIndex: jest.fn(),
      setNextGroupId: jest.fn(),
      setPreferredStartTime: jest.fn(),
      setPreferredEndTime: jest.fn(),
      setStep: jest.fn(),
    };

    const response: ParseNLResponseDto = {
      name: null,
      activity_type: null,
      is_fixed: false,
      is_anchor: false,
      difficulty: null,
      priority: null,
      schedule: [],
      duracion_minutos: null,
      hora_preferida_inicio: null,
      hora_preferida_fin: null,
      location: null,
      confidence: 0.4,
      missing_fields: ['name', 'activity_type', 'difficulty', 'priority', 'schedule'],
    };

    const state = mapParsedResponseToFormState(response, 1);
    applyParsedState(state, setters);

    expect(setters.setActivityName).not.toHaveBeenCalled();
    expect(setters.setIdentity).not.toHaveBeenCalled();
    expect(setters.setDifficulty).not.toHaveBeenCalled();
    expect(setters.setPriority).not.toHaveBeenCalled();
    expect(setters.setSelectedDays).not.toHaveBeenCalled();
    expect(setters.setDaysDict).not.toHaveBeenCalled();
  });
});
