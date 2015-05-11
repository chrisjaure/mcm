import React from 'react';

export default class Loader extends React.Component {
	render () {
		var classNames = 'loader fade-in ' + (this.props.className || '');
		return (
			<div className={classNames} style={{ opacity: 0 }}>
				<div className="clock"></div>
			</div>
		);
	}
}