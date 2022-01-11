const { Plugin } = require('powercord/entities');
const { React, FluxDispatcher, getModule } = require('powercord/webpack');
const { inject, uninject } = require('powercord/injector');
const { findInReactTree } = require('powercord/util');

const Settings = require('./ui/Settings.jsx');
const addUser = require('./utils/addUser');
const removeUser = require('./utils/removeUser');

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

    FluxDispatcher.subscribe('MESSAGE_CREATE', this.handleMessage.bind(this));

    this.patchListener = this.patchListener.bind(this);

    document.addEventListener('mousedown', this.patchListener);
  }

  patchListener (e) {
    console.dir(e);
    if (e.button === 2 && e.target?.tagName === 'IMG' && e.target.className.includes('avatar')) {
      setTimeout(() => {
        this.patchUserCM();
        console.log('Patched');
        document.removeEventListener('mousedown', this.patchListener);
      }, 500);
    }
  }

  async patchUserCM () {
    const Menu = await getModule((m) => (m.__powercordOriginal_default || m.default)?.displayName === 'Menu');
    const mod = await getModule((m) => (m.__powercordOriginal_default || m.default)?.displayName === 'GuildChannelUserContextMenu');

    inject('usernotifs-usercm-patch', mod, 'default', ([ { user } ], res) => {
      if (!res) {
        return res;
      }

      const hasNotifyButton = findInReactTree(res.children, child => child.props && child.props.id === 'notify');

      if (!hasNotifyButton) {
        const userOnList = this.settings.get('idlist', []).includes(user.id);

        const addUserButton = React.createElement(Menu.MenuItem, {
          id: 'notify',
          label: userOnList ? 'Stop Message Notifs' : 'Notify on Message',
          action: () => userOnList ? removeUser(user.id, this.settings) : addUser(user, this.settings)
        });

        const devmodeItem = findInReactTree(res.props, child => child.props && child.props.id === 'devmode-copy-id');
        const developerGroup = findInReactTree(res.props, child => child.props && child.props.children === devmodeItem);

        if (developerGroup) {
          if (!Array.isArray(developerGroup.props.children)) {
            developerGroup.props.children = [ developerGroup.props.children ];
          }

          developerGroup.props.children.splice(developerGroup.props.children.length - 1, 0, addUserButton);
        } else {
          res.props.children.props.children.splice(res.props.children.props.children.length - 1, 0, [ React.createElement(Menu.MenuSeparator), React.createElement(Menu.MenuGroup, {}, addUserButton) ]);
        }
      }

      return res;
    });
  }

  async handleMessage ({ message }) {
    // ! Small errors here cause discord to crash loop
    const idlist = this.settings.get('idlist', []);
    if (idlist.includes(message.author.id)) {
      const user = this.settings.get('details', []).find(item => item.id === message.author.id);

      const modules = await Promise.all([ getModule([ 'showNotification' ]), getModule([ 'getUserAvatarURL', 'getGuildIconURL' ]), getModule([ 'transitionTo' ]), getModule([ 'getChannel', 'getDMFromUserId' ]), getModule([ 'getGuild' ]) ]);

      if (!user) {
        console.log('[userNotifs] Something went wrong when fetching the user!');
        return null;
      }

      const channel = modules[3].getChannel(message.channel_id);

      const getChannel = () => {
        if (channel.isDM()) {
          return 'DM';
        }
        return `#${channel.name}, ${modules[4].getGuild(channel.getGuildId())}`;
      };

      const getUsername = ({ username, discriminator }) => `${username}#${discriminator}`;

      if (!this.settings.get('dm', false) && channel.isDM()) {
        return null;
      }

      // ! Doesn't work with animated avatars
      modules[0].showNotification(modules[1].getUserAvatarURL(message.author, 'png'), `${getUsername(message.author)} (${getChannel()})`, message.content, { onClick: () => {
        // Yoinked from https://gist.github.com/jiangzhuo/793f6d120607bb71f30c45f4fa6ea00a
        modules[2].transitionTo(`/channels/${message.guild_id ? message.guild_id : '@me'}/${message.channel_id}/${message.id}`);
      } });
    }
  }

  pluginWillUnload () {
    powercord.api.settings.unregisterSettings(this.entityID);
    uninject('usernotifs-usercm-patch');
    FluxDispatcher.unsubscribe('MESSAGE_CREATE', this.handleMessage);
  }
};
