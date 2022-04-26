import React from 'react';
import { startCase } from 'lodash';
import comma from 'comma-number';

const SidebarElement = ({ name, value }) => {
  return (
    <div className='tokenstatcontainer' key={name}>
      <div className='tokenstatlabel'>{startCase(name)}</div>
      <div className='tokenstatAmount'>{comma(value)}</div>
    </div>
  );
};

export default SidebarElement;
