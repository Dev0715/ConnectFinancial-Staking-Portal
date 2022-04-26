import React from 'react';
import { startCase } from 'lodash';
const PoolElement = ({ name, value }) => {
  return (
    <div className='poolstatsitem' key={name}>
      <div className='poolstatsitemlabel'>{startCase(name)}</div>
      <div className='poolstatsitemvalue'>{value}</div>
    </div>
  );
};

export default PoolElement;
