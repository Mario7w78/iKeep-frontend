import React, { useEffect, useMemo, useRef, useState, useCallback } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Dimensions,
  PanResponder,
  Pressable,
  ActivityIndicator,
  Alert,
  Platform,
  ScrollView,
  BackHandler,
} from "react-native";
import * as Haptics from "expo-haptics";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { Sapo } from "../../../components/atoms/Mascot/Sapo";

import { DayOfWeek } from "../../../../domain/entities/Activity";
import { calculateEndTime, nextRoundHour } from "../../../utils/timeUtils";
import { useTheme, ThemeColors } from "../../../components/theme/colors";
import { useActivityStore } from "../../../../di/Dependencies";

import useFrequency from "../../../hooks/useFrequency";
import useTimeForm from "../../../hooks/useTimeForm";

import ProgressIndicator from "../../../components/atoms/CreateActivity/ProgressIndicator";
import NameIdentityStep from "../../../components/organisms/CreateActivity/NameIdentityStep";
import DaySelectionStep from "../../../components/organisms/CreateActivity/DaySelectionStep";
import { TimesAndReviewStep } from "../../../components/organisms/CreateActivity/TimesAndReviewStep";
import { useFormErrors, CampoConError } from "../../../hooks/useFormErrors";
import { WhatAndWhenStep } from "../../../components/organisms/CreateActivity/WhatAndWhenStep";
import { useWizardDraftStore } from "../../../../infrastructure/store/useWizardDraftStore";
import { wizardStateToParsed } from "../../../../application/mappers/wizardStateToParsed";
import { useChatStore } from "../../../../di/Dependencies";

const TOTAL_STEPS = 2;
const SHEET_HEIGHT = Dimensions.get("window").height * 0.88;
const DISMISS_DISTANCE = 130;
/** How long the success state stays up before the sheet closes itself. */
// El overlay ocupa la pantalla entera, asi que la mascota se mide contra
// ella: un tamano fijo se veia perdido en el medio. Se acota para que en
// tablets no quede desproporcionada.
const TAMANO_CELEBRACION = Math.min(Dimensions.get("window").width * 0.6, 320);

// Cuanto se muestra la celebracion antes de cerrar. Da tiempo a ver el gesto
// completo sin que el usuario sienta que la app dejo de responderle.
const SUCCESS_FEEDBACK_MS = 1600;

const WEEKDAY_ORDER: DayOfWeek[] = [
  "Lunes",
  "Martes",
  "Miercoles",
  "Jueves",
  "Viernes",
  "Sabado",
  "Domingo",
];

