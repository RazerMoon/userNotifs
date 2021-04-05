const { Plugin } = require('powercord/entities');
const { React, FluxDispatcher, getModule } = require('powercord/webpack');
const { inject, uninject } = require('powercord/injector');
const { findInReactTree } = require('powercord/util');

const Settings = require('./ui/Settings.jsx');
const addUser = require('./utils/addUser');

/**
 * Creates a notification when a specified user sends a message
 * @link https://github.com/RazerMoon/userNotifs
 * @license MIT
 * @extends Plugin
 */
module.exports = class UserNotifs extends Plugin {
  startPlugin () {
    powercord.api.settings.registerSettings(this.entityID, {
      category: this.entityID,
      label: 'User Notifs',
      render: Settings
    });

    FluxDispatcher.subscribe('MESSAGE_CREATE', this.handleMessage);

    this.patchUserCM();
  }

  async patchUserCM () {
    const Menu = await getModule((m) => (m.__powercordOriginal_default || m.default)?.displayName === 'Menu');
    const mod = await getModule((m) => (m.__powercordOriginal_default || m.default)?.displayName === 'GuildChannelUserContextMenu');

    inject('usernotifs-usercm-patch', mod, 'default', ([ { user } ], res) => {
      const hasNotifyButton = findInReactTree(res.children, child => child.props && child.props.id === 'notify');

      if (!hasNotifyButton) {
        const addUserButton = React.createElement(Menu.MenuItem, {
          id: 'notify',
          label: 'Notify on Message',
          action: () => addUser(user, this.settings)
        });

        const devmodeItem = findInReactTree(res.props, child => child.props && child.props.id === 'devmode-copy-id');
        const developerGroup = findInReactTree(res.props, child => child.props && child.props.children === devmodeItem);

        if (developerGroup) {
          if (!Array.isArray(developerGroup.props.children)) {
            developerGroup.props.children = [ developerGroup.props.children ];
          }

          developerGroup.props.children.push(addUserButton);
        } else {
          res.props.children.props.children.push([ React.createElement(Menu.MenuSeparator), React.createElement(Menu.MenuGroup, {}, addUserButton) ]);
        }
      }

      return res;
    });
  }

  async handleMessage ({ message }) {
    // ? this.settings causes discord to freak out here
    // ! Small errors here cause discord to crash loop
    const idlist = powercord.pluginManager.plugins.get('userNotifs').settings.get('idlist', []);
    if (idlist.includes(message.author.id)) {
      const user = powercord.pluginManager.plugins.get('userNotifs').settings.get('details', []).find(item => item.id === message.author.id);
      const mod = await getModule([ 'showNotification' ]);

      if (!user) {
        console.log('[userNotifs] Something went wrong when fetching the user!');
        return null;
      }

      const img = await getModule([ 'getUserAvatarURL', 'getGuildIconURL' ]);

      console.log(message.author);
      console.log(user);

      // ! Doesn't work with animated avatars
      mod.showNotification(img.getUserAvatarURL(message.author, 'png'), `${message.author.username}#${message.author.discriminator}`, message.content, { onClick: async () => {
        const trans = await getModule([ 'transitionTo' ]);

        // Yoinked from https://gist.github.com/jiangzhuo/793f6d120607bb71f30c45f4fa6ea00a
        trans.transitionTo(`/channels/${message.guild_id ? message.guild_id : '@me'}/${message.channel_id}/${message.id}`);
      } });
    }
  }

  pluginWillUnload () {
    powercord.api.settings.unregisterSettings(this.entityID);
    uninject('usernotifs-usercm-patch');
    FluxDispatcher.unsubscribe('MESSAGE_CREATE', this.handleMessage);
  }
};
