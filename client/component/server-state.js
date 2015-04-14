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
				<div className="section inactive">
					<h2>Server not started!</h2>
				</div>
				<div className="section">
					<ServerAction action={this.props.serverActions.start} checkStatus={this.checkStatus(1)}>
						Start server
					</ServerAction>
				</div>
			</div>
		);
	}
	renderServer () {
		return (
			<div>
				<div className="section active">
					<h2>{this.props.server.server_name} started.</h2>
					<p>{this.props.server.num_players} players joined.</p>
				</div>
				<div className="section">
					<ServerAction action={this.props.serverActions.stop} checkStatus={this.checkStatus(0)}>
						Stop server
					</ServerAction>
				</div>
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