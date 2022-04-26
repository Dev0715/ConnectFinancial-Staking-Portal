import React from 'react';
import Wallet from './Wallet';
import logo from '../../assets/logo.svg';
import {
  useGlobalDispatchContext,
  useGlobalStateContext,
} from '../../context/Context';

const Header = () => {
  const [address, setAddress] = React.useState(undefined);
  const { faux, signer } = useGlobalStateContext();
  const { setAccount, setFaux } = useGlobalDispatchContext();

  function handleSubmit() {
    setFaux(true);
    setAccount(address);
  }
  function handleChange(e) {
    setAddress(e.target.value);
  }
  async function handleClear() {
    signer
      .getAddress()
      .then(add => {
        setAccount(add);
        setFaux(false);
        setAddress('');
      })
      .catch(() => {
        setAccount(null);
        setFaux(false);
        setAddress('');
      });
  }
  return (
    <div className='header'>
      <div
        className='header-inner'
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          width: '100%',
        }}
      >
        <img
          className='logo'
          alt=''
          src={logo}
          style={{
            maxWidth: '200px',
          }}
        />
        <Wallet />
      </div>
      <div
        style={{
          display: 'flex',
          justifyContent: 'flex-end',
          width: '100%',
          padding: 15,
        }}
      >
        <input
          type='text'
          className='addressInput'
          placeholder='Enter address to view'
          value={address}
          onChange={handleChange}
        />
        <button onClick={handleSubmit} className='buttonbarbutton nominwidth'>
          Search
        </button>
        {faux && (
          <button
            onClick={handleClear}
            className='buttonbarbutton nominwidth red'
          >
            {' '}
            Clear
          </button>
        )}
      </div>
    </div>
  );
};

export default Header;
