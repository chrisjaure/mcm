import React from 'react';
import Loader from 'react-loader';
import ServerAction from './server-action';

export default class ServerState extends React.Component {
	checkStatus (status) {
		return () => {
			return this.props.serverActions.getStatus().then((data) => {
				if (data.status !== status) {
					return Promise.reject(new Error('Server not started.'));
				}
				
				return data;
			});
		};
	}
	renderNoServer () {
		return (
			<div>
				<p>Server not started!</p>
				<ServerAction action={this.props.serverActions.start} checkStatus={this.checkStatus(1)}>
					Start server
				</ServerAction>
			</div>
		);
	}
	renderServer () {
		return (
			<div>
				<p>{this.props.server.server_name} started.</p>
				<p>{this.props.server.num_players} players joined.</p>
				<ServerAction action={this.props.serverActions.stop} checkStatus={this.checkStatus(0)}>
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
				{this.props.loaded ? actions : <span>Loading...</span>}
			</div>
		);
	}
}