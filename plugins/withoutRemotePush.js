const { withEntitlementsPlist } = require('expo/config-plugins');

/**
 * Quita `aps-environment` de los entitlements de iOS.
 *
 * El plugin de expo-notifications lo agrega siempre, pero esa entrada es la
 * que declara la capability de Push Notifications, y una cuenta personal de
 * Apple no puede firmarla: Xcode falla con "Personal development teams do not
 * support the Push Notifications capability".
 *
 * Esta app no usa push remoto. Todas sus notificaciones son locales
 * —recordatorios programados en el propio dispositivo, ver
 * ExpoNotificationScheduler— y esas funcionan sin ningun entitlement.
 *
 * Va como plugin y no editando ios/ a mano porque esa carpeta se regenera:
 * un `expo prebuild --clean` borraria el arreglo y el error volveria.
 *
 * IMPORTANTE: en app.json tiene que ir ANTES de "expo-notifications".
 * Los mods se encadenan al reves de como se registran, asi que el que figura
 * primero corre ultimo. Puesto despues, expo-notifications vuelve a agregar
 * la entrada —su codigo es `if (!config.modResults['aps-environment'])`, o
 * sea que la repone en cuanto la encuentra ausente— y el error reaparece.
 *
 * Si algun dia se agrega push de verdad, hay que sacar este plugin Y pagar la
 * cuenta de desarrollador: sin las dos cosas, no compila.
 */
module.exports = function withoutRemotePush(config) {
  return withEntitlementsPlist(config, (config) => {
    delete config.modResults['aps-environment'];
    return config;
  });
};