export default function CreateActivityView({ navigation, route }: any) {
  const { colors, comfyColors, comfyFontColors } = useTheme();
  const styles = useMemo(() => createStyles(colors, comfyColors, comfyFontColors), [colors]);
  const insets = useSafeAreaInsets();
  const { activities } = useActivityStore();
  const activityIdParam = route.params?.activityId;
  /** El mensaje del chat cuya propuesta se vino a ajustar, si vino de ahi. */
  const origenChatId = route.params?.origenChatId;
  /**
   * Dia puntual desde el mes ("Solo este día").
   *
   * Se valida por forma y no se confia: un parametro con otra cosa debe
   * degradar al flujo estandar, no romper el wizard.
   */
  const fechaUnica = useMemo(() => {
    const valor = route.params?.fechaUnica;
    return typeof valor === "string" && /^\d{4}-\d{2}-\d{2}$/.test(valor)
      ? valor
      : null;
  }, [route.params?.fechaUnica]);

  const existingActivity = useMemo(() => {
    if (!activityIdParam) return null;
    return activities.find(a => a.id === activityIdParam) || null;
  }, [activityIdParam, activities]);

  const [step, setStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [justSaved, setJustSaved] = useState(false);
  const [activeDay, setActiveDay] = useState<DayOfWeek | null>(null);

  /**
   * Día sintético: el día de semana de la fecha preset.
   *
   * La configuración horaria vive por día en `daysDict`, así que el modo
   * solo-día necesita un día donde asentarla para que el paso de horarios
   * funcione sin cambios. Al guardar, ese día NO viaja como recurrente:
   * `handleSaveActivity` manda `days: []` cuando hay `fechaUnica`.
   */
  const diaSintetico = useMemo<DayOfWeek | null>(() => {
    if (!fechaUnica) return null;
    const [y, m, d] = fechaUnica.split("-").map(Number);
    // Lunes primero, igual que WEEKDAY_ORDER; getDay() es domingo-primero.
    return WEEKDAY_ORDER[(new Date(y, m - 1, d).getDay() + 6) % 7];
  }, [fechaUnica]);

  // El preset siembra su día sintético una sola vez, al montar y solo al
  // crear. Editar una actividad existente no debe pisar sus días reales.
  useEffect(() => {
    if (!diaSintetico || activityIdParam) return;
    setSelectedDays([diaSintetico]);
    formErrors.limpiar("dias");
    // Solo al montar: el preset no cambia mientras el wizard está abierto.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const translateY = useRef(new Animated.Value(SHEET_HEIGHT)).current;
  
  const backdropOpacity = translateY.interpolate({
    inputRange: [0, SHEET_HEIGHT],
    outputRange: [1, 0],
  });

  // useNativeDriver queda en false a proposito, aunque para una transform
  // sea lo natural: el PanResponder del arrastre hace translateY.setValue(),
  // y React Native no permite escribir desde JS un valor que ya se movio al
  // driver nativo. Mezclarlos deja el sheet en un estado inconsistente.
  //
  // El costo es nulo aqui: es una sola transform sobre una vista, no una
  // lista larga.
  useEffect(() => {
    Animated.spring(translateY, {
      toValue: 0,
      useNativeDriver: false,
      damping: 22,
      stiffness: 180,
      mass: 0.9,
    }).start();
  }, [translateY]);

  const closeSheet = () => {
    Animated.timing(translateY, {
      toValue: SHEET_HEIGHT,
      duration: 220,
      useNativeDriver: false,
    }).start(() => navigation.goBack());
  };

  /**
   * La salida al chat.
   *
   * No se descarta lo escrito: el borrador ya se guarda solo, asi que volver
   * al formulario lo encuentra donde estaba. Cambiar de camino no deberia
   * costar el trabajo hecho.
   *
   * Solo al crear. Editando ya hay una actividad concreta, y contarsela al
   * asistente abriria una segunda en vez de tocar esa.
   */
  const irAlAsistente = () => {
    Animated.timing(translateY, {
      toValue: SHEET_HEIGHT,
      duration: 220,
      useNativeDriver: false,
    }).start(() => {
      navigation.goBack();
      navigation.navigate("AIChatView");
    });
  };

  // The sheet can be dismissed three ways — the X, the backdrop, and a 130px
  // swipe — and none of them used to warn, so any of the three silently threw
  // away everything the user had entered. There is no draft persistence yet
  // (that lands with the wizard redesign), so a confirmation is the guard.
  const requestCloseRef = useRef<() => void>(closeSheet);
  const isDirtyRef = useRef(false);

  const settleSheet = (onDone?: () => void) => {
    Animated.spring(translateY, {
      toValue: 0,
      useNativeDriver: false,
      damping: 22,
      stiffness: 180,
    }).start(() => onDone?.());
  };

  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, gesture) =>
        gesture.dy > 8 && Math.abs(gesture.dy) > Math.abs(gesture.dx),
      onPanResponderMove: (_, gesture) => {
        if (gesture.dy > 0) translateY.setValue(gesture.dy);
      },
      onPanResponderRelease: (_, gesture) => {
        if (gesture.dy > DISMISS_DISTANCE || gesture.vy > 0.8) {
          if (!isDirtyRef.current) {
            closeSheet();
            return;
          }
          // Snap back before asking, so the sheet is not left mid-gesture
          // while the prompt is up or if the user chooses to keep editing.
          settleSheet(() => requestCloseRef.current());
          return;
        }
        settleSheet();
      },
    }),
  ).current;

  const formErrors = useFormErrors();

  /**
   * Antes esto era Alert.alert. El popup tapaba la pantalla justo cuando el
   * usuario necesitaba ver que estaba mal, desaparecia al tocarlo —asi que
   * habia que reintentar para volver a leerlo— y describia el problema sin
   * senalar donde estaba.
   */
  const showAlert = (text: string, campo: CampoConError = "general") => {
    formErrors.setError(campo, text);
  };

  const {
    selectedDays,
    editingGroupId,
    daysDict,
    groups,
    handleSelect,
    isDayConfigured,
    handleUpdateFrequency,
    handleEditGroup,
    handleDiscardGroup,
    setEditingGroupId,
    setSelectedDays,
    setDaysDict,
    setNextGroupId,
    nextGroupId,
  } = useFrequency();

  const {
    activityId,
    setActivityId,
    activityName,
    isFixed,
    identity,
    area,
    priority,
    difficulty,
    deadline,
    durationTimeValue,
    travelToValue,
    travelFromValue,
    startTime,
    endTime,
    partitions,
    activePartitionIndex,
    preferredStartTime,
    preferredEndTime,
    optionalDay,
    dayFrom,
    dayTo,
    isAnchor,
    setActivityName,
    setIsFixed,
    comportamiento,
    setComportamiento,
    setIdentity,
    setArea,
    setPriority,
    setDifficulty,
    setDeadline,
    setDurationTime,
    setTravelToValue,
    setTravelFromValue,
    validatePartitions,
    validateOverlapWithSchedule,
    handleSaveActivity,
    setPartitions,
    setActivePartitionIndex,
    setStartTime,
    setEndTime,
    handleAddPartition,
    handleDiscardPartition,
    resetPartitions,
    setPreferredStartTime,
    setPreferredEndTime,
    setOptionalDay,
    setDayFrom,
    setDayTo,
    setIsAnchor,
  } = useTimeForm(
    // Los errores de validacion del hook van al mismo lugar que los de la
    // pantalla: bajo el campo, y no a un popup que tapa lo que hay que ver.
    (campo, mensaje) => formErrors.setError(campo, mensaje),
  );

  /**
   * Qué falta para poder avanzar, y si eso hace que el botón primario no
   * permita continuar.
   *
   * Los errores de validación viven bajo su campo, pero el campo puede estar
   * arriba y el botón abajo: quien mira el pie de la pantalla no ve el rojo.
   * Por eso el botón se muestra "apagado" cuando falta algo requerido, y al
   * tocarlo igual responde con una alerta que dice qué falta — un botón
   * realmente deshabilitado tocaría y no haría nada, y eso es justo el
   * "no funciona" que venimos a evitar.
   */
  const faltantes = useMemo(() => {
    const falta: string[] = [];
    // El nombre es el único que siempre bloquea: sin él no hay actividad.
    if (!activityName.trim()) falta.push("el nombre");
    if (step === 1) {
      // Los días solo bloquean a las fijas y anclas: una flexible sin días
      // marcados se entiende como "todos los días" (ver handleContinueFromDays).
      if ((isFixed || isAnchor) && selectedDays.length === 0) {
        falta.push("al menos un día");
      }
    }
    return falta;
  }, [activityName, step, isFixed, isAnchor, selectedDays]);

  const hayFaltantes = faltantes.length > 0;

  /** Alerta global que explica qué falta, para quien mira el pie de la pantalla. */
  const alertarFaltantes = () => {
    const ultimo = faltantes.length - 1;
    const descripcion = faltantes
      .map((f, i) => (i === ultimo && faltantes.length > 1 ? ` y ${f}` : f))
      .join(faltantes.length > 1 ? ", " : "");
    Alert.alert(
      "Faltan campos requeridos",
      `Para continuar, completá ${descripcion}.`
    );
  };

  // Load existing activity for editing
  useEffect(() => {
    if (existingActivity) {
      const act = existingActivity;
      setActivityId(act.id);
      setActivityName(act.title);
      // El orden ya no importa: la identidad dejo de arrastrar el
      // comportamiento, asi que una clase puede ser flexible y una tarea
      // puede tener hora fija, que es como la gente realmente las usa.
      setIdentity(act.identity);
      setArea(act.area);
      setIsFixed(act.isFixed());
      setPriority(act.priority === 5 ? "alta" : act.priority === 3 ? "media" : "baja");
      setDifficulty(act.difficulty);
      setDeadline(act.deadline ? new Date(act.deadline) : null);
      setPreferredStartTime(act.preferredStartTime ?? null);
      setPreferredEndTime(act.preferredEndTime ?? null);
      setOptionalDay(act.optionalDay ?? false);
      setDayFrom(act.dayFrom ?? null);
      setDayTo(act.dayTo ?? null);
      setIsAnchor(act.isAnchor ?? false);
      setDaysDict(act.daysConfig || {});
      
      const configured = Object.keys(act.daysConfig || {}) as DayOfWeek[];
      setSelectedDays(configured);

      const maxGroupId = Math.max(...Object.values(act.daysConfig || {}).map((cfg: any) => cfg?.groupId ?? 0), 0);
      setNextGroupId(maxGroupId + 1);
    }
  }, [existingActivity]);

  // Synchronize optionalDay, isAnchor, and dayRange variables based on activity type and anchor choice
  useEffect(() => {
    setDayFrom(null);
    setDayTo(null);
    if (!isFixed) {
      setOptionalDay(!isAnchor);
    } else {
      setOptionalDay(false);
    }
  }, [isAnchor, isFixed]);

  const configuredDays = useMemo(
    () => (Object.keys(daysDict) as DayOfWeek[]).sort(
      (a, b) => WEEKDAY_ORDER.indexOf(a) - WEEKDAY_ORDER.indexOf(b)
    ),
    [daysDict],
  );

  const totalMinutes = useMemo(
    () =>
      configuredDays.reduce((total, day) => {
        const config = daysDict[day];
        if (!config) return total;
        return (
          total +
          config.partitions.reduce(
            (sum, partition) =>
              sum + partition.durationTime + (partition.travelTo ?? 0) + (partition.travelFrom ?? 0),
            0,
          )
        );
      }, 0),
    [configuredDays, daysDict],
  );

  // Sync partitions AND preferred times for the ACTIVE DAY only
  useEffect(() => {
    if (step === 2 && activeDay !== null) {
      setDaysDict(prev => {
        const next = { ...prev };
        if (!isFixed && !isAnchor) {
          // Sync to all days for pure flexible activities
          (Object.keys(next) as DayOfWeek[]).forEach(day => {
            next[day] = {
              ...next[day]!,
              partitions: [...partitions],
              preferredStartTime: preferredStartTime,
              preferredEndTime: preferredEndTime,
            };
          });
        } else {
          // Sync only to active day for fixed AND anchor activities
          const current = next[activeDay];
          if (current) {
            next[activeDay] = {
              ...current,
              partitions: [...partitions],
              preferredStartTime: preferredStartTime,
              preferredEndTime: preferredEndTime,
            };
          }
        }
        return next;
      });
    }
  }, [partitions, preferredStartTime, preferredEndTime, activeDay, step, isFixed, isAnchor]);

  const handleContinueFromDays = () => {
    let currentSelected = [...selectedDays];
    if (!isFixed && !isAnchor && currentSelected.length === 0) {
      currentSelected = [...WEEKDAY_ORDER];
    }

    if (currentSelected.length === 0) {
      showAlert("Selecciona al menos un día para la actividad", "dias");
      return;
    }

    setSelectedDays(currentSelected);

    const next = { ...daysDict };
    
    // 1. Remove days not in currentSelected
    (Object.keys(next) as DayOfWeek[]).forEach((day) => {
      if (!currentSelected.includes(day)) {
        delete next[day];
      }
    });

    // 2. Add newly selected days
    const newDays = currentSelected.filter((day) => !next[day]);
    let updatedNextGroupId = nextGroupId;
    if (newDays.length > 0) {
      const existingDay = (Object.keys(next) as DayOfWeek[])[0];
      const existingConfig = existingDay ? next[existingDay] : null;

      const defaultPartitions = existingConfig && !isFixed
        ? existingConfig.partitions.map(p => ({ ...p, startHour: new Date(p.startHour), endHour: new Date(p.endHour) }))
        : (() => {
            const start = nextRoundHour();
            return [
              {
                startHour: start,
                endHour: calculateEndTime(start, 60),
                durationTime: 60,
                travelTo: 0,
                travelFrom: 0,
              },
            ];
          })();

      const prefStart = existingConfig && !isFixed ? existingConfig.preferredStartTime : undefined;
      const prefEnd = existingConfig && !isFixed ? existingConfig.preferredEndTime : undefined;

      newDays.forEach((day) => {
        next[day] = {
          partitions: defaultPartitions,
          groupId: (isFixed || isAnchor) ? updatedNextGroupId : (existingConfig?.groupId ?? updatedNextGroupId),
          preferredStartTime: prefStart,
          preferredEndTime: prefEnd,
        };
        if (isFixed || isAnchor) {
          updatedNextGroupId++;
        }
      });
      if (!isFixed && !isAnchor && newDays.length > 0 && !existingConfig) {
        updatedNextGroupId++;
      }
      setNextGroupId(updatedNextGroupId);
    }

    setDaysDict(next);

    // 3. Select the first day as active
    const firstDay = (Object.keys(next) as DayOfWeek[])[0];
    const firstConfig = firstDay ? next[firstDay] : undefined;
    if (firstDay && firstConfig) {
      setActiveDay(firstDay);
      setPartitions(firstConfig.partitions);
      setPreferredStartTime(firstConfig.preferredStartTime ?? null);
      setPreferredEndTime(firstConfig.preferredEndTime ?? null);
      setActivePartitionIndex(0);
    }

    setStep(2);
  };

  const handleCopyConfig = (fromDay: DayOfWeek) => {
    const sourceConfig = daysDict[fromDay];
    if (sourceConfig) {
      const clonedPartitions = sourceConfig.partitions.map((p) => ({
        ...p,
        startHour: new Date(p.startHour),
        endHour: new Date(p.endHour),
      }));
      setPartitions(clonedPartitions);
      setPreferredStartTime(sourceConfig.preferredStartTime ?? null);
      setPreferredEndTime(sourceConfig.preferredEndTime ?? null);
      setActivePartitionIndex(0);
    }
  };

  const handleSwitchDay = (day: DayOfWeek) => {
    setActiveDay(day);
    const config = daysDict[day];
    if (config) {
      setPartitions(config.partitions);
      setPreferredStartTime(config.preferredStartTime ?? null);
      setPreferredEndTime(config.preferredEndTime ?? null);
      setActivePartitionIndex(0);
    }
  };

  const handleCopyToAll = () => {
    if (!activeDay) return;
    const sourceConfig = daysDict[activeDay];
    if (!sourceConfig) return;

    const clonedPartitions = sourceConfig.partitions.map((p) => ({
      ...p,
      startHour: new Date(p.startHour),
      endHour: new Date(p.endHour),
    }));

    setDaysDict(prev => {
      const next = { ...prev };
      (Object.keys(next) as DayOfWeek[]).forEach(day => {
        if (day !== activeDay) {
          next[day] = {
            ...next[day]!,
            partitions: [...clonedPartitions],
            preferredStartTime: sourceConfig.preferredStartTime ?? null,
            preferredEndTime: sourceConfig.preferredEndTime ?? null,
          };
        }
      });
      return next;
    });
  };

  const handlePrimaryPress = () => {
    // Guardia global: sin los campos requeridos no se avanza (ni se crea).
    // El botón ya se ve "apagado" cuando falta algo (estilo en el render),
    // pero igual se mastica el toque y se explica qué falta con una alerta,
    // en vez de tocar y que no pase nada.
    if (hayFaltantes) {
      alertarFaltantes();
      return;
    }

    if (step === 1) {
      // El paso junta nombre y dias, asi que valida los dos antes de avanzar.
      // Se comprueban ambos y no se corta en el primero: el usuario ve de una
      // vez todo lo que le falta, en vez de descubrirlo de a un error por
      // intento.
      const faltaNombre = !activityName.trim();
      if (faltaNombre) {
        showAlert("Ingresa un nombre para la actividad", "nombre");
      }
      if (faltaNombre) return;

      handleContinueFromDays();
      return;
    }

    // El resumen dejo de ser paso propio, asi que aca ya se crea.
    // No se revalida: handleCreate comprueba lo mismo y ademas sabe devolver
    // al usuario al paso donde esta el error.
    handleCreate();
  };

  const handleBackPress = () => {
    setStep((s) => Math.max(s - 1, 1));
  };

  const { guardar: guardarBorrador, recuperar: recuperarBorrador, limpiar: limpiarBorrador } =
    useWizardDraftStore();

  const resolverPropuestaDesdeWizard = useChatStore((s: any) => s.resolverPropuestaDesdeWizard);

  // Solo al crear. Editando ya hay una actividad de la cual partir, y
  // restaurar encima seria mezclar dos cosas distintas.
  const esCreacion = !activityIdParam;

  /**
   * Viniendo del chat si se restaura encima de una actividad existente.
   *
   * No es mezclar dos cosas: la propuesta describe justamente como deberia
   * quedar esa actividad. Sin esto, ajustar una modificacion abria el
   * formulario con los valores viejos y perdia lo que el asistente entendio.
   *
   * En modo solo-día tampoco: restaurar un borrador pisaria el día
   * sintético del preset con los días de otra creación.
   */
  const restauraBorrador = (esCreacion && !fechaUnica) || !!origenChatId;

  useEffect(() => {
    if (!restauraBorrador) return;
    const previo = recuperarBorrador();
    if (!previo) return;

    setActivityName(previo.activityName);
    setIdentity(previo.identity);
    setArea(previo.area);
    setComportamiento(previo.comportamiento);
    setSelectedDays(previo.selectedDays as DayOfWeek[]);
    setDaysDict(previo.daysDict);
    setDifficulty(previo.difficulty);
    setPriority(previo.priority);
    setDeadline(previo.deadline ? new Date(previo.deadline) : null);
    // Solo al montar: reaplicarlo en cada cambio pisaria lo que el usuario
    // acaba de escribir con lo que habia guardado antes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!esCreacion) return;
    // Una sesión con preset no es un borrador reanudable: al guardar o
    // cerrar, la próxima creación estándar no debe arrancar con este día.
    if (fechaUnica) return;
    // Sin nombre no hay nada que valga la pena restaurar, y guardar un
    // formulario vacio haria que la proxima apertura ofreciera basura.
    if (!activityName.trim()) return;

    guardarBorrador({
      activityName,
      area,
      identity,
      comportamiento,
      selectedDays,
      daysDict,
      difficulty,
      priority,
      deadline: deadline ? deadline.toISOString() : null,
    });
  }, [
    esCreacion,
    activityName,
    area,
    identity,
    comportamiento,
    selectedDays,
    daysDict,
    difficulty,
    priority,
    deadline,
    guardarBorrador,
  ]);

  const isDirty = useMemo(() => {
    if (activityIdParam) {
      // Editing: treat a renamed activity or any forward navigation as work
      // in progress worth protecting.
      return step > 1 || activityName.trim() !== (existingActivity?.title ?? "").trim();
    }
    return activityName.trim().length > 0 || selectedDays.length > 0 || step > 1;
  }, [activityIdParam, existingActivity, activityName, selectedDays, step]);

  const requestClose = useCallback(() => {
    if (!isDirty) {
      closeSheet();
      return;
    }

    // Al crear, cerrar dejo de ser destructivo: el borrador queda guardado y
    // al volver esta todo donde estaba. Preguntar aqui —y avisar de una
    // perdida que no ocurre— seria un obstaculo sobre algo que ya no pasa.
    if (!activityIdParam) {
      closeSheet();
      return;
    }

    // Editando si se pierde: el borrador solo cubre la creacion, porque
    // restaurarlo sobre una actividad existente mezclaria dos cosas.
    Alert.alert(
      "¿Descartar los cambios?",
      "Perderás lo que llevas configurado.",
      [
        { text: "Seguir editando", style: "cancel" },
        { text: "Descartar", style: "destructive", onPress: closeSheet },
      ],
    );
  }, [isDirty, activityIdParam]);

  // The PanResponder and the back handler are both created once, so they read
  // current values through refs rather than capturing the first render.
  const stepRef = useRef(step);
  const backPressRef = useRef(handleBackPress);

  /**
   * El cierre diferido tras el guardado exitoso. Si la pantalla se desmonta
   * antes —el usuario toca algo, o un test termina— dejarlo correr ejecutaria
   * goBack y la animacion sobre una pantalla muerta.
   */
  const cierrePendiente = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(
    () => () => {
      if (cierrePendiente.current) clearTimeout(cierrePendiente.current);
    },
    []
  );

  isDirtyRef.current = isDirty;
  requestCloseRef.current = requestClose;
  stepRef.current = step;
  backPressRef.current = handleBackPress;

  // Android's hardware back would otherwise pop the screen straight past the
  // guard. Within the wizard it should step backwards, not exit.
  useEffect(() => {
    const sub = BackHandler.addEventListener("hardwareBackPress", () => {
      if (stepRef.current > 1) {
        backPressRef.current();
      } else {
        requestCloseRef.current();
      }
      return true;
    });
    return () => sub.remove();
  }, []);

  const handleCreate = async () => {
    if (!activityName.trim()) {
      showAlert("Ingresa un nombre para la actividad", "nombre");
      setStep(1);
      return;
    }

    if (configuredDays.length === 0) {
      showAlert("Configura al menos un día antes de crear la actividad", "dias");
      setStep(2);
      return;
    }

    // Validate partitions and overlaps
    const daysToValidate = (isFixed || isAnchor) ? configuredDays : [configuredDays[0] || 'Lunes'];
    for (const day of daysToValidate) {
      const config = daysDict[day]!;
      if (!validatePartitions(config.partitions, [day])) {
        setStep(2);
        setActiveDay(day);
        setPartitions(config.partitions);
        setPreferredStartTime(config.preferredStartTime ?? null);
        setPreferredEndTime(config.preferredEndTime ?? null);
        return;
      }
      if (
        !validateOverlapWithSchedule(
          activityId,
          isFixed,
          [day],
          config.partitions,
          config.preferredStartTime ?? preferredStartTime,
          config.preferredEndTime ?? preferredEndTime,
          durationTimeValue,
        )
      ) {
        setStep(2);
        setActiveDay(day);
        setPartitions(config.partitions);
        setPreferredStartTime(config.preferredStartTime ?? null);
        setPreferredEndTime(config.preferredEndTime ?? null);
        return;
      }
    }

    setIsLoading(true);
    try {
      const idGuardado = await handleSaveActivity({
        daysDict,
        selectedDays,
        fechaUnica,
      });
      // Until now the sheet just vanished, with no sign the save had worked.
      // Hold the overlay on a confirmation beat before dismissing.
      setJustSaved(true);

      // Cerrar la propuesta del chat es parte de guardar, no un extra: si la
      // tarjeta queda pendiente con los valores viejos, confirmarla crea una
      // segunda actividad identica a la que se acaba de guardar.
      if (origenChatId) {
        resolverPropuestaDesdeWizard(
          origenChatId,
          idGuardado,
          wizardStateToParsed({
            activityName,
            identity,
            comportamiento,
            selectedDays,
            daysDict,
            difficulty,
            priority,
          })
        );
      }

      // La actividad ya existe: conservar el borrador haria que la proxima
      // creacion arrancara con los datos de esta.
      limpiarBorrador();
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => undefined);
      cierrePendiente.current = setTimeout(closeSheet, SUCCESS_FEEDBACK_MS);
    } catch (e) {
      console.error("Error saving activity:", e);
      setIsLoading(false);
      showAlert("Hubo un error al guardar la actividad. Por favor intenta de nuevo.");
    }
  };





  const handleEditGroupWrapper = (group: {
    groupId: number;
    days: DayOfWeek[];
    config: any;
  }) => {
    handleEditGroup({
      ...group,
      setPartitions,
      setActivePartitionIndex,
    });
    if (group.days.length > 0) {
      const firstConfig = daysDict[group.days[0]];
      if (firstConfig) {
        setPreferredStartTime(firstConfig.preferredStartTime ?? null);
        setPreferredEndTime(firstConfig.preferredEndTime ?? null);
      }
      setActiveDay(group.days[0]);
    }
    setStep(2);
  };

  const renderStep = () => {
    switch (step) {
      case 1:
        return (
          <WhatAndWhenStep
            activityName={activityName}
            area={area}
            isFixed={isFixed}
            difficulty={difficulty}
            priority={priority}
            deadline={deadline}
            onSetActivityName={(texto: string) => {
              setActivityName(texto);
              formErrors.limpiar("nombre");
            }}
            onSetArea={setArea}
            onSetIsFixed={setIsFixed}
            comportamiento={comportamiento}
            onSetComportamiento={setComportamiento}
            errorNombre={formErrors.error("nombre")}
            onSetDifficulty={setDifficulty}
            onSetPriority={setPriority}
            onSetDeadline={setDeadline}
            isAnchor={isAnchor}
            onToggleAnchor={setIsAnchor}
            selectedDays={selectedDays}
            daysDict={daysDict}
            configuredDaysCount={configuredDays.length}
            onSelectDay={handleSelect}
            isDayConfigured={isDayConfigured}
            errorDias={formErrors.error("dias")}
            fechaUnica={fechaUnica}
            onContarleAlAsistente={activityIdParam ? undefined : irAlAsistente}
          />
        );
      default:
        return (
          <TimesAndReviewStep
            configuredDays={(isFixed || isAnchor) ? configuredDays : [configuredDays[0] || 'Lunes']}
            partitions={partitions}
            activePartitionIndex={activePartitionIndex}
            startTime={startTime}
            endTime={endTime}
            durationTimeValue={durationTimeValue}
            travelToValue={travelToValue}
            travelFromValue={travelFromValue}
            isFixed={isFixed}
            isAnchor={isAnchor}
            preferredStartTime={preferredStartTime}
            preferredEndTime={preferredEndTime}
            onSetActivePartition={setActivePartitionIndex}
            onAddPartition={handleAddPartition}
            onDiscardPartition={handleDiscardPartition}
            onSetStartTime={setStartTime}
            onSetEndTime={setEndTime}
            onSetDurationTime={setDurationTime}
            onSetTravelToValue={setTravelToValue}
            onSetTravelFromValue={setTravelFromValue}
            onSetPreferredStartTime={setPreferredStartTime}
            onSetPreferredEndTime={setPreferredEndTime}
            activeDay={(isFixed || isAnchor) ? activeDay : (configuredDays[0] || 'Lunes')}
            onSwitchDay={handleSwitchDay}
            onCopyConfig={handleCopyConfig}
            onCopyToAll={handleCopyToAll}
            daysDict={daysDict}
            resumen={{
              activityName,
              isFixed,
              isAnchor,
              identity,
              priority,
              difficulty,
              deadline,
              configuredDays,
              totalMinutes,
              groups,
              editingGroupId,
              onEditGroup: handleEditGroupWrapper,
              onDiscardGroup: (gid: number) => {
                const groupDays = groups[gid]?.days || [];
                handleDiscardGroup(gid);
                setSelectedDays(prev => prev.filter(d => !groupDays.includes(d)));
                if (activeDay && groupDays.includes(activeDay)) {
                  setActiveDay(null);
                }
              },
            }}
          />
        );
    }
  };

  const primaryTitle = useMemo(() => {
    switch (step) {
      case 1:
        return "Continuar a horarios";
      case 2:
        return activityId ? "Guardar cambios" : "Crear actividad";
      default:
        return "Continuar";
    }
  }, [step, activityId]);

  const headerTitle = useMemo(() => {
    if (activityId) return "Editar Actividad";
    return "Nueva Actividad";
  }, [activityId]);

  const headerSubtitle = useMemo(() => {
    return `Paso ${step} de ${TOTAL_STEPS}`;
  }, [step]);

  return (
    <View style={styles.container}>
      <Animated.View style={[styles.backdrop, { opacity: backdropOpacity }]} pointerEvents="auto">
        <Pressable style={StyleSheet.absoluteFill} onPress={requestClose} />
      </Animated.View>
      <Animated.View style={[styles.sheet, { transform: [{ translateY }] }]}>
        <View style={styles.dragArea} {...panResponder.panHandlers}>
          <View style={styles.dragHandle} />
        </View>

        <View style={styles.header}>
          <View>
            <Text style={styles.title}>{headerTitle}</Text>
            {headerSubtitle && <Text style={styles.stepText}>{headerSubtitle}</Text>}
          </View>
          <TouchableOpacity style={styles.closeButton} onPress={requestClose}>
            <Ionicons
              name="close"
              size={32}
              color={comfyFontColors.green}
            />
          </TouchableOpacity>
        </View>

        <ProgressIndicator totalSteps={TOTAL_STEPS} currentStep={step} />

        {renderStep()}

        <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, 24) }]}>
          {step > 1 && (
            <TouchableOpacity
              style={[
                styles.secondaryButton,
                step === 2 && { flex: 1 }
              ]}
              onPress={handleBackPress}
            >
              <Text style={styles.secondaryButtonText}>Atrás</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity
            style={[
              styles.primaryButton,
              step > 1 && styles.primaryButtonWithBack,
              hayFaltantes && styles.primaryButtonDisabled,
            ]}
            onPress={handlePrimaryPress}
          >
            <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
              <Text style={styles.primaryButtonText}>{primaryTitle}</Text>
            </View>
          </TouchableOpacity>
        </View>
      </Animated.View>

      {isLoading && (
        <View style={styles.loadingOverlay}>
          {justSaved ? (
            // El sapo celebra el guardado. Es el unico momento del wizard con
            // algo que celebrar, y la Fase 0 ya habia puesto aca el check y la
            // haptica: la animacion completa ese gesto en vez de agregar otro.
            <Sapo estado="happy" size={TAMANO_CELEBRACION} />
          ) : (
            <ActivityIndicator size="large" color={colors.secondaryAccent} />
          )}
          <Text style={styles.loadingText}>
            {justSaved
              ? activityId
                ? "¡Cambios guardados!"
                : "¡Actividad creada!"
              : "Guardando actividad..."}
          </Text>
        </View>
      )}
    </View>
  );
}

