import React from 'react/addons';
import polyfill from 'whatwg-fetch';

export default class ServerData extends React.Component {
	constructor(props) {
		super(props);
		this.state = { server: {}, loaded: false };
	}
	componentDidMount () {
		fetch('/status').then((res) => {
			return res.json();
		}).then((data) => {
			this.setState({ server: data, loaded: true });
		}).catch(function(err) {
			console.log(err);
		});
	}
	renderChildren () {
	    return React.Children.map(this.props.children, (child) => {
			return React.addons.cloneWithProps(child, {
				server: this.state.server,
				loaded: this.state.loaded
			});
		});
	}
	render () {
		return <div>{this.renderChildren()}</div>;
	}
}