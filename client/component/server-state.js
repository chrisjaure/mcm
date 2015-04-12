import React from 'react';
import Loader from 'react-loader';

export default class ServerState extends React.Component {
	render () {
		var message = (this.props.server.status) ?
			'Server is running.' :
			'Server is not running.';
		return (
			<div>
				<Loader loaded={this.props.loaded} />
				<span>{message}</span>
			</div>
		);
	}
}