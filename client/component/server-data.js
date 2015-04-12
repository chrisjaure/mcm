import React from 'react/addons';

function status (res) {
	if (res.status >= 200 && res.status < 300) {
		return res.json();
	}
	else {
		return res.json().then((data) => {
			return Promise.reject(new Error(data.error));
		});
	}
}

export default class ServerData extends React.Component {
	constructor(props) {
		super(props);
		this.state = { server: {}, loaded: false };
	}
	getServerStatus () {
		return fetch('/status').then(status).then((data) => {
			this.setState({ server: data, loaded: true });
			return data;
		});
	}
	startServer () {
		return fetch('/start', {method: 'post'}).then(status);
	}
	stopServer () {
		return fetch('/stop', {method: 'post'}).then(status);
	}
	componentDidMount () {
		this.getServerStatus();
	}
	renderChildren () {
	    return React.Children.map(this.props.children, (child) => {
			return React.addons.cloneWithProps(child, {
				server: this.state.server,
				serverActions: {
					getStatus: this.getServerStatus.bind(this),
					start: this.startServer.bind(this),
					stop: this.stopServer.bind(this)
				},
				loaded: this.state.loaded
			});
		});
	}
	render () {
		return <div>{this.renderChildren()}</div>;
	}
}