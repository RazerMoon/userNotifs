const { React } = require('powercord/webpack');
const { Button } = require('powercord/components');
const { TextInput, ButtonItem, Category, SwitchItem } = require('powercord/components/settings');
const addUser = require('../utils/addUser');
const removeUser = require('../utils/removeUser');

// eslint-disable-next-line no-warning-comments
// TODO: Make the channel items more distinct/seperate from the actual settings
// eslint-disable-next-line no-warning-comments
// TODO: Add avatar preview
module.exports = ({ getSetting, updateSetting, settings, toggleSetting }) => {
  const removeAll = () => {
    updateSetting('idlist', []);
    updateSetting('details', []);
  };

  const [ userField, setUserField ] = React.useState('');
  const [ idField, setIdField ] = React.useState('');

  const [ opened, onChange ] = React.useState(true);

  return (
    <div>
      <ButtonItem
        note="Log all setting data to console"
        button="Do it"
        onClick={() => console.dir(settings)}
      >
        Log data
      </ButtonItem>
      <ButtonItem
        note="Remove all user data"
        button="Do it"
        onClick={() => removeAll()}
      >
        Reset
      </ButtonItem>
      <SwitchItem
        note={'Whether you want to be notified if you receive a DM from a user you\'re listening for'}
        value={getSetting('dm', false)}
        onChange={() => toggleSetting('dm')}
      >
        Notify on DM
      </SwitchItem>
      <Category name="Users" description="Users whose messages you are listening for" opened={opened} onChange={onChange} >
        <div style={{ display: 'flex',
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center' }}>
          <TextInput
            note="Whatever you like"
            onChange={setUserField}
          >
        Username
          </TextInput>
          <TextInput
            note="The user's Discord ID"
            onChange={setIdField}
          >
        ID
          </TextInput>
          <Button
            size={Button.Sizes.MEDIUM}
            color={Button.Colors.GREEN}
            onClick={() => {
              console.log('Adding user');
              addUser({ username: `${userField} (Manual)`,
                id: idField }, { get: getSetting,
                set: updateSetting });
            }}
          >Add</Button>
        </div>
        {getSetting('details', []).map(({ id, username, discriminator }) => (
          <ButtonItem
            note={`ID: ${id}`}
            button="Remove"
            onClick={() => removeUser(id, { get: getSetting,
              set: updateSetting })}
          >
            {username}{discriminator ? `#${discriminator}` : ''}
          </ButtonItem>
        ))}
      </Category>
    </div>
  );
};
