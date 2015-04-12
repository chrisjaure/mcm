import React from 'react';
import Loader from 'react-loader';

export default class ServerAction extends React.Component {
	constructor (props) {
		super(props);
		this.state = { loaded: true };
	}
	doAction () {
		this.setState({ loaded: false });
		this.props.action().then(() => {
			this.setState({ loaded: true });
		}).catch((err) => {
			this.setState({ loaded: true });
			alert(err);
		});
	}
	render () {
		return (
			<button onClick={this.doAction.bind(this)}>
				<Loader loaded={this.state.loaded} />
				{this.props.children}
			</button>
		);
	}
}