function createStyles(colors: ThemeColors, comfyColors: Record<string, string>, comfyFontColors: Record<string, string>) {
  return StyleSheet.create({
    container: {
      flex: 1,
      justifyContent: "flex-end",
    },
    backdrop: {
      ...StyleSheet.absoluteFillObject,
      backgroundColor: "rgba(10, 11, 18, 0.62)",
    },
    sheet: {
      height: SHEET_HEIGHT,
      backgroundColor: colors.screenBackground,
      borderTopLeftRadius: 54,
      borderTopRightRadius: 54,
      paddingTop: 10,
      overflow: "hidden",
    },
    dragArea: {
      alignItems: "center",
      paddingTop: 8,
      paddingBottom: 16,
    },
    dragHandle: {
      width: 64,
      height: 6,
      borderRadius: 999,
      backgroundColor: colors.cardBorder,
    },
    header: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingHorizontal: 20,
    },
    title: {
      color: colors.surface,
      fontSize: 24,
      fontWeight: "800",
      letterSpacing: -1,
    },
    stepText: {
      color: "#8dccff",
      fontSize: 12,
      fontWeight: "800",
      marginTop: 2,
    },
    closeButton: {
      width: 44,
      height: 44,
      borderRadius: 14,
      backgroundColor: comfyColors.green,
      alignItems: "center",
      justifyContent: "center",
    },
    footer: {
      flexDirection: "row",
      gap: 14,
      paddingHorizontal: 20,
      paddingTop: 12,
      paddingBottom: 24,
    },
    primaryButton: {
      flex: 1,
      backgroundColor: comfyColors.green,
      borderRadius: 24,
      alignItems: "center",
      justifyContent: "center",
      minHeight: 56,
    },
    primaryButtonWithBack: {
      flex: 2,
    },
    primaryButtonDisabled: {
      opacity: 0.45,
    },
    primaryButtonText: {
      color: comfyFontColors.green,
      fontSize: 18,
      fontWeight: "900",
    },
    secondaryButton: {
      flex: 1,
      backgroundColor: colors.cardBackground,
      borderRadius: 24,
      alignItems: "center",
      justifyContent: "center",
      minHeight: 56,
    },
    secondaryButtonText: {
      color: colors.surface,
      fontSize: 16,
      fontWeight: "900",
    },
    loadingOverlay: {
      ...StyleSheet.absoluteFillObject,
      backgroundColor: "rgba(10, 11, 18, 0.8)",
      justifyContent: "center",
      alignItems: "center",
      zIndex: 9999,
    },
    loadingText: {
      color: colors.surface,
      fontSize: 16,
      fontWeight: "800",
      marginTop: 12,
    },

    // NL Parse Section

  });
}
