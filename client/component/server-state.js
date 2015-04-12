import React from 'react';
import Loader from 'react-loader';
import ServerAction from './server-action';

export default class ServerState extends React.Component {
	renderNoServer () {
		return (
			<div>
				<span>Server not started!</span>
				<ServerAction action={this.props.serverActions.start}>
					Start server
				</ServerAction>
			</div>
		);
	}
	renderServer () {
		return (
			<div>
				<span>Server started.</span>
				<ServerAction action={this.props.serverActions.stop}>
					Stop server
				</ServerAction>
			</div>
		);
	}
	render () {
		var actions = (this.props.server.status) ? this.renderServer() : this.renderNoServer();
		return (
			<div>
				<Loader loaded={this.props.loaded} />
				{this.props.loaded ? actions : null}
			</div>
		);
	}
}