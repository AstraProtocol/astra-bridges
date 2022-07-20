import React from 'react';
import cz from 'classnames';

function Card({ as, className, children, ...props }) {
  const Tag = typeof as !== 'undefined' ? as : 'div';
  return (
    <Tag
      className={cz(
        'm-4 p-3 text-left border border-gray-200 round-4 w-1/3',
        className
      )}
      {...props}>
      {children}
    </Tag>
  );
}

Card.propTypes = {};

export default Card;
