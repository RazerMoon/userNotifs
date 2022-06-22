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
 * Removes user from the list
 * @param {string} id ID of the user
 * @param {Object} settings Settings object for plugin with get and set methods
 * @param {getSetting} settings.get
 * @param {setSetting} settings.set
 * @returns
 */
module.exports = function removeUser (id, settings = powercord.pluginManager.plugins.get('userNotifs').settings) {
  const list = settings.get('idlist', []);
  const details = settings.get('details', []);

  if (!list || !details || list.length === 0 || details.length === 0) {
    return;
  }

  if (list.includes(id)) {
    settings.set(
      'idlist',
      list.filter((item) => item !== id)
    );
  }

  if (details.some((item) => item.id === id)) {
    settings.set(
      'details',
      details.filter((item) => item.id !== id)
    );
  }
};
