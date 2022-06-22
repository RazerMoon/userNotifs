/**
 * Returns the value of a setting
 * @callback getSetting
 * @param {String} name Name of the setting
 * @param {*} defaultValue Default value for setting
 */

/**
 * Sets the value of a setting
 * @callback setSetting
 * @param {String} name Name of the setting
 * @param {*} newValue New value to set
 */

/**
 * Adds user to list.
 * @param {string} user Author object
 * @param {Object} settings Settings object for plugin with get and set methods
 * @param {getSetting} settings.get
 * @param {setSetting} settings.set
 * @returns
 */
module.exports = function addUser (user, settings = powercord.pluginManager.plugins.get('userNotifs').settings) {
  const list = settings.get('idlist', []);
  const details = settings.get('details', []);

  if (!list.includes(user.id)) {
    list.push(user.id);
  }

  if (!details.some(item => item.id === user.id)) {
    details.push(user);
  }

  // eslint-disable-next-line no-warning-comments
  // TODO: Don't update if nothing changed
  settings.set('idlist', list);
  settings.set('details', details);
};
