import React from 'react';
import ServerState from './server-state';
import ServerData from './server-data';

export default class App extends React.Component {
	render () {
		return (
			<div>
				<h1>App!</h1>
				<ServerData>
					<ServerState />
				</ServerData>
			</div>
		);
	}
}