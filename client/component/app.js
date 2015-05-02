import React from 'react';
import ServerState from './server-state';
import ServerData from './server-data';

export default class App extends React.Component {
	render () {
		return (
			<div>
				<header className="app-header">
					<h1>Minecraft Monitor</h1>
				</header>
				<ServerData>
					<ServerState />
				</ServerData>
				<footer className="app-footer">
					<a href="https://github.com/chrisjaure/mcm">View Source</a>
				</footer>
			</div>
		);
	}
}